export const SESSION_RESOURCE_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const SESSION_RESOURCE_MAX_FILE_SIZE_LABEL = "100 MB";

export function isVideoResource(type: string): boolean {
  return type === "video" || type === "credential_video";
}

/** Strip legacy clear URLs before a row reaches any browser, including admins. */
export function withoutVideoFileUrl<T extends { type: string; file_url: string | null }>(resource: T): T {
  return isVideoResource(resource.type) ? { ...resource, file_url: null } : resource;
}

export function isVideoFile(file: { type: string; name: string }): boolean {
  return file.type.toLowerCase().startsWith("video/") ||
    /\.(?:m3u8|mpd|mov|m4v|webm|mkv|avi|ts)$/i.test(file.name) ||
    (/\.mp4$/i.test(file.name) && file.type.toLowerCase() !== "audio/mp4");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}
