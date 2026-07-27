# Development and release validation

The repository has shared root npm and Composer manifests:

```text
src/typescript/       npm source
src/php/              Composer source
examples/typescript/  Vite development harness
examples/craft/       Craft integration example
```

There are no npm workspaces, Composer path repositories, or subtree release steps. npm publishes
only `dist`; Composer autoloads only `src/php`. Publish npm `@vch-lt/path@0.5.0` and Composer
`vch-lt/path:0.5.0` from the same commit and `v0.5.0` tag.

## Commands

```bash
npm install
npm run dev
npm run build

composer install
composer validate --strict
composer dump-autoload --strict-psr

npm pack --dry-run
composer archive --format=zip
```

The production build includes TypeScript declaration generation. The development command serves
the relocated Vue harness at `http://localhost:5500`. Connect the Craft example to a test Path
course through its three environment variables.

Do not add tests or test infrastructure to this repository. Before release, manually exercise:

1. Login callback token capture with unrelated query parameters.
2. Browser, generic SSR, Next, Nuxt, and Craft learner state.
3. Read-only attributes on the authenticated user.
4. Progress reads and writes, including incomplete saved data.
5. Lazy learner-store reads and partial writes.
6. Token rotation on success and error responses.
7. Server and browser logout.
8. Expired tokens and denied course access.
9. Unavailable Path and the resulting stable logged-out/SSR redirect behavior.

Inspect both npm and Composer archives before publishing. This release supports only the existing
raw `path-token` callback. PKCE registration/activity support is deferred to a later breaking
release.
