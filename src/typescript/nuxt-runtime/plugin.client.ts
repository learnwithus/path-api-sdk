import { defineNuxtPlugin, useRouter } from "#app";
import { setToken } from "@vch-lt/path";

const TOKEN_PARAM = "path-token";

export default defineNuxtPlugin((nuxtApp) => {
  const token = new URLSearchParams(window.location.search).get(TOKEN_PARAM);
  if (!token) return;

  setToken(token);

  // Nuxt's router plugin captures the initial URL before this plugin runs and replays it with
  // router.replace() during app:created, so removing the param from window.history here would be
  // undone. Remove it through the router once the initial navigation has finished.
  const router = useRouter();
  nuxtApp.hooks.hookOnce("app:mounted", async () => {
    const route = router.currentRoute.value;
    if (!(TOKEN_PARAM in route.query)) return;

    const { [TOKEN_PARAM]: _token, ...query } = route.query;
    await router.replace({ path: route.path, query, hash: route.hash });
  });
});
