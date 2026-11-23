/**
 * /llms.txt and /llms-full.txt: the site as plain Markdown for AI answer
 * engines (the llmstxt.org convention: an H1, a quoted summary, then sections
 * of links). One pair per language.
 *
 * Everything here is built from the same data as the pages: the texts in
 * src/locales/<language>/, the numbers in src/data/case.ts, the price in
 * site.config.mjs. A file that disagrees with the page would teach a model
 * something false, and nobody would notice.
 */
import { getEntry } from "astro:content";
import { plugin, reproduce } from "../data/case";
import {
  abs,
  fill,
  formatters,
  getLangs,
  getPosts,
  getUi,
  markdown,
  pathFor,
  postKey,
  postPath,
  site,
  type Ui,
} from "./site";

async function pages(lang: string) {
  const [home, plug, cas] = await Promise.all([
    getEntry("home", lang),
    getEntry("plugin", lang),
    getEntry("caseStudy", lang),
  ]);
  if (!home || !plug || !cas) throw new Error(`src/locales/${lang} misses home.yaml, plugin.yaml or case.yaml`);
  return { home: home.data, plug: plug.data, cas: cas.data };
}

function priceLine(home: Awaited<ReturnType<typeof pages>>["home"]): string {
  const { show, intro } = site.price;
  if (!show) return home.pricing.hidden;
  const lines = [home.pricing.fixed, ...(intro ? [home.pricing.intro] : [])];
  return lines.map((line) => `${line.price} — ${line.label}`).join("; ");
}

/** The index: facts, pages, articles, the install commands, the sources. */
export async function llmsTxt(lang: string, withFull = true): Promise<string> {
  const ui = await getUi(lang);
  const f = formatters(ui);
  const { home, plug, cas } = await pages(lang);
  const md = (text: string) => markdown(text, ui, lang);
  const posts = await getPosts(lang);
  const others = (await getLangs()).filter((code) => code !== lang);

  const facts = [
    ...home.facts.items.slice(0, 4),
    { term: home.pricing.title, value: priceLine(home) },
    ...home.facts.items.slice(4),
  ];

  const out: string[] = [
    `# ${ui.site.name}: ${ui.site.tagline}`,
    "",
    `> ${md(home.facts.summary)}`,
    "",
    `${abs(pathFor(lang, "/"))} — ${fill(ui.labels.factsChecked, ui)}`,
    "",
    `## ${home.facts.title}`,
    ...facts.map((item) => `- ${item.term}: ${md(item.value)}`),
    "",
    `## ${home.deliverables.title}`,
    ...home.deliverables.items.map((item) => `- ${item.title}: ${md(item.text)}`),
    "",
    `## ${home.process.title}`,
    ...processLines(home, md),
    "",
    `## ${plug.install.title}`,
    "",
    "```",
    plugin.marketplaceAdd,
    plugin.install,
    plugin.setup,
    "```",
    "",
    ...plug.doesNot.items.map((item) => `- ${md(item)}`),
    "",
    `## ${ui.labels.pages}`,
    `- [${fill(home.meta.title, ui)}](${abs(pathFor(lang, "/"))}): ${md(home.meta.description)}`,
    `- [${fill(plug.meta.title, ui)}](${abs(pathFor(lang, "/plugin/"))}): ${md(plug.meta.description)}`,
    `- [${fill(cas.meta.title, ui)}](${abs(pathFor(lang, "/case/"))}): ${md(cas.meta.description)}`,
    `- [${ui.blog.title}](${abs(pathFor(lang, "/blog/"))}): ${ui.blog.description}`,
  ];

  if (posts.length) {
    out.push("", `## ${ui.blog.heading}`);
    for (const post of posts) {
      const { slug } = postKey(post);
      out.push(
        `- [${post.data.title}](${abs(postPath(lang, slug))}): ${post.data.description} (${f.date(post.data.date)})`,
      );
    }
  }

  out.push("", `## ${plug.links.title}`, ...plug.links.items.map((item) => `- [${item.label}](${item.href}): ${item.note}`));

  if (others.length) {
    out.push("", `## ${ui.labels.otherLanguage}`);
    for (const code of others) {
      const other = await getUi(code);
      out.push(`- [${other.lang.name}](${abs(pathFor(code, "/llms.txt"))})`);
    }
  }

  if (withFull) out.push("", `## llms-full.txt`, `- [${abs(pathFor(lang, "/llms-full.txt"))}](${abs(pathFor(lang, "/llms-full.txt"))})`);

  return out.join("\n") + "\n";
}

