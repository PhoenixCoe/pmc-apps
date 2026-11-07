'use client';
import { useMemo } from 'react';
import { InlineDiff, LineDiff } from '@/components/shared/DiffView';
import { downloadText } from '@/components/shared/CopyButton';
import { Segmented } from '@/components/shared/Segmented';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { inlineSegments, lineRows, makePatch, rowStats, type DiffMode } from '@/lib/diffRows';
import { useLocalState } from '@/lib/useLocalState';

const APP = 'text-diff-inspector';

export default function View() {
  const [a, setA] = useLocalState(APP, 'original', '');
  const [b, setB] = useLocalState(APP, 'changed', '');
  const [mode, setMode] = useLocalState<DiffMode>(APP, 'mode', 'lines');
  const [ignoreWhitespace, setWs] = useLocalState(APP, 'ws', false);
  const [ignoreCase, setCase] = useLocalState(APP, 'case', false);

  const opts = { ignoreWhitespace, ignoreCase };
  const rows = useMemo(() => (mode === 'lines' ? lineRows(a, b, opts) : []), [a, b, mode, ignoreWhitespace, ignoreCase]); // eslint-disable-line react-hooks/exhaustive-deps
  const inline = useMemo(() => (mode !== 'lines' ? inlineSegments(a, b, mode, opts) : null), [a, b, mode, ignoreCase]); // eslint-disable-line react-hooks/exhaustive-deps
  const stats = useMemo(() => rowStats(rows), [rows]);
  const has = a !== '' || b !== '';
  const inlineChanged = inline ? inline.left.some((s) => s.hl) || inline.right.some((s) => s.hl) : false;
  const identical = mode === 'lines' ? stats.identical : !inlineChanged;

  return (
    <div className="panel">
      <div className="split">
        <div className="field"><label htmlFor="td-a">Original</label><textarea id="td-a" className="code" value={a} onChange={(e) => setA(e.target.value)} spellCheck={false} placeholder="Paste the original text" style={{ minHeight: 200 }} /></div>
        <div className="field"><label htmlFor="td-b">Changed</label><textarea id="td-b" className="code" value={b} onChange={(e) => setB(e.target.value)} spellCheck={false} placeholder="Paste the new version" style={{ minHeight: 200 }} /></div>
      </div>
      <div className="row">
        <Segmented label="Compare by" value={mode} onChange={setMode} options={[{ value: 'lines', label: 'Lines' }, { value: 'words', label: 'Words' }, { value: 'chars', label: 'Characters' }]} />
        <div className="tool-actions">
          <button type="button" className="btn" onClick={() => { setA(b); setB(a); }} disabled={!has}>Swap sides</button>
          <button type="button" className="btn" onClick={() => downloadText('changes.patch', makePatch(a, b), 'text/x-diff')} disabled={!has || identical}>Download .patch</button>
          <SettingsDrawer label="Options" title="Compare options">
            <label className="check"><input type="checkbox" checked={ignoreCase} onChange={(e) => setCase(e.target.checked)} /> Ignore upper and lower case</label>
            <label className="check"><input type="checkbox" checked={ignoreWhitespace} onChange={(e) => setWs(e.target.checked)} disabled={mode !== 'lines'} /> Ignore spacing differences (lines only)</label>
          </SettingsDrawer>
        </div>
      </div>
      {!has ? <div className="empty">Paste two versions above to see what changed.</div>
        : identical ? <p className="note" role="status">The two texts are identical{ignoreCase || ignoreWhitespace ? ' with the current options' : ''}.</p>
        : (
          <>
            {mode === 'lines' && <p className="tool-actions" role="status"><span className="stat">{stats.added} added</span><span className="stat">{stats.removed} removed</span><span className="stat">{stats.changed} changed</span></p>}
            {mode === 'lines' ? <LineDiff rows={rows} /> : inline && <InlineDiff left={inline.left} right={inline.right} />}
          </>
        )}
    </div>
  );
}
