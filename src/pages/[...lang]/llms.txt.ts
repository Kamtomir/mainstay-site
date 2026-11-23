import type { APIRoute } from "astro";
import { llmsTxt } from "../../lib/llms";
import { langPaths } from "../../lib/site";

export const getStaticPaths = langPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(await llmsTxt(props.lang as string), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
