import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 40,
  category: "developer-data",
  slug: "base64-studio",
  title: "Base64 Studio",
  description: "Encode and decode Base64 and data URIs with instant image, SVG and audio previews.",
  tagline: "Encode and decode Base64",
  keywords: ["base64 studio","base64","studio"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the base64 studio?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Base64 Studio runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the base64 studio free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
