import type { LearnerAPIConfig, Enrollment, AuthStatus, SubmitProgressResponse, MilestoneValue } from './types.js';
export * from './types.js';
export { apiRequest } from './fetch-helper.js';
/**
 * Factory function to create a Path API instance
 *
 * @example
 * ```typescript
 * export const path = pathAPI({ courseId: 1 });
 *
 * // Use the API
 * const auth = await path.checkAuth();
 * await path.submitProgress(1, true);
 *
 * // Or use utilities
 * const value = path.parseValue('{"key": "value"}');
 * ```
 */
export declare function pathAPI(config: LearnerAPIConfig): {
    /**
     * Check authentication status
     */
    checkAuth: () => Promise<AuthStatus>;
    /**
     * Redirect to login page
     */
    login: (overrideCallbackUrl?: string) => void;
    /**
     * Logout the current user
     */
    logout: () => Promise<void>;
    /**
     * Get enrollment and progress data
     */
    getEnrollmentAndProgress: () => Promise<Enrollment>;
    /**
     * Submit progress for a milestone
     */
    submitProgress: (milestoneId: number, value: MilestoneValue) => Promise<SubmitProgressResponse>;
    /**
     * Parse value from string input
     */
    parseValue: (input: string) => MilestoneValue;
    /**
     * Get the current course ID
     */
    getCourseId: () => number;
    /**
     * Get the base URL
     */
    getBaseUrl: () => string;
};
/**
 * Type for the return value of pathAPI
 */
export type PathAPIInstance = ReturnType<typeof pathAPI>;
/**
 * Default export for convenience
 */
export default pathAPI;
//# sourceMappingURL=index.d.ts.map