import "server-only";

// Every server-side Supabase client (createAdminClient() and similar) may be
// constructed against SUPABASE_INTERNAL_URL -- the Docker-internal gateway
// hostname (e.g. supabase-envoy), preferred for server-to-server calls, see
// lib/supabase/admin.ts -- rather than the public URL. But
// storage.from(bucket).getPublicUrl(path) just concatenates whatever base
// URL the client was built with, so calling it on such a client bakes an
// internal-only hostname into the returned URL. That URL then gets stored
// and handed to a browser, which can never resolve it (confirmed directly:
// a public bucket's object is only reachable from outside the Docker
// network via NEXT_PUBLIC_SUPABASE_URL, never via SUPABASE_INTERNAL_URL --
// the browser doesn't get a CORS error or a 403/404, the hostname just
// doesn't resolve at all).
//
// This builds the public URL directly from NEXT_PUBLIC_SUPABASE_URL instead
// of trusting the SDK's own getPublicUrl(), so it's correct regardless of
// which URL the calling client happens to be constructed with.
export function publicStorageUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
