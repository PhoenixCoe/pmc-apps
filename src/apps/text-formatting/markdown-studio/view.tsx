'use client';
import 'katex/dist/katex.min.css';
import DOMPurify from 'dompurify';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CopyButton, downloadText } from '@/components/shared/CopyButton';
import { useLocalState } from '@/lib/useLocalState';
import { prefixLines, renderMarkdown, wrapSelection, type Edit } from './utils';

const APP = 'markdown-studio';
const SAMPLE = `# Field notes

Write on the left and the page updates on the right. **Bold**, *italic* and \`code\` all work.

## Maths

Inline: $e^{i\\pi} + 1 = 0$. Display:

$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$

## A table and some code

| Tool | Runs in |
| ---- | ------- |
| Markdown Studio | your browser |

\`\`\`js
const greet = (name) => \`Hello, \${name}\`;
\`\`\`

> Prices like $5 and $10 are left alone.
`;

export default function View() {
  const [md, setMd] = useLocalState(APP, 'doc', '');
  const [mounted, setMounted] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setMounted(true), []);

  // Rendered only in the browser: DOMPurify needs a real DOM, and we never want unsanitised HTML.
  const html = useMemo(() => (mounted && md.trim() ? DOMPurify.sanitize(renderMarkdown(md)) : ''), [md, mounted]);
  const words = md.trim() ? md.trim().split(/\s+/).length : 0;

  function apply(fn: (v: string, s: number, e: number) => Edit) {
    const el = area.current;
    if (!el) return;
    const r = fn(md, el.selectionStart, el.selectionEnd);
    setMd(r.value);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(r.start, r.end); });
  }
  const wrap = (b: string, a: string, p: string) => () => apply((v, s, e) => wrapSelection(v, s, e, b, a, p));
  const tools: [string, string, () => void][] = [
    ['Bold', 'B', wrap('**', '**', 'bold text')], ['Italic', 'I', wrap('*', '*', 'italic text')], ['Code', '</>', wrap('`', '`', 'code')],
    ['Link', 'Link', wrap('[', '](https://)', 'link text')], ['Heading', 'H2', () => apply((v, s, e) => prefixLines(v, s, e, '## '))],
    ['Bulleted list', 'List', () => apply((v, s, e) => prefixLines(v, s, e, '- '))], ['Quote', 'Quote', () => apply((v, s, e) => prefixLines(v, s, e, '> '))],
    ['Inline maths', '$x$', wrap('$', '$', 'x^2')], ['Display maths', '$$', wrap('\n$$\n', '\n$$\n', '\\frac{a}{b}')],
  ];

  return (
    <div className="panel">
      <div className="tool-actions" role="toolbar" aria-label="Formatting">
        {tools.map(([label, text, run]) => <button key={label} type="button" className="btn small" aria-label={label} onClick={run}>{text}</button>)}
      </div>
      <div className="split">
        <div className="field">
          <label htmlFor="md-in">Markdown</label>
          <textarea id="md-in" ref={area} className="code" value={md} onChange={(e) => setMd(e.target.value)} spellCheck={false} placeholder="Start writing, or insert the example." style={{ minHeight: 480 }} />
        </div>
        <div className="field">
          <span className="label">Preview</span>
          {html ? <div className="md-preview" dangerouslySetInnerHTML={{ __html: html }} /> : <div className="md-preview" style={{ opacity: 0.6 }}>The preview appears here as you write.</div>}
        </div>
      </div>
      <div className="tool-actions">
        <button type="button" className="btn" onClick={() => setMd(SAMPLE)}>Insert example</button>
        <button type="button" className="btn" onClick={() => downloadText('document.md', md, 'text/markdown')} disabled={!md}>Download .md</button>
        <button type="button" className="btn primary" onClick={() => window.print()} disabled={!html}>Save as PDF</button>
        <CopyButton text={html} label="Copy HTML" small={false} />
        <button type="button" className="btn" onClick={() => setMd('')} disabled={!md}>Clear</button>
        <span className="stat" aria-live="polite">{words.toLocaleString('en-GB')} words</span>
      </div>
      <p className="note">Save as PDF opens your browser&rsquo;s print window. Choose &ldquo;Save as PDF&rdquo; as the destination and only the preview is printed.</p>
    </div>
  );
}
