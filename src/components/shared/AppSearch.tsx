'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { AppEntry } from '@/registry';
import { useApps } from './AppsContext';
import { AppIcon } from './icons';
import { UiIcon } from './icons';

/** Score an entry against the words typed: title starts-with beats title contains beats anywhere else. */
export function searchApps(index: AppEntry[], q: string, limit = 8): AppEntry[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return index
    .map((e) => {
      if (!terms.every((t) => e.haystack.includes(t))) return null;
      const t = e.title.toLowerCase();
      return { e, score: terms.reduce((s, term) => s + (t.startsWith(term) ? 3 : t.includes(term) ? 2 : 1), 0) };
    })
    .filter((x): x is { e: AppEntry; score: number } => x !== null)
    .sort((a, b) => b.score - a.score || a.e.title.localeCompare(b.e.title))
    .slice(0, limit)
    .map((x) => x.e);
}

/**
 * One search box for the whole site. Type and the matches drop down right under it: icon, name, what it does, and a
 * coloured tag for its group. Up and down move, Enter opens, Escape clears. Press / or Ctrl K anywhere to jump into it.
 */
export function AppSearch({ variant, onDone, autoFocus = false }: { variant: 'hero' | 'bar'; onDone?: () => void; autoFocus?: boolean }) {
  const { index } = useApps();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const results = useMemo(() => searchApps(index, q), [index, q]);
  const showing = open && q.trim().length > 0;

  useEffect(() => setSel(0), [q]);
  useEffect(() => { if (autoFocus) input.current?.focus(); }, [autoFocus]);
  useEffect(() => {
    const away = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, []);

  const go = (href: string) => { setOpen(false); setQ(''); input.current?.blur(); onDone?.(); router.push(href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setSel((s) => Math.min(s + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' && showing && results[sel]) { e.preventDefault(); go(results[sel].href); }
    else if (e.key === 'Escape') { if (q) setQ(''); else { setOpen(false); input.current?.blur(); onDone?.(); } }
  };

  return (
    <div className={`as as-${variant}`} ref={root} role="search">
      <label className="as-box">
        <UiIcon name="search" size={variant === 'hero' ? 24 : 18} />
        <input
          ref={input} data-appsearch="" type="search" value={q} autoComplete="off" spellCheck={false}
          placeholder={`Search ${index.length} apps`} aria-label="Search apps"
          role="combobox" aria-expanded={showing && results.length > 0} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={showing && results[sel] ? `${listId}-${sel}` : undefined}
          onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onKeyDown={onKey}
        />
        <kbd aria-hidden>/</kbd>
      </label>
      {showing && (
        <div className="as-drop">
          {results.length ? (
            <ul id={listId} role="listbox" aria-label="Matching apps">
              {results.map((r, i) => (
                <li key={r.href} id={`${listId}-${i}`} role="option" aria-selected={i === sel}>
                  <Link href={r.href} className={`as-row${i === sel ? ' cur' : ''}`} data-g={r.key} onMouseEnter={() => setSel(i)} onClick={(e) => { e.preventDefault(); go(r.href); }}>
                    <span className="ic"><AppIcon slug={r.slug} size={40} still /></span>
                    <span className="as-t"><b>{r.title}</b><small className="tx">{r.tagline}</small></span>
                    <em className="as-chip gtone">{r.short}</em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="as-none tx">Nothing matches &ldquo;{q}&rdquo;. Try a shorter word.</p>
          )}
          <div className="as-hint tx" aria-hidden><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> clear</span></div>
        </div>
      )}
    </div>
  );
}
