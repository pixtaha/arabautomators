// Run with cached or installed Playwright/esbuild, as in vdocipher-player.browser.mjs.
// Network responses and credentials are synthetic; no student session is used.
//
// Bundles HeroInfoStrip + CommerceCredentialDialog exactly as
// app/dashboard/api-lab-docs/page.tsx composes them, then drives the real
// rendered trigger button the way a student would -- a click, not a
// synthetic keyboard event on a hand-built DOM. This replaces the previous
// version of this test, which bundled the old ApiLabDocsClient and loaded
// public/api-lab-docs/support.js + _ds_bundle.js from disk to boot the
// design-canvas runtime that used to render the page; that whole mechanism
// (and those files) no longer exist -- the page is now plain React, so the
// trigger and dialog need no runtime to load at all, and there is no
// next/script or Header dependency left to stub out either.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const { build } = await import(process.env.ESBUILD_MODULE_PATH ?? "esbuild");
const bundle = await build({
  stdin: {
    contents: `import React from 'react';
      import * as ReactDOM from 'react-dom/client';
      import { HeroInfoStrip } from './app/dashboard/api-lab-docs/HeroInfoStrip';
      import { CommerceCredentialDialog } from './components/commerce-api-lab/CommerceCredentialDialog';
      window.React = React; window.ReactDOM = ReactDOM;
      function Root() {
        return React.createElement(React.Fragment, null,
          React.createElement(HeroInfoStrip),
          React.createElement(CommerceCredentialDialog));
      }
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Root));`,
    loader: "tsx",
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  outdir: "/tmp/commerce-credential-browser",
  define: { "process.env.NODE_ENV": '"production"' },
  tsconfig: "tsconfig.json",
});
const globals = await postcss([tailwind({ base: process.cwd() })]).process(await readFile("app/globals.css", "utf8"), { from: "app/globals.css" });
const css =
  globals.css +
  "\n" +
  (await readFile("components/commerce-api-lab/reference.css", "utf8")) +
  "\n" +
  (await readFile("app/dashboard/api-lab-docs/reference.css", "utf8"));
const js = bundle.outputFiles.find((file) => file.path.endsWith(".js")).text;
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
const fakeKey = "test-only-" + "a".repeat(110);
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
    const page = await browser.newPage({ viewport });
    let requests = 0;
    let status = 200;
    let credential = fakeKey;
    let delay = 100;
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.copied = [];
      Object.defineProperty(navigator, "clipboard", { value: { writeText: async (text) => {
        if (window.failCopy) throw new Error("Clipboard unavailable");
        window.copied.push(text);
      } } });
    });
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/dashboard/api-lab-docs") return route.fulfill({ contentType: "text/html", body: html });
      if (url.pathname !== "/api/api-lab/credential") return route.abort();
      requests++;
      assert.equal(route.request().method(), "POST");
      assert.equal(route.request().postData(), null);
      const response = { status, contentType: "application/json", body: JSON.stringify(status === 200 ? { credential } : { error: "Internal error must not be displayed" }) };
      await new Promise((resolve) => setTimeout(resolve, delay));
      try { await route.fulfill(response); } catch { /* Closing the dialog aborts pending requests. */ }
    });
    await page.goto("https://arabautomators.com/dashboard/api-lab-docs");
    const trigger = page.locator("[data-commerce-credential]");
    await trigger.waitFor();
    assert.equal(requests, 0);
    assert.ok(!(await page.content()).includes(fakeKey));
    assert.equal(await page.getByRole("link", { name: "/openapi.json", exact: true }).count(), 1);

    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Commerce API Credential" });
    await dialog.waitFor();
    await page.getByRole("status").filter({ hasText: "Loading your credential" }).waitFor();
    const key = page.getByLabel("API key", { exact: true });
    await key.waitFor();
    assert.equal(requests, 1);
    assert.equal(await key.inputValue(), "••••••••••••••••••••");
    assert.ok(!(await dialog.innerHTML()).includes(fakeKey));

    // Native modal opened via showModal(), autoFocus landed on Close.
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Close credential dialog");
    // Shift+Tab from the first focusable element wraps to the last one --
    // the exact edge Chromium's native <dialog> trap drops (see
    // CommerceCredentialDialog.tsx's handleTrapKeyDown for the fix).
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Copy request header");
    assert.equal(await page.evaluate(() => document.querySelector("dialog").contains(document.activeElement)), true);
    // Tab from the last focusable element wraps back to the first -- the
    // other broken edge.
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Close credential dialog");
    // A full forward cycle through every element in between stays inside the dialog.
    for (const press of ["Tab", "Tab", "Tab", "Tab", "Tab"]) {
      await page.keyboard.press(press);
      assert.equal(await page.evaluate(() => document.querySelector("dialog").contains(document.activeElement)), true);
    }

    await page.getByRole("button", { name: "Copy API key", exact: true }).click();
    await page.waitForFunction(() => window.copied.length === 1);
    assert.equal(await page.evaluate(() => window.copied[0]), fakeKey);
    await page.getByRole("button", { name: "Copy API key", exact: true }).filter({ hasText: "Copied" }).waitFor();
    await page.getByRole("button", { name: "Copy request header", exact: true }).click();
    assert.equal(await page.evaluate(() => window.copied[1]), `X-API-Key: ${fakeKey}`);
    await page.getByRole("button", { name: "Show", exact: true }).click();
    assert.equal(await key.inputValue(), fakeKey);
    assert.equal(await page.locator("#commerce-api-header").textContent(), `X-API-Key: ${fakeKey}`);
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
    assert.equal(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth), true);
    await page.getByRole("button", { name: "Hide", exact: true }).click();
    assert.ok(!(await dialog.innerHTML()).includes(fakeKey));
    await page.waitForFunction(() => document.querySelector('[aria-label="Copy API key"]').textContent === "Copy");
    await page.evaluate(() => { window.failCopy = true; });
    await page.getByRole("button", { name: "Copy API key", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Copy failed" }).waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);
    assert.ok(!(await page.content()).includes(fakeKey));
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");

    credential = null;
    await trigger.click();
    await page.getByRole("status").filter({ hasText: "No Commerce API credential" }).waitFor();
    await page.mouse.click(2, 2);
    await dialog.waitFor({ state: "detached" });
    status = 503;
    await trigger.click();
    await page.getByRole("alert").filter({ hasText: "temporarily unavailable" }).waitFor();
    assert.ok(!(await dialog.textContent()).includes("Internal error"));
    status = 200; credential = fakeKey;
    await page.getByRole("button", { name: "Try again" }).click();
    await key.waitFor();
    assert.equal(await key.inputValue(), "••••••••••••••••••••");
    await page.getByRole("button", { name: "Close credential dialog" }).click();
    status = 401;
    await trigger.click();
    await page.getByRole("link", { name: "Sign in", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    status = 200; delay = 500;
    await trigger.click();
    await dialog.waitFor();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    assert.equal(await page.locator("dialog").count(), 0);
    assert.ok(!(await page.content()).includes(fakeKey));
    assert.deepEqual(errors, []);
    console.log(`PASS credential dialog at ${viewport.width} × ${viewport.height}`);
    await page.close();
  }
} finally {
  await browser.close();
}
