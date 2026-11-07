import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 5,
  category: "text-formatting",
  slug: "word-readability-analyzer",
  title: "Word & Readability Analyzer",
  description: "Count words, characters, sentences and paragraphs, score readability and see keyword density.",
  tagline: "Count words, score reading",
  keywords: ["word counter","character counter","readability checker","flesch reading ease","flesch-kincaid grade level","keyword density checker","sentence counter"],
  seoTitle: "Word Counter & Readability Checker: free, instant",
  seoDescription: "Free word counter and readability checker. Count words, characters, sentences and paragraphs, get Flesch reading ease and grade level, and see keyword density.",
  features: ["Words, characters, sentences and paragraphs","Flesch reading ease score","Flesch-Kincaid grade level","Keyword density list","Updates as you type"],
  mode: "local",
  faq: [
    { q: "How do I count the words in my text?", a: "Type or paste it in. The word, character, sentence and paragraph counts update as you type." },
    { q: "What is a good readability score?", a: "On the Flesch scale, 60 to 70 is plain English that most adults read easily. Higher is easier. The grade level tells you roughly the school year needed to follow it." },
    { q: "What is keyword density?", a: "How often a word appears compared with the total words. The list shows your most used words so you can spot overuse." },
  ],
  built: true,
};
