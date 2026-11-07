import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 18,
  category: "file-media",
  slug: "pdf-page-manager",
  title: "PDF Page Manager",
  description: "Drag pages to extract, reorder, rotate, split and merge PDF documents.",
  tagline: "Reorder and split PDFs",
  keywords: ["pdf page manager","pdf","page","manager"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the pdf page manager?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. PDF Page Manager runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the pdf page manager free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
