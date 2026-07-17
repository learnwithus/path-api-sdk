import { createHash, randomBytes } from "node:crypto";
import { defineNuxtModule, createResolver, addImportsDir, addServerHandler } from "@nuxt/kit";
import type { H3Event } from "h3";
import { ACCESS_TOKEN_COOKIE, OAUTH_STATE_COOKIE, PKCE_VERIFIER_COOKIE, REFRESH_TOKEN_COOKIE } from "./constants.js";
import { createServerSDK, exchangeCode } from "./server-core.js";
import type { ServerSDKConfig } from "./server-core.js";

export * from "./types.js";
export type { ServerSDKConfig, ServerSDKInstance } from "./server-core.js";
export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./constants.js";

export interface ModuleOptions { courseId: string; pathUrl?: string; courseUrl?: string; }
export default defineNuxtModule<ModuleOptions>({
  meta: { name: "@vch-lt/path", configKey: "path" },
  defaults: { pathUrl: "https://path.vchlearn.ca" },
  // Nuxt's module container type is intentionally not part of the SDK's public declarations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup(options: ModuleOptions, nuxt: any) {
    if (!options.courseId) throw new Error("[@vch-lt/path] courseId is required");
    nuxt.options.runtimeConfig.public.pathSDK = options;
    const resolver = createResolver(import.meta.url);
    addServerHandler({ middleware: true, handler: resolver.resolve("./nuxt-runtime/server/middleware/auth-callback") });
    addImportsDir(resolver.resolve("./nuxt-runtime/composables"));
  },
});

const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

export function createPathH3Middleware(options: { pathUrl?: string } = {}) {
  return async (event: H3Event) => {
    const { getCookie, getQuery, getRequestURL, sendRedirect, setCookie, deleteCookie } = await import("h3");
    const query = getQuery(event);
    const code = typeof query.code === "string" ? query.code : null;
    const state = typeof query.state === "string" ? query.state : null;
    const verifier = getCookie(event, PKCE_VERIFIER_COOKIE);
    if (!code || !state || !verifier || state !== getCookie(event, OAUTH_STATE_COOKIE)) return;
    const cleanUrl = getRequestURL(event);
    cleanUrl.searchParams.delete("code");
    cleanUrl.searchParams.delete("state");
    const tokens = await exchangeCode(options.pathUrl ?? process.env.PATH_URL ?? "https://path.vchlearn.ca", code, verifier, cleanUrl.toString());
    setCookie(event, ACCESS_TOKEN_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: tokens.expiresIn });
    if (tokens.refreshToken) setCookie(event, REFRESH_TOKEN_COOKIE, tokens.refreshToken, { ...cookieOptions, maxAge: tokens.refreshExpiresIn });
    deleteCookie(event, PKCE_VERIFIER_COOKIE);
    deleteCookie(event, OAUTH_STATE_COOKIE);
    return sendRedirect(event, cleanUrl.toString());
  };
}

export async function pathNuxtSDK(event: H3Event, config: ServerSDKConfig) {
  const { deleteCookie, getCookie, setCookie } = await import("h3");
  const sdk = createServerSDK(config, {
    accessToken: getCookie(event, ACCESS_TOKEN_COOKIE) ?? null,
    refreshToken: getCookie(event, REFRESH_TOKEN_COOKIE) ?? null,
  }, (tokens) => {
    if (tokens.accessToken) setCookie(event, ACCESS_TOKEN_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 });
    else deleteCookie(event, ACCESS_TOKEN_COOKIE);
    if (tokens.refreshToken) setCookie(event, REFRESH_TOKEN_COOKIE, tokens.refreshToken, { ...cookieOptions, maxAge: 5 * 24 * 60 * 60 });
    else deleteCookie(event, REFRESH_TOKEN_COOKIE);
  });
  return {
    ...sdk,
    getLoginUrl: (callbackUrl = sdk.courseUrl) => {
      if (!callbackUrl) throw new Error("[@vch-lt/path] courseUrl or callbackUrl is required for login");
      const verifier = randomBytes(32).toString("base64url");
      const state = randomBytes(24).toString("base64url");
      setCookie(event, PKCE_VERIFIER_COOKIE, verifier, { ...cookieOptions, maxAge: 10 * 60 });
      setCookie(event, OAUTH_STATE_COOKIE, state, { ...cookieOptions, maxAge: 10 * 60 });
      const login = new URL(`${sdk.pathUrl}/learner/login`);
      login.searchParams.set("courseId", sdk.courseId);
      login.searchParams.set("callbackUrl", callbackUrl);
      login.searchParams.set("codeChallenge", createHash("sha256").update(verifier).digest("base64url"));
      login.searchParams.set("state", state);
      return login.toString();
    },
  };
}
