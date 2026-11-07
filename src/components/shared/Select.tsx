'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Pop } from './Pop';

export interface SelectOption<T extends string = string> { value: T; label: string; /** Show this choice in its own typeface (for font pickers). */ font?: string }

/** The site's own dropdown: the same black-edged box as everything else, with a list that opens under it. */
export function Select<T extends string>({ value, options, onChange, id, label, compact, onOpen }: {
  value: T; options: SelectOption<T>[]; onChange: (v: T) => void; id?: string; label?: string; compact?: boolean; onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const btn = useRef<HTMLButtonElement>(null), list = useRef<HTMLUListElement>(null);
  const uid = useId();
  const at = Math.max(0, options.findIndex((o) => o.value === value));
  const cur = options[at];

  const show = () => { onOpen?.(); setActive(at); setOpen(true); };
  const close = useCallback((back: boolean) => { setOpen(false); if (back) requestAnimationFrame(() => btn.current?.focus()); }, []);
  const pick = (v: T) => { onChange(v); close(true); };

  useEffect(() => { if (open) list.current?.focus({ preventScroll: true }); }, [open]);
  useEffect(() => { if (open) list.current?.querySelector('[data-on="true"]')?.scrollIntoView({ block: 'nearest' }); }, [open, active]);

  const onTrigger = (e: React.KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show(); }
  };
  const onList = (e: React.KeyboardEvent) => {
    const n = options.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + n) % n); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(n - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(options[active].value); }
    else if (e.key === 'Tab') close(false);
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const c = e.key.toLowerCase();
      for (let k = 1; k <= n; k++) { const i = (active + k) % n; if (options[i].label.toLowerCase().startsWith(c)) { setActive(i); break; } }
    }
  };

  return (
    <>
      <button ref={btn} type="button" id={id} className={`ui-sel${compact ? ' compact' : ''}${open ? ' open' : ''}`} aria-haspopup="listbox" aria-expanded={open} aria-label={label}
        onClick={() => (open ? close(false) : show())} onKeyDown={onTrigger}>
        <span className="ui-sel-t" style={cur?.font ? { fontFamily: cur.font } : undefined}>{cur?.label}</span>
        <i className="ui-chev" aria-hidden />
      </button>
      {open && (
        <Pop anchor={btn} onClose={close} label={label ?? 'Choose one'} className="ui-menu">
          <ul ref={list} role="listbox" tabIndex={-1} aria-label={label} aria-activedescendant={`${uid}-${active}`} onKeyDown={onList}>
            {options.map((o, i) => (
              <li key={o.value} id={`${uid}-${i}`} role="option" aria-selected={o.value === value} data-on={i === active}
                style={o.font ? { fontFamily: o.font } : undefined} onPointerEnter={() => setActive(i)} onClick={() => pick(o.value)}>
                <span>{o.label}</span>{o.value === value && <i className="ui-tick" aria-hidden />}
              </li>
            ))}
          </ul>
        </Pop>
      )}
    </>
  );
}
