import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_AUTH_COOKIE_NAME } from "@/lib/supabase/authCookieName";

export const DEVICE_TOKEN_COOKIE = "aa-device-token";
export const DEVICE_TOKEN_MAX_AGE = 60 * 60 * 24 * 365;

export interface ActiveDeviceSession {
  user: User;
  authSessionId: string;
  deviceSessionId: string;
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateDeviceToken() {
  return randomBytes(32).toString("base64url");
}

export function hashDeviceToken(token: string) {
  return tokenHash(token);
}

export function deviceCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: DEVICE_TOKEN_MAX_AGE,
    priority: "high" as const,
  };
}

const CONCURRENT_REFRESH_RETRY_BASE_MS = 250;
const CONCURRENT_REFRESH_RETRY_JITTER_MS = 150;

// Supabase (GoTrue) rotates refresh tokens on every use and only lets one
// refresh through at a time. A second caller racing the same expired access
// token gets this 409 back instead of a session -- it means "someone else is
// already refreshing," not "this session is invalid." Treating it as the
// latter is what force-logged out students with perfectly valid sessions
// (reproduced in prod logs: 8 of these firing within 52ms of one dashboard
// load, on 2026-09-14T18:48:33Z). `status`/`code` are real instance fields
// on AuthApiError (see @supabase/auth-js lib/errors.js), not just
// console-formatting, so matching on them is stable across call sites.
function isConcurrentRefreshConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { status?: unknown }).status === 409 &&
    (error as { code?: unknown }).code === "conflict"
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Next.js's own control-flow signals (redirect(), notFound(), and the
// static-generation "can this route be static" probe that cookies() trips)
// are plain thrown Errors tagged with a `digest`, and can pass through this
// module's try/catch since it calls cookies() via createClient(). They are
// never a Supabase error and always need to keep propagating untouched --
// this only decides what NOT to log, so the diagnostics below don't get
// confused by them. Matches Next's own detection exactly: redirect-error.js
// and http-access-fallback.js both split the digest on ";" and compare only
// the first segment by strict equality -- not a prefix match on the raw
// string, which could over-match a future digest that merely starts with
// the same characters before its own ";". DYNAMIC_SERVER_USAGE (from
// hooks-server-context.js) carries no ";"-delimited suffix, so splitting it
// is a no-op and exact equality still applies.
function isNextInternalControlFlowError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  if (typeof digest !== "string") return false;
  const code = digest.split(";", 1)[0];
  return code === "DYNAMIC_SERVER_USAGE" || code === "NEXT_REDIRECT" || code === "NEXT_HTTP_ERROR_FALLBACK";
}

// Temporary diagnostic: captures whatever fields exist on a Supabase error so
// we can see the exact status/code/message for the identity-check failures
// that don't fit the concurrent-refresh shape, instead of them collapsing
// into an unexplained "no-identity" denial with zero detail (as happened on
// 2026-09-15T01:44). Safe against non-Error/non-object throws too.
function describeError(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { name?: unknown; message?: unknown; status?: unknown; code?: unknown };
    return JSON.stringify({
      name: typeof e.name === "string" ? e.name : undefined,
      message: typeof e.message === "string" ? e.message : undefined,
      status: e.status,
      code: e.code,
    });
  }
  return JSON.stringify({ value: String(error) });
}

