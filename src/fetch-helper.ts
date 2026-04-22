import { parse, serialize } from "cookie";
import type { APIError } from "./types.js";
import { TOKEN_STORAGE_KEY } from "./constants.js";

/**
 * Options for making API requests
 */
export interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
}
let _token: string | null = null;
let _tokenInit: Promise<void> | null = null;

/**
 * Store the bearer token in memory and a cookie on the course domain (accessible to SSR).
 */
export function setToken(token: string | null): void {
  _token = token;
  if (typeof document !== "undefined") {
    if (token) {
      document.cookie = serialize(TOKEN_STORAGE_KEY, token, {
        path: "/",
        sameSite: "lax",
        secure: location.protocol === "https:",
      });
    } else {
      document.cookie = serialize(TOKEN_STORAGE_KEY, "", {
        path: "/",
        expires: new Date(0),
      });
    }
  }
}

/**
 * Retrieve the bearer token from memory or the cookie.
 */
export function getToken(): string | null {
  if (!_token && typeof document !== "undefined") {
    _token = parse(document.cookie)[TOKEN_STORAGE_KEY] ?? null;
  }
  return _token;
}

/**
 * Exchange a short-lived handoff code from the Path login redirect for a bearer token.
 */
export function initializeTokenFromCode(pathUrl: string, courseId: string, code: string): Promise<void> {
  _tokenInit = (async () => {
    const url = new URL(`${pathUrl}/api/learner/exchange-code`);
    url.searchParams.set("courseId", courseId);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error.message || "Failed to exchange Path login code");
    }

    const result = (await response.json()) as { token?: string };
    if (!result.token) {
      throw new Error("Path login code exchange returned no token");
    }

    setToken(result.token);
  })();

  return _tokenInit;
}

/**
 * Parse error response from API
 */
async function parseError(response: Response): Promise<APIError> {
  try {
    const error = await response.json();
    return {
      message: error.message || "An error occurred",
      statusCode: response.status,
    };
  } catch {
    return {
      message: "An error occurred",
      statusCode: response.status,
    };
  }
}

/**
 * Make an authenticated API request using a bearer token
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws {Error} If the request fails
 */
export async function apiRequest<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body } = options;
  if (_tokenInit) await _tokenInit;
  const token = getToken();

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  // If Better Auth issued a refreshed session token, update our stored copy
  const refreshedToken = response.headers.get("set-auth-token");
  if (refreshedToken) setToken(refreshedToken);

  if (!response.ok) {
    const error = await parseError(response);
    throw new Error(error.message || "Request failed");
  }

  return await response.json();
}
