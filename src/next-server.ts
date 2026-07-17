import { createHash, randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import type { ReactNode } from "react";
import { ACCESS_TOKEN_COOKIE, OAUTH_STATE_COOKIE, PKCE_VERIFIER_COOKIE, REFRESH_TOKEN_COOKIE } from "./constants.js";
import { createServerSDK, exchangeCode } from "./server-core.js";
import type { ServerSDKConfig, ServerTokenSet } from "./server-core.js";
import { PathProviderClient } from "./next-client.js";

export * from "./types.js";
export type { ServerSDKConfig, ServerSDKInstance } from "./server-core.js";

const secure = process.env.NODE_ENV === "production";
const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
const base64url = (value: Buffer) => value.toString("base64url");

export function createPathMiddleware(options: { pathUrl?: string } = {}) {
  return async function pathMiddleware(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const verifier = request.cookies.get(PKCE_VERIFIER_COOKIE)?.value;
    const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    if (!code || !state || !verifier || state !== expectedState) return;
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("code");
    cleanUrl.searchParams.delete("state");
    const tokens = await exchangeCode(options.pathUrl ?? process.env.PATH_URL ?? "https://path.vchlearn.ca", code, verifier, cleanUrl.toString());
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: tokens.expiresIn });
    if (tokens.refreshToken) response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, { ...cookieOptions, maxAge: tokens.refreshExpiresIn });
    response.cookies.delete(PKCE_VERIFIER_COOKIE);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  };
}

export async function pathServerSDK(config: ServerSDKConfig) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const tokens: ServerTokenSet = {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  };
  const sdk = createServerSDK(config, tokens, (next) => {
    if (next.accessToken) cookieStore.set(ACCESS_TOKEN_COOKIE, next.accessToken, { ...cookieOptions, maxAge: 15 * 60 });
    else cookieStore.delete(ACCESS_TOKEN_COOKIE);
    if (next.refreshToken) cookieStore.set(REFRESH_TOKEN_COOKIE, next.refreshToken, { ...cookieOptions, maxAge: 5 * 24 * 60 * 60 });
    else cookieStore.delete(REFRESH_TOKEN_COOKIE);
  });
  return {
    ...sdk,
    login: async (callbackUrl = sdk.courseUrl): Promise<never> => {
      if (!callbackUrl) throw new Error("[@vch-lt/path] courseUrl or callbackUrl is required for login");
      const verifier = base64url(randomBytes(32));
      const challenge = createHash("sha256").update(verifier).digest("base64url");
      const state = base64url(randomBytes(24));
      cookieStore.set(PKCE_VERIFIER_COOKIE, verifier, { ...cookieOptions, maxAge: 10 * 60 });
      cookieStore.set(OAUTH_STATE_COOKIE, state, { ...cookieOptions, maxAge: 10 * 60 });
      const url = new URL(`${sdk.pathUrl}/learner/login`);
      url.searchParams.set("courseId", sdk.courseId);
      url.searchParams.set("callbackUrl", callbackUrl);
      url.searchParams.set("codeChallenge", challenge);
      url.searchParams.set("state", state);
      const { redirect } = await import("next/navigation");
      return redirect(url.toString());
    },
  };
}

export const pathMiddleware = createPathMiddleware();
export const pathMiddlewareConfig = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

export interface PathProviderProps extends ServerSDKConfig { children: ReactNode; initialAuth?: boolean; }
export async function PathProvider({ children, initialAuth = true, ...config }: PathProviderProps) {
  const auth = initialAuth ? await (await pathServerSDK(config)).checkAuth() : undefined;
  return createElement(PathProviderClient, { initialAuth: auth, config }, children);
}
