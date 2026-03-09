# @vch-lt/path

TypeScript SDK for integrating custom course websites with the Path LMS (VCH).

Handles authentication, enrollment data, and progress tracking. Works client-side (any framework) and server-side (Next.js App Router, Nuxt, Express, etc.).

---

## How it works

Authentication uses a **bearer token** stored in a cookie on your course domain:

1. Your course page calls `path.login()` → user is redirected to the Path login page
2. After login, Path redirects back to your course page with `?path-token=...` in the URL
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
import pathSDK from "@vch-lt/path";

const path = pathSDK({
  courseId: "your-course-id",
  courseUrl: "https://your-course-site.com",
  // pathUrl: 'https://path.vchlearn.ca', // optional, this is the default
});
```

### Initialize on page load

Create the SDK instance as early as possible (e.g., in your app entry point). On first instantiation it automatically reads `?path-token=` from the URL, stores it in a cookie, and removes it from the URL bar.

```ts
import pathSDK from "@vch-lt/path";
const path = pathSDK({ courseId: "...", courseUrl: "..." });
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
await path.submitProgress("module-1-complete", true);
await path.submitProgress("quiz-score", 85);
await path.submitProgress("chapter", "introduction");
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

### Setup

Set your course ID in the environment so you never have to pass it explicitly. Use `NEXT_PUBLIC_PATH_COURSE_ID` so it's available on both the server and in Client Components:

```bash
# .env.local
NEXT_PUBLIC_PATH_COURSE_ID=your-course-id
```

### Middleware (required for SSR auth on first login)

Without middleware, the bearer token arrives as `?path-token=` in the URL on redirect from Path login. The cookie isn't set until client-side JS runs, so the **first SSR render would see an unauthenticated request**.

The pre-built middleware fixes this with no extra redirect — it reads `?path-token=`, sets the cookie, and forwards the token to SSR all in one request.

```ts
// middleware.ts
export { pathMiddleware as default, pathMiddlewareConfig as config } from "@vch-lt/path/next";
```

If you already have middleware, compose them:

```ts
// middleware.ts
import { createPathMiddleware } from "@vch-lt/path/next";
import type { NextRequest } from "next/server";

const handlePath = createPathMiddleware();

export function middleware(request: NextRequest) {
  const pathResponse = handlePath(request);
  if (pathResponse) return pathResponse;
  // ... your own middleware logic
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Server Component

```tsx
// app/course/page.tsx
import { pathServerSDK } from "@vch-lt/path/next";
import { redirect } from "next/navigation";

export default async function CoursePage() {
  const path = await pathServerSDK(); // courseId read from PATH_COURSE_ID env var
  const auth = await path.checkAuth();

  if (!auth.isAuthenticated) {
    redirect("/login");
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

You can also pass `courseId` explicitly if you prefer:

```tsx
const path = await pathServerSDK({ courseId: "your-course-id" });
```

### Route Handler

```ts
// app/api/progress/route.ts
import { pathServerSDK } from "@vch-lt/path/next";
import { NextResponse } from "next/server";

export async function GET() {
  const path = await pathServerSDK();
  const enrollment = await path.getEnrollmentAndProgress();
  return NextResponse.json(enrollment);
}
```

### Server Action

```ts
// app/actions.ts
"use server";
import { pathServerSDK } from "@vch-lt/path/next";

export async function completeModule(milestoneSlug: string) {
  const path = await pathServerSDK();
  return path.submitProgress(milestoneSlug, true);
}
```

> **Note:** `pathServerSDK` is server-only. For client-side interactions (login redirect, logout), use `pathClientSDK` (also exported from `@vch-lt/path/next`) in a Client Component.

---

## Nuxt Module (recommended for Nuxt apps)

Use `@vch-lt/path/nuxt` for zero-config Nuxt integration. The module:

- Auto-registers the path-token middleware (SSR auth on first login, no extra redirect)
- Auto-imports `usePath()` — a universal composable that works on server and client transparently
- Auto-imports `pathNuxtSDK` for lower-level use in server routes
- Adds a client plugin that initializes the token from the URL on login redirect

### Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@vch-lt/path/nuxt"],
  path: {
    courseId: "your-course-id",
    // pathUrl: 'https://path.vchlearn.ca', // optional, this is the default
  },
});
```

### Pages and components

`usePath()` is auto-imported. Data-fetching methods use `useAsyncData` internally so they fetch on the server during SSR and reuse that result on the client — no double-fetch, no extra server route needed:

```vue
<!-- pages/course.vue -->
<script setup lang="ts">
const path = usePath();

// checkAuth() and getEnrollmentAndProgress() work on server and client
const { data: auth } = await path.checkAuth();

if (!auth.value?.isAuthenticated) {
  path.login(window.location.href);
}
</script>
```

```vue
<!-- components/ProgressButton.vue -->
<script setup lang="ts">
const path = usePath();

