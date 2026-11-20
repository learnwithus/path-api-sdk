import type {
  LearnerAPIConfig,
  SubmitProgressInput,
  Progress,
  LearnerStore,
  AuthenticatedUser,
  LearnerState,
} from "./types.js";
import { apiRequest, setToken, getToken } from "./fetch-helper.js";
import { toSubmitBody } from "./submit-payload.js";
import {
  emptyLearnerState,
  toLearnerState,
  type LearnerOverviewResponse,
} from "./learner-state.js";

export * from "./types.js";
export { apiRequest, setToken, getToken } from "./fetch-helper.js";
export { TOKEN_STORAGE_KEY } from "./constants.js";

/**
 * Look up a progress record by milestone slug.
 * Cross-references the milestones array (slug → id) with the progress array (courseMilestoneId).
 *
 * @example
 * ```ts
 * const state = await path.getLearnerState();
 * const module1 = getProgress(state, "module-1-completion");
 * console.log(module1?.value); // "true"
 * ```
 */
export function getProgress(state: LearnerState, milestoneSlug: string): Progress | undefined {
  const milestone = state.milestones.find((m) => m.slug === milestoneSlug);
  if (!milestone) return undefined;
  return state.progress.find((p) => p.courseMilestoneId === milestone.id);
}

/**
 * Factory function to create a Path SDK instance
 *
 * @example
 * ```typescript
 * export const path = pathSDK({ courseId: "your-course-id-here", courseUrl: "https://your-course-website.com" });
 *
 * // Use the SDK
 * const user = await path.checkAuth();
 * await path.submitProgress("module-1-complete");
 * ```
 */
export function pathSDK(config: LearnerAPIConfig) {
  // Read ?path-token= from the URL on first SDK instantiation (login redirect)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("path-token");
    if (urlToken) {
      setToken(urlToken);
      params.delete("path-token");
      const search = params.toString() ? `?${params.toString()}` : "";
      window.history.replaceState(null, "", window.location.pathname + search + window.location.hash);
    }
  }

  // import.meta.env is Vite's way of exposing VITE_-prefixed env vars to the browser.
  // process.env.NEXT_PUBLIC_* must be referenced as a literal expression so Next.js webpack can inline them.
  const meta = typeof import.meta !== "undefined" ? ((import.meta as { env?: Record<string, string> }).env ?? {}) : {};
  const pathUrl =
    config.pathUrl ??
    meta.VITE_PATH_URL ??
    (typeof process !== "undefined" ? process.env.PATH_URL : undefined) ??
    "https://path.vchlearn.ca";
  const courseUrl =
    config.courseUrl ||
    meta.VITE_PATH_COURSE_URL ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_PATH_COURSE_URL : undefined) ||
    (typeof process !== "undefined" ? process.env.COURSE_URL : undefined) ||
    "";
  const courseId =
    config.courseId ||
    meta.VITE_PATH_COURSE_ID ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_PATH_COURSE_ID : undefined) ||
    (typeof process !== "undefined" ? process.env.PATH_COURSE_ID : undefined) ||
    "";
  if (!courseId) {
    throw new Error("[@vch-lt/path] courseId is required. Pass it in config or set PATH_COURSE_ID in the environment.");
  }

  const getLearnerState = async (): Promise<LearnerState> => {
    try {
      const response = await apiRequest<LearnerOverviewResponse>(`${pathUrl}/api/learner?courseId=${courseId}`);
      return toLearnerState(response);
    } catch {
      return emptyLearnerState();
    }
  };

  return {
    /** Get the complete learner state. Any request failure resolves to the stable logged-out state. */
    getLearnerState,

    /**
     * Return the authenticated learner, including their read-only course attributes, or null.
     */
    checkAuth: async (): Promise<AuthenticatedUser | null> => {
      const state = await getLearnerState();
      return state.user;
    },

    /**
     * Redirect to login page
     */
    login: (callbackUrl?: string): void => {
      const callback = encodeURIComponent(callbackUrl || courseUrl);
      window.location.href = `${pathUrl}/learner/login?courseId=${courseId}&callbackUrl=${callback}`;
    },

    /**
     * Logout the current user and clear the stored token
     */
    logout: async (): Promise<void> => {
      await apiRequest(`${pathUrl}/api/learner/logout?courseId=${courseId}`, { method: "POST" });
      setToken(null);
    },

    /**
     * Submit progress for a milestone.
     *
     * For a `completion` milestone, omit the second argument (or pass `true`) to mark it complete;
     * pass `false` to mark it incomplete. For every other milestone type, a bare second argument is
     * data and marks the milestone complete. Use `{ data, complete }` to control the two fields
     * independently. An `object` milestone's value must always be wrapped as `{ data: { ... } }`,
     * because a bare plain object is read as the payload itself.
     *
     * @example
     * ```ts
     * await path.submitProgress("module-1-complete");                                  // completion milestone — done
     * await path.submitProgress("module-1-complete", false);                           // completion milestone — not done
     * await path.submitProgress("module-1-quiz", true);                                // value true, complete
     * await path.submitProgress("module-1-checkbox", { data: false, complete: true }); // value false, complete
     * await path.submitProgress("reflection", { data: "draft", complete: false });     // saved but incomplete
     * await path.submitProgress("intake-form", { data: { role: "Nurse", years: 4 } });  // object milestone
     * ```
     */
    submitProgress: async (milestoneSlug: string, valueOrPayload?: SubmitProgressInput): Promise<Progress> => {
      return await apiRequest<Progress>(`${pathUrl}/api/learner?courseId=${courseId}`, {
        method: "POST",
        body: toSubmitBody(milestoneSlug, valueOrPayload),
      });
    },

    /**
     * Get the learner's stored values, keyed by field key. A field the learner has never written
     * comes back with the default staff configured for it.
     *
     * @example
     * ```ts
     * const store = await path.getLearnerStore();
     *
     * store.notes;      // "ask about the pre-op class"
     * store.bookmarks;  // [{ title: "Nutrition guide", url: "https://…" }]
     * ```
     */
    getLearnerStore: async (): Promise<LearnerStore> => {
      return await apiRequest<LearnerStore>(`${pathUrl}/api/learner/store?courseId=${courseId}`);
    },

    /**
     * Write learner store values. Only the keys you pass are changed; the rest is left alone.
     *
     * Returns just the values written, keyed the same way — and Path normalizes what it stores, so
     * prefer these over the ones you sent.
     *
     * @example
     * ```ts
     * // a scalar field
     * await path.updateLearnerStore({ notes: "ask about the pre-op class" });
     *
     * // an object field, giving every sub-field
     * await path.updateLearnerStore({ reminder: { text: "Book follow-up", due: "2026-08-01" } });
     *
     * // a repeatable field, replacing the whole list
     * await path.updateLearnerStore({
     *   bookmarks: [{ title: "Nutrition guide", url: "https://…" }],
     * });
     * ```
     */
    updateLearnerStore: async (values: LearnerStore): Promise<LearnerStore> => {
      return await apiRequest<LearnerStore>(`${pathUrl}/api/learner/store?courseId=${courseId}`, {
        method: "POST",
        body: { values },
      });
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
