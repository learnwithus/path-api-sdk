# @vch-lt/path

TypeScript SDK for integrating custom course websites with the Path LMS (VCH).

Handles authentication, enrollment data, and progress tracking. Works client-side (any framework) and server-side (Next.js App Router, Nuxt, Express, etc.).

---

## How it works

Authentication uses a **bearer token** stored in a cookie on your course domain:

1. Your course page calls `path.login()` → user is redirected to the Path login page
2. After login, Path redirects back to your course page with `?token=...` in the URL
3. The SDK automatically reads the token, stores it in a cookie, and cleans the URL
4. All subsequent API calls include the token as an `Authorization: Bearer` header
5. Your server-side code reads the same cookie to make authenticated requests

---

## Installation

```bash
npm install @vch-lt/path
```

---

## Client-side usage

Works in any browser environment — vanilla JS, Vue, React, Svelte, etc.

```ts
import pathSDK from '@vch-lt/path';

const path = pathSDK({
  courseId: 'your-course-id',
  courseUrl: 'https://your-course-site.com',
  // pathUrl: 'https://path.vchlearn.ca', // optional, this is the default
});
```

### Initialize on page load

Import the SDK as early as possible (e.g., in your app entry point). On load it automatically reads `?token=` from the URL, stores it in a cookie, and removes it from the URL bar.

```ts
import '@vch-lt/path'; // side-effect import handles token initialization
// or
import pathSDK from '@vch-lt/path';
const path = pathSDK({ courseId: '...', courseUrl: '...' });
```

### Check authentication

```ts
const auth = await path.checkAuth();

if (!auth.isAuthenticated) {
  // Pass the current URL so the user returns to the right page after login
  path.login(window.location.href);
  return;
}

console.log(auth.enrollment?.user.email);
console.log(auth.enrollment?.progress);
```

### Submit progress

```ts
await path.submitProgress('module-1-complete', true);
await path.submitProgress('quiz-score', 85);
await path.submitProgress('chapter', 'introduction');
```

### Get enrollment and progress

```ts
const enrollment = await path.getEnrollmentAndProgress();
console.log(enrollment.progress);
```

### Logout

```ts
await path.logout();
```

---

## Next.js App Router (Server Components)

Use `@vch-lt/path/next` in Server Components, Route Handlers, and Server Actions. It automatically reads the bearer token from the Next.js cookie store — no token passing required.

```ts
import { pathNextSDK } from '@vch-lt/path/next';
```

### Server Component

```tsx
// app/course/page.tsx
import { pathNextSDK } from '@vch-lt/path/next';
import { redirect } from 'next/navigation';

export default async function CoursePage() {
  const path = await pathNextSDK({ courseId: 'your-course-id' });
  const auth = await path.checkAuth();

  if (!auth.isAuthenticated) {
    redirect('/login');
  }

  const enrollment = auth.enrollment!;

  return (
    <div>
      <h1>Welcome, {enrollment.user.email}</h1>
      <p>Progress: {enrollment.progress?.length ?? 0} milestones completed</p>
    </div>
  );
}
```

### Route Handler

```ts
// app/api/progress/route.ts
import { pathNextSDK } from '@vch-lt/path/next';
import { NextResponse } from 'next/server';

export async function GET() {
  const path = await pathNextSDK({ courseId: 'your-course-id' });
  const enrollment = await path.getEnrollmentAndProgress();
  return NextResponse.json(enrollment);
}
```

### Server Action

```ts
// app/actions.ts
'use server';
import { pathNextSDK } from '@vch-lt/path/next';

export async function completeModule(milestoneSlug: string) {
  const path = await pathNextSDK({ courseId: 'your-course-id' });
  return path.submitProgress(milestoneSlug, true);
}
```

> **Note:** `pathNextSDK` is server-only. For client-side interactions (login redirect, logout), use the regular `pathSDK` in a Client Component.

---

## Generic server-side usage

Use `@vch-lt/path/server` for Nuxt server routes, Express, or any other server framework. You read the token from your framework's cookie store and pass it in.

```ts
import { pathServerSDK, TOKEN_STORAGE_KEY } from '@vch-lt/path/server';
```

### Nuxt server route

```ts
// server/api/progress.get.ts
import { pathServerSDK, TOKEN_STORAGE_KEY } from '@vch-lt/path/server';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, TOKEN_STORAGE_KEY) ?? null;
  const path = pathServerSDK({ courseId: 'your-course-id', token });
  return path.getEnrollmentAndProgress();
});
```

### Nuxt composable (SSR + client)

```ts
// composables/usePath.ts
import { TOKEN_STORAGE_KEY } from '@vch-lt/path/server';

export function usePath() {
  const tokenCookie = useCookie(TOKEN_STORAGE_KEY);

  const checkAuth = async () => {
    const { data } = await useFetch('/api/learner', {
      headers: tokenCookie.value
        ? { Authorization: `Bearer ${tokenCookie.value}` }
        : {},
    });
    return data.value;
  };

  return { checkAuth };
}
```

### Express

```ts
import { pathServerSDK, TOKEN_STORAGE_KEY } from '@vch-lt/path/server';
import cookieParser from 'cookie-parser';

app.use(cookieParser());

app.get('/progress', async (req, res) => {
  const token = req.cookies[TOKEN_STORAGE_KEY] ?? null;
  const path = pathServerSDK({ courseId: 'your-course-id', token });
  res.json(await path.getEnrollmentAndProgress());
});
```

---

## API Reference

### `pathSDK(config)` — client-side

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `courseId` | `string` | Yes | Your course ID from Path |
| `courseUrl` | `string` | Yes | Your course website URL |
| `pathUrl` | `string` | No | Path backend URL (default: `https://path.vchlearn.ca`) |

Returns an SDK instance with:

| Method | Description |
|--------|-------------|
| `checkAuth()` | Returns `{ isAuthenticated, enrollment? }` |
| `login(callbackUrl?)` | Redirects to Path login. Pass `window.location.href` to return to current page |
| `logout()` | Clears token and calls logout API |
| `getEnrollmentAndProgress()` | Returns full enrollment + progress data |
| `submitProgress(milestoneSlug, value)` | Records progress for a milestone |

### `pathNextSDK(config)` — Next.js server-side

Same config as `pathSDK` minus `courseUrl`. Returns a Promise of a server SDK instance with `checkAuth()`, `getEnrollmentAndProgress()`, and `submitProgress()`.

### `pathServerSDK(options)` — generic server-side

Same config as `pathNextSDK` plus `token: string | null`. Synchronous — returns the SDK instance directly.

---

## Cookie details

The bearer token is stored in a cookie named `path_bearer_token` on your course domain with `SameSite=Lax; Secure`. This means:

- It is readable by your course server (for SSR)
- It is **not** sent cross-origin (Path's server never receives it as a cookie — only as a `Bearer` header)
- It survives page reloads and navigation within your course site
- It is cleared when the user logs out
