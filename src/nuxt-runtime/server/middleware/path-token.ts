import { defineEventHandler, setCookie, getQuery } from "h3";
import { TOKEN_STORAGE_KEY } from "@vch-lt/path/server";

const PATH_TOKEN_CONTEXT_KEY = "pathToken";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = typeof query["path-token"] === "string" ? query["path-token"] : undefined;
  if (!token) return;

  setCookie(event, TOKEN_STORAGE_KEY, token, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Store in event context so the current SSR render is authenticated without a redirect
  event.context[PATH_TOKEN_CONTEXT_KEY] = token;
});
