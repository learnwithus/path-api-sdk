import { defineEventHandler, setCookie, getQuery } from "h3";
import { TOKEN_STORAGE_KEY } from "@vch-lt/path/server";
import { exchangeHandoffCode } from "@vch-lt/path/server";
import { useRuntimeConfig } from "#imports";

const PATH_TOKEN_CONTEXT_KEY = "pathToken";

export default defineEventHandler(async (event) => {
  const { pathSDK } = useRuntimeConfig(event).public as { pathSDK?: { courseId?: string; pathUrl?: string } };
  const courseId = pathSDK?.courseId;
  const pathUrl = pathSDK?.pathUrl;
  if (!courseId || !pathUrl) return;

  const query = getQuery(event);
  const code = typeof query["path-code"] === "string" ? query["path-code"] : undefined;
  if (!code) return;

  const token = await exchangeHandoffCode(pathUrl, courseId, code);

  setCookie(event, TOKEN_STORAGE_KEY, token, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Store in event context so the current SSR render is authenticated without a redirect
  event.context[PATH_TOKEN_CONTEXT_KEY] = token;
});
