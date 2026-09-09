import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { loadTsModule } from "./load-ts-module.mjs";

const sessionId = "7caceae2-03eb-4bc7-a80f-3ef463ff52fd";
const videoId = "5b775e705e8c43278ff60092a17c680a";
const session = { id: sessionId, title: "Session 1: n8n Foundations — Getting Started", main_video_bunny_id: "26d3d809-b72c-486f-a28c-05ef5719aff8" };
const resources = [
  { id: "1afe54f0-aab2-4583-8d77-22a591cb9885", session_id: sessionId, type: "video", title: "Main video General", order_index: 3, bunny_video_id: null },
  { id: "6965a2fa-9dbf-422a-8d64-61e5ed7ce3e2", session_id: sessionId, type: "credential_video", title: "Supabase", order_index: 5, bunny_video_id: null },
];
const partIds = ["main", ...resources.map((r) => r.id)];
const testSecret = "vdocipher-test-only-secret";
const originalFetch = globalThis.fetch;
const names = ["VDOCIPHER_API_SECRET", "SESSION_VIDEO_PROVIDER_OVERRIDES_ENABLED"];
const originalEnv = names.map((name) => process.env[name]);
afterEach(() => {
  globalThis.fetch = originalFetch;
  names.forEach((name, i) => {
    if (originalEnv[i] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[i];
  });
});

test("provider links validate both providers, preserve inactive IDs, and reject invalid or missing IDs", async () => {
  const { parseVideoLink, resolveVideoSource, videoResourceFields, mainVideoFields } = await loadTsModule("lib/video-provider.ts");
  const vdo = parseVideoLink({ videoProvider: "vdocipher", vdocipherVideoId: videoId });
  assert.deepEqual(vdo, { source: { provider: "vdocipher", videoId } });
  assert.deepEqual(videoResourceFields(vdo.source), { video_provider: "vdocipher", vdocipher_video_id: videoId });
  assert.deepEqual(mainVideoFields(vdo.source), { main_video_provider: "vdocipher", main_video_vdocipher_id: videoId });
  const bunnyId = "26d3d809-b72c-486f-a28c-05ef5719aff8";
  const bunny = parseVideoLink({ videoProvider: "bunny", bunnyVideoId: bunnyId });
  assert.deepEqual(bunny, { source: { provider: "bunny", videoId: bunnyId } });
  assert.deepEqual(videoResourceFields(bunny.source), { video_provider: "bunny", bunny_video_id: bunnyId });
  assert.deepEqual(mainVideoFields(bunny.source), { main_video_provider: "bunny", main_video_bunny_id: bunnyId });
  assert.equal(resolveVideoSource(null, bunnyId, null)?.provider, "bunny");
  assert.equal(resolveVideoSource("vdocipher", bunnyId, videoId)?.provider, "vdocipher");
  assert.equal(resolveVideoSource("bunny", bunnyId, videoId)?.provider, "bunny");
  for (const input of [
    { videoProvider: "invalid", vdocipherVideoId: videoId },
    { videoProvider: "vdocipher", vdocipherVideoId: "not-an-id" },
    { videoProvider: "vdocipher" },
    { videoProvider: "bunny", bunnyVideoId: "not-an-id" },
    { videoProvider: "bunny" },
  ]) assert.ok(parseVideoLink(input).error);
});

test("VdoCipher verification requires a ready video and Bunny verification stays provider-specific", async () => {
  process.env.VDOCIPHER_API_SECRET = testSecret;
  const { verifyVideoLink } = await loadTsModule("lib/admin-video-link.ts", {
    "@/lib/bunny": { getBunnyVideo: async (id) => ({ guid: id, isFinished: true }) },
  });
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return Response.json({ id: videoId, status: "ready" });
  };
  assert.equal(await verifyVideoLink({ provider: "vdocipher", videoId }), null);
  assert.equal(request.url, `https://dev.vdocipher.com/api/videos/${videoId}`);
  assert.equal(request.options.headers.Authorization, `Apisecret ${testSecret}`);
  assert.equal(await verifyVideoLink({ provider: "bunny", videoId: "26d3d809-b72c-486f-a28c-05ef5719aff8" }), null);
  globalThis.fetch = async () => Response.json({ id: videoId, status: "queued" });
  assert.equal((await verifyVideoLink({ provider: "vdocipher", videoId })).status, 400);
});

