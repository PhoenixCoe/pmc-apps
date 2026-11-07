'use client';
import { useRef, type ComponentType } from 'react';
import { LoadingTracker, useLoadSequence, type LoadStep } from '@/components/shared/LoadingTracker';
import { compile, sanitise, type Graph, cloneGraph } from './graph';
import { EXAMPLES } from './examples';
import { warmRunner } from './runner';
import { sharedToken, unpack } from './share';

const STORE = 'pmc:block-coder:graph';
const OLD_STORE = 'pmc:node-coder-engine:graph';   // from when this app was called Node Coder
const BACKUP = 'pmc:block-coder:earlier';           // your own project, kept safe when a shared link replaces it
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/**
 * Block Coder. The editor is a separate chunk, so the page shows the loader while it is fetched and
 * while each real piece of set-up runs: the code generator, the code runner, the code font and your last graph.
 */
export default function View() {
  const made = useRef<{ Editor?: ComponentType<{ initial: Graph; backup?: Graph | null; opened?: boolean }>; initial?: Graph; backup?: Graph | null; opened?: boolean }>({});
  const plan = useRef<(LoadStep)[] | null>(null);
  if (!plan.current) {
    plan.current = [
      { label: 'Loading the editor', run: async () => { made.current.Editor = (await import('./Editor')).Editor; } },
      { label: 'Checking the code generator', run: async () => { const c = compile(EXAMPLES[0].graph); if (c.errors.length) throw new Error('the code generator failed its own check'); } },
      { label: 'Starting the code runner', run: () => warmRunner() },
      { label: 'Loading the code font', run: async () => { try { await document.fonts.load('14px "JetBrains Mono"'); } catch { /* the page falls back to another monospace font */ } } },
      { label: 'Restoring your last graph', run: async () => {
          const read = (key: string): Graph | null => { try { const raw = localStorage.getItem(key); return raw ? sanitise(JSON.parse(raw)) : null; } catch { return null; } };
          const mine = read(STORE) ?? read(OLD_STORE);
          const token = sharedToken();
          const shared = token ? await unpack(token) : null;
          if (shared) {
            // A shared link opens as its own copy. Whatever you had is kept, and is under Examples as "My earlier project".
            if (mine?.nodes.length) { try { localStorage.setItem(BACKUP, JSON.stringify(mine)); } catch { /* storage blocked */ } }
            try { history.replaceState(null, '', location.pathname + location.search); } catch { /* ignore */ }
            made.current.initial = shared; made.current.opened = true;
          } else made.current.initial = mine ?? cloneGraph(EXAMPLES[0].graph);
          made.current.backup = read(BACKUP);
        } },
      { label: 'Laying out the canvas', run: async () => { await frame(); } },
    ];
  }
  const load = useLoadSequence(plan.current, { minMs: 1500 });
  if (!load.ready) return <LoadingTracker full title="Block Coder" what="assets" steps={plan.current.map((s) => s.label)} index={load.index} error={load.error} />;
  const { Editor, initial, backup, opened } = made.current;
  return Editor && initial ? <Editor initial={initial} backup={backup} opened={opened} /> : null;
}
