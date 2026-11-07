'use client';
import { useMemo } from 'react';
import { CopyButton } from '@/components/shared/CopyButton';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { Select } from '@/components/shared/Select';
import { useLocalState } from '@/lib/useLocalState';
import { defaultSlugOptions, seoChecks, slugify, type SlugOptions } from './utils';

const APP = 'slug-generator';

export default function View() {
  const [input, setInput] = useLocalState(APP, 'input', '');
  const [o, setO] = useLocalState<SlugOptions>(APP, 'options', defaultSlugOptions);
  const set = <K extends keyof SlugOptions>(k: K, v: SlugOptions[K]) => setO((p) => ({ ...p, [k]: v }));

  const lines = useMemo(() => input.split('\n').filter((l) => l.trim()), [input]);
  const slugs = useMemo(() => lines.map((l) => slugify(l, o)), [lines, o]);
  const first = slugs[0] ?? '';
  const checks = useMemo(() => seoChecks(first, o.separator), [first, o.separator]);

  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="sg-in">Titles (one per line)</label>
        <textarea id="sg-in" style={{ minHeight: 110 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="The Ultimate Guide to Café Culture in Zürich (2026)" />
      </div>
      <div className="tool-actions">
        <SettingsDrawer label="Options" title="Slug options">
          <label className="check"><input type="checkbox" checked={o.removeStopWords} onChange={(e) => set('removeStopWords', e.target.checked)} /> Remove stop words (the, of, and...)</label>
          <label className="check"><input type="checkbox" checked={o.transliterate} onChange={(e) => set('transliterate', e.target.checked)} /> Transliterate accents, Greek and Cyrillic</label>
          <label className="check"><input type="checkbox" checked={o.germanUmlauts} onChange={(e) => set('germanUmlauts', e.target.checked)} /> German umlauts as ae, oe, ue</label>
          <div className="field">
            <label htmlFor="sg-sep">Separator</label>
            <Select id="sg-sep" value={o.separator} onChange={(v) => set('separator', v)} options={[{ value: '-', label: 'Hyphen (-)' }, { value: '_', label: 'Underscore (_)' }]} />
          </div>
          <div className="field">
            <label htmlFor="sg-max">Maximum length (0 for no limit)</label>
            <input id="sg-max" type="number" min={0} max={200} value={o.maxLength} onChange={(e) => set('maxLength', Math.max(0, Number(e.target.value) || 0))} />
          </div>
          <div className="field">
            <label htmlFor="sg-extra">Extra stop words (comma separated)</label>
            <input id="sg-extra" type="text" value={o.extraStopWords.join(', ')} onChange={(e) => set('extraStopWords', e.target.value.split(',').map((w) => w.trim()).filter(Boolean))} />
          </div>
        </SettingsDrawer>
        {slugs.length > 1 && <CopyButton text={slugs.join('\n')} label="Copy all" small={false} />}
      </div>

      {slugs.length ? (
        <>
          <div className="result-list" style={{ gridTemplateColumns: '1fr' }}>
            {slugs.map((s, i) => (
              <div className="result" key={i}>
                <div className="result-top"><span>{lines[i]}</span><CopyButton text={s} /></div>
                <pre className="code">{s || '(empty after cleaning)'}</pre>
              </div>
            ))}
          </div>
          <section aria-label="SEO checks" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2>Search checks{slugs.length > 1 ? ' for the first slug' : ''}</h2>
            {checks.map((c) => (
              <p key={c.label} className={c.level === 'good' ? 'ok' : c.level === 'bad' ? 'bad' : undefined}>
                <strong>{c.label}: {c.level === 'good' ? 'good' : c.level === 'warn' ? 'could be better' : 'needs a fix'}.</strong> {c.detail}
              </p>
            ))}
          </section>
        </>
      ) : <div className="empty">Type a title above and its slug appears here.</div>}
    </div>
  );
}
