'use client';
import { useState } from 'react';
import type { GroupKey } from '@/lib/types';
import type { GroupEntry } from '@/registry';
import { AppCell } from './AppCell';
import { UiIcon } from './icons';

/** The groups as colour bars. Open one to see its apps in a tidy grid. Every link is in the page even while a group is shut. */
export function HomeGroups({ groups }: { groups: GroupEntry[] }) {
  const [open, setOpen] = useState<Partial<Record<GroupKey, boolean>>>({});
  const all = groups.every((g) => open[g.key]);
  const toggleAll = () => setOpen(Object.fromEntries(groups.map((g) => [g.key, !all])));
  return (
    <section aria-labelledby="groups-title">
      <div className="top-row">
        <h2 id="groups-title" className="d">Browse by group</h2>
        <button type="button" className="link-btn" onClick={toggleAll}>{all ? 'Collapse all' : 'Expand all'}</button>
      </div>
      {groups.map((g) => {
        const isOpen = !!open[g.key];
        return (
          <article key={g.key} className={`grp${isOpen ? ' open' : ''}`} data-g={g.key}>
            <button type="button" className="grp-h gtone" aria-expanded={isOpen} aria-controls={`grp-${g.key}`} onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}>
              <span className="grp-t"><h3 className="d">{g.name}</h3><span className="grp-b tx">{g.blurb}</span></span>
              <span className="grp-n d">{g.apps.length} apps</span>
              <span className="grp-tg" aria-hidden><UiIcon name="down" size={20} /></span>
            </button>
            <div className="grp-body" id={`grp-${g.key}`} hidden={!isOpen}>
              {g.apps.map((a) => <AppCell key={a.slug} slug={a.slug} href={a.href} title={a.title} tagline={a.tagline} />)}
            </div>
          </article>
        );
      })}
    </section>
  );
}
