# Path SDK

Path SDK connects course websites to the Path learner API. This repository publishes the JavaScript
package `@vch-lt/path` and Composer package `vch-lt/path` from the same source commit and version tag.

## Shared contract

Both languages expose the same primary operations:

- `getLearnerState()` returns `user`, `course`, `milestones`, and `progress` at the state root.
- `checkAuth()` returns the authenticated user or `null`.
- The authenticated user's read-only course attributes are at `user.attributes`.
- Learner-store data is fetched separately and only when requested.
- Progress is looked up by milestone slug with `getProgress(state, slug)`.

The Path wire response places `attributes` at its root. Each SDK moves those values onto the
authenticated user. All operations, including learner-state reads, are strict: `user === null`
means Path successfully established that there is no authenticated learner, while request,
authorization, server, network, decoding, and response-shape failures throw.

TypeScript HTTP failures are `PathApiError` instances with `statusCode`, stable `code`, and optional
sanitized `details`. PHP `ApiException` exposes the same values as `statusCode`, `apiCode`, and
`details`. Legacy Path error bodies remain compatible: both clients derive a stable code from the
HTTP status when the body does not contain one.

This is a breaking authentication semantic. Consumers upgrading from 0.5 must catch failures before
redirecting: redirect only when a successful `checkAuth()` returns `null`, and show a retryable
service error for `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`, transport, or response failures.

## Guides

- [JavaScript and TypeScript](docs/typescript.md)
- [PHP](docs/php.md)
- [Craft CMS](docs/craft.md)
- [Development and release validation](docs/development.md)

This release supports Path's current raw `?path-token=` login callback. It does not implement the
pending PKCE registration/activity API; that protocol requires a later breaking SDK release.
