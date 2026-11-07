import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 41,
  category: "developer-data",
  slug: "jwt-inspector",
  title: "JWT Inspector",
  description: "Decode JWT headers and payloads, check expiry and verify a secret.",
  tagline: "Read JWT tokens",
  keywords: ["jwt inspector","jwt","inspector"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the jwt inspector?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. JWT Inspector runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the jwt inspector free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
