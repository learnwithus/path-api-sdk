# Changelog

The npm package `@vch-lt/path` and the Composer package `vch-lt/path` share versions and release
from the same tag.

## 0.8.0

Requires a Path server that serves the learner API under `/api/v1/learner`. Path no longer answers
the old `/api/learner` routes, so earlier SDK versions stop working against it.

- Breaking: every learner request (state, progress, store, and sign-out) now goes to
  `/api/v1/learner/**`. The SDK's own API is unchanged; upgrade the package and redeploy.

## 0.7.0

Requires a Path server whose milestones are data fields. Older servers' learner state no longer
validates, so `getLearnerState()` returns the logged-out state against them.

- Breaking: `MilestoneType` is now Path's data-field types (`text`, `textarea`, `number`, `date`,
  `datetime`, `boolean`, `select`, `multiselect`, `text_array`, `object`, `object_array`) plus
  `completion`. Path migrates existing milestones: `string` becomes `textarea`, `array` becomes
  `text_array`, and `boolean` stays `boolean`.
- Breaking: `text_array` values hold strings only. Path stores numbers already submitted to a former
  `array` milestone as strings and rejects new numeric items.
- Add `Milestone.valueType`, the JSON shape of a milestone's value as Path reports it (`string`,
  `number`, `boolean`, `string[]`, `object`, or `object[]`; null for `completion`), and
  `Milestone.options` for a `select` or `multiselect` milestone. New export: `MilestoneValueType`.
- `MilestoneField.valueType` now comes from Path instead of an SDK-side map, and fields may be
  `optional`.
- Support `object_array` milestones, whose value is a list of field groups (`MilestoneObjectValue[]`).
- PHP: `Milestone` gains `valueType` and `options`; `MilestoneField` gains `optional`.

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
