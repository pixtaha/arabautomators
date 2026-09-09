import "server-only";
import { createHmac } from "node:crypto";

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function secret() {
  const value = process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY;
  if (!value) throw new Error("Forensic watermark configuration is unavailable.");
  return value;
}

export function forensicViewerToken({ userId, deviceSessionId, authSessionId }: {
  userId: string;
  deviceSessionId: string;
  authSessionId: string;
}) {
  const digest = createHmac("sha256", secret())
    .update(`${userId}:${deviceSessionId}:${authSessionId}`)
    .digest();
  let token = "";
  for (let index = 0; index < 6; index += 1) token += TOKEN_ALPHABET[digest[index] % TOKEN_ALPHABET.length];
  return token;
}
