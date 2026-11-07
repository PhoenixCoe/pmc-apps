import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 50,
  category: "business-web",
  slug: "wcag-contrast-studio",
  title: "WCAG Contrast Studio",
  description: "Check colour pairs against WCAG AA and AAA with live component previews.",
  tagline: "Check colour contrast",
  keywords: ["wcag contrast studio","wcag","contrast","studio"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the wcag contrast studio?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. WCAG Contrast Studio runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the wcag contrast studio free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
