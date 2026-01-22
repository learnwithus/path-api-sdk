import type {
  LearnerAPIConfig,
  Enrollment,
  AuthStatus,
  SubmitProgressResponse,
  MilestoneValue,
} from './types.js';
import { apiRequest } from './fetch-helper.js';

export * from './types.js';
export { apiRequest } from './fetch-helper.js';

/**
 * Factory function to create a Path SDK instance
 *
 * @example
 * ```typescript
 * export const path = pathSDK({ courseId: 1 });
 *
 * // Use the SDK
 * const auth = await path.checkAuth();
 * await path.submitProgress(1, true);
 * ```
 */
export function pathSDK(config: LearnerAPIConfig) {
  const pathUrl = config.pathUrl || 'https://path.vchlearn.ca';
  const courseUrl = config.courseUrl;
  const courseId = config.courseId;

  return {
    /**
     * Check authentication status
     */
    checkAuth: async (): Promise<AuthStatus> => {
      try {
        const enrollment = await apiRequest<Enrollment>(
          `${pathUrl}/api/learner?courseId=${courseId}`
        );
        return {
          isAuthenticated: true,
          enrollment,
        };
      } catch (error) {
        return {
          isAuthenticated: false,
        };
      }
    },

    /**
     * Redirect to login page
     */
    login: (callbackUrl?: string): void => {
      const callback = encodeURIComponent(callbackUrl || courseUrl);
      window.location.href = `${pathUrl}/learner-login?courseId=${courseId}&callbackUrl=${callback}`;
    },

    /**
     * Logout the current user
     */
    logout: async (): Promise<void> => {
      await apiRequest(
        `${pathUrl}/api/learner/logout?courseId=${courseId}`,
        { method: 'POST' }
      );
    },

    /**
     * Get enrollment and progress data
     */
    getEnrollmentAndProgress: async (): Promise<Enrollment> => {
      return await apiRequest<Enrollment>(
        `${pathUrl}/api/learner?courseId=${courseId}`
      );
    },

    /**
     * Submit progress for a milestone
     */
    submitProgress: async (
      milestoneId: number,
      value: MilestoneValue
    ): Promise<SubmitProgressResponse> => {
      return await apiRequest<SubmitProgressResponse>(
        `${pathUrl}/api/learner?courseId=${courseId}`,
        {
          method: 'POST',
          body: {
            milestoneId,
            value,
          },
        }
      );
    },
  };
}

/**
 * Type for the return value of pathSDK
 */
export type PathSDKInstance = ReturnType<typeof pathSDK>;

/**
 * Default export for convenience
 */
export default pathSDK;
