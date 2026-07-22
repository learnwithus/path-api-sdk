"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { pathSDK, getProgress as _getProgress } from "./index.js";
import type { AuthStatus, Enrollment, LearnerAPIConfig, Progress, SubmitProgressInput } from "./types.js";

export type {
  AuthStatus,
  Enrollment,
  LearnerAPIConfig,
  MilestoneType,
  MilestoneValue,
  SubmitProgressInput,
  SubmitProgressPayload,
} from "./types.js";
export type { Progress, User, Course, Milestone } from "./types.js";

// Re-export the client-side SDK and utilities for direct use in Client Components
export { pathSDK as pathClientSDK, getProgress } from "./index.js";
export type { PathSDKInstance } from "./index.js";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PathContextValue {
  auth: AuthStatus;
  isLoading: boolean;
  getProgress: (milestoneSlug: string) => Progress | undefined;
  submitProgress: (milestoneSlug: string, valueOrPayload?: SubmitProgressInput) => Promise<Progress>;
  login: (callbackUrl?: string) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const PathContext = createContext<PathContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface PathProviderClientProps {
  /** Server-fetched auth status for hydration. If omitted, fetches on mount. */
  initialAuth?: AuthStatus;
  /** SDK configuration. Falls back to NEXT_PUBLIC_* env vars if omitted. */
  config?: Partial<LearnerAPIConfig>;
  children?: ReactNode;
}

export function PathProviderClient({ initialAuth, config, children }: PathProviderClientProps) {
  // Create SDK instance once
  const sdkRef = useRef<ReturnType<typeof pathSDK> | null>(null);
  if (sdkRef.current === null) {
    sdkRef.current = pathSDK({
      courseUrl: typeof window !== "undefined" ? window.location.origin : "",
      ...config,
    } as LearnerAPIConfig);
  }
  const sdk = sdkRef.current;

  const [auth, setAuth] = useState<AuthStatus>(() => initialAuth ?? { isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(!initialAuth);

  // If no initialAuth was provided, fetch on mount
  useEffect(() => {
    if (initialAuth) return;
    let cancelled = false;
    sdk.checkAuth().then((result) => {
      if (!cancelled) {
        setAuth(result);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitProgress = useCallback(
    async (milestoneSlug: string, valueOrPayload?: SubmitProgressInput) => {
      const progress = await sdk.submitProgress(milestoneSlug, valueOrPayload);
      setAuth((prev) => {
        if (!prev.enrollment) return prev;
        const existing = prev.enrollment.progress ?? [];
        const idx = existing.findIndex((p) => p.courseMilestoneId === progress.courseMilestoneId);
        const updated = idx >= 0 ? existing.map((p, i) => (i === idx ? progress : p)) : [...existing, progress];
        return {
          ...prev,
          enrollment: { ...prev.enrollment, progress: updated },
        };
      });
      return progress;
    },
    [sdk],
  );

  const refreshAuth = useCallback(async () => {
    const result = await sdk.checkAuth();
    setAuth(result);
  }, [sdk]);

  const logout = useCallback(async () => {
    await sdk.logout();
    setAuth({ isAuthenticated: false });
  }, [sdk]);

  const getProgress = useCallback(
    (milestoneSlug: string): Progress | undefined => {
      if (!auth.enrollment) return undefined;
      return _getProgress(auth.enrollment, milestoneSlug);
    },
    [auth],
  );

  const value = useMemo<PathContextValue>(
    () => ({
      auth,
      isLoading,
      getProgress,
      submitProgress,
      login: sdk.login,
      logout,
      refreshAuth,
    }),
    [auth, isLoading, getProgress, submitProgress, sdk.login, logout, refreshAuth],
  );

  return createElement(PathContext.Provider, { value }, children);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Access reactive Path auth, enrollment, and progress state.
 * Must be used within a `<PathProvider>`.
 */
export function usePath(): PathContextValue {
  const ctx = useContext(PathContext);
  if (!ctx) {
    throw new Error("usePath() must be used within a <PathProvider>");
  }
  return ctx;
}
