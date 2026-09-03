import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGNUP_AVATAR_COOKIE = "aa-signup-avatar";
const TICKET_LIFETIME_SECONDS = 10 * 60;

interface SignupAvatarTicket {
  userId: string;
  expiresAt: number;
}

function signingKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  return createHmac("sha256", serviceRoleKey).update("signup-avatar-ticket-v1").digest();
}

function signature(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function createSignupAvatarTicket(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      expiresAt: Math.floor(Date.now() / 1000) + TICKET_LIFETIME_SECONDS,
    } satisfies SignupAvatarTicket),
  ).toString("base64url");

  return `${payload}.${signature(payload)}`;
}

export function verifySignupAvatarTicket(ticket: string | undefined, expectedUserId: string) {
  if (!ticket) return false;
  const [payload, suppliedSignature] = ticket.split(".");
  if (!payload || !suppliedSignature) return false;

  const expectedSignature = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SignupAvatarTicket;
    return parsed.userId === expectedUserId && parsed.expiresAt >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function signupAvatarCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api/upload-avatar",
    maxAge: TICKET_LIFETIME_SECONDS,
  };
}
