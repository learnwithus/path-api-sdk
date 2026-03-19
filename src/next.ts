// Barrel for TypeScript declaration generation and the runtime entry point.
// At runtime, the consuming app's bundler follows the imports to next-server.js
// and next-client.js, respecting the "use client" boundary in next-client.js.

export * from "./next-server.js";
export * from "./next-client.js";
