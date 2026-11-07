import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Band } from '@/components/shared/Band';
import { FaqAccordion } from '@/components/shared/FaqAccordion';
import { AppIcon } from '@/components/shared/icons';
import { JsonLd } from '@/components/shared/JsonLd';
import { RecentTracker } from '@/components/shared/Recent';
import { TryRow } from '@/components/shared/TryRow';
import { categoryBySlug } from '@/lib/categories';
import { appJsonLd, appMetadata } from '@/lib/seo';
import { getApp } from '@/registry';

export const appPageMetadata = (category: string, slug: string): Metadata => {
  const m = getApp(category, slug);
  return m ? appMetadata(m) : {};
};

const NOTE = {
  local: undefined,
  network: 'This tool contacts an outside service only to fetch what it needs, such as exchange rates. What you type stays on your device.',
  server: 'What you make here is stored on the PMC server for as long as you choose, and you can delete it at any time.',
} as const;

/**
 * One app: a coloured band with its name, the tool, three questions, and four more apps to try.
 * The whole page carries its group's colour (data-g), so the tool's shadows and buttons take it too.
 * Chat-style apps (fullbleed) have no band: the tool fills the page under the top bar.
 */
export function AppPage({ category, slug, children }: { category: string; slug: string; children: ReactNode }) {
  const m = getApp(category, slug);
  const c = categoryBySlug(category);
  if (!m || !c) notFound();
  const note = m.note ?? NOTE[m.mode];

  return (
    <div data-g={c.key} className="gscope">
      {m.fullbleed ? (
        <>
          <h1 className="sr">{m.title}</h1>
          <section id="tool" className="bleed" aria-label={m.title}>{children}</section>
        </>
      ) : (
        <Band back title={m.title} line={m.tagline} g={c.key} icon={<AppIcon slug={m.slug} size={96} still={false} />} />
      )}
      <div className="wrap body">
        {!m.fullbleed && <section id="tool" className="stage" aria-label={m.title}>{children}</section>}
        {note && <p className="fn tx">{note}</p>}
        <FaqAccordion items={m.faq} />
        <TryRow slug={m.slug} />
      </div>
      <JsonLd data={appJsonLd(m)} />
      {m.built && <RecentTracker slug={m.slug} />}
    </div>
  );
}
