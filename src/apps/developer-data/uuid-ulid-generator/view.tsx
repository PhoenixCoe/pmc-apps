'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { downloadText } from '@/components/shared/CopyButton';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { decode, make, type Kind } from './ids';

type Out = 'lines' | 'json' | 'csv' | 'sql';
export default function View() {
  const [kind, setKind] = useLocalState<Kind>('uuid-ulid-generator', 'kind', 'v7');
  const [count, setCount] = useLocalState('uuid-ulid-generator', 'count', 10);
  const [out, setOut] = useLocalState<Out>('uuid-ulid-generator', 'out', 'lines');
  const [o, setO] = useLocalState('uuid-ulid-generator', 'format', { upper: false, hyphens: true, braces: false });
  const [ids, setIds] = useState<string[]>([]), [probe, setProbe] = useState('');
  const gen = useCallback(() => setIds(Array.from({ length: Math.min(1000, Math.max(1, count)) }, () => make(kind))), [kind, count]);
  useEffect(() => { gen(); }, [gen]);
  const shown = useMemo(() => ids.map((s) => { let v = s; if (kind !== 'ulid') { if (!o.hyphens) v = v.replace(/-/g, ''); if (o.braces) v = `{${v}}`; } return o.upper ? v.toUpperCase() : kind === 'ulid' ? v : v.toLowerCase(); }), [ids, o, kind]);
  const text = out === 'lines' ? shown.join('\n') : out === 'json' ? JSON.stringify(shown, null, 2) : out === 'csv' ? 'id\n' + shown.join('\n') : `INSERT INTO items (id) VALUES\n${shown.map((s) => `  ('${s}')`).join(',\n')};`;
  const d = probe.trim() ? decode(probe) : null;
  return (
    <div className="panel">
      <Seg<Kind> value={kind} onChange={setKind} label="Type" options={[{ value: 'v7', label: 'UUID v7 (sorted by time)' }, { value: 'v4', label: 'UUID v4 (random)' }, { value: 'ulid', label: 'ULID' }]} />
      <div className="row">
        <div className="field"><label htmlFor="ui-n">How many: {count}</label><input id="ui-n" type="range" min={1} max={200} value={Math.min(200, count)} onChange={(e) => setCount(+e.target.value)} /></div>
        <div className="field"><label htmlFor="ui-nn">Or type a number (up to 1000)</label><input id="ui-nn" type="number" min={1} max={1000} value={count} onChange={(e) => setCount(Math.min(1000, Math.max(1, +e.target.value || 1)))} style={{ width: 110 }} /></div>
        <label className="check"><input type="checkbox" checked={o.upper} onChange={(e) => setO({ ...o, upper: e.target.checked })} /> CAPITALS</label>
        {kind !== 'ulid' && <><label className="check"><input type="checkbox" checked={o.hyphens} onChange={(e) => setO({ ...o, hyphens: e.target.checked })} /> Hyphens</label><label className="check"><input type="checkbox" checked={o.braces} onChange={(e) => setO({ ...o, braces: e.target.checked })} /> Braces</label></>}
      </div>
      <div className="tool-actions"><Seg<Out> value={out} onChange={setOut} label="Format" options={[{ value: 'lines', label: 'List' }, { value: 'json', label: 'JSON' }, { value: 'csv', label: 'CSV' }, { value: 'sql', label: 'SQL' }]} /><button type="button" className="btn primary" onClick={gen}>Make new ones</button><button type="button" className="btn" onClick={() => downloadText(`ids.${out === 'json' ? 'json' : out === 'csv' ? 'csv' : out === 'sql' ? 'sql' : 'txt'}`, text)}>Download</button></div>
      <CodeBox title={`${shown.length} ${kind === 'ulid' ? 'ULIDs' : 'UUIDs'}`} text={text} />
      <div className="field" style={{ borderTop: '3px solid var(--ink)', paddingTop: 16 }}>
        <label htmlFor="ui-d">Read an ID</label><input id="ui-d" type="text" className="code" value={probe} onChange={(e) => setProbe(e.target.value)} placeholder="Paste a UUID or ULID" spellCheck={false} />
        {d && (d.error ? <p className="bad">{d.error}</p> : <ul className="jwt-claims"><li><span className="d">Type</span><b className="code">{d.type}</b></li>{d.variant && <li><span className="d">Variant</span><b className="code">{d.variant}</b></li>}{d.when && <li><span className="d">Made at</span><b className="code">{d.when.toLocaleString()} ({d.when.toISOString()})</b></li>}{!d.when && d.version === 4 && <li><span className="d">Time</span><b className="code">Random. No time inside.</b></li>}</ul>)}
      </div>
    </div>
  );
}
