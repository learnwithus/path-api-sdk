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

For a `completion` milestone — the most common case — just pass the slug. That marks it complete:

```ts
await path.submitProgress("module-1-complete");
```

Pass a boolean second argument to set a `completion` milestone's completion state directly:

```ts
await path.submitProgress("module-1-complete", true);  // complete
await path.submitProgress("module-1-complete", false); // incomplete
```

To attach data, pass a bare value. That records it and marks the milestone complete:

```ts
await path.submitProgress("quiz-score", 85);
await path.submitProgress("chapter", "introduction");
```

For every data-bearing milestone type, the second argument is always data. To control completeness
independently of that data, pass a `{ data, complete }` payload. When `complete` is omitted, a
submitted data value is treated as complete (so `false` still completes a `boolean` milestone):

```ts
// Record the value `false` but mark the milestone complete anyway.
await path.submitProgress("module-1-checkbox", { data: false, complete: true });

// Save a draft without completing the milestone.
await path.submitProgress("reflection", { data: "draft", complete: false });

// The object form also works for a completion milestone.
await path.submitProgress("attended-orientation", { complete: false });
```

Data-bearing milestone types always require a type-valid value, even when `complete` is `false`.
The data-less `completion` type is the only type that interprets a bare boolean as completeness
instead of data. In progress responses its `value` is `null`, while the submission state remains
available as `complete`.

If an administrator changes a milestone's type after progress was submitted, the API coerces the
stored value to the current type when it is read so it remains displayable and editable.

Deploy the compatible Path API before upgrading to SDK `0.4.0`; older API versions discard the
unknown `complete` request field.

The boolean shorthand for `completion` milestones also requires a Path API version that supports
it. Until that backend change is deployed, use `{ complete: false }` to mark one incomplete.

### Get enrollment and progress

```ts
const enrollment = await path.getEnrollmentAndProgress();
console.log(enrollment.progress);
```

Each `progress` record exposes completeness on its `complete` boolean — read that to tell whether a
milestone is done. Don't infer completeness from `value`: a saved value can belong to an incomplete
submission, and a `completion` milestone is complete with a `null` value.

### Logout

```ts
await path.logout();
```

---

## Next.js App Router

Everything imports from `@vch-lt/path/next` — server SDK, middleware, `PathProvider`, and `usePath()` all come from the same import path. The package uses a barrel that re-exports from separate server and client modules, so the Next.js bundler automatically handles the `"use client"` boundary.

### Setup

There are two ways to provide your course ID. Which one you use depends on your deployment model.

#### Option A — explicit props (recommended for Docker / CI)

Pass `courseId` and `courseUrl` directly as props to `PathProvider` from a Server Component, reading them from non-prefixed env vars:

```tsx
// app/layout.tsx
import { PathProvider } from "@vch-lt/path/next";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PathProvider
          courseId={process.env.PATH_COURSE_ID}
          courseUrl={process.env.PATH_COURSE_URL}
        >
          {children}
        </PathProvider>
      </body>
    </html>
  );
}
```

```bash
# .env.local / docker-compose env
PATH_COURSE_ID=your-course-id
PATH_COURSE_URL=https://your-course-site.com
```

This works because `PathProvider` is a Server Component that runs on every request and reads the real environment at runtime. It serializes `courseId` into the `config` prop it passes to the client — so the client SDK receives it without ever needing `process.env` in the browser. No `NEXT_PUBLIC_` prefix needed.

> **Why this matters in Docker**: `NEXT_PUBLIC_*` vars are baked into the JS bundle at `next build`. If the value isn't present when the image is built, it compiles to `undefined` and no amount of runtime env configuration can change it. Non-prefixed vars are never touched by the compiler, so they remain readable from `process.env` at request time on your server.

#### Option B — `NEXT_PUBLIC_*` env vars (fine for static / single-environment deploys)

```bash
# .env.local
NEXT_PUBLIC_PATH_COURSE_ID=your-course-id
NEXT_PUBLIC_PATH_COURSE_URL=https://your-course-site.com
```

