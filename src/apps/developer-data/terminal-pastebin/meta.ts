import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 39,
  category: "developer-data",
  slug: "terminal-pastebin",
  title: "Terminal Pastebin",
  description: "Share text and code as a link, with syntax colours, an expiry date and an optional password.",
  tagline: "Share text as a link",
  keywords: ["terminal pastebin","terminal","pastebin"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the terminal pastebin?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Terminal Pastebin runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the terminal pastebin free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