test("admin resource routes create VdoCipher/Bunny links and relink providers without clearing inactive IDs", async () => {
  const stored = { id: "11111111-1111-4111-8111-111111111111", type: "video", title: "Lesson", file_url: null, bunny_video_id: "26d3d809-b72c-486f-a28c-05ef5719aff8", video_provider: "bunny", vdocipher_video_id: null, order_index: 0, file_size_bytes: null, page_count: null };
  let update;
  const { POST } = await loadTsModule("app/api/admin/session-resources/route.ts", {
    "@/lib/adminAuth": { requireAdmin: async () => ({ id: "admin" }) },
    "@/lib/admin-video-link": { verifyVideoLink: async () => null },
    "@/lib/supabase/admin": { createAdminClient: () => ({ from(table) {
      const chain = {
        select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; },
        maybeSingle: async () => table === "sessions" ? { data: { id: sessionId }, error: null } : { data: null, error: null },
        then(resolve) { return Promise.resolve({ data: table === "session_resources" ? [{ order_index: 0 }] : [], error: null }).then(resolve); },
        insert(row) { return { select: () => ({ single: async () => { const resource = { ...stored, ...row }; return { data: resource, error: null }; } }) }; },
      };
      return chain;
    } }) },
  });
  const create = async (provider, fields) => {
    const form = new FormData();
    form.set("sessionId", sessionId); form.set("type", "video"); form.set("title", "Lesson"); form.set("videoProvider", provider);
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    const response = await POST(new Request("https://arabautomators.com/api/admin/session-resources", { method: "POST", body: form }));
    assert.equal(response.status, 200);
    return response.json();
  };
  assert.equal((await create("vdocipher", { vdocipherVideoId: videoId })).resource.video_provider, "vdocipher");
  assert.equal((await create("bunny", { bunnyVideoId: stored.bunny_video_id })).resource.video_provider, "bunny");

  const patch = await loadTsModule("app/api/admin/session-resources/[id]/route.ts", {
    "@/lib/adminAuth": { requireAdmin: async () => ({ id: "admin" }) },
    "@/lib/bunny-playback": { BUNNY_VIDEO_ID_RE: /^[0-9a-f-]{36}$/i },
    "@/lib/admin-video-link": { verifyVideoLink: async () => null },
    "@/lib/supabase/admin": { createAdminClient: () => ({ from() {
      return {
        select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: stored, error: null }),
        update(row) { update = row; return { eq() { return this; }, in() { return this; }, select: () => ({ single: async () => ({ data: { ...stored, ...row }, error: null }) }) }; },
      };
    } }) },
  });
  const patchResponse = await patch.PATCH(new Request("https://arabautomators.com/api/admin/session-resources/11111111-1111-4111-8111-111111111111", {
    method: "PATCH", body: JSON.stringify({ videoProvider: "vdocipher", vdocipherVideoId: videoId }), headers: { "content-type": "application/json" },
  }), { params: Promise.resolve({ id: stored.id }) });
  assert.equal(patchResponse.status, 200);
  assert.deepEqual(update, { video_provider: "vdocipher", vdocipher_video_id: videoId, file_url: null });
});

test("three distinct Session 1 parts retain titles/order and independent provider mappings", async () => {
  const { getSessionVideoParts } = await loadTsModule("lib/session-video-parts.ts");
  const before = JSON.stringify({ session, resources });
  const parts = getSessionVideoParts(session, [...resources].reverse());
  assert.deepEqual(parts.map((p) => p.id), partIds);
  assert.deepEqual(parts.map((p) => p.title), [session.title, ...resources.map((r) => r.title)]);
  assert.ok(parts.every((p) => p.source.provider === "vdocipher" && p.source.videoId === videoId));
  assert.equal(new Set(parts.map((p) => p.source)).size, 3);
  assert.equal(JSON.stringify({ session, resources }), before);
  assert.equal(getSessionVideoParts({ ...session, id: "13f60427-9d16-4005-8d0f-4ad15ccc1127" }, []), null);
  process.env.SESSION_VIDEO_PROVIDER_OVERRIDES_ENABLED = "false";
  assert.equal(getSessionVideoParts(session, resources), null);
});

test("parts support different VdoCipher IDs, mixed Bunny sources and additional resources", async () => {
  const overrides = {
    main: { provider: "vdocipher", videoId },
    [resources[0].id]: { provider: "vdocipher", videoId: "a".repeat(32) },
  };
  const { getSessionVideoParts } = await loadTsModule("lib/session-video-parts.ts", {
    "@/lib/video-provider-config": { getSessionVideoOverrides: () => overrides },
  });
  const extra = { ...resources[0], id: "extra", title: "Additional part", order_index: 4, bunny_video_id: session.main_video_bunny_id };
  const parts = getSessionVideoParts(session, [...resources, extra, { ...extra, id: "foreign", session_id: "other" }, { ...extra, id: "pdf", type: "pdf" }]);
  assert.equal(parts.length, 4);
  assert.equal(parts[1].source.videoId, "a".repeat(32));
  assert.equal(parts[2].source.provider, "bunny");
  assert.equal(parts[3].source, null);
});

