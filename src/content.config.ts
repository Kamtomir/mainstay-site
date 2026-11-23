/**
 * Everything a translator touches lives in src/locales/<language>/:
 *
 *   ui.yaml      names, navigation, buttons, small labels
 *   home.yaml    the landing page
 *   plugin.yaml  the plugin page
 *   case.yaml    the case page
 *   blog/*.md    articles, one file each
 *
 * A language is one folder. The schemas below fail the build when a translation
 * misses a key, so a half-translated folder cannot ship.
 */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const base = "./src/locales";
/** "en/home.yaml" -> "en"; "ru/blog/some-post.md" -> "ru/some-post". */
const langId = ({ entry }: { entry: string }) => entry.split("/")[0]!;
const postId = ({ entry }: { entry: string }) => {
  const [lang, , file] = entry.split("/");
  return `${lang}/${file!.replace(/\.md$/, "")}`;
};

const text = z.string().min(1);
const titled = z.object({ title: text, text });
const meta = z.object({
  /** <title>: at most 60 characters, checked after the build. */
  title: text.max(60),
  /** Meta description: one or two sentences. */
  description: text.max(200),
});

const ui = defineCollection({
  loader: glob({ pattern: "*/ui.yaml", base, generateId: langId }),
  schema: z.object({
    lang: z.object({
      name: text,
      /** The switcher shows this short label for the language. */
      short: text,
      htmlLang: text,
      ogLocale: text,
      dateLocale: text,
      numberLocale: text,
      /**
       * Optional: a piece of the formatted date to replace, [from, to]. Russian
       * dates come out as "7 ноября 2026 г."; in a sentence "2026 года" reads
       * better and does not leave two full stops in a row.
       */
      dateReplace: z.tuple([z.string(), z.string()]).optional(),
    }),
    units: z.object({ min: text, s: text, thousand: z.string(), hours: text }),
    site: z.object({ name: text, tagline: text, description: text }),
    author: z.object({ name: text, role: text, bio: text }),
    nav: z.object({ service: text, plugin: text, case: text, blog: text, label: text }),
    cta: z.object({
      consult: text,
      /** The short label of the same button in the header. */
      consultShort: text,
      plugin: text,
      consultNote: text,
      /** The draft message Telegram opens with. */
      consultDraft: text,
      github: text,
    }),
    labels: z.object({
      skipToContent: text,
      languageSwitch: text,
      published: text,
      updated: text,
      factsChecked: text,
      source: text,
      number: text,
      what: text,
      readArticle: text,
      allArticles: text,
      rss: text,
      minutes: text,
      otherLanguage: text,
      layer: text,
      rule: text,
      inMainstay: text,
      inReference: text,
      copy: text,
      copied: text,
      sources: text,
      back: text,
      pages: text,
    }),
    footer: z.object({
      note: text,
      noTracking: text,
      license: text,
      links: z.object({ github: text, telegram: text, rss: text, llms: text }),
    }),
    blog: z.object({ title: text.max(60), description: text.max(200), heading: text, intro: text }),
    notFound: z.object({ title: text.max(60), heading: text, text, home: text }),
    /** The six layers of mainstay (README.md), reused on several pages. */
    layers: z
      .array(z.object({ name: text, rule: text, folder: text, reference: text }))
      .length(6),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: "*/home.yaml", base, generateId: langId }),
  schema: z.object({
    meta,
    /** The first screen: a headline and a short story, one step per item. */
    hero: z.object({
      title: text,
      story: z.array(z.object({ when: text, text })).min(2),
      artifactCaption: text,
      /** The switch under the run of checks: fix the mistake, bring it back. */
      fix: z.object({ run: text, back: text, caption: text }),
    }),
    /** "What I do": three places where a mistake is expensive, then the method. */
    approach: z.object({
      title: text,
      lead: text,
      placeLabel: text,
      places: z.array(z.object({ name: text, rule: text })).length(3),
      paragraphs: z.array(text).min(2),
    }),
    facts: z.object({
      title: text,
      summary: text,
      items: z.array(z.object({ term: text, value: text })).min(4),
    }),
    audience: z.object({
      title: text,
      fitsTitle: text,
      fits: z.array(text).min(2),
      notTitle: text,
      notFits: z.array(text).min(1),
    }),
    deliverables: z.object({
      title: text,
      intro: text,
      /** Four things, in this order: a report, the checks, the rules, the plan. */
      items: z.array(titled.extend({ tag: text })).length(4),
      note: text,
    }),
    process: z.object({
      title: text,
      phases: z
        .array(z.object({ kind: z.enum(["free", "paid"]), label: text, steps: z.array(titled).min(1) }))
        .min(1),
    }),
    proof: z.object({
      title: text,
      intro: text,
      big: z.array(z.object({ value: text, label: text, source: text, zero: z.boolean().default(false) })).length(3),
      stats: z.array(z.object({ value: text, label: text })).min(4),
      runsTitle: text,
      runs: z.object({ all: text, main: text }),
      limitsTitle: text,
      limits: z.array(text).min(2),
      more: text,
    }),
    pricing: z.object({
      title: text,
      /** The fixed price: shown when site.config.mjs has price.show = true. */
      fixed: z.object({ price: text, label: text }),
      /** The line for the first clients: shown only when price.intro is set. */
      intro: z.object({ price: text, label: text }),
      /** Shown when price.show = false. */
      hidden: text,
      /** The receipt: its title, the word next to each line, the total, the agent's line. */
      receiptTitle: text,
      included: text,
      total: text,
      agentLine: text,
      notes: z.array(text),
    }),
    faq: z.object({ title: text, items: z.array(z.object({ q: text, a: text })).min(4) }),
    about: z.object({ title: text, paragraphs: z.array(text).min(1) }),
    closing: z.object({ title: text, text }),
  }),
});

