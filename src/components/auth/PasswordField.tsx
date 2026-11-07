'use client';
import { useState } from 'react';

export function PasswordField({ value, onChange, autoComplete, inputRef, hint }: {
  value: string; onChange: (v: string) => void; autoComplete: 'current-password' | 'new-password'; inputRef?: React.Ref<HTMLInputElement>; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor="pw">Password</label>
      <div className="pw">
        <input id="pw" ref={inputRef} type={show ? 'text' : 'password'} required minLength={autoComplete === 'new-password' ? 10 : undefined}
          autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? 'pw-hint' : undefined} />
        <button type="button" className="d" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>
      </div>
      {hint && <p id="pw-hint" className="hint tx">{hint}</p>}
    </div>
  );
}
