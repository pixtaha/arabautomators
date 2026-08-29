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

export async function getBunnyVideo(videoId: string): Promise<BunnyVideoMetadata | null> {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;

  if (!libraryId || !apiKey) {
    throw new Error("Bunny Stream is not configured: missing BUNNY_STREAM_LIBRARY_ID or BUNNY_STREAM_API_KEY.");
  }

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
