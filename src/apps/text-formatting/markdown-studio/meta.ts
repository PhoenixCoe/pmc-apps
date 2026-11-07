import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 6,
  category: "text-formatting",
  slug: "markdown-studio",
  title: "Markdown Studio",
  description: "Write Markdown with a live HTML preview and LaTeX maths, then export to PDF or MD.",
  tagline: "Write Markdown, see it live",
  keywords: ["markdown editor","markdown preview online","markdown to html","markdown to pdf","online markdown viewer","write markdown online"],
  seoTitle: "Markdown Editor: live preview, copy HTML, save PDF",
  seoDescription: "Free online Markdown editor with live preview. Write Markdown, copy the HTML, download a .md file or save the page as a PDF. Nothing is uploaded.",
  features: ["Live preview as you type","Formatting buttons for beginners","Copy the finished HTML","Download as a .md file","Save as PDF"],
  mode: "local",
  faq: [
    { q: "How do I preview Markdown online?", a: "Type or paste Markdown on the left and the formatted page appears beside it as you write." },
    { q: "How do I turn Markdown into HTML?", a: "Write your Markdown, then use Copy HTML to copy the finished HTML code." },
    { q: "Can I save my Markdown as a PDF?", a: "Yes. Choose Save as PDF and use your browser's print window to save it. You can also download the plain .md file." },
  ],
  built: true,
};
