import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 45,
  category: "developer-data",
  slug: "code-snapshot-studio",
  title: "Code Snapshot Studio",
  description: "Turn code into a shareable card with syntax themes and window controls, exported as PNG.",
  tagline: "Code as a picture",
  keywords: ["code snapshot studio","code","snapshot","studio"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the code snapshot studio?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Code Snapshot Studio runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the code snapshot studio free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
