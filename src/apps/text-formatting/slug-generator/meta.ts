import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 4,
  category: "text-formatting",
  slug: "slug-generator",
  title: "Slug Generator",
  description: "Turn any title into a URL-safe slug with stop-word removal, transliteration and an SEO length check.",
  tagline: "Make URL slugs",
  keywords: ["slug generator","url slug generator","seo friendly url","permalink generator","remove accents from text","slugify online"],
  seoTitle: "Slug Generator: make a clean URL from any title",
  seoDescription: "Free slug generator. Turn a title into a short, URL-safe slug. Removes accents and stop words, and checks the length for search engines.",
  features: ["Turns any title into a URL-safe slug","Accents become plain letters (é to e)","Optional stop-word removal","Dash or underscore separator","Length check for search results"],
  mode: "local",
  faq: [
    { q: "What is a URL slug?", a: "The last part of a web address that names the page, such as \"ultimate-guide\" in example.com/ultimate-guide. A short, readable slug helps people and search engines." },
    { q: "How long should a slug be?", a: "Short is better: a few words, ideally under about 60 characters. The tool shows a length check so you can trim it." },
    { q: "What happens to accents and symbols?", a: "Accented letters are changed to plain ones (café becomes cafe), symbols are dropped and spaces become dashes." },
  ],
  built: true,
};
