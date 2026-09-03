import { isIP } from "node:net";
import type { NextRequest } from "next/server";
import { userAgent } from "next/server";
import { cookies } from "next/headers";
import {
  DEVICE_TOKEN_COOKIE,
  deviceCookieOptions,
  generateDeviceToken,
  hashDeviceToken,
} from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/validation";

const OTP_RE = /^\d{6}$/;

function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || request.headers.get("x-real-ip")?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}

function readJwtSessionId(accessToken: string) {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      session_id?: unknown;
    };
    return typeof claims.session_id === "string" ? claims.session_id : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let email: unknown;
  let token: unknown;
  try {
    ({ email, token } = await request.json());
  } catch {
    return Response.json({ error: "Enter the code from your email." }, { status: 400 });
  }

  if (
    typeof email !== "string" ||
    !isValidEmail(email.trim()) ||
    email.length > 254 ||
    typeof token !== "string" ||
    !OTP_RE.test(token.trim())
  ) {
    return Response.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });

  if (error || !data.user || !data.session) {
    return Response.json(
      { error: "That code is invalid or has expired. Request a new code and try again." },
      { status: 400 },
    );
  }

  const authSessionId = readJwtSessionId(data.session.access_token);
  if (!authSessionId) {
    await supabase.auth.signOut({ scope: "local" });
    return Response.json({ error: "Could not create a secure session." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(DEVICE_TOKEN_COOKIE)?.value || generateDeviceToken();
  const parsedAgent = userAgent(request);
  const browser = parsedAgent.browser.name
    ? [parsedAgent.browser.name, parsedAgent.browser.version].filter(Boolean).join(" ")
    : null;
  const os = parsedAgent.os.name
    ? [parsedAgent.os.name, parsedAgent.os.version].filter(Boolean).join(" ")
    : null;
  const deviceName = parsedAgent.device.model || null;
  const deviceType = parsedAgent.device.type || "desktop";
  const rawUserAgent = request.headers.get("user-agent")?.slice(0, 1024) || null;

  const admin = createAdminClient();
  const { data: registered, error: registrationError } = await admin.rpc(
    "register_user_device_session",
    {
      p_user_id: data.user.id,
      p_auth_session_id: authSessionId,
      p_device_token_hash: hashDeviceToken(deviceToken),
      p_device_name: deviceName,
      p_device_type: deviceType,
      p_browser: browser,
      p_os: os,
      p_ip_address: getRequestIp(request),
      p_user_agent: rawUserAgent,
    },
  );

  if (registrationError) {
    await supabase.auth.signOut({ scope: "local" });
    cookieStore.delete(DEVICE_TOKEN_COOKIE);
    return Response.json({ error: "Could not create a secure session." }, { status: 500 });
  }

  if (!registered) {
    await supabase.auth.signOut({ scope: "local" });
    cookieStore.delete(DEVICE_TOKEN_COOKIE);
    return Response.json(
      { error: "This account is already active on another device." },
      { status: 409 },
    );
  }

  cookieStore.set(DEVICE_TOKEN_COOKIE, deviceToken, deviceCookieOptions());
  return Response.json({ ok: true });
}
