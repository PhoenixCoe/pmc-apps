import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 47,
  category: "developer-data",
  slug: "mock-rest-api-studio",
  title: "Mock REST API Studio",
  description: "Make pretend endpoints with fake data, status codes and delays, then export the code.",
  tagline: "Fake API endpoints",
  keywords: ["mock rest api studio","mock","rest","api","studio"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the mock rest api studio?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Mock REST API Studio runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the mock rest api studio free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
