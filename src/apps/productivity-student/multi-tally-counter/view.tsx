'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { downloadText } from '@/components/shared/CopyButton';
import { useLocalState } from '@/lib/useLocalState';

interface Counter { id: number; name: string; value: number; step: number }
interface Entry { at: number; name: string; change: number; value: number }
const TONES = ['tone-green', 'tone-gold', 'tone-ink', 'tone-cream'];
const fresh = (): Counter[] => [{ id: 1, name: 'Counter 1', value: 0, step: 1 }];

export default function View() {
  const [cs, setCs] = useLocalState<Counter[]>('multi-tally-counter', 'counters', fresh());
  const [log, setLog] = useLocalState<Entry[]>('multi-tally-counter', 'log', []);
  const [sound, setSound] = useLocalState('multi-tally-counter', 'sound', true);
  const [keys, setKeys] = useLocalState('multi-tally-counter', 'keys', true);
  const ac = useRef<AudioContext | null>(null);
  const [flash, setFlash] = useState<number | null>(null);

  const tick = useCallback((up: boolean) => {
    if (!sound) return; try { const c = (ac.current ??= new AudioContext()), o = c.createOscillator(), g = c.createGain(); o.frequency.value = up ? 880 : 520; o.type = 'square'; g.gain.setValueAtTime(0.06, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.08); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.09); } catch { /* sound unavailable */ }
  }, [sound]);

  const bump = useCallback((id: number, dir: 1 | -1) => {
    setCs((p) => p.map((c) => { if (c.id !== id) return c; const v = +(c.value + dir * c.step).toFixed(6); setLog((l) => [...l.slice(-4999), { at: Date.now(), name: c.name, change: dir * c.step, value: v }]); return { ...c, value: v }; }));
    tick(dir > 0); setFlash(id); setTimeout(() => setFlash((f) => (f === id ? null : f)), 140);
  }, [setCs, setLog, tick]);

  useEffect(() => {
    if (!keys) return;
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = '!@#$%^&*('.indexOf(e.key) >= 0 ? '!@#$%^&*('.indexOf(e.key) + 1 : +e.key, c = cs[n - 1];
      if (n >= 1 && n <= 9 && c) { e.preventDefault(); bump(c.id, e.shiftKey || '!@#$%^&*('.includes(e.key) ? -1 : 1); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [keys, cs, bump]);

  const csv = () => downloadText('tally-log.csv', ['time,counter,change,total', ...log.map((l) => `${new Date(l.at).toISOString()},"${l.name.replace(/"/g, '""')}",${l.change},${l.value}`)].join('\n'), 'text/csv');
  const upd = (id: number, p: Partial<Counter>) => setCs((x) => x.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const total = cs.reduce((n, c) => n + c.value, 0);

  return (
    <div className="panel">
      <div className="tool-actions">
        <button type="button" className="btn" disabled={cs.length >= 9} onClick={() => setCs([...cs, { id: Date.now(), name: `Counter ${cs.length + 1}`, value: 0, step: 1 }])}>Add a counter</button>
        <label className="check"><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Click sound</label>
        <label className="check"><input type="checkbox" checked={keys} onChange={(e) => setKeys(e.target.checked)} /> Keys 1 to 9 (hold Shift to take away)</label>
        <span className="stat">Total {total}</span>
      </div>
      <div className="mt-grid">
        {cs.map((c, i) => (
          <div key={c.id} className={`mt-card ${TONES[i % TONES.length]}${flash === c.id ? ' flash' : ''}`}>
            <div className="mt-top"><span className="mt-key d">{i + 1}</span><input type="text" aria-label={`Name of counter ${i + 1}`} value={c.name} onChange={(e) => upd(c.id, { name: e.target.value })} /></div>
            <button type="button" className="mt-num d" onClick={() => bump(c.id, 1)} aria-label={`${c.name}: ${c.value}. Add ${c.step}.`}>{c.value}</button>
            <div className="mt-bar">
              <button type="button" className="btn small" onClick={() => bump(c.id, -1)} aria-label={`Take away ${c.step} from ${c.name}`}>− {c.step}</button>
              <label className="mt-step">Step <input type="number" min={0.01} step="any" value={c.step} onChange={(e) => upd(c.id, { step: Math.max(0.01, +e.target.value || 1) })} /></label>
              <button type="button" className="btn small" onClick={() => { setLog((l) => [...l, { at: Date.now(), name: c.name, change: -c.value, value: 0 }]); upd(c.id, { value: 0 }); }}>Reset</button>
              {cs.length > 1 && <button type="button" className="btn small" aria-label={`Delete ${c.name}`} onClick={() => setCs(cs.filter((x) => x.id !== c.id))}>✕</button>}
            </div>
          </div>
        ))}
      </div>
      <div className="tool-actions">
        <button type="button" className="btn gold" disabled={!log.length} onClick={csv}>Download log (.csv)</button>
        <button type="button" className="btn" disabled={!log.length} onClick={() => { if (confirm('Clear the log?')) setLog([]); }}>Clear log</button>
        <span className="stat">{log.length} entries</span>
      </div>
    </div>
  );
}
