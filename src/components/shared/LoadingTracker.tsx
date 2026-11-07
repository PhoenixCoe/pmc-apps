'use client';
import { useEffect, useRef, useState } from 'react';
import { AppLoader } from './AppLoader';

export interface LoadStep { label: string; run: () => Promise<void> }

/**
 * Runs real initialisation steps in order (fetch a WASM module, build a canvas, warm a worker...)
 * and reports progress. Use it in any heavy app: const load = useLoadSequence(steps).
 */
export function useLoadSequence(steps: LoadStep[], opts: { minMs?: number } = {}) {
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stepsRef = useRef(steps);
  const minRef = useRef(opts.minMs ?? 0);

  useEffect(() => {
    let dead = false;
    (async () => {
      // A quick load would only flash the animation. Each step is shown for its share of a minimum time, so the count can be read.
      // Not when the person turned the loading animation down or off in Settings.
      const hold = !document.documentElement.dataset.loader ? minRef.current / Math.max(1, stepsRef.current.length) : 0;
      const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
      for (let i = 0; i < stepsRef.current.length; i++) {
        if (dead) return;
        setIndex(i);
        const t0 = performance.now();
        try { await stepsRef.current[i].run(); if (hold) { const left = hold - (performance.now() - t0); if (left > 0 && !dead) await wait(left); } }
        catch (e) { if (!dead) setError(`${stepsRef.current[i].label} failed: ${e instanceof Error ? e.message : 'unknown error'}`); return; }
      }
      if (!dead) setIndex(stepsRef.current.length);
    })();
    return () => { dead = true; };
  }, []);

  return { index, total: steps.length, ready: index >= steps.length && !error, error };
}

/** The loading screen for a heavy app: pass the step names and the index from useLoadSequence. */
export function LoadingTracker({ title, steps, index, error, what = 'assets', full = false }: { title: string; steps: string[]; index: number; error?: string | null; what?: string; full?: boolean }) {
  return <AppLoader app={title} what={what} done={index} total={steps.length} step={steps[Math.min(index, steps.length - 1)]} error={error} full={full} />;
}

const frames = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
/** The default steps for a window-filling or canvas app. Each one waits for something real. */
export const canvasSteps = (restore?: () => void | Promise<void>): LoadStep[] => [
  { label: 'Loading the fonts', run: async () => { try { await document.fonts.ready; } catch { /* the page falls back to other fonts */ } } },
  { label: 'Preparing the canvas', run: frames },
  { label: 'Restoring your last work', run: async () => { await restore?.(); await frames(); } },
];

/**
 * The loading screen for an app that fills the window or is a canvas: it covers the whole window from the first moment,
 * counts its steps (1/3, 2/3, 3/3), and only then shows the app. Wrap the app in it.
 */
export function LoadGate({ title, what = 'assets', steps, minMs = 1200, children }: { title: string; what?: string; steps?: LoadStep[]; minMs?: number; children: React.ReactNode }) {
  const plan = useRef<LoadStep[] | null>(null);
  if (!plan.current) plan.current = steps ?? canvasSteps();
  const load = useLoadSequence(plan.current, { minMs });
  if (!load.ready) return <LoadingTracker full title={title} what={what} steps={plan.current.map((s) => s.label)} index={load.index} error={load.error} />;
  return <>{children}</>;
}
