'use client';
import { UiIcon } from './icons';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clearSaved, DEFAULTS, readPrefs, savePref, type Prefs } from '@/lib/prefs';
import { AUTH_ENABLED } from './Providers';
import { Seg } from './Segmented';
import { Avatar, useAccount } from './Account';

function Choice<K extends keyof Prefs>({ label, hint, name, value, options, onPick }: {
  label: string; hint?: string; name: K; value: Prefs[K]; options: { v: Prefs[K]; text: string }[]; onPick: (k: K, v: Prefs[K]) => void;
}) {
  return (
    <div className="opt">
      <div className="opt-t"><b className="d">{label}</b>{hint && <small className="tx">{hint}</small>}</div>
      <Seg value={String(value)} options={options.map((o) => ({ value: String(o.v), label: o.text }))} onChange={(v) => onPick(name, options.find((o) => String(o.v) === v)!.v)} label={label} />
    </div>
  );
}

export function SettingsView() {
  const [p, setP] = useState<Prefs>(DEFAULTS);
  const [cleared, setCleared] = useState<number | null>(null);
  const { user, signOut } = useAccount();
  useEffect(() => setP(readPrefs()), []);
  const pick = <K extends keyof Prefs>(k: K, v: Prefs[K]) => { savePref(k, v); setP((x) => ({ ...x, [k]: v })); };

  return (
    <div className="settings">
      {AUTH_ENABLED && (
        <section className="set" aria-labelledby="s-acct">
          <h2 className="d" id="s-acct"><UiIcon name="user" size={26} />Account</h2>
          {user ? (
            <div className="opt">
              <div className="opt-t acct-line"><Avatar user={user} /><span><b className="d">{user.name || 'Signed in'}</b><small className="tx">{user.email}</small></span></div>
              <button type="button" className="btn small" onClick={signOut}>Sign out</button>
            </div>
          ) : (
            <div className="opt">
              <div className="opt-t"><b className="d">Not signed in</b><small className="tx">Every app works without an account.</small></div>
              <Link className="btn small gold" href="/signin?from=%2Fsettings">Sign in</Link>
            </div>
          )}
        </section>
      )}

      <section className="set" aria-labelledby="s-look">
        <h2 className="d" id="s-look"><UiIcon name="look" size={26} />How it looks</h2>
        <Choice label="Text size" name="text" value={p.text} onPick={pick} options={[{ v: 'normal', text: 'Normal' }, { v: 'large', text: 'Large' }]} />
        <Choice label="Loading screen" hint="The moving blocks shown while a big app loads." name="loader" value={p.loader} onPick={pick}
          options={[{ v: 'full', text: 'Full' }, { v: 'quick', text: 'Quick' }, { v: 'off', text: 'Off' }]} />
        <Choice label="Animations" name="motion" value={p.motion} onPick={pick} options={[{ v: 'device', text: 'Match my device' }, { v: 'calm', text: 'Always calm' }]} />
      </section>

      <section className="set" aria-labelledby="s-data">
        <h2 className="d" id="s-data"><UiIcon name="trash" size={26} />Saved data</h2>
        <div className="opt">
          <div className="opt-t"><b className="d">Clear everything saved here</b><small className="tx">These settings, and anything the apps remembered, such as text you were working on.</small></div>
          <button type="button" className="btn small" onClick={() => { const n = clearSaved(); setCleared(n); setP(readPrefs()); }}>Clear</button>
        </div>
        {cleared !== null && <p role="status" className="tx saved-note">{cleared ? `Cleared ${cleared} saved item${cleared === 1 ? '' : 's'}.` : 'There was nothing saved.'}</p>}
      </section>
    </div>
  );
}
