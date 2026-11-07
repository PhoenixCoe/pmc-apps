'use client';
import { useMemo } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { Segmented } from '@/components/shared/Segmented';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { useLocalState } from '@/lib/useLocalState';
import { parseTable, toHtml, toLatex, toMarkdown, type Align, type Delim } from './utils';

const APP = 'table-converter';
const EXAMPLE = 'Name,Role,Hours,Rate\nAda,Engineer,38,£52.50\n"Grace, Rear Adm.",Lead,40,£61.00\nLinus,Reviewer,12,£48.00';
const USED: Record<string, string> = { comma: 'commas', tab: 'tabs', semicolon: 'semicolons', pipe: 'pipes', spaces: 'column spacing' };

export default function View() {
  const [input, setInput] = useLocalState(APP, 'input', '');
  const [delim, setDelim] = useLocalState<Delim>(APP, 'delim', 'auto');
  const [header, setHeader] = useLocalState(APP, 'header', true);
  const [align, setAlign] = useLocalState<Align>(APP, 'align', 'auto');
  const [booktabs, setBooktabs] = useLocalState(APP, 'booktabs', true);

  const { rows, used } = useMemo(() => parseTable(input, delim), [input, delim]);
  const md = useMemo(() => toMarkdown(rows, header, align), [rows, header, align]);
  const html = useMemo(() => toHtml(rows, header, align), [rows, header, align]);
  const tex = useMemo(() => toLatex(rows, header, align, booktabs), [rows, header, align, booktabs]);

  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="tc-in">Paste CSV, TSV, a Markdown table or spaced columns</label>
        <textarea id="tc-in" className="code" value={input} onChange={(e) => setInput(e.target.value)} placeholder={EXAMPLE} style={{ minHeight: 170 }} spellCheck={false} />
      </div>
      <div className="tool-actions">
        <button type="button" className="btn" onClick={() => setInput(EXAMPLE)}>Insert example</button>
        <label className="check"><input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} /> First row is a header</label>
        <SettingsDrawer label="Options" title="Table options">
          <Segmented label="Separator" value={delim} onChange={setDelim} options={[{ value: 'auto', label: 'Detect' }, { value: 'comma', label: 'Comma' }, { value: 'tab', label: 'Tab' }, { value: 'semicolon', label: 'Semicolon' }, { value: 'pipe', label: 'Pipe' }, { value: 'spaces', label: 'Spaces' }]} />
          <Segmented label="Column alignment" value={align} onChange={setAlign} options={[{ value: 'auto', label: 'Numbers right' }, { value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }]} />
          <label className="check"><input type="checkbox" checked={booktabs} onChange={(e) => setBooktabs(e.target.checked)} /> LaTeX: use booktabs rules</label>
        </SettingsDrawer>
        {rows.length > 0 && <span className="stat" aria-live="polite">{rows.length} rows, {rows[0].length} columns, split on {USED[used]}</span>}
      </div>
      {rows.length ? (
        <>
          <div className="table-wrap" style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table className="data">
              {header && <thead><tr>{rows[0].map((c, i) => <th key={i}>{c}</th>)}</tr></thead>}
              <tbody>{(header ? rows.slice(1) : rows).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="result-list" style={{ gridTemplateColumns: '1fr' }}>
            <CodeBox title="Markdown" text={md} /><CodeBox title="HTML" text={html} /><CodeBox title="LaTeX" text={tex} />
          </div>
        </>
      ) : <div className="empty">Paste a table above. Markdown, HTML and LaTeX appear as you type.</div>}
    </div>
  );
}
