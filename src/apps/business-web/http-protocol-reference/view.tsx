'use client';
import { useMemo, useState } from 'react';
import { Seg } from '@/components/shared/Segmented';
import { CopyButton } from '@/components/shared/CopyButton';
import { HEADERS, METHODS, STATUS } from './data';

type Tab = 'status' | 'methods' | 'headers';
const GROUPS: [string, string, string][] = [['all', 'All', ''], ['1', '1xx · Info', 'tone-cream'], ['2', '2xx · Worked', 'tone-green'], ['3', '3xx · Moved', 'tone-gold'], ['4', '4xx · Your side', 'tone-ink'], ['5', '5xx · Server side', 'tone-ink']];

export default function View() {
  const [tab, setTab] = useState<Tab>('status'), [q, setQ] = useState(''), [g, setG] = useState('all');
  const n = q.trim().toLowerCase();
  const list = useMemo(() => STATUS.filter((s) => (g === 'all' || String(s.code)[0] === g) && (!n || `${s.code} ${s.name} ${s.what} ${s.fix ?? ''}`.toLowerCase().includes(n))), [n, g]);
  return (
    <div className="panel">
      <Seg<Tab> value={tab} onChange={(t) => { setTab(t); setQ(''); }} label="Section" options={[{ value: 'status', label: 'Status codes' }, { value: 'methods', label: 'Methods' }, { value: 'headers', label: 'Headers' }]} />
      <div className="field"><label htmlFor="hp-q">Search</label><input id="hp-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 'status' ? 'A number or a word, such as 404 or timeout' : 'Type to search'} /></div>
      {tab === 'status' && <>
        <div className="tool-actions" role="group" aria-label="Group">{GROUPS.map(([v, l]) => <button key={v} type="button" className={`chip${g === v ? ' on' : ''}`} aria-pressed={g === v} onClick={() => setG(v)}>{l}</button>)}</div>
        {list.length === 0 && <p className="empty">No match. Try a different word.</p>}
        <ul className="hp-list">{list.map((s) => <li key={s.code} className={`hp-s hp-${String(s.code)[0]}`}><span className="hp-code">{s.code}</span><div><b>{s.name}</b><p>{s.what}</p>{s.fix && <p className="hp-fix"><strong>What to do:</strong> {s.fix}</p>}</div><CopyButton text={`${s.code} ${s.name}`} label="Copy" /></li>)}</ul>
      </>}
      {tab === 'methods' && <ul className="hp-list">{METHODS.filter(([m, a, b]) => !n || `${m} ${a} ${b}`.toLowerCase().includes(n)).map(([m, a, b]) => <li key={m} className="hp-s"><span className="hp-code hp-m">{m}</span><div><b>{a}</b><p>{b}</p></div><CopyButton text={m} label="Copy" /></li>)}</ul>}
      {tab === 'headers' && <ul className="hp-list">{HEADERS.filter(([h, d]) => !n || `${h} ${d}`.toLowerCase().includes(n)).map(([h, d]) => <li key={h} className="hp-s"><div><b className="code">{h}</b><p>{d}</p></div><CopyButton text={h} label="Copy" /></li>)}</ul>}
    </div>
  );
}
