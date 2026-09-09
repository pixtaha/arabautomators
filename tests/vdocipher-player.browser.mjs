// Uses locally installed Playwright/esbuild, or explicit module paths for cached tooling.
// All playback responses are mocked; no real credentials or account cookies are used.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { loadTsModule } from "./load-ts-module.mjs";

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const { build } = await import(process.env.ESBUILD_MODULE_PATH ?? "esbuild");
const sessionId = "7caceae2-03eb-4bc7-a80f-3ef463ff52fd";
const { getSessionVideoParts } = await loadTsModule("lib/session-video-parts.ts");
const parts = getSessionVideoParts({ id: sessionId, title: "Session 1: n8n Foundations — Getting Started", main_video_bunny_id: "26d3d809-b72c-486f-a28c-05ef5719aff8" }, [
  { id: "1afe54f0-aab2-4583-8d77-22a591cb9885", session_id: sessionId, type: "video", title: "Main video General", order_index: 3, bunny_video_id: null },
  { id: "6965a2fa-9dbf-422a-8d64-61e5ed7ce3e2", session_id: sessionId, type: "credential_video", title: "Supabase", order_index: 5, bunny_video_id: null },
]);
const bundle = await build({
  stdin: {
    contents: `import { createRoot, hydrateRoot } from 'react-dom/client';
      import { renderToString } from 'react-dom/server';
      import { SessionVideoPlaylist } from './components/course/SessionVideoPlaylist';
      const element = <SessionVideoPlaylist sessionId={${JSON.stringify(sessionId)}} parts={${JSON.stringify(parts)}} />;
      const root = document.getElementById('root');
      if (window.location.search.includes('hydrate')) {
        root.innerHTML = renderToString(element);
        window.serverRenderedVideo = root.innerHTML;
        hydrateRoot(root, element, { onRecoverableError: (error) => { throw error; } });
      } else {
        createRoot(root).render(element);
      }`,
    loader: "tsx", resolveDir: process.cwd(),
  },
  bundle: true, write: false, platform: "browser", format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
  tsconfig: "tsconfig.json",
});
const css = await postcss([tailwind({ base: process.cwd() })]).process(await readFile("app/globals.css", "utf8"), { from: "app/globals.css" });
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css.css}</style></head><body><main style="max-width:1000px;margin:0 auto;padding:16px"><div id="root"></div></main><script>${bundle.outputFiles[0].text}</script></body></html>`;
const browser = await chromium.launch({ headless: true });
let checks = 0;
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    // Desktop Brave shares Chrome's user agent, including its Safari compatibility token.
    const page = await browser.newPage({ viewport, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36" });
    const requests = [];
    const errors = [];
    let failure = false;
    let invalidEmbed = false;
    let delayedPart = null;
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === "https://player.vdocipher.com") return route.fulfill({ contentType: "text/html", body: "<p>Mock protected player</p>" });
      if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: html });
      const match = url.pathname.match(/\/parts\/([^/]+)\/playback$/);
      if (!match) return route.abort();
      requests.push({ partId: match[1], method: route.request().method() });
      if (match[1] === delayedPart) await new Promise((resolve) => setTimeout(resolve, 350));
      try {
        await route.fulfill({
          status: failure ? 503 : 200, contentType: "application/json",
          body: JSON.stringify(failure ? { error: "Unavailable" } : {
            embedUrl: invalidEmbed ? "https://attacker.example/v2/?otp=fake&playbackInfo=fake" : `https://player.vdocipher.com/v2/?otp=fake-${requests.length}&playbackInfo=fake`,
            expires: Math.floor(Date.now() / 1000) + 300,
          }),
        });
      } catch { /* An obsolete part request may have been aborted by React cleanup. */ }
    });
    await page.goto(viewport.width > 1000 ? "https://video-test.example/?hydrate=1" : "https://video-test.example/");
    const buttons = page.getByRole("button", { name: /^Part \d/ });
    assert.equal(await buttons.count(), 3);
    const frame = page.locator("iframe");
    for (let index = 0; index < parts.length; index++) {
      await buttons.nth(index).click();
      await page.waitForFunction((title) => document.querySelector("iframe")?.title === title, parts[index].title);
      assert.equal(await frame.count(), 1);
      assert.equal(await buttons.nth(index).getAttribute("aria-pressed"), "true");
      assert.match(await frame.getAttribute("allow"), /encrypted-media/);
      assert.notEqual(await frame.getAttribute("allowfullscreen"), null);
      checks++;
    }
    assert.deepEqual(requests.map((r) => r.partId), parts.map((p) => p.id));
    assert.ok(requests.every((r) => r.method === "POST"));
    const bounds = await frame.boundingBox();
    assert.ok(Math.abs(bounds.width / bounds.height - 16 / 9) < 0.03);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    checks++;

    // A reused video ID must still refresh playback when returning to a part.
    const firstOtp = await frame.getAttribute("src");
    await buttons.nth(0).click();
    await page.waitForFunction((title) => document.querySelector("iframe")?.title === title, parts[0].title);
    assert.notEqual(await frame.getAttribute("src"), firstOtp);
    checks++;

    // A slow previous response cannot replace the currently selected part.
    delayedPart = parts[1].id;
    await buttons.nth(1).click();
    await buttons.nth(2).click();
    await page.waitForFunction((title) => document.querySelector("iframe")?.title === title, parts[2].title);
    await page.waitForTimeout(450);
    assert.equal(await frame.getAttribute("title"), parts[2].title);
    delayedPart = null;
    checks++;

    failure = true;
    await buttons.nth(0).click();
    await page.getByRole("button", { name: "Try again" }).waitFor();
    assert.equal(await frame.count(), 0);
    failure = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await frame.waitFor();
    assert.equal(await frame.getAttribute("title"), parts[0].title);
    checks++;

    invalidEmbed = true;
    await buttons.nth(1).click();
    await page.getByRole("button", { name: "Try again" }).waitFor();
    assert.equal(await frame.count(), 0);
    assert.deepEqual(errors, []);
    checks++;
    await page.close();
  }
  console.log(`PASS: ${checks} browser checks across desktop and mobile (mock playback).`);
} finally {
  await browser.close();
}

