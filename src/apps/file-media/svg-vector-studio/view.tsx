'use client';
import { useEffect, useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { FileDrop } from '@/components/shared/FileDrop';
import { Segmented } from '@/components/shared/Segmented';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { downloadText } from '@/components/shared/CopyButton';
import { baseName, formatBytes, readText } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';
import { cleanSvg, defaultSvg, pascal, svgDataUri, toReact, toVue, type SvgOptions } from './svg';

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <!-- a star -->
  <metadata>made in an editor</metadata>
  <path d="M12.000000 2.000000 L15.090000 8.260000 L22.000000 9.270000 L17.000000 14.140000 L18.180000 21.020000 L12.000000 17.770000 L5.820000 21.020000 L7.000000 14.140000 L2.000000 9.270000 L8.910000 8.260000 Z" fill="#337957"/>
</svg>`;
type Fmt = 'svg' | 'react' | 'vue' | 'uri';

export default function View() {
  const [src, setSrc] = useLocalState('svg-vector-studio', 'input', SAMPLE);
  const [o, setO] = useLocalState<SvgOptions>('svg-vector-studio', 'options', defaultSvg);
  const [name, setName] = useState('Icon');
  const [fmt, setFmt] = useState<Fmt>('svg');
  const set = <K extends keyof SvgOptions>(k: K, v: SvgOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const r = useMemo(() => (ready ? cleanSvg(src, o) : { out: '' } as { out: string; error?: string }), [src, o, ready]);
  const text = !r.out ? '' : fmt === 'svg' ? r.out : fmt === 'react' ? toReact(r.out, pascal(name)) : fmt === 'vue' ? toVue(r.out) : svgDataUri(r.out);
  const bytes = (s: string) => new Blob([s]).size;
  return (
    <div className="panel">
      <div className="split">
        <div className="field">
          <label htmlFor="sv-in">SVG code</label>
          <textarea id="sv-in" className="code" style={{ minHeight: 280 }} value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} />
          <FileDrop multiple={false} accept=".svg,image/svg+xml" title="Or drop an .svg file" onFiles={async (f) => { setSrc(await readText(f[0])); setName(pascal(baseName(f[0].name))); }} />
        </div>
        <div className="field">
          <span className="label">Preview</span>
          <div className="svg-prev" aria-label="Preview of the cleaned SVG">{/* eslint-disable-next-line @next/next/no-img-element */}{r.out ? <img src={svgDataUri(r.out)} alt="" /> : <span className="bad">{r.error}</span>}</div>
          {r.out && <div className="tool-actions"><span className="stat">{formatBytes(bytes(src))} → {formatBytes(bytes(r.out))}</span><span className="stat">{Math.max(0, Math.round((1 - bytes(r.out) / Math.max(1, bytes(src))) * 100))}% smaller</span></div>}
        </div>
      </div>
      <div className="tool-actions">
        <Segmented<Fmt> label="Get it as" value={fmt} onChange={setFmt} options={[{ value: 'svg', label: 'SVG' }, { value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }, { value: 'uri', label: 'Data URI' }]} />
        {(fmt === 'react') && <div className="field"><label htmlFor="sv-n">Component name</label><input id="sv-n" type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>}
        <SettingsDrawer label="Options" title="Clean-up options">
          <div className="field"><label htmlFor="sv-p">Decimal places in paths: {o.precision}</label><input id="sv-p" type="range" min={0} max={6} value={o.precision} onChange={(e) => set('precision', +e.target.value)} /></div>
          <label className="check"><input type="checkbox" checked={o.removeMetadata} onChange={(e) => set('removeMetadata', e.target.checked)} /> Remove metadata</label>
          <label className="check"><input type="checkbox" checked={o.removeComments} onChange={(e) => set('removeComments', e.target.checked)} /> Remove comments</label>
          <label className="check"><input type="checkbox" checked={o.removeEditorData} onChange={(e) => set('removeEditorData', e.target.checked)} /> Remove editor data (Inkscape, Sketch)</label>
          <label className="check"><input type="checkbox" checked={o.removeTitle} onChange={(e) => set('removeTitle', e.target.checked)} /> Remove title and description</label>
          <label className="check"><input type="checkbox" checked={o.removeEmpty} onChange={(e) => set('removeEmpty', e.target.checked)} /> Remove empty groups</label>
          <label className="check"><input type="checkbox" checked={o.collapse} onChange={(e) => set('collapse', e.target.checked)} /> Squeeze spaces</label>
          <label className="check"><input type="checkbox" checked={o.removeDimensions} onChange={(e) => set('removeDimensions', e.target.checked)} /> Remove width and height (keep viewBox)</label>
          <label className="check"><input type="checkbox" checked={o.currentColor} onChange={(e) => set('currentColor', e.target.checked)} /> Use the text colour for fills and strokes</label>
        </SettingsDrawer>
        <button type="button" className="btn" disabled={!r.out} onClick={() => downloadText(`${baseName(name) || 'icon'}.svg`, r.out, 'image/svg+xml')}>Download .svg</button>
      </div>
      {r.error ? <p className="bad" role="alert">{r.error}</p> : <CodeBox title={fmt === 'svg' ? 'Clean SVG' : fmt === 'react' ? 'React component' : fmt === 'vue' ? 'Vue component' : 'Data URI'} text={text} />}
    </div>
  );
}
