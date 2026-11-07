'use client';
import { useState } from 'react';
import type { GroupEntry } from '@/registry';
import { AppCell } from './AppCell';

/** Every tool in one grid. The buttons above it narrow it to one kind of job, right away. All 60 stay in the page, so search engines and "find in page" still see them. */
export function Browse({ groups }: { groups: GroupEntry[] }) {
  const [g, setG] = useState<string>('all');
  const total = groups.reduce((n, x) => n + x.apps.length, 0);
  const chips: { key: string; label: string; n: number }[] = [{ key: 'all', label: 'All', n: total }, ...groups.map((x) => ({ key: x.key, label: x.short || x.name, n: x.apps.length }))];
  return (
    <section className="browse" aria-labelledby="all-title" data-show={g}>
      <div className="browse-h">
        <h2 id="all-title" className="d">All tools</h2>
        <div className="chips" role="group" aria-label="Show">
          {chips.map((c) => (
            <button key={c.key} type="button" className="kchip" data-k={c.key} aria-pressed={g === c.key} onClick={() => setG(c.key)}>{c.label}<i>{c.n}</i></button>
          ))}
        </div>
      </div>
      <div className="tiles">
        {groups.flatMap((x) => x.apps.map((a) => <AppCell key={a.slug} slug={a.slug} href={a.href} title={a.title} tagline={a.tagline} g={x.key} />))}
      </div>
    </section>
  );
}