const plugin = defineCollection({
  loader: glob({ pattern: "*/plugin.yaml", base, generateId: langId }),
  schema: z.object({
    meta,
    hero: z.object({ title: text, lead: text }),
    install: z.object({
      title: text,
      steps: z.array(z.object({ text, command: z.enum(["marketplaceAdd", "install", "setup"]) })).length(3),
      after: text,
    }),
    does: z.object({ title: text, items: z.array(text).min(3) }),
    doesNot: z.object({ title: text, items: z.array(text).min(3) }),
    output: z.object({ title: text, intro: text, after: text }),
    needs: z.object({ title: text, items: z.array(text).min(2) }),
    manual: z.object({ title: text, text }),
    layers: z.object({ title: text, intro: text }),
    links: z.object({ title: text, items: z.array(z.object({ label: text, href: text, note: text })).min(2) }),
    faq: z.object({ title: text, items: z.array(z.object({ q: text, a: text })).min(2) }),
    closing: z.object({ title: text, text }),
  }),
});

const caseStudy = defineCollection({
  loader: glob({ pattern: "*/case.yaml", base, generateId: langId }),
  schema: z.object({
    meta,
    hero: z.object({ title: text, lead: text }),
    summary: z.object({ title: text, text, items: z.array(z.object({ term: text, value: text })).min(3) }),
    numbers: z.object({
      title: text,
      intro: text,
      rows: z.array(z.object({ value: text, label: text, source: text })).min(6),
    }),
    recent: z.object({
      title: text,
      intro: text,
      rows: z.array(z.object({ value: text, label: text })).min(4),
    }),
    reproduce: z.object({
      title: text,
      intro: text,
      testCounts: text,
      outputNote: text,
      guardSuites: text,
      rest: text,
      after: text,
    }),
    layers: z.object({ title: text, intro: text }),
    limits: z.object({ title: text, items: z.array(text).min(3) }),
    closing: z.object({ title: text, text }),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "*/blog/*.md", base, generateId: postId }),
  schema: z.object({
    /** <title> and the article headline: at most 60 characters. */
    title: text.max(60),
    description: text.max(200),
    /** The first publication date. */
    date: z.coerce.date(),
    /** The date of the last meaningful edit. Defaults to `date`. */
    updated: z.coerce.date().optional(),
    /** Where the facts of the article come from: shown under the text. */
    sources: z.array(z.object({ label: text, href: z.url() })).min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { ui, home, plugin, caseStudy, blog };
