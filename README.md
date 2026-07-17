# @vch-lt/path

SDK for Path's learner registration and progress API. This release is a breaking alpha contract: milestones and enrollment snapshots are replaced by immutable course versions, attempts, activities, append-only progress events, and derived projections.

## Authentication

Path uses authorization code + PKCE. No Path session token is placed in a URL.

- Browser-only sites keep the 15-minute access token in memory. Reloading after it expires requires a quick Path reauthorization.
- Next.js and Nuxt integrations exchange the callback on the server and keep the access token plus rotating five-day refresh token in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- Authorization codes live for 60 seconds, are single-use, and are bound to the exact callback URL. Callback origins must be registered on the course.

## Browser usage

```ts
import pathSDK from "@vch-lt/path";

const path = pathSDK({
  courseId: "course-id",
  courseUrl: window.location.href,
  pathUrl: "https://path.vchlearn.ca",
});

const auth = await path.checkAuth(); // also exchanges a callback code when present
if (!auth.isAuthenticated) await path.login(window.location.href);

const registration = await path.getRegistration();
await path.submit("reflection", "My response");
await path.attest("read-module-one");
await path.assertComplete("interactive-course-module"); // only for explicitly trusted applications
```

`submit`, `attest`, and `assertComplete` are deliberately distinct. The server rejects an operation that does not match the activity's published completion rule.

## Next.js App Router

Export the middleware so the PKCE callback is exchanged before rendering:

```ts
// middleware.ts
export { pathMiddleware as default, pathMiddlewareConfig as config } from "@vch-lt/path/next";
```

Use the server SDK from a Server Component, Route Handler, or Server Action:

```ts
import { pathServerSDK } from "@vch-lt/path/next";

const path = await pathServerSDK({
  courseId: process.env.PATH_COURSE_ID,
  courseUrl: "https://course.example.org/learn",
});

const auth = await path.checkAuth();
if (!auth.isAuthenticated) await path.login();
const registration = await path.getRegistration();
```

`PathProvider` and `usePath()` expose the same `submit`, `attest`, `assertComplete`, `refreshAuth`, and `logout` operations to Client Components.

## Nuxt

```ts
export default defineNuxtConfig({
  modules: ["@vch-lt/path/nuxt"],
  path: {
    courseId: process.env.PATH_COURSE_ID,
    courseUrl: "https://course.example.org/learn",
  },
});
```

The module installs callback middleware and auto-imports `usePath`. For a server route:

```ts
import { pathNuxtSDK } from "@vch-lt/path/nuxt";

export default defineEventHandler(async (event) => {
  const path = await pathNuxtSDK(event, { courseId: "course-id" });
  return path.getRegistration();
});
```

## Registration model

`getRegistration()` returns the current attempt pinned to its published course version:

```ts
type RegistrationView = {
  registration: {
    id: string;
    attemptNumber: number;
    status: "not_started" | "in_progress" | "complete" | "cancelled";
    derivedComplete: boolean;
    overrideComplete: boolean;
  };
  sections: Array<{
    progress: { available: boolean; startedAt: string | null; completedAt: string | null } | null;
    activities: Array<{
      slug: string;
      required: boolean;
      completionRule: string;
      progress: { value: unknown; complete: boolean; completedAt: string | null } | null;
    }>;
  }>;
};
```

Section availability is recommended sequence, not an authorization boundary: out-of-order evidence is accepted and preserved. Course completion is derived from all required activities; manager override is an independent, reversible audit trail.
