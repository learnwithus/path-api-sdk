import type { APIError } from './types.js';

/**
 * Options for making API requests
 */
export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
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
 * Make an authenticated API request
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

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new Error(error.message || 'Request failed');
  }

  return await response.json();
}
