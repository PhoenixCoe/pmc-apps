import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 32,
  category: "productivity-student",
  slug: "multi-tally-counter",
  title: "Multi-Tally Counter",
  description: "Run several counters with custom steps, hotkeys 1 to 9, sound and CSV logs.",
  tagline: "Count with hotkeys",
  keywords: ["multi-tally counter","multi","tally","counter"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the multi-tally counter?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Multi-Tally Counter runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the multi-tally counter free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
