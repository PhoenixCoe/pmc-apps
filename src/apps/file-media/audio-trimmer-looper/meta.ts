import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 17,
  category: "file-media",
  slug: "audio-trimmer-looper",
  title: "Audio Trimmer & Looper",
  description: "Cut audio on a live waveform, normalise volume and loop playback.",
  tagline: "Cut and loop audio",
  keywords: ["audio trimmer & looper","audio","trimmer","looper"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the audio trimmer & looper?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Audio Trimmer & Looper runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the audio trimmer & looper free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
