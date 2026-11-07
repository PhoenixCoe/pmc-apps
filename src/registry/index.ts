import { apps } from './apps.generated';
import { categories, categoryBySlug } from '@/lib/categories';
import type { AppMeta, CategorySlug, GroupKey } from '@/lib/types';

export { apps };
export const getApp = (category: string, slug: string): AppMeta | undefined =>
  apps.find((a) => a.category === category && a.slug === slug);
export const appsIn = (category: CategorySlug): AppMeta[] => apps.filter((a) => a.category === category);
export const appHref = (a: Pick<AppMeta, 'category' | 'slug'>) => `/${a.slug}`;
export const groupKeyOf = (category: string): GroupKey => categoryBySlug(category)?.key ?? 'text';

/** Compact index for search, the Apps menu and the group lists (kept small: no FAQ text goes to the client). */
export const searchIndex = apps.map((a) => {
  const c = categoryBySlug(a.category);
  return {
    href: appHref(a),
    slug: a.slug,
    title: a.title,
    tagline: a.tagline,
    key: c?.key ?? 'text',
    category: c?.name ?? '',
    short: c?.short ?? '',
    haystack: [a.title, a.tagline, ...a.keywords.slice(0, 6)].join(' ').toLowerCase(),
  };
});
export type AppEntry = (typeof searchIndex)[number];

/** The groups, each with its apps, for the menus. */
export const groupList = categories.map((c) => ({
  slug: c.slug, key: c.key, name: c.name, blurb: c.blurb, short: c.short,
  apps: searchIndex.filter((a) => a.key === c.key),
}));
export type GroupEntry = (typeof groupList)[number];
