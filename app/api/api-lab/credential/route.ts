import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request) {
  // Same origin protection as the protected course playback endpoint.
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (request.headers.has("origin") && request.headers.get("origin") !== new URL(SITE_URL).origin)
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403, headers });
  }

  let stage = "device-session";
  try {
    const session = await getActiveDeviceSession();
    if (!session) {
      return Response.json({ error: "Please sign in again to view your credential." }, { status: 401, headers });
    }

    const email = session.user.email?.trim().toLowerCase();
    if (!email) return Response.json({ error: "Forbidden" }, { status: 403, headers });

    const admin = createAdminClient();
    // Reuse the dashboard's verified session email -> students -> workspace
    // relationship. No identity, subdomain or service is accepted from the client.
    stage = "student";
    const { data: student, error: studentError } = await admin
      .from("students")
      .select("id, email")
      .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
      .maybeSingle();
    if (studentError) throw studentError;
    // Verify a literal match as well: PostgREST also treats * as a wildcard.
    if (!student || student.email?.trim().toLowerCase() !== email) {
      return Response.json({ error: "Forbidden" }, { status: 403, headers });
    }

    stage = "workspace";
    const { data: workspace, error: workspaceError } = await admin
      .from("student_n8n_credentials")
      .select("subdomain")
      .eq("student_id", student.id)
      .maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace?.subdomain) return Response.json({ credential: null }, { headers });

    stage = "credential";
    const { data, error } = await admin
      .from("student_api_credentials")
      .select("credential_value")
      .eq("student_subdomain", workspace.subdomain)
      .eq("service_name", "commerce-api-lab")
      .order("issued_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    return Response.json({ credential: data?.credential_value || null }, { headers });
  } catch (error) {
    // Log only the lookup stage and a structured database code. Raw messages,
    // details and thrown objects can contain row values, including credentials.
    const code = (error as { code?: unknown } | null)?.code;
    console.error("[api-lab/credential] lookup failed", {
      stage,
      code: typeof code === "string" && /^(?:[A-Z0-9]{5}|PGRST\d{3})$/.test(code) ? code : "unavailable",
    });
    return Response.json(
      { error: "Your credential is temporarily unavailable. Please try again." },
      { status: 503, headers },
    );
  }
}
