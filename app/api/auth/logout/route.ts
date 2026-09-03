import { NextResponse, type NextRequest } from "next/server";
import { logoutCurrentDeviceSession } from "@/lib/auth/device-session";

const REASONS: Record<string, string> = {
  "session-invalid": "Your session is no longer authorized. Please log in again.",
  revoked: "This device session was revoked. Please log in again.",
};

export async function POST() {
  await logoutCurrentDeviceSession();
  return Response.json({ ok: true });
}

export async function GET(request: NextRequest) {
  await logoutCurrentDeviceSession();
  const reason = request.nextUrl.searchParams.get("reason") || "session-invalid";
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("message", REASONS[reason] || REASONS["session-invalid"]);
  return NextResponse.redirect(loginUrl);
}
