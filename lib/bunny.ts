import "server-only";

const BUNNY_API_BASE = "https://video.bunnycdn.com/library";

// Bunny Stream video status enum — see https://docs.bunny.net/reference/video_getvideo
const BUNNY_STATUS_FINISHED = 4;

export interface BunnyVideoMetadata {
  guid: string;
  title: string;
  status: number;
  isFinished: boolean;
  /** Duration in seconds. */
  length: number;
}

function getBunnyConfig() {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;

  if (!libraryId || !apiKey) {
    throw new Error("Bunny Stream is not configured: missing BUNNY_STREAM_LIBRARY_ID or BUNNY_STREAM_API_KEY.");
  }

  return { libraryId, apiKey };
}

export async function getBunnyVideo(videoId: string): Promise<BunnyVideoMetadata | null> {
  const { libraryId, apiKey } = getBunnyConfig();

  const response = await fetch(`${BUNNY_API_BASE}/${libraryId}/videos/${videoId}`, {
    headers: { AccessKey: apiKey },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Bunny Stream API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    guid: data.guid,
    title: data.title,
    status: data.status,
    isFinished: data.status === BUNNY_STATUS_FINISHED,
    length: data.length,
  };
}

export async function createBunnyVideo(title: string): Promise<string> {
  const { libraryId, apiKey } = getBunnyConfig();
  const response = await fetch(`${BUNNY_API_BASE}/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Bunny Stream create error: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("guid" in data) || typeof data.guid !== "string") {
    throw new Error("Bunny Stream create error: response did not include a video ID.");
  }

  return data.guid;
}

export async function uploadBunnyVideo(
  videoId: string,
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): Promise<void> {
  const { libraryId, apiKey } = getBunnyConfig();
  const requestInit: RequestInit & { duplex: "half" } = {
    method: "PUT",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body,
    cache: "no-store",
    duplex: "half",
    signal,
  };
  const response = await fetch(`${BUNNY_API_BASE}/${libraryId}/videos/${videoId}`, requestInit);

  if (!response.ok) {
    throw new Error(`Bunny Stream upload error: ${response.status} ${response.statusText}`);
  }
}

export async function deleteBunnyVideo(videoId: string): Promise<void> {
  const { libraryId, apiKey } = getBunnyConfig();
  const response = await fetch(`${BUNNY_API_BASE}/${libraryId}/videos/${videoId}`, {
    method: "DELETE",
    headers: { AccessKey: apiKey },
    cache: "no-store",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Bunny Stream delete error: ${response.status} ${response.statusText}`);
  }
}
