/**
 * Ready-made projects for the Block Coder. Each one is written as a list of blocks (with the column each sits in) and a list of wires,
 * and laid out for you: columns left to right, blocks stacked down each column in the order listed. Page items that sit in the same
 * column appear on the page in the order they are listed.
 */
import { defaults, DEF, heightOf, type GNode, type Graph, type Params } from './graph';

type Spec = [col: number, kind: string, v?: Params];
type Link = [from: number, to: number, input: string];

const build = (specs: Spec[], wires: Link[]): Graph => {
  const used: number[] = [];
  const styles = specs.filter(([, kind]) => kind === 'style' || kind === 'gstyle').length;
  const nodes: GNode[] = specs.map(([col, kind, v], i) => {
    const d = DEF[kind]; if (!d) throw new Error(`Unknown block “${kind}”`);
    // Style blocks are tall. With three or more, they start folded so the whole project fits in view; unfold one to see what it sets.
    const fold: Params = styles >= 3 && (kind === 'style' || kind === 'gstyle') ? { _c: true } : {};
    const node: GNode = { id: 'n' + (i + 1), kind, x: 40 + col * 300, y: 40 + (used[col] ?? 0), v: { ...defaults(d), ...v, ...fold } };
    used[col] = (used[col] ?? 0) + heightOf(d, node) + 28;
    return node;
  });
  return {
    nodes, seq: nodes.length,
    wires: wires.map(([f, t, key], i) => {
      const to = nodes[t - 1]; const port = to ? DEF[to.kind].inputs.findIndex((p) => p.key === key) : -1;
      if (!nodes[f - 1] || port < 0) throw new Error(`Bad wire ${f} to ${t} (${key})`);
      return { id: 'w' + (i + 1), from: 'n' + f, to: 'n' + t, port };
    }),
  };
};

export type ExampleGroup = 'start' | 'games' | 'toys' | 'pages' | 'maths';
export const EXAMPLE_GROUPS: { id: ExampleGroup; name: string }[] = [
  { id: 'start', name: 'Start here' }, { id: 'games', name: 'Games' }, { id: 'toys', name: 'Toys and tools' },
  { id: 'pages', name: 'Make a page' }, { id: 'maths', name: 'Maths, text and lists' },
];
export interface Example { id: string; name: string; blurb: string; group: ExampleGroup; graph: Graph }

const INK = '#171717', GOLD = '#b49a57', GREEN = '#337957', CREAM = '#f2e4ce';
const BTN: Params = { bg: GOLD, color: INK, bold: 'yes', space: 'medium', border: 'thick', round: 'a little', shadow: 'hard' };
const BIGBTN: Params = { ...BTN, size: 'giant', round: 'pill', space: 'large' };
const TITLE: Params = { font: 'headline', size: 'huge', align: 'centre' };
const MIDDLE: Params = { align: 'centre' };
const SCORE: Params = { size: 'giant', align: 'centre', bold: 'yes' };

/** Wires from one block to several others, all into the same input. */
const fan = (from: number, tos: number[], input: string): Link[] => tos.map((t) => [from, t, input]);

const piano = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
/** The next 25 December, as a date the blocks understand, so the countdowns never point at a day that has gone. */
const nextXmas = () => { const now = new Date(), y = now.getFullYear(); return `${new Date(y, 11, 25) < now ? y + 1 : y}-12-25`; };

