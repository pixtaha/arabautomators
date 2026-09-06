import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid quiz id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.isLive !== "boolean") {
    return Response.json({ error: "Missing \"isLive\" boolean." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: quiz, error: fetchError } = await supabase
    .from("quizzes")
    .select("id, session_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !quiz) {
    return Response.json({ error: "Quiz not found." }, { status: 404 });
  }

  if (body.isLive) {
    // Only one quiz can be live per session (also enforced by a DB unique
    // index) -- stop any sibling before starting this one.
    const { error: stopSiblingsError } = await supabase
      .from("quizzes")
      .update({ is_live: false, updated_at: new Date().toISOString() })
      .eq("session_id", quiz.session_id)
      .neq("id", id)
      .eq("is_live", true);

    if (stopSiblingsError) {
      return Response.json({ error: "Could not stop the other live quiz." }, { status: 500 });
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("quizzes")
    .update({ is_live: body.isLive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, session_id, quiz_json, is_live, created_at, updated_at")
    .single();

  if (updateError || !updated) {
    return Response.json({ error: "Could not update quiz." }, { status: 500 });
  }

  return Response.json({ quiz: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid quiz id." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", id);

  if (error) return Response.json({ error: "Could not delete quiz." }, { status: 500 });
  return Response.json({ ok: true });
}
