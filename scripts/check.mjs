#!/usr/bin/env node
/**
 * Checks the built site in dist/. Runs after every `npm run build`.
 *
 * WHY. The site exists to be found and quoted: by search engines, by AI answer
 * engines and by a person who got the link after a conversation. The rules
 * below are the ones that break silently: a title that grew past 60
 * characters, a translation that lost its hreflang pair, a link to a page that
 * does not exist, a {placeholder} that reached the page.
 *
 * HOW. Reads every HTML file in dist/ and the text files next to them. Needs
 * Node only.
 *
 * IF IT FAILS. Each line names the file and says what to change.
 *
 * LIMITS. It reads the HTML as text, with regular expressions: it knows the
 * markup this site produces, not HTML in general. It does not open the pages
 * in a browser and does not check the look.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../site.config.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const failures = [];
const warnings = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);
const warn = (where, message) => warnings.push(`${where}: ${message}`);

if (!existsSync(dist)) {
  console.error("check: dist/ does not exist. Run `npm run build` first.");
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const decode = (text) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, "&");

const base = site.url.replace(/\/$/, "");
/** dist/ru/plugin/index.html -> /ru/plugin/ */
const urlPath = (file) => {
  const rel = relative(dist, file).split(sep).join("/");
  return `/${rel.endsWith("index.html") ? rel.slice(0, -"index.html".length) : rel}`;
};
/** /ru/plugin/ -> dist/ru/plugin/index.html */
const fileFor = (path) => join(dist, ...(path.endsWith("/") ? `${path}index.html` : path).split("/").filter(Boolean));

const langs = readdirSync(join(root, "src", "locales")).filter((name) =>
  existsSync(join(root, "src", "locales", name, "ui.yaml")),
);
const others = langs.filter((code) => code !== site.defaultLang);
/** "/ru/blog/x/" -> { lang: "ru", path: "/blog/x/" } */
const split = (path) => {
  const lang = others.find((code) => path === `/${code}` || path.startsWith(`/${code}/`));
  return lang ? { lang, path: path.slice(lang.length + 1) || "/" } : { lang: site.defaultLang, path };
};

const files = walk(dist);
const pages = files.filter((file) => file.endsWith(".html"));
const meta = new Map();

for (const file of pages) {
  const path = urlPath(file);
  const html = readFileSync(file, "utf8");
  const notFound = path === "/404.html";

  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({
    hreflang: m[1],
    href: m[2],
  }));
  meta.set(path, { canonical, alternates });

  if (!title) fail(path, "no <title>");
  else if ([...title].length > 60) fail(path, `<title> has ${[...title].length} characters, the limit is 60: "${title}"`);
  if (!description) fail(path, "no meta description");
  else if ([...description].length > 200) fail(path, `the meta description has ${[...description].length} characters, the limit is 200`);
  if (!/<html lang="[a-zA-Z-]+"/.test(html)) fail(path, "<html> has no lang attribute");

  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1 && !notFound) fail(path, `expected one <h1>, found ${h1}`);

  if (!notFound) {
    if (canonical !== `${base}${path}`) fail(path, `canonical is "${canonical}", expected "${base}${path}"`);
    if (!alternates.some((a) => a.href === canonical)) fail(path, "hreflang does not list the page itself");
    if (!alternates.some((a) => a.hreflang === "x-default")) fail(path, "no hreflang x-default");
  }

  for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      fail(path, `JSON-LD does not parse: ${error.message}`);
    }
  }
  if (!/<script type="application\/ld\+json">/.test(html)) fail(path, "no JSON-LD");

  // The text must not depend on JavaScript: no script files, no modules.
  if (/<script[^>]*\ssrc=/.test(html) || /<script[^>]*type="module"/.test(html)) {
    fail(path, "the page loads a script file; text must be readable without JavaScript");
  }

  for (const link of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    if (!existsSync(fileFor(link[1]))) fail(path, `link to "${link[1]}", which is not in dist/`);
  }

  const picture = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
  if (!picture) fail(path, "no og:image (the link preview picture)");
  else if (!picture.startsWith(base) || !existsSync(fileFor(picture.slice(base.length)))) {
    fail(path, `og:image is "${picture}", which is not a file in dist/ (run \`npm run og\`)`);
  }

  const text = html.replace(/<(script|style|pre|code)\b[\s\S]*?<\/\1>/g, "");
  const left = text.match(/\{[a-zA-Z][a-zA-Z0-9]*\}/);
  if (left) fail(path, `an unfilled placeholder reached the page: ${left[0]}`);
}