export const EXAMPLES: Example[] = [
  // ------------------------------------------------------------ start here
  { id: 'counter', name: 'Click counter', blurb: 'A button that counts your clicks', group: 'start', graph: build([
      [0, 'style', SCORE], [0, 'style', BTN],
      [1, 'heading', { text: 'How many clicks?', level: 'medium' }], [1, 'para', { text: '0' }], [1, 'button', { text: 'Click me' }],
      [2, 'action', { do: 'add to the number', value: 1 }], [2, 'action', { do: 'shake it' }]],
    [[1, 4, 'look'], [2, 5, 'look'], [5, 6, 'on'], [4, 6, 'target'], [5, 7, 'on'], [5, 7, 'target']]) },
  { id: 'hello', name: 'Say hello', blurb: 'Type a name, press the button', group: 'start', graph: build([
      [1, 'heading', { text: 'What is your name?', level: 'medium' }], [1, 'field', { text: 'Your name' }], [1, 'button', { text: 'Say hello' }], [1, 'heading', { text: '', level: 'big' }],
      [2, 'glue', { a: 'Hello, ', c: '!' }], [3, 'action', { do: 'set the text to' }], [3, 'action', { do: 'throw confetti' }]],
    [[2, 5, 'b'], [3, 6, 'on'], [4, 6, 'target'], [5, 6, 'value'], [3, 7, 'on']]) },
  { id: 'mood', name: 'Pick a colour', blurb: 'Buttons that change the page colour', group: 'start', graph: build([
      [0, 'style', BTN],
      [1, 'heading', { text: 'Pick a colour' }], [1, 'box', { flow: 'across' }],
      [2, 'button', { text: 'Pink' }], [2, 'button', { text: 'Blue' }], [2, 'button', { text: 'Green' }], [2, 'button', { text: 'Surprise me' }],
      [3, 'action', { do: 'set its background to', value: 'pink' }], [3, 'action', { do: 'set its background to', value: 'lightblue' }],
      [3, 'action', { do: 'set its background to', value: 'lightgreen' }], [3, 'action', { do: 'make it a random colour' }]],
    [...fan(3, [4, 5, 6, 7], 'inside'), ...fan(1, [4, 5, 6, 7], 'look'), [4, 8, 'on'], [5, 9, 'on'], [6, 10, 'on'], [7, 11, 'on']]) },

  // ------------------------------------------------------------ games
  { id: 'dice', name: 'Number roller', blurb: 'Press Roll. It spins and lands on a number', group: 'games', graph: build([
      [0, 'style', TITLE], [0, 'style', BIGBTN],
      [1, 'heading', { text: 'Roll a number' }], [1, 'emoji', { text: '?', size: 'huge' }], [1, 'button', { text: 'Roll' }],
      [2, 'list', { items: '1, 2, 3, 4, 5, 6' }], [3, 'pick'],
      [4, 'action', { do: 'set the text to' }], [4, 'action', { do: 'spin it' }]],
    [[1, 3, 'look'], [1, 4, 'look'], [2, 5, 'look'], [6, 7, 'list'], [5, 8, 'on'], [4, 8, 'target'], [7, 8, 'value'], [5, 9, 'on'], [4, 9, 'target']]) },
  { id: 'eight', name: 'Magic 8-ball', blurb: 'Ask a question, shake the ball', group: 'games', graph: build([
      [0, 'pagecfg', { title: 'Magic 8-ball', bg: INK, color: CREAM, font: 'round', icon: '🎱', description: 'Ask a yes or no question and shake the ball.' }],
      [0, 'style', { align: 'centre', color: GOLD }], [0, 'style', BTN],
      [1, 'heading', { text: 'Ask the Magic 8-ball', level: 'medium' }], [1, 'field', { text: 'Type a yes or no question' }], [1, 'button', { text: 'Shake' }],
      [1, 'emoji', { text: '🎱', size: 'huge' }], [1, 'para', { text: 'Ask something first.' }],
      [2, 'list', { items: 'Yes, Definitely, No way, Ask again later, Probably, Not a chance, It is certain, Very doubtful' }], [3, 'pick'],
      [4, 'action', { do: 'set the text to' }], [4, 'action', { do: 'shake it' }]],
    [[2, 4, 'look'], [2, 7, 'look'], [2, 8, 'look'], [3, 6, 'look'], [9, 10, 'list'], [6, 11, 'on'], [8, 11, 'target'], [10, 11, 'value'], [6, 12, 'on'], [7, 12, 'target']]) },
  { id: 'guess', name: 'Guess the number', blurb: 'I pick a number from 1 to 100. Find it', group: 'games', graph: build([
      [0, 'style', BTN],
      [1, 'heading', { text: 'Guess my number' }], [1, 'para', { text: 'I am thinking of a number from 1 to 100.' }], [1, 'numbox', { label: 'Your guess', start: 50 }],
      [1, 'button', { text: 'Guess' }], [1, 'para', { text: 'Make a guess!' }],
      [2, 'random', { from: 1, to: 100, when: 'once, at the start' }], [2, 'compare', { op: '==' }], [2, 'compare', { op: '>' }],
      [3, 'if', { yes: 'Too high! Try lower.', no: 'Too low! Try higher.' }], [3, 'if', { yes: 'You got it! 🎉' }],
      [4, 'action', { do: 'set the text to' }]],
    [[1, 5, 'look'], [4, 8, 'a'], [7, 8, 'b'], [4, 9, 'a'], [7, 9, 'b'], [9, 10, 'cond'], [8, 11, 'cond'], [10, 11, 'no'], [5, 12, 'on'], [6, 12, 'target'], [11, 12, 'value']]) },
  { id: 'whack', name: 'Catch the mole', blurb: 'Click the mole before it hops away', group: 'games', graph: build([
      [0, 'style', { bg: GREEN, color: CREAM, bold: 'yes', space: 'large', round: 'a little', align: 'centre' }], [0, 'style', { bg: CREAM, size: 'huge', round: 'pill', border: 'thick', space: 'medium' }],
      [1, 'heading', { text: 'Catch the mole!' }], [1, 'box', { flow: 'across' }], [1, 'button', { text: '🐹' }], [1, 'para', { text: 'Click the mole. It moves every second.' }],
      [2, 'para', { text: 'Score:' }], [2, 'para', { text: '0' }],
      [3, 'action', { do: 'add to the number', value: 1 }], [3, 'action', { do: 'jump to a random place' }], [3, 'action', { when: 'every second', do: 'jump to a random place' }],
      [3, 'action', { do: 'play a note', value: 'E' }]],
    [[1, 3, 'look'], [2, 5, 'look'], [4, 7, 'inside'], [4, 8, 'inside'], [5, 9, 'on'], [8, 9, 'target'], [5, 10, 'on'], [5, 10, 'target'], [5, 11, 'target'], [5, 12, 'on']]) },
  { id: 'catch', name: 'Catch the stars', blurb: 'Fly a rocket with the arrow keys', group: 'games', graph: build([
      [0, 'pagecfg', { title: 'Catch the stars', pattern: 'night sky', icon: '⭐', font: 'round', description: 'Fly a rocket with the arrow keys and catch the stars.' }],
      [1, 'heading', { text: 'Catch the stars!', level: 'medium' }], [1, 'para', { text: 'Click this page once, then use the arrow keys.' }], [1, 'box', { flow: 'across' }],
      [1, 'emoji', { text: '⭐', size: 'big' }], [1, 'player', { text: '🚀', size: 'big', speed: 'normal' }],
      [2, 'para', { text: 'Stars caught:' }], [2, 'para', { text: '0' }],
      [3, 'action', { when: 'is touched by the player', do: 'add to the number', value: 1 }], [3, 'action', { when: 'is touched by the player', do: 'jump to a random place' }],
      [3, 'action', { when: 'is touched by the player', do: 'play a note', value: 'A' }]],
    [[4, 7, 'inside'], [4, 8, 'inside'], [5, 9, 'on'], [8, 9, 'target'], [5, 10, 'on'], [5, 10, 'target'], [5, 11, 'on']]) },
  { id: 'clicker', name: 'Cookie clicker', blurb: 'Click the cookie. Then click it some more', group: 'games', graph: build([
      [0, 'pagecfg', { title: 'Cookie clicker', bg: CREAM, icon: '🍪', description: 'Click the cookie. Then click it some more.' }],
      [0, 'style', SCORE], [0, 'style', BIGBTN],
      [1, 'heading', { text: 'Cookie clicker', level: 'medium' }], [1, 'para', { text: '0' }], [1, 'button', { text: '🍪' }], [1, 'para', { text: 'Your oven bakes one every 5 seconds.' }],
      [2, 'action', { do: 'add to the number', value: 1 }], [2, 'action', { do: 'shake it' }], [2, 'action', { when: 'every 5 seconds', do: 'add to the number', value: 1 }]],
    [[2, 5, 'look'], [3, 6, 'look'], [6, 8, 'on'], [5, 8, 'target'], [6, 9, 'on'], [6, 9, 'target'], [5, 10, 'target']]) },
  { id: 'bounce', name: 'Bouncing balls', blurb: 'Two balls bounce round. Click them', group: 'games', graph: build([
      [0, 'pagecfg', { title: 'Bounce!', pattern: 'dots', bg: CREAM, icon: '⚽', description: 'Two balls bounce round the page. Click them.' }],
      [1, 'heading', { text: 'Click the balls!', level: 'medium' }], [1, 'bouncer', { text: '⚽', size: 'big', speed: 'normal' }], [1, 'bouncer', { text: '🏀', size: 'big', speed: 'fast' }],
      [2, 'action', { do: 'throw confetti' }], [2, 'action', { do: 'make it a random colour' }], [2, 'action', { do: 'spin it' }]],
    [[3, 5, 'on'], [4, 6, 'on'], [3, 7, 'on'], [3, 7, 'target']]) },
  { id: 'draw', name: 'Drawing board', blurb: 'Draw a rainbow with the mouse or a finger', group: 'games', graph: build([
      [0, 'pagecfg', { title: 'Draw something', pattern: 'dots', bg: CREAM, icon: '🎨', description: 'Draw with the mouse or a finger.' }], [0, 'style', BTN],
      [1, 'heading', { text: 'Draw something', level: 'medium' }], [1, 'canvas', { pen: GREEN, size: 'thick', ink: 'rainbow' }], [1, 'button', { text: 'Clear' }],
      [2, 'action', { do: 'clear it' }]],
    [[2, 5, 'look'], [5, 6, 'on'], [4, 6, 'target']]) },
  { id: 'piano', name: 'Piano', blurb: 'Seven keys. Play a tune', group: 'games', graph: build([
      [0, 'pagecfg', { title: 'Piano', bg: INK, color: CREAM, font: 'round', icon: '🎹', description: 'Play a tune with the buttons.' }],
      [0, 'style', { ...BTN, bg: CREAM, size: 'huge', space: 'large' }],
      [1, 'heading', { text: 'Play a tune', level: 'medium' }], [1, 'box', { flow: 'across' }],
      ...piano.map((k): Spec => [2, 'button', { text: k }]),
      ...piano.map((k): Spec => [3, 'action', { do: 'play a note', value: k }])],
    [...fan(2, [5, 6, 7, 8, 9, 10, 11], 'look'), ...fan(4, [5, 6, 7, 8, 9, 10, 11], 'inside'), ...piano.map((_, k): Link => [5 + k, 12 + k, 'on'])]) },
  { id: 'rps', name: 'Rock paper scissors', blurb: 'Play against the computer', group: 'games', graph: build([
      [0, 'style', BTN],
      [1, 'heading', { text: 'Rock paper scissors', level: 'medium' }], [1, 'box', { flow: 'across' }], [1, 'para', { text: 'Pick one!' }],
      [2, 'button', { text: '✊ Rock' }], [2, 'button', { text: '✋ Paper' }], [2, 'button', { text: '✌️ Scissors' }], [2, 'list', { items: 'Rock, Paper, Scissors' }],
      [3, 'pick'],
      ...['Rock', 'Paper', 'Scissors'].map((w): Spec => [4, 'expr', { a: w, expr: 'a === b ? "A draw. We both chose " + a + "." : (a === "Rock" && b === "Scissors") || (a === "Paper" && b === "Rock") || (a === "Scissors" && b === "Paper") ? "You win! 🎉 You chose " + a + ", I chose " + b + "." : "I win this round 😄 You chose " + a + ", I chose " + b + "."' }]),
      ...[0, 1, 2].map((): Spec => [5, 'action', { do: 'set the text to' }])],
    [...fan(1, [5, 6, 7], 'look'), ...fan(3, [5, 6, 7], 'inside'), [8, 9, 'list'], ...fan(9, [10, 11, 12], 'b'),
      [5, 13, 'on'], [6, 14, 'on'], [7, 15, 'on'], ...fan(4, [13, 14, 15], 'target'), [10, 13, 'value'], [11, 14, 'value'], [12, 15, 'value']]) },
  { id: 'quiz', name: 'Quick quiz', blurb: 'A question with three answers. Change it to your own', group: 'games', graph: build([
      [0, 'style', BTN],
      [1, 'heading', { text: 'Quick quiz', level: 'medium' }], [1, 'para', { text: 'What is the capital of France?' }], [1, 'box', { flow: 'across' }], [1, 'para', { text: 'Pick an answer.' }],
      [2, 'button', { text: 'Paris' }], [2, 'button', { text: 'Rome' }], [2, 'button', { text: 'Madrid' }],
      [3, 'action', { do: 'set the text to', value: 'Correct! 🎉' }], [3, 'action', { do: 'throw confetti' }],
      [3, 'action', { do: 'set the text to', value: 'Not quite. Try again.' }], [3, 'action', { do: 'set the text to', value: 'Not quite. Try again.' }]],
    [...fan(1, [6, 7, 8], 'look'), ...fan(4, [6, 7, 8], 'inside'), [6, 9, 'on'], [5, 9, 'target'], [6, 10, 'on'], [7, 11, 'on'], [5, 11, 'target'], [8, 12, 'on'], [5, 12, 'target']]) },

  // ------------------------------------------------------------ toys and tools
  { id: 'clock', name: 'Clock', blurb: 'A clock that ticks every second', group: 'toys', graph: build([
      [0, 'pagecfg', { title: 'Clock', pattern: 'night sky', icon: '🕒', font: 'code', description: 'A clock that ticks every second.' }], [0, 'style', SCORE],
      [1, 'heading', { text: 'The time is', level: 'medium' }], [1, 'para', { text: '--:--:--' }], [1, 'para', { text: '' }],
      [2, 'now', { part: 'time' }], [2, 'now', { part: 'date' }],
      [3, 'action', { when: 'every second', do: 'set the text to' }], [3, 'action', { when: 'the page opens', do: 'set the text to' }],
      [3, 'action', { when: 'every second', do: 'set the text to' }], [3, 'action', { when: 'the page opens', do: 'set the text to' }]],
    [[2, 4, 'look'], [2, 5, 'look'], [4, 8, 'target'], [6, 8, 'value'], [4, 9, 'target'], [6, 9, 'value'], [5, 10, 'target'], [7, 10, 'value'], [5, 11, 'target'], [7, 11, 'value']]) },
  { id: 'stopwatch', name: 'Stopwatch', blurb: 'Counts the seconds. Reset when you like', group: 'toys', graph: build([
      [0, 'style', SCORE], [0, 'style', BTN],
      [1, 'heading', { text: 'Seconds so far', level: 'medium' }], [1, 'para', { text: '0' }], [1, 'button', { text: 'Reset' }],
      [2, 'action', { when: 'every second', do: 'add to the number', value: 1 }], [2, 'action', { do: 'set the text to', value: 0 }]],
    [[1, 4, 'look'], [2, 5, 'look'], [4, 6, 'target'], [5, 7, 'on'], [4, 7, 'target']]) },
  { id: 'birthday', name: 'Days to go', blurb: 'Type a date, see how many days are left', group: 'toys', graph: build([
      [0, 'pagecfg', { title: 'Days to go', bg: CREAM, pattern: 'gradient', font: 'round', icon: '🎂', description: 'Type a date and see how many days are left.' }], [0, 'style', BTN],
      [1, 'heading', { text: 'How long to go?', level: 'medium' }], [1, 'field', { text: 'A date, like 2026-12-25' }], [1, 'button', { text: 'Count the days' }], [1, 'para', { text: '' }],
      [2, 'daysuntil'], [3, 'glue', { a: 'Only ', c: ' days to go! 🎉' }], [4, 'action', { do: 'set the text to' }]],
    [[2, 5, 'look'], [4, 7, 'date'], [7, 8, 'b'], [5, 9, 'on'], [6, 9, 'target'], [8, 9, 'value']]) },
  { id: 'mix', name: 'Colour mixer', blurb: 'Three sliders mix the colour of the page', group: 'toys', graph: build([
      [1, 'heading', { text: 'Mix a colour', level: 'medium' }], [1, 'slider', { label: 'Red', min: 0, max: 255, start: 200 }], [1, 'slider', { label: 'Green', min: 0, max: 255, start: 120 }],
      [1, 'slider', { label: 'Blue', min: 0, max: 255, start: 60 }], [1, 'para', { text: 'Move the sliders and the page changes colour.' }],
      [2, 'rgbmix'],
      [3, 'action', { when: 'is typed in or moved', do: 'set its background to' }], [3, 'action', { when: 'is typed in or moved', do: 'set its background to' }], [3, 'action', { when: 'is typed in or moved', do: 'set its background to' }]],
    [[2, 6, 'r'], [3, 6, 'g'], [4, 6, 'b'], [2, 7, 'on'], [6, 7, 'value'], [3, 8, 'on'], [6, 8, 'value'], [4, 9, 'on'], [6, 9, 'value']]) },
  { id: 'madlibs', name: 'Silly story', blurb: 'Fill in three words to get a silly story', group: 'toys', graph: build([
      [0, 'pagecfg', { title: 'Silly story', bg: CREAM, font: 'handwritten', icon: '📖', description: 'Fill in three words and read the silly story.' }], [0, 'style', BTN],
      [1, 'heading', { text: 'Silly story', level: 'medium' }], [1, 'field', { text: 'An adjective' }], [1, 'field', { text: 'An animal' }], [1, 'field', { text: 'A verb' }],
      [1, 'button', { text: 'Tell the story' }], [1, 'para', { text: '' }],
      [2, 'glue', { a: 'The ', c: ' ', e: ' loves to ' }], [3, 'glue', { c: '. Every single day!' }], [4, 'action', { do: 'set the text to' }]],
    [[2, 7, 'look'], [4, 9, 'b'], [5, 9, 'd'], [9, 10, 'a'], [6, 10, 'b'], [7, 11, 'on'], [8, 11, 'target'], [10, 11, 'value']]) },
  { id: 'hero', name: 'Hero name maker', blurb: 'Press the button for a new superhero name', group: 'toys', graph: build([
      [0, 'style', BTN], [0, 'style', TITLE],
      [1, 'heading', { text: 'Your hero name is', level: 'medium' }], [1, 'heading', { text: '???' }], [1, 'button', { text: 'Get a name' }],
      [2, 'list', { items: 'Captain, Doctor, Mighty, Shadow, Turbo, Professor' }], [2, 'list', { items: 'Banana, Thunder, Pickle, Wizard, Llama, Tornado' }],
      [3, 'pick'], [3, 'pick'], [4, 'glue', { a: '', b: ' ', c: '' }], [5, 'action', { do: 'set the text to' }], [5, 'action', { do: 'throw confetti' }]],
    [[1, 5, 'look'], [2, 4, 'look'], [6, 8, 'list'], [7, 9, 'list'], [8, 10, 'a'], [9, 10, 'c'], [5, 11, 'on'], [4, 11, 'target'], [10, 11, 'value'], [5, 12, 'on']]) },
  { id: 'temp', name: 'Temperature converter', blurb: 'Type degrees Celsius, get Fahrenheit', group: 'toys', graph: build([
      [0, 'pagecfg', { title: 'Temperature converter', bg: CREAM, font: 'round', icon: '🌡️', description: 'Turn degrees Celsius into Fahrenheit.' }], [0, 'style', SCORE],
      [1, 'heading', { text: 'Celsius to Fahrenheit', level: 'medium' }], [1, 'numbox', { label: 'Degrees Celsius', start: 20 }], [1, 'para', { text: '' }],
      [2, 'convert', { op: 'Celsius to Fahrenheit' }], [3, 'places', { dp: 1 }], [4, 'glue', { a: '', c: ' °F' }],
      [5, 'action', { when: 'is typed in or moved', do: 'set the text to' }], [5, 'action', { when: 'the page opens', do: 'set the text to' }]],
    [[2, 5, 'look'], [4, 6, 'n'], [6, 7, 'n'], [7, 8, 'b'], [4, 9, 'on'], [5, 9, 'target'], [8, 9, 'value'], [5, 10, 'target'], [8, 10, 'value']]) },
  { id: 'poll', name: 'Cats or dogs?', blurb: 'A tiny vote counter', group: 'toys', graph: build([
      [0, 'style', BTN],
      [1, 'heading', { text: 'Cats or dogs?', level: 'medium' }], [1, 'box', { flow: 'across' }], [1, 'box', { flow: 'across' }],
      [2, 'button', { text: 'Cats 🐱' }], [2, 'para', { text: '0' }], [2, 'button', { text: 'Dogs 🐶' }], [2, 'para', { text: '0' }],
      [3, 'action', { do: 'add to the number', value: 1 }], [3, 'action', { do: 'add to the number', value: 1 }]],
    [[1, 5, 'look'], [1, 7, 'look'], [3, 5, 'inside'], [3, 6, 'inside'], [4, 7, 'inside'], [4, 8, 'inside'], [5, 9, 'on'], [6, 9, 'target'], [7, 10, 'on'], [8, 10, 'target']]) },
  { id: 'todo', name: 'To-do list', blurb: 'Add jobs to a list, clear it when done', group: 'toys', graph: build([
      [0, 'pagecfg', { title: 'To-do list', bg: CREAM, font: 'round', icon: '✅', description: 'Add jobs to a list.' }], [0, 'style', BTN],
      [1, 'heading', { text: 'To do', level: 'medium' }], [1, 'box', { flow: 'across' }], [1, 'bullets', { items: '', type: 'bullets' }], [1, 'button', { text: 'Clear the list' }],
      [2, 'field', { text: 'What needs doing?' }], [2, 'button', { text: 'Add' }],
      [3, 'action', { do: 'add to the end of the list' }], [3, 'action', { do: 'clear it' }]],
    [[2, 6, 'look'], [2, 8, 'look'], [4, 7, 'inside'], [4, 8, 'inside'], [8, 9, 'on'], [5, 9, 'target'], [7, 9, 'value'], [6, 10, 'on'], [5, 10, 'target']]) },
  { id: 'dark', name: 'Dark mode switch', blurb: 'A tick box that turns the lights off', group: 'toys', graph: build([
      [0, 'pagecfg', { title: 'Dark mode', bg: '#ffffff', font: 'round', icon: '🌙', description: 'Tick the box and the page goes dark.' }],
      [1, 'heading', { text: 'Dark mode', level: 'medium' }], [1, 'para', { text: 'Tick the box and the lights go off.' }], [1, 'checkbox', { label: 'Dark mode' }],
      [2, 'if', { yes: INK, no: '#ffffff' }], [2, 'if', { yes: CREAM, no: INK }],
      [3, 'action', { when: 'is ticked or chosen', do: 'set its background to' }], [3, 'action', { when: 'is ticked or chosen', do: 'set its text colour to' }]],
    [[4, 5, 'cond'], [4, 6, 'cond'], [4, 7, 'on'], [5, 7, 'value'], [4, 8, 'on'], [6, 8, 'value']]) },
  { id: 'kind', name: 'Compliment machine', blurb: 'A kind word on demand. It can read it out too', group: 'toys', graph: build([
      [0, 'style', TITLE], [0, 'style', BTN],
      [1, 'heading', { text: 'You are...', level: 'medium' }], [1, 'heading', { text: '...ready to be told' }], [1, 'button', { text: 'Tell me' }],
      [2, 'list', { items: 'brilliant, kind, very clever, a great friend, making it look easy, someone special' }], [3, 'pick'],
      [4, 'action', { do: 'set the text to' }], [4, 'action', { do: 'grow it a bit' }]],
    [[1, 4, 'look'], [2, 5, 'look'], [6, 7, 'list'], [5, 8, 'on'], [4, 8, 'target'], [7, 8, 'value'], [5, 9, 'on'], [4, 9, 'target']]) },

  // ------------------------------------------------------------ make a page
  { id: 'card', name: 'Dog card', blurb: 'A box with a picture, some words and a link', group: 'pages', graph: build([
      [0, 'pagecfg', { title: 'Biscuit', bg: CREAM, font: 'book', icon: '🐶', description: 'Meet Biscuit, a border terrier who loves sticks.' }],
      [0, 'style', { bg: '#ffffff', space: 'large', border: 'thick', align: 'centre', shadow: 'hard', round: 'a little' }],
      [1, 'box', { flow: 'down' }],
      [2, 'image', { words: 'Photo goes here' }], [2, 'heading', { text: 'Biscuit', level: 'medium' }], [2, 'para', { text: 'Border terrier. Loves sticks and long walks.' }],
      [2, 'link', { text: 'More photos', address: 'https://example.com' }]],
    [[2, 3, 'look'], [3, 4, 'inside'], [3, 5, 'inside'], [3, 6, 'inside'], [3, 7, 'inside']]) },
  { id: 'about', name: 'About me page', blurb: 'A neat page about you. Change the words', group: 'pages', graph: build([
      [0, 'pagecfg', { title: 'About Sam', bg: CREAM, font: 'book', width: 'narrow', icon: '🙂', description: 'A little page about Sam: what I like and where to find me.' }],
      [0, 'style', { font: 'headline', size: 'giant', color: GREEN }], [0, 'style', { bg: GREEN, color: CREAM, bold: 'yes', space: 'medium', round: 'a little' }],
      [1, 'heading', { text: 'Hi, I am Sam' }], [1, 'para', { text: 'I like drawing, dogs and long bike rides. This is my page.' }], [1, 'divider'],
      [1, 'heading', { text: 'Things I like', level: 'medium' }], [1, 'bullets', { items: 'Drawing, Dogs, Bike rides, Pizza', type: 'bullets' }], [1, 'box', { flow: 'across' }],
      [2, 'link', { text: 'My art', address: 'https://example.com' }], [2, 'link', { text: 'Email me', address: 'mailto:sam@example.com' }]],
    [[2, 4, 'look'], [2, 7, 'look'], [9, 10, 'inside'], [9, 11, 'inside'], [3, 10, 'look'], [3, 11, 'look']]) },
  { id: 'cardday', name: 'Birthday card', blurb: 'Confetti when it opens. Can read it out loud', group: 'pages', graph: build([
      [0, 'pagecfg', { title: 'Happy birthday!', bg: CREAM, pattern: 'gradient', font: 'handwritten', icon: '🎂', description: 'A birthday card with confetti.' }],
      [0, 'style', { ...TITLE, color: GREEN }], [0, 'style', { align: 'centre', size: 'large' }], [0, 'style', { ...BTN, move: 'pulse' }],
      [1, 'heading', { text: 'Happy birthday!' }], [1, 'emoji', { text: '🎂', size: 'huge' }], [1, 'para', { text: 'Hope it is a great one.' }], [1, 'button', { text: 'More confetti' }], [1, 'button', { text: 'Read it to me' }],
      [2, 'action', { when: 'the page opens', do: 'throw confetti' }], [2, 'action', { do: 'throw confetti' }], [2, 'action', { do: 'say it out loud', value: 'Happy birthday! Hope it is a great one.' }]],
    [[2, 5, 'look'], [3, 6, 'look'], [3, 7, 'look'], [4, 8, 'look'], [4, 9, 'look'], [8, 11, 'on'], [9, 12, 'on']]) },

  // ------------------------------------------------------------ maths, text and lists
  { id: 'tip', name: 'Tip calculator', blurb: 'Works out a tip and a total', group: 'maths', graph: build([
      [0, 'number', { value: 80 }], [0, 'number', { value: 15 }],
      [1, 'math', { op: '÷', b: 100 }], [1, 'compare', { op: '>', b: 60 }],
      [2, 'math', { op: '×' }], [2, 'if', { yes: 'Big table, nice tip', no: 'Thank you' }],
      [3, 'math', { op: '+' }], [3, 'places', { dp: 2 }],
      [4, 'log', { label: 'Tip' }], [4, 'log', { label: 'Total' }], [4, 'log', { label: 'Note' }]],
    [[2, 3, 'a'], [1, 5, 'a'], [3, 5, 'b'], [1, 4, 'a'], [4, 6, 'cond'], [1, 7, 'a'], [5, 7, 'b'], [5, 8, 'n'], [8, 9, 'v'], [7, 10, 'v'], [6, 11, 'v']]) },
  { id: 'shout', name: 'Shout a word', blurb: 'Turns text into capitals', group: 'maths', graph: build([
      [0, 'text', { value: 'blocks are fun' }], [1, 'textop', { op: 'upper' }], [2, 'log']], [[1, 2, 't'], [2, 3, 'v']]) },
  { id: 'detective', name: 'Text detective', blurb: 'Counts words and vowels, and spots a palindrome', group: 'maths', graph: build([
      [0, 'text', { value: 'A man a plan a canal Panama' }],
      [1, 'textop', { op: 'word count' }], [1, 'textop', { op: 'vowel count' }], [1, 'textop', { op: 'title case' }], [1, 'textop', { op: 'is a palindrome' }],
      [2, 'log', { label: 'Words' }], [2, 'log', { label: 'Vowels' }], [2, 'log', { label: 'Title case' }], [2, 'log', { label: 'Palindrome?' }]],
    [...fan(1, [2, 3, 4, 5], 't'), [2, 6, 'v'], [3, 7, 'v'], [4, 8, 'v'], [5, 9, 'v']]) },
  { id: 'marks', name: 'Class marks', blurb: 'Average, best, worst and sorted marks', group: 'maths', graph: build([
      [0, 'list', { items: '72, 85, 90, 64, 88, 91, 55' }],
      [1, 'listtool', { op: 'average' }], [1, 'listtool', { op: 'biggest' }], [1, 'listtool', { op: 'smallest' }], [1, 'listtool', { op: 'sort' }],
      [2, 'places', { dp: 1 }], [2, 'join', { sep: ', ' }],
      [3, 'log', { label: 'Average' }], [3, 'log', { label: 'Best' }], [3, 'log', { label: 'Worst' }], [3, 'log', { label: 'Sorted' }]],
    [...fan(1, [2, 3, 4, 5], 'list'), [2, 6, 'n'], [6, 8, 'v'], [3, 9, 'v'], [4, 10, 'v'], [5, 7, 'list'], [7, 11, 'v']]) },
  { id: 'fizz', name: 'Fizz buzz', blurb: 'The famous coding test, in four blocks', group: 'maths', graph: build([
      [0, 'range', { from: 1, to: 30 }], [1, 'map', { expr: 'x % 15 === 0 ? "FizzBuzz" : x % 3 === 0 ? "Fizz" : x % 5 === 0 ? "Buzz" : x' }], [2, 'join', { sep: ' ' }], [3, 'log']],
    [[1, 2, 'list'], [2, 3, 'list'], [3, 4, 'v']]) },
  { id: 'times', name: 'Times table', blurb: 'The seven times table, 1 to 12', group: 'maths', graph: build([
      [0, 'range', { from: 1, to: 12 }], [1, 'map', { expr: 'x * 7' }], [2, 'join', { sep: ', ' }], [3, 'log', { label: 'Seven times table' }]],
    [[1, 2, 'list'], [2, 3, 'list'], [3, 4, 'v']]) },
  { id: 'primes', name: 'Prime numbers', blurb: 'Every prime up to 60', group: 'maths', graph: build([
      [0, 'range', { from: 2, to: 60 }], [1, 'filter', { expr: 'Array.from({ length: x - 2 }, (_, i) => i + 2).every((d) => x % d !== 0)' }], [2, 'join', { sep: ' ' }], [3, 'log', { label: 'Primes' }]],
    [[1, 2, 'list'], [2, 3, 'list'], [3, 4, 'v']]) },
  { id: 'units', name: 'Convert it', blurb: 'Degrees, miles and kilograms in one go', group: 'maths', graph: build([
      [0, 'number', { value: 100 }],
      [1, 'convert', { op: 'Celsius to Fahrenheit' }], [1, 'convert', { op: 'miles to km' }], [1, 'convert', { op: 'kg to pounds' }],
      [2, 'log', { label: '100 °C in °F' }], [2, 'log', { label: '100 miles in km' }], [2, 'log', { label: '100 kg in pounds' }]],
    [...fan(1, [2, 3, 4], 'n'), [2, 5, 'v'], [3, 6, 'v'], [4, 7, 'v']]) },

  // ------------------------------------------------------------ variables, global style and the newer blocks
  { id: 'varcount', name: 'Counter with a variable', blurb: 'A Variable remembers a number. Three buttons change it', group: 'start', graph: build([
      [0, 'pagecfg', { title: 'Counter', bg: CREAM, font: 'round', icon: '🔢', description: 'A counter that remembers its number.' }], [0, 'style', SCORE], [0, 'style', BTN],
      [1, 'heading', { text: 'My counter', level: 'medium' }], [1, 'para', { text: '0' }], [1, 'button', { text: 'Add one' }], [1, 'button', { text: 'Take one away' }], [1, 'button', { text: 'Start again' }],
      [2, 'variable', { _t: 'Score', holds: 'a number', start: '0' }],
      [3, 'action', { do: 'change variable by', value: 1 }], [3, 'action', { do: 'change variable by', value: -1 }], [3, 'action', { do: 'reset variable' }]],
    [[2, 5, 'look'], [3, 6, 'look'], [3, 7, 'look'], [3, 8, 'look'], [9, 5, 'text'], [6, 10, 'on'], [9, 10, 'target'], [7, 11, 'on'], [9, 11, 'target'], [8, 12, 'on'], [9, 12, 'target']]) },
  { id: 'shop', name: 'Clicker shop', blurb: 'Earn points, then spend them on a stronger click', group: 'games', graph: build([
      [0, 'pagecfg', { title: 'Clicker shop', bg: CREAM, font: 'round', icon: '🛒', description: 'Click for points. Buy a stronger click.' }], [0, 'style', SCORE], [0, 'style', BIGBTN], [0, 'style', BTN],
      [1, 'heading', { text: 'Clicker shop', level: 'medium' }], [1, 'para', { text: '0' }], [1, 'para', { text: '1' }], [1, 'button', { text: 'Click!' }], [1, 'button', { text: 'Buy a stronger click (10)' }],
      [2, 'glue', { a: 'Points: ', c: '' }], [2, 'glue', { a: 'Each click gives: ', c: '' }],
      [3, 'variable', { _t: 'Points', holds: 'a number', start: '0' }], [3, 'variable', { _t: 'Power', holds: 'a number', start: '1' }], [3, 'compare', { op: '>=', b: 10 }],
      [4, 'action', { do: 'change variable by' }], [4, 'action', { do: 'change variable by', value: 1 }], [4, 'action', { do: 'change variable by', value: -10 }]],
    [[2, 6, 'look'], [3, 8, 'look'], [4, 9, 'look'], [12, 10, 'b'], [10, 6, 'text'], [13, 11, 'b'], [11, 7, 'text'], [12, 14, 'a'],
      [8, 15, 'on'], [12, 15, 'target'], [13, 15, 'value'], [9, 16, 'on'], [13, 16, 'target'], [14, 16, 'only'], [9, 17, 'on'], [12, 17, 'target'], [14, 17, 'only']]) },
  { id: 'rolls', name: 'Dice history', blurb: 'Roll a die. Every roll is kept in a list variable', group: 'games', graph: build([
      [0, 'pagecfg', { title: 'Dice history', bg: CREAM, font: 'round', icon: '🎲', description: 'Roll a die and keep every roll.' }], [0, 'style', BTN], [0, 'style', SCORE],
      [1, 'heading', { text: 'Dice history', level: 'medium' }], [1, 'para', { text: 'No rolls yet' }], [1, 'para', { text: '' }], [1, 'button', { text: 'Roll' }], [1, 'button', { text: 'Clear' }],
      [2, 'variable', { _t: 'Rolls', holds: 'a list', start: '' }], [2, 'random', { from: 1, to: 6 }],
      [3, 'join', { sep: ', ' }], [3, 'listmaths', { op: 'sum' }], [4, 'glue', { a: 'Total: ', c: '' }],
      [5, 'action', { do: 'add to list variable' }], [5, 'action', { do: 'empty list variable' }]],
    [[2, 7, 'look'], [2, 8, 'look'], [3, 6, 'look'], [9, 11, 'list'], [11, 5, 'text'], [9, 12, 'list'], [12, 13, 'b'], [13, 6, 'text'],
      [7, 14, 'on'], [9, 14, 'target'], [10, 14, 'value'], [8, 15, 'on'], [9, 15, 'target']]) },
  { id: 'trail', name: 'Sparkle trail', blurb: 'Sparkles follow the mouse while stars fall', group: 'toys', graph: build([
      [0, 'pagecfg', { title: 'Sparkle trail', bg: INK, font: 'headline', icon: '✨', description: 'Move the mouse and sparkles follow.' }], [0, 'style', { ...TITLE, color: CREAM }],
      [1, 'heading', { text: 'Move your mouse', level: 'big' }], [1, 'follower', { text: '✨', size: 'big' }], [1, 'rain', { things: '⭐ ✨ 💫', amount: 'some', way: 'fall' }]],
    [[2, 3, 'look']]) },
  { id: 'xmas', name: 'Countdown', blurb: 'Days, hours and minutes to a date. Change the date', group: 'toys', graph: build([
      [0, 'pagecfg', { title: 'Countdown', font: 'headline', icon: '⏳', description: 'A live countdown to a date.' }], [0, 'palette', { theme: 'Sunset' }], [0, 'style', { ...TITLE }], [0, 'style', { align: 'centre', size: 'huge', bold: 'yes' }],
      [1, 'heading', { text: 'Not long now', level: 'big' }], [1, 'countdown', { date: nextXmas() }], [1, 'clock', { show: 'date and time' }]],
    [[3, 5, 'look'], [4, 6, 'look'], [4, 7, 'look']]) },
  { id: 'colourlab', name: 'Colour lab', blurb: 'Two sliders pick a colour. See its hex and its opposite', group: 'toys', graph: build([
      [0, 'pagecfg', { title: 'Colour lab', bg: CREAM, font: 'round', icon: '🎨', description: 'Pick a colour with sliders.' }], [0, 'style', SCORE],
      [1, 'heading', { text: 'Colour lab', level: 'medium' }], [1, 'slider', { label: 'Hue', min: 0, max: 360, start: 200 }], [1, 'slider', { label: 'Lightness', min: 10, max: 90, start: 55 }], [1, 'para', { text: '' }],
      [2, 'hslcol', { s: 80 }], [3, 'colourfacts', { op: 'as hex' }], [3, 'adjustcol', { op: 'opposite colour' }], [4, 'glue', { a: 'Colour ', c: '   Opposite ', e: '' }],
      [5, 'action', { when: 'every tenth of a second', do: 'set the page background to' }], [5, 'action', { when: 'every tenth of a second', do: 'set the text to' }]],
    [[2, 6, 'look'], [4, 7, 'h'], [5, 7, 'l'], [7, 8, 'c'], [7, 9, 'c'], [8, 10, 'b'], [9, 10, 'd'], [7, 11, 'value'], [6, 12, 'target'], [10, 12, 'value']]) },
  { id: 'globalstyle', name: 'Global style', blurb: 'Three blocks restyle every heading, button and box', group: 'pages', graph: build([
      [0, 'pagecfg', { title: 'Global style', bg: CREAM, font: 'book', icon: '🎛️', description: 'One style block for every heading, button and box.' }],
      [0, 'gstyle', { target: 'all headings', font: 'headline', color: GREEN, letters: 'CAPITALS' }],
      [0, 'gstyle', { target: 'all buttons', bg: GOLD, color: INK, bold: 'yes', round: 'pill', space: 'medium', hover: 'lift up' }],
      [0, 'gstyle', { target: 'all boxes', bg: '#ffffff', border: 'thick', space: 'large', shadow: 'hard' }],
      [1, 'box', { flow: 'down' }],
      [2, 'heading', { text: 'Everything matches', level: 'medium' }], [2, 'para', { text: 'Change a Global style block and every one updates.' }], [2, 'button', { text: 'First' }], [2, 'button', { text: 'Second' }]],
    [[6, 5, 'inside'], [7, 5, 'inside'], [8, 5, 'inside'], [9, 5, 'inside']]) },
  { id: 'theme', name: 'Theme picker', blurb: 'One Palette block recolours the whole page', group: 'pages', graph: build([
      [0, 'pagecfg', { title: 'Theme picker', font: 'round', icon: '🎨', description: 'A palette recolours the page.' }], [0, 'palette', { theme: 'Night' }],
      [1, 'card', { gap: 'medium' }],
      [2, 'badge', { text: 'NEW' }], [2, 'heading', { text: 'Night theme', level: 'medium' }], [2, 'para', { text: 'Open the Palette block and choose another theme.' }], [2, 'button', { text: 'Try it' }]],
    [[4, 3, 'inside'], [5, 3, 'inside'], [6, 3, 'inside'], [7, 3, 'inside']]) },
  { id: 'profile', name: 'Profile page', blurb: 'A top bar, a card, a table and a fold-out', group: 'pages', graph: build([
      [0, 'pagecfg', { title: 'Sam Rivers', bg: CREAM, font: 'book', width: 'narrow', icon: '🖌️', description: 'Sam Rivers, illustrator.' }],
      [1, 'navbar', { spread: 'apart' }], [2, 'heading', { text: 'SAM', level: 'small' }], [2, 'link', { text: 'Work', address: 'https://example.com' }], [2, 'link', { text: 'Contact', address: 'mailto:sam@example.com' }],
      [1, 'card', { gap: 'medium' }],
      [2, 'heading', { text: 'Sam Rivers', level: 'medium' }], [2, 'badge', { text: 'Open to work' }], [2, 'para', { text: 'Illustrator. I draw dogs.' }],
      [2, 'table', { rows: 'Skill, Level; Drawing, 9; Colour, 8; Lettering, 7', head: 'a header' }], [2, 'details', { title: 'More about me', open: 'closed' }], [3, 'para', { text: 'I live by the sea and walk a lot.' }]],
    [[3, 2, 'inside'], [4, 2, 'inside'], [5, 2, 'inside'], [7, 6, 'inside'], [8, 6, 'inside'], [9, 6, 'inside'], [10, 6, 'inside'], [11, 6, 'inside'], [12, 11, 'inside']]) },
  { id: 'typer', name: 'Typewriter', blurb: 'Words type themselves out, one letter at a time', group: 'pages', graph: build([
      [0, 'pagecfg', { title: 'Typewriter', bg: INK, font: 'code', icon: '⌨️', description: 'Words that type themselves.' }], [0, 'style', { color: '#7CFFB2', size: 'huge' }], [0, 'style', BTN],
      [1, 'typewriter', { text: 'Hello! I was made with blocks.', speed: 'normal' }], [1, 'heading', { text: '', level: 'medium' }], [1, 'button', { text: 'Type another line' }],
      [2, 'action', { do: 'type it out', value: 'Blocks are fun.' }]],
    [[2, 4, 'look'], [2, 5, 'look'], [3, 6, 'look'], [6, 7, 'on'], [5, 7, 'target']]) },
  { id: 'textlab', name: 'Text lab', blurb: 'One phrase in four cases, plus its initials', group: 'maths', graph: build([
      [0, 'text', { value: 'hello big world' }],
      [1, 'casing', { style: 'camelCase' }], [1, 'casing', { style: 'Title Case' }], [1, 'casing', { style: 'kebab-case' }], [1, 'moretext', { op: 'initials' }],
      [2, 'log', { label: 'camelCase' }], [2, 'log', { label: 'Title Case' }], [2, 'log', { label: 'kebab-case' }], [2, 'log', { label: 'Initials' }]],
    [...fan(1, [2, 3, 4, 5], 't'), [2, 6, 'v'], [3, 7, 'v'], [4, 8, 'v'], [5, 9, 'v']]) },
  { id: 'listlab', name: 'List lab', blurb: 'Twelve dice rolls: sorted, averaged and counted', group: 'maths', graph: build([
      [0, 'randlist', { n: 12, a: 1, b: 6, when: 'once, at the start' }],
      [1, 'sortlist', { how: 'smallest first' }], [1, 'listmaths', { op: 'average' }], [1, 'listmaths', { op: 'mode' }], [1, 'tally'],
      [2, 'log', { label: 'Sorted' }], [2, 'log', { label: 'Average' }], [2, 'log', { label: 'Most common' }], [2, 'log', { label: 'Counts' }]],
    [...fan(1, [2, 3, 4, 5], 'list'), [2, 6, 'v'], [3, 7, 'v'], [4, 8, 'v'], [5, 9, 'v']]) },
  { id: 'datelab', name: 'Date lab', blurb: 'A date 100 days away, an age and a countdown', group: 'maths', graph: build([
      [0, 'dateadd', { date: 'today', n: 100, unit: 'days' }], [0, 'age', { date: '2012-05-30' }], [0, 'dategap', { a: 'today', b: nextXmas(), unit: 'days' }], [0, 'countdowntext', { date: nextXmas() }],
      [1, 'datefmt', { style: 'long date' }],
      [2, 'log', { label: 'In 100 days' }], [2, 'log', { label: 'Age' }], [2, 'log', { label: 'Days to go' }], [2, 'log', { label: 'Countdown' }]],
    [[1, 5, 'date'], [5, 6, 'v'], [2, 7, 'v'], [3, 8, 'v'], [4, 9, 'v']]) },
  { id: 'loan', name: 'Loan check', blurb: 'A monthly payment, and what savings grow to', group: 'maths', graph: build([
      [0, 'loan', { amount: 5000, rate: 6, years: 3 }], [0, 'interest', { amount: 1000, rate: 5, years: 10 }],
      [1, 'numfmt', { style: 'pounds' }], [1, 'numfmt', { style: 'pounds' }],
      [2, 'log', { label: 'Monthly payment' }], [2, 'log', { label: 'Savings after 10 years' }]],
    [[1, 3, 'n'], [2, 4, 'n'], [3, 5, 'v'], [4, 6, 'v']]) },
];

export const exampleById = (id: string) => EXAMPLES.find((x) => x.id === id);
