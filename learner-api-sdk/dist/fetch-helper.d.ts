/**
 * Options for making API requests
 */
export interface FetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, unknown>;
}
/**
 * Make an authenticated API request
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws {Error} If the request fails
 */
export declare function apiRequest<T = unknown>(url: string, options?: FetchOptions): Promise<T>;
//# sourceMappingURL=fetch-helper.d.ts.map