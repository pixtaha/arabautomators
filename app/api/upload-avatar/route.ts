import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const formData = await request.formData();
  const userId = formData.get("userId");
  const file = formData.get("file");

  if (typeof userId !== "string" || !UUID_RE.test(userId)) {
    return Response.json({ error: "Invalid user." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return Response.json({ error: "Unsupported image type." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "Image must be under 5MB." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const path = `${userId}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return Response.json({ error: "Could not upload image." }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);

  // Mirror onto user_metadata so the client can render it without an extra
  // query. getUserById first so we merge rather than clobber the username
  // set at signUp.
  const { data: existing } = await supabase.auth.admin.getUserById(userId);
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...existing?.user?.user_metadata, avatar_url: publicUrl },
  });

  return Response.json({ url: publicUrl });
}
