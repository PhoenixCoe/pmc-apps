import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 3,
  category: "text-formatting",
  slug: "code-minifier-diff",
  title: "Code Minifier & Diff",
  description: "Strip whitespace and comments, see the bytes saved live, and compare before and after side by side.",
  tagline: "Shrink code, compare changes",
  keywords: ["code minifier","minify javascript online","minify css online","minify html","compress code","reduce file size code","minified vs original"],
  seoTitle: "Code Minifier: shrink JS, CSS and HTML, see the diff",
  seoDescription: "Free online minifier. Strip whitespace and comments from JavaScript, CSS, HTML or JSON, see exactly how many bytes you saved, and see what was removed.",
  features: ["Removes whitespace and comments","Shows bytes saved as you type","See what was removed","JavaScript, CSS, HTML and JSON"],
  mode: "local",
  faq: [
    { q: "How do I minify JavaScript or CSS online?", a: "Paste your code and pick JavaScript, CSS, HTML or JSON. The minified version appears with the number of bytes saved." },
    { q: "Is minified code safe to use?", a: "Minifying only removes spaces and comments, so the code behaves the same. Keep your original file: minified code is hard to read and edit." },
    { q: "Can I see what was removed?", a: "Yes. Switch the compare view to \"What was removed\" to see exactly what was taken out." },
  ],
  built: true,
};
