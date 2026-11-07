'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { forgetAccount, markVia, savedAccounts, type Saved, type Via } from '@/lib/accounts';
import { UiIcon } from '@/components/shared/icons';
import { PasswordField } from './PasswordField';
import { ProviderButtons } from './ProviderButtons';
import { AUTH_OFF, safeFrom, useProviders } from './useProviders';

const flag = () => { try { localStorage.setItem('pmc.signedin', '1'); } catch { /* blocked */ } };
const initial = (a: Saved) => (a.name || a.email).charAt(0).toUpperCase();

export function SignInForm() {
  const from = safeFrom(useSearchParams().get('from'));
  const available = useProviders();
  const [saved, setSaved] = useState<Saved[]>([]);
  const [other, setOther] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const pw = useRef<HTMLInputElement>(null);

  useEffect(() => { setSaved(savedAccounts()); }, []);
  const showForm = other || saved.length === 0;

  if (AUTH_OFF) return <div><p className="tx auth-note">Accounts are not switched on in this copy of the site, so there is nothing to sign in to here. Every app works without one, and your settings are saved on this device.</p><Link className="btn primary auth-back" href="/">Back to the apps</Link></div>;

  const go = (via: Via) => {
    setError(''); setBusy(true); markVia(via); flag();
    import('next-auth/react').then((m) => m.signIn(via, { callbackUrl: from })).catch(() => { setBusy(false); setError('That did not work. Please try again.'); });
  };

  const pick = (a: Saved) => {
    if (a.via === 'credentials' || a.via === 'nodemailer') { setOther(true); setEmail(a.email); setTimeout(() => pw.current?.focus(), 30); }
    else go(a.via);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const m = await import('next-auth/react');
      const res = await m.signIn('credentials', { email, password, redirect: false });
      if (res?.error || !res?.ok) { setError('That email and password do not match.'); setBusy(false); return; }
      markVia('credentials'); flag(); window.location.assign(from);
    } catch { setError('Could not reach the server. Please try again.'); setBusy(false); }
  }

  async function link() {
    if (!email) { setError('Type your email address first, then ask for a link.'); return; }
    setError(''); setBusy(true); markVia('nodemailer'); flag();
    try {
      const m = await import('next-auth/react');
      const res = await m.signIn('nodemailer', { email, redirect: false });
      if (res?.error) setError('The link could not be sent. Check the address and try again.'); else setSent(true);
    } catch { setError('The link could not be sent. Please try again.'); }
    setBusy(false);
  }

  return (
    <div className="auth-stack">
      {saved.length > 0 && (
        <ul className="saved" aria-label="Accounts on this device">
          {saved.map((a) => (
            <li key={a.email}>
              <button type="button" className="acct-btn" onClick={() => pick(a)} disabled={busy}>
                <span className="avatar d" aria-hidden>{a.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.image} alt="" referrerPolicy="no-referrer" /> : initial(a)}</span>
                <span className="who"><b className="d">{a.name || a.email.split('@')[0]}</b><small className="tx">{a.email}</small></span>
              </button>
              <button type="button" className="forget" aria-label={`Remove ${a.email} from this device`} title="Remove from this device"
                onClick={() => { forgetAccount(a.email); setSaved(savedAccounts()); }}><UiIcon name="close" size={16} /></button>
            </li>
          ))}
          {!other && <li><button type="button" className="btn" onClick={() => setOther(true)}><UiIcon name="plus" size={16} /> Another account</button></li>}
        </ul>
      )}

      {showForm && (
        sent ? <p role="status" className="tx auth-note">Check {email} for your sign-in link. It works once.</p> : (
          <>
            <form onSubmit={submit} className="auth-form" noValidate={false}>
              <div className="field">
                <label htmlFor="em">Email</label>
                <input id="em" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <PasswordField value={password} onChange={setPassword} autoComplete="current-password" inputRef={pw} />
              {error && <p role="alert" className="auth-err tx">{error}</p>}
              <button className="btn primary" disabled={busy}>{busy ? 'Signing in' : 'Sign in'}</button>
              <button type="button" className="linkbtn tx" onClick={link} disabled={busy}>Forgotten it? Email me a sign-in link</button>
            </form>
            <p className="or d"><span>or</span></p>
            <ProviderButtons available={available} busy={busy} onPick={go} />
            <p className="swap tx">New here? <Link href={`/signup?from=${encodeURIComponent(from)}`}>Make an account</Link></p>
          </>
        )
      )}
      {!showForm && error && <p role="alert" className="auth-err tx">{error}</p>}
    </div>
  );
}
