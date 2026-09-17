import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_AUTH_COOKIE_NAME } from './authCookieName'

export async function createClient() {
  const cookieStore = await cookies()

  // Server-side calls skip the public domain (DNS + TLS + Traefik) and go
  // straight to the Supabase gateway over the shared arabautomators-net
  // Docker network -- verified reachable and routing correctly regardless of
  // Host header. SUPABASE_INTERNAL_URL couples to supabase-envoy's container
  // name/port, an internal detail of the separately-managed
  // supabase-arabautomators stack, not a stable public interface -- if that
  // stack is ever restructured or renamed, this needs updating. Falls back
  // to the public URL when unset (e.g. local dev without that network).
  //
  // cookieOptions.name is pinned via SUPABASE_AUTH_COOKIE_NAME -- see that
  // file for why: without it, this client's cookie name would depend on
  // this URL's hostname and diverge from the browser client's, which always
  // uses the public URL.
  const supabaseUrl = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!

  return createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: SUPABASE_AUTH_COOKIE_NAME },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // called from a Server Component — safe to ignore if middleware handles refresh
          }
        },
      },
    }
  )
}
