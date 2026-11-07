import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 43,
  category: "developer-data",
  slug: "multi-hash-calculator",
  title: "Multi-Hash Calculator",
  description: "Hash text or files with MD5, SHA-1, SHA-256 and SHA-512 at the same time.",
  tagline: "Hash text and files",
  keywords: ["multi-hash calculator","multi","hash","calculator"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the multi-hash calculator?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Multi-Hash Calculator runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the multi-hash calculator free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
