import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 55,
  category: "business-web",
  slug: "terms-of-service-builder",
  title: "Terms of Service Builder",
  description: "Assemble terms of service from clauses for billing, user content and liability.",
  tagline: "Build terms of service",
  keywords: ["terms of service builder","terms","of","service","builder"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the terms of service builder?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Terms of Service Builder runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the terms of service builder free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
