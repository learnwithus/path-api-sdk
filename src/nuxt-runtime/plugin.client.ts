import { defineNuxtPlugin, useRuntimeConfig } from "#app";
import { initializeTokenFromCode } from "@vch-lt/path";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public as { pathSDK?: { courseId?: string; pathUrl?: string } };
  const courseId = config.pathSDK?.courseId;
  const pathUrl = config.pathSDK?.pathUrl;
  if (!courseId || !pathUrl) return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("path-code");
  if (code) {
    void initializeTokenFromCode(pathUrl, courseId, code);
    params.delete("path-code");
    const search = params.toString() ? "?" + params.toString() : "";
    window.history.replaceState(null, "", window.location.pathname + search + window.location.hash);
  }
});
