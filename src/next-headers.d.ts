// Minimal type declarations for next/* and h3 so tsc doesn't error when they aren't installed.
// The consuming app will have full types available.
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

declare module 'h3' {
  export function getCookie(event: any, name: string): string | undefined;
  export function setCookie(event: any, name: string, value: string, options?: Record<string, unknown>): void;
  export function getQuery(event: any): Record<string, string | string[] | undefined>;
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
