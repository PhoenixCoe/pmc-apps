import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 29,
  category: "productivity-student",
  slug: "invoice-builder",
  title: "Invoice Builder",
  description: "Build line-item invoices with tax, discounts and your logo, then download a PDF.",
  tagline: "Make an invoice PDF",
  keywords: ["invoice builder","invoice","builder"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the invoice builder?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Invoice Builder runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the invoice builder free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
