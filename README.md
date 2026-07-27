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
authenticated user. If any learner-state request, authorization, server, network, decoding, or
response-shape error occurs, the read resolves to this stable logged-out state:

```text
user = null
course = null
milestones = []
progress = []
```

Progress, learner-store, and logout operations are strict and report errors. Applications that
redirect when `user` is null will therefore also redirect during a Path outage.

## Guides

- [JavaScript and TypeScript](docs/typescript.md)
- [PHP](docs/php.md)
- [Craft CMS](docs/craft.md)
- [Development and release validation](docs/development.md)

This release supports Path's current raw `?path-token=` login callback. It does not implement the
pending PKCE registration/activity API; that protocol requires a later breaking SDK release.
