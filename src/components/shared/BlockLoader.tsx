'use client';
import { useEffect, useRef } from 'react';
import { LOGO_C, LOGO_M, LOGO_P } from './logoPaths';

/**
 * The PMC loading animation, drawn on a canvas.
 *
 * The PMC logo is cut into blocks. They slide in row by row to make the logo, the block colour drops away
 * so only the logo is left, then the blocks come back and slide around like a sliding puzzle (the gap
 * travels two laps of the board), slide home, and the logo ends up again in a new colour, rippling across
 * from corner to corner. It loops until the page is ready. There is no vector logo to fade to: the blocks
 * are the logo the whole time.
 *
 * The logo is drawn once per colour into a bitmap and every block is a cheap slice of it, so frames stay smooth.
 */

const COLS = 12, ROWS = 7;
const VB_W = 2582, VB_H = 1454;
// [block colour, mark colour on the block]. When the blocks drop away the mark takes the block colour.
const PAIRS: [string, string][] = [['#171717', '#F2E4CE'], ['#337957', '#F2E4CE'], ['#B49A57', '#171717'], ['#1A4934', '#F2E4CE']];
const OUTLINE = '#171717';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: string, b: string, k: number) => {
  const x = rgb(a), y = rgb(b);
  return `rgb(${Math.round(x[0] + (y[0] - x[0]) * k)},${Math.round(x[1] + (y[1] - x[1]) * k)},${Math.round(x[2] + (y[2] - x[2]) * k)})`;
};

interface Tile { hc: number; hr: number; x: number; y: number; fx: number; fy: number; tx: number; ty: number; mt: number; delay: number; dur: number }
type Dir = [number, number];
type Phase = 'enter' | 'hold' | 'break' | 'mix' | 'solve' | 'wave';

// The path the gap takes: a lap of 4 x 3, then a smaller lap of 3 x 2. Played backwards to put every block home.
const rep = (d: Dir, n: number): Dir[] => Array.from({ length: n }, () => d);
const LAPS: Dir[] = [
  ...rep([-1, 0], 4), ...rep([0, -1], 3), ...rep([1, 0], 4), ...rep([0, 1], 3),
  ...rep([-1, 0], 3), ...rep([0, -1], 2), ...rep([1, 0], 3), ...rep([0, 1], 2),
];

