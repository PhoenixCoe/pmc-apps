'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { GroupKey } from '@/lib/types';
import { useApps } from './AppsContext';
import { AppIcon } from './icons';

/** The phone menu: the groups as a list, one open at a time, then the few other pages. */
export function MobileMenu({ currentKey, currentSlug, onClose, accountLink }: { currentKey?: GroupKey; currentSlug?: string; onClose: () => void; accountLink: React.ReactNode }) {
  const { groups } = useApps();
  const [open, setOpen] = useState<GroupKey | null>(currentKey ?? null);
  return (
    <nav className="mm" id="mobile-menu" aria-label="Apps">
      {groups.map((g) => {
        const isOpen = open === g.key;
        return (
          <div key={g.key} data-g={g.key} className={`mm-g${isOpen ? ' open' : ''}`}>
            <button type="button" className="mm-h" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : g.key)}>
              <i className="sq" aria-hidden /><span>{g.name}</span><small className="tx">{g.apps.length}</small><i className="chev" aria-hidden />
            </button>
            {isOpen && (
              <ul className="mm-l">
                {g.apps.map((a) => (
                  <li key={a.slug}>
                    <Link href={a.href} aria-current={a.slug === currentSlug ? 'page' : undefined} onClick={onClose}>
                      <span className="ic"><AppIcon slug={a.slug} size={34} still /></span><b>{a.title}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <div className="mm-x">
        <Link href="/suggest" onClick={onClose}>Suggest an app</Link>
        <Link href="/settings" onClick={onClose}>Settings</Link>
        {accountLink}
      </div>
    </nav>
  );
}
