import { defineNuxtPlugin } from "#app";
import { setToken } from "@vch-lt/path";

export default defineNuxtPlugin(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("path-token");
  if (token) {
    setToken(token);
    params.delete("path-token");
    const search = params.toString() ? "?" + params.toString() : "";
    window.history.replaceState(null, "", window.location.pathname + search + window.location.hash);
  }
});
