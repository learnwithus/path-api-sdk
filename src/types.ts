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
  type: string;
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
  updatedBy: string;
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
 * ```
 */
export interface SubmitProgressPayload {
  /** The value to store, or null for a data-less submission. */
  data: MilestoneValue | null;
  /** Whether the milestone is complete. When omitted, the submission is treated as complete. */
  complete?: boolean;
}

/**
 * Milestone value types
 */
export type MilestoneValue = boolean | number | string | Array<string | number>;

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