const safariMac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
const safariPhone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const safariPad = "Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const safariCases = [
  { name: "macOS Safari", userAgent: safariMac, viewport: { width: 1280, height: 900 }, clipboard: "copied" },
  { name: "iPhone Safari", userAgent: safariPhone, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, clipboard: "copied" },
  { name: "small iPhone Safari", userAgent: safariPhone, viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, clipboard: "denied" },
  { name: "iPad Safari", userAgent: safariPad, viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, clipboard: "missing" },
  { name: "iPad Safari desktop mode", userAgent: safariMac, viewport: { width: 1024, height: 768 }, hasTouch: true, clipboard: "copied" },
];
const otherBrowsers = [
  ["Chrome / Brave desktop", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"],
  ["Chrome iOS", safariPhone.replace("Version/26.0", "CriOS/153.0.0.0")],
  ["Chrome iOS desktop mode", safariMac.replace("Version/26.0", "CriOS/153 Version/26.0")],
  ["Brave iOS with browser token", safariPhone.replace("Version/26.0", "Brave/1")],
  ["Brave iOS desktop mode with browser token", `${safariMac} Brave/1`],
  ["Firefox iOS", safariPhone.replace("Version/26.0", "FxiOS/145.0")],
  ["Edge iOS", `${safariPhone} EdgiOS/145.0`],
  ["Opera iOS", `${safariPhone} OPiOS/16.0`],
  ["Android browser", "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Safari/537.36"],
  ["iOS embedded webview", safariPhone.replace("Version/26.0 ", "").replace(" Safari/604.1", "")],
  ["unknown", ""],
];
const { isUnsupportedVdoCipherBrowser } = await loadTsModule("lib/vdocipher-browser.ts");
for (const { name, userAgent } of safariCases) assert.equal(isUnsupportedVdoCipherBrowser(userAgent), true, name);
for (const [name, userAgent] of otherBrowsers) assert.equal(isUnsupportedVdoCipherBrowser(userAgent), false, name);
console.log(`PASS: ${safariCases.length + otherBrowsers.length} browser identification cases.`);

const safariBrowser = await webkit.launch({ headless: true });
try {
  for (const { name, clipboard, ...options } of safariCases) {
    const page = await safariBrowser.newPage(options);
    const requests = [];
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((clipboard) => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: clipboard === "missing" ? undefined : {
        writeText: async (value) => {
          if (clipboard === "denied") throw new DOMException("Not allowed", "NotAllowedError");
          window.copiedPageLink = value;
        },
      } });
    }, clipboard);
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin === "https://video-test.example" && url.pathname === "/") {
        return route.fulfill({ contentType: "text/html", body: html });
      }
      requests.push(url.href);
      return route.abort();
    });
    const pageUrl = "https://video-test.example/?hydrate=1#session-videos";
    await page.goto(pageUrl);
    const heading = page.getByRole("heading", { name: "Protected playback requires a supported browser", exact: true });
    const card = page.getByRole("region", { name: "Protected playback requires a supported browser", exact: true });
    await heading.waitFor();
    assert.match(await page.evaluate(() => window.serverRenderedVideo), /Loading video/);
    assert.doesNotMatch(await page.evaluate(() => window.serverRenderedVideo), /<iframe/);
    assert.equal(await card.locator("p").nth(0).textContent(), "For the best and most secure viewing experience, please open Arab Automators using Google Chrome or Brave.");
    assert.equal(await card.locator("p").nth(1).textContent(), "Safari is not currently supported for protected course videos.");
    assert.equal(await card.evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(255, 255, 255)");
    const buttons = page.getByRole("button", { name: /^Part \d/ });
    assert.equal(await buttons.count(), 3);
    for (let index = 0; index < parts.length; index++) {
      await buttons.nth(index).focus();
      await page.keyboard.press("Enter");
      await heading.waitFor();
      assert.equal(await buttons.nth(index).getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator("iframe").count(), 0);
    }
    const copy = page.getByRole("button", { name: "Copy page link", exact: true });
    await copy.focus();
    await page.keyboard.press("Enter");
    if (clipboard === "copied") {
      await page.getByRole("status").filter({ hasText: "Link copied. Paste it into Google Chrome or Brave." }).waitFor();
      assert.equal(await page.evaluate(() => window.copiedPageLink), pageUrl);
    } else {
      await page.getByRole("status").filter({ hasText: "Automatic copying is unavailable." }).waitFor();
      const input = page.getByRole("textbox", { name: "Page link", exact: true });
      assert.equal(await input.inputValue(), pageUrl);
      await page.keyboard.press("Tab");
      assert.equal(await input.evaluate((element) => element === document.activeElement && element.selectionEnd - element.selectionStart === element.value.length), true);
    }
    const cardBounds = await card.boundingBox();
    const copyBounds = await copy.boundingBox();
    const partsBounds = await buttons.nth(0).boundingBox();
    assert.ok(copyBounds.height >= 44);
    assert.ok(copyBounds.y + copyBounds.height <= cardBounds.y + cardBounds.height);
    assert.ok(partsBounds.y >= cardBounds.y + cardBounds.height);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    assert.ok(await card.evaluate((element) => element.scrollHeight <= element.clientHeight));
    await page.screenshot({ path: `/tmp/vdocipher-${name.toLowerCase().replaceAll(" ", "-")}.png`, fullPage: true });
    assert.deepEqual(requests, [], `${name}: no playback authorization or player network requests`);
    assert.deepEqual(errors, [], `${name}: no runtime or hydration errors`);
    await page.close();
    console.log(`PASS: ${name}: hydration, all parts, no playback requests, keyboard/copy and responsive layout.`);
  }
} finally {
  await safariBrowser.close();
}
