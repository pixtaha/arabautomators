import { requireAdmin } from "@/lib/adminAuth";
import { validateQuizJson } from "@/lib/quizzes";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId || !UUID_RE.test(sessionId)) {
    return Response.json({ error: "Invalid session id." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, session_id, quiz_json, is_live, created_at, updated_at")
    .eq("session_id", sessionId)
    .order("created_at");

  if (error) return Response.json({ error: "Could not load quizzes." }, { status: 500 });
  return Response.json({ quizzes: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const sessionId = formData.get("sessionId");
  const file = formData.get("file");

  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
    return Response.json({ error: "Choose a session." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "A quiz JSON file is required." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return Response.json({ error: "Quiz file must be 2 MB or smaller." }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return Response.json({ error: "That file isn't valid JSON." }, { status: 400 });
  }

  const validation = validateQuizJson(parsed);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: inserted, error: insertError } = await supabase
    .from("quizzes")
    .insert({ session_id: sessionId, quiz_json: validation.quiz })
    .select("id, session_id, quiz_json, is_live, created_at, updated_at")
    .single();

  if (insertError || !inserted) {
    return Response.json({ error: "Could not save quiz." }, { status: 500 });
  }

  return Response.json({ quiz: inserted });
}
