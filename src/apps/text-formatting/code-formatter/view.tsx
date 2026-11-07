'use client';
import { useEffect, useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { LineDiff } from '@/components/shared/DiffView';
import { Segmented } from '@/components/shared/Segmented';
import { Select } from '@/components/shared/Select';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { lineRows } from '@/lib/diffRows';
import { useLocalState } from '@/lib/useLocalState';
import { defaultOptions, formatCode, type FormatOptions, type FormatResult, type Lang } from './utils';

const APP = 'code-formatter';
const LANGS: { value: Lang; label: string }[] = [
  { value: 'js', label: 'JavaScript' }, { value: 'ts', label: 'TypeScript' }, { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' }, { value: 'python', label: 'Python' }, { value: 'sql', label: 'SQL' },
];
const EXAMPLES: Record<Lang, string> = {
  js: "const add=(a,b)=>{return a+b}\nfunction greet(name){console.log('Hello, '+name)}\nconst items=[1,2,3].map(n=>n*2).filter(n=>n>2)",
  ts: "interface User{id:number;name:string}\nconst byId=(users:User[],id:number):User|undefined=>users.find(u=>u.id===id)",
  html: '<div class="card"><h2>Title</h2><p>Some <b>bold</b> text</p><ul><li>One</li><li>Two</li></ul></div>',
  css: '.card{display:flex;gap:8px;padding:12px 16px}.card:hover{background:#eee}@media (max-width:600px){.card{flex-direction:column}}',
  python: "def greet(name):\n\tif name:\n\t    print('Hello, '+name)   \n\telse:\n\t    print('Hi')\n\n\n\n\nclass Box:\n  def __init__(self,w,h):\n    self.w=w\n    self.h=h",
  sql: "select u.id,u.name,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.active=1 group by u.id,u.name having count(o.id)>2 order by orders desc",
};

export default function View() {
  const [lang, setLang] = useLocalState<Lang>(APP, 'lang', 'js');
  const [code, setCode] = useLocalState(APP, 'code', '');
  const [o, setO] = useLocalState<FormatOptions>(APP, 'options', defaultOptions);
  const [result, setResult] = useState<FormatResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const set = <K extends keyof FormatOptions>(k: K, v: FormatOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const indent = o.useTabs ? 'tab' : String(o.tabWidth);

  useEffect(() => {
    let dead = false;
    setBusy(true);
    const id = setTimeout(async () => {
      const r = await formatCode(lang, code, o);
      if (!dead) { setResult(r); setBusy(false); }
    }, 250);
    return () => { dead = true; clearTimeout(id); };
  }, [lang, code, o]);

  const text = result?.ok ? result.text : '';
  const rows = useMemo(() => (showDiff && text ? lineRows(code, text) : []), [showDiff, code, text]);
  const issues = result?.issues ?? [];
  const isCode = lang !== 'python' && lang !== 'sql';

  return (
    <div className="panel">
      <div className="row">
        <Segmented label="Language" value={lang} onChange={setLang} options={LANGS} />
        <Segmented label="Indent with" value={indent} onChange={(v) => (v === 'tab' ? set('useTabs', true) : setO((p) => ({ ...p, useTabs: false, tabWidth: Number(v) })))}
          options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: '8', label: '8 spaces' }, { value: 'tab', label: 'Tabs' }]} />
      </div>
      <div className="tool-actions">
        <button type="button" className="btn" onClick={() => setCode(EXAMPLES[lang])}>Insert example</button>
        <button type="button" className="btn" onClick={() => setCode('')} disabled={!code}>Clear</button>
        <label className="check"><input type="checkbox" checked={showDiff} onChange={(e) => setShowDiff(e.target.checked)} /> Show what changed</label>
        <SettingsDrawer label="Style options" title="Style options">
          <div className="field"><label htmlFor="cf-w">Line width</label><input id="cf-w" type="number" min={20} max={240} value={o.printWidth} onChange={(e) => set('printWidth', Math.max(20, Number(e.target.value) || 80))} /></div>
          {isCode && (
            <>
              <label className="check"><input type="checkbox" checked={o.semi} onChange={(e) => set('semi', e.target.checked)} disabled={lang === 'html' || lang === 'css'} /> Semicolons at line ends (JavaScript, TypeScript)</label>
              <label className="check"><input type="checkbox" checked={o.singleQuote} onChange={(e) => set('singleQuote', e.target.checked)} /> Single quotes</label>
              <Segmented label="Trailing commas" value={o.trailingComma} onChange={(v) => set('trailingComma', v)} options={[{ value: 'none', label: 'None' }, { value: 'es5', label: 'Where valid in ES5' }, { value: 'all', label: 'Everywhere' }]} />
            </>
          )}
          {lang === 'sql' && (
            <>
              <div className="field"><label htmlFor="cf-d">SQL dialect</label>
                <Select id="cf-d" value={o.dialect} onChange={(v) => set('dialect', v)} options={[
                  { value: 'sql', label: 'Standard SQL' }, { value: 'postgresql', label: 'PostgreSQL' }, { value: 'mysql', label: 'MySQL' }, { value: 'sqlite', label: 'SQLite' }, { value: 'transactsql', label: 'SQL Server' }]} /></div>
              <Segmented label="Keywords" value={o.keywordCase} onChange={(v) => set('keywordCase', v)} options={[{ value: 'upper', label: 'UPPER' }, { value: 'lower', label: 'lower' }, { value: 'preserve', label: 'Keep' }]} />
            </>
          )}
        </SettingsDrawer>
        {busy && <span className="stat" role="status">Formatting</span>}
      </div>

      <div className="split">
        <div className="field">
          <label htmlFor="cf-in">Your code</label>
          <textarea id="cf-in" className="code" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} placeholder="Paste code here" style={{ minHeight: 360, whiteSpace: 'pre', overflowX: 'auto' }} wrap="off" />
        </div>
        <CodeBox title="Formatted" text={text} empty={result && !result.ok ? 'Fix the problem below to see the result.' : 'The formatted code appears here.'} />
      </div>

      {lang === 'python' && <p className="note">Python is tidied rather than rewritten: indentation, trailing spaces and blank lines are fixed and common mistakes are flagged. Line wrapping and quote style are left alone.</p>}

      {issues.length > 0 && (
        <section aria-label="Problems found" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2>{result?.ok ? `${issues.length} ${issues.length === 1 ? 'thing' : 'things'} to check` : 'Syntax error'}</h2>
          <div className="table-wrap">
            <table className="data"><thead><tr><th className="num">Line</th><th>Problem</th></tr></thead>
              <tbody>{issues.map((i, k) => <tr key={k}><td className="num code">{i.line ?? '-'}{i.column != null ? `:${i.column}` : ''}</td><td className={result?.ok ? undefined : 'bad'}>{i.message}</td></tr>)}</tbody></table>
          </div>
          {result && !result.ok && result.frame && <pre className="code result" style={{ padding: 12 }}>{result.frame}</pre>}
        </section>
      )}
      {code.trim() && result?.ok && issues.length === 0 && <p className="note ok" role="status"><strong>No problems found.</strong></p>}

      {showDiff && text && <LineDiff rows={rows} />}
    </div>
  );
}
