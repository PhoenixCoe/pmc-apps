'use client';
import { useMemo } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { Segmented } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';
import { generate, type Flavour, type Unit } from './utils';

const APP = 'lorem-generator';

export default function View() {
  const [flavour, setFlavour] = useLocalState<Flavour>(APP, 'flavour', 'latin');
  const [unit, setUnit] = useLocalState<Unit>(APP, 'unit', 'paragraphs');
  const [count, setCount] = useLocalState(APP, 'count', 3);
  const [classic, setClassic] = useLocalState(APP, 'classic', true);
  const [html, setHtml] = useLocalState(APP, 'html', false);
  const [seed, setSeed] = useLocalState(APP, 'seed', 1);

  const text = useMemo(() => generate({ flavour, unit, count, seed, classicStart: classic, html }), [flavour, unit, count, seed, classic, html]);
  const wordCount = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  return (
    <div className="panel">
      <div className="row">
        <Segmented label="Style" value={flavour} onChange={setFlavour} options={[{ value: 'latin', label: 'Latin' }, { value: 'startup', label: 'Tech startup' }, { value: 'legal', label: 'Legal' }, { value: 'medical', label: 'Medical' }]} />
        <Segmented label="Make" value={unit} onChange={setUnit} options={[{ value: 'paragraphs', label: 'Paragraphs' }, { value: 'sentences', label: 'Sentences' }, { value: 'words', label: 'Words' }]} />
        <div className="field" style={{ width: 110 }}>
          <label htmlFor="lg-n">How many</label>
          <input id="lg-n" type="number" min={1} max={unit === 'words' ? 5000 : 200} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} />
        </div>
      </div>
      <div className="tool-actions">
        {flavour === 'latin' && <label className="check"><input type="checkbox" checked={classic} onChange={(e) => setClassic(e.target.checked)} /> Start with &ldquo;Lorem ipsum&rdquo;</label>}
        <label className="check"><input type="checkbox" checked={html} onChange={(e) => setHtml(e.target.checked)} /> Wrap in &lt;p&gt; tags</label>
        <button type="button" className="btn primary" onClick={() => setSeed(Math.floor(Math.random() * 1e9))}>Write new text</button>
        <span className="stat" aria-live="polite">{wordCount.toLocaleString('en-GB')} words</span>
      </div>
      <CodeBox title="Placeholder text" text={text} />
    </div>
  );
}
