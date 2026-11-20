# Changelog

The npm package `@vch-lt/path` and the Composer package `vch-lt/path` share versions and release
from the same tag.

## 0.6.2

- Fix the Nuxt `usePath()` composable failing consumers' type checks with "Argument of type
  'H3Event | undefined' is not assignable to parameter of type 'H3Event'". Server calls made
  without a request event now throw a clear error instead of passing `undefined` on.
- Type-check the Nuxt runtime files (`npm run typecheck`, also run by `npm run build`), which are
  shipped as TypeScript source and were previously excluded from the build's type check.

## 0.6.1

- Document object milestones in the README and in `submitProgress` editor documentation for
  TypeScript and PHP.
- Add this changelog.

## 0.6.0

- Support Path's `object` milestone type, which records a group of named values.
  - `MilestoneType` includes `"object"`.
  - `Milestone.fields` lists an object milestone's fields and is `null` for other types. Each field
    has `key`, `label`, `fieldType`, optional `options` and `defaultValue`, and an SDK-derived
    `valueType` of `string`, `number`, `boolean`, or `string[]`.
  - Progress values may be objects keyed by field. TypeScript sends them as
    `submitProgress(slug, { data: { ... } })`; PHP accepts an associative array.
- Accept Path's `list` data-field type in object milestones.
- New exports: `MilestoneField`, `MilestoneFieldType`, `MilestoneFieldValue`,
  `MilestoneFieldValueType`, `MilestoneObjectValue`, and the PHP `MilestoneField` DTO.
- Learner state from Path servers without object milestones is still read, with `fields` set to
  `null`.

Previously, any course with an object milestone made `getLearnerState()` return the logged-out state.
