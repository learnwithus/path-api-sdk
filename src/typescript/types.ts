/**
 * User information
 */
export interface User {
  id: string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Course information
 */
export interface Course {
  id: string;
  title: string;
}

/**
 * Course milestone definition
 */
export interface Milestone {
  id: number;
  courseId: string;
  title: string;
  slug: string;
  type: MilestoneType;
  /** The JSON shape of this milestone's value, as Path reports it; null for a data-less `completion`. */
  valueType: MilestoneValueType | null;
  /** The choices of a `select` or `multiselect` milestone; null for every other type. */
  options: string[] | null;
  /** The field definitions of an `object` or `object_array` milestone; null for every other type. */
  fields: MilestoneField[] | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Severity level of a milestone progress flag. */
export type MilestoneFlagLevel = "info" | "warning" | "critical";

/** Optional open-ended flag attached to a milestone progress submission. */
export interface MilestoneFlag {
  level: MilestoneFlagLevel;
  message: string;
}

/**
 * Progress record for a milestone
 */
export interface Progress {
  id: number;
  userId: string;
  courseMilestoneId: number;
  /** The submitted value, or null when the milestone carries no data. */
  value: MilestoneValue | null;
  /** Whether this submission marks the milestone complete. */
  complete: boolean;
  /** Optional flag attached to this submission, or null when unflagged. */
  flag: MilestoneFlag | null;
  updatedBy: string | null;
  milestoneSlug: string;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One read-only learner attribute value. Attributes are scoped to the configured course. */
export type LearnerAttributeValue = string | number | boolean | string[] | null;

/** The signed-in learner's read-only course attributes, keyed by definition key. */
export type LearnerAttributes = Readonly<Record<string, LearnerAttributeValue>>;

/** An authenticated learner profile with its attributes for the configured course. */
export type AuthenticatedUser = User & {
  attributes: LearnerAttributes;
};

/** The complete learner state returned by Path. */
export interface LearnerState {
  user: AuthenticatedUser | null;
  course: Course | null;
  milestones: Milestone[];
  progress: Progress[];
}

/**
 * Payload form for `submitProgress`, to send a value, completeness, and an optional flag together.
 *
 * @example
 * ```ts
 * // Record the value `false` but mark the milestone complete anyway.
 * await path.submitProgress("module-1-boolean", { data: false, complete: true });
 * // Equivalent to path.submitProgress("attended-orientation", false).
 * await path.submitProgress("attended-orientation", { complete: false });
 * // Attach a warning flag; omitting `flag` (or passing `null`) on a later submission clears it.
 * await path.submitProgress("quiz-1", {
 *   data: 40,
 *   complete: false,
 *   flag: { level: "warning", message: "Failed 3 attempts" },
 * });
 * ```
 */
export type SubmitProgressPayload =
  | {
      /** The value to store for a data-bearing milestone. */
      data: MilestoneValue;
      /** Whether the milestone is complete. When omitted, the submission is treated as complete. */
      complete?: boolean;
      /** Optional flag attached to this submission. Omit or pass `null` to clear any prior flag. */
      flag?: MilestoneFlag | null;
    }
  | {
      /** Completion milestones carry no data. */
      data?: never;
      /** Whether the completion milestone is complete. When omitted, it is treated as complete. */
      complete?: boolean;
      /** Optional flag attached to this submission. Omit or pass `null` to clear any prior flag. */
      flag?: MilestoneFlag | null;
    };

/**
 * One field value of an `object` or `object_array` milestone. `multiselect` and `text_array` fields hold string
 * arrays, `date` and `datetime` fields hold strings, and a cleared number is `null`.
 */
export type MilestoneFieldValue = string | number | boolean | string[] | null;

/** The value an `object` milestone holds, and each item of an `object_array`: each field's key mapped to its value. */
export type MilestoneObjectValue = Record<string, MilestoneFieldValue>;

/**
 * A milestone's value: a Path data-field value of its type. Its shape is the milestone's `valueType`.
 */
export type MilestoneValue = MilestoneFieldValue | MilestoneObjectValue | MilestoneObjectValue[];

/** The data-field types an `object` or `object_array` milestone's fields can use. Fields are always scalar. */
export type MilestoneFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multiselect"
  | "text_array";

/**
 * A milestone's type: any Path data-field type, the same ones a learner datastore uses, or `completion`
 * for a milestone that records only whether it is done.
 */
export type MilestoneType = MilestoneFieldType | "object" | "object_array" | "completion";

/** The primitive type a milestone field's value holds, apart from `null` for a cleared number. */
export type MilestoneFieldValueType = "string" | "number" | "boolean" | "string[]";

/** The JSON shape a milestone's value takes: a field's primitive type, one field group, or a list of them. */
export type MilestoneValueType = MilestoneFieldValueType | "object" | "object[]";

/** One field of an `object` or `object_array` milestone, defined like a Path data field. Values are stored under `key`. */
export interface MilestoneField {
  key: string;
  label: string;
  fieldType: MilestoneFieldType;
  /** The primitive type of this field's value, as Path reports it. */
  valueType: MilestoneFieldValueType;
  /** The allowed choices of a `select` or `multiselect` field. */
  options?: string[] | null;
  defaultValue?: unknown;
  /** Whether a submitted value may leave this field out. */
  optional?: boolean;
}

/**
 * Accepted second argument to `submitProgress`. For a data-less completion milestone, omit it or
 * pass `true` to mark it complete, and pass `false` to mark it incomplete. For every other type, a
 * bare value is milestone data. An `object` milestone's value must be wrapped as `{ data }`, since
 * a bare plain object is always read as a {@link SubmitProgressPayload}.
 */
export type SubmitProgressInput = Exclude<MilestoneValue, MilestoneObjectValue> | SubmitProgressPayload;

// ---------------------------------------------------------------------------
// Learner store
// ---------------------------------------------------------------------------
//
// The learner store holds side data the learner keeps for themselves alongside a course —
// bookmarks, notes, reminders. Staff define which fields exist; the learner owns the values.
//
// It is deliberately not for anything in the natural progression of learning. Use milestones and
// `submitProgress` for that.
//
// The learner API returns values only, never the field definitions: your course site set those
// fields up with staff, so it already knows the labels and types.
//
// ---------------------------------------------------------------------------

/** The value of a scalar field: `text`, `textarea`, `number`, `date`, `datetime`, `boolean`, `select`, `multiselect`, or `text_array`. */
export type LearnerStoreScalarValue = string | number | boolean | string[];

/** The value of an `object` field, or of one entry in an `object_array` field: one key per sub-field. */
export type LearnerStoreObjectValue = { [key: string]: LearnerStoreScalarValue | null };

/**
 * Any learner store value. Which member applies depends on how staff configured that field:
 *
 * | Field type                                                  | Value                                |
 * | ----------------------------------------------------------- | ------------------------------------ |
 * | `text`, `textarea`, `date`, `datetime`, `select`            | `string`                             |
 * | `number`                                                    | `number \| null`                     |
 * | `boolean`                                                   | `boolean`                            |
 * | `multiselect`, `text_array`                                 | `string[]`                           |
 * | `object`                                                    | {@link LearnerStoreObjectValue}      |
 * | `object_array`                                              | {@link LearnerStoreObjectValue}`[]`  |
 *
 * Sub-fields inside `object` and `object_array` are always scalar — nesting is one level deep.
 */
export type LearnerStoreValue = LearnerStoreScalarValue | null | LearnerStoreObjectValue | LearnerStoreObjectValue[];

/**
 * A learner's stored values, keyed by field key.
 *
 * Keys are lowercase and kebab-case, for example `saved-bookmarks`. They identify a field by `key`,
 * not `slug` — `slug` identifies a milestone, and the two are easy to confuse.
 *
 * This is both what a read returns and what a write accepts, so values can be round-tripped.
 *
 * Key order follows the order the course configured, because the API returns fields sorted and
 * JavaScript preserves insertion order. The one exception is a field key made only of digits, which
 * JavaScript hoists to the front of the object; if a course uses such keys, do not rely on
 * `Object.keys()` order for display.
 */
export type LearnerStore = Record<string, LearnerStoreValue>;

/**
 * Configuration options for Path SDK
 */
export interface LearnerAPIConfig {
  /**
   * Course ID for the learner.
   * Can be omitted if PATH_COURSE_ID or NEXT_PUBLIC_PATH_COURSE_ID is set in the environment.
   */
  courseId?: string;

  /**
   * Path backend URL (default: https://path.vchlearn.ca)
   */
  pathUrl?: string;

  /**
   * Your course website URL for login redirects
   */
  courseUrl: string;
}

/**
 * Error response from API
 */
export interface APIError {
  message: string;
  statusCode?: number;
}
