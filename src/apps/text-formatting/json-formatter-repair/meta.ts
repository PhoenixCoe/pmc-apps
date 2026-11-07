import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 11,
  category: "text-formatting",
  slug: "json-formatter-repair",
  title: "JSON Formatter & Repair",
  description: "Validate, format and repair JSON, including trailing commas, with a collapsible tree.",
  tagline: "Format and fix JSON",
  keywords: ["json formatter","json validator","fix broken json","json beautifier","json repair online","json pretty print","trailing comma json"],
  seoTitle: "JSON Formatter & Validator: fix broken JSON online",
  seoDescription: "Free JSON formatter and validator. Pretty-print JSON, find errors, and repair common problems like trailing commas, with a tree you can fold.",
  features: ["Checks JSON is valid","Pretty-prints with your layout","Repairs trailing commas and similar slips","Expand and collapse the tree","Download the result"],
  mode: "local",
  faq: [
    { q: "How do I check if my JSON is valid?", a: "Paste it in. You will see \"Valid JSON\" or the first problem and where it is." },
    { q: "How do I fix a trailing comma in JSON?", a: "Paste it in and the repair step removes trailing commas and fixes other common slips, then shows you the repaired version." },
    { q: "Can I make big JSON easier to read?", a: "Yes. Pretty-print it, then use Expand all and Collapse all on the tree to move around." },
  ],
  built: true,
};
