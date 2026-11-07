'use client';
import { useEffect, useMemo, useState } from 'react';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';

interface Task { id: number; title: string; subject: string; due: string; done: boolean }
interface Part { id: number; name: string; weight: number; score: number | null }
interface Mod { id: number; name: string; target: number; parts: Part[] }

const left = (due: string, now: number) => { const ms = new Date(due).getTime() - now, d = Math.floor(Math.abs(ms) / 864e5), h = Math.floor((Math.abs(ms) % 864e5) / 36e5), m = Math.floor((Math.abs(ms) % 36e5) / 6e4); const t = d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`; return { ms, text: ms < 0 ? `${t} late` : `${t} left`, tone: ms < 0 ? 'late' : ms < 864e5 ? 'soon' : ms < 3 * 864e5 ? 'near' : 'ok' }; };
const grade = (p: number) => (p >= 70 ? '1st' : p >= 60 ? '2:1' : p >= 50 ? '2:2' : p >= 40 ? '3rd' : 'Fail');

export default function View() {
  const [tab, setTab] = useState<'deadlines' | 'grades'>('deadlines');
  const [tasks, setTasks] = useLocalState<Task[]>('student-deadline-grade-planner', 'tasks', []);
  const [mods, setMods] = useLocalState<Mod[]>('student-deadline-grade-planner', 'modules', []);
  const [now, setNow] = useState(0);
  const [t, setT] = useState({ title: '', subject: '', due: '' }), [mn, setMn] = useState('');
  useEffect(() => { setNow(Date.now()); const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);
  const sorted = useMemo(() => [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || new Date(a.due).getTime() - new Date(b.due).getTime()), [tasks]);
  const mod = (id: number, f: (m: Mod) => Mod) => setMods((p) => p.map((m) => (m.id === id ? f(m) : m)));

  return (
    <div className="panel">
      <Seg value={tab} onChange={setTab} label="Section" options={[{ value: 'deadlines', label: 'Deadlines' }, { value: 'grades', label: 'Grades' }]} />
      {tab === 'deadlines' ? (
        <>
          <form className="row" onSubmit={(e) => { e.preventDefault(); if (!t.title.trim() || !t.due) return; setTasks([...tasks, { id: Date.now(), title: t.title.trim(), subject: t.subject.trim(), due: t.due, done: false }]); setT({ title: '', subject: '', due: t.due }); }}>
            <div className="field" style={{ flex: 2, minWidth: 200 }}><label htmlFor="dg-t">Coursework</label><input id="dg-t" type="text" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="Essay draft" /></div>
            <div className="field" style={{ flex: 1, minWidth: 140 }}><label htmlFor="dg-s">Subject</label><input id="dg-s" type="text" value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} placeholder="History" /></div>
            <div className="field"><label htmlFor="dg-d">Due</label><input id="dg-d" type="datetime-local" className="datef" value={t.due} onChange={(e) => setT({ ...t, due: e.target.value })} /></div>
            <button type="submit" className="btn primary">Add</button>
          </form>
          {sorted.length === 0 ? <div className="empty">Nothing due. Add your first piece of coursework.</div> : (
            <ul className="dg-list">
              {sorted.map((k) => { const c = left(k.due, now || Date.now()); return (
                <li key={k.id} className={`${k.done ? 'done' : c.tone}`}>
                  <button type="button" className="hh-check" aria-pressed={k.done} aria-label={`${k.title}: ${k.done ? 'done' : 'not done'}`} onClick={() => setTasks(tasks.map((x) => (x.id === k.id ? { ...x, done: !x.done } : x)))}>{k.done ? '✓' : ''}</button>
                  <div><b>{k.title}</b><small>{k.subject ? `${k.subject} · ` : ''}{new Date(k.due).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
                  <span className="stat">{k.done ? 'Done' : c.text}</span>
                  <button type="button" className="btn small" aria-label={`Delete ${k.title}`} onClick={() => setTasks(tasks.filter((x) => x.id !== k.id))}>✕</button>
                </li>); })}
            </ul>
          )}
          {tasks.some((k) => k.done) && <div className="tool-actions"><button type="button" className="btn small" onClick={() => setTasks(tasks.filter((k) => !k.done))}>Clear finished</button></div>}
        </>
      ) : (
        <>
          <form className="tool-actions" onSubmit={(e) => { e.preventDefault(); if (!mn.trim()) return; setMods([...mods, { id: Date.now(), name: mn.trim(), target: 70, parts: [{ id: 1, name: 'Coursework', weight: 40, score: null }, { id: 2, name: 'Exam', weight: 60, score: null }] }]); setMn(''); }}>
            <div className="field" style={{ flex: 1, minWidth: 220 }}><label htmlFor="dg-m">Module or subject</label><input id="dg-m" type="text" value={mn} onChange={(e) => setMn(e.target.value)} placeholder="Chemistry" /></div>
            <button type="submit" className="btn primary" style={{ alignSelf: 'flex-end' }}>Add</button>
          </form>
          {mods.length === 0 && <div className="empty">Add a subject, then put in what each part is worth.</div>}
          {mods.map((m) => {
            const done = m.parts.filter((p) => p.score != null), wDone = done.reduce((n, p) => n + p.weight, 0), wAll = m.parts.reduce((n, p) => n + p.weight, 0), earned = done.reduce((n, p) => n + (p.weight * (p.score as number)) / 100, 0);
            const avg = wDone ? (earned / wDone) * 100 : null, remain = wAll - wDone, need = remain > 0 ? ((m.target - earned) / remain) * 100 : null;
            return (
              <div key={m.id} className="dg-mod">
                <div className="tool-actions"><h3 className="d">{m.name}</h3><span className="stat">{wAll}% planned</span><button type="button" className="btn small" aria-label={`Delete ${m.name}`} onClick={() => setMods(mods.filter((x) => x.id !== m.id))}>✕</button></div>
                {m.parts.map((p) => (
                  <div key={p.id} className="dg-part">
                    <input type="text" aria-label="Part name" value={p.name} onChange={(e) => mod(m.id, (x) => ({ ...x, parts: x.parts.map((q) => (q.id === p.id ? { ...q, name: e.target.value } : q)) }))} />
                    <label>Worth <input type="number" min={0} max={100} value={p.weight} onChange={(e) => mod(m.id, (x) => ({ ...x, parts: x.parts.map((q) => (q.id === p.id ? { ...q, weight: Math.max(0, +e.target.value) } : q)) }))} />%</label>
                    <label>Got <input type="number" min={0} max={100} placeholder="–" value={p.score ?? ''} onChange={(e) => mod(m.id, (x) => ({ ...x, parts: x.parts.map((q) => (q.id === p.id ? { ...q, score: e.target.value === '' ? null : Math.min(100, Math.max(0, +e.target.value)) } : q)) }))} />%</label>
                    <button type="button" className="btn small" aria-label={`Remove ${p.name}`} onClick={() => mod(m.id, (x) => ({ ...x, parts: x.parts.filter((q) => q.id !== p.id) }))}>✕</button>
                  </div>))}
                <div className="tool-actions">
                  <button type="button" className="btn small" onClick={() => mod(m.id, (x) => ({ ...x, parts: [...x.parts, { id: Date.now(), name: 'New part', weight: 0, score: null }] }))}>Add a part</button>
                  <label className="mt-step">Aim for <input type="number" min={0} max={100} value={m.target} onChange={(e) => mod(m.id, (x) => ({ ...x, target: Math.min(100, Math.max(0, +e.target.value)) }))} style={{ width: 70 }} />%</label>
                </div>
                <div className="dg-res">
                  <span className="stat">{avg == null ? 'No marks yet' : `So far ${avg.toFixed(1)}% (${grade(avg)})`}</span>
                  {need != null && <span className={`stat ${need > 100 ? 'bad' : ''}`} style={{ background: need > 100 ? 'var(--danger)' : need <= 0 ? 'var(--g1)' : undefined }}>{need <= 0 ? `You have already reached ${m.target}%` : need > 100 ? `${m.target}% is out of reach (needs ${need.toFixed(0)}%)` : `You need ${need.toFixed(1)}% on the other ${remain}%`}</span>}
                  {avg != null && remain <= 0 && <span className="stat">Final {earned.toFixed(1)}% ({grade(earned)})</span>}
                </div>
              </div>);
          })}
        </>
      )}
    </div>
  );
}
