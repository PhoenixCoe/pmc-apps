import type { Metadata } from 'next';
import type { AppMeta } from './types';
import { categories, categoryBySlug } from './categories';

export const SITE = process.env.SITE_URL ?? 'https://apps.pmcstudios.uk';
/** GitHub Pages serves every page as /name/, so canonical and sitemap URLs carry the slash there. */
export const pageUrl = (path: string) => `${SITE}/${path}${path && process.env.STATIC_EXPORT === '1' ? '/' : ''}`;
export const ogUrl = (m: Pick<AppMeta, 'slug'>) => `${SITE}/og/${m.slug}.png`;
export const appUrl = (m: Pick<AppMeta, 'category' | 'slug'>) => pageUrl(m.slug);

export function appMetadata(m: AppMeta): Metadata {
  // Just the name, the same way every time: "PMC Case Converter". The description and search words do the explaining.
  const title = `PMC ${m.title}`;
  const description = m.seoDescription ?? m.description;
  const url = appUrl(m);
  return {
    title: { absolute: title },
    description,
    // Apps that are not built yet are listed for visitors but kept out of search until they work.
    robots: m.built ? undefined : { index: false, follow: true },
    keywords: m.keywords,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, siteName: 'PMC Apps', title, description, images: [{ url: ogUrl(m), width: 1200, height: 630, alt: `${m.title} on PMC Apps` }] },
    twitter: { card: 'summary_large_image', title, description, images: [ogUrl(m)] },
  };
}

/** WebApplication + FAQPage + BreadcrumbList, emitted together on every app route. */
export function appJsonLd(m: AppMeta) {
  const cat = categoryBySlug(m.category);
  const url = appUrl(m);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: m.title,
      description: m.seoDescription ?? m.description,
      url,
      applicationCategory: 'UtilitiesApplication',
      ...(m.features?.length ? { featureList: m.features } : {}),
      keywords: m.keywords.join(', '),
      image: ogUrl(m),
      inLanguage: 'en-GB',
      operatingSystem: 'Any (runs in a web browser)',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
      publisher: { '@type': 'Organization', name: 'PMC Studios', url: 'https://pmcstudios.uk' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: m.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Apps', item: SITE },
        { '@type': 'ListItem', position: 2, name: cat?.name ?? m.category, item: pageUrl(m.category) },
        { '@type': 'ListItem', position: 3, name: m.title, item: url },
      ],
    },
  ];
}

/** The home page: the site itself, and the list of tools in it. */
export function homeJsonLd(list: AppMeta[]) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PMC Apps',
      url: SITE,
      description: 'Free browser tools for text, files, study, code and the web. No install and no account.',
      publisher: { '@type': 'Organization', name: 'PMC Studios', url: 'https://pmcstudios.uk' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'PMC Apps',
      numberOfItems: list.length,
      itemListElement: list.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.title, url: appUrl(m) })),
    },
    ...categories.map((c) => ({
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.name, description: c.blurb, url: pageUrl(c.slug),
    })),
  ];
}
