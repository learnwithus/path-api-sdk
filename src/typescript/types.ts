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

/** The value of a scalar field: `text`, `textarea`, `number`, `checkbox`, `select` or `multiselect`. */
export type LearnerStoreScalarValue = string | number | boolean | string[];

/** The value of an `object` field, or of one entry in a `repeatable` field: one key per sub-field. */
export type LearnerStoreObjectValue = { [key: string]: LearnerStoreScalarValue | null };

/**
 * Any learner store value. Which member applies depends on how staff configured that field:
 *
 * | Field type                                                  | Value                                |
 * | ----------------------------------------------------------- | ------------------------------------ |
 * | `text`, `textarea`, `select`                                  | `string`                             |
 * | `number`                                                      | `number`                             |
 * | `checkbox`                                                    | `boolean`                            |
 * | `multiselect`                                                 | `string[]`                           |
 * | `object`                                                      | {@link LearnerStoreObjectValue}      |
 * | `repeatable`                                                  | {@link LearnerStoreObjectValue}`[]`  |
 *
 * Sub-fields inside `object` and `repeatable` are always scalar — nesting is one level deep.
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

/** @deprecated Use `ApiErrorBody` and `PathApiError` instead. */
export type APIError = import("./api-error.js").ApiErrorBody;
