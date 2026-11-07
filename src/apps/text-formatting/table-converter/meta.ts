import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 12,
  category: "text-formatting",
  slug: "table-converter",
  title: "Table Converter",
  description: "Turn CSV, TSV or plain text into Markdown, HTML and LaTeX tables.",
  tagline: "CSV to Markdown or HTML",
  keywords: ["csv to markdown table","csv to html table","csv to latex table","tsv to markdown","markdown table generator","table converter online"],
  seoTitle: "Table Converter: CSV to Markdown, HTML and LaTeX",
  seoDescription: "Free table converter. Paste CSV, TSV or a Markdown table and get a Markdown, HTML or LaTeX table back, with column alignment you control.",
  features: ["CSV, TSV, Markdown or spaced columns in","Markdown, HTML and LaTeX out","Left, centre or right alignment","Copy each result in one click"],
  mode: "local",
  faq: [
    { q: "How do I convert CSV to a Markdown table?", a: "Paste the CSV and the Markdown table appears at once. Copy it into your README or notes." },
    { q: "Can I get an HTML or LaTeX table too?", a: "Yes. The same data is shown as a Markdown, HTML and LaTeX table. Copy the one you need." },
    { q: "What if my data is separated by tabs or semicolons?", a: "Pick the separator, or paste tab-separated data from a spreadsheet. Both work." },
  ],
  built: true,
};
