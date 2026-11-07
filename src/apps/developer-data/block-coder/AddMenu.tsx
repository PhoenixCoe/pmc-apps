'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFS, GROUPS, type Def, type Group } from './graph';

/** How well a block matches what was typed. 0 means it does not match at all. Every word typed has to be found somewhere. */
function score(d: Def, words: string[]): number {
  const name = d.name.toLowerCase(), blurb = d.blurb.toLowerCase(), kind = d.kind.toLowerCase();
  let total = 0;
  for (const w of words) {
    const s = name.startsWith(w) ? 100 : name.split(/\s+/).some((x) => x.startsWith(w)) ? 80 : name.includes(w) ? 60 : kind.includes(w) ? 40 : blurb.includes(w) ? 20 : 0;
    if (!s) return 0;
    total += s;
  }
  return total;
}

interface Props {
  onPick: (kind: string) => void;
  onClose: () => void;
  /** Only blocks that pass are offered (the ones that can be joined to a wire you let go of). */
  allow?: (d: Def) => boolean;
  /** A line above the search saying why the list is short. */
  heading?: string;
  recent: string[];
}

/**
 * The list of blocks you can add: a search box that finds blocks by name or by what they do, a row of group buttons with counts,
 * the blocks you used last, and the whole catalogue grouped below. Up and Down move through it and Enter adds the one that is lit.
 */
export function AddMenu({ onPick, onClose, allow, heading, recent }: Props) {
  const [query, setQuery] = useState('');
  const [only, setOnly] = useState<Group | null>(null);
  const [at, setAt] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLInputElement>(null);
  // The press that opened this menu can pull focus away again as it finishes, so ask for focus once that has settled too.
  useEffect(() => { box.current?.focus(); const t = setTimeout(() => box.current?.focus(), 60); return () => clearTimeout(t); }, []);

  const usable = useMemo(() => (allow ? DEFS.filter(allow) : DEFS), [allow]);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const found = useMemo(() => {
    const base = only ? usable.filter((d) => d.group === only) : usable;
    if (!words.length) return base;
    return base.map((d) => [d, score(d, words)] as const).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([d]) => d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usable, only, query]);
  const counts = useMemo(() => { const c: Partial<Record<Group, number>> = {}; usable.forEach((d) => { c[d.group] = (c[d.group] ?? 0) + 1; }); return c; }, [usable]);

  // The order you see is the order the arrow keys walk through: when searching, best match first; otherwise group by group.
  const shown = useMemo(() => {
    if (words.length) return found;
    const r = !only ? recent.map((k) => usable.find((d) => d.kind === k)).filter((d): d is Def => !!d).slice(0, 6) : [];
    return [...r, ...GROUPS.flatMap((g) => found.filter((d) => d.group === g.id))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found, recent, usable, only, query]);
  useEffect(() => { setAt(0); }, [query, only]);
  useEffect(() => { list.current?.querySelector<HTMLElement>('[data-on="true"]')?.scrollIntoView({ block: 'nearest' }); }, [at]);

  const nRecent = !words.length && !only ? shown.length - found.length : 0;
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setAt((i) => Math.min(shown.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAt((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[at]) onPick(shown[at].kind); }
  };

  const row = (d: Def, i: number) => (
    <button key={`${i}:${d.kind}`} type="button" role="menuitem" data-on={i === at} className={i === at ? 'on' : ''} onMouseEnter={() => setAt(i)} onClick={() => onPick(d.kind)}>
      <i className={`ng-dot g-${d.group}`} aria-hidden /><b className="d">{d.name}</b><span className="tx">{d.blurb}</span>
    </button>
  );

  return (
    <div className="ng-menu add" role="menu" data-nowheel onKeyDown={key}>
      <div className="ng-menu-search">
        {heading && <p className="ng-menu-why tx">{heading}</p>}
        <input ref={box} type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${usable.length} blocks`} aria-label="Search blocks" spellCheck={false} />
      </div>
      <div className="ng-menu-body">
        <div className="ng-rail" role="group" aria-label="Show one group">
          <button type="button" className={only === null ? 'on' : ''} aria-pressed={only === null} onClick={() => setOnly(null)}><span>All</span><small>{usable.length}</small></button>
          {GROUPS.filter((g) => counts[g.id]).map((g) => (
            <button key={g.id} type="button" className={only === g.id ? 'on' : ''} aria-pressed={only === g.id} onClick={() => setOnly(only === g.id ? null : g.id)}>
              <i className={`ng-dot g-${g.id}`} aria-hidden /><span>{g.name}</span><small>{counts[g.id]}</small>
            </button>
          ))}
        </div>
      <div ref={list} className="ng-menu-list">
        {words.length > 0 && found.map((d, i) => row(d, i))}
        {!words.length && nRecent > 0 && (
          <div className="ng-menu-grp"><h3 className="d">Used last<small className="tx">{nRecent}</small></h3>{shown.slice(0, nRecent).map((d, i) => row(d, i))}</div>
        )}
        {!words.length && (() => {
          let i = nRecent;
          return GROUPS.map((g) => {
            const l = found.filter((d) => d.group === g.id); if (!l.length) return null;
            return (
              <div key={g.id} className="ng-menu-grp">
                <h3 className="d"><i className={`ng-dot g-${g.id}`} />{g.name}<small className="tx">{g.blurb}</small></h3>
                {l.map((d) => row(d, i++))}
              </div>
            );
          });
        })()}
        {!found.length && <p className="ng-menu-none tx">No block matches “{query}”. Try a shorter word, like “text” or “random”.</p>}
      </div>
      </div>
    </div>
  );
}
