'use client';
import { useEffect, useId, useRef, useState } from 'react';

/** Optional depth lives here, never in the way of the core tool. */
export function SettingsDrawer({ label = 'Options', title, children }: { label?: string; title?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>{label}</button>
      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={id}>
            <div className="drawer-head">
              <h2 id={id}>{title ?? label}</h2>
              <button ref={closeRef} type="button" className="btn small" onClick={() => setOpen(false)}>Close</button>
            </div>
            {children}
          </aside>
        </>
      )}
    </>
  );
}
