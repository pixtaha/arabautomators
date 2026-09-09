import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule } from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/api/tasks/leaderboard/route.ts", import.meta.url), "utf8");

async function call(session) {
  let fromCalls = 0;
  const admin = { from() {
    fromCalls += 1;
    const value = fromCalls === 1
      ? { data: [{ student_id: "private-user-id" }], error: null }
      : { data: [{ id: "private-user-id", username: "public-name", avatar_url: null }] };
    const query = { select() { return this; }, eq() { return this; }, gte() { return this; }, in() { return this; }, then(resolve) { return Promise.resolve(value).then(resolve); } };
    return query;
  } };
  const mocks = {
    "@/lib/auth/device-session": { getActiveDeviceSession: async () => session },
    "@/lib/supabase/admin": { createAdminClient: () => admin },
    "@/lib/time": { getRangeStart: () => null, POINTS_RANGES: ["day", "week", "month", "all"] },
  };
  const mod = new SourceTextModule(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  await mod.link((specifier) => new SyntheticModule(Object.keys(mocks[specifier]), function () { for (const [key, value] of Object.entries(mocks[specifier])) this.setExport(key, value); }));
  await mod.evaluate();
  return mod.namespace.GET(new Request("https://arabautomators.com/api/tasks/leaderboard?range=all"));
}

test("logged-out and authenticated visitors receive a public-safe leaderboard", async () => {
  for (const session of [null, { user: { id: "someone-else" } }]) {
    const response = await call(session);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(Object.keys(body.board[0]).sort(), ["avatarUrl", "isMe", "name", "rank", "tasksCompleted"].sort());
    assert.equal(body.board[0].name, "public-name");
    assert.equal(body.board[0].isMe, false);
    assert.doesNotMatch(JSON.stringify(body), /email|phone|metadata|private-user-id/);
  }
});
