import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "task-board-resources";
// Illustrative reference material, not a deliverable -- smaller than the
// 300 MB generic submission cap.
const MAX_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_SIZE_LABEL = "50 MB";
const ALLOWED_TYPES: Record<"image" | "pdf", string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  pdf: ["application/pdf"],
};

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

// Decoupled from task creation: the admin task-creation route stays plain
// JSON (its levels/resources payload is already fairly involved), and
// image/pdf resource files are uploaded here first, one at a time, as each
// is picked in the form -- the create-task request then just carries back
// the public URL this returns, alongside the video/code resources which
// never touch storage at all.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  const type = formData.get("type");

  if (typeof type !== "string" || (type !== "image" && type !== "pdf")) {
    return Response.json({ error: "Invalid resource file type." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "A file is required." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: `File must be ${MAX_SIZE_LABEL} or smaller.` }, { status: 400 });
  }
  if (!ALLOWED_TYPES[type].includes(file.type)) {
    return Response.json(
      { error: type === "pdf" ? "File must be a PDF." : "Image must be JPG, PNG, or WEBP." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const filename = sanitizeFilename(file.name || "upload");
  const path = `${Date.now()}-${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return Response.json({ url: publicUrl });
}
