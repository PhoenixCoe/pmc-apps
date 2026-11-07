import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 56,
  category: "business-web",
  slug: "git-license-generator",
  title: "Git & License Generator",
  description: "Generate a .gitignore for your stack and add an MIT, Apache or GPL licence.",
  tagline: ".gitignore and licences",
  keywords: ["git & license generator","git","license","generator"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the git & license generator?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Git & License Generator runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the git & license generator free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
