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
  value: MilestoneValue;
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
 * Response from submitting progress
 */
export interface SubmitProgressResponse {
  success: boolean;
  progress: Progress;
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
