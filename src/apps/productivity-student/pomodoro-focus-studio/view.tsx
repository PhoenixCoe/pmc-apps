'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';

type Phase = 'focus' | 'short' | 'long';
interface Cfg { focus: number; short: number; long: number; every: number; auto: boolean; sound: string; vol: number; chime: boolean }
interface Log { day: string; task: string; min: number; at: number }
const DEF: Cfg = { focus: 25, short: 5, long: 15, every: 4, auto: true, sound: 'off', vol: 40, chime: true };
const LABEL: Record<Phase, string> = { focus: 'Focus', short: 'Short break', long: 'Long break' };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.max(0, Math.ceil(s % 60))).padStart(2, '0')}`;

/** Background sounds made on the spot with the Web Audio API, so nothing has to download. */
function startAmbient(ctx: AudioContext, kind: string, vol: number): { stop: () => void; set: (v: number) => void } {
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; d[i] = kind === 'brown' || kind === 'waves' ? (last = (last + 0.02 * w) / 1.02) * 3.5 : w * 0.5; } }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const gain = ctx.createGain(); gain.gain.value = vol / 100;
  const f = ctx.createBiquadFilter(); f.type = kind === 'rain' ? 'highpass' : 'lowpass'; f.frequency.value = kind === 'rain' ? 1200 : kind === 'white' ? 9000 : kind === 'waves' ? 500 : 800;
  src.connect(f).connect(gain).connect(ctx.destination); src.start();
  let lfo: OscillatorNode | undefined;
  if (kind === 'waves') { lfo = ctx.createOscillator(); lfo.frequency.value = 0.12; const g = ctx.createGain(); g.gain.value = vol / 250; lfo.connect(g).connect(gain.gain); lfo.start(); }
  return { stop: () => { try { src.stop(); lfo?.stop(); } catch { /* already stopped */ } gain.disconnect(); }, set: (v) => { gain.gain.value = v / 100; } };
}
function chime(ctx: AudioContext) { [660, 880, 1100].forEach((fq, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = fq; o.type = 'sine'; g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.22); g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.22 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.22 + 0.5); o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + i * 0.22); o.stop(ctx.currentTime + i * 0.22 + 0.6); }); }

export default function View() {
  const [cfg, setCfg] = useLocalState<Cfg>('pomodoro-focus-studio', 'settings', DEF);
  const [log, setLog] = useLocalState<Log[]>('pomodoro-focus-studio', 'log', []);
  const [task, setTask] = useLocalState('pomodoro-focus-studio', 'task', '');
  const [phase, setPhase] = useState<Phase>('focus'), [left, setLeft] = useState(DEF.focus * 60), [running, setRunning] = useState(false), [round, setRound] = useState(1);
  const end = useRef(0), ctx = useRef<AudioContext | null>(null), amb = useRef<ReturnType<typeof startAmbient> | null>(null);
  const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) => setCfg((p) => ({ ...p, [k]: v }));
  const total = (p: Phase) => cfg[p] * 60;
  const audio = () => (ctx.current ??= new AudioContext());

  useEffect(() => { if (!running) setLeft(total(phase)); }, [cfg.focus, cfg.short, cfg.long, phase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // background sound follows the settings and the timer
    amb.current?.stop(); amb.current = null;
    if (running && phase === 'focus' && cfg.sound !== 'off') { const c = audio(); c.resume(); amb.current = startAmbient(c, cfg.sound, cfg.vol); }
    return () => { amb.current?.stop(); amb.current = null; };
  }, [running, phase, cfg.sound]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { amb.current?.set(cfg.vol); }, [cfg.vol]);

  const next = useCallback((finished: boolean) => {
    if (finished && phase === 'focus') setLog((l) => [...l, { day: today(), task: task.trim(), min: cfg.focus, at: Date.now() }]);
    if (finished && cfg.chime) chime(audio());
    const np: Phase = phase !== 'focus' ? 'focus' : round % cfg.every === 0 ? 'long' : 'short';
    if (phase !== 'focus') setRound((r) => (np === 'focus' && phase === 'long' ? 1 : r + 1));
    setPhase(np); setLeft(cfg[np] * 60);
    if (finished && cfg.auto) { end.current = Date.now() + cfg[np] * 60000; setRunning(true); } else setRunning(false);
  }, [phase, round, cfg, task, setLog]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => { const s = (end.current - Date.now()) / 1000; if (s <= 0) next(true); else setLeft(s); }, 250);
    return () => clearInterval(t);
  }, [running, next]);
  useEffect(() => { const t = document.title; document.title = running ? `${mmss(left)} ${LABEL[phase]} · PMC Apps` : t; return () => { document.title = t; }; }, [running, left, phase]);

  const toggle = () => { if (running) { setRunning(false); return; } audio().resume(); end.current = Date.now() + left * 1000; setRunning(true); };
  const reset = () => { setRunning(false); setLeft(total(phase)); };

  const stats = useMemo(() => {
    const days = new Map<string, number>(); log.forEach((l) => days.set(l.day, (days.get(l.day) ?? 0) + l.min));
    let streak = 0; const d = new Date(); if (!days.has(today())) d.setDate(d.getDate() - 1);
    for (;;) { const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (!days.has(k)) break; streak++; d.setDate(d.getDate() - 1); }
    const week = Array.from({ length: 7 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() - (6 - i)); const k = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; return { k, label: x.toLocaleDateString(undefined, { weekday: 'short' }), min: days.get(k) ?? 0 }; });
    return { streak, week, todayMin: days.get(today()) ?? 0, todayN: log.filter((l) => l.day === today()).length, max: Math.max(30, ...week.map((w) => w.min)) };
  }, [log]);
  const pct = 1 - left / total(phase);

  return (
    <div className="panel">
      <div className={`pf-stage ph-${phase}`}>
        <Seg<Phase> value={phase} onChange={(p) => { if (!running) setPhase(p); }} label="Timer type" options={[{ value: 'focus', label: 'Focus' }, { value: 'short', label: 'Short break' }, { value: 'long', label: 'Long break' }]} />
        <div className="pf-time d" role="timer" aria-live="off">{mmss(left)}</div>
        <div className="ld-bar" aria-hidden style={{ width: 'min(520px, 100%)', background: 'var(--paper)' }}><i style={{ width: `${pct * 100}%`, background: 'var(--ink)', transition: 'width 0.3s linear' }} /></div>
        <p className="pf-line d">{LABEL[phase]} · round {round} of {cfg.every}</p>
        <div className="tool-actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn primary" onClick={toggle}>{running ? 'Pause' : left < total(phase) ? 'Carry on' : 'Start'}</button>
          <button type="button" className="btn" onClick={reset}>Reset</button>
          <button type="button" className="btn" onClick={() => next(false)}>Skip</button>
        </div>
      </div>
      <div className="field"><label htmlFor="pf-t">What are you working on?</label><input id="pf-t" type="text" value={task} onChange={(e) => setTask(e.target.value)} placeholder="Maths homework" /></div>
      <div className="row">
        <div className="field"><label htmlFor="pf-f">Focus (min)</label><input id="pf-f" type="number" min={1} max={120} value={cfg.focus} onChange={(e) => set('focus', Math.max(1, +e.target.value || 25))} style={{ width: 90 }} /></div>
        <div className="field"><label htmlFor="pf-s">Short break</label><input id="pf-s" type="number" min={1} max={60} value={cfg.short} onChange={(e) => set('short', Math.max(1, +e.target.value || 5))} style={{ width: 90 }} /></div>
        <div className="field"><label htmlFor="pf-l">Long break</label><input id="pf-l" type="number" min={1} max={90} value={cfg.long} onChange={(e) => set('long', Math.max(1, +e.target.value || 15))} style={{ width: 90 }} /></div>
        <div className="field"><label htmlFor="pf-e">Long break every</label><input id="pf-e" type="number" min={2} max={10} value={cfg.every} onChange={(e) => set('every', Math.max(2, +e.target.value || 4))} style={{ width: 90 }} /></div>
        <label className="check"><input type="checkbox" checked={cfg.auto} onChange={(e) => set('auto', e.target.checked)} /> Start the next one by itself</label>
        <label className="check"><input type="checkbox" checked={cfg.chime} onChange={(e) => set('chime', e.target.checked)} /> Chime at the end</label>
      </div>
      <div className="row">
        <Seg value={cfg.sound} onChange={(v) => set('sound', v)} label="Background sound while focusing" options={[{ value: 'off', label: 'Off' }, { value: 'brown', label: 'Brown noise' }, { value: 'white', label: 'White noise' }, { value: 'rain', label: 'Rain' }, { value: 'waves', label: 'Waves' }]} />
        <div className="field"><label htmlFor="pf-v">Volume: {cfg.vol}</label><input id="pf-v" type="range" min={5} max={100} value={cfg.vol} onChange={(e) => set('vol', +e.target.value)} /></div>
      </div>
      <div className="pf-stats">
        <div><b className="d">{stats.streak}</b><span>day streak</span></div><div><b className="d">{stats.todayN}</b><span>sessions today</span></div><div><b className="d">{stats.todayMin}</b><span>minutes today</span></div>
        <ul className="pf-week" aria-label="Minutes focused in the last 7 days">{stats.week.map((w) => <li key={w.k}><i style={{ height: `${(w.min / stats.max) * 100}%` }} title={`${w.min} min`} /><span>{w.label}</span></li>)}</ul>
      </div>
      {log.length > 0 && <details className="pf-log"><summary>Session log ({log.length})</summary><ul>{[...log].reverse().slice(0, 40).map((l) => <li key={l.at}><span>{new Date(l.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span><b>{l.min} min</b><span>{l.task || 'No label'}</span></li>)}</ul><button type="button" className="btn small" onClick={() => { if (confirm('Clear the whole log?')) setLog([]); }}>Clear log</button></details>}
    </div>
  );
}
