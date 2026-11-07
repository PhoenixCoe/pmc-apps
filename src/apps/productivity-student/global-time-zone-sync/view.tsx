'use client';
import { useEffect, useMemo, useState } from 'react';
import { CopyButton } from '@/components/shared/CopyButton';
import { useLocalState } from '@/lib/useLocalState';
import { CITIES, cityOf, gmtLabel, instant, partsAt } from './cities';

const pad = (n: number) => String(n).padStart(2, '0');
const kind = (h: number, from: number, to: number) => (h >= from && h < to ? 'work' : h >= 7 && h < 22 ? 'awake' : 'night');

export default function View() {
  const [zones, setZones] = useLocalState<string[]>('global-time-zone-sync', 'zones', []);
  const [day, setDay] = useLocalState('global-time-zone-sync', 'day', '');
  const [hour, setHour] = useLocalState('global-time-zone-sync', 'hour', 10);
  const [from, setFrom] = useLocalState('global-time-zone-sync', 'from', 9);
  const [to, setTo] = useLocalState('global-time-zone-sync', 'to', 17);
  const [q, setQ] = useState(''), [mine, setMine] = useState('UTC'), [mounted, setMounted] = useState(false);

  useEffect(() => {
    const z = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; setMine(z); setMounted(true);
    setZones((p) => (p.length ? p : [z, 'America/New_York', 'Asia/Tokyo'].filter((v, i, a) => a.indexOf(v) === i)));
    setDay((d) => d || new Date().toISOString().slice(0, 10));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const base = zones[0] ?? mine, [y, mo, d] = (day || new Date().toISOString().slice(0, 10)).split('-').map(Number);
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const at = (h: number) => instant(base, y, mo, d, h);
  const grid = useMemo(() => zones.map((z) => hours.map((h) => { const p = partsAt(z, at(h)); return { h: p.h, mi: p.mi, d: p.d, wd: p.wd }; })), [zones, day]); // eslint-disable-line react-hooks/exhaustive-deps
  const good = hours.filter((h) => zones.length && grid.every((row) => row[h].h >= from && row[h].h < to));
  const near = hours.filter((h) => zones.length && grid.every((row) => row[h].h >= 7 && row[h].h < 22));
  const suggest = useMemo(() => (q.trim() ? CITIES.filter(([n, z, c]) => !zones.includes(z) && (n + c).toLowerCase().includes(q.toLowerCase())).slice(0, 7) : []), [q, zones]);
  const summary = zones.map((z, i) => { const p = grid[i]?.[hour]; return p ? `${pad(p.h)}:${pad(p.mi)} ${cityOf(z)}${p.d !== grid[0][hour].d ? ' (next/previous day)' : ''}` : ''; }).join('\n');
  if (!mounted) return <div className="panel"><div className="empty">Loading…</div></div>;

  return (
    <div className="panel">
      <div className="row">
        <div className="field" style={{ position: 'relative', minWidth: 260 }}>
          <label htmlFor="tz-q">Add a city</label>
          <input id="tz-q" type="search" value={q} placeholder="Type a city or country" onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          {suggest.length > 0 && <ul className="tz-sug">{suggest.map(([n, z, c]) => <li key={z}><button type="button" onClick={() => { if (zones.length < 10) setZones([...zones, z]); setQ(''); }}>{n}<small>{c}</small></button></li>)}</ul>}
        </div>
        <div className="field"><label htmlFor="tz-d">Day</label><input id="tz-d" type="date" value={day} onChange={(e) => setDay(e.target.value)} style={{ border: '3px solid var(--ink)', padding: '10px 12px', background: 'var(--paper)', font: 'inherit' }} /></div>
        <div className="field"><label htmlFor="tz-a">Work day starts</label><input id="tz-a" type="number" min={0} max={23} value={from} onChange={(e) => setFrom(Math.min(to - 1, Math.max(0, +e.target.value)))} style={{ width: 90 }} /></div>
        <div className="field"><label htmlFor="tz-b">Work day ends</label><input id="tz-b" type="number" min={1} max={24} value={to} onChange={(e) => setTo(Math.max(from + 1, Math.min(24, +e.target.value)))} style={{ width: 90 }} /></div>
      </div>

      <div className="tz-table" role="table" aria-label="Times in each city">
        <div className="tz-head" role="row"><span /><div className="tz-cells">{hours.map((h) => <button key={h} type="button" className={`tz-h${h === hour ? ' on' : ''}${good.includes(h) ? ' good' : ''}`} onClick={() => setHour(h)} aria-label={`${pad(h)}:00 in ${cityOf(base)}`} aria-pressed={h === hour}>{pad(h)}</button>)}</div></div>
        {zones.map((z, i) => (
          <div className="tz-row" role="row" key={z}>
            <div className="tz-name"><b className="d">{cityOf(z)}</b><small>{gmtLabel(z, at(hour))}{i === 0 ? ' · your first city' : ''}</small>
              <span><button type="button" className="btn small" aria-label={`Make ${cityOf(z)} the first city`} disabled={i === 0} onClick={() => setZones([z, ...zones.filter((x) => x !== z)])}>Top</button><button type="button" className="btn small" aria-label={`Remove ${cityOf(z)}`} onClick={() => setZones(zones.filter((x) => x !== z))}>✕</button></span></div>
            <div className="tz-cells">{hours.map((h) => { const c = grid[i]?.[h]; if (!c) return <span key={h} />; return <button key={h} type="button" onClick={() => setHour(h)} className={`tz-c ${kind(c.h, from, to)}${h === hour ? ' on' : ''}`} tabIndex={-1} aria-hidden title={`${pad(c.h)}:${pad(c.mi)}`}><b>{pad(c.h)}</b>{(c.h === 0 || h === 0) && <i>{c.wd}</i>}</button>; })}</div>
          </div>
        ))}
      </div>
      <div className="tool-actions"><span className="tz-key"><i className="work" />Work hours</span><span className="tz-key"><i className="awake" />Awake</span><span className="tz-key"><i className="night" />Night</span></div>

      {zones.length > 1 && <p className={good.length ? 'ok' : 'note'}>{good.length ? `Everyone is at work at ${good.map((h) => `${pad(h)}:00`).join(', ')} in ${cityOf(base)}.` : near.length ? `No shared work hours. Everyone is awake at ${near.map((h) => `${pad(h)}:00`).join(', ')} in ${cityOf(base)}.` : 'No hour suits everyone.'}</p>}
      <div className="result"><div className="result-top"><span>At {pad(hour)}:00 in {cityOf(base)}</span><CopyButton text={summary} /></div><pre className="code">{summary}</pre></div>
    </div>
  );
}
