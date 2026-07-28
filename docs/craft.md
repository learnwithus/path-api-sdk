# Craft CMS

The Composer package includes a Craft 4/5 module. Add it to the consuming project's `config/app.php`:

```php
use VchLt\Path\Craft\PathModule;

return [
    'modules' => [
        'path' => [
            'class' => PathModule::class,
            'pathUrl' => '$PATH_URL',
            'courseId' => '$PATH_COURSE_ID',
            'courseUrl' => '$PATH_COURSE_URL',
            'logoutRedirect' => '/',
        ],
    ],
    'bootstrap' => ['path'],
];
```

Set one `PATH_URL`, `PATH_COURSE_ID`, and `PATH_COURSE_URL` for each Craft environment. A complete
configuration and Twig page are in [`examples/craft`](../examples/craft).

The module intercepts the current raw `?path-token=` callback before Twig rendering, writes
`path_bearer_token`, and redirects with HTTP 303 to the same URL after removing only that parameter.
All other query parameters remain intact. The cookie uses `Path=/`, `SameSite=Lax`, HTTPS-only
`Secure`, and `HttpOnly=false`, matching the npm clients.

## Twig

The read-only `craft.path` variable exposes:

```twig
{% set state = craft.path.getLearnerState() %}
{% set user = craft.path.checkAuth() %}
{% set user = craft.path.getUser() %}
{% set course = craft.path.getCourse() %}
{% set milestones = craft.path.getMilestones() %}
{% set progress = craft.path.getProgress('module-one') %}
{% set loginUrl = craft.path.getLoginUrl(craft.app.request.absoluteUrl) %}
{% set store = craft.path.getLearnerStore() %}
```

Learner state is memoized for the current request so guards, layouts, and templates share one Path
call. The learner store stays separate and lazy. Loading state does not load the store.

Route guards belong to the consuming site:

```twig
{% if not craft.path.checkAuth() %}
  {% redirect craft.path.getLoginUrl(craft.app.request.absoluteUrl) %}
{% endif %}
```

Learner-state failures now throw. Catch `ApiException`, `TransportException`, and
`ResponseException` in a controller or Twig error boundary and show a retry action; redirect only
after a successful read returns no user (or an API failure explicitly has
`apiCode === 'UNAUTHENTICATED'`). This prevents a Path outage from looking like logout.

## Writes and logout

Controllers can obtain `PathModule::getInstance()->getPath()` and call `submitProgress()` or
`updateLearnerStore()`. Mutation helpers are intentionally absent from Twig.

Post a CSRF-protected form to the provided logout action:

```twig
<form method="post">
  {{ csrfInput() }}
  {{ actionInput('path/path/logout') }}
  <button type="submit">Log out</button>
</form>
```

The action calls Path, clears the local token only after success, and redirects to
`logoutRedirect`. Craft's normal CSRF validation remains enabled.
