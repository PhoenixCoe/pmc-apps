import type { ReactNode } from 'react';

/**
 * The coloured band under the top bar that names the page: an optional picture, the title in big capitals, and one short line.
 * Give it a group (`g`) to take that group's colour, or a `tone` for the plain pages (Settings, Privacy).
 */
export function Band({ title, line, icon, g, tone }: { title: string; line?: string; icon?: ReactNode; g?: string; tone?: 'ink' | 'gold' | 'cream' }) {
  return (
    <header className={`band${g ? ' gtone' : ''}${tone ? ` tone-${tone}` : ''}`} data-g={g}>
      <div className="wrap band-in">
        {icon && <span className="band-ic" aria-hidden>{icon}</span>}
        <div className="band-t">
          <h1 className="d">{title}</h1>
          {line && <p className="band-line tx">{line}</p>}
        </div>
      </div>
    </header>
  );
}
