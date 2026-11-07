import Link from 'next/link';
import type { AppMeta } from '@/lib/types';
import { categoryBySlug } from '@/lib/categories';

/** Shown by scaffolded apps until their real view ships. Says plainly that the tool isn't ready. */
export function ToolPending({ meta }: { meta: AppMeta }) {
  const cat = categoryBySlug(meta.category);
  return (
    <div className="panel">
      <h2>Not built yet.</h2>
      <div className="tool-actions">
        <Link className="btn primary" href="/case-converter">Try the Case Converter</Link>
        <Link className="btn" href={`/${meta.category}`}>More in {cat?.name}</Link>
      </div>
    </div>
  );
}
