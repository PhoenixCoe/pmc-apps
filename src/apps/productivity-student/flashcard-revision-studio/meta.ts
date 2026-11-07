import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 34,
  category: "productivity-student",
  slug: "flashcard-revision-studio",
  title: "Flashcard Revision Studio",
  description: "Build flashcard decks and revise with flip-to-recall mode.",
  tagline: "Flashcards to revise",
  keywords: ["flashcard revision studio","flashcard","revision","studio"],
  mode: "local",
  faq: [
    { q: "Do I need an account to use the flashcard revision studio?", a: "No. It works the moment the page loads. An account is optional and only adds saving and syncing across devices." },
    { q: "Does my data leave my device?", a: "No. Flashcard Revision Studio runs entirely in your browser, so what you enter is never uploaded." },
    { q: "Is the flashcard revision studio free?", a: "Yes. It is free to use, with no sign-up, trial or usage wall." },
  ],
  built: true,
};
