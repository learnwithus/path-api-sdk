# Usage Guide

## Better Auth Style API

Create a single instance and use it throughout your app:

```typescript
import { pathSDK } from "@vch-lt/path";

// Create the API instance once
export const path = pathSDK({
  courseId: "your-course-id",
  courseUrl: "https://localhost:5500",
});

// Use it anywhere in your app
const authStatus = await path.checkAuth();
const enrollment = await path.getEnrollmentAndProgress();
await path.submitProgress(1, true);
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

#### `path.submitProgress(milestoneId, value)`

Submit progress for a milestone.

```typescript
await path.submitProgress(1, true);
await path.submitProgress(2, "Completed");
await path.submitProgress(3, { score: 95 });
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
  SubmitProgressResponse,
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
