import { requireAdmin } from "@/lib/adminAuth";
import {
  SESSION_RESOURCE_MAX_FILE_SIZE_BYTES,
  SESSION_RESOURCE_MAX_FILE_SIZE_LABEL,
} from "@/lib/sessionResources";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "session-resources";
const RESOURCE_TYPES = ["pdf", "voice_note", "workflow_file", "text", "video", "credential_video"] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId || !UUID_RE.test(sessionId)) {
    return Response.json({ error: "Invalid session id." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("session_resources")
    .select("id, type, title, file_url, bunny_video_id, order_index")
    .eq("session_id", sessionId)
    .order("order_index");

  if (error) return Response.json({ error: "Could not load resources." }, { status: 500 });
  return Response.json({ resources: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const sessionId = formData.get("sessionId");
  const type = formData.get("type");
  const title = formData.get("title");
  const file = formData.get("file");
  const text = formData.get("text");

  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
    return Response.json({ error: "Choose a session." }, { status: 400 });
  }
  if (typeof type !== "string" || !RESOURCE_TYPES.includes(type as ResourceType)) {
    return Response.json({ error: "Invalid resource type." }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  let uploadBlob: Blob;
  let filename: string;
  let contentType: string;

  if (type === "text") {
    if (typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "Note text is required." }, { status: 400 });
    }
    uploadBlob = new Blob([text], { type: "text/plain" });
    filename = "note.txt";
    contentType = "text/plain";
  } else {
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "A file is required for this resource type." }, { status: 400 });
    }
    if (file.size > SESSION_RESOURCE_MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { error: `File must be ${SESSION_RESOURCE_MAX_FILE_SIZE_LABEL} or smaller.` },
        { status: 400 },
      );
    }
    uploadBlob = file;
    filename = sanitizeFilename(file.name || "upload");
    contentType = file.type || "application/octet-stream";
  }

  const supabase = createAdminClient();
  const path = `${sessionId}/${Date.now()}-${filename}`;
  const buffer = Buffer.from(await uploadBlob.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false });

  if (uploadError) {
    return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { count } = await supabase
    .from("session_resources")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const { data: inserted, error: insertError } = await supabase
    .from("session_resources")
    .insert({
      session_id: sessionId,
      type,
      title: title.trim(),
      file_url: publicUrl,
      order_index: count ?? 0,
    })
    .select("id, type, title, file_url, bunny_video_id, order_index")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from(BUCKET).remove([path]);
    return Response.json({ error: "Could not save resource." }, { status: 500 });
  }

  return Response.json({ resource: inserted });
}
