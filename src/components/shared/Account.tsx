'use client';
import { useEffect, useState } from 'react';
import { lastVia, saveAccount } from '@/lib/accounts';
import { AUTH_ENABLED } from './Providers';

export interface Account { name?: string | null; email?: string | null; image?: string | null }

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* blocked */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* blocked */ } },
};

/** Who is signed in. Shows the last known person at once from this browser, then asks the server to confirm,
 *  and only if this browser has signed in before, so everyone else costs no request at all. */
export function useAccount() {
  const [user, setUser] = useState<Account | null>(null);
  useEffect(() => {
    if (!AUTH_ENABLED || store.get('pmc.signedin') !== '1') return;
    try { const c = store.get('pmc.user'); if (c) setUser(JSON.parse(c)); } catch { /* ignore */ }
    import('next-auth/react')
      .then((m) => m.getSession())
      .then((s) => {
        if (s?.user) { setUser(s.user); if (s.user.email) saveAccount({ email: s.user.email, name: s.user.name, image: s.user.image, via: lastVia() }); store.set('pmc.user', JSON.stringify({ name: s.user.name, email: s.user.email, image: s.user.image })); }
        else { store.del('pmc.signedin'); store.del('pmc.user'); setUser(null); }
      })
      .catch(() => {});
  }, []);
  const signOut = () => {
    store.del('pmc.signedin');
    import('next-auth/react').then((m) => m.signOut({ callbackUrl: '/' }));
  };
  return { user, signOut };
}

export const initialOf = (u: Account) => (u.name || u.email || '?').trim().charAt(0).toUpperCase();

export function Avatar({ user, size = 36 }: { user: Account; size?: number }) {
  return (
    <span className="avatar d" style={{ width: size, height: size }} aria-hidden>
      {user.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={user.image} alt="" referrerPolicy="no-referrer" /> : initialOf(user)}
    </span>
  );
}
