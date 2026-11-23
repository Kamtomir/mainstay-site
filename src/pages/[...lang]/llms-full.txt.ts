import type { APIRoute } from "astro";
import { llmsFullTxt } from "../../lib/llms";
import { langPaths } from "../../lib/site";

export const getStaticPaths = langPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(await llmsFullTxt(props.lang as string), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
