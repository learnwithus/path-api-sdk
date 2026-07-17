import { useAsyncData, useRequestEvent, useRuntimeConfig } from "#app";
import pathSDK, { getActivity } from "@vch-lt/path";
import { pathNuxtSDK } from "@vch-lt/path/nuxt";
import type { ActivityValue, RegistrationView } from "@vch-lt/path";

function config() {
  return (useRuntimeConfig().public as { pathSDK: { courseId: string; pathUrl: string; courseUrl?: string } }).pathSDK;
}
const serverSDK = () => pathNuxtSDK(useRequestEvent(), config());
const clientSDK = () => pathSDK({ ...config(), courseUrl: config().courseUrl ?? window.location.href });

export const usePath = () => ({
  checkAuth: () => useAsyncData("path-auth", () => import.meta.server ? serverSDK().then((sdk) => sdk.checkAuth()) : clientSDK().checkAuth()),
  getRegistration: () => useAsyncData("path-registration", () => import.meta.server ? serverSDK().then((sdk) => sdk.getRegistration()) : clientSDK().getRegistration()),
  submit: (slug: string, value: ActivityValue) => import.meta.server ? serverSDK().then((sdk) => sdk.submit(slug, value)) : clientSDK().submit(slug, value),
  attest: (slug: string) => import.meta.server ? serverSDK().then((sdk) => sdk.attest(slug)) : clientSDK().attest(slug),
  assertComplete: (slug: string) => import.meta.server ? serverSDK().then((sdk) => sdk.assertComplete(slug)) : clientSDK().assertComplete(slug),
  login: (callbackUrl?: string) => { if (import.meta.client) return clientSDK().login(callbackUrl); },
  logout: () => import.meta.server ? serverSDK().then((sdk) => sdk.revoke()) : clientSDK().logout(),
  getActivity: (registration: RegistrationView, slug: string) => getActivity(registration, slug),
});
