/** One RSS feed per language: /rss.xml and /<language>/rss.xml. */
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { abs, getPosts, getUi, langPaths, pathFor, postKey, postPath } from "../../lib/site";

export const getStaticPaths = langPaths;

export const GET: APIRoute = async ({ props }) => {
  const lang = props.lang as string;
  const ui = await getUi(lang);
  const posts = await getPosts(lang);
  return rss({
    title: `${ui.site.name}: ${ui.blog.heading}`,
    description: ui.blog.description,
    site: abs(pathFor(lang, "/blog/")),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: abs(postPath(lang, postKey(post).slug)),
    })),
    customData: `<language>${ui.lang.htmlLang}</language>`,
  });
};
