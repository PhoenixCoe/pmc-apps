import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 26,
  category: "productivity-student",
  slug: "unit-currency-matrix",
  title: "Unit & Currency Matrix",
  description: "Convert length, mass, temperature, data size, speed and live currency rates.",
  tagline: "Convert units and money",
  keywords: ["unit & currency matrix","unit","currency","matrix"],
  mode: "network",
  faq: [
    { q: "Do I need an account to use the unit & currency matrix?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "Only what the tool needs to fetch from outside, such as rates or leak checks. Anything else you type stays on your device." },
    { q: "Is the unit & currency matrix free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
