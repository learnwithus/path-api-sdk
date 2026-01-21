/**
 * User information
 */
export interface User {
    id: number;
    email?: string;
}
/**
 * Course information
 */
export interface Course {
    id: number;
    title: string;
    description?: string;
    createdAt: string;
}
/**
 * Progress record for a milestone
 */
export interface Progress {
    id: number;
    userId: number;
    courseMilestoneId: number;
    value: string;
    createdAt: string;
}
/**
 * Enrollment information with user, course, and progress
 */
export interface Enrollment {
    id: number;
    user: User;
    course: Course;
    progress?: Progress[];
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
export type MilestoneValue = boolean | string | number | unknown[] | Record<string, unknown>;
/**
 * Configuration options for LearnerAPI
 */
export interface LearnerAPIConfig {
    /**
     * Course ID for the learner
     */
    courseId: number;
    /**
     * Base URL for the API (default: http://localhost:3000)
     */
    baseUrl?: string;
    /**
     * Callback URL for login redirects (default: current page)
     */
    callbackUrl?: string;
}
/**
 * Error response from API
 */
export interface APIError {
    message: string;
    statusCode?: number;
}
//# sourceMappingURL=types.d.ts.map