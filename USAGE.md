# Usage Guide

## Better Auth Style API

Create a single instance and use it throughout your app:

```typescript
import { pathSDK } from "@vch-lt/path";

// Create the API instance once
export const path = pathSDK({
  courseId: "your-course-id",
  courseUrl: "http://localhost:5500",
});

// Use it anywhere in your app
const authStatus = await path.checkAuth();
const enrollment = await path.getEnrollmentAndProgress();
await path.submitProgress("module-1-complete");
```

### Benefits

- ✅ **Clean API** - Simple factory function
- ✅ **Tree-shakeable** - Only import what you need
- ✅ **Immutable** - Configuration is set once
- ✅ **Typesafe** - Full TypeScript support

## API Reference

### pathSDK Configuration

```typescript
const path = pathSDK({
  courseId: string,            // Required: The course ID
  pathUrl?: string,            // Optional: Path backend URL (default: https://path.vchlearn.ca)
  courseUrl: string            // Required: Your course website URL for login redirects
});
```

### Methods

#### `path.checkAuth()`

Check if user is authenticated.

```typescript
const authStatus = await path.checkAuth();
if (authStatus.isAuthenticated) {
  console.log("User:", authStatus.enrollment.user);
}
```

#### `path.login(callbackUrl?: string)`

Redirect to login page.

```typescript
path.login();
// or with custom callback
path.login("https://example.com/callback");
```

#### `path.logout()`

Logout the current user.

```typescript
await path.logout();
```

#### `path.getEnrollmentAndProgress()`

Get enrollment and progress data.

```typescript
const enrollment = await path.getEnrollmentAndProgress();
console.log("Course:", enrollment.course.title);
console.log("Progress:", enrollment.progress);

// Check completeness via `.complete`, not `.value`:
const done = enrollment.progress.filter((p) => p.complete).length;
```

Each `Progress` record carries a `complete` boolean — use it to tell whether a milestone is done. A
stored `value` does not imply completeness (a value can be saved on an incomplete submission), and a
`completion` milestone is complete while its `value` is `null`.

#### `path.submitProgress(milestoneSlug, value | { data, complete } | { complete })`

Submit progress for a milestone, identified by its slug. For a `completion` milestone, omit the
second argument (or pass `true`) to mark it complete, and pass `false` to mark it incomplete. For
every other milestone type, a bare second argument is data and marks the milestone complete. Use a
`{ data, complete }` payload to set completeness independently of data.

```typescript
// Completion milestone — just pass the slug to mark it complete.
await path.submitProgress("module-1-complete");

// For a completion milestone only, a boolean second argument sets completeness.
await path.submitProgress("module-1-complete", false);

// Attach a value (also marks it complete).
await path.submitProgress("quiz-score", 95);

// Record a value but control completeness explicitly.
await path.submitProgress("module-1-checkbox", { data: false, complete: true });
await path.submitProgress("reflection", { data: "draft", complete: false });

// The object form also works for a completion milestone.
await path.submitProgress("attended-orientation", { complete: false });
```

Data-bearing milestones require type-valid data even when marked incomplete. Only a milestone whose
type is `completion` accepts an omitted value or interprets a bare boolean as completeness; its
returned `Progress.value` is `null`.

Deploy the matching Path API change before relying on the completion boolean shorthand. Against an
older backend, use `{ complete: false }` to mark a completion milestone incomplete.

Returns the created `Progress` record (including its stored `value` and `complete` flag).

#### `path.getLearnerStore()`

Get the learner's learner store: every field the course defined, keyed by field **key** (not slug — slug
identifies a milestone). Each entry carries the field definition and the learner's current value, or
the field's default if they have never written one.

```typescript
const learnerStore = await path.getLearnerStore();

learnerStore.notes.value; // "ask about the pre-op class"
learnerStore.notes.label; // "My notes"
learnerStore.bookmarks.fieldType; // "repeatable"
learnerStore.bookmarks.fields; // sub-field definitions
```

Key order matches the order staff configured. The exception is an all-digit field key, which
JavaScript hoists to the front of an object.

`updatedAt` is when the value was last written, or `null` if never. `updatedByName` is always `null`
on the learner API — Path hides the writer's name when a learner reads their own record.

#### `path.updateLearnerStore(values)`

Write learner store values. Only the keys you pass are changed; the rest of the learner store is untouched, so
you can save a single field without sending everything back.

```typescript
// scalar
await path.updateLearnerStore({ notes: "ask about the pre-op class" });

// several at once
await path.updateLearnerStore({ notes: "…", "favourite-number": 7 });

// object — supply the sub-fields you want set
await path.updateLearnerStore({ reminder: { text: "Book follow-up", due: "2026-08-01" } });

// repeatable — the array you send replaces the whole list
await path.updateLearnerStore({ bookmarks: [{ title: "Nutrition guide", url: "https://…" }] });
```

Returns the stored values, keyed the same way. Path normalizes what it writes, so prefer the
returned values over the ones you sent:

```typescript
const stored = await path.updateLearnerStore({ "favourite-number": "7" });
stored["favourite-number"]; // 7 — a number
```

## TypeScript Types

All types are exported:

```typescript
import type {
  PathSDKInstance,
  Enrollment,
  Progress,
  User,
  Course,
  AuthStatus,
  SubmitProgressInput,
  SubmitProgressPayload,
  MilestoneType,
  MilestoneValue,
  // LearnerStore
  LearnerStore,
  LearnerStoreField,
  LearnerStoreSubField,
  LearnerStoreFieldType,
  LearnerStoreScalarType,
  LearnerStoreScalarValue,
  LearnerStoreObjectValue,
  LearnerStoreValue,
  LearnerStoreUpdate,
} from "@vch-lt/path";
```

`LearnerStoreValue` is a union covering every field shape — a scalar, one object, or a list of objects.
Narrow it with the field's `fieldType`:

```typescript
const field = learnerStore.bookmarks;

if (field.fieldType === "repeatable") {
  const items = field.value as LearnerStoreObjectValue[];
  items.forEach((item) => console.log(item.title));
}
```

## Examples

### React Example

```tsx
// api/path.ts
import { pathSDK } from "@vch-lt/path";

export const path = pathSDK({
  courseId: process.env.COURSE_ID,
  courseUrl: window.location.origin,
});

// components/LoginButton.tsx
import { path } from "../api/path";

export function LoginButton() {
  return <button onClick={() => path.login()}>Login</button>;
}

// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { path } from "../api/path";
import type { AuthStatus } from "@vch-lt/path";

export function useAuth() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);

  useEffect(() => {
    path.checkAuth().then(setAuth);
  }, []);

  return auth;
}
```
