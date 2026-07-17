import type { Activity, AuthStatus, LearnerAPIConfig, ProgressEvent, RegistrationView, TokenResponse, ActivityValue } from "./types.js";
import { apiRequest, getAccessToken, setAccessToken } from "./fetch-helper.js";

export * from "./types.js";
export { apiRequest, getAccessToken, setAccessToken } from "./fetch-helper.js";

const VERIFIER_KEY = "path_pkce_verifier";
const STATE_KEY = "path_oauth_state";
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function createPkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

export function getActivity(view: RegistrationView, slug: string): Activity | undefined {
  return view.sections.flatMap((section) => section.activities).find((activity) => activity.slug === slug);
}

export function pathSDK(config: LearnerAPIConfig) {
  const meta = typeof import.meta !== "undefined" ? ((import.meta as { env?: Record<string, string> }).env ?? {}) : {};
  const pathUrl = config.pathUrl ?? meta.VITE_PATH_URL ?? "https://path.vchlearn.ca";
  const courseId = config.courseId ?? meta.VITE_PATH_COURSE_ID ?? "";
  if (!courseId) throw new Error("[@vch-lt/path] courseId is required");

  async function handleCallback(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return false;
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    const expectedState = sessionStorage.getItem(STATE_KEY);
    if (!verifier || state !== expectedState) throw new Error("Path authorization state did not match");
    const redirectUri = new URL(url);
    redirectUri.searchParams.delete("code");
    redirectUri.searchParams.delete("state");
    const tokens = await apiRequest<TokenResponse>(`${pathUrl}/api/learner/auth/token`, {
      method: "POST",
      body: { grantType: "authorization_code", code, codeVerifier: verifier, redirectUri: redirectUri.toString(), clientType: "browser" },
    });
    setAccessToken(tokens.accessToken);
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
    window.history.replaceState(null, "", redirectUri.pathname + redirectUri.search + redirectUri.hash);
    return true;
  }

  const getRegistration = () => apiRequest<RegistrationView>(`${pathUrl}/api/learner/registration`);
  return {
    handleCallback,
    checkAuth: async (): Promise<AuthStatus> => {
      try {
        if (!getAccessToken()) await handleCallback();
        if (!getAccessToken()) return { isAuthenticated: false };
        return { isAuthenticated: true, registration: await getRegistration() };
      } catch { return { isAuthenticated: false }; }
    },
    login: async (callbackUrl = config.courseUrl): Promise<void> => {
      const { verifier, challenge } = await createPkce();
      const state = base64url(crypto.getRandomValues(new Uint8Array(24)));
      sessionStorage.setItem(VERIFIER_KEY, verifier);
      sessionStorage.setItem(STATE_KEY, state);
      const login = new URL(`${pathUrl}/learner/login`);
      login.searchParams.set("courseId", courseId);
      login.searchParams.set("callbackUrl", callbackUrl);
      login.searchParams.set("codeChallenge", challenge);
      login.searchParams.set("state", state);
      window.location.assign(login);
    },
    logout: async () => {
      const token = getAccessToken();
      if (token) await apiRequest(`${pathUrl}/api/learner/auth/revoke`, { method: "POST", body: { token }, token: null }).catch(() => undefined);
      setAccessToken(null);
    },
    getRegistration,
    submit: (activitySlug: string, value: ActivityValue) => apiRequest<ProgressEvent>(`${pathUrl}/api/learner/activities/${encodeURIComponent(activitySlug)}/submissions`, { method: "POST", body: { value } }),
    attest: (activitySlug: string) => apiRequest<ProgressEvent>(`${pathUrl}/api/learner/activities/${encodeURIComponent(activitySlug)}/attestation`, { method: "POST", body: { complete: true } }),
    assertComplete: (activitySlug: string) => apiRequest<ProgressEvent>(`${pathUrl}/api/learner/activities/${encodeURIComponent(activitySlug)}/completion`, { method: "POST", body: { complete: true } }),
  };
}

export type PathSDKInstance = ReturnType<typeof pathSDK>;
export default pathSDK;
