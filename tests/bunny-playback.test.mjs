import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, test } from "node:test";
import { createBunnyPlayback, isEnterprisePlaybackReady } from "../lib/bunny-playback.ts";
import { isVideoFile, withoutVideoFileUrl } from "../lib/sessionResources.ts";

const id = "26d3d809-b72c-486f-a28c-05ef5719aff8";
const ready = {
  enableDRM: true, drmVersion: 1, enableMP4Fallback: false,
  allowEarlyPlay: false, tokenAuthEnabled: true, originalUrl: null,
  isPlayable: true, isPlaylistPlayable: true,
  video: { guid: id, videoLibraryId: 739542, status: 4, length: 48, hasMP4Fallback: false },
};

test("Enterprise readiness rejects Basic, incomplete configuration and clear paths", () => {
  assert.equal(isEnterprisePlaybackReady(ready), true);
  for (const override of [
    { drmVersion: 0 }, { drmVersion: 2 }, { drmVersion: undefined },
    { enableDRM: false }, { enableDRM: undefined }, { enableMP4Fallback: true },
    { allowEarlyPlay: true }, { tokenAuthEnabled: false }, { originalUrl: "https://example.com/source.mp4" },
    { isPlayable: false }, { isPlaylistPlayable: false }, { video: undefined },
    { video: { ...ready.video, status: 3 } }, { video: { ...ready.video, hasMP4Fallback: true } },
  ]) assert.equal(isEnterprisePlaybackReady({ ...ready, ...override }), false);
});

const names = ["BUNNY_STREAM_LIBRARY_ID", "BUNNY_STREAM_API_KEY", "BUNNY_STREAM_TOKEN_SECURITY_KEY", "BUNNY_DRM_ENFORCEMENT_ENABLED"];
const previousEnv = names.map((name) => process.env[name]);
const previousFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = previousFetch;
  names.forEach((name, i) => { if (previousEnv[i] === undefined) delete process.env[name]; else process.env[name] = previousEnv[i]; });
});

test("server signs only an official embed URL with the separate token key", async () => {
  process.env.BUNNY_STREAM_LIBRARY_ID = "739542";
  process.env.BUNNY_STREAM_API_KEY = "test-stream-api-key";
  process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY = "test-embed-security-key";
  process.env.BUNNY_DRM_ENFORCEMENT_ENABLED = "true";
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `https://video.bunnycdn.com/library/739542/videos/${id}/play`);
    assert.equal(options.headers.AccessKey, "test-stream-api-key");
    assert.equal(options.cache, "no-store");
    return Response.json({ ...ready, videoPlaylistUrl: "https://example.com/clear.m3u8", fallbackUrl: "https://example.com/play_" });
  };
  const start = Math.floor(Date.now() / 1000);
  const result = await createBunnyPlayback(id);
  const url = new URL(result.embedUrl);
  assert.equal(url.origin, "https://player.mediadelivery.net");
  assert.equal(url.pathname, `/embed/739542/${id}`);
  assert.equal(url.searchParams.get("token"), createHash("sha256").update(`test-embed-security-key${id}${result.expires}`).digest("hex"));
  assert.ok(result.expires >= start + 3600 && result.expires <= start + 3601);
  assert.deepEqual(Object.keys(result).sort(), ["embedUrl", "expires"]);
  assert.doesNotMatch(JSON.stringify(result), /test-stream-api-key|test-embed-security-key|example\.com/);
  assert.equal(new URL((await createBunnyPlayback(id.toUpperCase())).embedUrl).pathname, `/embed/739542/${id}`);
});

test("DRM enforcement is opt-in and still returns only the official Bunny embed", async () => {
  process.env.BUNNY_STREAM_LIBRARY_ID = "739542";
  delete process.env.BUNNY_DRM_ENFORCEMENT_ENABLED;
  delete process.env.BUNNY_STREAM_API_KEY;
  process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY = "test-embed-security-key";
  const result = await createBunnyPlayback(id);
  const url = new URL(result.embedUrl);
  assert.equal(url.origin, "https://player.mediadelivery.net");
  assert.equal(url.pathname, `/embed/739542/${id}`);
  assert.ok(Number(url.searchParams.get("expires")) >= Math.floor(Date.now() / 1000) + 299);
  assert.equal(result.expires, Number(url.searchParams.get("expires")));
});

test("signer refuses missing key, mismatched library/video, unprotected video and upstream errors", async () => {
  process.env.BUNNY_STREAM_LIBRARY_ID = "739542";
  process.env.BUNNY_STREAM_API_KEY = "test-stream-api-key";
  process.env.BUNNY_DRM_ENFORCEMENT_ENABLED = "true";
  delete process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY;
  await assert.rejects(createBunnyPlayback(id));
  process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY = "test-embed-security-key";
  process.env.BUNNY_DRM_ENFORCEMENT_ENABLED = "true";
  for (const data of [
    { ...ready, video: { ...ready.video, videoLibraryId: 123 } },
    { ...ready, video: { ...ready.video, guid: "different-video" } },
    { ...ready, enableDRM: false },
  ]) {
    globalThis.fetch = async () => Response.json(data);
    await assert.rejects(createBunnyPlayback(id));
  }
  globalThis.fetch = async () => new Response("upstream detail must stay private", { status: 403 });
  await assert.rejects(createBunnyPlayback(id), /metadata is unavailable/);
  await assert.rejects(createBunnyPlayback("../videos"));
});

test("legacy video URLs are removed without changing ordering, identifiers or non-video files", () => {
  const rows = ["video", "credential_video", "pdf", "voice_note", "workflow_file", "text"].map((type, order_index) => ({
    id: String(order_index), type, order_index, bunny_video_id: null, file_url: "https://storage.example.com/source",
  }));
  const clean = rows.map(withoutVideoFileUrl);
  assert.deepEqual(clean.map((r) => r.id), rows.map((r) => r.id));
  assert.deepEqual(clean.map((r) => r.order_index), rows.map((r) => r.order_index));
  assert.equal(clean[0].file_url, null);
  assert.equal(clean[1].file_url, null);
  assert.deepEqual(clean.slice(2), rows.slice(2));
  assert.notEqual(rows[0].file_url, null);
});

test("non-video uploader rejects video files and manifests while allowing audio MP4", () => {
  for (const file of [{ name: "clip.MP4", type: "application/octet-stream" }, { name: "clip", type: "video/mp4" }, { name: "playlist.m3u8", type: "text/plain" }]) {
    assert.equal(isVideoFile(file), true);
  }
  for (const file of [{ name: "voice.mp4", type: "audio/mp4" }, { name: "slides.pdf", type: "application/pdf" }, { name: "workflow.json", type: "application/json" }]) {
    assert.equal(isVideoFile(file), false);
  }
});
