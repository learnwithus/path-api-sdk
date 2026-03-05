// Minimal type declaration for next/headers so tsc doesn't error when next isn't installed.
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
}
