export type Kind = 'header' | 'badges' | 'stats' | 'about' | 'features' | 'install' | 'usage' | 'screens' | 'roadmap' | 'contrib' | 'license' | 'links' | 'text' | 'toc';
export interface Block { id: number; kind: Kind; v: Record<string, string> }
export interface Field { key: string; label: string; area?: boolean; ph?: string }
export const KINDS: Record<Kind, { name: string; fields: Field[]; init: Record<string, string> }> = {
  header: { name: 'Title', fields: [{ key: 'title', label: 'Project name' }, { key: 'tag', label: 'One-line summary' }, { key: 'banner', label: 'Banner picture address (optional)' }], init: { title: 'My Project', tag: 'A short line about what it does.', banner: '' } },
  badges: { name: 'Tech badges', fields: [{ key: 'list', label: 'Chosen technologies' }, { key: 'style', label: 'Style' }], init: { list: 'TypeScript,React', style: 'for-the-badge' } },
  stats: { name: 'GitHub stats', fields: [{ key: 'user', label: 'GitHub username' }, { key: 'show', label: 'Cards' }], init: { user: '', show: 'stats,langs' } },
  about: { name: 'About', fields: [{ key: 'text', label: 'About the project', area: true }], init: { text: 'Say what this project is, who it is for and why you made it.' } },
  features: { name: 'Features', fields: [{ key: 'list', label: 'One feature per line', area: true }], init: { list: 'Fast and small\nWorks offline\nFree to use' } },
  install: { name: 'Installation', fields: [{ key: 'steps', label: 'Commands, one per line', area: true }], init: { steps: 'git clone https://github.com/you/project.git\ncd project\nnpm install' } },
  usage: { name: 'Usage', fields: [{ key: 'text', label: 'How to use it', area: true }, { key: 'code', label: 'Example code', area: true }, { key: 'lang', label: 'Code language' }], init: { text: 'Run it like this:', code: 'npm start', lang: 'bash' } },
  screens: { name: 'Screenshots', fields: [{ key: 'list', label: 'Picture addresses, one per line', area: true }], init: { list: 'https://example.com/screenshot.png' } },
  roadmap: { name: 'To-do list', fields: [{ key: 'list', label: 'One item per line. Start with x for done.', area: true }], init: { list: 'x Make it work\nMake it fast\nWrite the docs' } },
  contrib: { name: 'Contributing', fields: [{ key: 'text', label: 'Text', area: true }], init: { text: 'Pull requests are welcome. For big changes, open an issue first.' } },
  license: { name: 'Licence', fields: [{ key: 'name', label: 'Licence name' }, { key: 'holder', label: 'Your name' }], init: { name: 'MIT', holder: '' } },
  links: { name: 'Contact and links', fields: [{ key: 'list', label: 'One per line: Name | address', area: true }], init: { list: 'Website | https://example.com\nEmail | mailto:you@example.com' } },
  text: { name: 'Free text', fields: [{ key: 'heading', label: 'Heading (optional)' }, { key: 'text', label: 'Text', area: true }], init: { heading: '', text: '' } },
  toc: { name: 'Contents list', fields: [], init: {} },
};
/** name, shields.io colour, logo slug */
export const TECH: [string, string, string][] = [['JavaScript', 'F7DF1E', 'javascript'], ['TypeScript', '3178C6', 'typescript'], ['React', '20232A', 'react'], ['Next.js', '000000', 'nextdotjs'], ['Vue', '4FC08D', 'vuedotjs'], ['Svelte', 'FF3E00', 'svelte'], ['Angular', 'DD0031', 'angular'], ['Node.js', '339933', 'nodedotjs'], ['Python', '3776AB', 'python'], ['Java', 'ED8B00', 'openjdk'], ['C#', '239120', 'csharp'], ['C++', '00599C', 'cplusplus'], ['Go', '00ADD8', 'go'], ['Rust', '000000', 'rust'], ['PHP', '777BB4', 'php'], ['Ruby', 'CC342D', 'ruby'], ['Swift', 'F05138', 'swift'], ['Kotlin', '7F52FF', 'kotlin'], ['HTML5', 'E34F26', 'html5'], ['CSS3', '1572B6', 'css3'], ['Tailwind CSS', '06B6D4', 'tailwindcss'], ['Sass', 'CC6699', 'sass'], ['Vite', '646CFF', 'vite'], ['Webpack', '8DD6F9', 'webpack'], ['Express', '000000', 'express'], ['Django', '092E20', 'django'], ['Flask', '000000', 'flask'], ['PostgreSQL', '4169E1', 'postgresql'], ['MySQL', '4479A1', 'mysql'], ['MongoDB', '47A248', 'mongodb'], ['SQLite', '003B57', 'sqlite'], ['Redis', 'DC382D', 'redis'], ['Docker', '2496ED', 'docker'], ['Git', 'F05032', 'git'], ['GitHub', '181717', 'github'], ['Linux', 'FCC624', 'linux'], ['Firebase', 'FFCA28', 'firebase'], ['Supabase', '3FCF8E', 'supabase'], ['Three.js', '000000', 'threedotjs'], ['Godot', '478CBF', 'godotengine'], ['Unity', '000000', 'unity'], ['Figma', 'F24E1E', 'figma']];
const enc = encodeURIComponent;
const badge = (n: string, style: string) => { const t = TECH.find((x) => x[0] === n); if (!t) return ''; const light = ['F7DF1E', 'FCC624', 'FFCA28', '8DD6F9'].includes(t[1]); return `![${n}](https://img.shields.io/badge/${enc(n.replace(/-/g, '--'))}-${t[1]}?style=${style}&logo=${t[2]}&logoColor=${light ? '000000' : 'white'})`; };
const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);

