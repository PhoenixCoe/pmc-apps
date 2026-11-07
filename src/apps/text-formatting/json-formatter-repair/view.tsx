'use client';
import { useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { downloadText } from '@/components/shared/CopyButton';
import { Segmented } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { parseJson, repairJson, sortKeys, stats, stringify, type Indent } from './utils';

const APP = 'json-formatter-repair';
const EXAMPLE = "{\n  name: 'PMC Apps', // unquoted key and single quotes\n  tags: ['text', 'files',],\n  active: True,\n  count: 60\n}";
const MAX_ITEMS = 200;

type Mode = 'init' | 'all' | 'none';

function Node({ k, v, mode, depth, epoch }: { k?: string; v: unknown; mode: Mode; depth: number; epoch: number }) {
  const label = k !== undefined ? <><span className="k">{JSON.stringify(k)}</span>: </> : null;
  if (v === null) return <div className="leaf">{label}<span className="b">null</span></div>;
  if (typeof v === 'string') return <div className="leaf">{label}<span className="s">{JSON.stringify(v)}</span></div>;
  if (typeof v === 'number') return <div className="leaf">{label}<span className="n">{String(v)}</span></div>;
  if (typeof v === 'boolean') return <div className="leaf">{label}<span className="b">{String(v)}</span></div>;
  const isArr = Array.isArray(v);
  const entries: [string, unknown][] = isArr ? (v as unknown[]).map((x, i) => [String(i), x]) : Object.entries(v as object);
  const shown = entries.slice(0, MAX_ITEMS);
  return (
    <details open={mode === 'all' || (mode === 'init' && depth === 0)} key={epoch}>
      <summary>{label}{isArr ? `[ ${entries.length} ]` : `{ ${entries.length} }`}</summary>
      {shown.map(([ck, cv]) => <Node key={ck} k={isArr ? undefined : ck} v={cv} mode={mode} depth={depth + 1} epoch={epoch} />)}
      {entries.length > MAX_ITEMS && <div className="leaf" style={{ opacity: 0.7 }}>and {entries.length - MAX_ITEMS} more. Download the JSON to see everything.</div>}
    </details>
  );
}

export default function View() {
  const [input, setInput] = useLocalState(APP, 'input', '');
  const [indent, setIndent] = useLocalState<Indent>(APP, 'indent', '2');
  const [sorted, setSorted] = useLocalState(APP, 'sorted', false);
  const [epoch, setEpoch] = useState(0);
  const [mode, setMode] = useState<Mode>('init');

  const analysis = useMemo(() => {
    if (!input.trim()) return null;
    const strict = parseJson(input);
    if (strict.ok) return { value: strict.value, repaired: false as const, error: null };
    const fix = repairJson(input);
    if (fix.ok) {
      const again = parseJson(fix.text);
      if (again.ok) return { value: again.value, repaired: true as const, error: strict.error };
    }
    return { value: undefined, repaired: false as const, error: strict.error, failure: fix.ok ? undefined : fix.message };
  }, [input]);

  const output = useMemo(() => (analysis && analysis.value !== undefined ? stringify(sorted ? sortKeys(analysis.value) : analysis.value, indent) : ''), [analysis, sorted, indent]);
  const st = useMemo(() => (analysis && analysis.value !== undefined ? stats(analysis.value) : null), [analysis]);
  const bytes = new Blob([output]).size;

  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="js-in">Your JSON (broken JSON is fine)</label>
        <textarea id="js-in" className="code" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} placeholder={'{"paste": "your JSON here"}'} style={{ minHeight: 200 }} />
      </div>
      <div className="row">
        <Segmented label="Layout" value={indent} onChange={setIndent} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tabs' }, { value: 'min', label: 'Minified' }]} />
        <label className="check"><input type="checkbox" checked={sorted} onChange={(e) => setSorted(e.target.checked)} /> Sort keys A to Z</label>
        <div className="tool-actions">
          <button type="button" className="btn" onClick={() => setInput(EXAMPLE)}>Insert broken example</button>
          <button type="button" className="btn" onClick={() => setInput('')} disabled={!input}>Clear</button>
        </div>
      </div>

      {!analysis ? <div className="empty">Paste JSON above. It is checked, repaired if needed, and formatted instantly.</div> : (
        <>
          {analysis.value === undefined ? (
            <p className="note err" role="alert"><strong>This can&rsquo;t be read as JSON.</strong> Line {analysis.error!.line}, column {analysis.error!.column}: {analysis.error!.message}.{analysis.failure ? ` Repair also failed: ${analysis.failure}.` : ''}</p>
          ) : analysis.repaired ? (
            <p className="note" role="status"><strong>Repaired.</strong> The input wasn&rsquo;t valid JSON (line {analysis.error!.line}, column {analysis.error!.column}: {analysis.error!.message}), so it was fixed: comments, trailing commas, single quotes, unquoted keys and similar problems are corrected. Check the result before you rely on it.</p>
          ) : <p className="note ok" role="status"><strong>Valid JSON.</strong></p>}

          {output && st && (
            <>
              <p className="tool-actions"><span className="stat">{st.keys} keys</span><span className="stat">{st.depth} levels deep</span><span className="stat">{bytes.toLocaleString('en-GB')} bytes</span></p>
              <div className="split">
                <CodeBox title="Result" text={output} extra={<button type="button" className="btn small" onClick={() => downloadText('formatted.json', output, 'application/json')}>Download</button>} />
                <div className="result">
                  <div className="result-top"><span>Tree</span>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn small" onClick={() => { setMode('all'); setEpoch((e) => e + 1); }}>Expand all</button>
                      <button type="button" className="btn small" onClick={() => { setMode('none'); setEpoch((e) => e + 1); }}>Collapse all</button>
                    </span>
                  </div>
                  <div className="tree code"><Node v={analysis.value} mode={mode} depth={0} epoch={epoch} /></div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
