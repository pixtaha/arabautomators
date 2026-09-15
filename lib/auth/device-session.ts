import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

async function fetchIdentityOnce() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (isConcurrentRefreshConflict(claimsError)) throw claimsError;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (isConcurrentRefreshConflict(userError)) throw userError;

  const user = userData.user;
  const authSessionId = claimsData?.claims?.session_id;

  if (!user || typeof authSessionId !== "string") return null;
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
    return await fetchIdentityOnce();
  } catch (error) {
    if (!isConcurrentRefreshConflict(error)) throw error;
    // One retry, after giving the winning refresh a moment to land. If it
    // conflicts again, let it throw -- surface a failed request rather than
    // silently reporting "no session" and triggering a false logout.
    await wait(CONCURRENT_REFRESH_RETRY_BASE_MS + Math.random() * CONCURRENT_REFRESH_RETRY_JITTER_MS);
    return await fetchIdentityOnce();
  }
});

export async function getActiveDeviceSession({
  touch = true,
}: { touch?: boolean } = {}): Promise<ActiveDeviceSession | null> {
  const [identity, cookieStore] = await Promise.all([getAuthenticatedIdentity(), cookies()]);
  const deviceToken = cookieStore.get(DEVICE_TOKEN_COOKIE)?.value;

  if (!identity || !deviceToken) return null;

  const hash = tokenHash(deviceToken);
  const admin = createAdminClient();
  const { data: deviceSession } = await admin
    .from("user_device_sessions")
    .select("id")
    .eq("user_id", identity.user.id)
    .eq("auth_session_id", identity.authSessionId)
    .eq("device_token_hash", hash)
    .eq("status", "active")
    .eq("is_active", true)
    .maybeSingle();

  if (!deviceSession) return null;

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
