const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.82;

// Fraction of the cropped-away vertical margin taken from the top, for
// portrait (taller-than-wide) photos. A strict 0.5 (pure geometric center)
// systematically clips the top of the subject's face/head, because real
// portrait photos are typically framed with headroom above the face and
// more body/background below it -- the face sits above the frame's true
// vertical center far more often than exactly on it. There's no equivalent
// bias for horizontal cropping (landscape photos), since subjects aren't
// systematically off-center left-to-right the way they are top-to-bottom.
const PORTRAIT_VERTICAL_BIAS = 0.25;

/**
 * Crops to a square -- biased toward the top for portrait photos -- and
 * downscales to at most 800x800, then re-encodes as JPEG so avatar uploads
 * stay small and fast. Cropping here (rather than leaving it to
 * display-time CSS) means every consumer of the stored image gets a
 * properly framed square, not just the ones that remember to add
 * object-fit/object-position. Animated GIFs are left untouched (canvas
 * would flatten them to a single frame). Falls back to the original file if
 * compression isn't supported or fails for any reason.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  if (typeof createImageBitmap === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const excessX = bitmap.width - side;
    const excessY = bitmap.height - side;
    const sourceX = Math.round(excessX / 2);
    const sourceY =
      bitmap.height > bitmap.width ? Math.round(excessY * PORTRAIT_VERTICAL_BIAS) : Math.round(excessY / 2);
    const outputSize = Math.max(1, Math.min(MAX_DIMENSION, side));

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, outputSize, outputSize);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

function extensionFor(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

interface UploadAvatarOptions {
  timeoutMs?: number;
  onProgress?: (percent: number) => void;
}

interface UploadAvatarResult {
  url?: string;
  error?: string;
  timedOut?: boolean;
}

/**
 * Uploads via XMLHttpRequest (not fetch) specifically to get upload
 * progress events and a controllable timeout — fetch offers neither natively.
 */
export function uploadAvatar(
  userId: string,
  file: Blob,
  { timeoutMs = 40000, onProgress }: UploadAvatarOptions = {},
): Promise<UploadAvatarResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("file", file, `avatar.${extensionFor(file.type)}`);

    xhr.open("POST", "/api/upload-avatar");
    xhr.timeout = timeoutMs;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let json: { url?: string; error?: string } = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // non-JSON response, handled by the status check below
      }
      if (xhr.status >= 200 && xhr.status < 300 && json.url) {
        resolve({ url: json.url });
      } else {
        resolve({ error: json.error || "Upload failed." });
      }
    };

    xhr.onerror = () => resolve({ error: "Upload failed." });
    xhr.ontimeout = () => resolve({ error: "Upload timed out.", timedOut: true });

    xhr.send(formData);
  });
}
