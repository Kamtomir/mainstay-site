/**
 * Languages, addresses, numbers and the small text helpers every page uses.
 *
 * - A language is a folder in src/locales with a ui.yaml. Nothing else lists
 *   languages: add a folder and the routes, hreflang, sitemap, RSS and llms.txt
 *   pick it up.
 * - The default language is served at "/", the others under "/<code>/".
 * - Texts may contain {placeholders}. They are filled from src/data/case.ts and
 *   site.config.mjs, so a number is typed once. An unknown placeholder fails
 *   the build.
 */
import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { site } from "../../site.config.mjs";
import { caseData } from "../data/case";

export { site };
export type Ui = CollectionEntry<"ui">["data"];

/** Language codes: the default first, the rest in alphabetical order. */
export async function getLangs(): Promise<string[]> {
  const codes = (await getCollection("ui")).map((e) => e.id).sort();
  if (!codes.includes(site.defaultLang)) {
    throw new Error(`site.config.mjs: defaultLang "${site.defaultLang}" has no folder in src/locales`);
  }
  return [site.defaultLang, ...codes.filter((c) => c !== site.defaultLang)];
}

export async function getUi(lang: string): Promise<Ui> {
  const entry = await getEntry("ui", lang);
  if (!entry) throw new Error(`src/locales/${lang}/ui.yaml is missing`);
  return entry.data;
}

/** One entry per language for getStaticPaths of a "[...lang]" route. */
export async function langPaths() {
  return (await getLangs()).map((lang) => ({
    params: { lang: lang === site.defaultLang ? undefined : lang },
    props: { lang },
  }));
}

/** "/plugin/" -> "/plugin/" (default language) or "/ru/plugin/". */
export function pathFor(lang: string, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return lang === site.defaultLang ? clean : `/${lang}${clean}`;
}

/** An absolute address for canonical, hreflang, sitemap, RSS and JSON-LD. */
export function abs(path: string): string {
  return `${site.url.replace(/\/$/, "")}${path}`;
}

/** The consultation link, with a draft message in the visitor's language. */
export function consultLink(ui: Ui): string {
  return `${site.consultUrl}?text=${encodeURIComponent(ui.cta.consultDraft)}`;
}

// --- Numbers, dates and durations, per language ---------------------------

type Duration = { readonly min: number; readonly s: number };