// Temporary diagnostic (2026-09-17 AuthSessionMissingError investigation):
// reconstructs the auth cookie's value using the exact same algorithm
// @supabase/ssr uses internally (see combineChunks/decodeChunkedCookieValue
// in node_modules/@supabase/ssr/src/cookies.ts) so that if getUser() ever
// reports AuthSessionMissingError again while sb-arabautomators-auth-token*
// cookies ARE present, this pins down exactly which step fails -- a missing
// chunk, corrupt base64url, invalid JSON, or a parsed session missing an
// expected field -- instead of another denial with zero further detail.
// Never logs the token/session content itself, only shape/length/validity.
function inspectAuthCookie(allCookies: { name: string; value: string }[]) {
  const byName = new Map(allCookies.map((c) => [c.name, c.value]));
  if (!byName.has(SUPABASE_AUTH_COOKIE_NAME) && !byName.has(`${SUPABASE_AUTH_COOKIE_NAME}.0`)) {
    return;
  }

  let raw = byName.get(SUPABASE_AUTH_COOKIE_NAME) ?? null;
  let chunkCount = 0;
  if (raw === null) {
    const parts: string[] = [];
    for (let i = 0; ; i++) {
      const chunk = byName.get(`${SUPABASE_AUTH_COOKIE_NAME}.${i}`);
      if (chunk === undefined) break;
      parts.push(chunk);
      chunkCount++;
    }
    raw = parts.length > 0 ? parts.join("") : null;
  }

  if (raw === null) {
    console.warn("[device-session] cookie-inspect: no value found under any chunk name");
    return;
  }
  console.warn(`[device-session] cookie-inspect: chunkCount=${chunkCount || "unchunked"} rawLength=${raw.length}`);

  const BASE64_PREFIX = "base64-";
  if (!raw.startsWith(BASE64_PREFIX)) {
    console.warn("[device-session] cookie-inspect: value has no base64- prefix (unexpected for cookieEncoding=base64url)");
    return;
  }

  let decoded: string;
  try {
    decoded = Buffer.from(raw.slice(BASE64_PREFIX.length), "base64url").toString("utf8");
  } catch (e) {
    console.warn(`[device-session] cookie-inspect: base64url decode threw: ${String(e)}`);
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch (e) {
    console.warn(
      `[device-session] cookie-inspect: JSON.parse failed (decodedLength=${decoded.length}): ${String(e)}`,
    );
    return;
  }

  const session = parsed as {
    expires_at?: unknown;
    access_token?: unknown;
    refresh_token?: unknown;
    user?: { id?: unknown };
  };
  console.warn(
    `[device-session] cookie-inspect: parsed OK, expires_at=${session.expires_at} hasAccessToken=${typeof session.access_token === "string"} hasRefreshToken=${typeof session.refresh_token === "string"} userId=${session.user?.id ?? "none"}`,
  );
}

async function fetchIdentityOnce(attempt: 1 | 2) {
  // Diagnostic only, names not values -- distinguishes "the auth cookie
  // genuinely wasn't sent on this request" (a browser/client-side question)
  // from "it was present but getUser() still reported no session" (a
  // server-side parsing/validation question), for AuthSessionMissingError.
  const allCookies = (await cookies()).getAll();
  console.warn(
    `[device-session] attempt=${attempt} cookies present: ${allCookies.map((c) => c.name).join(", ") || "(none)"}`,
  );
  inspectAuthCookie(allCookies);

  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError) {
    console.warn(`[device-session] attempt=${attempt} getClaims() error: ${describeError(claimsError)}`);
  }
  if (isConcurrentRefreshConflict(claimsError)) throw claimsError;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.warn(`[device-session] attempt=${attempt} getUser() error: ${describeError(userError)}`);
  }
  if (isConcurrentRefreshConflict(userError)) throw userError;

  const user = userData.user;
  const authSessionId = claimsData?.claims?.session_id;

  if (!user || typeof authSessionId !== "string") {
    // The case that produced an unexplained "no-identity" denial last time:
    // no thrown error at all, just an unusable result. Log what we actually
    // got so a repeat is diagnosable instead of another silent null.
    console.warn(
      `[device-session] attempt=${attempt} fetchIdentityOnce returning null: hasUser=${Boolean(user)} authSessionIdType=${typeof authSessionId} claimsError=${claimsError ? describeError(claimsError) : "none"} userError=${userError ? describeError(userError) : "none"}`,
    );
    return null;
  }
  return { user, authSessionId };
}

