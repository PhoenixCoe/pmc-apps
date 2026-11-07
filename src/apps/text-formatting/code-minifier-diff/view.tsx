'use client';
import { useEffect, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { InlineDiff } from '@/components/shared/DiffView';
import { Segmented } from '@/components/shared/Segmented';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { inlineSegments } from '@/lib/diffRows';
import { useLocalState } from '@/lib/useLocalState';
import { byteLength, defaultMinifyOptions, gzipSize, minify, type Lang, type MinifyOptions, type MinifyResult } from './utils';

const APP = 'code-minifier-diff';
const COMPARE_LIMIT = 20000;
const EXAMPLES: Record<Lang, string> = {
  js: '// Add two numbers\nfunction add(first, second) {\n  /* the sum */\n  const total = first + second;\n  return total;\n}\n\nconsole.log(add(2, 3));\n',
  css: '/* Card */\n.card {\n  display: flex;\n  gap: 8px;\n  padding: 12px 16px;\n  width: calc(100% - 20px);\n}\n\n.card > p {\n  margin: 0 auto;\n}\n',
  html: '<div class="card">\n  <!-- heading -->\n  <h2>Title</h2>\n  <p>Some   <b>bold</b> text</p>\n</div>\n',
  json: '{\n  "name": "PMC Apps",\n  "tags": [ "text", "files" ],\n  "count": 60\n}\n',
};
const fmt = (n: number) => `${n.toLocaleString('en-GB')} B`;

export default function View() {
  const [lang, setLang] = useLocalState<Lang>(APP, 'lang', 'js');
  const [code, setCode] = useLocalState(APP, 'code', '');
  const [o, setO] = useLocalState<MinifyOptions>(APP, 'options', defaultMinifyOptions);
  const [view, setView] = useState<'result' | 'removed'>('result');
  const [result, setResult] = useState<MinifyResult | null>(null);
  const [gz, setGz] = useState<[number | null, number | null] | null>(null);
  const set = <K extends keyof MinifyOptions>(k: K, v: MinifyOptions[K]) => setO((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    const id = setTimeout(async () => {
      const r = await minify(lang, code, o);
      if (dead) return;
      setResult(r);
      if (r.ok && r.text) { const g = await Promise.all([gzipSize(code), gzipSize(r.text)]); if (!dead) setGz([g[0], g[1]]); } else setGz(null);
    }, 250);
    return () => { dead = true; clearTimeout(id); };
  }, [lang, code, o]);

  const text = result?.ok ? result.text : '';
  const before = byteLength(code), after = byteLength(text);
  const saved = Math.max(0, before - after);
  const pct = before ? Math.round((saved / before) * 100) : 0;
  const canCompare = code.length <= COMPARE_LIMIT;
  const seg = view === 'removed' && canCompare && text ? inlineSegments(code, text, 'chars') : null;

  return (
    <div className="panel">
      <Segmented label="Language" value={lang} onChange={setLang} options={[{ value: 'js', label: 'JavaScript' }, { value: 'css', label: 'CSS' }, { value: 'html', label: 'HTML' }, { value: 'json', label: 'JSON' }]} />
      <div className="tool-actions">
        <button type="button" className="btn" onClick={() => setCode(EXAMPLES[lang])}>Insert example</button>
        <button type="button" className="btn" onClick={() => setCode('')} disabled={!code}>Clear</button>
        <SettingsDrawer label="Options" title="Minify options">
          {lang === 'js' && (
            <>
              <Segmented label="JavaScript mode" value={o.jsMode} onChange={(v) => set('jsMode', v)} options={[{ value: 'whitespace', label: 'Whitespace and comments only' }, { value: 'full', label: 'Full (shorter names)' }]} />
              <label className="check"><input type="checkbox" checked={o.jsModule} onChange={(e) => set('jsModule', e.target.checked)} /> This is an ES module (uses import or export)</label>
            </>
          )}
          {(lang === 'js' || lang === 'css') && <label className="check"><input type="checkbox" checked={o.keepLicence} onChange={(e) => set('keepLicence', e.target.checked)} /> Keep licence comments (/*! ... */)</label>}
          {lang === 'html' && <label className="check"><input type="checkbox" checked={o.htmlComments} onChange={(e) => set('htmlComments', e.target.checked)} /> Remove HTML comments</label>}
          {lang === 'json' && <p>JSON is minified by reading it and writing it back with no spacing.</p>}
        </SettingsDrawer>
      </div>

      <div className="split">
        <div className="field">
          <label htmlFor="mn-in">Your code</label>
          <textarea id="mn-in" className="code" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} wrap="off" placeholder="Paste code here" style={{ minHeight: 300, whiteSpace: 'pre', overflowX: 'auto' }} />
        </div>
        <CodeBox title="Minified" text={text} empty={result && !result.ok ? 'Fix the problem below to see the result.' : 'The minified code appears here.'} />
      </div>

      {result && !result.ok && <p className="note err" role="alert"><strong>This can&rsquo;t be read.</strong> {result.line ? `Line ${result.line}${result.column != null ? `, column ${result.column}` : ''}: ` : ''}{result.message}</p>}

      {text && (
        <section aria-label="Size" style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-live="polite">
          <p className="tool-actions"><span className="stat">{fmt(before)} before</span><span className="stat">{fmt(after)} after</span><span className="stat">{fmt(saved)} saved ({pct}%)</span>
            {gz && gz[0] !== null && gz[1] !== null && <span className="stat">Gzipped: {fmt(gz[0])} to {fmt(gz[1])}</span>}</p>
          <div className="bar" aria-hidden><i style={{ width: `${100 - pct}%` }} /></div>
          <Segmented label="Compare" value={view} onChange={setView} options={[{ value: 'result', label: 'Result only' }, { value: 'removed', label: 'What was removed' }]} />
          {view === 'removed' && (canCompare
            ? seg && <InlineDiff left={seg.left} right={seg.right} leftTitle="Before (removed parts marked)" rightTitle="After" />
            : <p className="note">The before and after view is limited to {COMPARE_LIMIT.toLocaleString('en-GB')} characters so the page stays fast. The size figures above still cover everything.</p>)}
        </section>
      )}
    </div>
  );
}
