import { apiRequest } from './fetch-helper.js';
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
export function pathAPI(config) {
    const baseUrl = config.baseUrl || 'http://localhost:3000';
    const callbackUrl = config.callbackUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const courseId = config.courseId;
    return {
        /**
         * Check authentication status
         */
        checkAuth: async () => {
            try {
                const enrollment = await apiRequest(`${baseUrl}/api/learner?courseId=${courseId}`);
                return {
                    isAuthenticated: true,
                    enrollment,
                };
            }
            catch (error) {
                return {
                    isAuthenticated: false,
                };
            }
        },
        /**
         * Redirect to login page
         */
        login: (overrideCallbackUrl) => {
            const callback = encodeURIComponent(overrideCallbackUrl || callbackUrl);
            window.location.href = `${baseUrl}/learner-login?courseId=${courseId}&callbackUrl=${callback}`;
        },
        /**
         * Logout the current user
         */
        logout: async () => {
            await apiRequest(`${baseUrl}/api/learner/logout?courseId=${courseId}`, { method: 'POST' });
        },
        /**
         * Get enrollment and progress data
         */
        getEnrollmentAndProgress: async () => {
            return await apiRequest(`${baseUrl}/api/learner?courseId=${courseId}`);
        },
        /**
         * Submit progress for a milestone
         */
        submitProgress: async (milestoneId, value) => {
            return await apiRequest(`${baseUrl}/api/learner?courseId=${courseId}`, {
                method: 'POST',
                body: {
                    milestoneId,
                    value,
                },
            });
        },
        /**
         * Parse value from string input
         */
        parseValue: (input) => {
            try {
                return JSON.parse(input);
            }
            catch {
                return input;
            }
        },
        /**
         * Get the current course ID
         */
        getCourseId: () => courseId,
        /**
         * Get the base URL
         */
        getBaseUrl: () => baseUrl,
    };
}
/**
 * Default export for convenience
 */
export default pathAPI;
//# sourceMappingURL=index.js.map