const complete = async () => {
  await path.submitProgress("module-1", true);
};
</script>
```

### `usePath()` methods

| Method                        | Returns                 | Description                                     |
| ----------------------------- | ----------------------- | ----------------------------------------------- |
| `checkAuth()`                 | `AsyncData<AuthStatus>` | Auth status + enrollment. SSR-safe.             |
| `getEnrollmentAndProgress()`  | `AsyncData<Enrollment>` | Full enrollment data. SSR-safe.                 |
| `submitProgress(slug, value)` | `Promise`               | Record a milestone. Works on server and client. |
| `login(callbackUrl?)`         | `void`                  | Redirect to Path login. Client-only.            |
| `logout()`                    | `Promise`               | Clear session and log out. Client-only.         |

### Server routes (advanced)

`pathNuxtSDK` is also auto-imported for cases where you need a server route:

```ts
// server/api/something.get.ts
export default defineEventHandler(async (event) => {
  const path = await pathNuxtSDK(event);
  return path.getEnrollmentAndProgress();
});
```

### Low-level Nuxt/H3 usage (without the module)

If you need more control, use `@vch-lt/path/nuxt` directly:

```ts
import { pathNuxtSDK, createPathH3Middleware } from "@vch-lt/path/nuxt";
```

---

## Generic server-side usage

Use `@vch-lt/path/server` for Express or any other server framework. You read the token from your framework's cookie store and pass it in.

```ts
import { pathServerSDK, TOKEN_STORAGE_KEY } from "@vch-lt/path/server";
```

### Express

```ts
import { pathServerSDK, TOKEN_STORAGE_KEY } from "@vch-lt/path/server";
import cookieParser from "cookie-parser";

app.use(cookieParser());

app.get("/progress", async (req, res) => {
  const token = req.cookies[TOKEN_STORAGE_KEY] ?? null;
  const path = pathServerSDK({ courseId: "your-course-id", token });
  res.json(await path.getEnrollmentAndProgress());
});
```

---

## API Reference

### `pathSDK(config)` — client-side

| Option      | Type     | Required | Description                                                                                                              |
| ----------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `courseId`  | `string` | No       | Your course ID from Path (falls back to `VITE_PATH_COURSE_ID` / `NEXT_PUBLIC_PATH_COURSE_ID` / `PATH_COURSE_ID` env var) |
| `courseUrl` | `string` | Yes      | Your course website URL                                                                                                  |
| `pathUrl`   | `string` | No       | Path backend URL (default: `https://path.vchlearn.ca`)                                                                   |

Returns an SDK instance with:

| Method                                 | Description                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `checkAuth()`                          | Returns `{ isAuthenticated, enrollment? }`                                     |
| `login(callbackUrl?)`                  | Redirects to Path login. Pass `window.location.href` to return to current page |
| `logout()`                             | Clears token and calls logout API                                              |
| `getEnrollmentAndProgress()`           | Returns full enrollment + progress data                                        |
| `submitProgress(milestoneSlug, value)` | Records progress for a milestone                                               |

### `pathServerSDK(config?)` — Next.js server-side

Import from `@vch-lt/path/next`. Optional config: `courseId` (falls back to `NEXT_PUBLIC_PATH_COURSE_ID` env var) and `pathUrl`. Returns a Promise of a server SDK instance with `checkAuth()`, `getEnrollmentAndProgress()`, and `submitProgress()`.

### `pathClientSDK(config)` — Next.js client-side

Import from `@vch-lt/path/next`. Same as the default `pathSDK` export from `@vch-lt/path`, re-exported for convenience. Use in Client Components for login, logout, and client-side data fetching.

### `pathNuxtSDK(event, config)` — Nuxt/H3 server-side

Import from `@vch-lt/path/nuxt`. Takes an H3 event and optional config (`courseId`, `pathUrl`). Returns a Promise of a server SDK instance. When using the Nuxt module, `pathNuxtSDK(event)` is auto-imported with `courseId` pre-configured.

### `usePath()` — Nuxt universal composable (Nuxt module only)

Auto-imported. Works in pages, components, and layouts on both server and client. Data-fetching methods (`checkAuth`, `getEnrollmentAndProgress`) return `AsyncData` (Nuxt's `useAsyncData` result) — SSR-safe with no double-fetch. Action methods (`login`, `logout`, `submitProgress`) return Promises.

### `pathServerSDK(options)` — generic server-side

Import from `@vch-lt/path/server`. Takes `courseId`, `pathUrl`, and `token: string | null`. Synchronous — returns the SDK instance directly.

---

## Cookie details

The bearer token is stored in a cookie named `path_bearer_token` on your course domain with `SameSite=Lax; Secure`. This means:

- It is readable by your course server (for SSR)
- It is **not** sent cross-origin (Path's server never receives it as a cookie — only as a `Bearer` header)
- It survives page reloads and navigation within your course site
- It is cleared when the user logs out
