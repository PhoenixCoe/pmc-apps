export interface SvgOptions {
  precision: number; removeMetadata: boolean; removeComments: boolean; removeTitle: boolean; removeEditorData: boolean;
  removeEmpty: boolean; collapse: boolean; removeDimensions: boolean; currentColor: boolean;
}
export const defaultSvg: SvgOptions = { precision: 2, removeMetadata: true, removeComments: true, removeTitle: false, removeEditorData: true, removeEmpty: true, collapse: true, removeDimensions: false, currentColor: false };

const trimNum = (s: string, p: number) => s.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (m) => { const n = Number(m); if (!isFinite(n)) return m; const r = p < 0 ? n : Number(n.toFixed(p)); return String(r).replace(/^(-?)0\./, '$1.'); });
const EDITOR = /^(inkscape|sodipodi|xmlns:(inkscape|sodipodi|dc|cc|rdf|serif|xlink)|data-name|serif:|i:|sketch:)/i;

export function cleanSvg(src: string, o: SvgOptions): { out: string; error?: string } {
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return { out: '', error: 'This does not look like valid SVG.' };
  const walk = (el: Element) => {
    for (const child of [...el.childNodes]) {
      if (child.nodeType === 8 && o.removeComments) el.removeChild(child);
      else if (child.nodeType === 1) {
        const c = child as Element, n = c.nodeName.toLowerCase();
        if ((o.removeMetadata && (n === 'metadata' || n === 'sodipodi:namedview' || n.startsWith('rdf:'))) || (o.removeTitle && (n === 'title' || n === 'desc'))) { el.removeChild(c); continue; }
        walk(c);
        if (o.removeEmpty && ['g', 'defs'].includes(n) && !c.childNodes.length && !c.attributes.length) el.removeChild(c);
      }
    }
    for (const a of [...el.attributes]) {
      if (o.removeEditorData && EDITOR.test(a.name)) { el.removeAttribute(a.name); continue; }
      if (['d', 'points', 'transform', 'viewBox', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'x2', 'y1', 'y2', 'stroke-width', 'offset'].includes(a.name)) el.setAttribute(a.name, a.name === 'd' ? trimNum(a.value, o.precision).replace(/\s+/g, ' ').trim() : trimNum(a.value, o.precision));
      if (o.currentColor && ['fill', 'stroke'].includes(a.name) && !/^(none|url|transparent|inherit|currentcolor)/i.test(a.value)) el.setAttribute(a.name, 'currentColor');
    }
  };
  walk(root);
  if (o.removeDimensions && root.getAttribute('viewBox')) { root.removeAttribute('width'); root.removeAttribute('height'); }
  let out = new XMLSerializer().serializeToString(root);
  if (o.collapse) out = out.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  return { out };
}

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
export function toReact(svg: string, name = 'Icon'): string {
  let body = svg.replace(/ xmlns(:\w+)?="[^"]*"/g, '').replace(/\s(class)=/g, ' className=').replace(/\s([a-z]+(?:-[a-z]+)+)=/g, (_, a) => ` ${camel(a)}=`).replace(/\sstyle="([^"]*)"/g, (_, s) => ` style={{ ${s.split(';').filter(Boolean).map((r: string) => { const [k, v] = r.split(':'); return `${camel(k.trim())}: '${v.trim()}'`; }).join(', ')} }}`);
  body = body.replace(/<svg/, '<svg {...props}');
  return `export function ${name}(props: React.SVGProps<SVGSVGElement>) {\n  return (\n    ${body}\n  );\n}\n`;
}
export function toVue(svg: string): string { return `<template>\n  ${svg.replace(/ xmlns(:\w+)?="[^"]*"/g, '')}\n</template>\n`; }
export const svgDataUri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22')}`;
export const pascal = (s: string) => s.replace(/[^a-z0-9]+/gi, ' ').trim().split(' ').map((w) => w[0]?.toUpperCase() + w.slice(1)).join('') || 'Icon';
