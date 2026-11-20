// Type-check-only environment for src/typescript/nuxt-runtime (see tsconfig.nuxt-runtime.json).
// A real Nuxt app gets these from its generated .nuxt/tsconfig.json: Nitro's augmentation makes
// useRequestEvent() return h3's H3Event, as consumers of this module see it.
import "@nuxt/nitro-server/augments";