`PathProvider` will pick these up automatically with no props needed. This is appropriate when your course ID is a build-time constant — the same value across all environments and never injected at deploy time. If your CI build args include these values and they never change between environments, the bake-in behaviour is harmless.

If you're not sure which applies to you: use Option A. It works in both cases.

### Middleware (required for SSR auth on first login)

Without middleware, the bearer token arrives as `?path-token=` in the URL on redirect from Path login. The cookie isn't set until client-side JS runs, so the **first SSR render would see an unauthenticated request**.

The pre-built middleware fixes this by reading `?path-token=`, setting the cookie on a redirect response, and cleaning the token from the URL bar. The browser follows the redirect to the clean URL with the cookie already set, so the SSR render sees an authenticated request.

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

### PathProvider (recommended: place in your layout)

Add `PathProvider` to your root layout (see [Setup](#setup) above for the full layout example). It automatically fetches auth on the server and hydrates the client with reactive state. Then `usePath()` works in any nested client component.

> **Required:** Your layout must export `export const dynamic = 'force-dynamic'`. Next.js intentionally disables `cookies()` in statically rendered routes — the cookie store will always appear empty and `checkAuth()` will always return `isAuthenticated: false` without this.

Now any client component can use `usePath()`:

```tsx
// app/components/progress-button.tsx
"use client";
import { usePath } from "@vch-lt/path/next";

export function ProgressButton() {
  const { auth, submitProgress } = usePath();
  const progress = auth.enrollment?.progress ?? [];

  // Completeness lives on `.complete` — count that, not the number of records.
  // A record can exist (a value was saved) while still being incomplete.
  const completedCount = progress.filter((p) => p.complete).length;

  return (
    <div>
      <p>{completedCount} milestones completed</p>
      <button onClick={() => submitProgress("module-1", true)}>
        Complete Module 1
      </button>
    </div>
  );
}
```

When `submitProgress()` succeeds, the progress array updates reactively — every component using `usePath()` re-renders with the new data.

**Props:**

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `pathUrl` | `string` | `https://path.vchlearn.ca` | Path backend URL |
| `courseId` | `string` | `NEXT_PUBLIC_PATH_COURSE_ID` env var | Your course ID. Prefer passing explicitly in Docker — see [Setup](#setup) |
| `courseUrl` | `string` | `NEXT_PUBLIC_PATH_COURSE_URL` env var | Your course URL. Prefer passing explicitly in Docker — see [Setup](#setup) |
| `initialAuth` | `boolean` | `true` | Set to `false` to skip server-side fetch — the client fetches on mount instead |

### `usePath()` return value

| Field | Type | Description |
| --- | --- | --- |
| `auth` | `AuthStatus` | Reactive auth state (updates after `submitProgress` / `logout` / `refreshAuth`) |
| `isLoading` | `boolean` | `true` while the initial fetch is in-flight (only when no `initialAuth`) |
| `getProgress(slug)` | `Progress \| undefined` | Look up a progress record by milestone slug |
| `submitProgress(slug, value \| { data, complete } \| { complete })` | `Promise<Progress>` | Submit progress; a completion boolean sets state, otherwise a bare value is data |
| `login(callbackUrl?)` | `void` | Redirect to Path login |
| `logout()` | `Promise<void>` | Log out and clear state |
| `refreshAuth()` | `Promise<void>` | Re-fetch auth from the server |

`getProgress` cross-references the `milestones` array (slug → id) with the `progress` array, so you can look up progress by slug:

```tsx
const { getProgress, submitProgress } = usePath();

const module1 = getProgress("module-1");

// Check completeness with `.complete` — never infer it from `.value`.
console.log(module1?.complete); // true | false
// `.value` is the stored data (and is always `null` for a `completion` milestone).
console.log(module1?.value);

// After submitting, getProgress returns the updated record on the next render
await submitProgress("module-1", true);
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
| `submitProgress(slug, value \| { data, complete } \| { complete })` | `Promise`               | Record progress; completion booleans set state, other bare values are data. |
| `getProgress(enrollment, slug)` | `Progress \| undefined` | Look up a record by slug. Read its `.complete` flag for completeness, not `.value`. |
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
| `submitProgress(milestoneSlug, value \| { data, complete } \| { complete })` | Records progress; completion booleans set state, other bare values are data     |

### `getProgress(enrollment, slug)` — cross-platform utility

Import from `@vch-lt/path` (or `@vch-lt/path/next`). Looks up a progress record by milestone slug by cross-referencing the `milestones` and `progress` arrays on the enrollment object. Returns `Progress | undefined`.

```ts
import { getProgress } from "@vch-lt/path";

const enrollment = await path.getEnrollmentAndProgress();
const module1 = getProgress(enrollment, "module-1");
const isDone = module1?.complete ?? false; // read `.complete`, not `.value`
```

### `pathServerSDK(config?)` — Next.js server-side

Import from `@vch-lt/path/next`. All config fields are optional and fall back to environment variables:

| Option      | Env var fallbacks                                              | Description                            |
| ----------- | -------------------------------------------------------------- | -------------------------------------- |
| `courseId`  | `NEXT_PUBLIC_PATH_COURSE_ID`, `PATH_COURSE_ID`                 | Your course ID from Path               |
| `courseUrl` | `NEXT_PUBLIC_PATH_COURSE_URL`, `COURSE_URL`                    | Your course URL (used for login redirect) |
| `pathUrl`   | `PATH_URL`                                                     | Path backend URL (default: `https://path.vchlearn.ca`) |

Returns a Promise of a server SDK instance with `checkAuth()`, `getEnrollmentAndProgress()`, `submitProgress()`, `getLoginUrl()`, and `login()`.

### `PathProvider` — Next.js async Server Component

Import from `@vch-lt/path/next`. Place in your root layout — automatically fetches auth on the server and provides reactive state to all client components via `usePath()`. Accepts optional `pathUrl`, `courseId`, `courseUrl`, and `initialAuth` (boolean, default `true`) props. See the [Next.js section](#nextjs-app-router) for full usage.

### `usePath()` — Next.js reactive client hook

Import from `@vch-lt/path/next` in Client Components. Returns reactive `auth`, `isLoading`, `getProgress()`, `submitProgress()`, `login()`, `logout()`, and `refreshAuth()`. Must be used within a `<PathProvider>` tree. Read a milestone's completeness from the returned record's `.complete` flag, not its `.value`.

### `pathClientSDK(config)` — Next.js client-side (low-level)

Import from `@vch-lt/path/next`. Re-export of `pathSDK` for direct use in Client Components without the reactive provider.

### `pathNuxtSDK(event, config)` — Nuxt/H3 server-side

Import from `@vch-lt/path/nuxt`. Takes an H3 event and optional config (`courseId`, `pathUrl`). Returns a Promise of a server SDK instance. When using the Nuxt module, `pathNuxtSDK(event)` is auto-imported with `courseId` pre-configured.

### `usePath()` — Nuxt universal composable (Nuxt module only)

Auto-imported. Works in pages, components, and layouts on both server and client. Data-fetching methods (`checkAuth`, `getEnrollmentAndProgress`) return `AsyncData` (Nuxt's `useAsyncData` result) — SSR-safe with no double-fetch. Action methods (`login`, `logout`, `submitProgress`) return Promises. `getProgress(enrollment, slug)` looks up a single record from an enrollment — check its `.complete` flag for completeness, not its `.value`.

### `pathServerSDK(options)` — generic server-side

Import from `@vch-lt/path/server`. Takes `courseId`, `pathUrl`, and `token: string | null`. Synchronous — returns the SDK instance directly.

---

## Cookie details

The bearer token is stored in a cookie named `path_bearer_token` on your course domain with `SameSite=Lax; Secure`. This means:

- It is readable by your course server (for SSR)
- It is **not** sent cross-origin (Path's server never receives it as a cookie — only as a `Bearer` header)
- It survives page reloads and navigation within your course site
- It is cleared when the user logs out
