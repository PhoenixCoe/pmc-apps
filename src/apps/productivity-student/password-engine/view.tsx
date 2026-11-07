'use client';
import { useCallback, useEffect, useState } from 'react';
import { CopyButton } from '@/components/shared/CopyButton';
import { Seg } from '@/components/shared/Segmented';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { useLocalState } from '@/lib/useLocalState';
import { defaultGen, generate, grade, guessTime, leaked, measure, pool, WORD_COUNT, type GenOptions } from './gen';

type Check = { state: 'idle' } | { state: 'busy' } | { state: 'ok' } | { state: 'bad'; n: number } | { state: 'err' };
function Meter({ bits }: { bits: number }) {
  const g = grade(bits);
  return <div className="pw-meter"><div className="pw-bars" aria-hidden>{[0, 1, 2, 3].map((i) => <i key={i} className={i <= g.level && bits > 0 ? `on l${g.level}` : ''} />)}</div><b className="d">{bits > 0 ? g.name : ''}</b><span>{bits > 0 ? `${Math.round(bits)} bits · would take about ${guessTime(bits)} to guess` : ''}</span></div>;
}

export default function View() {
  const [o, setO] = useLocalState<GenOptions>('password-engine', 'options', defaultGen);
  const [out, setOut] = useState<{ text: string; bits: number }[]>([]);
  const [mine, setMine] = useState(''), [show, setShow] = useState(false);
  const [chk, setChk] = useState<Record<string, Check>>({});
  const set = <K extends keyof GenOptions>(k: K, v: GenOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const make = useCallback(() => { setOut(Array.from({ length: 5 }, () => generate(o))); setChk({}); }, [o]);
  useEffect(() => { make(); }, [make]);
  const check = async (pw: string) => { setChk((c) => ({ ...c, [pw]: { state: 'busy' } })); try { const n = await leaked(pw); setChk((c) => ({ ...c, [pw]: n ? { state: 'bad', n } : { state: 'ok' } })); } catch { setChk((c) => ({ ...c, [pw]: { state: 'err' } })); } };
  const verdict = (pw: string) => { const c = chk[pw] ?? { state: 'idle' }; return c.state === 'busy' ? <span>Checking…</span> : c.state === 'ok' ? <span className="ok">Not found in known leaks.</span> : c.state === 'bad' ? <span className="bad">Seen in {c.n.toLocaleString()} leaks. Do not use it.</span> : c.state === 'err' ? <span className="bad">Could not check. Are you online?</span> : <button type="button" className="btn small" onClick={() => check(pw)}>Check for leaks</button>; };
  const none = o.mode === 'random' && !pool(o);
  const [first, ...rest] = out;
  return (
    <div className="panel">
      <Seg<'random' | 'words'> value={o.mode} onChange={(v) => set('mode', v)} label="Type" options={[{ value: 'random', label: 'Random characters' }, { value: 'words', label: 'Words' }]} />
      {o.mode === 'random'
        ? <div className="field"><label htmlFor="pw-l">Length: {o.length}</label><input id="pw-l" type="range" min={8} max={64} value={o.length} onChange={(e) => set('length', +e.target.value)} /></div>
        : <div className="field"><label htmlFor="pw-w">Words: {o.words}</label><input id="pw-w" type="range" min={3} max={8} value={o.words} onChange={(e) => set('words', +e.target.value)} /></div>}
      <div className="tool-actions">
        {o.mode === 'random' ? <>
          <label className="check"><input type="checkbox" checked={o.upper} onChange={(e) => set('upper', e.target.checked)} /> A–Z</label>
          <label className="check"><input type="checkbox" checked={o.lower} onChange={(e) => set('lower', e.target.checked)} /> a–z</label>
          <label className="check"><input type="checkbox" checked={o.digits} onChange={(e) => set('digits', e.target.checked)} /> 0–9</label>
          <label className="check"><input type="checkbox" checked={o.symbols} onChange={(e) => set('symbols', e.target.checked)} /> !@#</label></>
          : <><label className="check"><input type="checkbox" checked={o.capital} onChange={(e) => set('capital', e.target.checked)} /> Capital letters</label><label className="check"><input type="checkbox" checked={o.number} onChange={(e) => set('number', e.target.checked)} /> Add a number</label></>}
        <SettingsDrawer label="More" title="More options">
          {o.mode === 'random' ? <>
            <label className="check"><input type="checkbox" checked={o.lookalikes} onChange={(e) => set('lookalikes', e.target.checked)} /> Allow look-alikes (I, l, 1, O, 0)</label>
            <div className="field"><label htmlFor="pw-a">Never use these characters</label><input id="pw-a" type="text" value={o.avoid} onChange={(e) => set('avoid', e.target.value)} placeholder="{}[]" /></div></>
            : <div className="field"><label htmlFor="pw-s">Between words</label><input id="pw-s" type="text" maxLength={3} value={o.sep} onChange={(e) => set('sep', e.target.value)} /><small>{WORD_COUNT} words to pick from</small></div>}
        </SettingsDrawer>
      </div>
      {none ? <div className="empty">Choose at least one kind of character.</div> : first && (
        <>
          <div className="pw-big"><code>{first.text}</code><div className="tool-actions"><CopyButton text={first.text} small={false} /><button type="button" className="btn" onClick={make}>New password</button></div></div>
          <Meter bits={first.bits} />{verdict(first.text)}
          <details className="pf-log"><summary>More to choose from</summary>
            <ul className="pw-more">{rest.map((r, i) => <li key={i}><code>{r.text}</code><CopyButton text={r.text} /></li>)}</ul></details>
        </>
      )}
      <div className="field" style={{ borderTop: '3px solid var(--ink)', paddingTop: 18 }}>
        <label htmlFor="pw-m">Test a password of your own</label>
        <div className="tool-actions"><input id="pw-m" type={show ? 'text' : 'password'} value={mine} onChange={(e) => { setMine(e.target.value); }} autoComplete="off" style={{ flex: 1, minWidth: 220 }} /><button type="button" className="btn small" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button></div>
        {mine && <><Meter bits={measure(mine)} />{verdict(mine)}<small>Only the first 5 characters of a scrambled copy are sent to check for leaks. Your password never leaves this page.</small></>}
      </div>
    </div>
  );
}
