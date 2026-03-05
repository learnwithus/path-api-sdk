// Minimal type declarations for next/* so tsc doesn't error when next isn't installed.
// The consuming Next.js app will have full next types available.
declare module 'next/headers' {
  interface RequestCookie {
    name: string;
    value: string;
  }
  interface ReadonlyRequestCookies {
    get(name: string): RequestCookie | undefined;
  }
  export function cookies(): Promise<ReadonlyRequestCookies>;
  export function headers(): Promise<ReadonlyHeaders>;
  interface ReadonlyHeaders {
    get(name: string): string | null;
  }
}

declare module 'next/server' {
  export class NextRequest {
    nextUrl: URL & { searchParams: URLSearchParams; clone(): URL & { searchParams: URLSearchParams } };
    headers: Headers;
  }
  export class NextResponse {
    static next(init?: { request?: { headers?: Headers } }): NextResponse;
    static rewrite(url: URL | string, init?: { request?: { headers?: Headers } }): NextResponse;
    cookies: { set(name: string, value: string, options?: Record<string, unknown>): void };
    headers: Headers;
  }
}
