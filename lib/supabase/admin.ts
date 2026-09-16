import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  // See lib/supabase/server.ts for why: internal Docker-network URL for
  // server-side calls, coupled to supabase-envoy's container name/port (an
  // implementation detail of the separately-managed supabase-arabautomators
  // stack, not a stable public interface), falling back to the public URL.
  const supabaseUrl = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return createSupabaseClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
