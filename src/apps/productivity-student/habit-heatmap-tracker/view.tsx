'use client';
import { useMemo, useState } from 'react';
import { downloadText } from '@/components/shared/CopyButton';
import { readText } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';

interface Habit { id: number; name: string; days: string[] }
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function streaks(days: Set<string>) {
  let cur = 0; const d = new Date(); if (!days.has(key(d))) d.setDate(d.getDate() - 1);
  while (days.has(key(d))) { cur++; d.setDate(d.getDate() - 1); }
  const sorted = [...days].sort(); let best = 0, run = 0, prev = 0;
  for (const s of sorted) { const t = Date.parse(s + 'T12:00:00Z'); run = prev && t - prev === 864e5 ? run + 1 : 1; prev = t; best = Math.max(best, run); }
  return { cur, best };
}

export default function View() {
  const [habits, setHabits] = useLocalState<Habit[]>('habit-heatmap-tracker', 'habits', []);
  const [sel, setSel] = useState<number | 'all'>('all');
  const [name, setName] = useState(''), [year, setYear] = useState(new Date().getFullYear()), [msg, setMsg] = useState('');
  const todayK = key(new Date());

  const cells = useMemo(() => {
    const first = new Date(year, 0, 1), start = new Date(first); start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const weeks: { k: string; inYear: boolean; n: number }[][] = [], active = sel === 'all' ? habits : habits.filter((h) => h.id === sel);
    const sets = active.map((h) => new Set(h.days));
    for (let w = 0; w < 54; w++) { const col = []; for (let d = 0; d < 7; d++) { const x = new Date(start); x.setDate(start.getDate() + w * 7 + d); const k = key(x); col.push({ k, inYear: x.getFullYear() === year, n: sets.filter((s) => s.has(k)).length }); } weeks.push(col); }
    return { weeks, total: Math.max(1, active.length) };
  }, [habits, sel, year]);

  const shown = sel === 'all' ? null : habits.find((h) => h.id === sel);
  const allDays = useMemo(() => new Set(habits.flatMap((h) => h.days)), [habits]);
  const st = streaks(shown ? new Set(shown.days) : allDays);
  const count = (shown ? shown.days : [...allDays]).filter((d) => d.startsWith(String(year))).length;
  const toggle = (h: Habit, k: string) => setHabits((p) => p.map((x) => (x.id === h.id ? { ...x, days: x.days.includes(k) ? x.days.filter((d) => d !== k) : [...x.days, k] } : x)));
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / cells.total) * 4)));

  const importFile = async (f: File[]) => { try { const j = JSON.parse(await readText(f[0])); if (!Array.isArray(j.habits)) throw 0; setHabits(j.habits.map((h: Habit, i: number) => ({ id: Date.now() + i, name: String(h.name), days: (h.days ?? []).filter((d: unknown) => typeof d === 'string') }))); setMsg('Backup loaded.'); } catch { setMsg('That file is not a habit backup.'); } };

  return (
    <div className="panel">
      <form className="tool-actions" onSubmit={(e) => { e.preventDefault(); const n = name.trim(); if (!n) return; setHabits([...habits, { id: Date.now(), name: n, days: [] }]); setName(''); }}>
        <div className="field" style={{ flex: 1, minWidth: 220 }}><label htmlFor="hh-n">New habit</label><input id="hh-n" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Read for 20 minutes" /></div>
        <button type="submit" className="btn primary" style={{ alignSelf: 'flex-end' }}>Add</button>
      </form>
      {habits.length === 0 ? <div className="empty">Add a habit to start filling in your year.</div> : (
        <>
          <ul className="hh-today">
            {habits.map((h) => { const done = h.days.includes(todayK), s = streaks(new Set(h.days)); return (
              <li key={h.id} className={done ? 'done' : ''}>
                <button type="button" className="hh-check" aria-pressed={done} aria-label={`${h.name}: ${done ? 'done today' : 'not done today'}`} onClick={() => toggle(h, todayK)}>{done ? '✓' : ''}</button>
                <button type="button" className="hh-name" onClick={() => setSel(h.id)} aria-pressed={sel === h.id}><b>{h.name}</b><small>{s.cur} day streak</small></button>
                <button type="button" className="btn small" aria-label={`Delete ${h.name}`} onClick={() => { if (confirm(`Delete “${h.name}” and its history?`)) { setHabits(habits.filter((x) => x.id !== h.id)); if (sel === h.id) setSel('all'); } }}>✕</button>
              </li>); })}
          </ul>
          <div className="tool-actions">
            <button type="button" className="btn small" aria-pressed={sel === 'all'} onClick={() => setSel('all')}>All habits</button>
            <button type="button" className="btn small" onClick={() => setYear(year - 1)} aria-label="Previous year">◀</button><b className="d" style={{ fontSize: '1.6rem' }}>{year}</b><button type="button" className="btn small" onClick={() => setYear(year + 1)} disabled={year >= new Date().getFullYear()} aria-label="Next year">▶</button>
            <span className="stat">{shown ? shown.name : 'All habits'}</span><span className="stat">{count} days</span><span className="stat">Streak {st.cur}</span><span className="stat">Best {st.best}</span>
          </div>
          <div className="hh-scroll"><div className="hh-grid" role="grid" aria-label={`Activity in ${year}`}>
            <div className="hh-months">{cells.weeks.map((w, i) => { const f = w.find((c) => c.inYear && c.k.endsWith('-01')); return <span key={i}>{f ? MONTHS[+f.k.slice(5, 7) - 1] : ''}</span>; })}</div>
            <div className="hh-cols">{cells.weeks.map((w, i) => <div key={i}>{w.map((c) => <button key={c.k} type="button" className={`hh-c l${c.inYear ? level(c.n) : 0}${!c.inYear ? ' out' : ''}${c.k === todayK ? ' today' : ''}`} disabled={!c.inYear || !shown} title={`${c.k}${shown ? '' : ` · ${c.n} of ${habits.length}`}`} aria-label={`${c.k}: ${c.n ? 'done' : 'not done'}`} onClick={() => shown && toggle(shown, c.k)} />)}</div>)}</div>
          </div></div>
          {!shown && <p className="hintx">Choose one habit to click days and fill them in.</p>}
        </>
      )}
      <div className="tool-actions">
        <button type="button" className="btn" disabled={!habits.length} onClick={() => downloadText('habits-backup.json', JSON.stringify({ app: 'habit-heatmap-tracker', habits }, null, 2), 'application/json')}>Save a backup</button>
        <label className="btn" style={{ cursor: 'pointer' }}>Load a backup<input type="file" accept=".json" hidden onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ''; if (f.length) importFile(f); }} /></label>
        {msg && <span role="status">{msg}</span>}
      </div>
    </div>
  );
}