// hreflang pairs must point at each other.
for (const [path, { canonical, alternates }] of meta) {
  for (const alt of alternates) {
    if (alt.hreflang === "x-default" || alt.href === canonical) continue;
    const target = alt.href.startsWith(base) ? alt.href.slice(base.length) : null;
    const other = target && meta.get(target);
    if (!other) fail(path, `hreflang "${alt.hreflang}" points at ${alt.href}, which is not a page of this site`);
    else if (!other.alternates.some((back) => back.href === canonical)) {
      fail(path, `hreflang "${alt.hreflang}" points at ${target}, but that page does not point back`);
    }
  }
}

// Every page exists in every language. A missing article is a warning: an
// article may be published in one language first.
const byLang = new Map(langs.map((code) => [code, new Set()]));
for (const path of meta.keys()) {
  if (path === "/404.html") continue;
  const { lang, path: bare } = split(path);
  byLang.get(lang)?.add(bare);
}
const everyPath = new Set([...byLang.values()].flatMap((set) => [...set]));
for (const bare of everyPath) {
  for (const code of langs) {
    if (byLang.get(code).has(bare)) continue;
    const where = code === site.defaultLang ? bare : `/${code}${bare}`;
    if (/^\/blog\/[^/]+\/$/.test(bare)) warn(where, `the article has no "${code}" version (src/locales/${code}/blog/)`);
    else fail(where, `the page is missing in "${code}"`);
  }
}

// The text files crawlers ask for.
const prefixes = langs.map((code) => (code === site.defaultLang ? "" : `/${code}`));
for (const name of ["/sitemap.xml", "/robots.txt", ...prefixes.flatMap((p) => [`${p}/llms.txt`, `${p}/llms-full.txt`, `${p}/rss.xml`])]) {
  if (!existsSync(fileFor(name))) fail(name, "the file is not in dist/");
}
if (existsSync(fileFor("/sitemap.xml"))) {
  const sitemap = readFileSync(fileFor("/sitemap.xml"), "utf8");
  for (const [path, { canonical }] of meta) {
    if (path !== "/404.html" && !sitemap.includes(`<loc>${canonical}</loc>`)) fail("/sitemap.xml", `${path} is not listed`);
  }
}
for (const prefix of prefixes) {
  for (const name of [`${prefix}/llms.txt`, `${prefix}/llms-full.txt`]) {
    if (!existsSync(fileFor(name))) continue;
    const left = readFileSync(fileFor(name), "utf8").match(/\{[a-zA-Z][a-zA-Z0-9]*\}/);
    if (left && !["{c}", "{id}"].includes(left[0])) fail(name, `an unfilled placeholder: ${left[0]}`);
  }
}

// Invisible characters make a file read differently from how it runs. The
// pattern is built from code points, so this file contains none of them.
const range = (from, to) => `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`;
const invisible = new RegExp(`[${[range(0x200b, 0x200f), range(0x202a, 0x202e), range(0x2060, 0x2064), range(0x2066, 0x2069), range(0xfeff, 0xfeff)].join("")}]`);
const noBreakSpace = new RegExp(String.fromCodePoint(0xa0));
const sources = [
  ...walk(join(root, "src")),
  ...walk(join(root, "scripts")),
  ...["site.config.mjs", "astro.config.mjs", "README.md", "package.json"].map((name) => join(root, name)),
].filter((file) => existsSync(file) && /\.(?:ts|mjs|astro|css|ya?ml|md|json|svg)$/.test(file));
for (const file of sources) {
  const text = readFileSync(file, "utf8");
  const where = relative(root, file);
  if (invisible.test(text)) fail(where, "an invisible or bidirectional character: delete it or write it as a code point");
  if (!/\.(?:md|ya?ml)$/.test(file) && noBreakSpace.test(text)) {
    fail(where, "a no-break space in code: write String.fromCharCode(160) instead");
  }
}

// On a developer machine the placeholder address is a warning; in CI, where a
// green build is published, it is a failure.
if (base.endsWith(".example")) {
  (process.env.CI ? fail : warn)("site.config.mjs", `the address is still the placeholder ${base}: set "url" before publishing`);
}

for (const line of warnings) console.warn(`  warning  ${line}`);
if (failures.length) {
  for (const line of failures) console.error(`  FAILED   ${line}`);
  console.error(`\ncheck: ${failures.length} problem(s) in ${pages.length} pages. Nothing above is published until it is fixed.`);
  process.exit(1);
}
console.log(`check: ${pages.length} pages in ${langs.length} language(s) (${langs.join(", ")}), ${warnings.length} warning(s), no problems.`);
