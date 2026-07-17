import type { APIError } from "./types.js";

export interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
  token?: string | null;
}

let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

async function parseError(response: Response): Promise<APIError> {
  const body = await response.json().catch(() => ({})) as { message?: string };
  return { message: body.message ?? "Request failed", statusCode: response.status };
}

export async function apiRequest<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const token = options.token === undefined ? accessToken : options.token;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!response.ok) {
    const error = await parseError(response);
    throw Object.assign(new Error(error.message), { statusCode: error.statusCode });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