// Every caller in a request (requireDeviceSession, getModulesWithSessions,
// requireAdmin, ...) used to run this independently, which is exactly the
// race above but within a single page load instead of across separate
// requests. React's cache() gives every caller in one render pass the same
// in-flight promise instead of each starting its own Supabase Auth round
// trip. The cache lives on that render's own dispatcher object, not on
// module-level state (verified against react.react-server.development.js's
// `exports.cache`), so a new request gets a brand-new, empty cache -- this
// cannot leak a session between requests or students. It also has no effect
// at all outside a render pass (e.g. in Route Handlers, which aren't part of
// the React component tree per Next's docs -- it degrades to a plain
// passthrough there), which is why the retry below lives in the function
// itself rather than relying on caching to cover Route Handler callers.
const getAuthenticatedIdentity = cache(async function getAuthenticatedIdentity() {
  try {
    return await fetchIdentityOnce(1);
  } catch (error) {
    if (isNextInternalControlFlowError(error)) throw error;
    console.warn(`[device-session] attempt=1 threw: ${describeError(error)}`);
    if (!isConcurrentRefreshConflict(error)) throw error;
    // One retry, after giving the winning refresh a moment to land. If it
    // conflicts again, let it throw -- surface a failed request rather than
    // silently reporting "no session" and triggering a false logout.
    await wait(CONCURRENT_REFRESH_RETRY_BASE_MS + Math.random() * CONCURRENT_REFRESH_RETRY_JITTER_MS);
    try {
      const result = await fetchIdentityOnce(2);
      console.warn(`[device-session] retry ${result ? "succeeded" : "returned null (see attempt=2 log above)"}`);
      return result;
    } catch (retryError) {
      if (isNextInternalControlFlowError(retryError)) throw retryError;
      const sameErrorShape = describeError(retryError) === describeError(error);
      console.warn(
        `[device-session] retry threw ${sameErrorShape ? "the SAME error as attempt 1" : "a DIFFERENT error than attempt 1"}: ${describeError(retryError)}`,
      );
      throw retryError;
    }
  }
});

export async function getActiveDeviceSession({
  touch = true,
}: { touch?: boolean } = {}): Promise<ActiveDeviceSession | null> {
  const [identity, cookieStore] = await Promise.all([getAuthenticatedIdentity(), cookies()]);

  if (!identity) {
    console.warn("[device-session] denied: reason=no-identity");
    return null;
  }

  const deviceToken = cookieStore.get(DEVICE_TOKEN_COOKIE)?.value;
  if (!deviceToken) {
    console.warn(`[device-session] denied: reason=no-device-cookie user=${identity.user.id}`);
    return null;
  }

  const hash = tokenHash(deviceToken);
  const admin = createAdminClient();
  const { data: deviceSession, error: deviceSessionError } = await admin
    .from("user_device_sessions")
    .select("id")
    .eq("user_id", identity.user.id)
    .eq("auth_session_id", identity.authSessionId)
    .eq("device_token_hash", hash)
    .eq("status", "active")
    .eq("is_active", true)
    .maybeSingle();

  // A failed lookup (timeout, contention, a dropped connection) is not
  // evidence the device session is invalid -- postgrest-js already retries
  // network errors and 503/520 responses up to 3 times internally, so
  // whatever reaches here survived that and is worth failing loudly over.
  // Silently falling through to "not found" is exactly the bug that caused
  // the 2026-09-14 dashboard incident: the row was still active in the DB
  // the whole time, this lookup just failed to report it under load.
  if (deviceSessionError) {
    console.error(
      `[device-session] user_device_sessions lookup failed user=${identity.user.id}: ${deviceSessionError.message}`,
    );
    throw deviceSessionError;
  }

  if (!deviceSession) {
    console.warn(`[device-session] denied: reason=no-active-row user=${identity.user.id}`);
    return null;
  }

  if (touch) {
    await admin.rpc("touch_user_device_session", {
      p_user_id: identity.user.id,
      p_auth_session_id: identity.authSessionId,
      p_device_token_hash: hash,
    });
  }

  return {
    user: identity.user,
    authSessionId: identity.authSessionId,
    deviceSessionId: deviceSession.id,
  };
}

export async function requireDeviceSession() {
  const session = await getActiveDeviceSession();
  if (!session) redirect("/api/auth/logout?reason=session-invalid");
  return session;
}

export async function logoutCurrentDeviceSession() {
  const [identity, cookieStore] = await Promise.all([getAuthenticatedIdentity(), cookies()]);
  const deviceToken = cookieStore.get(DEVICE_TOKEN_COOKIE)?.value;

  if (identity && deviceToken) {
    const admin = createAdminClient();
    await admin.rpc("logout_user_device_session", {
      p_user_id: identity.user.id,
      p_auth_session_id: identity.authSessionId,
      p_device_token_hash: tokenHash(deviceToken),
    });
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  cookieStore.delete(DEVICE_TOKEN_COOKIE);
}
