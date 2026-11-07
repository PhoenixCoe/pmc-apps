import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 8,
  category: "text-formatting",
  slug: "regex-sandbox",
  title: "RegEx Sandbox",
  description: "Test regular expressions live, see capture groups, get a plain-English explanation and use the quick reference.",
  tagline: "Test regular expressions",
  keywords: ["regex tester","regular expression tester","regex online","regex quick reference","test regex","regex explainer","javascript regex"],
  seoTitle: "Regex Tester: test patterns with plain-English help",
  seoDescription: "Free online regex tester. Try a regular expression on your own text, see every match highlighted, and read what the pattern does in plain English.",
  features: ["Live match highlighting","Capture groups listed","Plain-English explanation of your pattern","Built-in quick reference","Stops runaway patterns"],
  mode: "local",
  faq: [
    { q: "How do I test a regular expression?", a: "Type your pattern, paste the text you want to search, and every match is highlighted as you type." },
    { q: "What does my regex mean?", a: "The \"What this pattern does\" panel explains your pattern in plain English, piece by piece. The quick reference covers common symbols." },
    { q: "Why does it say the pattern is taking too long?", a: "Some patterns can take a very long time on certain text. The tool stops them so your browser does not freeze. Try making the pattern more specific." },
  ],
  built: true,
};
