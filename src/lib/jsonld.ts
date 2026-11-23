/**
 * schema.org builders.
 *
 * Honesty rules (AI answer engines read markup more literally than people):
 *  1. The markup says exactly what the page shows: the same price, the same
 *     question and answer, the same dates.
 *  2. No ratings or reviews: there are none to show.
 *  3. An empty collection returns null, not an empty node.
 */
import { site, abs, pathFor, type Ui } from "./site";

export type Node = Record<string, unknown>;

const personId = () => `${abs("/")}#author`;
const siteId = () => `${abs("/")}#website`;

/** The author: one node with a stable @id, referenced from every other node. */
export function person(ui: Ui, lang: string): Node {
  return {
    "@type": "Person",
    "@id": personId(),
    name: ui.author.name,
    description: ui.author.bio,
    url: abs(pathFor(lang, "/")),
    sameAs: [...site.authorProfiles],
    knowsAbout: ["Software quality assurance", "Continuous integration", "AI-assisted software development"],
  };
}

export function webSite(ui: Ui, lang: string): Node {
  return {
    "@type": "WebSite",
    "@id": siteId(),
    name: ui.site.name,
    description: ui.site.description,
    url: abs(pathFor(lang, "/")),
    inLanguage: ui.lang.htmlLang,
    author: { "@id": personId() },
  };
}

export interface ServiceInput {
  name: string;
  description: string;
  url: string;
  /** Deliverables, as listed on the page. */
  includes: readonly string[];
  /** Offers exactly as priced on the page; empty when the price is hidden. */
  offers: readonly { name: string; price: number; from: boolean }[];
}

export function service(input: ServiceInput, ui: Ui): Node {
  return {
    "@type": "Service",
    "@id": `${input.url}#service`,
    name: input.name,
    description: input.description,
    url: input.url,
    serviceType: "Software quality audit",
    provider: { "@id": personId() },
    inLanguage: ui.lang.htmlLang,
    serviceOutput: input.includes.map((name) => ({ "@type": "Thing", name })),
    ...(input.offers.length
      ? {
          offers: input.offers.map((o) => ({
            "@type": "Offer",
            name: o.name,
            url: input.url,
            priceCurrency: site.price.currency,
            // A "from" price is a minimum, not an exact price (rule 1).
            ...(o.from
              ? { priceSpecification: { "@type": "PriceSpecification", minPrice: o.price, priceCurrency: site.price.currency } }
              : { price: o.price }),
          })),
        }
      : {}),
  };
}

export function faqPage(items: readonly { q: string; a: string }[]): Node | null {
  if (!items.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

export function breadcrumbs(items: readonly { name: string; path?: string }[]): Node | null {
  if (!items.length) return null;
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: abs(c.path) } : {}),
    })),
  };
}

export interface ArticleInput {
  type: "BlogPosting" | "TechArticle";
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  wordCount?: number;
}

export function article(input: ArticleInput, ui: Ui): Node {
  return {
    "@type": input.type,
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: ui.lang.htmlLang,
    author: { "@id": personId() },
    publisher: { "@id": personId() },
    isPartOf: { "@id": siteId() },
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
  };
}

export function blog(name: string, description: string, url: string, posts: readonly { headline: string; url: string; datePublished: string }[], ui: Ui): Node {
  return {
    "@type": "Blog",
    name,
    description,
    url,
    inLanguage: ui.lang.htmlLang,
    author: { "@id": personId() },
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.headline, url: p.url, datePublished: p.datePublished })),
  };
}

/** The open-source harness. */
export function sourceCode(description: string, ui: Ui): Node {
  return {
    "@type": "SoftwareSourceCode",
    name: "mainstay",
    description,
    codeRepository: site.repoUrl,
    url: site.repoUrl,
    license: "https://opensource.org/license/mit",
    programmingLanguage: "TypeScript",
    isAccessibleForFree: true,
    inLanguage: ui.lang.htmlLang,
    author: { "@id": personId() },
  };
}

export interface DatasetVariable {
  name: string;
  value: number;
  unitText?: string;
}

/** The measured numbers of the case, with their period and their method. */
export function dataset(input: {
  name: string;
  description: string;
  url: string;
  temporalCoverage: string;
  measurementTechnique: string;
  variables: readonly DatasetVariable[];
}, ui: Ui): Node | null {
  if (!input.variables.length) return null;
  return {
    "@type": "Dataset",
    name: input.name,
    description: input.description,
    url: input.url,
    creator: { "@id": personId() },
    temporalCoverage: input.temporalCoverage,
    measurementTechnique: input.measurementTechnique,
    isAccessibleForFree: true,
    inLanguage: ui.lang.htmlLang,
    variableMeasured: input.variables.map((v) => ({
      "@type": "PropertyValue",
      name: v.name,
      value: v.value,
      ...(v.unitText ? { unitText: v.unitText } : {}),
    })),
  };
}

/** Several nodes as one @graph; null entries are dropped. */
export function graph(nodes: readonly (Node | null)[]): Node {
  return { "@context": "https://schema.org", "@graph": nodes.filter((n): n is Node => !!n) };
}
