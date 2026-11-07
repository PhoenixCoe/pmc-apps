import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 21,
  category: "file-media",
  slug: "color-palette-extractor",
  title: "Color & Palette Extractor",
  description: "Pull dominant colours from an image, check WCAG contrast and export HEX, RGB or CSS variables.",
  tagline: "Colours from an image",
  keywords: ["color & palette extractor","color","palette","extractor"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the color & palette extractor?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Color & Palette Extractor runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the color & palette extractor free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
