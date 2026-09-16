import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { SourceTextModule, SyntheticModule } from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { loadTsModule } from "./load-ts-module.mjs";

const databaseError = { code: "42703", message: "column task_board_tasks.submission_pdf_label does not exist" };
const task = { id: "fixture-task", title: "Expected task", is_active: true, order_index: 1 };

function database(respond = () => ({ data: [], error: null })) {
  const calls = [];
  return {
    calls,
    from(table) {
      const query = { table, columns: null, filters: [], order: null };
      calls.push(query);
      return {
        select(columns) { query.columns = columns; return this; },
        eq(...filter) { query.filters.push(filter); return this; },
        in(...filter) { query.filters.push(filter); return this; },
        order(column) { query.order = column; return this; },
        maybeSingle() { const result = respond(query); return Promise.resolve({ ...result, data: result.data?.[0] ?? null }); },
        then(resolve, reject) { return Promise.resolve(respond(query)).then(resolve, reject); },
      };
    },
  };
}

function loadData(db) {
  return loadTsModule("lib/data/taskBoard.ts", { "@/lib/supabase/admin": { createAdminClient: () => db } });
}

function loadApi(db, session = { user: { id: "fixture-student" } }) {
  return loadTsModule("app/api/task-board/route.ts", {
    "@/lib/supabase/admin": { createAdminClient: () => db },
    "@/lib/auth/device-session": { getActiveDeviceSession: async () => session },
  });
}

async function loadComponent(path) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  const mocks = {
    react: React, "react/jsx-runtime": jsxRuntime,
    "react-syntax-highlighter": { Prism: () => null },
    "react-syntax-highlighter/dist/esm/styles/prism": { oneLight: {} },
    "@/components/layout/Header": { Header: () => null },
    "@/components/ui/Avatar": { Avatar: () => null },
    "@/components/ui/Button": { Button: (props) => React.createElement("button", props) },
  };
  const mod = new SourceTextModule(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText);
  await mod.link((name) => {
    assert.ok(mocks[name], `Unexpected component dependency: ${name}`);
    return new SyntheticModule(Object.keys(mocks[name]), function () {
      for (const [key, value] of Object.entries(mocks[name])) this.setExport(key, value);
    });
  });
  await mod.evaluate();
  return mod.namespace;
}

test("successful task loading preserves rows, the activity filter, and ordering", async () => {
  const db = database(() => ({ data: [task], error: null }));
  const data = await loadData(db);
  assert.deepEqual(await data.getActiveTaskBoardTasks(), [task]);
  assert.deepEqual(db.calls[0].filters, [["is_active", true]]);
  assert.equal(db.calls[0].order, "order_index");
});

test("an empty successful query remains distinct from failure", async () => {
  const db = database();
  const data = await loadData(db);
  assert.deepEqual(await data.getActiveTaskBoardTasks(), []);
  assert.equal(await data.getTaskBoardTaskById(task.id), null);
  const response = await (await loadApi(db)).GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { tasks: [], submissions: [], completions: {}, resources: {} });
});

test("database failures are logged server-side and never become empty task data", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const data = await loadData(database(() => ({ data: null, error: databaseError })));
  for (const [method, args] of [
    ["getActiveTaskBoardTasks", []], ["getTaskBoardTaskById", [task.id]],
    ["getStudentSubmissions", ["fixture-student"]], ["getResourcesByTaskIds", [[task.id]]],
    ["getTaskCompletions", []],
  ]) {
    await assert.rejects(data[method](...args), (error) => {
      assert.ok(error instanceof data.TaskBoardReadError);
      assert.doesNotMatch(error.message, /42703|submission_pdf_label|task_board_tasks/);
      return true;
    });
  }
  assert.equal(log.mock.calls.length, 5);
  assert.ok(log.mock.calls.every(({ arguments: args }) => args[1].code === databaseError.code && args[1].message === databaseError.message));
});

test("unexpected null query data is also an error", async (t) => {
  t.mock.method(console, "error", () => {});
  const data = await loadData(database(() => ({ data: null, error: null })));
  await assert.rejects(data.getActiveTaskBoardTasks(), data.TaskBoardReadError);
});

