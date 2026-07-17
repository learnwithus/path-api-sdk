# Usage notes

See [README.md](./README.md) for the browser, Next.js, and Nuxt integrations.

Breaking changes in this alpha release:

- `getEnrollmentAndProgress()` is now `getRegistration()`.
- `submitProgress()` is split into `submit()`, `attest()`, and `assertComplete()`.
- The callback carries a one-time `code` and `state`, never a bearer/session token.
- Browser access tokens are memory-only. BFF tokens are `HttpOnly` cookies.
- Mutable milestone arrays are replaced by version-pinned sections and activities.
