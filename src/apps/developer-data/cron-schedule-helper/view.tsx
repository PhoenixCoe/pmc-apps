'use client';
import { useEffect, useMemo, useState } from 'react';
import { CopyButton } from '@/components/shared/CopyButton';
import { Select } from '@/components/shared/Select';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { describe, FIELD_LABELS, nextRuns, parse } from './cron';

type Freq = 'minute' | 'everyn' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
interface B { freq: Freq; n: number; minute: number; hour: number; days: number[]; dom: number; month: number }
const DEFB: B = { freq: 'daily', n: 15, minute: 0, hour: 9, days: [1, 2, 3, 4, 5], dom: 1, month: 1 };
const DAYN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MONN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const build = (b: B) => b.freq === 'minute' ? '* * * * *' : b.freq === 'everyn' ? `*/${b.n} * * * *` : b.freq === 'hourly' ? `${b.minute} * * * *` : b.freq === 'daily' ? `${b.minute} ${b.hour} * * *` : b.freq === 'weekly' ? `${b.minute} ${b.hour} * * ${[...b.days].sort().join(',') || '*'}` : b.freq === 'monthly' ? `${b.minute} ${b.hour} ${b.dom} * *` : `${b.minute} ${b.hour} ${b.dom} ${b.month} *`;
const PRESETS: [string, string][] = [['Every minute', '* * * * *'], ['Every 5 minutes', '*/5 * * * *'], ['Every hour', '0 * * * *'], ['Every day at midnight', '0 0 * * *'], ['Weekdays at 9', '0 9 * * 1-5'], ['Every Monday at 8', '0 8 * * 1'], ['First of the month', '0 0 1 * *']];

export default function View() {
  const [mode, setMode] = useLocalState<'easy' | 'expr'>('cron-schedule-helper', 'mode', 'easy');
  const [b, setB] = useLocalState<B>('cron-schedule-helper', 'builder', DEFB);
  const [expr, setExpr] = useLocalState('cron-schedule-helper', 'expression', '0 9 * * 1-5');
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const set = <K extends keyof B>(k: K, v: B[K]) => { const nb = { ...b, [k]: v }; setB(nb); setExpr(build(nb)); };
  const p = useMemo(() => parse(expr), [expr]);
  const runs = useMemo(() => (typeof p === 'string' || !now ? [] : nextRuns(p, now, 10)), [p, now]);
  const parts = expr.trim().split(/\s+/);
  const setPart = (i: number, v: string) => { const a = [...parts, '*', '*', '*', '*', '*'].slice(0, 5); a[i] = v.trim() || '*'; setExpr(a.join(' ')); };
  const hours = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: `${String(i).padStart(2, '0')}:00` }));
  const num = (k: keyof B, label: string, min: number, max: number) => <div className="field"><label htmlFor={`cr-${k}`}>{label}</label><input id={`cr-${k}`} type="number" min={min} max={max} value={b[k] as number} onChange={(e) => set(k, Math.min(max, Math.max(min, +e.target.value || 0)) as never)} style={{ width: 90 }} /></div>;
  return (
    <div className="panel">
      <Seg<'easy' | 'expr'> value={mode} onChange={setMode} label="How to build it" options={[{ value: 'easy', label: 'Pick from a list' }, { value: 'expr', label: 'Write the code' }]} />
      {mode === 'easy' ? (
        <div className="row">
          <div className="field"><label htmlFor="cr-f">Run</label><Select id="cr-f" value={b.freq} onChange={(v) => set('freq', v)} options={[{ value: 'minute', label: 'Every minute' }, { value: 'everyn', label: 'Every few minutes' }, { value: 'hourly', label: 'Every hour' }, { value: 'daily', label: 'Every day' }, { value: 'weekly', label: 'On chosen days of the week' }, { value: 'monthly', label: 'Once a month' }, { value: 'yearly', label: 'Once a year' }]} /></div>
          {b.freq === 'everyn' && num('n', 'Every how many minutes', 1, 59)}
          {b.freq === 'hourly' && num('minute', 'At minute', 0, 59)}
          {['daily', 'weekly', 'monthly', 'yearly'].includes(b.freq) && <><div className="field"><label htmlFor="cr-h">At</label><Select id="cr-h" value={String(b.hour)} onChange={(v) => set('hour', +v)} options={hours} /></div>{num('minute', 'Minute', 0, 59)}</>}
          {b.freq === 'weekly' && <div className="field"><span className="label">Days</span><div className="tool-actions">{DAYN.map((d, i) => <label key={d} className="check"><input type="checkbox" checked={b.days.includes(i)} onChange={(e) => set('days', e.target.checked ? [...b.days, i] : b.days.filter((x) => x !== i))} /> {d}</label>)}</div></div>}
          {['monthly', 'yearly'].includes(b.freq) && num('dom', 'On day', 1, 31)}
          {b.freq === 'yearly' && <div className="field"><label htmlFor="cr-m">In</label><Select id="cr-m" value={String(b.month)} onChange={(v) => set('month', +v)} options={MONN.map((m, i) => ({ value: String(i + 1), label: m }))} /></div>}
        </div>
      ) : (
        <>
          <div className="cr-parts">{[0, 1, 2, 3, 4].map((i) => <div className="field" key={i}><label htmlFor={`cr-p${i}`}>{FIELD_LABELS[i]}</label><input id={`cr-p${i}`} type="text" className="code" value={parts[i] ?? '*'} onChange={(e) => setPart(i, e.target.value)} spellCheck={false} /></div>)}</div>
          <div className="tool-actions">{PRESETS.map(([l, v]) => <button key={v} type="button" className="btn small" onClick={() => setExpr(v)}>{l}</button>)}</div>
          <div className="field"><label htmlFor="cr-x">Or the whole expression</label><input id="cr-x" type="text" className="code" value={expr} onChange={(e) => setExpr(e.target.value)} spellCheck={false} /></div>
        </>
      )}
      <div className="cr-out"><code>{expr}</code><CopyButton text={expr} small={false} label="Copy" /></div>
      {typeof p === 'string' ? <p className="bad" role="alert">{p}</p> : (
        <>
          <p className="cr-say d">{describe(p)}</p>
          <div className="result"><div className="result-top"><span>Next 10 times</span></div>
            <ol className="cr-runs">{runs.map((r, i) => <li key={i}><b className="code">{r.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b><small>{i === 0 ? 'next' : ''}</small></li>)}{runs.length === 0 && now && <li>It never runs. Check the day and month.</li>}</ol></div>
          <small>Times are in your own time zone.</small>
        </>
      )}
    </div>
  );
}