test("OTP uses a server Authorization header, five-minute TTL and existing dynamic viewer mark", async () => {
  process.env.VDOCIPHER_API_SECRET = testSecret;
  const { createVdoCipherPlayback } = await loadTsModule("lib/vdocipher-playback.ts");
  let options;
  globalThis.fetch = async (url, input) => {
    assert.equal(url, `https://dev.vdocipher.com/api/videos/${videoId}/otp`);
    options = input;
    return Response.json({ otp: "otp+/=", playbackInfo: "info+/=", privateField: testSecret });
  };
  const now = Math.floor(Date.now() / 1000);
  const result = await createVdoCipherPlayback(videoId.toUpperCase(), { name: "test.viewer", token: "A7K2LM" });
  assert.equal(options.method, "POST");
  assert.equal(options.headers.Authorization, `Apisecret ${testSecret}`);
  assert.equal(options.cache, "no-store");
  assert.equal(options.redirect, "error");
  assert.ok(options.signal instanceof AbortSignal);
  const body = JSON.parse(options.body);
  assert.equal(body.ttl, 300);
  const [mark] = JSON.parse(body.annotate);
  assert.equal(mark.type, "rtext");
  assert.equal(mark.text, "@test.viewer · A7K2LM");
  assert.equal(mark.skip, "0");
  assert.ok(Number(mark.interval) > 0);
  const embed = new URL(result.embedUrl);
  assert.equal(embed.origin, "https://player.vdocipher.com");
  assert.equal(embed.pathname, "/v2/");
  assert.equal(embed.searchParams.get("otp"), "otp+/=");
  assert.equal(embed.searchParams.get("playbackInfo"), "info+/=");
  assert.ok(result.expires >= now + 300 && result.expires <= now + 301);
  assert.deepEqual(Object.keys(result).sort(), ["embedUrl", "expires"]);
  assert.equal(JSON.stringify(result).includes(testSecret), false);
});

