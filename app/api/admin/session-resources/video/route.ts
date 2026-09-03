import { requireAdmin } from "@/lib/adminAuth";
import { createBunnyVideo, deleteBunnyVideo, uploadBunnyVideo } from "@/lib/bunny";
import { SESSION_RESOURCE_MAX_FILE_SIZE_BYTES, SESSION_RESOURCE_MAX_FILE_SIZE_LABEL } from "@/lib/sessionResources";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function limitSize(stream: ReadableStream<Uint8Array>) {
  let receivedBytes = 0;

  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        receivedBytes += chunk.byteLength;
        if (receivedBytes > SESSION_RESOURCE_MAX_FILE_SIZE_BYTES) {
          controller.error(new Error(`Video must be ${SESSION_RESOURCE_MAX_FILE_SIZE_LABEL} or smaller.`));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const title = url.searchParams.get("title")?.trim();

  if (!sessionId || !UUID_RE.test(sessionId)) {
    return Response.json({ error: "Choose a session." }, { status: 400 });
  }
  if (!title) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }
  if (!request.body) {
    return Response.json({ error: "A video file is required." }, { status: 400 });
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength <= 0) {
      return Response.json({ error: "A video file is required." }, { status: 400 });
    }
    if (contentLength > SESSION_RESOURCE_MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { error: `Video must be ${SESSION_RESOURCE_MAX_FILE_SIZE_LABEL} or smaller.` },
        { status: 400 },
      );
    }
  }

  const supabase = createAdminClient();
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return Response.json({ error: "Session not found." }, { status: 404 });
  }

  const { count, error: countError } = await supabase
    .from("session_resources")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (countError) {
    return Response.json({ error: "Could not prepare the resource." }, { status: 500 });
  }

  let bunnyVideoId: string | null = null;

  try {
    bunnyVideoId = await createBunnyVideo(title);
    await uploadBunnyVideo(bunnyVideoId, limitSize(request.body), request.signal);
  } catch (error) {
    if (bunnyVideoId) {
      await deleteBunnyVideo(bunnyVideoId).catch(() => undefined);
    }

    const message = error instanceof Error ? error.message : "Video upload failed.";
    return Response.json({ error: message }, { status: 502 });
  }

  if (!bunnyVideoId) {
    return Response.json({ error: "Bunny Stream did not return a video ID." }, { status: 502 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("session_resources")
    .insert({
      session_id: sessionId,
      type: "video",
      title,
      bunny_video_id: bunnyVideoId,
      order_index: count ?? 0,
    })
    .select("id, type, title, file_url, bunny_video_id, order_index")
    .single();

  if (insertError || !inserted) {
    await deleteBunnyVideo(bunnyVideoId).catch(() => undefined);
    return Response.json({ error: "Could not save the video resource." }, { status: 500 });
  }

  return Response.json({ resource: inserted });
}
