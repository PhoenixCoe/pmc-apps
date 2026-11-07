'use client';
import { useRef, useState } from 'react';

/** Two pictures on top of each other with a handle you drag to wipe between them. */
export function CompareSlider({ before, after, labels = ['Before', 'After'], width, height }: { before: string; after: string; labels?: [string, string]; width?: number; height?: number }) {
  const [x, setX] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const move = (cx: number) => { const r = box.current!.getBoundingClientRect(); setX(Math.min(100, Math.max(0, ((cx - r.left) / r.width) * 100))); };
  return (
    <div ref={box} className="cmp" style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX); }} onPointerMove={(e) => { if (e.buttons) move(e.clientX); }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={labels[1]} draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="cmp-top" src={before} alt={labels[0]} draggable={false} style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }} />
      <span className="cmp-tag d" style={{ left: 8 }}>{labels[0]}</span><span className="cmp-tag d" style={{ right: 8 }}>{labels[1]}</span>
      <span className="cmp-bar" style={{ left: `${x}%` }}><input type="range" min={0} max={100} value={x} aria-label="Move the divider" onChange={(e) => setX(+e.target.value)} /></span>
    </div>
  );
}
