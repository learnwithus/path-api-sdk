// This barrel exists only for TypeScript declaration generation.
// At runtime, the "./next" export in package.json uses conditional exports:
//   - react-server → next-server.js  (Server Components, Route Handlers, middleware)
//   - default      → next-client.js  (Client Components, PathProvider, usePath)

export * from "./next-server.js";
export * from "./next-client.js";
