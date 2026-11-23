/**
 * The one file to edit when the address, the contact link or the price changes.
 * Everything else (pages, JSON-LD, llms.txt, sitemap, RSS) reads from here.
 *
 * Texts live in src/locales/<language>/, numbers of the case in src/data/case.ts.
 */
export const site = {
  /**
   * The public address, without a trailing slash.
   * An address that ends with ".example" is treated as a placeholder:
   * `npm run build` warns about it, and on GitHub the build fails, so a site
   * with a made-up address cannot be published.
   */
  url: "https://dashdamirov.dev",

  /** The language served at the root ("/"). Other languages live under "/<code>/". */
  defaultLang: "en",

  /** Where the main button leads. No forms on the site: a link only. */
  consultUrl: "https://t.me/K_Damiroff",
  /** Shown next to the button, so a visitor sees where the link goes. */
  consultHandle: "@K_Damiroff",

  /** The open-source harness and its documents. */
  repoUrl: "https://github.com/Kamtomir/mainstay",
  repoSlug: "Kamtomir/mainstay",

  /**
   * The product the author built and the numbers come from: its name and its
   * public site. Texts use the address as {productUrl}.
   */
  product: { name: "Catch Club", url: "https://catchclub.app" },

  /** Public profiles of the author (JSON-LD `sameAs`, the footer). */
  authorProfiles: ["https://github.com/Kamtomir", "https://t.me/K_Damiroff"],

  /**
   * The price as shown on the page, in whole US dollars.
   * `amount` is the fixed price of the five-day audit and install.
   * `intro` is optional: a lower price for the first clients, for example
   * `{ amount: 1500, clients: 3 }`; `null` prints no such line.
   * Set `show: false` to print "price after the free review" instead.
   *
   * @type {{ show: boolean, currency: string, amount: number, intro: { amount: number, clients: number } | null }}
   */
  price: {
    show: true,
    currency: "USD",
    amount: 2000,
    intro: null,
  },

  /** The day the pages were first published (ISO date). Set it on launch day. */
  publishedAt: "2026-11-23",

  /** The day the facts on the site were last checked against the sources (ISO date). */
  factsCheckedAt: "2026-11-23",
};

export default site;