test("profile/admin lookup failures cannot silently hide completions or bypass admin exclusion", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const failedColumns of ["id, username, avatar_url", "id"]) {
    const db = database(({ table, columns }) => {
      if (table === "task_board_submissions") return { data: [{ task_id: task.id, student_id: "fixture-student" }], error: null };
      if (columns === failedColumns) return { data: null, error: databaseError };
      return { data: [], error: null };
    });
    const data = await loadData(db);
    await assert.rejects(data.getTaskCompletions(), data.TaskBoardReadError);
  }
});

test("API returns a non-cacheable 503 without database details or an empty tasks array", async (t) => {
  t.mock.method(console, "error", () => {});
  const api = await loadApi(database(({ table }) => table === "task_board_tasks"
    ? { data: null, error: databaseError } : { data: [], error: null }));
  const response = await api.GET();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const body = await response.json();
  assert.deepEqual(Object.keys(body), ["error"]);
  assert.match(body.error, /Could not load/);
  assert.doesNotMatch(JSON.stringify(body), /42703|submission_pdf_label|task_board_tasks/);
});

test("unauthenticated requests are rejected before task database access", async () => {
  const db = database();
  const response = await (await loadApi(db, null)).GET();
  assert.equal(response.status, 401);
  assert.equal(db.calls.length, 0);
});

test("all seven new queried fields are provided by the additive migration", async () => {
  const db = database();
  await (await loadData(db)).getActiveTaskBoardTasks();
  const sql = await readFile(new URL("../supabase/migrations/20260916_task_board_custom_labels_and_completion_colors.sql", import.meta.url), "utf8");
  const statements = sql.replace(/--[^\n]*/g, "").split(";").map((statement) => statement.trim()).filter(Boolean);
  assert.equal(statements.length, 7);
  for (const statement of statements) {
    const match = statement.match(/^alter table public\.task_board_tasks\s+add column if not exists (\w+) text$/i);
    assert.ok(match, "migration must only add nullable text columns");
    assert.ok(db.calls[0].columns.split(", ").includes(match[1]));
  }
});

test("optional completion colors normalize valid values and reject invalid CSS", async () => {
  const { parseHexColor } = await loadTsModule("lib/taskBoardValidation.ts");
  assert.deepEqual(parseHexColor(null, "Color"), { value: null });
  assert.deepEqual(parseHexColor(" #AbC123 ", "Color"), { value: "#abc123" });
  for (const color of ["red", "#abc", "#gggggg", "url(example.com)"]) assert.ok("error" in parseHexColor(color, "Color"));
});

test("fixture cards render for all statuses, levels, and scheduling states", async () => {
  const { TaskBoardClient } = await loadComponent("components/dashboard/TaskBoardClient.tsx");
  const row = { ...task, points_base: 10, points_medium: 20, points_hard: 30, checklist: [],
    start_at: null, end_at: null, completed_color_base: "#fde68a", completed_color_medium: "#123456" };
  const render = (task, submissions) => renderToStaticMarkup(React.createElement(TaskBoardClient, {
    initialTasks: [task], initialSubmissions: submissions, initialCompletions: {}, initialResources: {},
  }));
  for (const status of [null, "todo", "progress", "submitted", "reviewing", "approved"]) {
    for (const level of ["base", "medium", "hard"]) {
      const html = render(row, status ? [{ task_id: row.id, status, level, points_awarded: 10 }] : []);
      assert.ok(html.includes(task.title), `${status}/${level} card should render`);
      if (status === "approved") assert.ok(html.includes(`background-color:${{ base: "#fde68a", medium: "#123456", hard: "#007858" }[level]}`));
    }
  }
  for (const dates of [{ start_at: "2099-01-01T00:00:00Z" }, { end_at: "2020-01-01T00:00:00Z" }]) {
    assert.ok(render({ ...row, ...dates }, []).includes(task.title));
  }
});

test("page failure renders a generic retry state without private diagnostic text", async () => {
  const { default: ErrorPage } = await loadComponent("app/dashboard/task-board/error.tsx");
  const html = renderToStaticMarkup(React.createElement(ErrorPage, { error: new Error(databaseError.message), retry() {} }));
  assert.match(html, /role="alert"/);
  assert.match(html, /Could not load your Task Board/);
  assert.match(html, /Try again/);
  assert.doesNotMatch(html, /submission_pdf_label|task_board_tasks/);
});
