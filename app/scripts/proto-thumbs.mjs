/**
 * Makes the Prototype Index thumbnails: public/proto-thumbs/<screenId>.png (the Index shows a grey
 * placeholder for any that are missing). Needs a dev server and Playwright:
 *   node scripts/proto-thumbs.mjs [--base http://localhost:3000] [--only billing,welcome]
 * Each screen opens through /prototype/go (current scenario, default state) at 1280x720.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const base = opt("base", "http://localhost:3000").replace(/\/$/, "");
const only = opt("only", "") ? opt("only", "").split(",") : null;
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "proto-thumbs");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error('Playwright is not installed for node. Run "npm i -D playwright" locally (do not commit it), or screenshot by hand.');
  process.exit(1);
}

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${base}/prototype`, { waitUntil: "networkidle" });
const ids = await page.$$eval("[data-screen]", (els) => els.map((e) => e.getAttribute("data-screen")));

for (const id of ids) {
  if (only && !only.includes(id)) continue;
  await page.goto(`${base}/prototype/go?screen=${id}`, { waitUntil: "domcontentloaded" });
  try {
    await page.waitForURL((u) => !u.pathname.startsWith("/prototype/go"), { timeout: 20000 });
  } catch {
    console.warn(`skip ${id}: never left /prototype/go`);
    continue;
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, `${id}.png`) });
  console.log(`ok ${id}`);
}
await browser.close();
