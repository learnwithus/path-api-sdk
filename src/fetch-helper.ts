import type { APIError } from './types.js';

/**
 * Options for making API requests
 */
export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
}

const TOKEN_STORAGE_KEY = 'path_bearer_token';
let _token: string | null = null;

/**
 * Store the bearer token in memory and localStorage
 */
export function setToken(token: string | null): void {
  _token = token;
  if (typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

/**
 * Retrieve the bearer token from memory or localStorage
 */
export function getToken(): string | null {
  if (!_token && typeof localStorage !== 'undefined') {
    _token = localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return _token;
}

/**
 * Parse error response from API
 */
async function parseError(response: Response): Promise<APIError> {
  try {
    const error = await response.json();
    return {
      message: error.message || 'An error occurred',
      statusCode: response.status,
    };
  } catch {
    return {
      message: 'An error occurred',
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
export async function apiRequest<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const token = getToken();

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new Error(error.message || 'Request failed');
  }

  return await response.json();
}
