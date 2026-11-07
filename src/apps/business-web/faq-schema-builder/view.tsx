'use client';
import { useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';

interface Q { id: number; q: string; a: string }
type Out = 'html' | 'json' | 'both';
const START: Q[] = [{ id: 1, q: 'When do you open?', a: 'We are open every day from 8am to 6pm.' }, { id: 2, q: 'Can I order ahead?', a: 'Yes. Call us or use the order form and collect it in store.' }];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function View() {
  const [list, setList] = useLocalState<Q[]>('faq-schema-builder', 'list', START), [out, setOut] = useState<Out>('both');
  const ok = list.filter((x) => x.q.trim() && x.a.trim());
  const set = (id: number, p: Partial<Q>) => setList(list.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const move = (i: number, d: number) => { const n = [...list], j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setList(n); };
  const html = useMemo(() => `<div class="faq">\n${ok.map((x) => `  <details>\n    <summary>${esc(x.q.trim())}</summary>\n    <p>${esc(x.a.trim())}</p>\n  </details>`).join('\n')}\n</div>\n`, [ok]);
  const json = useMemo(() => `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: ok.map((x) => ({ '@type': 'Question', name: x.q.trim(), acceptedAnswer: { '@type': 'Answer', text: x.a.trim() } })) }, null, 2)}\n</script>\n`, [ok]);
  return (
    <div className="split">
      <div className="panel">
        {list.map((x, i) => (
          <div key={x.id} className="fq-item">
            <div className="field"><label htmlFor={`fq-q${x.id}`}>Question {i + 1}</label><input id={`fq-q${x.id}`} type="text" value={x.q} onChange={(e) => set(x.id, { q: e.target.value })} /></div>
            <div className="field"><label htmlFor={`fq-a${x.id}`}>Answer</label><textarea id={`fq-a${x.id}`} style={{ minHeight: 70 }} value={x.a} onChange={(e) => set(x.id, { a: e.target.value })} /></div>
            <div className="tool-actions"><button type="button" className="btn small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button><button type="button" className="btn small" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">↓</button><button type="button" className="btn small" onClick={() => setList(list.filter((y) => y.id !== x.id))}>Delete</button></div>
          </div>
        ))}
        <div className="tool-actions"><button type="button" className="btn primary" onClick={() => setList([...list, { id: Date.now(), q: '', a: '' }])}>+ Add a question</button></div>
      </div>
      <div className="panel">
        <Seg<Out> value={out} onChange={setOut} label="Show" options={[{ value: 'both', label: 'Both' }, { value: 'html', label: 'Page code' }, { value: 'json', label: 'Search data' }]} />
        {ok.length === 0 ? <p className="empty">Fill in a question and answer.</p> : <>
          <div className="result fq-prev">{ok.map((x) => <details key={x.id}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div>
          {out !== 'json' && <CodeBox title="HTML" text={html} />}
          {out !== 'html' && <CodeBox title="JSON-LD" text={json} />}
        </>}
      </div>
    </div>
  );
}