export function formatters(ui: Ui) {
  const int = new Intl.NumberFormat(ui.lang.numberLocale, { maximumFractionDigits: 0 });
  const pct = new Intl.NumberFormat(ui.lang.numberLocale, { style: "percent", maximumFractionDigits: 1 });
  const money = new Intl.NumberFormat(ui.lang.numberLocale, {
    style: "currency",
    currency: site.price.currency,
    maximumFractionDigits: 0,
  });
  const date = new Intl.DateTimeFormat(ui.lang.dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const nbsp = String.fromCharCode(160); // a no-break space, built from its code so the source has no invisible character
  return {
    int: (n: number) => int.format(n),
    pct: (n: number) => pct.format(n / 100),
    money: (n: number) => money.format(n),
    date: (iso: string | Date) => {
      const formatted = date.format(typeof iso === "string" ? new Date(`${iso}T00:00:00Z`) : iso);
      const [from, to] = ui.lang.dateReplace ?? ["", ""];
      return from ? formatted.replace(from, to) : formatted;
    },
    duration: (d: Duration) =>
      [d.min ? `${d.min}${nbsp}${ui.units.min}` : "", d.s ? `${d.s}${nbsp}${ui.units.s}` : ""].filter(Boolean).join(" "),
    // A unit that starts with a space keeps it as a no-break space: "445 thousand" never wraps.
    thousands: (n: number) => `${int.format(n)}${ui.units.thousand.replace(/^ /, nbsp)}`,
  };
}

/** Every {placeholder} a text may use, already formatted for the language. */
export function vars(ui: Ui): Record<string, string> {
  const f = formatters(ui);
  const c = caseData;
  const l = c.last30;
  const intro = site.price.intro;
  return {
    // The reference deployment (CASE.md).
    unitTests: f.int(c.unitTests),
    unitTestFiles: f.int(c.unitTestFiles),
    unitTestsDuration: f.duration(c.unitTestsDuration),
    integrationTests: f.int(c.integrationTests),
    integrationTestFiles: f.int(c.integrationTestFiles),
    ciFull: f.duration(c.ciFull),
    ciShouldRun: f.duration(c.ciShouldRun),
    ciTestsAndBuild: f.duration(c.ciTestsAndBuild),
    ciIntegration: f.duration(c.ciIntegration),
    guardSuites: f.int(c.guardSuites),
    mergedPrs: f.int(c.mergedPrs),
    commits: f.int(c.commits),
    days: f.int(c.days),
    migrations: f.int(c.migrations),
    databases: f.int(c.databases),
    tsLines: f.thousands(c.tsLinesK),
    sourceFiles: f.int(c.sourceFiles),
    decisionDocs: f.int(c.decisionDocs),
    periodStart: f.date(c.periodStart),
    periodEnd: f.date(c.periodEnd),
    asOfFrom: f.date(c.asOfFrom),
    asOf: f.date(c.asOf),
    ciRun: c.ciRun,
    commit: c.commit,
    // The last 30 days (CASE.md).
    l30Until: f.date(l.until),
    l30MergedPrs: f.int(l.mergedPrs),
    l30WithTestsPct: f.pct(l.prsWithTestsPct),
    l30WithTests: f.int(l.prsWithTests),
    l30CodePrs: f.int(l.codePrs),
    l30RedPct: f.pct(l.redSharePct),
    l30Red: f.int(l.redRuns),
    l30Green: f.int(l.greenRuns),
    l30Skipped: f.int(l.skippedRuns),
    l30Cancelled: f.int(l.cancelledRuns),
    l30Median: f.int(l.ciMedianMin),
    l30P90: f.int(l.ciP90Min),
    l30FlakyPct: f.pct(l.flakyPct),
    l30FlakyCommits: f.int(l.flakyCommits),
    l30Commits: f.int(l.commitsWithRuns),
    l30MainRed: f.int(l.mainRedRuns),
    l30MainGreen: f.int(l.mainGreenPushes),
    l30MainCancelled: f.int(l.mainCancelled),
    // The layers in the reference deployment (CASE.md).
    refusalCases: f.int(c.refusalCases),
    toolModules: f.int(c.toolModules),
    sanitizerModules: f.int(c.sanitizerModules),
    watchdogHours: f.int(c.watchdogHours),
    hoursWord: ui.units.hours,
    setupMinutes: f.int(c.setupMinutes),
    // The site itself (site.config.mjs).
    price: f.money(site.price.amount),
    priceIntro: intro ? f.money(intro.amount) : "",
    introClients: intro ? f.int(intro.clients) : "",
    consultHandle: site.consultHandle,
    repoSlug: site.repoSlug,
    repoUrl: site.repoUrl,
    productUrl: site.product.url,
    checkedAt: f.date(site.factsCheckedAt),
    authorName: ui.author.name,
    // The year of the last facts check, not of the build machine's clock.
    year: site.factsCheckedAt.slice(0, 4),
  };
}

/** Replace {placeholders}. Unknown names fail the build: a typo must not ship. */
export function fill(text: string, ui: Ui): string {
  const values = vars(ui);
  return text.replace(/\{([a-zA-Z0-9]+)\}/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined) throw new Error(`Unknown placeholder {${name}} in a text of "${ui.lang.name}"`);
    return value;
  });
}

// --- Typography ---------------------------------------------------------------