export function toMarkdown(blocks: Block[]): string {
  const heads: string[] = [], out: string[] = [];
  const h = (t: string) => { heads.push(t); return `## ${t}`; };
  for (const b of blocks) {
    const v = b.v;
    if (b.kind === 'header') out.push([v.banner && `<p align="center"><img src="${v.banner}" alt="${v.title}"></p>`, `<h1 align="center">${v.title || 'Project'}</h1>`, v.tag && `<p align="center">${v.tag}</p>`].filter(Boolean).join('\n\n'));
    else if (b.kind === 'badges') { const l = (v.list || '').split(',').filter(Boolean).map((n) => badge(n, v.style || 'for-the-badge')).filter(Boolean); if (l.length) out.push(`<p align="center">\n${l.join('\n')}\n</p>`); }
    else if (b.kind === 'stats' && v.user) { const u = enc(v.user), s = (v.show || '').split(','); const c: string[] = []; if (s.includes('stats')) c.push(`<img height="170" alt="GitHub stats" src="https://github-readme-stats.vercel.app/api?username=${u}&show_icons=true&hide_border=true" />`); if (s.includes('langs')) c.push(`<img height="170" alt="Top languages" src="https://github-readme-stats.vercel.app/api/top-langs/?username=${u}&layout=compact&hide_border=true" />`); if (s.includes('streak')) c.push(`<img height="170" alt="Streak" src="https://streak-stats.demolab.com/?user=${u}&hide_border=true" />`); if (c.length) out.push(`<p align="center">\n${c.join('\n')}\n</p>`); }
    else if (b.kind === 'about') out.push(`${h('About')}\n\n${v.text}`);
    else if (b.kind === 'features') out.push(`${h('Features')}\n\n${lines(v.list || '').map((l) => `- ${l}`).join('\n')}`);
    else if (b.kind === 'install') out.push(`${h('Installation')}\n\n\`\`\`bash\n${lines(v.steps || '').join('\n')}\n\`\`\``);
    else if (b.kind === 'usage') out.push(`${h('Usage')}\n\n${[v.text, v.code && `\`\`\`${v.lang || ''}\n${v.code}\n\`\`\``].filter(Boolean).join('\n\n')}`);
    else if (b.kind === 'screens') out.push(`${h('Screenshots')}\n\n${lines(v.list || '').map((l, i) => `![Screenshot ${i + 1}](${l})`).join('\n\n')}`);
    else if (b.kind === 'roadmap') out.push(`${h('To do')}\n\n${lines(v.list || '').map((l) => (/^x\s/i.test(l) ? `- [x] ${l.slice(2)}` : `- [ ] ${l}`)).join('\n')}`);
    else if (b.kind === 'contrib') out.push(`${h('Contributing')}\n\n${v.text}`);
    else if (b.kind === 'license') out.push(`${h('Licence')}\n\n${v.name || 'MIT'} licence${v.holder ? `, copyright ${new Date().getFullYear()} ${v.holder}` : ''}.`);
    else if (b.kind === 'links') out.push(`${h('Contact')}\n\n${lines(v.list || '').map((l) => { const [n, u] = l.split('|').map((x) => x.trim()); return u ? `- [${n}](${u})` : `- ${n}`; }).join('\n')}`);
    else if (b.kind === 'text') out.push(`${v.heading ? h(v.heading) + '\n\n' : ''}${v.text}`);
    else if (b.kind === 'toc') out.push('<!--TOC-->');
  }
  const toc = `## Contents\n\n${heads.map((t) => `- [${t}](#${t.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')})`).join('\n')}`;
  return out.join('\n\n').replace('<!--TOC-->', heads.length ? toc : '') .replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
