// The one source of truth for this app's public origin, for anywhere a
// Route Handler needs to build an absolute URL (NextResponse.redirect,
// Supabase's emailRedirectTo, etc). request.url/request.nextUrl cannot be
// used for this: confirmed by hitting the container directly with an
// explicit Host header set, Next.js's standalone server still resolves
// request.url to its own bind address (0.0.0.0:3000) rather than the
// public host, even when Host/X-Forwarded-* headers are correct.
export const SITE_URL = process.env.SITE_URL ?? "https://arabautomators.com";
