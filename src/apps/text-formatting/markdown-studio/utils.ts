import { marked } from 'marked';
import katex from 'katex';

// Code is protected first so a $ inside it is never treated as maths.
const CODE = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`/g;
const DISPLAY = /(?<!\\)\$\$([\s\S]+?)\$\$/g;
// Inline maths: no space just inside the dollars, and not followed by a digit, so "$5 and $10" stays money.
const INLINE = /(?<![\\$])\$(?!\s)([^$\n]+?)(?<!\s)\$(?![\d$])/g;

/** Markdown to HTML with KaTeX maths. Output must still be sanitised by the caller before it touches the DOM. */
export function renderMarkdown(md: string): string {
  const maths: { src: string; display: boolean }[] = [];
  const stash = (src: string, display: boolean) => { maths.push({ src: src.trim(), display }); return `PMCMATH${maths.length - 1}END`; };

  let out = '', last = 0;
  const guarded = (chunk: string) => chunk.replace(DISPLAY, (_, s) => `\n\n${stash(s, true)}\n\n`).replace(INLINE, (_, s) => stash(s, false));
  for (const m of md.matchAll(CODE)) {
    out += guarded(md.slice(last, m.index)) + m[0];
    last = (m.index ?? 0) + m[0].length;
  }
  out += guarded(md.slice(last));

  const html = marked.parse(out, { async: false, gfm: true }) as string;
  return html.replace(/PMCMATH(\d+)END/g, (_, i) => {
    const { src, display } = maths[Number(i)];
    return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' });
  });
}

export interface Edit { value: string; start: number; end: number }

/** Wrap the selection (or insert a placeholder) with markers, e.g. **bold**. */
export function wrapSelection(value: string, start: number, end: number, before: string, after: string, placeholder: string): Edit {
  const sel = value.slice(start, end) || placeholder;
  return { value: value.slice(0, start) + before + sel + after + value.slice(end), start: start + before.length, end: start + before.length + sel.length };
}

/** Put a prefix at the start of every selected line, e.g. "- " or "> ". */
export function prefixLines(value: string, start: number, end: number, prefix: string): Edit {
  const from = value.lastIndexOf('\n', start - 1) + 1;
  const toRaw = value.indexOf('\n', end);
  const to = toRaw === -1 ? value.length : toRaw;
  const block = value.slice(from, to).split('\n').map((l) => prefix + l).join('\n');
  return { value: value.slice(0, from) + block + value.slice(to), start: from, end: from + block.length };
}
