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
} from "@vch-lt/path";
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
