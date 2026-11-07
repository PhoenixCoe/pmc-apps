import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 48,
  category: "developer-data",
  slug: "cron-schedule-helper",
  title: "Cron Schedule Helper",
  description: "Build a cron expression visually, read it in plain English and see the next run times.",
  tagline: "Build cron schedules",
  keywords: ["cron schedule helper","cron","schedule","helper"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the cron schedule helper?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Cron Schedule Helper runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the cron schedule helper free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
