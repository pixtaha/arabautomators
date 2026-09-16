// Run with installed/cached Playwright and esbuild, using the same module
// path environment variables as the other browser checks in this project.
// All tasks and HTTP responses are fixtures, never production data.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const { chromium, expect } = await import(process.env.PLAYWRIGHT_MODULE_PATH
  ? new URL("./test.mjs", pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH)).href
  : "playwright/test");
const { build } = await import(process.env.ESBUILD_MODULE_PATH ?? "esbuild");
const bundle = await build({
  stdin: {
    contents: `import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { flushSync } from 'react-dom';
      import { TaskBoardClient } from './components/dashboard/TaskBoardClient';
      import TaskBoardError from './app/dashboard/task-board/error';
      const root = createRoot(document.getElementById('root')); let generation = 0;
      window.mountBoard = (tasks, submissions = []) => flushSync(() => root.render(<TaskBoardClient key={++generation}
        initialTasks={tasks} initialSubmissions={submissions} initialCompletions={{}} initialResources={{}} />));
      window.retries = 0;
      window.mountError = () => root.render(<TaskBoardError error={new Error('private database diagnostic')}
        retry={() => window.retries++} />);`,
    loader: "tsx", resolveDir: process.cwd(),
  },
  plugins: [{ name: "page-chrome", setup(build) {
    build.onResolve({ filter: /^@\/components\/layout\/Header$/ }, (args) => ({ path: args.path, namespace: "test-stub" }));
    build.onLoad({ filter: /.*/, namespace: "test-stub" }, () => ({ contents: "export function Header() { return null; }" }));
  } }],
  bundle: true, write: false, platform: "browser", format: "iife",
  define: { "process.env.NODE_ENV": '"production"' }, tsconfig: "tsconfig.json",
});
const task = {
  id: "fixture-task", title: "Fixture workflow", order_index: 1, is_active: true,
  description: "First step\n\nSecond step", checklist: [], start_at: null, end_at: null,
  points_base: 10, points_medium: 20, points_hard: 30,
  description_base: null, description_medium: null, description_hard: null,
  checklist_base: null, checklist_medium: null, checklist_hard: null,
  requires_link: true, requires_pdf: false, requires_image: false, requires_video: false, requires_file: false,
  requires_code: false, requires_screenshots: false, submission_link_label: "Workflow URL",
  submission_pdf_label: "Workflow PDF", submission_image_label: "Result image",
  submission_video_label: "Workflow recording", submission_file_label: "Workflow JSON",
  submission_code_placeholder: "Paste the output", completed_color_base: "#fde68a", completed_color_medium: "#123456",
};

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let responseMode = "success";
  let releaseMove;
  let moveRequests = 0;
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' });
    if (url.pathname === "/api/task-board") return route.fulfill({ contentType: "application/json", body: JSON.stringify({ completions: {} }) });
    if (url.pathname.endsWith("/submission") && route.request().method() === "POST") {
      const isMove = route.request().headers()["content-type"]?.includes("application/json");
      const status = isMove ? route.request().postDataJSON().status : "submitted";
      if (isMove) moveRequests++;
      if (responseMode === "hold") {
        await new Promise((resolve) => { releaseMove = resolve; });
      }
      if (responseMode === "network-error") return route.abort("failed");
      if (responseMode === "reject") return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "Cannot move this task." }) });
      if (responseMode === "malformed") return route.fulfill({ contentType: "application/json", body: "{}" });
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ submission: {
        id: "fixture-submission", task_id: task.id, status, level: "base", points_awarded: 0,
      } }) });
    }
    return route.abort();
  });
  await page.goto("https://task-board.test/");
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const card = page.locator("[draggable]");
  const column = (name) => page.getByText(name, { exact: true }).locator("..").locator("..");
  async function mount(overrides = {}, submissions = []) {
    await page.evaluate(({ task, submissions }) => window.mountBoard([task], submissions), { task: { ...task, ...overrides }, submissions });
    await expect(card).toHaveCount(1);
  }
  async function moveTo(name) {
    await card.dispatchEvent("dragstart");
    await column(name).locator(":scope > div").nth(1).dispatchEvent("drop");
  }

  await mount({ requires_pdf: true, requires_image: true, requires_video: true, requires_file: true, requires_code: true });
  await card.click();
  for (const label of ["Workflow URL", "Workflow PDF", "Result image", "Workflow recording", "Workflow JSON"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByPlaceholder("Paste the output")).toBeVisible();
  await expect(page.getByPlaceholder("هل لديك ملاحظة؟")).toBeVisible();
  await expect(page.getByText("First step", { exact: true }).locator("..")).toHaveText("1.First step");
  await expect(page.getByText("Second step", { exact: true }).locator("..")).toHaveText("2.Second step");
  console.log("PASS custom labels, placeholders, numbered descriptions, and modal contents");

  for (const [level, color] of [["base", "rgb(253, 230, 138)"], ["medium", "rgb(18, 52, 86)"], ["hard", "rgb(0, 120, 88)"]]) {
    await mount({}, [{ task_id: task.id, status: "approved", level, points_awarded: 10 }]);
    await expect(card).toHaveCSS("background-color", color);
    await expect(card).toHaveAttribute("draggable", "false");
  }
  console.log("PASS approved completion colors for all levels and locked cards");

  await mount();
  responseMode = "hold";
  await moveTo("In progress");
  await expect(column("In progress").locator("[draggable]")).toHaveCount(1);
  await expect(card).toHaveAttribute("aria-busy", "true");
  await expect(card).toHaveAttribute("draggable", "false");
  // Even synthetic repeated drops cannot submit a second simultaneous move.
  await moveTo("To do");
  await expect.poll(() => moveRequests).toBe(1);
  responseMode = "success";
  releaseMove();
  await expect(card).toHaveAttribute("aria-busy", "false");
  await expect(column("In progress").locator("[draggable]")).toHaveCount(1);
  console.log("PASS immediate optimistic move, duplicate-move guard, and server reconciliation");

  for (const mode of ["network-error", "reject", "malformed"]) {
    await mount();
    responseMode = mode;
    await moveTo("In progress");
    await expect(column("To do").locator("[draggable]")).toHaveCount(1);
    await expect(card).toHaveAttribute("aria-busy", "false");
    await expect(page.getByText(mode === "reject" ? "Cannot move this task." : /Could not move task/)).toBeVisible();
  }
  console.log("PASS optimistic rollback on network failure, rejected requests, and malformed responses");

  await mount();
  await card.click();
  await page.getByPlaceholder("https://").fill("https://example.test/workflow");
  responseMode = "reject";
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByRole("heading", { name: task.title })).toBeVisible();
  await expect(page.getByText("Cannot move this task.", { exact: true })).toBeVisible();
  responseMode = "success";
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByRole("heading", { name: task.title })).toHaveCount(0);
  await expect(column("Completed").locator("[draggable]")).toHaveCount(1);
  console.log("PASS modal stays open on failed submission and closes after success");

  await page.evaluate(() => window.mountError());
  await expect(page.getByRole("alert")).toContainText("Could not load your Task Board");
  assert.ok(!(await page.locator("#root").innerText()).includes("private database diagnostic"));
  await page.getByRole("button", { name: "Try again" }).click();
  assert.equal(await page.evaluate(() => window.retries), 1);
  assert.deepEqual(errors, []);
  console.log("PASS generic error state, retry callback, and no browser runtime exceptions");
} finally {
  await browser.close();
}
