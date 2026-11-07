'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { CopyButton, downloadText } from '@/components/shared/CopyButton';
import { Select } from '@/components/shared/Select';
import { FullscreenViewport, type ViewportApi } from '@/components/shared/FullscreenViewport';
import { copyText as copyToClipboard } from '@/lib/useLocalState';
import {
  cloneGraph, compile, DEF, emptyGraph, FONTS, HEAD, heightOf, inPort, isCollapsed, kindProblem, makeNode, NODE_W, onPage, outPort, previewDoc, ROW, sanitise, wireProblem,
  type Def, type GNode, type Graph, type Val, type Wire,
} from './graph';
import { EXAMPLE_GROUPS, EXAMPLES } from './examples';
import { AddMenu } from './AddMenu';
import { copyOut, duplicate, inside, pasteIn, tidy, type Clip } from './layout';
import { Minimap } from './Minimap';
import { runCode, type RunResult } from './runner';
import { pack, shareUrl } from './share';

const STORE = 'pmc:block-coder:graph';
const RECENT = 'pmc:block-coder:recent';

// ---------------------------------------------------------------- a little syntax colour for the generated code
const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|\b(const|return|true|false|undefined|null|new)\b|\b(console|Math|Array|document|Number)\b/g;
function colour(line: string) {
  const out: React.ReactNode[] = []; let last = 0, m: RegExpExecArray | null; TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const cls = m[1] ? 'tk-c' : m[2] ? 'tk-s' : m[3] ? 'tk-n' : m[4] ? 'tk-k' : 'tk-b';
    out.push(<span key={m.index} className={cls}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

type Drag = { from: 'out' | 'in'; node: string; port: number; x: number; y: number } | null;
/** The add menu when it opens on the canvas itself: where it sits on screen, where a new block goes, and the wire it was opened from. */
type Float = { sx: number; sy: number; wx: number; wy: number; wire?: { node: string; side: 'out' | 'in'; port: number } } | null;
const SHORTCUTS: [string, string][] = [
  ['A  or  /', 'Add a block'], ['Double-click empty space', 'Add a block there'], ['Let go of a wire in empty space', 'Add a block that fits it'],
  ['Shift + drag on empty space', 'Select blocks inside a box'], ['Shift + click a block', 'Add it to the selection'], ['Ctrl A', 'Select every block'],
  ['Ctrl D', 'Duplicate the selection'], ['Ctrl C, X, V', 'Copy, cut and paste blocks'], ['Delete', 'Remove the selection or a wire'],
  ['Arrow keys', 'Nudge the selection (Shift for more)'], ['C', 'Fold or unfold the selection'], ['Double-click a title', 'Rename a block (it names the code too)'],
  ['T', 'Tidy the layout'], ['F', 'Fit everything in view'], ['Ctrl Z  /  Ctrl Shift Z', 'Undo and redo'], ['Ctrl Enter', 'Run the code'], ['?', 'Show or hide this list'],
];

const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = Math.max(60, Math.abs(b.x - a.x) * 0.5);
  return `M${a.x} ${a.y} C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
};
const uid = () => 'w' + Math.random().toString(36).slice(2, 9);


export function Editor({ initial, backup, opened }: { initial: Graph; backup?: Graph | null; opened?: boolean }) {
  const [graph, setGraph] = useState<Graph>(initial);
  const [sel, setSel] = useState<string[]>([]);              // the blocks that are picked
  const [wireSel, setWireSel] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [box, setBox] = useState<{ a: { x: number; y: number }; b: { x: number; y: number } } | null>(null);
  const [menu, setMenu] = useState<'add' | 'examples' | 'more' | null>(null);
  const [float, setFloat] = useState<Float>(null);
  const [help, setHelp] = useState(false);
  const [boxMode, setBoxMode] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() => { try { const r = JSON.parse(localStorage.getItem(RECENT) || '[]'); return Array.isArray(r) ? r.filter((k) => typeof k === 'string' && DEF[k]) : []; } catch { return []; } });
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'preview' | 'html' | 'css' | 'js' | 'output'>('preview');
  const [pv, setPv] = useState('');
  const [pvKey, setPvKey] = useState(0);
  const [pageLog, setPageLog] = useState<{ kind: 'log' | 'error'; text: string }[]>([]);
  const [warn, setWarn] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);
  const fileIn = useRef<HTMLInputElement>(null);
  const [, bump] = useState(0);
  const past = useRef<Graph[]>([]), future = useRef<Graph[]>([]);
  const api = useRef<ViewportApi | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const clip = useRef<Clip | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const lastBg = useRef<{ t: number; x: number; y: number } | null>(null);
  const renameRef = useRef<string | null>(null);
  const gref = useRef(graph); gref.current = graph;

  const compiled = useMemo(() => compile(graph), [graph]);
  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph.nodes]);
  const wireTo = useMemo(() => { const m = new Map<string, Wire>(); graph.wires.forEach((w) => m.set(`${w.to}:${w.port}`, w)); return m; }, [graph.wires]);
  const badNodes = useMemo(() => new Set(compiled.errors.map((e) => e.node).filter(Boolean) as string[]), [compiled.errors]);
  const picked = useMemo(() => new Set(sel), [sel]);

  // ---- history
  const snapshot = useCallback(() => {
    const cur = gref.current, last = past.current[past.current.length - 1];
    if (last && JSON.stringify(last) === JSON.stringify(cur)) return;
    past.current.push(cloneGraph(cur)); if (past.current.length > 100) past.current.shift();
    future.current = []; bump((n) => n + 1);
  }, []);
  const undo = useCallback(() => {
    const p = past.current.pop(); if (!p) return;
    future.current.push(cloneGraph(gref.current)); setGraph(p); setSel([]); setWireSel(null); bump((n) => n + 1);
  }, []);
  const redo = useCallback(() => {
    const f = future.current.pop(); if (!f) return;
    past.current.push(cloneGraph(gref.current)); setGraph(f); setSel([]); setWireSel(null); bump((n) => n + 1);
  }, []);
  const replace = (g: Graph) => { snapshot(); setGraph(g); setSel([]); setWireSel(null); setResult(null); };
  const only = (id: string | null) => { setSel(id ? [id] : []); setWireSel(null); };

  // ---- the canvas, and where the pointer is on it
  const canvasBox = () => root.current?.querySelector('.canvas')?.getBoundingClientRect();
  const said = (t: string) => { setWarn(t); setTimeout(() => setWarn((w) => (w === t ? '' : w)), 5200); };

  // ---- fit the view round the nodes (on first show, when an example opens, and from the button)
  const fit = useCallback(() => {
    const ns = gref.current.nodes; if (!ns.length || !api.current) return;
    api.current.fit({ x0: Math.min(...ns.map((n) => n.x)), y0: Math.min(...ns.map((n) => n.y)), x1: Math.max(...ns.map((n) => n.x + NODE_W)), y1: Math.max(...ns.map((n) => n.y + heightOf(DEF[n.kind], n))) });
  }, []);
  useEffect(() => { const t = setTimeout(fit, 60); return () => clearTimeout(t); }, [fit]);
  const focusNode = (id: string) => {
    const n = gref.current.nodes.find((q) => q.id === id); if (!n) return;
    only(id); api.current?.panTo(n.x + NODE_W / 2, n.y + heightOf(DEF[n.kind], n) / 2);
  };

  // ---- save, quietly
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(graph)); } catch { /* storage blocked */ } }, 300);
    return () => clearTimeout(t);
  }, [graph]);

  // ---- run (on demand, and again shortly after the graph settles)
  const run = useCallback(async (code: string, hasLog = true) => {
    setRunning(true); const r = await runCode(code); setValues(r.probes); setResult(hasLog ? r : null); setRunning(false);
  }, []);
  useEffect(() => {
    if (compiled.page || compiled.errors.length || !graph.nodes.length) { setResult(null); setValues({}); return; }
    const hasLog = graph.nodes.some((n) => n.kind === 'log');
    // Each block reports its value too, so every block can show a live preview of what it produces.
    const probes = graph.nodes.filter((n) => !DEF[n.kind].statement && !onPage(DEF[n.kind]) && !DEF[n.kind].inert).map((n) => `console.probe(${JSON.stringify(n.id)}, ${compiled.names[n.id]});`).join('\n');
    const t = setTimeout(() => run(compiled.code + probes + '\n', hasLog), 450);
    return () => clearTimeout(t);
  }, [compiled, graph.nodes, run]);

  // ---- the page preview: rebuilt shortly after the graph settles, and what it logs comes back here
  useEffect(() => {
    if (!compiled.page) { setPv(''); return; }
    const t = setTimeout(() => { setPv(previewDoc(compiled.doc)); setPageLog([]); }, 350);
    return () => clearTimeout(t);
  }, [compiled.page, compiled.doc]);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || !e.data?.pmcNode) return;
      setPageLog((l) => (l.length > 200 ? l : [...l, { kind: e.data.pmcNode === 'error' ? 'error' : 'log', text: String(e.data.text) }]));
    };
    window.addEventListener('message', on); return () => window.removeEventListener('message', on);
  }, []);
  useEffect(() => { if (opened) said('Opened from a shared link. Your earlier project is under Examples.'); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => {
    const m = (e: PointerEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('pointermove', m); return () => window.removeEventListener('pointermove', m);
  }, []);

  const share = async () => {
    try {
      const link = shareUrl(await pack(gref.current));
      said((await copyToClipboard(link)) ? 'Link copied. Anyone who opens it gets their own copy of this project.' : 'The browser would not let me copy the link.');
    } catch { said('The link could not be made.'); }
  };
  const open = (g: Graph) => { replace(cloneGraph(g)); setMenu(null); setTimeout(fit, 30); };
  const saveFile = () => { downloadText('block-coder-project.json', JSON.stringify(gref.current), 'application/json'); said('Saved as block-coder-project.json.'); };
  const openFile = async (f?: File) => {
    if (!f) return;
    try {
      const g = sanitise(JSON.parse(await f.text()));
      if (!g) { said('That file is not a Block Coder project.'); return; }
      open(g); said(`Opened ${f.name}.`);
    } catch { said('That file could not be read.'); }
  };

  // ---- adding blocks
  const used = (kind: string) => setRecent((r) => { const next = [kind, ...r.filter((k) => k !== kind)].slice(0, 8); try { localStorage.setItem(RECENT, JSON.stringify(next)); } catch { /* storage blocked */ } return next; });
  const centre = () => {
    const c = canvasBox();
    return api.current && c ? api.current.toWorld(c.left + c.width / 2, c.top + c.height / 2) : { x: 120, y: 120 };
  };
  // New nodes go in the free space nearest the middle of what you can see, so they never land out of view.
  const freeSpot = (x: number, y: number, h: number) => {
    const hit = (px: number, py: number) => gref.current.nodes.some((n) => px < n.x + NODE_W + 24 && px + NODE_W + 24 > n.x && py < n.y + heightOf(DEF[n.kind], n) + 24 && py + h + 24 > n.y);
    const c = canvasBox();
    if (c && api.current) {
      const a = api.current.toWorld(c.left, c.top + 64), b = api.current.toWorld(c.right, c.bottom);
      const x0 = a.x + 16, x1 = b.x - NODE_W - 16, y0 = a.y + 8, y1 = b.y - h - 16;
      if (x1 > x0 && y1 > y0) {
        let best: { x: number; y: number } | null = null, bd = Infinity;
        for (let px = x0; px <= x1; px += 40) for (let py = y0; py <= y1; py += 40) {
          const d = (px - x) ** 2 + (py - y) ** 2;
          if (d < bd && !hit(px, py)) { bd = d; best = { x: px, y: py }; }
        }
        if (best) return best;
      }
    }
    for (let ring = 0; ring < 40; ring++) {
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 1], [-1, 0], [0, -1], [1, -1], [-1, -1]]) {
        const px = x + dx * ring * (NODE_W + 24), py = y + dy * ring * 120;
        if (!hit(px, py)) return { x: px, y: py };
      }
    }
    return { x, y };
  };
  const add = (kind: string) => {
    snapshot();
    const c = centre(), h = heightOf(DEF[kind]);
    const spot = freeSpot(c.x - NODE_W / 2, c.y - h / 2, h);
    const [g, node] = makeNode(gref.current, kind, spot.x, spot.y);
    setGraph(g); only(node.id); setMenu(null); setFloat(null); used(kind);
  };
  /** Puts a block exactly where it was asked for, and joins it to the wire it was opened from. */
  const addAt = (kind: string, wx: number, wy: number, wire?: NonNullable<Float>['wire']) => {
    snapshot();
    const d = DEF[kind], from = wire?.side === 'in';
    const [g, node] = makeNode(gref.current, kind, (from ? wx - NODE_W : wx), wy - HEAD / 2);
    let wires = g.wires;
    if (wire) {
      const src = gref.current.nodes.find((n) => n.id === wire.node);
      if (src && wire.side === 'out') {
        const i = d.inputs.findIndex((_, k) => kindProblem(src.kind, kind, k) === null);
        if (i >= 0) wires = [...wires, { id: uid(), from: src.id, to: node.id, port: i }];
      } else if (src && kindProblem(kind, src.kind, wire.port) === null) {
        wires = [...wires.filter((w) => !(w.to === src.id && w.port === wire.port)), { id: uid(), from: node.id, to: src.id, port: wire.port }];
      }
    }
    setGraph({ ...g, nodes: g.nodes.map((n) => (n.id === node.id ? { ...n, x: Math.round(n.x / 4) * 4, y: Math.round(n.y / 4) * 4 } : n)), wires });
    only(node.id); setFloat(null); setMenu(null); used(kind);
  };
  const openFloat = (clientX: number, clientY: number, wire?: NonNullable<Float>['wire']) => {
    const c = canvasBox(); if (!c || !api.current) return;
    const w = api.current.toWorld(clientX, clientY);
    setMenu(null); setFloat({ sx: clientX - c.left, sy: clientY - c.top, wx: w.x, wy: w.y, wire });
  };
  const floatAtMouse = () => {
    const c = canvasBox(); if (!c) return;
    const m = mouse.current, inCanvas = m.x >= c.left && m.x <= c.right && m.y >= c.top && m.y <= c.bottom;
    openFloat(inCanvas ? m.x : c.left + c.width / 2 - 190, inCanvas ? m.y : c.top + 120);
  };

  // ---- editing
  const setVal = (id: string, key: string, v: Val) => setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, v: { ...n.v, [key]: v } } : n)) }));
  const removeNodes = (ids: string[]) => {
    if (!ids.length) return; snapshot(); const s = new Set(ids);
    setGraph((g) => ({ ...g, nodes: g.nodes.filter((n) => !s.has(n.id)), wires: g.wires.filter((w) => !s.has(w.from) && !s.has(w.to)) })); only(null);
  };
  const removeWire = (id: string) => { snapshot(); setGraph((g) => ({ ...g, wires: g.wires.filter((w) => w.id !== id) })); setWireSel(null); };
  const disconnect = (ids: string[]) => { snapshot(); const s = new Set(ids); setGraph((g) => ({ ...g, wires: g.wires.filter((w) => !s.has(w.from) && !s.has(w.to)) })); };
  const connect = (from: string, to: string, port: number) => {
    if (from === to) return;
    const why = wireProblem(gref.current, from, to, port);
    if (why) { said(why); return; }
    snapshot();
    setGraph((g) => ({ ...g, wires: [...g.wires.filter((w) => !(w.to === to && w.port === port)), { id: uid(), from, to, port }] }));
  };
  /** Fold blocks up to their title bar. If any are open they all fold; if all are folded they all open. */
  const fold = (ids: string[], to?: boolean) => {
    const s = new Set(ids); if (!s.size) return;
    const shut = to ?? gref.current.nodes.some((n) => s.has(n.id) && !isCollapsed(n));
    snapshot();
    setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => { if (!s.has(n.id)) return n; const v = { ...n.v }; if (shut) v._c = true; else delete v._c; return { ...n, v }; }) }));
  };
  const beginRename = (id: string) => { renameRef.current = id; setRenaming(id); only(id); };
  const endRename = (id: string, text: string | null) => {
    if (renameRef.current !== id) return;
    renameRef.current = null; setRenaming(null);
    if (text === null) return;
    const t = text.trim().slice(0, 40), cur = gref.current.nodes.find((n) => n.id === id);
    if (!cur || (cur.v._t ?? '') === t) return;
    snapshot();
    setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => { if (n.id !== id) return n; const v = { ...n.v }; if (t) v._t = t; else delete v._t; return { ...n, v }; }) }));
  };
  const dup = () => { if (!sel.length) return; snapshot(); const [g, ids] = duplicate(gref.current, sel); setGraph(g); setSel(ids); setWireSel(null); };
  const copy = () => { const c = copyOut(gref.current, sel); if (c) { clip.current = c; said(`${c.nodes.length} ${c.nodes.length === 1 ? 'block' : 'blocks'} copied.`); } };
  const paste = () => {
    if (!clip.current) { said('Nothing copied yet. Pick some blocks and press Ctrl C.'); return; }
    const c = canvasBox(), m = mouse.current;
    const at = api.current && c && m.x >= c.left && m.x <= c.right && m.y >= c.top && m.y <= c.bottom ? api.current.toWorld(m.x, m.y) : centre();
    snapshot(); const [g, ids] = pasteIn(gref.current, clip.current, at.x, at.y); setGraph(g); setSel(ids); setWireSel(null);
  };
  const doTidy = () => {
    if (!gref.current.nodes.length) return;
    snapshot(); setGraph(tidy(gref.current, sel.length > 1 ? new Set(sel) : undefined));
    if (sel.length < 2) setTimeout(fit, 40);
    said(sel.length > 1 ? 'Tidied the blocks you picked.' : 'Tidied. Undo brings the old layout back.');
  };

  // ---- dragging blocks by their title (every picked block moves together)
  const noSelect = (on: boolean) => { document.body.style.userSelect = on ? 'none' : ''; };
  const startNode = (e: React.PointerEvent, n: GNode) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    e.preventDefault();
    let ids = sel;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      ids = sel.includes(n.id) ? sel.filter((x) => x !== n.id) : [...sel, n.id]; setSel(ids); setWireSel(null);
      if (!ids.includes(n.id)) return;
    } else if (!sel.includes(n.id)) { ids = [n.id]; setSel(ids); setWireSel(null); }
    const before = past.current.length; snapshot(); const pushed = past.current.length > before;
    noSelect(true);
    const orig = new Map(gref.current.nodes.filter((q) => ids.includes(q.id)).map((q) => [q.id, { x: q.x, y: q.y }]));
    const sx = e.clientX, sy = e.clientY, ox = n.x, oy = n.y; let moved = false;
    const move = (ev: PointerEvent) => {
      const k = api.current?.view.k ?? 1; moved = true;
      const dx = Math.round((ox + (ev.clientX - sx) / k) / 4) * 4 - ox, dy = Math.round((oy + (ev.clientY - sy) / k) / 4) * 4 - oy;
      setGraph((g) => ({ ...g, nodes: g.nodes.map((q) => { const o = orig.get(q.id); return o ? { ...q, x: o.x + dx, y: o.y + dy } : q; }) }));
    };
    const up = () => { noSelect(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (!moved && pushed) { past.current.pop(); bump((v) => v + 1); } };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // ---- dragging a box over empty canvas to pick what is inside
  const startBox = (e: React.PointerEvent) => {
    const a = api.current!.toWorld(e.clientX, e.clientY), base = e.shiftKey ? sel : [];
    setBox({ a, b: a }); setWireSel(null); noSelect(true);
    const move = (ev: PointerEvent) => {
      const b = api.current!.toWorld(ev.clientX, ev.clientY); setBox({ a, b });
      setSel([...new Set([...base, ...inside(gref.current, a, b)])]);
    };
    const up = () => { noSelect(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setBox(null); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const background = (e: React.PointerEvent<HTMLDivElement>) => {
    setMenu(null); setFloat(null); setHelp(false);
    if (renameRef.current) endRename(renameRef.current, null);
    const now = Date.now(), last = lastBg.current; lastBg.current = { t: now, x: e.clientX, y: e.clientY };
    if (last && now - last.t < 380 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 8) { openFloat(e.clientX, e.clientY); return true; }
    if (e.shiftKey || boxMode) { startBox(e); return true; }
    setSel([]); setWireSel(null);
    return false;
  };

  // ---- dragging a wire from a port (either end)
  const startWire = (e: React.PointerEvent, node: string, side: 'out' | 'in', port = 0) => {
    e.preventDefault(); e.stopPropagation();
    let from = side, n = node, p = port;
    const existing = side === 'in' ? wireTo.get(`${node}:${port}`) : undefined;
    if (existing) { snapshot(); setGraph((g) => ({ ...g, wires: g.wires.filter((w) => w.id !== existing.id) })); from = 'out'; n = existing.from; p = 0; }
    const pos = (ev: PointerEvent | React.PointerEvent) => api.current!.toWorld(ev.clientX, ev.clientY);
    noSelect(true); setDrag({ from, node: n, port: p, ...pos(e) }); setFloat(null); setMenu(null);
    const move = (ev: PointerEvent) => setDrag({ from, node: n, port: p, ...pos(ev) });
    const up = (ev: PointerEvent) => {
      noSelect(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setDrag(null);
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const port$ = el?.closest<HTMLElement>('[data-port]');
      if (port$) {
        const [kind, id, idx] = port$.dataset.port!.split(':');
        if (from === 'out' && kind === 'in') connect(n, id, Number(idx));
        else if (from === 'in' && kind === 'out') connect(id, n, p);
        return;
      }
      // dropped on a node's body: use its first free input (or the first one)
      const body = el?.closest<HTMLElement>('[data-node]');
      if (body && from === 'out' && body.dataset.node !== n) {
        const target = nodeById.get(body.dataset.node!); if (!target) return;
        const count = DEF[target.kind].inputs.length; if (!count) return;
        const fits = (i: number) => wireProblem(gref.current, n, target.id, i) === null;
        let idx = -1; for (let i = 0; i < count && idx < 0; i++) if (fits(i) && !wireTo.get(`${target.id}:${i}`)) idx = i;
        for (let i = 0; i < count && idx < 0; i++) if (fits(i)) idx = i;
        if (idx < 0) { said(wireProblem(gref.current, n, target.id, 0) ?? 'That cannot be joined.'); return; }
        connect(n, target.id, idx);
        return;
      }
      // let go in empty space: offer the blocks this wire could plug into
      if (!body && el?.closest('.canvas') && !el.closest('[data-nowheel]')) openFloat(ev.clientX, ev.clientY, { node: n, side: from, port: p });
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // ---- keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (/input|textarea|select/i.test(el?.tagName ?? '') || el?.isContentEditable || el?.closest('[data-pop], .ui-sel, .ui-col')) return;
      if (!root.current?.contains(el) && el !== document.body && el?.id !== 'main') return;
      const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && k === 'y') { e.preventDefault(); redo(); }
      else if (mod && e.key === 'Enter') { e.preventDefault(); const c = compile(gref.current); if (!c.page) run(c.code); }
      else if (mod && k === 'a') { e.preventDefault(); setSel(gref.current.nodes.map((n) => n.id)); setWireSel(null); }
      else if (mod && k === 'd') { e.preventDefault(); dup(); }
      else if (mod && k === 'c') { e.preventDefault(); copy(); }
      else if (mod && k === 'x') { e.preventDefault(); copy(); removeNodes(sel); }
      else if (mod && k === 'v') { e.preventDefault(); paste(); }
      else if (!mod && (e.key === 'Delete' || e.key === 'Backspace') && (sel.length || wireSel)) { e.preventDefault(); if (sel.length) removeNodes(sel); else if (wireSel) removeWire(wireSel); }
      else if (e.key.startsWith('Arrow') && sel.length) {
        e.preventDefault(); const s = e.shiftKey ? 40 : 8; snapshot();
        const dx = e.key === 'ArrowLeft' ? -s : e.key === 'ArrowRight' ? s : 0, dy = e.key === 'ArrowUp' ? -s : e.key === 'ArrowDown' ? s : 0;
        setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (picked.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)) }));
      } else if (e.key === 'Escape') { if (help) setHelp(false); else if (float || menu) { setFloat(null); setMenu(null); } else { setSel([]); setWireSel(null); } }
      else if (!mod && !e.altKey) {
        if (k === 'f') { e.preventDefault(); fit(); }
        else if (k === 't') { e.preventDefault(); doTidy(); }
        else if (k === 'c') { e.preventDefault(); fold(sel); }
        else if (k === 'a' || e.key === '/') { e.preventDefault(); floatAtMouse(); }
        else if (e.key === '?') { e.preventDefault(); setHelp((h) => !h); }
      }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    if (!menu && !float) return;
    const close = (e: PointerEvent) => { const t = e.target as HTMLElement; if (!t.closest('.ng-menu-wrap, .ng-float')) { setMenu(null); setFloat(null); } };
    document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close);
  }, [menu, float]);

  const hlLine = sel.length === 1 ? compiled.lines[sel[0]] : undefined;
  const codeLines = compiled.code.replace(/\n$/, '').split('\n');

  // when a wire was let go in empty space, only blocks that could plug into it are offered
  const allowFor = useMemo(() => {
    const w = float?.wire; if (!w) return undefined;
    const nd = gref.current.nodes.find((n) => n.id === w.node); if (!nd) return undefined;
    return w.side === 'out'
      ? (d: Def) => d.inputs.some((_, i) => kindProblem(nd.kind, d.kind, i) === null)
      : (d: Def) => kindProblem(d.kind, nd.kind, w.port) === null;
  }, [float]);
  const floatWhy = (() => {
    const w = float?.wire; const nd = w && nodeById.get(w.node); if (!w || !nd) return undefined;
    return w.side === 'out' ? `Blocks that ${DEF[nd.kind].name} can plug into` : `Blocks that can feed “${DEF[nd.kind].inputs[w.port]?.label ?? 'this input'}”`;
  })();

  /** The line a folded block shows: what is plugged in and what has been changed from the usual. */
  const summary = (d: Def, n: GNode) => {
    const bits: string[] = [];
    d.inputs.forEach((p, i) => {
      const w = wireTo.get(`${n.id}:${i}`);
      if (w) { const f = nodeById.get(w.from); if (f) bits.push(String(f.v._t || '') || DEF[f.kind].name); }
      else if (p.def !== undefined && p.as !== 'list' && String(n.v[p.key] ?? '') !== String(p.def)) bits.push(String(n.v[p.key]));
    });
    d.params.forEach((p) => { const v = String(n.v[p.key] ?? ''); if (v !== '' && v !== String(p.def)) bits.push(v); });
    return bits.length ? bits.join(', ') : d.blurb;
  };

  // ---------------------------------------------------------------- the toolbar
  const toolbar = (
    <>
      <div className="ng-menu-wrap">
        <button type="button" className="btn small gold" aria-expanded={menu === 'add'} aria-haspopup="menu" onClick={() => { setMenu(menu === 'add' ? null : 'add'); setFloat(null); }} title="Add a block (A)">Add block</button>
        {menu === 'add' && <AddMenu recent={recent} onPick={add} onClose={() => setMenu(null)} />}
      </div>
      <div className="ng-menu-wrap">
        <button type="button" className="btn small" aria-expanded={menu === 'examples'} aria-haspopup="menu" onClick={() => { setMenu(menu === 'examples' ? null : 'examples'); setFloat(null); }}>Examples</button>
        {menu === 'examples' && (
          <div className="ng-menu narrow" role="menu" data-nowheel>
            <div className="ng-menu-grp">
              <button type="button" role="menuitem" onClick={() => open(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)].graph)}><b className="d">Surprise me</b><span className="tx">Open a random one</span></button>
              {backup && <button type="button" role="menuitem" onClick={() => open(backup)}><b className="d">My earlier project</b><span className="tx">What you had before opening a shared link</span></button>}
            </div>
            {EXAMPLE_GROUPS.map((gr) => (
              <div key={gr.id} className="ng-menu-grp">
                <h3 className="d">{gr.name}<small className="tx">{EXAMPLES.filter((x) => x.group === gr.id).length}</small></h3>
                {EXAMPLES.filter((x) => x.group === gr.id).map((x) => (
                  <button key={x.id} type="button" role="menuitem" onClick={() => open(x.graph)}><b className="d">{x.name}</b><span className="tx">{x.blurb}</span></button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <span className="ng-gap" aria-hidden />
      <button type="button" className="btn small" onClick={undo} disabled={!past.current.length} aria-label="Undo" title="Undo (Ctrl Z)">Undo</button>
      <button type="button" className="btn small" onClick={redo} disabled={!future.current.length} aria-label="Redo" title="Redo (Ctrl Shift Z)">Redo</button>
      <span className="ng-gap" aria-hidden />
      <button type="button" className="btn small" onClick={doTidy} disabled={!graph.nodes.length} title="Line the blocks up in columns (T)">Tidy</button>
      <button type="button" className="btn small" onClick={fit} disabled={!graph.nodes.length} title="Fit everything in view (F)">Fit</button>
      <button type="button" className="btn small" aria-pressed={boxMode} onClick={() => setBoxMode((b) => !b)} title="Drag across empty space to pick blocks (or hold Shift)">Select</button>
      <div className="ng-menu-wrap">
        <button type="button" className="btn small" aria-expanded={menu === 'more'} aria-haspopup="menu" onClick={() => { setMenu(menu === 'more' ? null : 'more'); setFloat(null); }}>More</button>
        {menu === 'more' && (
          <div className="ng-menu narrow right" role="menu" data-nowheel>
            <div className="ng-menu-grp">
              <button type="button" role="menuitem" onClick={() => { setMenu(null); saveFile(); }} disabled={!graph.nodes.length}><b className="d">Save project file</b><span className="tx">Keep a copy you can open later</span></button>
              <button type="button" role="menuitem" onClick={() => { setMenu(null); fileIn.current?.click(); }}><b className="d">Open project file</b><span className="tx">A file you saved before</span></button>
              <button type="button" role="menuitem" onClick={() => { setMenu(null); share(); }} disabled={!graph.nodes.length}><b className="d">Copy share link</b><span className="tx">A link a friend can open</span></button>
            </div>
            <div className="ng-menu-grp">
              <button type="button" role="menuitem" onClick={() => { setMenu(null); setSel(graph.nodes.map((n) => n.id)); }} disabled={!graph.nodes.length}><b className="d">Select all</b><span className="tx">Ctrl A</span></button>
              <button type="button" role="menuitem" onClick={() => { setMenu(null); fold(graph.nodes.map((n) => n.id), true); }} disabled={!graph.nodes.length}><b className="d">Fold every block</b><span className="tx">Only the title bars stay</span></button>
              <button type="button" role="menuitem" onClick={() => { setMenu(null); fold(graph.nodes.map((n) => n.id), false); }} disabled={!graph.nodes.length}><b className="d">Unfold every block</b><span className="tx">Show everything again</span></button>
              <button type="button" role="menuitem" onClick={() => { setMenu(null); replace(emptyGraph()); }} disabled={!graph.nodes.length}><b className="d">Clear the canvas</b><span className="tx">Undo brings it back</span></button>
            </div>
            <div className="ng-menu-grp">
              <button type="button" role="menuitem" onClick={() => { setMenu(null); setHelp(true); }}><b className="d">Keyboard shortcuts</b><span className="tx">Press ? any time</span></button>
            </div>
          </div>
        )}
        <input ref={fileIn} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; openFile(f); }} />
      </div>
    </>
  );

  // ---------------------------------------------------------------- the code, output and page preview
  const jump = (node?: string) => { if (node) focusNode(node); };
  const messages = (
    <>
      {compiled.errors.map((e, i) => <button key={'e' + i} type="button" className="ng-msg err" onClick={() => jump(e.node)}>{e.message}</button>)}
      {compiled.page && pageLog.map((l, i) => <div key={'p' + i} className={l.kind === 'error' ? 'ng-line err' : 'ng-line'}>{l.text}</div>)}
      {compiled.page && !pageLog.length && !compiled.errors.length && <div className="ng-line dim">Nothing printed. A Log block prints here when the page runs.</div>}
      {compiled.notes.map((n, i) => <button key={'n' + i} type="button" className="ng-msg note" onClick={() => jump(n.node)}>{n.message}</button>)}
    </>
  );
  const plain = (text: string) => <pre className="code ng-pre" tabIndex={0}>{text.replace(/\n$/, '').split('\n').map((l, i) => <div key={i} className="ln">{l || ' '}</div>)}</pre>;
  const TABS = [['preview', 'Preview'], ['html', 'HTML'], ['css', 'CSS'], ['js', 'JS'], ['output', compiled.errors.length + compiled.notes.length + pageLog.filter((l) => l.kind === 'error').length ? `Output (${compiled.errors.length + compiled.notes.length + pageLog.filter((l) => l.kind === 'error').length})` : 'Output']] as const;
  const copyText = tab === 'html' ? compiled.html : tab === 'css' ? compiled.css : compiled.code;

  const side = compiled.page ? (
    <div className="ng-side">
      <section className="ng-pane solo" aria-label="Your page">
        <div className="ng-pane-top">
          <div className="ng-tabs" role="tablist" aria-label="Page views">
            {TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className="ng-tab" onClick={() => setTab(id)}>{label}</button>)}
          </div>
          <span>
            {tab === 'preview' && <button type="button" className="btn small" onClick={() => setPvKey((k) => k + 1)} title="Start the page again">Restart</button>}
            {(tab === 'html' || tab === 'css' || tab === 'js') && <CopyButton text={copyText} />}
            {tab === 'css' && <button type="button" className="btn small" onClick={() => downloadText('style.css', compiled.css, 'text/css')}>Save .css</button>}
            {tab === 'js' && <button type="button" className="btn small" onClick={() => downloadText('script.js', compiled.code, 'text/javascript')}>Save .js</button>}
            {tab !== 'css' && tab !== 'js' && tab !== 'output' && <button type="button" className="btn small gold" onClick={() => downloadText('my-page.html', compiled.doc, 'text/html')} title="One file you can open in any browser">Save .html</button>}
          </span>
        </div>
        {tab === 'preview' && (pv
          ? <div className="ng-prev"><iframe key={pvKey} ref={frame} className="ng-frame" title="Page preview" sandbox="allow-scripts" srcDoc={pv} /></div>
          : <div className="ng-out code"><div className="ng-line dim">Building the page…</div></div>)}
        {tab === 'html' && plain(compiled.html || '<!-- Add a Heading, Text or Button node. -->')}
        {tab === 'css' && plain(compiled.css)}
        {tab === 'js' && <pre className="code ng-pre" tabIndex={0}>{codeLines.map((l, i) => <div key={i} className={`ln${i === hlLine ? ' on' : ''}`}>{l ? colour(l) : ' '}</div>)}</pre>}
        {tab === 'output' && <div className="ng-out code" aria-live="polite">{messages}</div>}
      </section>
    </div>
  ) : (
    <div className="ng-side">
      <section className="ng-pane" aria-label="Generated code">
        <div className="ng-pane-top"><h3 className="d">Code</h3>
          <span><CopyButton text={compiled.code} /><button type="button" className="btn small" onClick={() => downloadText('block-coder.js', compiled.code, 'text/javascript')}>Save .js</button></span></div>
        <pre className="code ng-pre" tabIndex={0}>{codeLines.map((l, i) => <div key={i} className={`ln${i === hlLine ? ' on' : ''}`}>{l ? colour(l) : ' '}</div>)}</pre>
      </section>
      <section className="ng-pane" aria-label="Output" aria-live="polite">
        <div className="ng-pane-top"><h3 className="d">Output</h3>
          <button type="button" className="btn small gold" disabled={running || compiled.errors.length > 0} onClick={() => run(compiled.code)} title="Run (Ctrl Enter)">{running ? 'Running' : 'Run'}</button></div>
        <div className="ng-out code">
          {compiled.errors.map((e, i) => <button key={'e' + i} type="button" className="ng-msg err" onClick={() => jump(e.node)}>{e.message}</button>)}
          {result?.lines.map((l, i) => <div key={i} className={l.kind === 'error' ? 'ng-line err' : 'ng-line'}>{l.text}</div>)}
          {result && !result.lines.length && <div className="ng-line dim">It ran, and printed nothing.</div>}
          {!result && !compiled.errors.length && <div className="ng-line dim">{graph.nodes.some((n) => n.kind === 'log') ? 'Running…' : 'Connect something to a Log node and its value shows here.'}</div>}
          {result && !result.timedOut && <div className="ng-line dim">{result.ms < 1 ? 'under 1 ms' : `${Math.round(result.ms)} ms`}</div>}
          {compiled.notes.map((n, i) => <button key={'n' + i} type="button" className="ng-msg note" onClick={() => jump(n.node)}>{n.message}</button>)}
        </div>
      </section>
    </div>
  );

  // ---------------------------------------------------------------- what floats over the canvas
  const overlay = (a: ViewportApi) => {
    const { w, h } = a.size();
    const FW = Math.min(620, Math.max(260, w - 24)), FH = Math.min(window.innerHeight * 0.7, 520);
    const one = sel.length === 1 ? nodeById.get(sel[0]) : null;
    const anyOpen = sel.some((id) => { const n = nodeById.get(id); return n && !isCollapsed(n); });
    return (
      <>
        {!graph.nodes.length && !float && <p className="ng-empty tx">An empty canvas. Press <b>A</b> or double-click here to add a block, or open <b>Examples</b> to start from a working project.</p>}
        {sel.length > 0 && (
          <div className="ng-selbar" role="toolbar" aria-label="Picked blocks" data-nowheel>
            <b className="d">{sel.length === 1 ? (one ? (String(one.v._t || '') || DEF[one.kind].name) : '1 block') : `${sel.length} blocks`}</b>
            {one && <button type="button" onClick={() => beginRename(one.id)}>Rename</button>}
            <button type="button" onClick={dup} title="Ctrl D">Duplicate</button>
            <button type="button" onClick={() => fold(sel)} title="C">{anyOpen ? 'Fold' : 'Unfold'}</button>
            {sel.length > 1 && <button type="button" onClick={doTidy} title="T">Tidy</button>}
            <button type="button" onClick={() => disconnect(sel)} disabled={!graph.wires.some((x) => picked.has(x.from) || picked.has(x.to))}>Unplug</button>
            <button type="button" className="danger" onClick={() => removeNodes(sel)} title="Delete">Delete</button>
          </div>
        )}
        {float && (
          <div className="ng-float" style={{ left: Math.max(12, Math.min(float.sx, w - FW - 12)), top: Math.max(64, Math.min(float.sy, h - FH - 12)), width: FW }}>
            <AddMenu recent={recent} allow={allowFor} heading={floatWhy} onPick={(k) => addAt(k, float.wx, float.wy, float.wire)} onClose={() => setFloat(null)} />
          </div>
        )}
        {graph.nodes.length >= 5 && <Minimap nodes={graph.nodes} picked={picked} api={a} />}
        <p className={`ng-status${warn ? ' warn' : ''}`} role="status">{warn}</p>
        {help && (
          <div className="ng-help" role="dialog" aria-label="Keyboard shortcuts" data-nowheel onPointerDown={(e) => e.stopPropagation()}>
            <div className="ng-help-top"><h3 className="d">Shortcuts</h3><button type="button" className="ng-x" aria-label="Close" onClick={() => setHelp(false)}>&times;</button></div>
            <dl>{SHORTCUTS.map(([k, v]) => <div key={k}><dt className="code">{k}</dt><dd className="tx">{v}</dd></div>)}</dl>
          </div>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------- the canvas
  return (
    <div ref={root} className="ng">
      <FullscreenViewport always name="Block Coder" sideLabel="code" toolbar={toolbar} side={side} sideWide={compiled.page} minZoom={0.3} maxZoom={2} onBackgroundDown={background} canvasOverlay={overlay}>
        {(a) => {
          api.current = a;
          return (
            <>
              <svg className="ng-wires" width="1" height="1" aria-hidden>
                {graph.wires.map((w) => {
                  const f = nodeById.get(w.from), t = nodeById.get(w.to); if (!f || !t) return null;
                  const d = curve(outPort(f), inPort(t, w.port)), on = wireSel === w.id;
                  return (
                    <g key={w.id}>
                      <path d={d} className="ng-hit" onPointerDown={(e) => { e.stopPropagation(); setWireSel(w.id); setSel([]); }} />
                      <path d={d} className={`ng-wire${on ? ' sel' : ''}`} />
                    </g>
                  );
                })}
                {drag && (() => {
                  const n = nodeById.get(drag.node); if (!n) return null;
                  const here = { x: drag.x, y: drag.y };
                  return <path className="ng-wire drag" d={drag.from === 'out' ? curve(outPort(n), here) : curve(here, inPort(n, drag.port))} />;
                })()}
              </svg>

              {box && <div className="ng-box" style={{ left: Math.min(box.a.x, box.b.x), top: Math.min(box.a.y, box.b.y), width: Math.abs(box.a.x - box.b.x), height: Math.abs(box.a.y - box.b.y) }} />}

              {graph.nodes.map((n) => {
                const d = DEF[n.kind];
                const chosen = picked.has(n.id), folded = isCollapsed(n);
                const custom = typeof n.v._t === 'string' ? n.v._t : '';
                return (
                  <div key={n.id} data-node={n.id} className={`ng-node g-${d.group}${chosen ? ' sel' : ''}${badNodes.has(n.id) ? ' bad' : ''}${folded ? ' fold' : ''}${d.inert ? ' inert' : ''}`}
                    style={{ left: n.x, top: n.y, width: NODE_W, height: heightOf(d, n) }}
                    onPointerDown={(e) => { if (!(e.target as HTMLElement).closest('.ng-head') && !picked.has(n.id) && !(e.shiftKey || e.ctrlKey || e.metaKey)) only(n.id); }}>
                    {values[n.id] !== undefined && !d.statement && !onPage(d) && !d.inert && <div className="ng-val" aria-label={`${d.name} currently gives ${values[n.id]}`}><i>now</i><b className="code">{values[n.id]}</b></div>}
                    <div className="ng-head" title={`${d.name}: ${d.blurb}`} onPointerDown={(e) => startNode(e, n)} onDoubleClick={() => beginRename(n.id)}>
                      <button type="button" className="ng-fold" aria-expanded={!folded} aria-label={`${folded ? 'Unfold' : 'Fold'} ${custom || d.name}`} title={folded ? 'Unfold' : 'Fold up'} onClick={() => fold([n.id])}><i /></button>
                      {renaming === n.id ? (
                        <input className="ng-ren" autoFocus defaultValue={custom} placeholder={d.name} maxLength={40} aria-label={`Name for ${d.name}`} spellCheck={false}
                          onFocus={(e) => e.currentTarget.select()}
                          onKeyDown={(e) => { if (e.key === 'Enter') endRename(n.id, e.currentTarget.value); else if (e.key === 'Escape') endRename(n.id, null); e.stopPropagation(); }}
                          onBlur={(e) => endRename(n.id, e.currentTarget.value)} />
                      ) : <span className="d ng-t">{custom || d.name}</span>}
                      <button type="button" className="ng-x" aria-label={`Delete ${custom || d.name}`} onClick={() => removeNodes([n.id])}>&times;</button>
                    </div>
                    {folded && <div className="ng-sum tx">{summary(d, n)}</div>}
                    {folded && d.inputs.length > 0 && <i className="ng-port in dot" aria-hidden />}
                    {!folded && d.inputs.map((p, i) => {
                      const w = wireTo.get(`${n.id}:${i}`), src = w ? nodeById.get(w.from) : null;
                      return (
                        <div key={p.key} className="ng-row" style={{ top: HEAD + ROW * i }}>
                          <button type="button" className={`ng-port in${w ? ' wired' : ''}`} data-k={p.accepts ?? 'value'} data-port={`in:${n.id}:${i}`} aria-label={`${d.name} input ${p.label}`} title={p.label}
                            onPointerDown={(e) => startWire(e, n.id, 'in', i)} />
                          <span className="ng-l tx">{p.label}</span>
                          {w && src ? <span className="ng-from tx">{String(src.v._t || '') || DEF[src.kind].name}</span>
                            : p.def !== undefined && p.as !== 'list' ? (
                              <input className="ng-f" type={p.as === 'number' ? 'number' : 'text'} value={String(n.v[p.key] ?? '')} aria-label={`${d.name} ${p.label}`}
                                onFocus={snapshot} onChange={(e) => setVal(n.id, p.key, e.target.value)} />
                            ) : <span className="ng-from tx dim">{p.empty ?? (p.as === 'list' ? 'a list' : 'nothing yet')}</span>}
                        </div>
                      );
                    })}
                    {!folded && d.params.map((p, j) => (
                      <div key={p.key} className="ng-row" style={{ top: HEAD + ROW * (d.inputs.length + j) }}>
                        <span className="ng-l tx">{p.label}</span>
                        {p.type === 'select' ? (
                          <Select compact value={String(n.v[p.key])} label={`${d.name} ${p.label}`} onOpen={snapshot} onChange={(v) => setVal(n.id, p.key, v)} options={p.options!.map((o) => ({ value: o, label: o, font: p.key === 'font' ? FONTS[o] : undefined }))} />
                        ) : p.type === 'color' ? (
                          <span className="ng-col">
                            <ColorPicker compact value={String(n.v[p.key] || '')} label={`${d.name} ${p.label}`} onOpen={snapshot} onChange={(v) => setVal(n.id, p.key, v)} />
                            {n.v[p.key] ? <button type="button" className="ng-clear" onClick={() => { snapshot(); setVal(n.id, p.key, ''); }}>clear</button> : <span className="ng-from tx dim">not set</span>}
                          </span>
                        ) : (
                          <input className={`ng-f${p.type === 'expr' ? ' code' : ''}`} type={p.type === 'number' ? 'number' : 'text'} value={String(n.v[p.key] ?? '')} placeholder={p.placeholder}
                            aria-label={`${d.name} ${p.label}`} spellCheck={false} onFocus={snapshot} onChange={(e) => setVal(n.id, p.key, e.target.value)} />
                        )}
                      </div>
                    ))}
                    {d.statement || d.out === 'none' ? null : (
                      <button type="button" className={`ng-port out${folded ? ' fold' : ''}`} data-k={d.out ?? 'value'} data-port={`out:${n.id}:0`} aria-label={`${d.name} output`} title="Drag to a block to plug it in" onPointerDown={(e) => startWire(e, n.id, 'out')} />
                    )}
                  </div>
                );
              })}
            </>
          );
        }}
      </FullscreenViewport>
    </div>
  );
}
