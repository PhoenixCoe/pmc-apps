import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 25,
  category: "productivity-student",
  slug: "vector-qr-maker",
  title: "Vector QR Maker",
  description: "Make SVG QR codes with a logo, custom dot and corner shapes and vector downloads.",
  tagline: "Make QR codes",
  keywords: ["vector qr maker","vector","qr","maker"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the vector qr maker?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Vector QR Maker runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the vector qr maker free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
