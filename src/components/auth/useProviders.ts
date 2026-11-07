'use client';
import { useEffect, useState } from 'react';

export const AUTH_OFF = process.env.NEXT_PUBLIC_AUTH === 'off';

/** Which sign-in methods this server has switched on. null while we are asking (or if we cannot ask). */
export function useProviders() {
  const [ids, setIds] = useState<string[] | null>(null);
  useEffect(() => {
    if (AUTH_OFF) return;
    let live = true;
    import('next-auth/react').then((m) => m.getProviders()).then((p) => { if (live && p) setIds(Object.keys(p)); }).catch(() => {});
    return () => { live = false; };
  }, []);
  return ids;
}

/** Only ever send people to a page on this site after signing in. */
export function safeFrom(v: string | null) { return v && v.startsWith('/') && !v.startsWith('//') ? v : '/'; }
