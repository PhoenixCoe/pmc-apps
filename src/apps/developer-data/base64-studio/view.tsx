'use client';
import { useEffect, useMemo, useState } from 'react';
import { CodeBox } from '@/components/shared/CodeBox';
import { downloadBlob } from '@/components/shared/CopyButton';
import { FileDrop } from '@/components/shared/FileDrop';
import { Seg } from '@/components/shared/Segmented';
import { formatBytes } from '@/lib/files';
import { useLocalState } from '@/lib/useLocalState';

type Mode = 'encode' | 'decode';
const MAGIC: [number[], string, string][] = [[[0x89, 0x50, 0x4e, 0x47], 'image/png', 'png'], [[0xff, 0xd8, 0xff], 'image/jpeg', 'jpg'], [[0x47, 0x49, 0x46, 0x38], 'image/gif', 'gif'], [[0x52, 0x49, 0x46, 0x46], 'application/riff', 'bin'], [[0x25, 0x50, 0x44, 0x46], 'application/pdf', 'pdf'], [[0x49, 0x44, 0x33], 'audio/mpeg', 'mp3'], [[0x4f, 0x67, 0x67, 0x53], 'audio/ogg', 'ogg'], [[0x50, 0x4b, 0x03, 0x04], 'application/zip', 'zip']];
function sniff(b: Uint8Array): { mime: string; ext: string } {
  for (const [m, mime, ext] of MAGIC) if (m.every((x, i) => b[i] === x)) {
    if (mime === 'application/riff') { const t = String.fromCharCode(...b.slice(8, 12)); return t === 'WAVE' ? { mime: 'audio/wav', ext: 'wav' } : t === 'WEBP' ? { mime: 'image/webp', ext: 'webp' } : { mime, ext }; }
    return { mime, ext };
  }
  const head = new TextDecoder().decode(b.slice(0, 200)).trimStart(); if (/^(<\?xml|<svg)/i.test(head) && /<svg/i.test(head)) return { mime: 'image/svg+xml', ext: 'svg' };
  return { mime: 'application/octet-stream', ext: 'bin' };
}
const toB64 = (b: Uint8Array) => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const isText = (b: Uint8Array) => { try { new TextDecoder('utf-8', { fatal: true }).decode(b); return !b.slice(0, 2000).includes(0); } catch { return false; } };

