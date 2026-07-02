import { useAsyncData, useRequestEvent, useRuntimeConfig } from "#app";
import pathSDK, { getProgress as _getProgress } from "@vch-lt/path";
import { pathNuxtSDK as _pathNuxtSDK } from "@vch-lt/path/nuxt";
import type { MilestoneValue, SubmitProgressPayload, Enrollment } from "@vch-lt/path";

function _config() {
  // runtimeConfig.public is available on both server and client
  const { pathSDK: cfg } = useRuntimeConfig().public as { pathSDK: { courseId: string; pathUrl: string } };
  return cfg;
}

function _serverSDK() {
  const cfg = _config();
  return _pathNuxtSDK(useRequestEvent(), cfg);
}

function _clientSDK() {
  const cfg = _config();
  return pathSDK({ ...cfg, courseUrl: window.location.origin });
}

/**
 * Universal Path composable. Works in pages, components, and layouts on both server and client.
 * Data-fetching methods use useAsyncData — fetched on the server during SSR, reused on the client
 * without a second network request.
 *
 * @example
 * const { data: auth } = await usePath().checkAuth();
 * if (!auth.value?.isAuthenticated) usePath().login(window.location.href);
 */
export const usePath = () => ({
  /** Check auth status. SSR-safe — result is shared between server and client render. */
  checkAuth: () =>
    useAsyncData("path-auth", async () =>
      import.meta.server ? (await _serverSDK()).checkAuth() : _clientSDK().checkAuth(),
    ),

  /** Get full enrollment and progress data. SSR-safe. */
  getEnrollmentAndProgress: () =>
    useAsyncData("path-enrollment", async () =>
      import.meta.server ? (await _serverSDK()).getEnrollmentAndProgress() : _clientSDK().getEnrollmentAndProgress(),
    ),

  /** Submit a milestone progress value, or a `{ data, complete }` payload. Works on server and client. */
  submitProgress: async (milestoneSlug: string, valueOrPayload: MilestoneValue | SubmitProgressPayload) =>
    import.meta.server
      ? (await _serverSDK()).submitProgress(milestoneSlug, valueOrPayload)
      : _clientSDK().submitProgress(milestoneSlug, valueOrPayload),

  /** Redirect to the Path login page. Client-only. */
  login: (callbackUrl?: string) => {
    if (import.meta.client) _clientSDK().login(callbackUrl);
  },

  /** Clear the session and log out. Client-only. */
  logout: async () => {
    if (import.meta.client) await _clientSDK().logout();
  },

  /** Look up a progress record by milestone slug. Requires enrollment data. */
  getProgress: (enrollment: Enrollment, milestoneSlug: string) =>
    _getProgress(enrollment, milestoneSlug),
});
