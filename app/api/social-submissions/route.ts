import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSocialSubmission, editSocialSubmission, getSocialWindowById } from "@/lib/data/socialSubmissions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parsePostUrl(value: unknown): { url: string } | { error: string } {
  if (typeof value !== "string" || !value.trim()) return { error: "A post URL is required." };
  try {
    new URL(value.trim());
  } catch {
    return { error: "Enter a valid URL." };
  }
  return { url: value.trim() };
}

// Windows aren't scheduled yet (no admin UI creates them with a future
// opens_at/past closes_at), but the checks are cheap and match the same
// defensive validation task-board's submission route applies to its own
// task.start_at.
async function checkWindowIsOpen(windowId: string) {
  const socialWindow = await getSocialWindowById(windowId);
  if (!socialWindow || !socialWindow.is_active) return { error: "This window is not open.", status: 404 } as const;
  const now = Date.now();
  if (new Date(socialWindow.opens_at).getTime() > now) {
    return { error: "This window is not open yet.", status: 403 } as const;
  }
  if (socialWindow.closes_at && new Date(socialWindow.closes_at).getTime() < now) {
    return { error: "This window has closed.", status: 403 } as const;
  }
  return null;
}

// Creates a brand-new submission -- a student can have any number of
// separate posts per window, so this never touches an existing row.
export async function POST(request: Request) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { windowId, postUrl } = body as { windowId?: unknown; postUrl?: unknown };
  if (typeof windowId !== "string" || !UUID_RE.test(windowId)) {
    return Response.json({ error: "Invalid window id." }, { status: 400 });
  }
  const parsedUrl = parsePostUrl(postUrl);
  if ("error" in parsedUrl) return Response.json({ error: parsedUrl.error }, { status: 400 });

  const windowError = await checkWindowIsOpen(windowId);
  if (windowError) return Response.json({ error: windowError.error }, { status: windowError.status });

  const result = await createSocialSubmission(windowId, session.user.id, parsedUrl.url);
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ submission: result.submission });
}

// Edits one of the student's own existing submissions -- ownership is
// checked here (against the service-role fetch below) before
// editSocialSubmission() is allowed to touch the row, since that function
// takes a bare submission id with no student_id filter of its own.
export async function PATCH(request: Request) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { submissionId, postUrl } = body as { submissionId?: unknown; postUrl?: unknown };
  if (typeof submissionId !== "string" || !UUID_RE.test(submissionId)) {
    return Response.json({ error: "Invalid submission id." }, { status: 400 });
  }
  const parsedUrl = parsePostUrl(postUrl);
  if ("error" in parsedUrl) return Response.json({ error: parsedUrl.error }, { status: 400 });

  const supabase = createAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("social_submissions")
    .select("id, student_id, window_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (fetchError) return Response.json({ error: "Could not load submission." }, { status: 500 });
  if (!existing || existing.student_id !== session.user.id) {
    return Response.json({ error: "Submission not found." }, { status: 404 });
  }

  const windowError = await checkWindowIsOpen(existing.window_id);
  if (windowError) return Response.json({ error: windowError.error }, { status: windowError.status });

  const result = await editSocialSubmission(submissionId, parsedUrl.url);
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ submission: result.submission });
}
