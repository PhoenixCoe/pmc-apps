import { formatPython } from './python';

export type Lang = 'js' | 'ts' | 'html' | 'css' | 'python' | 'sql';
export type SqlDialect = 'sql' | 'postgresql' | 'mysql' | 'sqlite' | 'transactsql';

export interface FormatOptions {
  useTabs: boolean; tabWidth: number; printWidth: number; semi: boolean; singleQuote: boolean;
  trailingComma: 'none' | 'es5' | 'all'; dialect: SqlDialect; keywordCase: 'upper' | 'lower' | 'preserve';
}
export const defaultOptions: FormatOptions = { useTabs: false, tabWidth: 2, printWidth: 80, semi: true, singleQuote: false, trailingComma: 'all', dialect: 'sql', keywordCase: 'upper' };

export interface Issue { line: number | null; column?: number | null; message: string }
export type FormatResult = { ok: true; text: string; issues: Issue[] } | { ok: false; issues: Issue[]; frame?: string };

/** Pull a clean message and position out of a Prettier or sql-formatter error. */
function describe(e: unknown): { issue: Issue; frame?: string } {
  const err = e as { message?: string; loc?: { start?: { line?: number; column?: number } }; codeFrame?: string };
  const first = (err.message ?? 'Could not read this code.').split('\n')[0];
  let line = err.loc?.start?.line ?? null, column = err.loc?.start?.column ?? null;
  const m = /line (\d+) column (\d+)/i.exec(first) ?? /\((\d+):(\d+)\)\s*$/.exec(first);
  if (m && line === null) { line = Number(m[1]); column = Number(m[2]); }
  return { issue: { line, column, message: first.replace(/\s*\(\d+:\d+\)\s*$/, '').replace(/^Parse error: /, '') }, frame: err.codeFrame };
}

/** Bracket and quote balance for SQL, skipping strings and comments. */
export function sqlIssues(sql: string): Issue[] {
  const issues: Issue[] = [];
  const open: number[] = [];
  let line = 1;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === '\n') line++;
    else if (c === '-' && sql[i + 1] === '-') { while (i < sql.length && sql[i] !== '\n') i++; line++; }
    else if (c === '/' && sql[i + 1] === '*') {
      const start = line; const end = sql.indexOf('*/', i + 2);
      if (end === -1) { issues.push({ line: start, message: 'This comment is never closed.' }); break; }
      line += (sql.slice(i, end).match(/\n/g) ?? []).length; i = end + 1;
    } else if (c === "'" || c === '"' || c === '`') {
      const start = line; let j = i + 1;
      while (j < sql.length && sql[j] !== c) { if (sql[j] === '\n') line++; j++; }
      if (j >= sql.length) { issues.push({ line: start, message: `This ${c === "'" ? 'string' : 'quoted name'} is never closed.` }); break; }
      i = j;
    } else if (c === '(') open.push(line);
    else if (c === ')') { if (open.pop() === undefined) issues.push({ line, message: 'Unexpected ")" with no matching "(".' }); }
  }
  open.forEach((l) => issues.push({ line: l, message: 'This "(" is never closed.' }));
  return issues.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
}

export async function formatCode(lang: Lang, code: string, o: FormatOptions): Promise<FormatResult> {
  if (!code.trim()) return { ok: true, text: '', issues: [] };
  try {
    if (lang === 'python') {
      const r = formatPython(code, { useTabs: o.useTabs, tabWidth: o.tabWidth });
      return { ok: true, text: r.text, issues: r.issues };
    }
    if (lang === 'sql') {
      const issues = sqlIssues(code);
      const { format } = await import('sql-formatter');
      return { ok: true, text: format(code, { language: o.dialect, tabWidth: o.tabWidth, useTabs: o.useTabs, keywordCase: o.keywordCase, expressionWidth: o.printWidth, linesBetweenQueries: 1 }) + '\n', issues };
    }
    const prettier = await import('prettier/standalone');
    const plugins =
      lang === 'js' ? [await import('prettier/plugins/babel'), await import('prettier/plugins/estree')]
      : lang === 'ts' ? [await import('prettier/plugins/typescript'), await import('prettier/plugins/estree')]
      : lang === 'css' ? [await import('prettier/plugins/postcss')]
      : [await import('prettier/plugins/html'), await import('prettier/plugins/babel'), await import('prettier/plugins/estree'), await import('prettier/plugins/postcss')];
    const text = await prettier.format(code, {
      parser: lang === 'js' ? 'babel' : lang === 'ts' ? 'typescript' : lang,
      plugins, tabWidth: o.tabWidth, useTabs: o.useTabs, printWidth: o.printWidth, semi: o.semi, singleQuote: o.singleQuote, trailingComma: o.trailingComma,
    });
    return { ok: true, text, issues: [] };
  } catch (e) {
    const { issue, frame } = describe(e);
    return { ok: false, issues: [issue], frame };
  }
}
