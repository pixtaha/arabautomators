import { requireAdmin } from "@/lib/adminAuth";
import { verifyVideoLink } from "@/lib/admin-video-link";
import { parseVideoLink, videoResourceFields } from "@/lib/video-provider";
import {
  SESSION_RESOURCE_MAX_FILE_SIZE_BYTES,
  SESSION_RESOURCE_MAX_FILE_SIZE_LABEL,
  isVideoResource,
  isVideoFile,
  withoutVideoFileUrl,
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

  const moduleId = new URL(request.url).searchParams.get("moduleId");
  if (!moduleId || !UUID_RE.test(moduleId)) {
    return Response.json({ error: "Invalid module id." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("session_resources")
    .select("id, type, title, file_url, video_provider, vdocipher_video_id, order_index, file_size_bytes, page_count")
    .eq("module_id", moduleId)
    .order("order_index");

  if (error) return Response.json({ error: "Could not load resources." }, { status: 500 });
  return Response.json({ resources: (data ?? []).map(withoutVideoFileUrl) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const moduleId = formData.get("moduleId");
  const type = formData.get("type");
  const title = formData.get("title");
  const file = formData.get("file");
  const text = formData.get("text");
  const pageCountRaw = formData.get("pageCount");

  if (typeof moduleId !== "string" || !UUID_RE.test(moduleId)) {
    return Response.json({ error: "Choose a module." }, { status: 400 });
  }
  if (typeof type !== "string" || !RESOURCE_TYPES.includes(type as ResourceType)) {
    return Response.json({ error: "Invalid resource type." }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (isVideoResource(type)) {
    const link = parseVideoLink({
      vdocipherVideoId: formData.get("vdocipherVideoId"),
    });
    if (link.error || !link.source || file instanceof File) {
      return Response.json({ error: link.error ?? "Link a processed video using its provider Video ID." }, { status: 400 });
    }
    const { data: module, error: moduleError } = await supabase.from("modules").select("id").eq("id", moduleId).maybeSingle();
    if (moduleError || !module) {
      return Response.json({ error: "Module not found." }, { status: 404 });
    }
    const verification = await verifyVideoLink(link.source);
    if (verification) return Response.json({ error: verification.error }, { status: verification.status });
    const { data: last, error: orderError } = await supabase.from("session_resources")
      .select("order_index").eq("module_id", moduleId).order("order_index", { ascending: false }).limit(1);
    if (orderError) return Response.json({ error: "Could not save resource." }, { status: 500 });
    const { data: resource, error } = await supabase.from("session_resources").insert({
      module_id: moduleId, type, title: title.trim(), ...videoResourceFields(link.source),
      file_url: null, order_index: (last?.[0]?.order_index ?? -1) + 1,
    }).select("id, type, title, file_url, video_provider, vdocipher_video_id, order_index, file_size_bytes, page_count").single();
    if (error || !resource) return Response.json({ error: "Could not save resource." }, { status: 500 });
    return Response.json({ resource: withoutVideoFileUrl(resource) });
  }

  let pageCount: number | null = null;
  if (type === "pdf" && typeof pageCountRaw === "string" && pageCountRaw.trim()) {
    const parsed = Number(pageCountRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return Response.json({ error: "Page count must be a positive whole number." }, { status: 400 });
    }
    pageCount = parsed;
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
    if (isVideoFile(file)) {
      return Response.json({ error: "Course videos must use a VdoCipher video resource." }, { status: 400 });
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

  const path = `${moduleId}/${Date.now()}-${filename}`;
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
    .eq("module_id", moduleId);

  const { data: inserted, error: insertError } = await supabase
    .from("session_resources")
    .insert({
      module_id: moduleId,
      type,
      title: title.trim(),
      file_url: publicUrl,
      order_index: count ?? 0,
      file_size_bytes: uploadBlob.size,
      page_count: pageCount,
    })
    .select("id, type, title, file_url, order_index, file_size_bytes, page_count")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from(BUCKET).remove([path]);
    return Response.json({ error: "Could not save resource." }, { status: 500 });
  }

  return Response.json({ resource: inserted });
}
