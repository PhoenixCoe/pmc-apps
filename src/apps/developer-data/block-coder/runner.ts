/** Runs generated code in a Web Worker, so a loop that never ends cannot freeze the page, and stops it after a few seconds. */
export interface RunResult { lines: { kind: 'log' | 'error'; text: string }[]; ms: number; timedOut: boolean; /** What each node produced, as short text (for the live preview chips). */ probes: Record<string, string> }

const WORKER = `
const show = (v) => {
  if (typeof v === 'string') return v;
  if (v === undefined) return 'undefined';
  if (typeof v === 'function') return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
};
self.onmessage = (e) => {
  const out = [], probes = {};
  const probe = (id, v) => { let t = show(v); if (t.length > 48) t = t.slice(0, 47) + '…'; probes[id] = t; };
  const log = (...a) => { out.push(a.map(show).join(' ')); if (out.length > 500) throw new Error('Too much output (more than 500 lines).'); };
  const t0 = performance.now();
  try { new Function('console', e.data)({ log, probe }); self.postMessage({ out, probes, ms: performance.now() - t0 }); }
  catch (err) { self.postMessage({ out, probes, ms: performance.now() - t0, error: err && err.message ? err.message : String(err) }); }
};
self.postMessage({ ready: true });
`;

let url: string | null = null;
const workerUrl = () => (url ??= URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' })));

/** Starts a worker and waits for it to say hello. Used by the loader to prove the runner works before the editor opens. */
export function warmRunner(): Promise<void> {
  return new Promise((res, rej) => {
    try {
      const w = new Worker(workerUrl());
      const t = setTimeout(() => { w.terminate(); rej(new Error('The code runner did not start.')); }, 4000);
      w.onmessage = () => { clearTimeout(t); w.terminate(); res(); };
      w.onerror = () => { clearTimeout(t); w.terminate(); rej(new Error('The browser would not start the code runner.')); };
    } catch { rej(new Error('This browser cannot run workers.')); }
  });
}

export function runCode(code: string, timeout = 3000): Promise<RunResult> {
  return new Promise((resolve) => {
    let w: Worker;
    try { w = new Worker(workerUrl()); } catch { resolve({ lines: [{ kind: 'error', text: 'This browser cannot start the code runner.' }], ms: 0, timedOut: false, probes: {} }); return; }
    const t0 = performance.now();
    const timer = setTimeout(() => {
      w.terminate();
      resolve({ lines: [{ kind: 'error', text: `Stopped after ${timeout / 1000} seconds. Is something looping for ever?` }], ms: performance.now() - t0, timedOut: true, probes: {} });
    }, timeout);
    w.onmessage = (e) => {
      if (e.data?.ready) { w.postMessage(code); return; }
      clearTimeout(timer); w.terminate();
      const lines: RunResult['lines'] = (e.data.out as string[]).map((text) => ({ kind: 'log', text }));
      if (e.data.error) lines.push({ kind: 'error', text: e.data.error });
      resolve({ lines, ms: e.data.ms, timedOut: false, probes: e.data.probes ?? {} });
    };
    w.onerror = (e) => { clearTimeout(timer); w.terminate(); resolve({ lines: [{ kind: 'error', text: e.message || 'The code could not run.' }], ms: performance.now() - t0, timedOut: false, probes: {} }); };
  });
}
