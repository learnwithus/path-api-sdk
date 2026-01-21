/**
 * Parse error response from API
 */
async function parseError(response) {
    try {
        const error = await response.json();
        return {
            message: error.message || 'An error occurred',
            statusCode: response.status,
        };
    }
    catch {
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
export async function apiRequest(url, options = {}) {
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
//# sourceMappingURL=fetch-helper.js.map