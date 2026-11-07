import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 23,
  category: "file-media",
  slug: "pixel-art-maker",
  title: "Pixel Art Maker",
  description: "Draw sprites on a fullscreen grid with custom palettes and onion skinning.",
  tagline: "Draw pixel sprites",
  keywords: ["pixel art maker","pixel","art","maker"],
  mode: "local",
  heavy: true,
  fullscreen: true,
  faq: [
    { q: "Do I need an account to use the pixel art maker?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Pixel Art Maker runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the pixel art maker free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
