import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 22,
  category: "file-media",
  slug: "background-remover",
  title: "Background Remover",
  description: "Remove background colours and alpha channels from graphics and photos on a canvas.",
  tagline: "Remove backgrounds",
  keywords: ["background remover","background","remover"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the background remover?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Background Remover runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the background remover free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
