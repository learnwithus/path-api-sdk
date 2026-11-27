# PHP

Install the Composer package:

```bash
composer require vch-lt/path
```

The package requires PHP 8.1 or newer and Guzzle 7. It accepts PSR-18 HTTP clients and PSR-17
request/stream factories, so the defaults can be replaced.

```php
use VchLt\Path\Dto\ProgressSubmission;
use VchLt\Path\PathClient;
use VchLt\Path\PathConfig;
use VchLt\Path\Token\MemoryTokenStorage;

$tokens = new MemoryTokenStorage($_COOKIE['path_bearer_token'] ?? null);
$path = new PathClient(
    new PathConfig(
        courseId: $_ENV['PATH_COURSE_ID'],
        courseUrl: $_ENV['PATH_COURSE_URL'],
        pathUrl: $_ENV['PATH_URL'] ?? 'https://path.vchlearn.ca',
    ),
    tokenStorage: $tokens,
);

$state = $path->getLearnerState();
$user = $path->checkAuth();
$record = $path->getProgress($state, 'module-one');

$path->submitProgress('module-one');
$path->submitProgress(
    'reflection',
    ProgressSubmission::withData('Draft', complete: false),
);
$path->submitProgress(
    'attended-orientation',
    ProgressSubmission::completion(false),
);
```

`LearnerState` exposes readonly `user`, `course`, `milestones`, and `progress` properties.
`AuthenticatedUser` adds readonly `attributes`. See the [shared contract](../README.md) for the
logged-out failure behavior.

## Methods

- `getLearnerState(): LearnerState`
- `checkAuth(): ?AuthenticatedUser`
- `getLoginUrl(?string $callbackUrl = null): string`
- `submitProgress(string $milestoneSlug, mixed $input = null): Progress`
- `getLearnerStore(): array`
- `updateLearnerStore(array $values): array`
- `logout(): void`
- `getProgress(LearnerState $state, string $milestoneSlug): ?Progress`

A bare `submitProgress()` input is sent as the milestone value. Use `ProgressSubmission` when
completeness or an optional `MilestoneFlag` (`info`, `warning`, or `critical` with a message) must
be supplied separately, or for a data-less completion milestone. Omitting the flag on a later
submission clears any prior flag on that milestone; `Progress::$flag` holds the latest flag or
`null`.

A milestone's value is a Path data field of its `type`. `Milestone::$valueType` is its JSON shape as
Path reports it (`string`, `number`, `boolean`, `string[]`, `object`, or `object[]`; null for a
data-less `completion`), and `Milestone::$options` lists a `select` or `multiselect` milestone's
choices.

An `object` or `object_array` milestone lists its fields in `Milestone::$fields` as `MilestoneField`
objects. Each is a scalar Path data field with a `key`, `label`, `fieldType`, `valueType`, and
`optional`, plus `options` for select fields. An `object` value is an associative array keyed by
field key, and an `object_array` value a list of them:

```php
$path->submitProgress('intake-form', ['role' => 'nurse', 'years' => 4, 'units' => ['ICU']]);
```

Unknown keys are rejected by Path, and so is a value that leaves out a field not marked `optional`.
`fields` is null for every other milestone type.

`getLearnerState()` intentionally catches request, authorization, server, decoding, and shape
failures and returns the stable logged-out state. Other methods throw:

- `TransportException` for PSR client/network failures
- `ApiException` for non-success HTTP status codes
- `ResponseException` for encoding, decoding, or response-shape failures

When a response includes `set-auth-token`, the supplied `TokenStorageInterface` receives it before
the HTTP status is evaluated. A successful `logout()` clears that token storage.

Learner-store values are arrays containing scalar, object, `object_array`, and map shapes. The
store is never loaded by `getLearnerState()`.