const NBSP = String.fromCharCode(160);
/** A one- or two-letter Cyrillic word (a preposition, a conjunction) and the space after it. */
const SHORT_WORD = /(^|[\s(«„"])([А-ЯЁа-яё]{1,2})[ \t]+(?=\S)/g;
/** A number and the Cyrillic word after it: "20 минут", "7 ноября". */
const NUMBER_AND_WORD = /(\d)[ \t]+(?=[А-ЯЁа-яё])/g;

/** The product's name ("Catch Club") stays on one line in every language. */
const PRODUCT_NAME = site.product.name;
const PRODUCT_NAME_GLUED = PRODUCT_NAME.split(" ").join(NBSP);

/**
 * Typography. In Russian a short preposition never hangs at the end of a line
 * and a number stays with its unit, so the space between them becomes a
 * no-break space. The product's name never breaks in the middle. Other Latin
 * text is left as it is.
 */
export function typo(value: string): string {
  return value
    .replace(SHORT_WORD, (_, before: string, word: string) => `${before}${word}${NBSP}`)
    .replace(NUMBER_AND_WORD, (_, digit: string) => `${digit}${NBSP}`)
    .split(PRODUCT_NAME)
    .join(PRODUCT_NAME_GLUED);
}

/** A text for the page: placeholders filled, short words glued to the next one. */
export function text(value: string, ui: Ui): string {
  return typo(fill(value, ui));
}

// --- A small inline markup for YAML texts: `code`, **bold**, [text](link) --

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** "Kamil Dashdamirov" -> "KD": the monogram next to the author's name. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2);
}

/** Plain text (a title of an article, a label) -> safe HTML for set:html. */
export function safe(value: string): string {
  return escapeHtml(typo(value));
}

function href(target: string, lang: string): string {
  if (target.startsWith("/")) return pathFor(lang, target);
  if (/^https:\/\//.test(target)) return target;
  throw new Error(`A link must start with "/" or "https://": ${target}`);
}

/** Text with placeholders and inline markup -> safe HTML for set:html. */
export function inline(text: string, ui: Ui, lang: string): string {
  return escapeHtml(typo(fill(text, ui))).replace(INLINE, (_, code, bold, label, target) => {
    if (code) return `<code>${code}</code>`;
    if (bold) return `<strong>${bold}</strong>`;
    const to = href(String(target).replace(/&amp;/g, "&"), lang);
    const external = to.startsWith("https://");
    return `<a href="${escapeHtml(to)}"${external ? ' rel="noopener"' : ""}>${label}</a>`;
  });
}

/** The same text without markup: meta descriptions, JSON-LD, llms.txt facts. */
export function plain(text: string, ui: Ui): string {
  return fill(text, ui).replace(INLINE, (_, code, bold, label) => code ?? bold ?? label);
}

/** The same text as Markdown with absolute links: llms.txt and llms-full.txt. */
export function markdown(text: string, ui: Ui, lang: string): string {
  return fill(text, ui).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, target) => {
    const to = href(target, lang);
    return `[${label}](${to.startsWith("/") ? abs(to) : to})`;
  });
}

// --- Blog ------------------------------------------------------------------

export type Post = CollectionEntry<"blog">;

/** "ru/some-post" -> { lang: "ru", slug: "some-post" }. */
export function postKey(post: Post): { lang: string; slug: string } {
  const [lang, slug] = post.id.split("/") as [string, string];
  return { lang, slug };
}

/** Published articles of one language, the newest first. */
export async function getPosts(lang: string): Promise<Post[]> {
  const all = await getCollection("blog", (p) => !p.data.draft && p.id.startsWith(`${lang}/`));
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id));
}

/** The languages one article exists in: the same file name in several folders. */
export async function postLangs(slug: string): Promise<string[]> {
  const langs = await getLangs();
  const all = await getCollection("blog", (p) => !p.data.draft);
  return langs.filter((lang) => all.some((p) => p.id === `${lang}/${slug}`));
}

export function postPath(lang: string, slug: string): string {
  return pathFor(lang, `/blog/${slug}/`);
}

/** Reading time from the raw Markdown: 200 words a minute, at least one. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
