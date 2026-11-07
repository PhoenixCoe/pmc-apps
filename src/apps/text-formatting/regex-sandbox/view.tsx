'use client';
import { useEffect, useMemo, useState } from 'react';
import { CopyButton } from '@/components/shared/CopyButton';
import { useLocalState } from '@/lib/useLocalState';
import { explainRegex, runInWorker, type RegexResult } from './utils';

const APP = 'regex-sandbox';
const FLAGS: [string, string][] = [['g', 'Global: find every match'], ['i', 'Ignore case'], ['m', 'Multiline: ^ and $ match each line'], ['s', 'Dot matches line breaks'], ['u', 'Unicode mode']];
const SAMPLE = { pattern: '(?<user>[\\w.]+)@(?<domain>[\\w-]+\\.[a-z]{2,})', text: 'Reach ada@example.com or grace.hopper@navy.mil today.' };

const GUIDE: [string, [string, string][]][] = [
  ['Characters', [['.', 'Any character except a line break'], ['\\d  \\w  \\s', 'Digit, word character, whitespace'], ['\\D  \\W  \\S', 'The opposite of each'], ['[abc]', 'a, b or c'], ['[^abc]', 'Anything except a, b or c'], ['[a-z]', 'A range of characters']]],
  ['Quantifiers', [['*', 'Zero or more'], ['+', 'One or more'], ['?', 'Zero or one'], ['{3}  {3,}  {3,5}', 'Exactly 3, 3 or more, 3 to 5'], ['*?  +?', 'Lazy: as few as possible']]],
  ['Anchors', [['^  $', 'Start and end of text (or line with m)'], ['\\b  \\B', 'Word boundary, not a word boundary']]],
  ['Groups', [['(abc)', 'Capture group'], ['(?:abc)', 'Group without capturing'], ['(?<name>abc)', 'Named group'], ['\\1  \\k<name>', 'Repeat what a group matched'], ['a|b', 'a or b']]],
  ['Lookaround', [['(?=abc)  (?!abc)', 'Followed by, not followed by'], ['(?<=abc)  (?<!abc)', 'Preceded by, not preceded by']]],
];

