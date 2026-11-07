import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 10,
  category: "text-formatting",
  slug: "list-cleaner-deduplicator",
  title: "List Cleaner & Deduplicator",
  description: "Remove duplicate lines, trim whitespace, toggle case sensitivity and see how often each item appears.",
  tagline: "Remove duplicate lines",
  keywords: ["remove duplicate lines","deduplicate list online","list cleaner","sort list alphabetically","remove blank lines","duplicate remover"],
  seoTitle: "Remove Duplicate Lines: list cleaner and sorter",
  seoDescription: "Free online duplicate line remover. Paste a list to delete repeats, trim spaces, sort it, and see how many times each item appeared.",
  features: ["Removes repeated lines instantly","Trims stray spaces","Sort A to Z or Z to A","Choose which copy to keep","Shows how often each item repeated","Download the clean list"],
  mode: "local",
  faq: [
    { q: "How do I remove duplicate lines from a list?", a: "Paste the list and repeats are removed as soon as you do. The cleaned list is on the right, ready to copy or download." },
    { q: "Does it treat \"Apple\" and \"apple\" as the same?", a: "You choose. Switch case sensitivity on to treat them as different, or off to treat them as the same item." },
    { q: "Can I see which items were repeated?", a: "Yes. The Repeated items list shows each duplicate and how many times it appeared." },
  ],
  built: true,
};
