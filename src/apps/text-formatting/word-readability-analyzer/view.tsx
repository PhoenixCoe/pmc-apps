'use client';
import { useMemo } from 'react';
import { Segmented } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { analyse, easeLabel, keywordTable } from './utils';

const APP = 'word-readability-analyzer';
const fmtTime = (m: number) => (m < 1 ? `${Math.max(1, Math.round(m * 60))} sec` : `${m.toFixed(m < 10 ? 1 : 0)} min`);

export default function View() {
  const [text, setText] = useLocalState(APP, 'text', '');
  const [gram, setGram] = useLocalState<'1' | '2' | '3'>(APP, 'gram', '1');
  const [stop, setStop] = useLocalState(APP, 'stop', false);
  const a = useMemo(() => analyse(text), [text]);
  const kw = useMemo(() => keywordTable(text, Number(gram) as 1 | 2 | 3, stop), [text, gram, stop]);

  const tiles: [string, string][] = [
    ['Words', a.words.toLocaleString('en-GB')], ['Characters', a.characters.toLocaleString('en-GB')],
    ['Without spaces', a.charactersNoSpaces.toLocaleString('en-GB')], ['Sentences', a.sentences.toLocaleString('en-GB')],
    ['Paragraphs', a.paragraphs.toLocaleString('en-GB')], ['Reading time', fmtTime(a.readingMinutes)], ['Speaking time', fmtTime(a.speakingMinutes)],
  ];

  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="wr-in">Your text</label>
        <textarea id="wr-in" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste your writing. Counts update as you type." style={{ minHeight: 220 }} />
      </div>
      <div className="tool-actions"><button type="button" className="btn" onClick={() => setText('')} disabled={!text}>Clear</button></div>

      <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }} aria-live="polite">
        {tiles.map(([k, v]) => (
          <div className="result" key={k}><div className="result-top"><span>{k}</span></div><pre style={{ fontSize: '1.4rem', minHeight: 0 }}>{v}</pre></div>
        ))}
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2>Readability</h2>
        {a.fleschEase === null ? (
          <p className="note">Write at least five words to see readability scores.</p>
        ) : (
          <>
            <div className="split">
              <div className="result"><div className="result-top"><span>Flesch reading ease</span></div><pre style={{ fontSize: '1.4rem', minHeight: 0 }}>{Math.max(0, Math.min(100, a.fleschEase)).toFixed(1)} / 100</pre></div>
              <div className="result"><div className="result-top"><span>Flesch-Kincaid grade</span></div><pre style={{ fontSize: '1.4rem', minHeight: 0 }}>{Math.max(0, a.gradeLevel ?? 0).toFixed(1)} (reading age about {Math.max(5, Math.round((a.gradeLevel ?? 0) + 5))})</pre></div>
            </div>
            <div className="bar" aria-hidden><i style={{ width: `${Math.max(0, Math.min(100, a.fleschEase))}%` }} /></div>
            <p>{easeLabel(a.fleschEase)} You average {a.avgWordsPerSentence.toFixed(1)} words per sentence and {a.avgSyllablesPerWord.toFixed(2)} syllables per word.</p>
            <p className="note">Scores use English syllable rules and are an estimate. The grade is the US school grade; add 5 for an approximate age.</p>
          </>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2>Keyword density</h2>
        <div className="row">
          <Segmented label="Show" value={gram} onChange={setGram} options={[{ value: '1', label: 'Words' }, { value: '2', label: '2-word phrases' }, { value: '3', label: '3-word phrases' }]} />
          <label className="check"><input type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} /> Include common words (the, of, and)</label>
        </div>
        {kw.length ? (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Term</th><th className="num">Uses</th><th className="num">Density</th><th aria-hidden style={{ width: '30%' }} /></tr></thead>
              <tbody>{kw.map((r) => (
                <tr key={r.term}><td className="code">{r.term}</td><td className="num">{r.count}</td><td className="num">{r.percent.toFixed(1)}%</td><td aria-hidden><div className="bar" style={{ height: 10 }}><i style={{ width: `${Math.min(100, r.percent * 5)}%` }} /></div></td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="empty">{text ? 'No repeated terms yet. Write more, or switch on common words.' : 'Keywords appear here once you write something.'}</div>}
      </section>
    </div>
  );
}
