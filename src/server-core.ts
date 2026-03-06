import type { Enrollment, AuthStatus, SubmitProgressResponse, MilestoneValue } from "./types.js";

export interface ServerSDKConfig {
  /**
   * Course ID for the learner.
   * Can be omitted if PATH_COURSE_ID is set in the environment.
   */
  courseId?: string;
  pathUrl?: string;
}

async function serverFetch<T>(
  url: string,
  token: string | null,
  options: { method?: string; body?: Record<string, unknown> } = {},
): Promise<T> {
  const { method = "GET", body } = options;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

export function createServerSDK(config: ServerSDKConfig, token: string | null) {
  const pathUrl = config.pathUrl || process.env.PATH_URL || "https://path.vchlearn.ca";
  const courseId = config.courseId || process.env.PATH_COURSE_ID || "";
  if (!courseId) {
    throw new Error("[@vch-lt/path] courseId is required. Pass it in config or set PATH_COURSE_ID in the environment.");
  }

  return {
    /**
     * Check authentication status and return enrollment data if authenticated.
     */
    checkAuth: async (): Promise<AuthStatus> => {
      try {
        const enrollment = await serverFetch<Enrollment>(`${pathUrl}/api/learner?courseId=${courseId}`, token);
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
      return serverFetch<SubmitProgressResponse>(`${pathUrl}/api/learner?courseId=${courseId}`, token, {
        method: "POST",
        body: { milestoneSlug, value },
      });
    },
  };
}

export type ServerSDKInstance = ReturnType<typeof createServerSDK>;
