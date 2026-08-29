const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.82;

/**
 * Downscales to at most 800x800 and re-encodes as JPEG so avatar uploads
 * stay small and fast. Animated GIFs are left untouched (canvas would
 * flatten them to a single frame). Falls back to the original file if
 * compression isn't supported or fails for any reason.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  if (typeof createImageBitmap === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
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
