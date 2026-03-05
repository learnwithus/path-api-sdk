import type { Enrollment, AuthStatus, SubmitProgressResponse, MilestoneValue } from './types.js';

export interface ServerSDKConfig {
  courseId: string;
  pathUrl?: string;
}

async function serverFetch<T>(url: string, token: string | null, options: { method?: string; body?: Record<string, unknown> } = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export function createServerSDK(config: ServerSDKConfig, token: string | null) {
  const pathUrl = config.pathUrl || 'https://path.vchlearn.ca';
  const courseId = config.courseId;

  return {
    /**
     * Check authentication status and return enrollment data if authenticated.
     */
    checkAuth: async (): Promise<AuthStatus> => {
      try {
        const enrollment = await serverFetch<Enrollment>(
          `${pathUrl}/api/learner?courseId=${courseId}`,
          token
        );
        return { isAuthenticated: true, enrollment };
      } catch {
        return { isAuthenticated: false };
      }
    },

    /**
     * Get enrollment and progress data for the current user.
     */
    getEnrollmentAndProgress: async (): Promise<Enrollment> => {
      return serverFetch<Enrollment>(`${pathUrl}/api/learner?courseId=${courseId}`, token);
    },

    /**
     * Submit progress for a milestone.
     */
    submitProgress: async (milestoneSlug: string, value: MilestoneValue): Promise<SubmitProgressResponse> => {
      return serverFetch<SubmitProgressResponse>(
        `${pathUrl}/api/learner?courseId=${courseId}`,
        token,
        { method: 'POST', body: { milestoneSlug, value } }
      );
    },
  };
}

export type ServerSDKInstance = ReturnType<typeof createServerSDK>;
