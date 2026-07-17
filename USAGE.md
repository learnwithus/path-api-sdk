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
await path.submitProgress("module-1-complete", true);
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
```

#### `path.submitProgress(milestoneSlug, value | { data, complete } | { complete })`

Submit progress for a milestone, identified by its slug. Pass a bare value to record it and mark the
milestone complete, or a `{ data, complete }` payload to set completeness independently of the value.
When `complete` is omitted, any submitted value is treated as complete.

```typescript
await path.submitProgress("module-1-complete", true);
await path.submitProgress("quiz-score", 95);

// Record a value but control completeness explicitly.
await path.submitProgress("module-1-checkbox", { data: false, complete: true });
await path.submitProgress("reflection", { data: "draft", complete: false });

// A data-less "completion" milestone carries no value.
await path.submitProgress("attended-orientation");
await path.submitProgress("attended-orientation", { complete: false });
```

Data-bearing milestones require type-valid data even when marked incomplete. Only a milestone whose
type is `completion` accepts an omitted value; its returned `Progress.value` is `null`.

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
