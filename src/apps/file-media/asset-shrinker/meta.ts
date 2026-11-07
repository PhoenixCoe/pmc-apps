import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 15,
  category: "file-media",
  slug: "asset-shrinker",
  title: "Asset Shrinker",
  description: "Compress SVG, PNG and sprite sheets without losing quality, with a before and after slider.",
  tagline: "Make files smaller",
  keywords: ["asset shrinker","asset","shrinker"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the asset shrinker?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Asset Shrinker runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the asset shrinker free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
