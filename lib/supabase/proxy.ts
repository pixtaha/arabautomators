import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_AUTH_COOKIE_NAME } from "./authCookieName";

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // See lib/supabase/server.ts for why: internal Docker-network URL for
  // server-side calls, coupled to supabase-envoy's container name/port (an
  // implementation detail of the separately-managed supabase-arabautomators
  // stack, not a stable public interface), falling back to the public URL.
  // This runs on nearly every request, so it's the highest-volume caller.
  // cookieOptions.name is pinned via SUPABASE_AUTH_COOKIE_NAME -- see that
  // file for why this must match the browser client exactly.
  const supabaseUrl = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: SUPABASE_AUTH_COOKIE_NAME },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request, headers });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return response;
}