test("OTP fails closed without configuration or watermark and sanitizes every upstream failure", async () => {
  const { createVdoCipherPlayback } = await loadTsModule("lib/vdocipher-playback.ts");
  const watermark = { name: "viewer", token: "A7K2LM" };
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error(testSecret); };
  delete process.env.VDOCIPHER_API_SECRET;
  await assert.rejects(createVdoCipherPlayback(videoId, watermark));
  process.env.VDOCIPHER_API_SECRET = testSecret;
  await assert.rejects(createVdoCipherPlayback("../arbitrary", watermark));
  await assert.rejects(createVdoCipherPlayback(videoId, { ...watermark, token: "" }));
  assert.equal(calls, 0);
  for (const fetcher of [
    async () => { throw new Error(testSecret); },
    async () => new Response(testSecret, { status: 403 }),
    async () => new Response(testSecret),
    ...[null, {}, { otp: 12, playbackInfo: "ok" }, { otp: " ", playbackInfo: "ok" },
      { otp: "ok", playbackInfo: testSecret }, { otp: testSecret, playbackInfo: "ok" },
      { otp: "ok", playbackInfo: "x".repeat(32_769) }].map((body) => async () => Response.json(body)),
  ]) {
    globalThis.fetch = fetcher;
    await assert.rejects(createVdoCipherPlayback(videoId, watermark), (error) => {
      assert.equal(error.message, "Protected video authorization is unavailable.");
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

async function handler({ active = true, sessionRow = session, rows = resources, dbError = false, username = "test.<viewer>", upstreamFailure = false, authFailure = false, watermarkFailure = false, requestUrl = "https://arabautomators.com/api/playback" } = {}) {
  const calls = [];
  const filters = [];
  let dbCalls = 0;
  let identity;
  const { POST } = await loadTsModule("app/api/course/[sessionId]/parts/[partId]/playback/route.ts", {
    "@/lib/siteUrl": { SITE_URL: "https://arabautomators.com" },
    "@/lib/auth/device-session": { getActiveDeviceSession: async (options) => {
      assert.equal(options.touch, true);
      if (authFailure) throw new Error(testSecret);
      return active ? { user: { id: "user" }, deviceSessionId: "device", authSessionId: "auth" } : null;
    } },
    "@/lib/forensic-watermark": { forensicViewerToken: (input) => {
      identity = input;
      if (watermarkFailure) throw new Error(testSecret);
      return "A7K2LM";
    } },
    "@/lib/supabase/admin": { createAdminClient: () => ({ from(table) {
      dbCalls++;
      const result = { data: table === "sessions" ? sessionRow : table === "profiles" ? { username } : rows, error: dbError ? {} : null };
      return {
        select() { return this; }, eq(...args) { filters.push([table, ...args]); return this; }, in() { return this; },
        maybeSingle: async () => result, then: (resolve) => Promise.resolve(result).then(resolve),
      };
    } }) },
    "@/lib/vdocipher-playback": { createVdoCipherPlayback: async (id, watermark) => {
      calls.push({ id, watermark });
      if (upstreamFailure) throw new Error(testSecret);
      return { embedUrl: "https://player.vdocipher.com/v2/?otp=test&playbackInfo=test", expires: 1234, privateExtra: testSecret };
    } },
  });
  return {
    calls, filters, dbCalls: () => dbCalls, identity: () => identity,
    run: (partId = "main", headers = {}, requestedSessionId = sessionId) => POST(
      new Request(requestUrl, { method: "POST", headers, body: JSON.stringify({ videoId: "attacker-video", provider: "bunny" }) }),
      { params: Promise.resolve({ sessionId: requestedSessionId, partId }) },
    ),
  };
}

test("each of the three authorized parts obtains fresh playback through its own part identity", async () => {
  const h = await handler();
  for (const id of partIds) {
    const response = await h.run(id);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /private, no-store/);
    assert.equal(response.headers.get("vary"), "Cookie");
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["embedUrl", "expires"]);
    assert.equal(JSON.stringify(body).includes(testSecret), false);
  }
  assert.equal(h.calls.length, 3);
  assert.ok(h.calls.every((c) => c.id === videoId && c.watermark.name === "test.viewer" && c.watermark.token === "A7K2LM"));
  assert.deepEqual(h.identity(), { userId: "user", deviceSessionId: "device", authSessionId: "auth" });
  assert.ok(h.filters.some((f) => f[0] === "sessions" && f[1] === "id" && f[2] === sessionId));
  assert.ok(h.filters.some((f) => f[0] === "session_resources" && f[1] === "session_id" && f[2] === sessionId));
});

test("authorization blocks logged-out/revoked devices, foreign requests and database failures before OTP", async () => {
  for (const [options, headers, status] of [
    [{ active: false }, {}, 401],
    [{}, { "sec-fetch-site": "cross-site" }, 403],
    [{}, { origin: "https://attacker.example" }, 403],
    [{ sessionRow: null }, {}, 404], [{ dbError: true }, {}, 404],
    [{ authFailure: true }, {}, 503], [{ watermarkFailure: true }, {}, 503],
  ]) {
    const h = await handler(options);
    const response = await h.run("main", headers);
    assert.equal(response.status, status);
    assert.equal(h.calls.length, 0);
    assert.equal((await response.text()).includes(testSecret), false);
    if (status === 401 || status === 403) assert.equal(h.dbCalls(), 0);
  }
});

test("the public production origin is accepted behind the standalone Docker reverse proxy", async () => {
  const h = await handler({ requestUrl: "http://0.0.0.0:3000/api/playback" });
  const response = await h.run("main", { origin: "https://arabautomators.com", "sec-fetch-site": "same-origin" });
  assert.equal(response.status, 200);
  assert.equal(h.calls.length, 1);
});

test("raw video IDs, missing/foreign/non-video parts, other sessions and rollback cannot obtain an OTP", async () => {
  for (const [options, partId, id] of [
    [{}, videoId, sessionId], [{}, "../main", sessionId], [{}, "main", "invalid"],
    [{ rows: [] }, resources[0].id, sessionId],
    [{ rows: [{ ...resources[0], session_id: "other" }] }, resources[0].id, sessionId],
    [{ rows: [{ ...resources[0], type: "pdf" }] }, resources[0].id, sessionId],
    [{ sessionRow: { ...session, id: "13f60427-9d16-4005-8d0f-4ad15ccc1127" } }, "main", "13f60427-9d16-4005-8d0f-4ad15ccc1127"],
  ]) {
    const h = await handler(options);
    assert.equal((await h.run(partId, {}, id)).status, 404);
    assert.equal(h.calls.length, 0);
  }
  process.env.SESSION_VIDEO_PROVIDER_OVERRIDES_ENABLED = "false";
  const h = await handler();
  assert.equal((await h.run()).status, 404);
  assert.equal(h.calls.length, 0);
});

test("playback failure never echoes secret-bearing errors and absent usernames retain the viewer fallback", async () => {
  const failed = await handler({ upstreamFailure: true });
  const response = await failed.run();
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes(testSecret), false);
  const fallback = await handler({ username: null });
  assert.equal((await fallback.run()).status, 200);
  assert.equal(fallback.calls[0].watermark.name, "viewer");
});
