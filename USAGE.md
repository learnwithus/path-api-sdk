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
const user = await path.checkAuth();
const state = await path.getLearnerState();
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

Return the authenticated user, including read-only course attributes, or `null`.

```typescript
const user = await path.checkAuth();
if (user) {
  console.log("User:", user);
  console.log("Attributes:", user.attributes);
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

#### `path.getLearnerState()`

Get the complete learner state. When the learner is not logged in—or the request fails—it returns
the stable empty state `{ user: null, course: null, milestones: [], progress: [] }`.

```typescript
const state = await path.getLearnerState();
console.log("Course:", state.course?.title);
console.log("Progress:", state.progress);
console.log("Attributes:", state.user?.attributes);

// Check completeness via `.complete`, not `.value`:
const done = state.progress.filter((p) => p.complete).length;
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

Get the learner's stored values, keyed by field **key** (not slug — slug identifies a milestone).
Values only: your course site configured these fields with staff, so it already knows the labels and
types.

```typescript
const store = await path.getLearnerStore();

store.notes; // "ask about the pre-op class"
store.bookmarks; // [{ title: "Nutrition guide", url: "https://…" }]
```

A field the learner has never written comes back with the default staff configured for it, so every
field the course defines has an entry.

Key order matches the order staff configured. The exception is an all-digit field key, which
JavaScript hoists to the front of an object.

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
  AuthenticatedUser,
  LearnerState,
  LearnerAttributes,
  LearnerAttributeValue,
  Progress,
  User,
  Course,
  SubmitProgressInput,
  SubmitProgressPayload,
  MilestoneType,
  MilestoneValue,
  // Learner store
  LearnerStore,
  LearnerStoreScalarValue,
  LearnerStoreObjectValue,
  LearnerStoreValue,
} from "@vch-lt/path";
```

`LearnerStore` is `Record<string, LearnerStoreValue>` — the same type a read returns and a write
accepts, so values round-trip.

`LearnerStoreValue` is a union covering every field shape: a scalar, one object, or a list of
objects. The API doesn't tell you which applies, so narrow using what you know about the field:

```typescript
const bookmarks = store.bookmarks as LearnerStoreObjectValue[];
bookmarks.forEach((item) => console.log(item.title));
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
import type { AuthenticatedUser } from "@vch-lt/path";

export function useAuth() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    path.checkAuth().then(setUser);
  }, []);

  return user;
}
```
