import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 36,
  category: "productivity-student",
  slug: "encrypted-scratchpad",
  title: "Encrypted Scratchpad",
  description: "Keep Markdown notes locked with a password, organised by tag, stored on your device.",
  tagline: "Locked notes",
  keywords: ["encrypted scratchpad","encrypted","scratchpad"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the encrypted scratchpad?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Encrypted Scratchpad runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the encrypted scratchpad free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
