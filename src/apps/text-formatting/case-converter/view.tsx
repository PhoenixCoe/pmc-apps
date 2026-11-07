'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { copyText, useLocalState } from '@/lib/useLocalState';
import { CASES, convert, parseDelimiter } from './utils';

const APP = 'case-converter';
const EXAMPLE = 'the quick brown fox jumps over the lazy dog\nuser profile settings page\nHTTP response status of an API call';

export default function View() {
  const [input, setInput] = useLocalState(APP, 'input', '');
  const [perLine, setPerLine] = useLocalState(APP, 'perLine', true);
  const [delimSrc, setDelimSrc] = useLocalState(APP, 'delimiter', '');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const { re, error } = useMemo(() => parseDelimiter(delimSrc), [delimSrc]);
  const results = useMemo(
    () => CASES.map((c) => ({ ...c, text: input ? convert(input, c.id, { perLine, delimiter: re }) : '' })),
    [input, perLine, re],
  );

  async function copy(id: string, text: string) {
    if (await copyText(text)) {
      setCopied(id);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1400);
    }
  }

  function download() {
    const body = results.map((r) => `# ${r.label}\n${r.text}`).join('\n\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'case-converter.txt' });
    a.click();
    URL.revokeObjectURL(url);
  }

  const lines = input ? input.split('\n').length : 0;

  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="cc-input">Your text</label>
        <textarea id="cc-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or paste text. Each line converts on its own." spellCheck={false} />
      </div>

      <div className="tool-actions">
        <button type="button" className="btn" onClick={() => setInput(EXAMPLE)}>Insert example</button>
        <button type="button" className="btn" onClick={() => setInput('')} disabled={!input}>Clear</button>
        <button type="button" className="btn" onClick={download} disabled={!input}>Download all as .txt</button>
        <SettingsDrawer label="Options" title="Case Converter options">
          <label className="check"><input type="checkbox" checked={perLine} onChange={(e) => setPerLine(e.target.checked)} /> Convert each line separately</label>
          <div className="field">
            <label htmlFor="cc-delim">Split words on this regex (code cases)</label>
            <input id="cc-delim" type="text" className="code" value={delimSrc} onChange={(e) => setDelimSrc(e.target.value)} placeholder="e.g. [\s,;|]+" spellCheck={false} />
            {error ? <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p> : <p>Leave empty to split on spaces, symbols and camelCase boundaries.</p>}
          </div>
        </SettingsDrawer>
        {input && <span className="stat" aria-live="polite">{lines} {lines === 1 ? 'line' : 'lines'}, {input.length} characters</span>}
      </div>

      {input ? (
        <div className="result-list">
          {results.map((r) => (
            <div className="result" key={r.id}>
              <div className="result-top">
                <span>{r.label}</span>
                <button type="button" className="btn small" onClick={() => copy(r.id, r.text)} aria-label={`Copy ${r.label}`}>
                  {copied === r.id ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className={r.code ? 'code' : undefined}>{r.text}</pre>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">Type or paste text above and every case appears here as you type.</div>
      )}
    </div>
  );
}
