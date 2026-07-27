"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { pathSDK, getProgress as _getProgress } from "./index.js";
import type {
  AuthStatus,
  Enrollment,
  LearnerAPIConfig,
  Progress,
  SubmitProgressInput,
  LearnerStore,
} from "./types.js";

export type {
  AuthStatus,
  Enrollment,
  LearnerAPIConfig,
  MilestoneType,
  MilestoneValue,
  SubmitProgressInput,
  SubmitProgressPayload,
  LearnerStore,
  LearnerStoreScalarValue,
  LearnerStoreObjectValue,
  LearnerStoreValue,
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

interface InternalPathContextValue extends PathContextValue {
  sdk: ReturnType<typeof pathSDK>;
}

const PathContext = createContext<InternalPathContextValue | null>(null);

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

  const value = useMemo<InternalPathContextValue>(
    () => ({
      sdk,
      auth,
      isLoading,
      getProgress,
      submitProgress,
      login: sdk.login,
      logout,
      refreshAuth,
    }),
    [sdk, auth, isLoading, getProgress, submitProgress, logout, refreshAuth],
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

export interface UseLearnerStoreResult {
  /** The learner store, keyed by field key, or null until the first load finishes. */
  learnerStore: LearnerStore | null;
  isLoading: boolean;
  /** The error from the last load or save, if one failed. */
  error: Error | null;
  /** Write values and merge the result into local state. Only the keys you pass are changed. */
  update: (values: LearnerStore) => Promise<void>;
  /** Re-read the learner store from Path. */
  refresh: () => Promise<void>;
}

/**
 * Read and write the learner store.
 *
 * Deliberately separate from `usePath()`: the provider fetches auth for every app, and folding the
 * the learner store in would cost a second request whether or not an app uses the feature. Call this hook
 * only in the components that need it.
 *
 * Requires a `<PathProvider>` above it, for the SDK configuration.
 *
 * @example
 * ```tsx
 * "use client";
 * import { useLearnerStore } from '@vch-lt/path/next';
 *
 * export function Notes() {
 *   const { learnerStore, isLoading, update } = useLearnerStore();
 *   if (isLoading) return <p>Loading…</p>;
 *
 *   return (
 *     <textarea
 *       defaultValue={String(learnerStore?.notes ?? "")}
 *       onBlur={(e) => update({ notes: e.target.value })}
 *     />
 *   );
 * }
 * ```
 */
export function useLearnerStore(config?: Partial<LearnerAPIConfig>): UseLearnerStoreResult {
  const ctx = useContext(PathContext);
  if (!ctx) {
    throw new Error("useLearnerStore() must be used within a <PathProvider>");
  }

  const sdkRef = useRef<ReturnType<typeof pathSDK> | null>(null);
  if (config && sdkRef.current === null) {
    sdkRef.current = pathSDK({
      courseUrl: typeof window !== "undefined" ? window.location.origin : "",
      ...config,
    } as LearnerAPIConfig);
  }
  const sdk = sdkRef.current ?? ctx.sdk;

  const [learnerStore, setLearnerStore] = useState<LearnerStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setLearnerStore(await sdk.getLearnerStore());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  useEffect(() => {
    let cancelled = false;
    sdk
      .getLearnerStore()
      .then((loaded) => {
        if (!cancelled) setLearnerStore(loaded);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught : new Error(String(caught)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sdk]);

  /**
   * Merges the values the server stored rather than the ones passed in, since Path normalizes what
   * it writes.
   */
  const update = useCallback(
    async (values: LearnerStore) => {
      try {
        const written = await sdk.updateLearnerStore(values);
        setLearnerStore((previous) => ({ ...previous, ...written }));
        setError(null);
      } catch (caught) {
        const asError = caught instanceof Error ? caught : new Error(String(caught));
        setError(asError);
        throw asError;
      }
    },
    [sdk],
  );

  return { learnerStore, isLoading, error, update, refresh };
}
