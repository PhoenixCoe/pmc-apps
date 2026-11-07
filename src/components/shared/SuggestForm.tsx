'use client';
import { useState } from 'react';

const MAIL = 'ideas@pmcstudios.uk';
// A copy hosted somewhere with no server can post to a form service instead; set this to its address.
const ENDPOINT = process.env.NEXT_PUBLIC_SUGGEST_ENDPOINT || (process.env.NEXT_PUBLIC_AUTH === 'off' ? '' : '/api/suggest');

export function SuggestForm() {
  const [f, setF] = useState({ app: '', what: '', example: '', email: '', website: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  // No way to send from here: hand the idea to the person's own mail app instead.
  if (!ENDPOINT) {
    const body = encodeURIComponent('What it should do:\n\n\nAn example of using it:\n');
    return (
      <div className="suggest-form">
        <p className="tx">This copy of the site has no server to send from, so your own mail app will do it.</p>
        <a className="btn primary" href={`mailto:${MAIL}?subject=${encodeURIComponent('App idea: ')}&body=${body}`}>Email {MAIL}</a>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setState('sending');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...f, _subject: `App idea: ${f.app}`, message: f.what }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? `That did not send. You can email ${MAIL} instead.`); setState('idle'); return; }
      setState('sent');
    } catch { setError(`Could not reach the server. You can email ${MAIL} instead.`); setState('idle'); }
  }

  if (state === 'sent') {
    return (
      <div className="suggest-done" role="status">
        <h2 className="d">Sent</h2>
        <p className="tx">Thanks. We read every idea{f.email ? ' and will write back if we build it' : ''}.</p>
        <button type="button" className="btn" onClick={() => { setF({ app: '', what: '', example: '', email: '', website: '' }); setState('idle'); }}>Suggest another</button>
      </div>
    );
  }

  return (
    <form className="suggest-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="s-app">App name</label>
        <input id="s-app" type="text" required maxLength={100} value={f.app} onChange={set('app')} placeholder="Subtitle Timing Fixer" />
      </div>
      <div className="field">
        <label htmlFor="s-what">What should it do?</label>
        <textarea id="s-what" required minLength={15} maxLength={3000} value={f.what} onChange={set('what')} placeholder="Shift every line of an .srt file by a set number of seconds." />
      </div>
      <div className="field">
        <label htmlFor="s-ex">An example of using it <small className="tx">(optional)</small></label>
        <textarea id="s-ex" className="short" maxLength={1500} value={f.example} onChange={set('example')} />
      </div>
      <div className="field">
        <label htmlFor="s-em">Your email <small className="tx">(optional, only so we can tell you if it gets built)</small></label>
        <input id="s-em" type="email" autoComplete="email" value={f.email} onChange={set('email')} />
      </div>
      <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={set('website')} />
      {error && <p role="alert" className="auth-err tx">{error}</p>}
      <button className="btn primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending' : 'Send the idea'}</button>
    </form>
  );
}
