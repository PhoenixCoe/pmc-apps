import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 1,
  category: "text-formatting",
  slug: "case-converter",
  title: "Case Converter",
  description: "Convert text to upper, lower, title (AP or Chicago), camelCase, snake_case and kebab-case, with your own regex delimiter.",
  tagline: "Change text case",
  keywords: ["case converter","title case converter","uppercase to lowercase","camelCase converter","snake_case converter","kebab-case","AP title case","Chicago title case"],
  seoTitle: "Case Converter: UPPER, lower, Title Case, camelCase",
  seoDescription: "Free online case converter. Change text to uppercase, lowercase, AP or Chicago title case, camelCase, snake_case or kebab-case. Nothing is uploaded.",
  features: ["Upper and lower case","Title case in AP or Chicago style","camelCase, snake_case and kebab-case","Split on your own pattern","One result per line","Download everything as a .txt file"],
  mode: "local",
  faq: [
    { q: "How do I change text to title case?", a: "Paste your text, then pick Title case and choose AP or Chicago style. Small words such as \"a\", \"of\" and \"the\" stay lower case unless they start or end the title." },
    { q: "How do I turn a sentence into camelCase or snake_case?", a: "Pick camelCase, snake_case or kebab-case. Spaces, dashes and underscores are used as the break points, and you can set your own split pattern for anything else." },
    { q: "Can I convert a whole list at once?", a: "Yes. Each line is converted on its own, so you can paste a list of headings or variable names and download all the results as one text file." },
  ],
  built: true,
};
