# Usage Guide

## Better Auth Style API

Create a single instance and use it throughout your app:

```typescript
import { pathSDK } from 'learner-api-sdk';

// Create the API instance once
export const path = pathSDK({
  courseId: 1,
  callbackUrl: 'http://localhost:5500'
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
  courseId: number,           // Required: The course ID
  baseUrl?: string,           // Optional: API base URL (default: http://localhost:3000)
  callbackUrl?: string        // Optional: Login redirect URL (default: current page)
});
```

### Methods

#### `path.checkAuth()`
Check if user is authenticated.

```typescript
const authStatus = await path.checkAuth();
if (authStatus.isAuthenticated) {
  console.log('User:', authStatus.enrollment.user);
}
```

#### `path.login(callbackUrl?: string)`
Redirect to login page.

```typescript
path.login();
// or with custom callback
path.login('https://example.com/callback');
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
console.log('Course:', enrollment.course.title);
console.log('Progress:', enrollment.progress);
```

#### `path.submitProgress(milestoneId, value)`
Submit progress for a milestone.

```typescript
await path.submitProgress(1, true);
await path.submitProgress(2, 'Completed');
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
  MilestoneValue
} from 'learner-api-sdk';
```

## Examples

### React Example

```tsx
// api/path.ts
import { pathSDK } from 'learner-api-sdk';

export const path = pathSDK({
  courseId: parseInt(process.env.COURSE_ID),
  callbackUrl: window.location.origin
});

// components/LoginButton.tsx
import { path } from '../api/path';

export function LoginButton() {
  return <button onClick={() => path.login()}>Login</button>;
}

// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { path } from '../api/path';
import type { AuthStatus } from 'learner-api-sdk';

export function useAuth() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);

  useEffect(() => {
    path.checkAuth().then(setAuth);
  }, []);

  return auth;
}
```

### Vanilla JavaScript Example

```html
<script type="module">
  import { pathSDK } from './learner-api-sdk/dist/index.js';

  const path = pathSDK({
    courseId: 1,
    callbackUrl: window.location.href
  });

  // Check auth on page load
  const authStatus = await path.checkAuth();
  if (authStatus.isAuthenticated) {
    console.log('Logged in as:', authStatus.enrollment.user.email);
  }

  // Login button
  document.querySelector('#login-btn').onclick = () => {
    path.login();
  };

  // Submit progress
  document.querySelector('#submit-btn').onclick = async () => {
    const milestoneId = parseInt(document.querySelector('#milestone').value);
    const valueInput = document.querySelector('#value').value;

    // Try to parse as JSON, fallback to string
    let value;
    try {
      value = JSON.parse(valueInput);
    } catch {
      value = valueInput;
    }

    await path.submitProgress(milestoneId, value);
    alert('Progress submitted!');
  };
</script>
```
