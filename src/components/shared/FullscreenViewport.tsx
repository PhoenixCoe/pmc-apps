'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

export interface View { x: number; y: number; k: number }
export interface ViewportApi {
  view: View;
  /** Convert a pointer position to canvas (world) coordinates. */
  toWorld: (clientX: number, clientY: number) => { x: number; y: number };
  reset: () => void;
  /** Zoom and pan so a box of the canvas (in world units) fills the view. */
  fit: (box: { x0: number; y0: number; x1: number; y1: number }, pad?: number) => void;
  /** Slide the view so a point of the canvas (in world units) is in the middle. */
  panTo: (x: number, y: number) => void;
  /** The size of the visible canvas, in screen pixels. */
  size: () => { w: number; h: number };
}

interface Props {
  /** The app's name, shown with the PMC logo in the corner when the canvas fills the window. */
  name?: string;
  /** What the side pane is called on its show/hide button in fullscreen. */
  sideLabel?: string;
  /** Toolbar controls shown beside the zoom buttons. */
  toolbar?: React.ReactNode;
  /** Right-hand pane for live output (code preview, rendered README...). */
  side?: React.ReactNode;
  /** Give the side pane more room (a page preview needs it). */
  sideWide?: boolean;
  minZoom?: number;
  maxZoom?: number;
  /** Called after the canvas goes in or out of full window, so the app can re-fit its contents. */
  onFullChange?: (full: boolean) => void;
  /** Always fill the whole window: there is no toggle, and Escape does not leave. A link back to the apps takes its place. */
  always?: boolean;
  /** Called when the empty canvas is pressed (to clear a selection, say). Return true to take the drag over, so the canvas does not pan. */
  onBackgroundDown?: (e: React.PointerEvent<HTMLDivElement>) => boolean | void;
  /** Drawn over the canvas, not moved or zoomed with it: a mini map, a selection bar, a pop-up menu. */
  canvasOverlay?: React.ReactNode | ((api: ViewportApi) => React.ReactNode);
  /** Render nodes/wires in world coordinates. Children receive pointer events; empty canvas pans. */
  children: (api: ViewportApi) => React.ReactNode;
}

/** Infinite draggable + zoomable canvas with a split output pane and a fullscreen toggle. */
export function FullscreenViewport({ name, sideLabel = 'Output', toolbar, side, sideWide, minZoom = 0.2, maxZoom = 3, always = false, onBackgroundDown, canvasOverlay, onFullChange, children }: Props) {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [full, setFull] = useState(always);
  const [sideOpen, setSideOpen] = useState(true);
  const [panning, setPanning] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const clamp = useCallback((k: number) => Math.min(maxZoom, Math.max(minZoom, k)), [minZoom, maxZoom]);

  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    setView((v) => {
      const k = clamp(v.k * factor);
      const r = k / v.k;
      return { k, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r };
    });
  }, [clamp]);

  // Wheel needs a non-passive native listener to stop the page scrolling.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element | null)?.closest?.('[data-nowheel]')) return;   // a menu on top of the canvas scrolls itself
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0015));
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    onFullChange?.(full);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !always && setFull(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [full, always]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // nodes handle their own pointers
    if (onBackgroundDown?.(e) === true) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    setPanning(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) setView((v) => ({ ...v, x: d.vx + e.clientX - d.x, y: d.vy + e.clientY - d.y }));
  };
  const endDrag = () => { drag.current = null; setPanning(false); };

  const api: ViewportApi = {
    view,
    toWorld: (cx, cy) => {
      const r = canvas.current?.getBoundingClientRect();
      return { x: (cx - (r?.left ?? 0) - view.x) / view.k, y: (cy - (r?.top ?? 0) - view.y) / view.k };
    },
    reset: () => setView({ x: 0, y: 0, k: 1 }),
    size: () => { const r = canvas.current?.getBoundingClientRect(); return { w: r?.width ?? 0, h: r?.height ?? 0 }; },
    panTo: (x, y) => setView((v) => { const r = canvas.current?.getBoundingClientRect(); return r ? { ...v, x: r.width / 2 - x * v.k, y: r.height / 2 - y * v.k } : v; }),
    fit: ({ x0, y0, x1, y1 }, pad = 48) => {
      const r = canvas.current?.getBoundingClientRect(); if (!r || !r.width) return;
      const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
      const top = full ? 56 : 0;   // the logo and tools sit over the top of a full-window canvas
      const k = clamp(Math.min((r.width - pad * 2) / w, (r.height - top - pad * 2) / h, 1));
      setView({ k, x: (r.width - w * k) / 2 - x0 * k, y: top + (r.height - top - h * k) / 2 - y0 * k });
    },
  };

  const centre = () => { const r = canvas.current?.getBoundingClientRect(); return [(r?.width ?? 0) / 2, (r?.height ?? 0) / 2] as const; };

  return (
    <div className={`viewport-wrap${full ? ' is-full' : ''}`}>
      <div className="viewport-bar">
        {full && (always
          ? <Link className="fs-brand fs-back" href="/" aria-label={`${name ?? 'App'}: back to PMC Apps`} title="Back to PMC Apps"><Logo /><b className="d">{name}</b><i className="fs-x">Apps</i></Link>
          : <span className="fs-brand"><Logo /><b className="d">{name}</b></span>)}
        {toolbar}
        <span style={{ flex: 1 }} />
        <button type="button" className="btn small" aria-label="Zoom out" onClick={() => zoomAt(...centre(), 1 / 1.25)}>&minus;</button>
        <span className="code" aria-live="polite" style={{ minWidth: '4ch', textAlign: 'center' }}>{Math.round(view.k * 100)}%</span>
        <button type="button" className="btn small" aria-label="Zoom in" onClick={() => zoomAt(...centre(), 1.25)}>+</button>
        {full && side && <button type="button" className="btn small" aria-pressed={sideOpen} onClick={() => setSideOpen((o) => !o)}>{sideOpen ? `Hide ${sideLabel}` : `Show ${sideLabel}`}</button>}
        {!always && <button type="button" className="btn small gold" aria-pressed={full} onClick={() => setFull((f) => !f)} title={full ? 'Esc' : undefined}>{full ? 'Exit fullscreen' : 'Fullscreen'}</button>}
      </div>
      <div className={`viewport-body${side && (!full || sideOpen) ? ' with-side' : ''}${sideWide ? ' wide' : ''}`}>
        <div
          ref={canvas}
          className={`canvas${panning ? ' panning' : ''}`}
          style={{ backgroundSize: `${24 * view.k}px ${24 * view.k}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
        >
          <div className="canvas-layer" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
            {children(api)}
          </div>
          {typeof canvasOverlay === 'function' ? canvasOverlay(api) : canvasOverlay}
        </div>
        {side && (!full || sideOpen) && <div className="side-out">{side}</div>}
      </div>
    </div>
  );
}
