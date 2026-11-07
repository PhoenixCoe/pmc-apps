'use client';
import { useEffect, useRef } from 'react';

/** The dashed "drop files here" box every file app starts with. Click, drop or paste. */
export function FileDrop({ onFiles, accept, multiple = true, title = 'Drop files here, or click to choose', hint, paste = false }: {
  onFiles: (files: File[]) => void; accept?: string; multiple?: boolean; title?: string; hint?: string; paste?: boolean;
}) {
  const ref = useRef(onFiles); ref.current = onFiles;
  useEffect(() => {
    if (!paste) return;
    const on = (e: ClipboardEvent) => { const f = [...(e.clipboardData?.files ?? [])]; if (f.length) ref.current(f); };
    window.addEventListener('paste', on); return () => window.removeEventListener('paste', on);
  }, [paste]);
  return (
    <label className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = [...e.dataTransfer.files]; if (f.length) onFiles(multiple ? f : f.slice(0, 1)); }}>
      <input type="file" accept={accept} multiple={multiple} onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ''; if (f.length) onFiles(f); }} />
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </label>
  );
}
