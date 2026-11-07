import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 9,
  category: "text-formatting",
  slug: "lorem-generator",
  title: "Lorem Generator",
  description: "Generate placeholder text in Latin, tech startup, legal or medical styles.",
  tagline: "Placeholder text",
  keywords: ["lorem ipsum generator","placeholder text","dummy text generator","filler text","lorem ipsum paragraphs","sample text generator"],
  seoTitle: "Lorem Ipsum Generator: placeholder text in 4 styles",
  seoDescription: "Free lorem ipsum generator. Make placeholder paragraphs, sentences or words in classic Latin, tech startup, legal or medical style, then copy them.",
  features: ["Paragraphs, sentences or words","Classic Latin, tech startup, legal and medical styles","Write new text with one click","Copy in one click"],
  mode: "local",
  faq: [
    { q: "What is lorem ipsum?", a: "Dummy text used to fill a design so you can judge the layout before the real words are ready. It is based on scrambled Latin." },
    { q: "How do I generate lorem ipsum?", a: "Choose paragraphs, sentences or words, set how many, and pick a style. Use Write new text to get a fresh version." },
    { q: "Can I get placeholder text that is not Latin?", a: "Yes. The tech startup, legal and medical styles use English-sounding text for mock-ups where Latin looks out of place." },
  ],
  built: true,
};
