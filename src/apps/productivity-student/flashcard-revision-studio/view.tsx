'use client';
import { useEffect, useMemo, useState } from 'react';
import { downloadText } from '@/components/shared/CopyButton';
import { Seg } from '@/components/shared/Segmented';
import { useLocalState } from '@/lib/useLocalState';

interface Card { id: number; front: string; back: string; box: number; due: number }
interface Deck { id: number; name: string; cards: Card[] }
const DAY = 864e5, today = () => Math.floor(Date.now() / DAY), GAP = [0, 1, 2, 4, 8, 16];
let nid = 1;
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export default function View() {
  const [decks, setDecks] = useLocalState<Deck[]>('flashcard-revision-studio', 'decks', []);
  const [cur, setCur] = useLocalState<number | null>('flashcard-revision-studio', 'current', null);
  const [mode, setMode] = useState<'study' | 'edit'>('edit');
  const [name, setName] = useState(''), [front, setFront] = useState(''), [back, setBack] = useState(''), [bulk, setBulk] = useState(''), [showBulk, setShowBulk] = useState(false);
  const [queue, setQueue] = useState<number[]>([]), [flip, setFlip] = useState(false), [all, setAll] = useState(false), [seen, setSeen] = useState({ yes: 0, no: 0 });
  const deck = decks.find((d) => d.id === cur) ?? null;
  const upd = (f: (d: Deck) => Deck) => setDecks((p) => p.map((d) => (d.id === cur ? f(d) : d)));

  const due = useMemo(() => (deck ? deck.cards.filter((c) => all || c.due <= today()).map((c) => c.id) : []), [deck, all]);
  const begin = () => { setQueue(shuffle(due)); setFlip(false); setSeen({ yes: 0, no: 0 }); setMode('study'); };
  const card = deck?.cards.find((c) => c.id === queue[0]);

  const grade = (knew: boolean) => {
    if (!card) return; setSeen((s) => ({ yes: s.yes + (knew ? 1 : 0), no: s.no + (knew ? 0 : 1) }));
    upd((d) => ({ ...d, cards: d.cards.map((c) => (c.id === card.id ? { ...c, box: knew ? Math.min(5, c.box + 1) : 1, due: today() + GAP[knew ? Math.min(5, c.box + 1) : 1] } : c)) }));
    setQueue((q) => { const r = q.slice(1); if (!knew) r.splice(Math.min(r.length, 3), 0, q[0]); return r; }); setFlip(false);
  };
  useEffect(() => {
    if (mode !== 'study') return;
    const k = (e: KeyboardEvent) => { if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return; if (e.code === 'Space') { e.preventDefault(); setFlip((f) => !f); } else if (flip && (e.key === 'ArrowRight' || e.key === '1')) grade(true); else if (flip && (e.key === 'ArrowLeft' || e.key === '2')) grade(false); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  const addDeck = (e: React.FormEvent) => { e.preventDefault(); const n = name.trim(); if (!n) return; const d = { id: Date.now(), name: n, cards: [] }; setDecks([...decks, d]); setCur(d.id); setName(''); setMode('edit'); };
  const addCard = (e: React.FormEvent) => { e.preventDefault(); if (!front.trim() || !back.trim()) return; upd((d) => ({ ...d, cards: [...d.cards, { id: Date.now() + nid++, front: front.trim(), back: back.trim(), box: 0, due: 0 }] })); setFront(''); setBack(''); };
  const importBulk = () => { const rows = bulk.split('\n').map((l) => l.split(/\t|;|,(?=[^,]*$)/)).filter((r) => r.length >= 2 && r[0].trim() && r[1].trim()); upd((d) => ({ ...d, cards: [...d.cards, ...rows.map((r) => ({ id: Date.now() + nid++, front: r[0].trim(), back: r.slice(1).join(', ').trim(), box: 0, due: 0 }))] })); setBulk(''); setShowBulk(false); };

  return (
    <div className="panel">
      <form className="tool-actions" onSubmit={addDeck}>
        <div className="field" style={{ flex: 1, minWidth: 220 }}><label htmlFor="fc-d">New deck</label><input id="fc-d" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="French verbs" /></div>
        <button type="submit" className="btn" style={{ alignSelf: 'flex-end' }}>Make deck</button>
      </form>
      {decks.length > 0 && <div className="fc-decks">{decks.map((d) => <button key={d.id} type="button" className={`fc-deck${d.id === cur ? ' on' : ''}`} aria-pressed={d.id === cur} onClick={() => { setCur(d.id); setMode('edit'); }}><b className="d">{d.name}</b><small>{d.cards.length} cards · {d.cards.filter((c) => c.due <= today()).length} due</small></button>)}</div>}
      {!deck ? <div className="empty">{decks.length ? 'Choose a deck.' : 'Make your first deck above.'}</div> : (
        <>
          <div className="tool-actions">
            <Seg<'study' | 'edit'> value={mode} onChange={(m) => (m === 'study' ? begin() : setMode('edit'))} label="Mode" options={[{ value: 'edit', label: 'Cards' }, { value: 'study', label: 'Revise' }]} />
            <label className="check"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Revise every card, not only the ones that are due</label>
          </div>
          {mode === 'edit' ? (
            <>
              <form className="fc-add" onSubmit={addCard}>
                <div className="field"><label htmlFor="fc-f">Front</label><textarea id="fc-f" style={{ minHeight: 80 }} value={front} onChange={(e) => setFront(e.target.value)} /></div>
                <div className="field"><label htmlFor="fc-b">Back</label><textarea id="fc-b" style={{ minHeight: 80 }} value={back} onChange={(e) => setBack(e.target.value)} /></div>
                <button type="submit" className="btn primary">Add card</button>
              </form>
              <div className="tool-actions">
                <button type="button" className="btn small" onClick={() => setShowBulk(!showBulk)}>{showBulk ? 'Close' : 'Paste many cards'}</button>
                <button type="button" className="btn small" disabled={!deck.cards.length} onClick={() => downloadText(`${deck.name}.csv`, deck.cards.map((c) => `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}"`).join('\n'), 'text/csv')}>Download .csv</button>
                <button type="button" className="btn small" onClick={() => { if (confirm(`Delete the deck “${deck.name}”?`)) { setDecks(decks.filter((d) => d.id !== deck.id)); setCur(null); } }}>Delete deck</button>
              </div>
              {showBulk && <div className="field"><label htmlFor="fc-bulk">One card per line: front, then a tab or semicolon, then back</label><textarea id="fc-bulk" className="code" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={'bonjour;hello\nmerci;thank you'} /><div className="tool-actions"><button type="button" className="btn" onClick={importBulk} disabled={!bulk.trim()}>Add these cards</button></div></div>}
              <ul className="fc-list">{deck.cards.map((c) => <li key={c.id}><input type="text" aria-label="Front" value={c.front} onChange={(e) => upd((d) => ({ ...d, cards: d.cards.map((x) => (x.id === c.id ? { ...x, front: e.target.value } : x)) }))} /><input type="text" aria-label="Back" value={c.back} onChange={(e) => upd((d) => ({ ...d, cards: d.cards.map((x) => (x.id === c.id ? { ...x, back: e.target.value } : x)) }))} /><span className="tag" title="How well you know it">Box {c.box}</span><button type="button" className="btn small" aria-label="Delete card" onClick={() => upd((d) => ({ ...d, cards: d.cards.filter((x) => x.id !== c.id) }))}>✕</button></li>)}</ul>
            </>
          ) : card ? (
            <div className="fc-study">
              <div className="stat">{queue.length} left · {seen.yes} right · {seen.no} again</div>
              <button type="button" className={`fc-card${flip ? ' back' : ''}`} onClick={() => setFlip((f) => !f)} aria-label={flip ? 'Answer. Press to see the question.' : 'Question. Press to see the answer.'}><span className="d">{flip ? 'Answer' : 'Question'}</span><b>{flip ? card.back : card.front}</b></button>
              {flip ? <div className="tool-actions" style={{ justifyContent: 'center' }}><button type="button" className="btn" onClick={() => grade(false)}>Again (←)</button><button type="button" className="btn primary" onClick={() => grade(true)}>I knew it (→)</button></div> : <div className="tool-actions" style={{ justifyContent: 'center' }}><button type="button" className="btn primary" onClick={() => setFlip(true)}>Show the answer (Space)</button></div>}
            </div>
          ) : <div className="empty">{deck.cards.length ? `Nothing due. ${seen.yes + seen.no ? `You got ${seen.yes} right and ${seen.no} to try again.` : ''}` : 'Add some cards first.'}<div className="tool-actions" style={{ justifyContent: 'center', marginTop: 12 }}>{deck.cards.length > 0 && <button type="button" className="btn" onClick={() => { setAll(true); setQueue(shuffle(deck.cards.map((c) => c.id))); setFlip(false); }}>Revise everything anyway</button>}</div></div>}
        </>
      )}
    </div>
  );
}
