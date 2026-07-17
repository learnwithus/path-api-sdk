import type { ActivityValue, AuthStatus, ProgressEvent, RegistrationView, TokenResponse } from "./types.js";
import { apiRequest } from "./fetch-helper.js";

export interface ServerSDKConfig { courseId?: string; pathUrl?: string; courseUrl?: string; }
export interface ServerTokenSet { accessToken: string | null; refreshToken: string | null; }

export async function exchangeCode(pathUrl: string, code: string, verifier: string, redirectUri: string) {
  return apiRequest<TokenResponse>(`${pathUrl}/api/learner/auth/token`, {
    method: "POST",
    body: { grantType: "authorization_code", code, codeVerifier: verifier, redirectUri, clientType: "bff" },
    token: null,
  });
}

export function createServerSDK(
  config: ServerSDKConfig,
  tokens: ServerTokenSet,
  onTokens?: (tokens: ServerTokenSet) => void | Promise<void>,
) {
  const pathUrl = config.pathUrl || process.env.PATH_URL || "https://path.vchlearn.ca";
  const courseId = config.courseId || process.env.PATH_COURSE_ID || "";
  const courseUrl = config.courseUrl || process.env.COURSE_URL || "";
  if (!courseId) throw new Error("[@vch-lt/path] courseId is required");

  async function request<T>(url: string, options: { method?: "GET" | "POST"; body?: Record<string, unknown> } = {}): Promise<T> {
    try {
      return await apiRequest<T>(url, { ...options, token: tokens.accessToken });
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode !== 401 || !tokens.refreshToken) throw error;
      const refreshed = await apiRequest<TokenResponse>(`${pathUrl}/api/learner/auth/token`, {
        method: "POST", body: { grantType: "refresh_token", refreshToken: tokens.refreshToken }, token: null,
      });
      tokens = { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken ?? null };
      await onTokens?.(tokens);
      return apiRequest<T>(url, { ...options, token: tokens.accessToken });
    }
  }

  const getRegistration = () => request<RegistrationView>(`${pathUrl}/api/learner/registration`);
  return {
    pathUrl, courseId, courseUrl,
    checkAuth: async (): Promise<AuthStatus> => {
      try { return { isAuthenticated: true, registration: await getRegistration() }; }
      catch { return { isAuthenticated: false }; }
    },
    getRegistration,
    submit: (slug: string, value: ActivityValue) => request<ProgressEvent>(`${pathUrl}/api/learner/activities/${encodeURIComponent(slug)}/submissions`, { method: "POST", body: { value } }),
    attest: (slug: string) => request<ProgressEvent>(`${pathUrl}/api/learner/activities/${encodeURIComponent(slug)}/attestation`, { method: "POST", body: { complete: true } }),
    assertComplete: (slug: string) => request<ProgressEvent>(`${pathUrl}/api/learner/activities/${encodeURIComponent(slug)}/completion`, { method: "POST", body: { complete: true } }),
    revoke: async () => {
      if (tokens.refreshToken) await apiRequest(`${pathUrl}/api/learner/auth/revoke`, { method: "POST", body: { token: tokens.refreshToken }, token: null });
      tokens = { accessToken: null, refreshToken: null };
      await onTokens?.(tokens);
    },
  };
}

export type ServerSDKInstance = ReturnType<typeof createServerSDK>;
