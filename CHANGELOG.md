# Changelog

The npm package `@vch-lt/path` and the Composer package `vch-lt/path` share versions and release
from the same tag.

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
