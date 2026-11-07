import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 46,
  category: "developer-data",
  slug: "webhook-inspector-replayer",
  title: "Webhook Inspector & Replayer",
  description: "Read a webhook request, check its signature, edit it and send it again.",
  tagline: "Inspect and resend webhooks",
  keywords: ["webhook inspector & replayer","webhook","inspector","replayer"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the webhook inspector & replayer?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Webhook Inspector & Replayer runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the webhook inspector & replayer free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
