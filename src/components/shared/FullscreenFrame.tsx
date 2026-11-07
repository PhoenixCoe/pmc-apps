'use client';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';

/** A box that can fill the whole window (Esc to leave). For full-screen tools that are not a pan-and-zoom canvas. */
export function FullscreenFrame({ name, toolbar, children }: { name: string; toolbar?: React.ReactNode; children: React.ReactNode }) {
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!full) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false);
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [full]);
  return (
    <div className={`viewport-wrap ff${full ? ' is-full ff-full' : ''}`}>
      <div className="viewport-bar">
        {full && <span className="fs-brand"><Logo /><b className="d">{name}</b></span>}
        {toolbar}
        <span style={{ flex: 1 }} />
        <button type="button" className="btn small gold" aria-pressed={full} onClick={() => setFull((f) => !f)} title={full ? 'Esc' : undefined}>{full ? 'Exit fullscreen' : 'Fullscreen'}</button>
      </div>
      <div className="ff-body">{children}</div>
    </div>
  );
}
