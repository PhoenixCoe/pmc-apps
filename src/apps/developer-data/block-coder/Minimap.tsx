'use client';
import { DEF, heightOf, NODE_W, type GNode } from './graph';
import type { ViewportApi } from '@/components/shared/FullscreenViewport';

const W = 176, H = 112;

/** A small map of the whole canvas in the corner. The box shows what you can see now. Press or drag on it to go there. */
export function Minimap({ nodes, picked, api }: { nodes: GNode[]; picked: Set<string>; api: ViewportApi }) {
  const { w, h } = api.size(); if (!w) return null;
  const k = api.view.k, vx = -api.view.x / k, vy = -api.view.y / k, vw = w / k, vh = h / k;
  const x0 = Math.min(vx, ...nodes.map((n) => n.x)) - 40, y0 = Math.min(vy, ...nodes.map((n) => n.y)) - 40;
  const x1 = Math.max(vx + vw, ...nodes.map((n) => n.x + NODE_W)) + 40, y1 = Math.max(vy + vh, ...nodes.map((n) => n.y + heightOf(DEF[n.kind], n))) + 40;
  const s = Math.min(W / (x1 - x0), H / (y1 - y0)), ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
  const go = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    api.panTo((e.clientX - r.left - ox) / s + x0, (e.clientY - r.top - oy) / s + y0);
  };
  return (
    <svg className="ng-map" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Map of the canvas. Press on it to move there." data-nowheel
      onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); go(e); }}
      onPointerMove={(e) => { if (e.buttons) go(e); }}>
      {nodes.map((n) => <rect key={n.id} x={ox + (n.x - x0) * s} y={oy + (n.y - y0) * s} width={Math.max(3, NODE_W * s)} height={Math.max(2, heightOf(DEF[n.kind], n) * s)} className={picked.has(n.id) ? 'on' : ''} />)}
      <rect className="view" x={ox + (vx - x0) * s} y={oy + (vy - y0) * s} width={vw * s} height={vh * s} />
    </svg>
  );
}
