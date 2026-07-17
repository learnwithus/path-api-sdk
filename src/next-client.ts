"use client";

import { createContext, createElement, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getActivity, pathSDK } from "./index.js";
import type { ActivityValue, AuthStatus, LearnerAPIConfig, ProgressEvent } from "./types.js";

export * from "./types.js";
export { pathSDK as pathClientSDK, getActivity } from "./index.js";
export type { PathSDKInstance } from "./index.js";

interface PathContextValue {
  auth: AuthStatus;
  getActivity: (slug: string) => ReturnType<typeof getActivity>;
  submit: (slug: string, value: ActivityValue) => Promise<ProgressEvent>;
  attest: (slug: string) => Promise<ProgressEvent>;
  assertComplete: (slug: string) => Promise<ProgressEvent>;
  login: (callbackUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
const PathContext = createContext<PathContextValue | null>(null);

export interface PathProviderClientProps {
  initialAuth?: AuthStatus;
  config?: Partial<LearnerAPIConfig>;
  children?: ReactNode;
}

export function PathProviderClient({ initialAuth, config, children }: PathProviderClientProps) {
  const sdkRef = useRef<ReturnType<typeof pathSDK> | null>(null);
  if (!sdkRef.current) sdkRef.current = pathSDK({ courseUrl: typeof window === "undefined" ? "" : window.location.href, ...config } as LearnerAPIConfig);
  const sdk = sdkRef.current;
  const [auth, setAuth] = useState<AuthStatus>(initialAuth ?? { isAuthenticated: false });
  const refreshAuth = useCallback(async () => setAuth(await sdk.checkAuth()), [sdk]);
  const mutate = useCallback(async (operation: () => Promise<ProgressEvent>) => {
    const result = await operation();
    await refreshAuth();
    return result;
  }, [refreshAuth]);
  const logout = useCallback(async () => { await sdk.logout(); setAuth({ isAuthenticated: false }); }, [sdk]);
  const value = useMemo<PathContextValue>(() => ({
    auth,
    getActivity: (slug) => auth.registration ? getActivity(auth.registration, slug) : undefined,
    submit: (slug, activityValue) => mutate(() => sdk.submit(slug, activityValue)),
    attest: (slug) => mutate(() => sdk.attest(slug)),
    assertComplete: (slug) => mutate(() => sdk.assertComplete(slug)),
    login: sdk.login,
    logout,
    refreshAuth,
  }), [auth, sdk, logout, mutate, refreshAuth]);
  return createElement(PathContext.Provider, { value }, children);
}

export function usePath() {
  const context = useContext(PathContext);
  if (!context) throw new Error("usePath() must be used within a <PathProvider>");
  return context;
}