export default function View() {
  const [mode, setMode] = useLocalState<Mode>('base64-studio', 'mode', 'encode');
  const [text, setText] = useLocalState('base64-studio', 'text', 'Hello, PMC!');
  const [safe, setSafe] = useLocalState('base64-studio', 'urlsafe', false);
  const [wrap, setWrap] = useLocalState('base64-studio', 'wrap', false);
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array; type: string } | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const bytes = useMemo(() => (mode === 'encode' ? file?.bytes ?? new TextEncoder().encode(text) : null), [mode, file, text]);
  const decoded = useMemo(() => {
    if (mode !== 'decode') return null;
    const raw = text.trim(), m = /^data:([^;,]*)(;[^,]*)?,/i.exec(raw); let b64 = m ? raw.slice(m[0].length) : raw;
    if (m && !/base64/i.test(m[2] ?? '')) { try { const b = new TextEncoder().encode(decodeURIComponent(b64)); return { bytes: b, declared: m[1], error: '' }; } catch { return { bytes: new Uint8Array(), declared: '', error: 'This data URI could not be read.' }; } }
    b64 = b64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/'); while (b64.length % 4) b64 += '=';
    if (!b64 || /[^A-Za-z0-9+/=]/.test(b64)) return { bytes: new Uint8Array(), declared: '', error: raw ? 'That is not valid Base64.' : '' };
    try { const s = atob(b64); return { bytes: Uint8Array.from(s, (c) => c.charCodeAt(0)), declared: m?.[1] ?? '', error: '' }; } catch { return { bytes: new Uint8Array(), declared: '', error: 'That is not valid Base64.' }; }
  }, [mode, text]);

  const kind = decoded && decoded.bytes.length ? sniff(decoded.bytes) : null, mime = kind && kind.mime !== 'application/octet-stream' ? kind.mime : decoded?.declared || kind?.mime || 'application/octet-stream';
  const encoded = useMemo(() => { if (!bytes?.length) return ''; let s = toB64(bytes); if (safe) s = s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); return wrap ? (s.match(/.{1,76}/g) ?? []).join('\n') : s; }, [bytes, safe, wrap]);
  const uri = encoded && file ? `data:${file.type || 'application/octet-stream'};base64,${toB64(file.bytes)}` : '';
  const asText = decoded && decoded.bytes.length && isText(decoded.bytes) && !mime.startsWith('image/svg') ? new TextDecoder().decode(decoded.bytes) : '';

  useEffect(() => {
    if (!decoded?.bytes.length || asText) { setUrl(null); return; }
    const u = URL.createObjectURL(new Blob([decoded.bytes as BlobPart], { type: mime })); setUrl(u); return () => URL.revokeObjectURL(u);
  }, [decoded, asText, mime]);

  return (
    <div className="panel">
      <div className="tool-actions">
        <Seg<Mode> value={mode} onChange={(m) => { setMode(m); setFile(null); }} label="Direction" options={[{ value: 'encode', label: 'Text or file to Base64' }, { value: 'decode', label: 'Base64 to text or file' }]} />
        {mode === 'encode' && <><label className="check"><input type="checkbox" checked={safe} onChange={(e) => setSafe(e.target.checked)} /> URL-safe</label><label className="check"><input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} /> Break into lines</label></>}
      </div>
      <div className="field"><label htmlFor="b6-in">{mode === 'encode' ? 'Text to encode' : 'Base64 or data URI to decode'}</label>
        <textarea id="b6-in" className="code" style={{ minHeight: 140 }} value={file ? `[${file.name} · ${formatBytes(file.bytes.length)}]` : text} readOnly={!!file} onChange={(e) => setText(e.target.value)} spellCheck={false} /></div>
      <FileDrop multiple={false} paste title={file ? 'File loaded. Drop another to swap' : mode === 'encode' ? 'Or drop a file to encode' : 'Or drop a .txt file with Base64 in it'} onFiles={async (f) => { const b = new Uint8Array(await f[0].arrayBuffer()); if (mode === 'decode') { setText(new TextDecoder().decode(b)); setFile(null); } else setFile({ name: f[0].name, bytes: b, type: f[0].type }); }} />
      {file && <div className="tool-actions"><button type="button" className="btn small" onClick={() => setFile(null)}>Use typed text instead</button></div>}
      {mode === 'encode' ? (
        <>
          <CodeBox title={`Base64${bytes?.length ? ` · ${formatBytes(encoded.length)}` : ''}`} text={encoded} empty="The Base64 appears here." />
          {uri && <CodeBox title="Data URI" text={uri} />}
          {file && file.type.startsWith('image/') && <div className="svg-prev" style={{ minHeight: 0 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`data:${file.type};base64,${toB64(file.bytes)}`} alt="Preview" style={{ maxHeight: 240, width: 'auto' }} /></div>}
        </>
      ) : decoded?.error ? <p className="bad" role="alert">{decoded.error}</p> : decoded && decoded.bytes.length ? (
        <>
          <div className="tool-actions"><span className="stat">{mime}</span><span className="stat">{formatBytes(decoded.bytes.length)}</span><button type="button" className="btn" onClick={() => downloadBlob(`decoded.${kind?.ext ?? 'bin'}`, new Blob([decoded.bytes as BlobPart], { type: mime }))}>Download file</button></div>
          {asText ? <CodeBox title="Decoded text" text={asText} /> : url && mime.startsWith('image/') ? <div className="svg-prev" style={{ minHeight: 0 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt="Decoded picture" style={{ maxHeight: 320, width: 'auto' }} /></div> : url && mime.startsWith('audio/') ? <audio controls src={url} style={{ width: '100%' }} /> : <p className="hintx">This looks like a file, not text. Use Download file.</p>}
        </>
      ) : <div className="empty">Paste some Base64 above.</div>}
    </div>
  );
}
