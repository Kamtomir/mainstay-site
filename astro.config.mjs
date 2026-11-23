import { defineConfig } from "astro/config";
import { site } from "./site.config.mjs";

// A static site: every page is plain HTML at build time, no JavaScript is
// needed to read it. Search engines and AI crawlers get the full text.
export default defineConfig({
  site: site.url,
  output: "static",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "auto" },
  devToolbar: { enabled: false },
  markdown: {
    // Code always sits on a night card, so one dark theme is enough.
    shikiConfig: {
      theme: "github-dark",
      wrap: false,
    },
  },
});
