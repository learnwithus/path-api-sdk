# Usage Guide

## Better Auth Style API

Create a single instance and use it throughout your app:

```typescript
import { pathAPI } from 'learner-api-sdk';

// Create the API instance once
export const path = pathAPI({
  courseId: 1,
  callbackUrl: 'http://localhost:5500'
});

// Use it anywhere in your app
const authStatus = await path.checkAuth();
const enrollment = await path.getEnrollmentAndProgress();
await path.submitProgress(1, true);

// Utilities are also available
const value = path.parseValue('{"key": "value"}');
```

### Benefits

- ✅ **Clean API** - Simple factory function
- ✅ **Tree-shakeable** - Only import what you need
- ✅ **Immutable** - Configuration is set once
- ✅ **Typesafe** - Full TypeScript support

## API Reference

### pathAPI Configuration

```typescript
const path = pathAPI({
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

### Utilities

#### `path.parseValue(input: string)`
Parse JSON values from strings.

```typescript
const bool = path.parseValue('true');        // boolean
const num = path.parseValue('42');           // number
const arr = path.parseValue('["a","b"]');    // array
const obj = path.parseValue('{"key":"val"}'); // object
const str = path.parseValue('plain text');   // string (fallback)
```

#### `path.getCourseId()`
Get the current course ID.

```typescript
const courseId = path.getCourseId();
```

#### `path.getBaseUrl()`
Get the configured base URL.

```typescript
const baseUrl = path.getBaseUrl();
```

## TypeScript Types

All types are exported:

```typescript
import type {
  PathAPIInstance,
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
import { pathAPI } from 'learner-api-sdk';

export const path = pathAPI({
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
  import { pathAPI } from './learner-api-sdk/dist/index.js';

  const path = pathAPI({
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
    const milestoneId = document.querySelector('#milestone').value;
    const value = path.parseValue(document.querySelector('#value').value);

    await path.submitProgress(milestoneId, value);
    alert('Progress submitted!');
  };
</script>
```
