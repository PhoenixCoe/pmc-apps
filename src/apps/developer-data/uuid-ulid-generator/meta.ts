import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 44,
  category: "developer-data",
  slug: "uuid-ulid-generator",
  title: "UUID & ULID Generator",
  description: "Generate v4 and v7 UUIDs and ULIDs in bulk, decode timestamps and export arrays.",
  tagline: "Make UUIDs and ULIDs",
  keywords: ["uuid & ulid generator","uuid","ulid","generator"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the uuid & ulid generator?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. UUID & ULID Generator runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the uuid & ulid generator free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
