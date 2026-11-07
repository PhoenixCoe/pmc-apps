import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 31,
  category: "productivity-student",
  slug: "password-engine",
  title: "Password Engine",
  description: "Generate strong passwords with entropy ratings, character options and leak warnings.",
  tagline: "Make strong passwords",
  keywords: ["password engine","password","engine"],
  mode: "network",
  faq: [
    { q: "Do I need an account to use the password engine?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "Only what the tool needs to fetch from outside, such as rates or leak checks. Anything else you type stays on your device." },
    { q: "Is the password engine free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
