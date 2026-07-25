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
  order: number;
  createdAt: string;
  updatedAt: string;
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
  updatedBy: string | null;
  milestoneSlug: string;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Enrollment information with user, course, milestones, and progress
 */
export interface Enrollment {
  user: User;
  course: Course;
  milestones: Milestone[];
  progress: Progress[];
}

/**
 * Authentication status
 */
export interface AuthStatus {
  isAuthenticated: boolean;
  enrollment?: Enrollment;
}

/**
 * Payload form for `submitProgress`, to send a value and its completeness together.
 *
 * @example
 * ```ts
 * // Record the value `false` but mark the milestone complete anyway.
 * await path.submitProgress("module-1-checkbox", { data: false, complete: true });
 * // Equivalent to path.submitProgress("attended-orientation", false).
 * await path.submitProgress("attended-orientation", { complete: false });
 * ```
 */
export type SubmitProgressPayload =
  | {
      /** The value to store for a data-bearing milestone. */
      data: MilestoneValue;
      /** Whether the milestone is complete. When omitted, the submission is treated as complete. */
      complete?: boolean;
    }
  | {
      /** Completion milestones carry no data. */
      data?: never;
      /** Whether the completion milestone is complete. When omitted, it is treated as complete. */
      complete?: boolean;
    };

/**
 * Milestone value types
 */
export type MilestoneValue = boolean | number | string | Array<string | number>;

/** Milestone data shapes supported by the Path API. */
export type MilestoneType = "boolean" | "string" | "array" | "number" | "completion";

/**
 * Accepted second argument to `submitProgress`. For a data-less completion milestone, omit it or
 * pass `true` to mark it complete, and pass `false` to mark it incomplete. For every other type, a
 * bare value is milestone data.
 */
export type SubmitProgressInput = MilestoneValue | SubmitProgressPayload;

// ---------------------------------------------------------------------------
// LearnerStore
// ---------------------------------------------------------------------------
//
// The learner store holds side data the learner keeps for themselves alongside a course —
// bookmarks, notes, reminders. Staff define which fields exist; the learner owns the values.
//
// It is deliberately not for anything in the natural progression of learning. Use milestones and
// `submitProgress` for that.
//
// ---------------------------------------------------------------------------

/**
 * Scalar field types. These hold a single value.
 *
 * - `text` / `textarea` — a string
 * - `number` — a number
 * - `checkbox` — a boolean
 * - `select` — one string from `options`
 * - `multiselect` — several strings from `options`
 */
export type LearnerStoreScalarType = "text" | "textarea" | "number" | "checkbox" | "select" | "multiselect";

/**
 * Every learner store field type, including the two composite types.
 *
 * - `object` — a single group of sub-fields
 * - `repeatable` — a list of such groups, which the learner can add to and remove from
 */
export type LearnerStoreFieldType = LearnerStoreScalarType | "object" | "repeatable";

/** The value of a scalar field. */
export type LearnerStoreScalarValue = string | number | boolean | string[];

/** The value of an `object` field, or of one entry in a `repeatable` field: one key per sub-field. */
export type LearnerStoreObjectValue = { [key: string]: LearnerStoreScalarValue | null };

/**
 * Any learner store value. Which member applies is determined by the field's `fieldType`:
 * a scalar type holds a {@link LearnerStoreScalarValue}, `object` holds one
 * {@link LearnerStoreObjectValue}, and `repeatable` holds an array of them.
 */
export type LearnerStoreValue = LearnerStoreScalarValue | null | LearnerStoreObjectValue | LearnerStoreObjectValue[];

/** A sub-field of an `object` or `repeatable` field. Sub-fields are always scalar. */
export interface LearnerStoreSubField {
  /** Stable identifier, unique within the parent field. */
  key: string;
  label: string;
  fieldType: LearnerStoreScalarType;
  /** Choices for `select` and `multiselect`; null otherwise. */
  options?: string[] | null;
  defaultValue?: LearnerStoreScalarValue | null;
}

/**
 * One learner store field: the definition the course set up, plus this learner's current value.
 *
 * Fields are identified by `key`, not `slug` — `slug` identifies a milestone. A key is lowercase
 * and kebab-case, for example `saved-bookmarks`.
 */
export interface LearnerStoreField {
  id: number;
  /** Stable identifier, unique within the course. Use this as the key when writing values. */
  key: string;
  label: string;
  fieldType: LearnerStoreFieldType;
  /** Choices for `select` and `multiselect`; null otherwise. */
  options: string[] | null;
  /** The value used when the learner has not written one; null for composite fields. */
  defaultValue: LearnerStoreScalarValue | null;
  /** Sub-field definitions for `object` and `repeatable` fields; null for scalar fields. */
  fields: LearnerStoreSubField[] | null;
  /** This learner's current value, or the field's default if they have not written one. */
  value: LearnerStoreValue;
  /** When the value was last written, or null if it never has been. */
  updatedAt: string | null;
  /**
   * Always null on the learner API. Path suppresses the writer's name whenever a learner is reading
   * their own record, so a learner never sees that a staff member wrote a value.
   */
  updatedByName: string | null;
}

/**
 * The whole learner store, keyed by field key.
 *
 * Key order follows the order the course configured, because the API returns fields sorted and
 * JavaScript preserves insertion order. The one exception is a field key made only of digits, which
 * JavaScript hoists to the front of the object; if a course uses such keys, do not rely on
 * `Object.keys()` order for display.
 */
export type LearnerStore = Record<string, LearnerStoreField>;

/**
 * Values to write, keyed by field key. Only the keys you send are changed — everything else in the
 * learner store is left alone.
 */
export type LearnerStoreUpdate = Record<string, LearnerStoreValue>;

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
