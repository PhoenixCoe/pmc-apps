'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { registerState } from './embed';

/**
 * Local-first state for every app. Works instantly with no account.
 * Keys are namespaced per app so folders stay isolated: useLocalState('case-converter', 'input', '').
 * Account sync (Phase 3) will hook in here without changing any app code.
 */
export function useLocalState<T>(app: string, key: string, initial: T) {
  const storageKey = `pmc:${app}:${key}`;
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch { /* storage blocked or corrupt: fall back to initial */ }
    loaded.current = true;
  }, [storageKey]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      try { window.localStorage.setItem(storageKey, JSON.stringify(v)); } catch { /* quota or blocked */ }
      return v;
    });
  }, [storageKey]);

  // When another page has opened this app in a frame (Coe), it can put a value straight in.
  const latest = useRef(value); latest.current = value;
  useEffect(() => registerState(app, key, (v) => set(v as T), () => latest.current), [app, key, set]);

  return [value, set] as const;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
