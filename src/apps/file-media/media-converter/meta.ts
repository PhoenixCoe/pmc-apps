import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 13,
  category: "file-media",
  slug: "media-converter",
  title: "Media Converter",
  description: "Convert PNG, JPEG, WEBP, AVIF, MP3, WAV and OGG files in your browser with WebAssembly.",
  tagline: "Convert images and audio",
  keywords: ["media converter","media","converter"],
  mode: "local",
  heavy: true,
  faq: [
    { q: "Do I need an account to use the media converter?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Media Converter runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the media converter free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