/** The steps of the work: a line for each phase, the steps numbered through. */
function processLines(home: Awaited<ReturnType<typeof pages>>["home"], md: (text: string) => string): string[] {
  let n = 0;
  return home.process.phases.flatMap((phase) => [
    `${phase.label}:`,
    ...phase.steps.map((step) => `${++n}. ${step.title}: ${md(step.text)}`),
  ]);
}

const rows = (items: readonly { value: string; label: string; source?: string }[], md: (text: string) => string) =>
  items.map((row) => `- ${md(row.value)}: ${md(row.label)}${row.source ? ` (${md(row.source)})` : ""}`);

const layerLines = (ui: Ui, md: (text: string) => string, reference: boolean) =>
  ui.layers.map(
    (layer, i) =>
      `${i + 1}. ${layer.name} (${layer.folder}): ${md(layer.rule)}${reference ? ` ${ui.labels.inReference}: ${md(layer.reference)}` : ""}`,
  );

/** The index plus the full text of every page and every article. */
export async function llmsFullTxt(lang: string): Promise<string> {
  const ui = await getUi(lang);
  const f = formatters(ui);
  const { home, plug, cas } = await pages(lang);
  const md = (text: string) => markdown(text, ui, lang);
  const posts = await getPosts(lang);
  const qa = (items: readonly { q: string; a: string }[]) => items.flatMap((item) => [`### ${md(item.q)}`, "", md(item.a), ""]);

  const out: string[] = [(await llmsTxt(lang, false)).trimEnd(), "", "---", ""];

  // The landing page.
  out.push(
    `# ${home.hero.title.replace(/\s+/g, " ")}`,
    `${abs(pathFor(lang, "/"))}`,
    "",
    ...home.hero.story.flatMap((beat) => [md(beat.text), ""]),
    `## ${home.approach.title}`,
    "",
    md(home.approach.lead),
    ...home.approach.places.map((place) => `- ${place.name}: ${md(place.rule)}`),
    "",
    ...home.approach.paragraphs.flatMap((text) => [md(text), ""]),
    `## ${home.audience.title}`,
    "",
    `${home.audience.fitsTitle}:`,
    ...home.audience.fits.map((item) => `- ${md(item)}`),
    "",
    `${home.audience.notTitle}:`,
    ...home.audience.notFits.map((item) => `- ${md(item)}`),
    "",
    `## ${home.deliverables.title}`,
    "",
    md(home.deliverables.intro),
    ...home.deliverables.items.map((item) => `- ${item.title}: ${md(item.text)}`),
    "",
    md(home.deliverables.note),
    "",
    `## ${home.process.title}`,
    "",
    ...processLines(home, md),
    "",
    `## ${home.proof.title}`,
    "",
    md(home.proof.intro),
    ...rows(home.proof.big, md),
    ...rows(home.proof.stats, md),
    "",
    `${md(home.proof.runsTitle)}:`,
    `- ${md(home.proof.runs.all)}`,
    `- ${md(home.proof.runs.main)}`,
    "",
    `${home.proof.limitsTitle}:`,
    ...home.proof.limits.map((item) => `- ${md(item)}`),
    "",
    `## ${home.pricing.title}`,
    "",
    md(priceLine(home)),
    ...home.pricing.notes.map((note) => `- ${md(note)}`),
    "",
    `## ${home.faq.title}`,
    "",
    ...qa(home.faq.items),
    `## ${home.about.title}`,
    "",
    ...home.about.paragraphs.flatMap((text) => [md(text), ""]),
    "---",
    "",
  );

  // The plugin page.
  out.push(
    `# ${plug.hero.title}`,
    `${abs(pathFor(lang, "/plugin/"))}`,
    "",
    md(plug.hero.lead),
    "",
    `## ${plug.install.title}`,
    "",
    ...plug.install.steps.flatMap((step, i) => [`${i + 1}. ${md(step.text)}`, "", "```", plugin[step.command], "```", ""]),
    md(plug.install.after),
    "",
    `## ${plug.does.title}`,
    ...plug.does.items.map((item) => `- ${md(item)}`),
    "",
    `## ${plug.doesNot.title}`,
    ...plug.doesNot.items.map((item) => `- ${md(item)}`),
    "",
    `## ${plug.output.title}`,
    "",
    md(plug.output.intro),
    "",
    "```",
    plugin.redOutput.title,
    "",
    `  ${plugin.redOutput.file}  ${plugin.redOutput.rule}  ${plugin.redOutput.message}`,
    "",
    plugin.redOutput.hint,
    "```",
    "",
    md(plug.output.after),
    "",
    `## ${plug.needs.title}`,
    ...plug.needs.items.map((item) => `- ${md(item)}`),
    "",
    `## ${plug.manual.title}`,
    "",
    md(plug.manual.text),
    "",
    `## ${plug.layers.title}`,
    "",
    md(plug.layers.intro),
    ...layerLines(ui, md, false),
    "",
    `## ${plug.faq.title}`,
    "",
    ...qa(plug.faq.items),
    "---",
    "",
  );

  // The case page.
  out.push(
    `# ${md(cas.hero.title)}`,
    `${abs(pathFor(lang, "/case/"))}`,
    "",
    md(cas.hero.lead),
    "",
    md(cas.summary.text),
    ...cas.summary.items.map((item) => `- ${item.term}: ${md(item.value)}`),
    "",
    `## ${cas.numbers.title}`,
    "",
    md(cas.numbers.intro),
    ...rows(cas.numbers.rows, md),
    "",
    `## ${cas.recent.title}`,
    "",
    md(cas.recent.intro),
    ...rows(cas.recent.rows, md),
    "",
    `## ${cas.reproduce.title}`,
    "",
    md(cas.reproduce.intro),
    "",
    md(cas.reproduce.testCounts),
    "",
    "```bash",
    reproduce.testCounts,
    "```",
    "",
    "```",
    reproduce.testCountsOutput,
    "```",
    "",
    md(cas.reproduce.outputNote),
    "",
    md(cas.reproduce.guardSuites),
    "",
    "```bash",
    reproduce.guardSuites,
    "```",
    "",
    md(cas.reproduce.rest),
    "",
    "```bash",
    reproduce.rest,
    "```",
    "",
    `## ${cas.layers.title}`,
    "",
    ...layerLines(ui, md, true),
    "",
    `## ${cas.limits.title}`,
    ...cas.limits.items.map((item) => `- ${md(item)}`),
    "",
    md(cas.closing.text),
    "",
  );

  // The articles, in full.
  for (const post of posts) {
    const { slug } = postKey(post);
    const updated = post.data.updated ?? post.data.date;
    out.push(
      "---",
      "",
      `# ${post.data.title}`,
      `${abs(postPath(lang, slug))}`,
      `${ui.labels.published}: ${f.date(post.data.date)}. ${ui.labels.updated}: ${f.date(updated)}.`,
      "",
      // "&nbsp;" keeps numbers together in HTML; plain text needs a space.
      (post.body ?? "").replace(/&nbsp;/g, " ").trim(),
      "",
      `${ui.labels.sources}: ${post.data.sources.map((s) => `[${s.label}](${s.href})`).join(", ")}`,
      "",
    );
  }

  return out.join("\n");
}
