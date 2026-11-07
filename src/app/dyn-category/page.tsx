import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AppCell } from '@/components/shared/AppCell';
import { Band } from '@/components/shared/Band';
import { categories, categoryBySlug } from '@/lib/categories';
import { pageUrl } from '@/lib/seo';
import { groupList } from '@/registry';

type P = { params: Promise<{ category: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => categories.map((c) => ({ category: c.slug }));

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = categoryBySlug((await params).category);
  if (!c) return {};
  return { title: c.name, description: c.blurb, alternates: { canonical: pageUrl(c.slug) } };
}

export default async function CategoryPage({ params }: P) {
  const c = categoryBySlug((await params).category);
  const g = groupList.find((x) => x.slug === c?.slug);
  if (!c || !g) notFound();
  return (
    <div data-g={c.key}>
      <Band title={c.name} line={c.blurb} g={c.key} />
      <div className="wrap body">
        <section className="grp open" aria-label={`${c.name} apps`}>
          <div className="grp-body">
            {g.apps.map((a) => <AppCell key={a.slug} slug={a.slug} href={a.href} title={a.title} tagline={a.tagline} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
