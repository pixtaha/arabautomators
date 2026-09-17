// Pinned so the Supabase session cookie name doesn't depend on which URL a
// given client happens to connect to. @supabase/supabase-js defaults the
// cookie name to `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`
// -- since server-side clients use SUPABASE_INTERNAL_URL (hostname
// "supabase-envoy") while the browser client uses the public
// NEXT_PUBLIC_SUPABASE_URL (hostname "supabase.arabautomators.com"), the two
// sides derived DIFFERENT cookie names for the same logical session without
// this. The browser could then never find the session the server just
// created, and any client-side code that redirects on "no user"
// (DashboardClient, QuizClient, TasksClient, app/profile/page.tsx) bounced a
// genuinely logged-in student straight back to /login within about a
// second of a successful login. Every Supabase client constructed anywhere
// in this app must pass this via `cookieOptions: { name: SUPABASE_AUTH_COOKIE_NAME }`.
export const SUPABASE_AUTH_COOKIE_NAME = "sb-arabautomators-auth-token";
