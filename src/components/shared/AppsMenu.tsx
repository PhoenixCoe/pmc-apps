'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { GroupKey } from '@/lib/types';
import { useApps } from './AppsContext';
import { AppIcon } from './icons';

/**
 * The Apps menu: the groups down the left, and the apps of the group you point at on the right (never all sixty at once).
 * It opens on the group you are in, with your app marked.
 */
export function AppsMenu({ currentKey, currentSlug, onClose }: { currentKey?: GroupKey; currentSlug?: string; onClose: () => void }) {
  const { groups } = useApps();
  const [sel, setSel] = useState<GroupKey>(currentKey ?? groups[0]?.key ?? 'text');
  const g = groups.find((x) => x.key === sel) ?? groups[0];
  if (!g) return null;
  return (
    <div className="am" id="apps-menu" role="region" aria-label="All apps">
      <div className="am-groups" role="tablist" aria-orientation="vertical" aria-label="Groups">
        {groups.map((x) => (
          <button
            key={x.key} type="button" role="tab" id={`am-t-${x.key}`} aria-selected={x.key === sel} aria-controls="am-panel" data-g={x.key}
            className={`am-g${x.key === sel ? ' sel gtone' : ''}`} onMouseEnter={() => setSel(x.key)} onFocus={() => setSel(x.key)} onClick={() => setSel(x.key)}
          >
            <i className="sq" aria-hidden /><span>{x.name}</span><small className="tx">{x.apps.length}</small>
          </button>
        ))}
      </div>
      <div className="am-apps" id="am-panel" role="tabpanel" aria-labelledby={`am-t-${g.key}`} data-g={g.key}>
        <div className="am-head"><h2 className="d">{g.name}</h2><Link className="am-all tx" href={`/${g.slug}`} onClick={onClose}>See this group on its own page</Link></div>
        <ul>
          {g.apps.map((a) => (
            <li key={a.slug}>
              <Link href={a.href} className={`am-a${a.slug === currentSlug ? ' cur' : ''}`} aria-current={a.slug === currentSlug ? 'page' : undefined} onClick={onClose}>
                <span className="ic"><AppIcon slug={a.slug} size={34} still /></span>
                <span className="am-t"><b>{a.title}</b><small className="tx">{a.tagline}</small></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
