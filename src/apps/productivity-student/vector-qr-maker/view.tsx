'use client';
import { useMemo, useState } from 'react';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { CopyButton, downloadBlob, downloadText } from '@/components/shared/CopyButton';
import { FileDrop } from '@/components/shared/FileDrop';
import { Segmented } from '@/components/shared/Segmented';
import { SettingsDrawer } from '@/components/shared/SettingsDrawer';
import { canvasBlob, loadImage, makeCanvas, readDataUrl } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';
import { buildSvg, defaultQr, matrix, type QrOptions } from './qr';

type Kind = 'text' | 'wifi' | 'email' | 'phone';
export default function View() {
  const [kind, setKind] = useLocalState<Kind>('vector-qr-maker', 'kind', 'text');
  const [text, setText] = useLocalState('vector-qr-maker', 'text', 'https://pmcstudios.uk');
  const [wifi, setWifi] = useLocalState('vector-qr-maker', 'wifi', { ssid: '', pass: '', sec: 'WPA' });
  const [mail, setMail] = useLocalState('vector-qr-maker', 'mail', { to: '', subject: '' });
  const [phone, setPhone] = useLocalState('vector-qr-maker', 'phone', '');
  const [o, setO] = useLocalState<QrOptions>('vector-qr-maker', 'options', defaultQr);
  const [logo, setLogo] = useState<string | undefined>();
  const set = <K extends keyof QrOptions>(k: K, v: QrOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const data = kind === 'text' ? text : kind === 'wifi' ? `WIFI:T:${wifi.sec};S:${wifi.ssid.replace(/([\;,:"])/g, '\\$1')};P:${wifi.pass.replace(/([\;,:"])/g, '\\$1')};;` : kind === 'email' ? `mailto:${mail.to}${mail.subject ? `?subject=${encodeURIComponent(mail.subject)}` : ''}` : `tel:${phone}`;
  const m = useMemo(() => matrix(data, logo ? 'H' : o.ec), [data, o.ec, logo]);
  const svg = useMemo(() => (m ? buildSvg(m, o, logo) : ''), [m, o, logo]);
  const png = async (size: number) => { const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)), c = makeCanvas(size, size), x = c.getContext('2d')!; x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, size, size); return canvasBlob(c); };
  const empty = !data.trim() || (kind === 'wifi' && !wifi.ssid) || (kind === 'email' && !mail.to) || (kind === 'phone' && !phone);
  return (
    <div className="panel">
      <div className="split">
        <div className="field" style={{ gap: 16 }}>
          <Segmented<Kind> label="What is it for" value={kind} onChange={setKind} options={[{ value: 'text', label: 'Link or text' }, { value: 'wifi', label: 'Wi-Fi' }, { value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }]} />
          {kind === 'text' && <div className="field"><label htmlFor="qr-t">Link or text</label><textarea id="qr-t" style={{ minHeight: 100 }} value={text} onChange={(e) => setText(e.target.value)} /></div>}
          {kind === 'wifi' && <><div className="field"><label htmlFor="qr-s">Network name</label><input id="qr-s" type="text" value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} /></div><div className="field"><label htmlFor="qr-p">Wi-Fi key</label><input id="qr-p" type="text" value={wifi.pass} onChange={(e) => setWifi({ ...wifi, pass: e.target.value })} /></div><Segmented<string> label="Security" value={wifi.sec} onChange={(v) => setWifi({ ...wifi, sec: v })} options={[{ value: 'WPA', label: 'WPA / WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'None' }]} /></>}
          {kind === 'email' && <><div className="field"><label htmlFor="qr-e">Send to</label><input id="qr-e" type="text" value={mail.to} onChange={(e) => setMail({ ...mail, to: e.target.value })} /></div><div className="field"><label htmlFor="qr-j">Subject</label><input id="qr-j" type="text" value={mail.subject} onChange={(e) => setMail({ ...mail, subject: e.target.value })} /></div></>}
          {kind === 'phone' && <div className="field"><label htmlFor="qr-n">Phone number</label><input id="qr-n" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>}
          <div className="row">
            <div className="field"><span className="label">Dots</span><ColorPicker value={o.fg} onChange={(v) => set('fg', v)} label="Dot colour" /></div>
            <div className="field"><span className="label">Corner squares</span><ColorPicker value={o.eye} onChange={(v) => set('eye', v)} label="Corner colour" /></div>
            <div className="field"><span className="label">Background</span><ColorPicker value={o.bg} onChange={(v) => set('bg', v)} label="Background colour" /></div>
          </div>
          <Segmented<QrOptions['dots']> label="Dot shape" value={o.dots} onChange={(v) => set('dots', v)} options={[{ value: 'square', label: 'Square' }, { value: 'rounded', label: 'Rounded' }, { value: 'dots', label: 'Round' }]} />
          <div className="row">
            <Segmented<QrOptions['eyeOuter']> label="Corner outside" value={o.eyeOuter} onChange={(v) => set('eyeOuter', v)} options={[{ value: 'square', label: 'Square' }, { value: 'rounded', label: 'Rounded' }, { value: 'circle', label: 'Circle' }]} />
            <Segmented<QrOptions['eyeInner']> label="Corner inside" value={o.eyeInner} onChange={(v) => set('eyeInner', v)} options={[{ value: 'square', label: 'Square' }, { value: 'rounded', label: 'Rounded' }, { value: 'circle', label: 'Circle' }]} />
          </div>
          {logo ? <div className="tool-actions"><span>Logo added.</span><div className="field"><label htmlFor="qr-l">Logo size: {o.logoSize}%</label><input id="qr-l" type="range" min={10} max={30} value={o.logoSize} onChange={(e) => set('logoSize', +e.target.value)} /></div><button type="button" className="btn small" onClick={() => setLogo(undefined)}>Remove logo</button></div>
            : <FileDrop multiple={false} accept="image/*" title="Add a logo in the middle (optional)" onFiles={async (f) => setLogo(await readDataUrl(f[0]))} />}
        </div>
        <div className="field">
          <span className="label">Your QR code</span>
          <div className="qr-prev">{m && !empty ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)} alt="QR code preview" /> : <span className="empty" style={{ border: 0 }}>{m ? 'Fill in the box to make a code.' : 'That is too much for one QR code.'}</span>}</div>
          <div className="tool-actions">
            <button type="button" className="btn primary" disabled={!m || empty} onClick={() => downloadText('qr-code.svg', svg, 'image/svg+xml')}>Download SVG</button>
            <button type="button" className="btn" disabled={!m || empty} onClick={async () => downloadBlob('qr-code.png', await png(1024))}>Download PNG</button>
            <CopyButton text={svg} label="Copy SVG" small={false} disabled={!m || empty} />
            <SettingsDrawer label="More" title="More options">
              <Segmented<QrOptions['ec']> label="Error repair" value={o.ec} onChange={(v) => set('ec', v)} options={[{ value: 'L', label: 'Low' }, { value: 'M', label: 'Medium' }, { value: 'Q', label: 'High' }, { value: 'H', label: 'Highest' }]} />
              <div className="field"><label htmlFor="qr-m">Blank border: {o.margin}</label><input id="qr-m" type="range" min={0} max={8} value={o.margin} onChange={(e) => set('margin', +e.target.value)} /></div>
              <label className="check"><input type="checkbox" checked={o.transparent} onChange={(e) => set('transparent', e.target.checked)} /> Clear background</label>
            </SettingsDrawer>
          </div>
        </div>
      </div>
    </div>
  );
}