export default function View() {
  const [pattern, setPattern] = useLocalState(APP, 'pattern', '');
  const [flags, setFlags] = useLocalState(APP, 'flags', 'g');
  const [text, setText] = useLocalState(APP, 'text', '');
  const [replacement, setReplacement] = useLocalState(APP, 'replacement', '');
  const [useReplace, setUseReplace] = useLocalState(APP, 'useReplace', false);
  const [result, setResult] = useState<RegexResult | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!pattern) { setResult(null); setSlow(false); return; }
    let run: ReturnType<typeof runInWorker> | null = null;
    const id = setTimeout(() => {
      run = runInWorker([pattern, flags, text, 1000, useReplace ? replacement : null]);
      run.promise.then((r) => { if (r === 'timeout') { setSlow(true); setResult(null); } else { setSlow(false); setResult(r); } });
    }, 150);
    return () => { clearTimeout(id); run?.cancel(); };
  }, [pattern, flags, text, replacement, useReplace]);

  const toggle = (f: string) => setFlags(flags.includes(f) ? flags.replace(f, '') : flags + f);
  const explained = useMemo(() => (pattern ? explainRegex(pattern) : []), [pattern]);

  const pieces = useMemo(() => {
    if (!result || result.error) return [{ t: text, hl: false }];
    const out: { t: string; hl: boolean }[] = [];
    let at = 0;
    for (const m of result.matches) {
      if (m.index < at || m.text === '') continue;
      if (m.index > at) out.push({ t: text.slice(at, m.index), hl: false });
      out.push({ t: m.text, hl: true });
      at = m.index + m.text.length;
    }
    if (at < text.length) out.push({ t: text.slice(at), hl: false });
    return out;
  }, [result, text]);

  const count = result?.matches.length ?? 0;
  const groupCount = Math.max(0, ...(result?.matches.map((m) => m.groups.length) ?? [0]));

  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="rx-p">Pattern</label>
        <div className="row" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
          <span className="code" style={{ alignSelf: 'center', fontSize: '1.3rem' }} aria-hidden>/</span>
          <input id="rx-p" type="text" className="code" value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} autoComplete="off" placeholder="e.g. \b\w+@\w+\.com\b" aria-invalid={!!result?.error} />
          <span className="code" style={{ alignSelf: 'center', fontSize: '1.3rem' }} aria-hidden>/{flags}</span>
        </div>
      </div>
      <div className="tool-actions" role="group" aria-label="Flags">
        {FLAGS.map(([f, label]) => (
          <label key={f} className="check" title={label}><input type="checkbox" checked={flags.includes(f)} onChange={() => toggle(f)} /> <span className="code">{f}</span> {label.split(':')[0]}</label>
        ))}
        <button type="button" className="btn small" onClick={() => { setPattern(SAMPLE.pattern); setText(SAMPLE.text); setFlags('g'); }}>Insert example</button>
      </div>

      {result?.error && <p className="note err" role="alert"><strong>Invalid pattern.</strong> {result.error}</p>}
      {slow && <p className="note err" role="alert"><strong>This pattern is taking too long.</strong> It was stopped to keep the page responsive. Nested repeats like <span className="code">(a+)+</span> can take exponential time on some text. Try making the inner part more specific.</p>}

      <div className="field">
        <label htmlFor="rx-t">Test text</label>
        <textarea id="rx-t" className="code" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} placeholder="Paste the text you want to search" style={{ minHeight: 140 }} />
      </div>

      {pattern && text && !result?.error && !slow && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-live="polite">
          <h2>{count === 0 ? 'No matches' : `${count}${result?.truncated ? '+' : ''} ${count === 1 ? 'match' : 'matches'}`}</h2>
          <pre className="code result" style={{ padding: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--paper)' }}>
            {pieces.map((p, i) => (p.hl ? <mark key={i} className="hl-match">{p.t}</mark> : <span key={i}>{p.t}</span>))}
          </pre>
          {count > 0 && (
            <div className="table-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="data">
                <thead><tr><th className="num">#</th><th className="num">At</th><th>Match</th>{Array.from({ length: groupCount }, (_, g) => <th key={g}>Group {g + 1}</th>)}</tr></thead>
                <tbody>{result!.matches.map((m, i) => (
                  <tr key={i}><td className="num">{i + 1}</td><td className="num">{m.index}</td><td className="code">{m.text === '' ? '(empty)' : m.text}</td>
                    {Array.from({ length: groupCount }, (_, g) => <td key={g} className="code">{m.groups[g] ?? <span style={{ opacity: 0.5 }}>none</span>}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {result?.matches.some((m) => m.named) && <p className="note">Named groups: {Object.keys(result.matches.find((m) => m.named)!.named!).map((k) => <span key={k} className="code" style={{ marginRight: 10 }}>{k}</span>)}</p>}
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label className="check"><input type="checkbox" checked={useReplace} onChange={(e) => setUseReplace(e.target.checked)} /> Try a replacement</label>
        {useReplace && (
          <>
            <div className="field"><label htmlFor="rx-r">Replace with (use $1, $&amp;, $&lt;name&gt;)</label><input id="rx-r" type="text" className="code" value={replacement} onChange={(e) => setReplacement(e.target.value)} spellCheck={false} /></div>
            {result?.replaced !== null && result?.replaced !== undefined && <div className="result"><div className="result-top"><span>Result</span><CopyButton text={result.replaced} /></div><pre className="code">{result.replaced}</pre></div>}
          </>
        )}
      </section>

      {explained.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2>What this pattern does</h2>
          <div className="table-wrap">
            <table className="data"><tbody>
              {explained.map((e, i) => (
                <tr key={i}><td className="code" style={{ paddingLeft: 12 + e.depth * 20, whiteSpace: 'nowrap' }}>{e.token}</td><td>{e.meaning}</td></tr>
              ))}
            </tbody></table>
          </div>
        </section>
      )}

      <details className="faq" style={{ gap: 0 }}>
        <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Quick reference</summary>
        <div className="split" style={{ marginTop: 14 }}>
          {GUIDE.map(([title, rows]) => (
            <div className="result" key={title}><div className="result-top"><span>{title}</span></div>
              <table className="data"><tbody>{rows.map(([s, d]) => <tr key={s}><td className="code" style={{ whiteSpace: 'nowrap' }}>{s}</td><td>{d}</td></tr>)}</tbody></table></div>
          ))}
        </div>
      </details>
    </div>
  );
}
