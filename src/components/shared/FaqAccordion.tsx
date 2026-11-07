import type { FaqItem } from '@/lib/types';

/** Three questions as a ruled list inside a plate. Native <details>: indexable, keyboard-friendly, no JavaScript. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <section className="sec" aria-labelledby="faq-title">
      <div className="sec-h"><h2 id="faq-title" className="d">Questions</h2></div>
      <div className="panel faq">
        <ul className="decisions">
          {items.map((f) => (
            <li key={f.q}>
              <details>
                <summary><h3>{f.q}</h3></summary>
                <p className="tx">{f.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
