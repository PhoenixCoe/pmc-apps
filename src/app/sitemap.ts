export const dynamic = 'force-static';
import type { MetadataRoute } from 'next';
import { categories } from '@/lib/categories';
import { appUrl, pageUrl } from '@/lib/seo';
import { apps } from '@/registry';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: pageUrl(''), changeFrequency: 'weekly', priority: 1 },
    { url: pageUrl('suggest'), changeFrequency: 'yearly', priority: 0.3 },
    { url: pageUrl('privacy'), changeFrequency: 'yearly', priority: 0.2 },
    ...categories.map((c) => ({ url: pageUrl(c.slug), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...apps.filter((a) => a.built).map((a) => ({ url: appUrl(a), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
