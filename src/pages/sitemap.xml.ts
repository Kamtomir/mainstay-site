/**
 * The sitemap: every page in every language, each with its translations
 * (xhtml:link) and the date it last changed.
 */
import type { APIRoute } from "astro";
import { abs, getLangs, getPosts, getUi, pathFor, postKey, postLangs, site } from "../lib/site";

interface Entry {
  path: string;
  langs: string[];
  lastmod: string;
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const GET: APIRoute = async () => {
  const langs = await getLangs();
  const entries: Entry[] = ["/", "/plugin/", "/case/", "/blog/"].map((path) => ({
    path,
    langs,
    lastmod: site.factsCheckedAt,
  }));

  // Articles: one entry per file name, with the languages it exists in and
  // the latest date among them.
  const seen = new Map<string, Entry>();
  for (const lang of langs) {
    for (const post of await getPosts(lang)) {
      const { slug } = postKey(post);
      const lastmod = (post.data.updated ?? post.data.date).toISOString().slice(0, 10);
      const known = seen.get(slug);
      if (known) known.lastmod = known.lastmod > lastmod ? known.lastmod : lastmod;
      else seen.set(slug, { path: `/blog/${slug}/`, langs: await postLangs(slug), lastmod });
    }
  }
  entries.push(...seen.values());

  const htmlLang = new Map<string, string>();
  for (const lang of langs) htmlLang.set(lang, (await getUi(lang)).lang.htmlLang);

  const urls = entries.flatMap((entry) =>
    entry.langs.map((lang) => {
      const alternates = entry.langs.map(
        (code) => `    <xhtml:link rel="alternate" hreflang="${htmlLang.get(code)}" href="${xml(abs(pathFor(code, entry.path)))}"/>`,
      );
      const xDefault = entry.langs.includes(site.defaultLang) ? site.defaultLang : lang;
      alternates.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(abs(pathFor(xDefault, entry.path)))}"/>`,
      );
      return [
        "  <url>",
        `    <loc>${xml(abs(pathFor(lang, entry.path)))}</loc>`,
        `    <lastmod>${entry.lastmod}</lastmod>`,
        ...alternates,
        "  </url>",
      ].join("\n");
    }),
  );

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
