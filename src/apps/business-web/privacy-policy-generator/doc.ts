export interface Section { h: string; p: string[] }
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const bullets = (a: string[]) => a.map((x) => `- ${x}`);
export const toMarkdown = (title: string, s: Section[]) => `# ${title}\n\n` + s.map((x) => `## ${x.h}\n\n${x.p.join('\n\n')}`).join('\n\n') + '\n';
export const toText = (title: string, s: Section[]) => `${title.toUpperCase()}\n\n` + s.map((x) => `${x.h.toUpperCase()}\n\n${x.p.map((l) => l.replace(/^- /gm, '• ')).join('\n\n')}`).join('\n\n') + '\n';
export function toHtml(title: string, s: Section[]) {
  const block = (t: string) => { const lines = t.split('\n'); if (lines.every((l) => l.startsWith('- '))) return `<ul>\n${lines.map((l) => `  <li>${esc(l.slice(2))}</li>`).join('\n')}\n</ul>`; return `<p>${esc(t).replace(/\n/g, '<br>')}</p>`; };
  return `<h1>${esc(title)}</h1>\n` + s.map((x) => `<h2>${esc(x.h)}</h2>\n${x.p.map(block).join('\n')}`).join('\n') + '\n';
}
export { bullets };
export const dateLong = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
