import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

// Same bug as publicStorageUrl.ts (see that file for the full story), but
// for signed URLs: storage.from(bucket).createSignedUrl()/createSignedUrls()
// builds the returned URL from whatever base URL the calling client was
// constructed with, so a client built against SUPABASE_INTERNAL_URL bakes
// that Docker-internal hostname into the signed URL -- which then gets
// handed to a browser that can't resolve it.
//
// Unlike a public URL, a signed URL's token can't be built locally, so this
// still has to call through to the SDK for it. It then rewrites just the
// protocol+host of whatever URL comes back to NEXT_PUBLIC_SUPABASE_URL's,
// leaving the path (which encodes public/sign) and the token query string
// untouched -- correct regardless of which base URL the client used.
function toPublicHost(url: string): string {
  const publicBase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  const rewritten = new URL(url);
  rewritten.protocol = publicBase.protocol;
  rewritten.host = publicBase.host;
  return rewritten.toString();
}

type Storage = ReturnType<typeof createAdminClient>["storage"];
type SignedUrlOptions = Parameters<ReturnType<Storage["from"]>["createSignedUrl"]>[2];

export async function createPublicSignedUrl(
  supabase: { storage: Storage },
  bucket: string,
  path: string,
  expiresIn: number,
  options?: SignedUrlOptions,
) {
  const result = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn, options);
  if (result.error || !result.data) return result;
  return { data: { signedUrl: toPublicHost(result.data.signedUrl) }, error: null };
}

export async function createPublicSignedUrls(
  supabase: { storage: Storage },
  bucket: string,
  paths: string[],
  expiresIn: number,
) {
  const result = await supabase.storage.from(bucket).createSignedUrls(paths, expiresIn);
  if (result.error || !result.data) return result;
  return {
    data: result.data.map((item) => (item.signedUrl ? { ...item, signedUrl: toPublicHost(item.signedUrl) } : item)),
    error: null,
  };
}
