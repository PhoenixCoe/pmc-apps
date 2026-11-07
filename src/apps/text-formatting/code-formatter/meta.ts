import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 2,
  category: "text-formatting",
  slug: "code-formatter",
  title: "Code Formatter",
  description: "Clean up JavaScript, TypeScript, HTML, CSS, Python and SQL with your own indentation rules and syntax error flags.",
  tagline: "Tidy up code",
  keywords: ["code formatter","online code beautifier","format javascript online","format sql online","format css online","python formatter","html beautifier"],
  seoTitle: "Code Formatter: JavaScript, HTML, CSS, Python, SQL",
  seoDescription: "Free online code formatter. Tidy JavaScript, TypeScript, HTML, CSS, Python and SQL with your own indent rules, and see syntax problems flagged.",
  features: ["JavaScript, TypeScript, HTML, CSS, Python and SQL","Tabs or spaces, your choice of width","Line width and trailing comma options","SQL dialects: standard, PostgreSQL, SQL Server, SQLite","Syntax problems listed with the line they are on"],
  mode: "local",
  faq: [
    { q: "How do I format messy code online?", a: "Choose the language, paste your code and it is tidied straight away. Change the indent, line width or trailing commas and the result updates." },
    { q: "Which languages can it format?", a: "JavaScript, TypeScript, HTML, CSS, Python and SQL. For SQL you can also choose the dialect, such as PostgreSQL, SQL Server or SQLite." },
    { q: "Will it tell me if my code has a mistake?", a: "It flags syntax problems it can find, with the line number, so you can fix them. It formats code; it does not run it." },
  ],
  built: true,
};
