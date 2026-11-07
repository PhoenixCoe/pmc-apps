import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 60,
  category: "business-web",
  slug: "faq-schema-builder",
  title: "FAQ Schema Builder",
  description: "Build an FAQ accordion and get the HTML plus valid FAQPage JSON-LD.",
  tagline: "FAQ markup builder",
  keywords: ["faq schema builder","faq","schema","builder"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the faq schema builder?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. FAQ Schema Builder runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the faq schema builder free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
