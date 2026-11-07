'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CopyButton } from '@/components/shared/CopyButton';
import { Select } from '@/components/shared/Select';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { CATS, CURRENCIES, convert, fmt } from './units';

interface Rates { base: string; rates: Record<string, number>; at: number }
export default function View() {
  const [cat, setCat] = useLocalState('unit-currency-matrix', 'cat', 'length');
  const [val, setVal] = useLocalState('unit-currency-matrix', 'value', '1');
  const [from, setFrom] = useLocalState<Record<string, string>>('unit-currency-matrix', 'from', {});
  const [cur, setCur] = useLocalState('unit-currency-matrix', 'cur', 'GBP');
  const [rates, setRates] = useState<Rates | null>(null), [state, setState] = useState<'loading' | 'live' | 'old' | 'none'>('loading');

  const getRates = useCallback(async () => {
    setState('loading');
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD'), j = await r.json();
      if (j.result !== 'success') throw new Error('bad');
      const x: Rates = { base: 'USD', rates: j.rates, at: (j.time_last_update_unix ?? Date.now() / 1000) * 1000 }; setRates(x); setState('live');
      try { localStorage.setItem('pmc:unit-currency-matrix:rates', JSON.stringify(x)); } catch { /* storage blocked */ }
    } catch {
      try { const old = JSON.parse(localStorage.getItem('pmc:unit-currency-matrix:rates') ?? 'null'); if (old) { setRates(old); setState('old'); return; } } catch { /* nothing saved */ }
      setState('none');
    }
  }, []);
  useEffect(() => { getRates(); }, [getRates]);

  const isCur = cat === 'currency', n = parseFloat(val.replace(/,/g, ''));
  const c = CATS.find((k) => k.id === cat) ?? CATS[0], fid = from[cat] ?? c.units[2 % c.units.length].id, fu = c.units.find((x) => x.id === fid) ?? c.units[0];
  const rows = useMemo(() => {
    if (isCur) return rates ? CURRENCIES.filter(([k]) => rates.rates[k]).map(([k, name]) => ({ id: k, name, out: (n / rates.rates[cur]) * rates.rates[k] })) : [];
    return c.units.map((t) => ({ id: t.id, name: t.name, out: convert(n, fu, t) }));
  }, [isCur, rates, cur, n, c, fu]);

  return (
    <div className="panel">
      <div className="ucm-cats"><Seg value={cat} onChange={setCat} label="What are you measuring" options={[...CATS.map((k) => ({ value: k.id, label: k.name })), { value: 'currency', label: 'Money' }]} /></div>
      <div className="row">
        <div className="field"><label htmlFor="uc-v">Amount</label><input id="uc-v" type="text" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} style={{ minWidth: 180 }} /></div>
        <div className="field"><label htmlFor="uc-f">From</label>
          {isCur ? <Select id="uc-f" value={cur} onChange={setCur} options={CURRENCIES.map(([k, nm]) => ({ value: k, label: `${k} · ${nm}` }))} />
            : <Select id="uc-f" value={fu.id} onChange={(v) => setFrom({ ...from, [cat]: v })} options={c.units.map((t) => ({ value: t.id, label: t.name }))} />}
        </div>
        {isCur && <div className="tool-actions">
          <span className="stat">{state === 'loading' ? 'Getting rates…' : state === 'live' ? `Live rates · ${new Date(rates!.at).toLocaleDateString()}` : state === 'old' ? `Saved rates · ${new Date(rates!.at).toLocaleDateString()}` : 'No rates'}</span>
          <button type="button" className="btn small" onClick={getRates}>Refresh</button>
        </div>}
      </div>
      {isNaN(n) ? <div className="empty">Type a number to see it in every unit.</div> : isCur && !rates ? <div className="empty">{state === 'loading' ? 'Getting today’s rates…' : 'Rates could not be loaded. Check your connection and press Refresh.'}</div> : (
        <ul className="ucm-grid">
          {rows.map((r) => (
            <li key={r.id} className={r.id === (isCur ? cur : fu.id) ? 'me' : ''}>
              <span className="d">{r.name}</span>
              <b className="code">{isCur ? r.out.toLocaleString(undefined, { maximumFractionDigits: 2 }) : fmt(r.out)}</b>
              <CopyButton text={isCur ? r.out.toFixed(2) : fmt(r.out)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
