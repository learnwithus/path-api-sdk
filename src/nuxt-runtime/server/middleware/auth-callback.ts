import { useRuntimeConfig } from "#imports";
import { defineEventHandler } from "h3";
import { createPathH3Middleware } from "@vch-lt/path/nuxt";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const pathConfig = config.public.pathSDK as { pathUrl?: string };
  return createPathH3Middleware({ pathUrl: pathConfig.pathUrl })(event);
});
