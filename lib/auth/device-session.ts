import "server-only";

import { createHash, randomBytes } from "node:crypto";
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

async function getAuthenticatedIdentity() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const { data: userData } = await supabase.auth.getUser();

  const user = userData.user;
  const authSessionId = claimsData?.claims?.session_id;

  if (!user || typeof authSessionId !== "string") return null;
  return { user, authSessionId };
}

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
