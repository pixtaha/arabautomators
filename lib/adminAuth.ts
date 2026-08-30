import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "admin") return null;
  return user;
}
