import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule } from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const sessionId = "7caceae2-03eb-4bc7-a80f-3ef463ff52fd";
const videoId = "26d3d809-b72c-486f-a28c-05ef5719aff8";
const source = await readFile(new URL("../app/api/course/[sessionId]/videos/[videoId]/playback/route.ts", import.meta.url), "utf8");

async function handler({ signedIn = true, main = videoId, resources = [], dbError = null, signError = false } = {}) {
  let signatures = 0;
  const mocks = {
    "@/lib/auth/device-session": { getActiveDeviceSession: async () => signedIn ? { user: { id: "test-user" } } : null },
    "@/lib/bunny-playback": {
      BUNNY_VIDEO_ID_RE: /^[0-9a-f-]{36}$/i,
      createBunnyPlayback: async () => {
        signatures++;
        if (signError) throw new Error("private upstream detail");
        return { embedUrl: `https://player.mediadelivery.net/embed/739542/${videoId}?token=test&expires=999999`, expires: 999999 };
      },
    },
    "@/lib/forensic-watermark": { forensicViewerToken: () => "A7K2LM" },
    "@/lib/supabase/admin": { createAdminClient: () => ({ from: (table) => {
      const result = { data: table === "sessions" ? { main_video_bunny_id: main } : resources, error: dbError };
      const query = {
        select() { return this; }, eq() { return this; }, in() { return this; }, limit() { return this; },
        maybeSingle: async () => result, then: (resolve) => Promise.resolve(result).then(resolve),
      };
      return query;
    } }) },
  };
  const mod = new SourceTextModule(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  await mod.link((specifier) => {
    const values = mocks[specifier];
    assert.ok(values, `Unexpected dependency ${specifier}`);
    return new SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); });
  });
  await mod.evaluate();
  return { run: (headers = {}, ids = { sessionId, videoId }) => mod.namespace.GET(new Request("https://arabautomators.com/api/playback", { headers }), { params: Promise.resolve(ids) }), signatures: () => signatures };
}

test("playback API refuses logged-out, cross-site and unrelated-video requests without signing", async () => {
  for (const [options, headers, status] of [[{ signedIn: false }, {}, 401], [{}, { "sec-fetch-site": "cross-site" }, 403], [{ main: "unrelated" }, {}, 404], [{ dbError: {} }, {}, 404]]) {
    const h = await handler(options);
    assert.equal((await h.run(headers)).status, status);
    assert.equal(h.signatures(), 0);
  }
});

test("playback API signs linked main/supplemental video with private uncacheable response", async () => {
  for (const options of [{}, { main: null, resources: [{ id: "linked-resource" }] }]) {
    const h = await handler(options);
    const response = await h.run();
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /private, no-store/);
    assert.equal(response.headers.get("vary"), "Cookie");
    assert.deepEqual(Object.keys(await response.json()).sort(), ["embedUrl", "expires", "watermark"]);
    assert.equal(h.signatures(), 1);
  }
});

test("playback API returns a generic failure when protection is unavailable", async () => {
  const h = await handler({ signError: true });
  const response = await h.run();
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private upstream detail|https:/);
});
