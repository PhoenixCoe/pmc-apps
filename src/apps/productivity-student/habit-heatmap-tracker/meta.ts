import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 30,
  category: "productivity-student",
  slug: "habit-heatmap-tracker",
  title: "Habit Heatmap Tracker",
  description: "Log habits and see a year-long activity heatmap, streaks and backups.",
  tagline: "Track habits",
  keywords: ["habit heatmap tracker","habit","heatmap","tracker"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the habit heatmap tracker?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Habit Heatmap Tracker runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the habit heatmap tracker free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
