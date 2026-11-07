// Search-facing copy for each app that is built: the page title, the meta description, keywords, the plain-English
// "what it does" list (also emitted as JSON-LD featureList) and three questions people really type into Google.
// scaffold.mjs reads this. Apps that are not built yet get a plain fallback and are kept out of search (noindex).
// Rules: title <= 60 chars, description 120-155 chars, answers are true to what the tool does today.

export const SEO = {
  'case-converter': {
    title: 'Case Converter: UPPER, lower, Title Case, camelCase',
    description: 'Free online case converter. Change text to uppercase, lowercase, AP or Chicago title case, camelCase, snake_case or kebab-case. Nothing is uploaded.',
    keywords: ['case converter', 'title case converter', 'uppercase to lowercase', 'camelCase converter', 'snake_case converter', 'kebab-case', 'AP title case', 'Chicago title case'],
    features: ['Upper and lower case', 'Title case in AP or Chicago style', 'camelCase, snake_case and kebab-case', 'Split on your own pattern', 'One result per line', 'Download everything as a .txt file'],
    faq: [
      ['How do I change text to title case?', 'Paste your text, then pick Title case and choose AP or Chicago style. Small words such as "a", "of" and "the" stay lower case unless they start or end the title.'],
      ['How do I turn a sentence into camelCase or snake_case?', 'Pick camelCase, snake_case or kebab-case. Spaces, dashes and underscores are used as the break points, and you can set your own split pattern for anything else.'],
      ['Can I convert a whole list at once?', 'Yes. Each line is converted on its own, so you can paste a list of headings or variable names and download all the results as one text file.'],
    ],
  },
  'code-formatter': {
    title: 'Code Formatter: JavaScript, HTML, CSS, Python, SQL',
    description: 'Free online code formatter. Tidy JavaScript, TypeScript, HTML, CSS, Python and SQL with your own indent rules, and see syntax problems flagged.',
    keywords: ['code formatter', 'online code beautifier', 'format javascript online', 'format sql online', 'format css online', 'python formatter', 'html beautifier'],
    features: ['JavaScript, TypeScript, HTML, CSS, Python and SQL', 'Tabs or spaces, your choice of width', 'Line width and trailing comma options', 'SQL dialects: standard, PostgreSQL, SQL Server, SQLite', 'Syntax problems listed with the line they are on'],
    faq: [
      ['How do I format messy code online?', 'Choose the language, paste your code and it is tidied straight away. Change the indent, line width or trailing commas and the result updates.'],
      ['Which languages can it format?', 'JavaScript, TypeScript, HTML, CSS, Python and SQL. For SQL you can also choose the dialect, such as PostgreSQL, SQL Server or SQLite.'],
      ['Will it tell me if my code has a mistake?', 'It flags syntax problems it can find, with the line number, so you can fix them. It formats code; it does not run it.'],
    ],
  },
  'code-minifier-diff': {
    title: 'Code Minifier: shrink JS, CSS and HTML, see the diff',
    description: 'Free online minifier. Strip whitespace and comments from JavaScript, CSS, HTML or JSON, see exactly how many bytes you saved, and see what was removed.',
    keywords: ['code minifier', 'minify javascript online', 'minify css online', 'minify html', 'compress code', 'reduce file size code', 'minified vs original'],
    features: ['Removes whitespace and comments', 'Shows bytes saved as you type', 'See what was removed', 'JavaScript, CSS, HTML and JSON'],
    faq: [
      ['How do I minify JavaScript or CSS online?', 'Paste your code and pick JavaScript, CSS, HTML or JSON. The minified version appears with the number of bytes saved.'],
      ['Is minified code safe to use?', 'Minifying only removes spaces and comments, so the code behaves the same. Keep your original file: minified code is hard to read and edit.'],
      ['Can I see what was removed?', 'Yes. Switch the compare view to "What was removed" to see exactly what was taken out.'],
    ],
  },
  'slug-generator': {
    title: 'Slug Generator: make a clean URL from any title',
    description: 'Free slug generator. Turn a title into a short, URL-safe slug. Removes accents and stop words, and checks the length for search engines.',
    keywords: ['slug generator', 'url slug generator', 'seo friendly url', 'permalink generator', 'remove accents from text', 'slugify online'],
    features: ['Turns any title into a URL-safe slug', 'Accents become plain letters (é to e)', 'Optional stop-word removal', 'Dash or underscore separator', 'Length check for search results'],
    faq: [
      ['What is a URL slug?', 'The last part of a web address that names the page, such as "ultimate-guide" in example.com/ultimate-guide. A short, readable slug helps people and search engines.'],
      ['How long should a slug be?', 'Short is better: a few words, ideally under about 60 characters. The tool shows a length check so you can trim it.'],
      ['What happens to accents and symbols?', 'Accented letters are changed to plain ones (café becomes cafe), symbols are dropped and spaces become dashes.'],
    ],
  },
  'word-readability-analyzer': {
    title: 'Word Counter & Readability Checker: free, instant',
    description: 'Free word counter and readability checker. Count words, characters, sentences and paragraphs, get Flesch reading ease and grade level, and see keyword density.',
    keywords: ['word counter', 'character counter', 'readability checker', 'flesch reading ease', 'flesch-kincaid grade level', 'keyword density checker', 'sentence counter'],
    features: ['Words, characters, sentences and paragraphs', 'Flesch reading ease score', 'Flesch-Kincaid grade level', 'Keyword density list', 'Updates as you type'],
    faq: [
      ['How do I count the words in my text?', 'Type or paste it in. The word, character, sentence and paragraph counts update as you type.'],
      ['What is a good readability score?', 'On the Flesch scale, 60 to 70 is plain English that most adults read easily. Higher is easier. The grade level tells you roughly the school year needed to follow it.'],
      ['What is keyword density?', 'How often a word appears compared with the total words. The list shows your most used words so you can spot overuse.'],
    ],
  },
  'markdown-studio': {
    title: 'Markdown Editor: live preview, copy HTML, save PDF',
    description: 'Free online Markdown editor with live preview. Write Markdown, copy the HTML, download a .md file or save the page as a PDF. Nothing is uploaded.',
    keywords: ['markdown editor', 'markdown preview online', 'markdown to html', 'markdown to pdf', 'online markdown viewer', 'write markdown online'],
    features: ['Live preview as you type', 'Formatting buttons for beginners', 'Copy the finished HTML', 'Download as a .md file', 'Save as PDF'],
    faq: [
      ['How do I preview Markdown online?', 'Type or paste Markdown on the left and the formatted page appears beside it as you write.'],
      ['How do I turn Markdown into HTML?', 'Write your Markdown, then use Copy HTML to copy the finished HTML code.'],
      ['Can I save my Markdown as a PDF?', 'Yes. Choose Save as PDF and use your browser\'s print window to save it. You can also download the plain .md file.'],
    ],
  },
  'text-diff-inspector': {
    title: 'Text Diff Checker: compare two texts side by side',
    description: 'Free online text compare tool. Paste two versions to see every change, by line or by character, side by side. Download the result as a .patch file.',
    keywords: ['text diff', 'compare two texts', 'diff checker online', 'text compare tool', 'find differences between two texts', 'patch file generator'],
    features: ['Side by side comparison', 'Compare by line or by character', 'Swap the two sides', 'Download a .patch file'],
    faq: [
      ['How do I compare two pieces of text?', 'Paste the original on the left and the new version on the right. Every change is highlighted straight away.'],
      ['What is the difference between line and character mode?', 'Line mode marks whole lines that changed. Character mode marks the exact letters, which is better for small edits inside a line.'],
      ['What is a .patch file?', 'A small file that lists the changes between two versions. Developers apply it with tools such as git. You can download one from the result.'],
    ],
  },
  'regex-sandbox': {
    title: 'Regex Tester: test patterns with plain-English help',
    description: 'Free online regex tester. Try a regular expression on your own text, see every match highlighted, and read what the pattern does in plain English.',
    keywords: ['regex tester', 'regular expression tester', 'regex online', 'regex quick reference', 'test regex', 'regex explainer', 'javascript regex'],
    features: ['Live match highlighting', 'Capture groups listed', 'Plain-English explanation of your pattern', 'Built-in quick reference', 'Stops runaway patterns'],
    faq: [
      ['How do I test a regular expression?', 'Type your pattern, paste the text you want to search, and every match is highlighted as you type.'],
      ['What does my regex mean?', 'The "What this pattern does" panel explains your pattern in plain English, piece by piece. The quick reference covers common symbols.'],
      ['Why does it say the pattern is taking too long?', 'Some patterns can take a very long time on certain text. The tool stops them so your browser does not freeze. Try making the pattern more specific.'],
    ],
  },
  'lorem-generator': {
    title: 'Lorem Ipsum Generator: placeholder text in 4 styles',
    description: 'Free lorem ipsum generator. Make placeholder paragraphs, sentences or words in classic Latin, tech startup, legal or medical style, then copy them.',
    keywords: ['lorem ipsum generator', 'placeholder text', 'dummy text generator', 'filler text', 'lorem ipsum paragraphs', 'sample text generator'],
    features: ['Paragraphs, sentences or words', 'Classic Latin, tech startup, legal and medical styles', 'Write new text with one click', 'Copy in one click'],
    faq: [
      ['What is lorem ipsum?', 'Dummy text used to fill a design so you can judge the layout before the real words are ready. It is based on scrambled Latin.'],
      ['How do I generate lorem ipsum?', 'Choose paragraphs, sentences or words, set how many, and pick a style. Use Write new text to get a fresh version.'],
      ['Can I get placeholder text that is not Latin?', 'Yes. The tech startup, legal and medical styles use English-sounding text for mock-ups where Latin looks out of place.'],
    ],
  },
  'list-cleaner-deduplicator': {
    title: 'Remove Duplicate Lines: list cleaner and sorter',
    description: 'Free online duplicate line remover. Paste a list to delete repeats, trim spaces, sort it, and see how many times each item appeared.',
    keywords: ['remove duplicate lines', 'deduplicate list online', 'list cleaner', 'sort list alphabetically', 'remove blank lines', 'duplicate remover'],
    features: ['Removes repeated lines instantly', 'Trims stray spaces', 'Sort A to Z or Z to A', 'Choose which copy to keep', 'Shows how often each item repeated', 'Download the clean list'],
    faq: [
      ['How do I remove duplicate lines from a list?', 'Paste the list and repeats are removed as soon as you do. The cleaned list is on the right, ready to copy or download.'],
      ['Does it treat "Apple" and "apple" as the same?', 'You choose. Switch case sensitivity on to treat them as different, or off to treat them as the same item.'],
      ['Can I see which items were repeated?', 'Yes. The Repeated items list shows each duplicate and how many times it appeared.'],
    ],
  },
  'json-formatter-repair': {
    title: 'JSON Formatter & Validator: fix broken JSON online',
    description: 'Free JSON formatter and validator. Pretty-print JSON, find errors, and repair common problems like trailing commas, with a tree you can fold.',
    keywords: ['json formatter', 'json validator', 'fix broken json', 'json beautifier', 'json repair online', 'json pretty print', 'trailing comma json'],
    features: ['Checks JSON is valid', 'Pretty-prints with your layout', 'Repairs trailing commas and similar slips', 'Expand and collapse the tree', 'Download the result'],
    faq: [
      ['How do I check if my JSON is valid?', 'Paste it in. You will see "Valid JSON" or the first problem and where it is.'],
      ['How do I fix a trailing comma in JSON?', 'Paste it in and the repair step removes trailing commas and fixes other common slips, then shows you the repaired version.'],
      ['Can I make big JSON easier to read?', 'Yes. Pretty-print it, then use Expand all and Collapse all on the tree to move around.'],
    ],
  },
  'table-converter': {
    title: 'Table Converter: CSV to Markdown, HTML and LaTeX',
    description: 'Free table converter. Paste CSV, TSV or a Markdown table and get a Markdown, HTML or LaTeX table back, with column alignment you control.',
    keywords: ['csv to markdown table', 'csv to html table', 'csv to latex table', 'tsv to markdown', 'markdown table generator', 'table converter online'],
    features: ['CSV, TSV, Markdown or spaced columns in', 'Markdown, HTML and LaTeX out', 'Left, centre or right alignment', 'Copy each result in one click'],
    faq: [
      ['How do I convert CSV to a Markdown table?', 'Paste the CSV and the Markdown table appears at once. Copy it into your README or notes.'],
      ['Can I get an HTML or LaTeX table too?', 'Yes. The same data is shown as a Markdown, HTML and LaTeX table. Copy the one you need.'],
      ['What if my data is separated by tabs or semicolons?', 'Pick the separator, or paste tab-separated data from a spreadsheet. Both work.'],
    ],
  },
  'image-resizer': {
    title: 'Image Resizer: resize many images at once, free',
    description: 'Free bulk image resizer. Resize, crop and compress photos in your browser, keep the shape, rename the files and download them all as one ZIP.',
    keywords: ['image resizer', 'bulk image resizer', 'resize photos online', 'compress images online', 'resize images for web', 'change image size', 'batch resize'],
    features: ['Resize many images at once', 'Keeps the shape (aspect ratio)', 'Save as JPEG, PNG or WebP', 'Choose the quality', 'Rename files', 'Download all as one ZIP'],
    faq: [
      ['How do I resize several photos at once?', 'Drop them all in, choose the size, then download them as a ZIP. Every photo gets the same settings.'],
      ['Are my photos uploaded anywhere?', 'No. The resizing happens inside your browser, so your photos never leave your device.'],
      ['How do I make an image file smaller?', 'Lower the quality or the size, or save as WEBP or JPEG. You will see the new file size before you download.'],
    ],
  },
  'block-coder': {
    title: 'Block Coder: make games, toys and web pages with blocks',
    description: 'Free block coder you can play with, a bit like Scratch with wires. Join 155 blocks to make games, drawing boards, quizzes and real web pages. 50 projects to start from. No typing needed.',
    keywords: ['block coding online', 'visual programming online', 'make a game with blocks', 'no code web page builder', 'learn to code for kids and beginners', 'html css javascript builder', 'flow based programming', 'block based coding'],
    features: ['155 blocks in 13 groups: page items, things to touch, fun, style, variables, maths, text, lists, dates, colour and tools', '50 ready-made projects: games, toys, tools, pages and maths', 'Variables that remember numbers, text, yes or no and lists', 'Global style and palette blocks that restyle a whole page at once', 'Always fullscreen, with fold, rename, multi-select, tidy, a mini map and keyboard shortcuts', 'Games to play: number roller, magic 8-ball, catch the mole, catch the stars and a piano', 'A drawing board, bouncing balls and a player you move with the arrow keys', 'Sound, confetti, speech and animation with When pressed blocks', 'Live page preview beside the canvas', 'See and save the HTML, CSS and JavaScript it writes', 'Page title, description and icon written into the saved page', 'Share a project with a link', 'Undo, redo and search for any block'],
    faq: [
      ['What can I make with Block Coder?', 'Games like a number roller, catch the mole and catch the stars, toys like a piano, a drawing board and a clock, tools like a to-do list and a unit converter, and real web pages. There are 50 projects ready to open, and every one can be changed. A Variable block remembers a score or a list, and text joined to it updates by itself, as in the Clicker shop project.'],
      ['Do I need to know how to code?', 'No. You add blocks and join them with wires instead of typing code. Open a project, change a word or a colour and the preview updates straight away. The HTML, CSS and JS tabs show what your blocks write, so you can learn as you go.'],
      ['Can I keep and share what I make?', 'Yes. Save the page as one .html file that opens in any browser, with its title, description and icon already filled in. The Share button copies a link, and anyone who opens it gets their own copy to change. Your last project is also remembered on this device.'],
    ],
  },
};
