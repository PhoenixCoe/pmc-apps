import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 7,
  category: "text-formatting",
  slug: "text-diff-inspector",
  title: "Text Diff Inspector",
  description: "Compare two texts by character or by line, side by side, and export a .patch file.",
  tagline: "Compare two texts",
  keywords: ["text diff","compare two texts","diff checker online","text compare tool","find differences between two texts","patch file generator"],
  seoTitle: "Text Diff Checker: compare two texts side by side",
  seoDescription: "Free online text compare tool. Paste two versions to see every change, by line or by character, side by side. Download the result as a .patch file.",
  features: ["Side by side comparison","Compare by line or by character","Swap the two sides","Download a .patch file"],
  mode: "local",
  faq: [
    { q: "How do I compare two pieces of text?", a: "Paste the original on the left and the new version on the right. Every change is highlighted straight away." },
    { q: "What is the difference between line and character mode?", a: "Line mode marks whole lines that changed. Character mode marks the exact letters, which is better for small edits inside a line." },
    { q: "What is a .patch file?", a: "A small file that lists the changes between two versions. Developers apply it with tools such as git. You can download one from the result." },
  ],
  built: true,
};
