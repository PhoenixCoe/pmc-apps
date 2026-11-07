'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { markVia, type Via } from '@/lib/accounts';
import { PasswordField } from './PasswordField';
import { ProviderButtons } from './ProviderButtons';
import { AUTH_OFF, safeFrom, useProviders } from './useProviders';

const flag = () => { try { localStorage.setItem('pmc.signedin', '1'); } catch { /* blocked */ } };

export function SignUpForm() {
  const from = safeFrom(useSearchParams().get('from'));
  const available = useProviders();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (AUTH_OFF) return <div><p className="tx auth-note">Accounts are not switched on in this copy of the site, so there is nothing to sign up for here. Every app works without one, and your settings are saved on this device.</p><Link className="btn primary auth-back" href="/">Back to the apps</Link></div>;

  const go = (via: Via) => {
    setError(''); setBusy(true); markVia(via); flag();
    import('next-auth/react').then((m) => m.signIn(via, { callbackUrl: from })).catch(() => { setBusy(false); setError('That did not work. Please try again.'); });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const res = await fetch('/api/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Something went wrong. Please try again.'); setBusy(false); return; }
      const m = await import('next-auth/react');
      const si = await m.signIn('credentials', { email, password, redirect: false });
      markVia('credentials'); flag();
      window.location.assign(si?.ok ? from : `/signin?from=${encodeURIComponent(from)}`);
    } catch { setError('Could not reach the server. Please try again.'); setBusy(false); }
  }

  return (
    <div className="auth-stack">
      <form onSubmit={submit} className="auth-form">
        <div className="field">
          <label htmlFor="em">Email</label>
          <input id="em" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <PasswordField value={password} onChange={setPassword} autoComplete="new-password" hint="At least 10 characters." />
        {error && <p role="alert" className="auth-err tx">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Making your account' : 'Make my account'}</button>
      </form>
      <p className="or d"><span>or</span></p>
      <ProviderButtons available={available} busy={busy} onPick={go} />
      <p className="swap tx">Already have one? <Link href={`/signin?from=${encodeURIComponent(from)}`}>Sign in</Link></p>
    </div>
  );
}
