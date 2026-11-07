import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 42,
  category: "developer-data",
  slug: "env-file-validator",
  title: "Env File Validator",
  description: "Parse .env files, find missing keys and syntax errors, remove duplicates and tidy the format.",
  tagline: "Check .env files",
  keywords: ["env file validator","env","file","validator"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the env file validator?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Env File Validator runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the env file validator free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
