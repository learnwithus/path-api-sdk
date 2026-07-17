import { createServerSDK } from "./server-core.js";
import type { ServerSDKConfig, ServerSDKInstance, ServerTokenSet } from "./server-core.js";

export * from "./types.js";
export type { ServerSDKConfig, ServerSDKInstance, ServerTokenSet } from "./server-core.js";
export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, PKCE_VERIFIER_COOKIE, OAUTH_STATE_COOKIE } from "./constants.js";

export interface ServerSDKOptions extends ServerSDKConfig, ServerTokenSet {
  onTokens?: (tokens: ServerTokenSet) => void | Promise<void>;
}

export function pathServerSDK(options: ServerSDKOptions): ServerSDKInstance {
  const { accessToken, refreshToken, onTokens, ...config } = options;
  return createServerSDK(config, { accessToken, refreshToken }, onTokens);
}
