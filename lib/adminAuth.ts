import "server-only";
import type { User } from "@supabase/supabase-js";
import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns the signed-in user if their profiles.role is 'admin', else null.
 *
 * The role check itself goes through the service-role client rather than
 * the cookie-based one, so this doesn't depend on profiles' RLS policy
 * being (or staying) permissive enough to read role — defense-in-depth for
 * API routes, independent of both the page-level check and table RLS.
 */
export async function requireAdmin(): Promise<User | null> {
  const deviceSession = await getActiveDeviceSession();
  if (!deviceSession) return null;

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", deviceSession.user.id)
    .maybeSingle();

  // Unlike getActiveDeviceSession(), this only gates admin-only UI/actions,
  // not the student's own access -- and callers typically await it alongside
  // other per-request work (e.g. dashboard/page.tsx's Promise.all), so
  // throwing here would fail the whole page for every student, not just hide
  // admin controls for the one admin. Log it so a transient failure is
  // diagnosable, but keep failing closed to "not admin" rather than widening
  // the blast radius to everyone's dashboard load.
  if (error) {
    console.error(`[admin-auth] profiles lookup failed user=${deviceSession.user.id}: ${error.message}`);
    return null;
  }

  if (profile?.role !== "admin") return null;
  return deviceSession.user;
}