export function BlockLoader({ className, label = 'Loading' }: { className?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'calm';
    const paths = { p: new Path2D(LOGO_P), m: new Path2D(LOGO_M), c: new Path2D(LOGO_C) };

    let W = 0, H = 0, dpr = 1, cw = 0, ch = 0;
    const bitmaps = new Map<string, HTMLCanvasElement>();
    const bitmap = (colour: string) => {
      let b = bitmaps.get(colour);
      if (!b) {
        b = document.createElement('canvas'); b.width = Math.round(W * dpr); b.height = Math.round(H * dpr);
        const x = b.getContext('2d')!;
        x.scale((W * dpr) / VB_W, (H * dpr) / VB_H); x.fillStyle = colour;
        x.fill(paths.p, 'evenodd'); x.fill(paths.m); x.fill(paths.c);
        bitmaps.set(colour, b);
      }
      return b;
    };

    const tiles: Tile[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) tiles.push({ hc: c, hr: r, x: c, y: r, fx: c, fy: r, tx: c, ty: r, mt: 1, delay: 0, dur: 0.2 });

    const size = () => {
      const w = canvas.clientWidth || 360;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = w; H = Math.round(w * (VB_H / VB_W));
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.height = `${H}px`;
      cw = W / COLS; ch = H / ROWS; bitmaps.clear();
    };
    size();
    const ro = new ResizeObserver(() => size()); ro.observe(canvas);

    // ---- the timeline ----
    let round = 0, phase: Phase = 'enter', pt = 0;
    let fill = 1, fill0 = 1;                 // 1: coloured blocks, 0: only the logo
    let blank = { c: COLS - 1, r: ROWS - 1 }, blankOn = true, pop = 1;
    let step = 0; const trail: { c: number; r: number }[] = [];
    let waveK = 0;
    let [bg, fg] = PAIRS[0];
    let [bg2, fg2] = PAIRS[1];

    const begin = (p: Phase) => { phase = p; pt = 0; if (p === 'hold') fill0 = fill; };

    // blocks start off the sides, alternate rows from opposite edges
    tiles.forEach((t, i) => {
      const left = t.hr % 2 === 0;
      t.fx = left ? -(COLS + 2 + (i % 3) * 0.5) : COLS * 2 + 2 + (i % 3) * 0.5; t.fy = t.hr;
      t.tx = t.hc; t.ty = t.hr; t.mt = 0;
      t.delay = (left ? t.hc : COLS - 1 - t.hc) * 0.04 + t.hr * 0.045;
    });

    const slide = (dir: Dir, dur: number) => {
      const nc = blank.c + dir[0], nr = blank.r + dir[1];
      const t = tiles.find((q) => q.mt >= 1 && q.tx === nc && q.ty === nr && !(q.hc === COLS - 1 && q.hr === ROWS - 1));
      if (!t) return false;
      t.fx = nc; t.fy = nr; t.tx = blank.c; t.ty = blank.r; t.mt = 0; t.delay = 0; t.dur = dur;
      blank = { c: nc, r: nr };
      return true;
    };

    const animateTiles = (dt: number) => {
      let any = false;
      for (const t of tiles) {
        if (t.mt >= 1) continue;
        if (phase === 'enter') { t.mt = clamp((pt - t.delay) / 0.62); }
        else t.mt = clamp(t.mt + dt / t.dur);
        const e = phase === 'enter' ? easeOut(t.mt) : easeInOut(t.mt);
        t.x = t.fx + (t.tx - t.fx) * e; t.y = t.fy + (t.ty - t.fy) * e;
        if (t.mt >= 1) { t.x = t.tx; t.y = t.ty; } else any = true;
      }
      return any;
    };

    const advance = (dt: number) => {
      pt += dt;
      const moving = animateTiles(dt);
      switch (phase) {
        case 'enter':
          if (!moving) begin('hold');
          break;
        case 'hold':
          fill = fill0 * (1 - easeInOut(clamp((pt - 0.2) / 0.45)));
          if (pt > 1.15) begin('break');
          break;
        case 'break':
          fill = easeInOut(clamp(pt / 0.32));
          if (pt > 0.5) { blankOn = false; blank = { c: COLS - 1, r: ROWS - 1 }; trail.length = 0; step = 0; begin('mix'); }
          break;
        case 'mix':
          if (moving) break;
          if (step < LAPS.length) {
            const before = { ...blank };
            if (slide(LAPS[step], 0.16)) { trail.push(before); step++; } else step = LAPS.length;
          } else { step = trail.length; begin('solve'); }
          break;
        case 'solve':
          if (moving) break;
          if (step > 0) { step--; const to = trail[step]; slide([to.c - blank.c, to.r - blank.r], 0.1); }
          else { blankOn = true; pop = 0; waveK = 0; [bg2, fg2] = PAIRS[(round + 1) % PAIRS.length]; begin('wave'); }
          break;
        case 'wave':
          pop = clamp(pt / 0.3);
          waveK = clamp((pt - 0.15) / 0.85);
          fill = 1 - easeInOut(clamp((pt - 0.55) / 0.55));
          if (pt > 1.25) { round++; [bg, fg] = PAIRS[round % PAIRS.length]; waveK = 0; fill = 0; begin('hold'); }
          break;
      }
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const waving = phase === 'wave';
      // At rest with no block colour, draw the logo as one piece so there are no seams between slices.
      if (phase === 'hold' && fill < 0.01 && blankOn && !tiles.some((q) => q.mt < 1)) {
        ctx.globalAlpha = 1; ctx.drawImage(bitmap(bg), 0, 0, W * dpr, H * dpr, 0, 0, W, H); return;
      }
      for (const t of tiles) {
        const corner = t.hc === COLS - 1 && t.hr === ROWS - 1;
        if (corner && !blankOn) continue;
        const k = waving ? easeInOut(clamp((waveK - ((t.hc / (COLS - 1) + t.hr / (ROWS - 1)) / 2) * 0.5) / 0.5)) : 0;
        let px = t.x * cw, py = t.y * ch, w = cw, h = ch;
        if (corner && waving && pop < 1) { const s = easeOut(pop); px += (cw * (1 - s)) / 2; py += (ch * (1 - s)) / 2; w = cw * s; h = ch * s; }
        ctx.save();
        ctx.beginPath(); ctx.rect(px, py, w, h); ctx.clip();
        const block = waving ? mix(bg, bg2, k) : bg;
        if (fill > 0.01) { ctx.globalAlpha = fill; ctx.fillStyle = block; ctx.fillRect(px, py, w, h); }
        const sx = t.hc * cw * dpr, sy = t.hr * ch * dpr, sw = cw * dpr, sh = ch * dpr;
        const layer = (colour: string, a: number) => {
          if (a < 0.01) return;
          ctx.globalAlpha = a; ctx.drawImage(bitmap(colour), sx, sy, sw, sh, t.x * cw, t.y * ch, cw, ch);
        };
        layer(fg, (1 - k) * fill); layer(bg, (1 - k) * (1 - fill));
        if (waving) { layer(fg2, k * fill); layer(bg2, k * (1 - fill)); }
        if (fill > 0.05) { ctx.globalAlpha = fill; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, w - 2, h - 2); }
        ctx.restore();
      }
    };

    let last = performance.now(), raf = 0, running = true;
    if (reduce) { fill = 0; blankOn = true; tiles.forEach((t) => { t.x = t.tx; t.y = t.ty; t.mt = 1; }); draw(); }
    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      advance(dt); draw();
      raf = requestAnimationFrame(loop);
    };
    if (!reduce) raf = requestAnimationFrame(loop);
    const onVis = () => { last = performance.now(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  return <canvas ref={ref} className={`blocks${className ? ' ' + className : ''}`} role="img" aria-label={label} />;
}
