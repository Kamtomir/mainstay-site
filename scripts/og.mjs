#!/usr/bin/env node
/**
 * Draws the link preview pictures: public/og-<language>.png, 1200 x 630.
 * Telegram, Slack and LinkedIn show them when someone shares a page.
 *
 * Run it by hand after the name or the main headline changes:
 *
 *   npm run build && npm run og && npm run build
 *
 * It takes the name and the headline from the built pages in dist/, renders
 * them with the site's own fonts in headless Chrome and saves the pictures to
 * public/. The pictures are committed; the regular build does not need Chrome.
 */
import { execFile } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { site } from "../site.config.mjs";

// Asynchronous on purpose: the small server below must answer Chrome while it runs.
const run = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const chrome =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!existsSync(dist)) throw new Error("og: dist/ does not exist. Run `npm run build` first.");
if (!existsSync(chrome)) throw new Error(`og: Chrome not found at ${chrome}. Set CHROME_PATH.`);

const langs = readdirSync(join(root, "src", "locales")).filter((name) =>
  existsSync(join(root, "src", "locales", name, "ui.yaml")),
);
const css = readdirSync(join(dist, "_astro")).find((name) => name.endsWith(".css"));
const pick = (html, pattern) => (html.match(pattern)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();

const page = (lang) => {
  const file = join(dist, lang === site.defaultLang ? "" : lang, "index.html");
  const html = readFileSync(file, "utf8");
  const name = pick(html, /<a class="site-name"[^>]*>([\s\S]*?)<\/a>/);
  const title = pick(html, /<h1 class="hero__title"[^>]*>([\s\S]*?)<\/h1>/);
  const size = title.length > 52 ? 84 : 96;
  // The same run of checks as on the landing page: the failing one is the point.
  const checks = [
    ["pass", "&#10003;", "Should CI run?", ""],
    ["fail", "&#10005;", "Guards", "1 violation"],
    ["skip", "&ndash;", "Tests + build", "skipped"],
    ["skip", "&ndash;", "Integration", "skipped"],
  ];
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light">
<link rel="stylesheet" href="/_astro/${css}">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #ffffff; color: #0f1720; }
  .og { box-sizing: border-box; width: 1200px; height: 630px; padding: 56px 64px 0; display: grid; grid-template-columns: minmax(0, 1fr) 372px; grid-template-rows: auto 1fr auto; column-gap: 48px; }
  .og__name { grid-column: 1 / -1; font: 800 40px/1 var(--font-display); }
  .og__title { align-self: center; margin: 0; font: 800 ${size}px/0.92 var(--font-display); white-space: pre-line; }
  .og__card { align-self: center; border-radius: 20px; overflow: hidden; background: #0b1422; color: #edf1f7; font: 500 19px/1.4 var(--font-mono); font-stretch: 85%; }
  .og__bar { display: flex; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid #263449; color: #9aa7ba; }
  .og__bar b { color: #ff7a85; font-weight: 700; }
  .og__checks { margin: 0; padding: 18px 22px 22px; list-style: none; display: grid; gap: 14px; }
  .og__check { display: grid; grid-template-columns: 28px 1fr; gap: 14px; align-items: center; }
  .og__check small { grid-column: 2; margin-top: -10px; font-size: 16px; color: #9aa7ba; }
  .og__icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; font-size: 15px; font-weight: 800; color: #0b1422; }
  .og__check--pass .og__icon { background: #3ddc84; }
  .og__check--fail { color: #ff7a85; font-weight: 700; }
  .og__check--fail .og__icon { background: #ff7a85; }
  .og__check--fail small { color: #ff7a85; }
  .og__check--skip { color: #9aa7ba; }
  .og__check--skip .og__icon { border: 2px solid #263449; color: #9aa7ba; box-sizing: border-box; }
  .og__line { grid-column: 1 / -1; align-self: end; height: 14px; margin: 0 -64px; background: #3ddc84; }
</style>
</head>
<body>
<div class="og">
  <div class="og__name">${name}</div>
  <h1 class="og__title">${title}</h1>
  <div class="og__card">
    <div class="og__bar"><span>checks</span><b>1 failing</b></div>
    <ul class="og__checks">
      ${checks
        .map(
          ([state, mark, label, note]) =>
            `<li class="og__check og__check--${state}"><span class="og__icon">${mark}</span><span>${label}</span>${note ? `<small>${note}</small>` : ""}</li>`,
        )
        .join("\n      ")}
    </ul>
  </div>
  <div class="og__line"></div>
</div>
</body>
</html>`;
};

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".woff2": "font/woff2" };
const pages = new Map(langs.map((lang) => [`/__og-${lang}.html`, page(lang)]));
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const generated = pages.get(path);
  const file = normalize(join(dist, path));
  if (generated) {
    response.writeHead(200, { "Content-Type": types[".html"] }).end(generated);
  } else if (file.startsWith(dist) && existsSync(file)) {
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  } else {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const profile = join(root, ".astro", "og-chrome-profile");
try {
  for (const lang of langs) {
    const out = join(root, "public", `og-${lang}.png`);
    await run(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--window-size=1200,630",
        "--virtual-time-budget=4000",
        `--user-data-dir=${profile}`,
        `--screenshot=${out}`,
        `http://127.0.0.1:${port}/__og-${lang}.html`,
      ],
      { timeout: 60_000 },
    );
    console.log(`og: ${out}`);
  }
} finally {
  server.close();
  rmSync(profile, { recursive: true, force: true });
}
