import type { Row, Seg } from '@/lib/diffRows';

const Segs = ({ segs }: { segs: Seg[] }) => <>{segs.map((s, i) => (s.hl ? <mark key={i}>{s.t}</mark> : <span key={i}>{s.t}</span>))}</>;

/** Side-by-side line diff. Colour is never the only signal: the gutter carries - and + marks. */
export function LineDiff({ rows }: { rows: Row[] }) {
  if (!rows.length) return <div className="empty">Both sides are empty.</div>;
  return (
    <div className="diff code" role="table" aria-label="Side-by-side line diff">
      {rows.map((r, i) => (
        <div className={`diff-row ${r.kind}`} role="row" key={i}>
          <div className="diff-cell l" role="cell">
            <span className="gut">{r.l ? r.l.n : ''}{r.kind === 'del' || r.kind === 'mod' ? ' -' : ''}</span>
            <span className="txt">{r.l && <Segs segs={r.l.segs} />}</span>
          </div>
          <div className="diff-cell r" role="cell">
            <span className="gut">{r.r ? r.r.n : ''}{r.kind === 'add' || r.kind === 'mod' ? ' +' : ''}</span>
            <span className="txt">{r.r && <Segs segs={r.r.segs} />}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InlineDiff({ left, right, leftTitle = 'Original', rightTitle = 'Changed' }: { left: Seg[]; right: Seg[]; leftTitle?: string; rightTitle?: string }) {
  return (
    <div className="split">
      <div className="result"><div className="result-top"><span>{leftTitle}</span></div><pre className="code inline-diff del"><Segs segs={left} /></pre></div>
      <div className="result"><div className="result-top"><span>{rightTitle}</span></div><pre className="code inline-diff add"><Segs segs={right} /></pre></div>
    </div>
  );
}
