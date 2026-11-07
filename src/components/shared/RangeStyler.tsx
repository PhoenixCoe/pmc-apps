'use client';
import { useEffect } from 'react';

/** Keeps the green fill of every slider in step with its handle (the page's own CSS cannot read a slider's value). */
export function RangeStyler() {
  useEffect(() => {
    const paint = (r: HTMLInputElement) => {
      const min = Number(r.min || 0), max = Number(r.max || 100), v = Number(r.value);
      r.style.setProperty('--p', `${max > min ? ((v - min) / (max - min)) * 100 : 0}%`);
    };
    const all = () => document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(paint);
    const onInput = (e: Event) => { const t = e.target; if (t instanceof HTMLInputElement && t.type === 'range') paint(t); };
    all();
    document.addEventListener('input', onInput, true);
    // sliders that appear later, or whose value the page changes itself
    const mo = new MutationObserver(all);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['value', 'min', 'max'] });
    const id = window.setInterval(all, 600);
    return () => { document.removeEventListener('input', onInput, true); mo.disconnect(); window.clearInterval(id); };
  }, []);
  return null;
}
