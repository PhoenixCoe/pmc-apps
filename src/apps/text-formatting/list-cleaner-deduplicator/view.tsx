'use client';
import { useMemo } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { downloadText } from '@/components/shared/CopyButton';
import { Segmented } from '@/components/shared/Segmented';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { useLocalState } from '@/lib/useLocalState';
import { cleanList, defaultCleanOptions, type CleanOptions } from './utils';

const APP = 'list-cleaner-deduplicator';

export default function View() {
  const [input, setInput] = useLocalState(APP, 'input', '');
  const [o, setO] = useLocalState<CleanOptions>(APP, 'options', defaultCleanOptions);
  const set = <K extends keyof CleanOptions>(k: K, v: CleanOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const r = useMemo(() => cleanList(input, o), [input, o]);
  const repeated = r.frequency.filter((f) => f.count > 1);

  return (
    <div className="panel">
      <div className="split">
        <div className="field">
          <label htmlFor="lc-in">Your list (one item per line)</label>
          <textarea id="lc-in" className="code" value={input} onChange={(e) => setInput(e.target.value)} placeholder={'apples\nPears\napples\n\n  bananas  \npears'} style={{ minHeight: 260 }} spellCheck={false} />
        </div>
        <CodeBox title="Cleaned list" text={r.output} empty="The cleaned list appears here." extra={<button type="button" className="btn small" disabled={!r.output} onClick={() => downloadText('cleaned-list.txt', r.output)}>Download</button>} />
      </div>

      <div className="row">
        <label className="check"><input type="checkbox" checked={o.caseSensitive} onChange={(e) => set('caseSensitive', e.target.checked)} /> Case sensitive</label>
        <label className="check"><input type="checkbox" checked={o.trim} onChange={(e) => set('trim', e.target.checked)} /> Trim whitespace</label>
        <label className="check"><input type="checkbox" checked={o.removeEmpty} onChange={(e) => set('removeEmpty', e.target.checked)} /> Remove empty lines</label>
        <SettingsDrawer label="More options" title="List options">
          <Segmented label="Keep" value={o.mode} onChange={(v) => set('mode', v)} options={[{ value: 'dedupe', label: 'One of each' }, { value: 'unique-only', label: 'Only items seen once' }, { value: 'duplicates-only', label: 'Only repeated items' }]} />
          <Segmented label="Which copy to keep" value={o.keep} onChange={(v) => set('keep', v)} options={[{ value: 'first', label: 'First' }, { value: 'last', label: 'Last' }]} />
          <Segmented label="Sort" value={o.sort} onChange={(v) => set('sort', v)} options={[{ value: 'none', label: 'Original order' }, { value: 'az', label: 'A to Z' }, { value: 'za', label: 'Z to A' }, { value: 'length', label: 'Length' }, { value: 'frequency', label: 'Most repeated' }]} />
          <label className="check"><input type="checkbox" checked={o.collapseSpaces} onChange={(e) => set('collapseSpaces', e.target.checked)} /> Collapse repeated spaces inside lines</label>
        </SettingsDrawer>
      </div>

      {input ? (
        <>
          <p className="tool-actions" aria-live="polite">
            <span className="stat">{r.before} lines in</span><span className="stat">{r.after} out</span>
            <span className="stat">{r.duplicatesRemoved} duplicates found</span>{r.emptyRemoved > 0 && <span className="stat">{r.emptyRemoved} empty removed</span>}
          </p>
          {repeated.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2>Repeated items</h2>
              <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="data"><thead><tr><th>Item</th><th className="num">Times</th></tr></thead>
                  <tbody>{repeated.map((f) => <tr key={f.item}><td className="code">{f.item}</td><td className="num">{f.count}</td></tr>)}</tbody></table>
              </div>
            </section>
          )}
        </>
      ) : <div className="empty">Paste a list on the left. Duplicates go the moment you do.</div>}
    </div>
  );
}
