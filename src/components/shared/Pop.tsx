'use client';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

/**
 * A small panel that hangs off a button: in front of everything, never cut off by the edge of the window or a scrolling box,
 * closed by Escape, a click elsewhere, or scrolling. Used by the site's own dropdown and colour picker.
 */
export function Pop({ anchor, onClose, children, className = '', label, match = true }: {
  anchor: RefObject<HTMLElement | null>; onClose: (returnFocus: boolean) => void; children: ReactNode; className?: string; label: string; match?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; min: number; up: boolean } | null>(null);

  useLayoutEffect(() => {
    const a = anchor.current?.getBoundingClientRect(), p = box.current;
    if (!a || !p) return;
    const w = p.offsetWidth, h = p.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    const below = vh - a.bottom - 10, above = a.top - 10;
    const up = below < h && above > below;
    const left = Math.max(8, Math.min(a.left, vw - w - 8));
    const top = up ? Math.max(8, a.top - h - 6) : Math.min(a.bottom + 6, Math.max(8, vh - h - 8));
    setPos({ left, top, min: a.width, up });
  }, [anchor]);

  useEffect(() => {
    const out = (e: Event) => { const t = e.target as Node; if (!box.current?.contains(t) && !anchor.current?.contains(t)) onClose(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(true); } };
    const shut = () => onClose(false);
    document.addEventListener('pointerdown', out, true);
    document.addEventListener('wheel', out, { capture: true, passive: true });
    document.addEventListener('keydown', key, true);
    window.addEventListener('resize', shut);
    return () => {
      document.removeEventListener('pointerdown', out, true); document.removeEventListener('wheel', out, true);
      document.removeEventListener('keydown', key, true); window.removeEventListener('resize', shut);
    };
  }, [anchor, onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div ref={box} role="dialog" aria-label={label} data-pop className={`ui-pop ${className}${pos?.up ? ' up' : ''}`}
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, minWidth: match ? pos?.min : undefined, opacity: pos ? undefined : 0, pointerEvents: pos ? undefined : 'none' }}
      onPointerDown={(e) => e.stopPropagation()}>
      {children}
    </div>, document.body);
}
