# JavaScript and TypeScript

Install the npm package:

```bash
npm install @vch-lt/path
```

## Browser

```ts
import { getProgress, pathSDK } from "@vch-lt/path";

const path = pathSDK({
  courseId: "course-id",
  courseUrl: window.location.origin,
});

const state = await path.getLearnerState();
const user = await path.checkAuth();
const moduleOne = getProgress(state, "module-one");

await path.submitProgress("module-one");
await path.submitProgress("reflection", { data: "Draft", complete: false });

const store = await path.getLearnerStore();
await path.updateLearnerStore({ notes: "Ask about the class" });
```

`getLearnerState()` returns the flattened state described in the [root README](../README.md).
`user.attributes` is a read-only record whose values are strings, numbers, booleans, string arrays,
or null. Use `Progress.complete` to determine completion; a stored value does not imply completion.

A milestone's value is a Path data field of its `type`, and `Milestone.valueType` is its JSON shape as
Path reports it: `string` for `text`, `textarea`, `date`, `datetime`, and `select`; `number`;
`boolean`; `string[]` for `multiselect` and `text_array`; `object`; `object[]` for `object_array`;
and null for a data-less `completion`. A `select` or `multiselect` milestone lists its choices in
`Milestone.options`.

An `object` or `object_array` milestone defines its own fields in `Milestone.fields`. Each is a scalar
Path data field with a `key`, `label`, `fieldType`, and `valueType`, plus `options` for select fields
and `optional` for a field a value may leave out. An `object` value is keyed by field key, where
`multiselect` and `text_array` hold string arrays and a cleared number is `null`, and it must be sent
wrapped as `{ data }` because a bare plain object is read as the `{ data, complete }` payload:

```ts
await path.submitProgress("intake-form", { data: { role: "Nurse", years: 4, units: ["ICU"] } });
```

Unknown keys are rejected by Path, and so is a value that leaves out a field not marked `optional`.

The browser client consumes `?path-token=`, stores it in the `path_bearer_token` cookie, and removes
only that query parameter from the address bar. The cookie uses `Path=/`, `SameSite=Lax`, is secure
on HTTPS, and remains JavaScript-readable so browser and SSR clients can share it.

## Generic server

```ts
import { pathServerSDK, TOKEN_STORAGE_KEY } from "@vch-lt/path/server";

const path = pathServerSDK({
  courseId: "course-id",
  courseUrl: "https://course.example",
  token: request.cookies[TOKEN_STORAGE_KEY] ?? null,
  onTokenChange(token) {
    if (token === null) response.clearCookie(TOKEN_STORAGE_KEY);
    else response.cookie(TOKEN_STORAGE_KEY, token);
  },
});

const state = await path.getLearnerState();
await path.logout();
```

The callback receives rotated tokens before response success is checked and receives `null` after a
successful logout.

## Next.js

Use `PathProvider` and hooks from `@vch-lt/path/next`:

```tsx
// app/layout.tsx
import { PathProvider } from "@vch-lt/path/next";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PathProvider prefetch>{children}</PathProvider>;
}
```

```tsx
"use client";
import { usePath } from "@vch-lt/path/next";

export function Status() {
  const { user, course, getProgress, refresh, logout } = usePath();
  return <p>{user ? `${user.email} — ${course?.title}` : "Logged out"}</p>;
}
```

Install `createPathMiddleware()` (or re-export `pathMiddleware`) so the first server render captures
the login token. `prefetch` controls server-side state loading. The client hook uses `refresh()`.
`useLearnerStore()` remains separate, preventing an unused second request.

## Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@vch-lt/path/nuxt"],
  path: { courseId: process.env.PATH_COURSE_ID! },
});
```

The module supplies the universal `usePath()` composable and token middleware. Read methods return
Nuxt `AsyncData`; action methods return promises. Server routes can call
`pathNuxtSDK(event, config)` directly. Learner-store reads remain separate from learner-state reads.

With any adapter, a failed learner-state read looks logged out. An SSR guard such as
`if (!state.user) redirect(...)` also redirects when Path is unavailable.
