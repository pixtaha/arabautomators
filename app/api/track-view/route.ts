import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { path, visitorId } = body as Record<string, unknown>;
  if (typeof path !== "string" || path.length === 0 || path.length > 2048) {
    return Response.json({ error: "Invalid path." }, { status: 400 });
  }
  if (visitorId !== undefined && visitorId !== null && (typeof visitorId !== "string" || visitorId.length > 128)) {
    return Response.json({ error: "Invalid visitorId." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("page_views").insert({
    path,
    visitor_id: typeof visitorId === "string" ? visitorId : null,
  });

  if (error) return Response.json({ error: "Could not record page view." }, { status: 500 });

  return Response.json({ ok: true });
}
