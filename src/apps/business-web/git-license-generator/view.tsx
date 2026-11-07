'use client';
import { CodeBox } from '@/components/shared/CodeBox';
import { CopyButton, downloadText } from '@/components/shared/CopyButton';
import { useLocalState } from '@/lib/useLocalState';
import { LICENSES } from './licenses';

export default function View() {
  const [id, setId] = useLocalState('git-license-generator', 'id', 'mit'), [name, setName] = useLocalState('git-license-generator', 'name', ''), [year, setYear] = useLocalState('git-license-generator', 'year', String(new Date().getFullYear()));
  const lic = LICENSES.find((l) => l.id === id) ?? LICENSES[0];
  const text = lic.text(year || String(new Date().getFullYear()), name || 'Your Name');
  const col = (t: string, items: string[]) => items.length > 0 && <div><b>{t}</b><ul>{items.map((i) => <li key={i}>{i}</li>)}</ul></div>;
  return (
    <div className="split">
      <div className="panel">
        <div className="gl-pick" role="radiogroup" aria-label="Licence">{LICENSES.map((l) => <button key={l.id} type="button" role="radio" aria-checked={l.id === id} className={`gl-opt${l.id === id ? ' on' : ''}`} onClick={() => setId(l.id)}><b>{l.name}</b><small>{l.short}</small></button>)}</div>
      </div>
      <div className="panel">
        {lic.fields.length > 0 && <div className="row">
          <div className="field" style={{ flex: 1, minWidth: 180 }}><label htmlFor="gl-n">Your name or company</label><input id="gl-n" type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label htmlFor="gl-y">Year</label><input id="gl-y" type="text" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 100 }} /></div></div>}
        <div className="gl-sum">{col('You allow', lic.can)}{col('People must', lic.must)}{col('People cannot', lic.cannot)}</div>
        <div className="tool-actions"><button type="button" className="btn primary" onClick={() => downloadText('LICENSE', text)}>Download LICENSE</button><CopyButton text={text} small={false} label="Copy text" /></div>
        <CodeBox title="LICENSE" text={text} />
      </div>
    </div>
  );
}
