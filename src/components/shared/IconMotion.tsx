'use client';
import { useEffect } from 'react';

const HOST = 'a, button';

/**
 * Small icons rest on their finished picture. Point at one (or the link or button around it) and it plays; move away and it
 * runs backwards to the finished picture instead of jumping. Larger header art plays on its own and is left alone.
 */
export function IconMotion() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const raf = new WeakMap<Element, number>();
    const hostOf = (n: EventTarget | null) => (n instanceof Element ? n.closest(HOST) ?? n.closest('.pg.still') : null);
    const anims = (h: Element) => [...(h.matches('.pg.still') ? [h] : h.querySelectorAll('.pg.still'))].flatMap((s) => [...s.querySelectorAll('.m')].flatMap((e) => e.getAnimations()));
    const enter = (h: Element) => {
      cancelAnimationFrame(raf.get(h) ?? 0);
      anims(h).forEach((a) => { a.playbackRate = 1; a.play(); });
    };
    const leave = (h: Element) => {
      cancelAnimationFrame(raf.get(h) ?? 0);
      const list = anims(h).map((a) => {
        const d = Number(a.effect?.getTiming().duration) || 4000;
        return { a, to: Math.floor(Number(a.currentTime) / d) * d, done: false };
      });
      if (!list.length) return;
      list.forEach(({ a }) => { a.playbackRate = -2.4; a.play(); });
      const tick = () => {
        let left = 0;
        list.forEach((o) => {
          if (o.done) return;
          if (Number(o.a.currentTime) <= o.to) { o.a.pause(); o.a.currentTime = o.to; o.a.playbackRate = 1; o.done = true; } else left++;
        });
        if (left) raf.set(h, requestAnimationFrame(tick));
      };
      tick();
    };
    const over = (e: PointerEvent) => { const h = hostOf(e.target); if (h && !(e.relatedTarget instanceof Node && h.contains(e.relatedTarget))) enter(h); };
    const out = (e: PointerEvent) => { const h = hostOf(e.target); if (h && !(e.relatedTarget instanceof Node && h.contains(e.relatedTarget))) leave(h); };
    const fin = (e: FocusEvent) => { const h = hostOf(e.target); if (h) enter(h); };
    const fout = (e: FocusEvent) => { const h = hostOf(e.target); if (h) leave(h); };
    document.addEventListener('pointerover', over); document.addEventListener('pointerout', out);
    document.addEventListener('focusin', fin); document.addEventListener('focusout', fout);
    return () => { document.removeEventListener('pointerover', over); document.removeEventListener('pointerout', out); document.removeEventListener('focusin', fin); document.removeEventListener('focusout', fout); };
  }, []);
  return null;
}
