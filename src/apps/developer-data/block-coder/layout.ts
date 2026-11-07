/**
 * Editing helpers that work on a whole graph and never touch the page: tidying the layout, and copying a set of blocks.
 * They are plain functions so they can be tested without a browser.
 */
import { DEF, ELEMENTS, heightOf, NODE_W, type GNode, type Graph } from './graph';

const COL = NODE_W + 64, GAP = 28, TALL = 1300;

/**
 * Lines the blocks up in columns, left to right, in the order the data flows: blocks with nothing wired in come first, and every
 * block sits one column right of the furthest block that feeds it. Blocks keep their top-to-bottom order inside a column.
 * The order of items on a web page follows their height on the canvas, so that order is kept too.
 */
export function tidy(g: Graph, only?: Set<string>): Graph {
  const set = only && only.size > 1 ? only : null;                       // tidy just the selection when more than one is picked
  const nodes = g.nodes.filter((n) => !set || set.has(n.id));
  if (!nodes.length) return g;
  const ids = new Set(nodes.map((n) => n.id));
  const wires = g.wires.filter((w) => ids.has(w.from) && ids.has(w.to));
  const depth = new Map(nodes.map((n) => [n.id, 0]));
  for (let pass = 0; pass < nodes.length; pass++) {
    let moved = false;
    wires.forEach((w) => { const d = (depth.get(w.from) ?? 0) + 1; if (d > (depth.get(w.to) ?? 0) && d <= nodes.length) { depth.set(w.to, d); moved = true; } });
    if (!moved) break;
  }
  const x0 = Math.min(...nodes.map((n) => n.x)), y0 = Math.min(...nodes.map((n) => n.y));
  const cols: GNode[][] = [];
  [...nodes].sort((a, b) => a.y - b.y || a.x - b.x).forEach((n) => { const c = depth.get(n.id) ?? 0; (cols[c] ??= []).push(n); });
  // A column that would run off the screen carries on in another column beside it.
  const stack: GNode[][] = [], at = new Map<string, number>();
  cols.forEach((col) => {
    if (!col) return;
    let cur: GNode[] = [], h = 0;
    col.forEach((n) => { const hh = heightOf(DEF[n.kind], n) + GAP; if (cur.length && h + hh > TALL) { stack.push(cur); cur = []; h = 0; } cur.push(n); h += hh; });
    stack.push(cur);
  });
  const pos = new Map<string, { x: number; y: number }>();
  stack.forEach((col, ci) => {
    let y = y0;
    col.forEach((n) => { pos.set(n.id, { x: x0 + ci * COL, y }); at.set(n.id, ci); y += heightOf(DEF[n.kind], n) + GAP; });
  });
  // Page items are written to the page from the top down, so keep that order: never let one end up above an item that came before it.
  const shift = (ci: number, from: number, by: number) => { for (let i = from; i < stack[ci].length; i++) pos.get(stack[ci][i].id)!.y += by; };
  let floor = -Infinity;
  [...nodes].filter((n) => ELEMENTS.has(n.kind)).sort((a, b) => a.y - b.y || a.x - b.x).forEach((n) => {
    const ci = at.get(n.id) ?? 0, i = stack[ci].indexOf(n), p = pos.get(n.id)!;
    if (p.y <= floor) shift(ci, i, floor + 1 - p.y);
    floor = pos.get(n.id)!.y;
  });
  return { ...g, nodes: g.nodes.map((n) => { const p = pos.get(n.id); return p ? { ...n, x: p.x, y: p.y } : n; }) };
}

/** Copies the chosen blocks (and the wires between them), moved by dx, dy. Returns the new graph and the ids of the copies. */
export function duplicate(g: Graph, ids: string[], dx = 48, dy = 48): [Graph, string[]] {
  const pick = new Set(ids), from = g.nodes.filter((n) => pick.has(n.id));
  if (!from.length) return [g, []];
  const map = new Map<string, string>(); let seq = g.seq;
  const copies: GNode[] = from.map((n) => { const id = 'n' + ++seq; map.set(n.id, id); return { ...n, id, x: n.x + dx, y: n.y + dy, v: { ...n.v } }; });
  let w = 0;
  const wires = g.wires.filter((x) => map.has(x.from) && map.has(x.to)).map((x) => ({ ...x, id: 'w' + Math.random().toString(36).slice(2, 9) + w++, from: map.get(x.from)!, to: map.get(x.to)! }));
  return [{ nodes: [...g.nodes, ...copies], wires: [...g.wires, ...wires], seq }, copies.map((c) => c.id)];
}

/** A block set carried on the clipboard: the blocks and the wires between them, positions relative to the top-left one. */
export interface Clip { nodes: GNode[]; wires: Graph['wires'] }
export function copyOut(g: Graph, ids: string[]): Clip | null {
  const pick = new Set(ids), nodes = g.nodes.filter((n) => pick.has(n.id));
  if (!nodes.length) return null;
  const x0 = Math.min(...nodes.map((n) => n.x)), y0 = Math.min(...nodes.map((n) => n.y));
  return { nodes: nodes.map((n) => ({ ...n, x: n.x - x0, y: n.y - y0, v: { ...n.v } })), wires: g.wires.filter((w) => pick.has(w.from) && pick.has(w.to)).map((w) => ({ ...w })) };
}
/** Puts a clip into the graph with its top-left corner at x, y. */
export function pasteIn(g: Graph, c: Clip, x: number, y: number): [Graph, string[]] {
  const map = new Map<string, string>(); let seq = g.seq;
  const nodes = c.nodes.map((n) => { const id = 'n' + ++seq; map.set(n.id, id); return { ...n, id, x: Math.round((x + n.x) / 4) * 4, y: Math.round((y + n.y) / 4) * 4, v: { ...n.v } }; });
  let w = 0;
  const wires = c.wires.filter((k) => map.has(k.from) && map.has(k.to)).map((k) => ({ ...k, id: 'w' + Math.random().toString(36).slice(2, 9) + w++, from: map.get(k.from)!, to: map.get(k.to)! }));
  return [{ nodes: [...g.nodes, ...nodes], wires: [...g.wires, ...wires], seq }, nodes.map((n) => n.id)];
}

/** The blocks that would be inside a box dragged across the canvas. */
export function inside(g: Graph, a: { x: number; y: number }, b: { x: number; y: number }): string[] {
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  return g.nodes.filter((n) => n.x < x1 && n.x + NODE_W > x0 && n.y < y1 && n.y + heightOf(DEF[n.kind], n) > y0).map((n) => n.id);
}
