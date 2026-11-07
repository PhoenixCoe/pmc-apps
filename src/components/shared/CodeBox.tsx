import { CopyButton } from './CopyButton';

/** A titled output block with a copy button. Content is JetBrains Mono with ligatures. */
export function CodeBox({ title, text, extra, empty = 'Nothing to show yet.' }: { title: string; text: string; extra?: React.ReactNode; empty?: string }) {
  return (
    <div className="result">
      <div className="result-top">
        <span>{title}</span>
        <span style={{ display: 'flex', gap: 8 }}>{extra}<CopyButton text={text} /></span>
      </div>
      <pre className="code" tabIndex={0}>{text || <span style={{ opacity: 0.8 }}>{empty}</span>}</pre>
    </div>
  );
}
