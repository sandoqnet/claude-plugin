// The theme's keys and the one card of the app's place (order D1, part B). The pane cannot read the app's theme, but a theme
// KEY as a color follows it: `inverseText` draws as a ground (white on the light theme, dark on the dark one), and the keys
// `inactive`, `suggestion`, `success` and `warning` draw as words that keep their contrast on it. A card that holds a control
// (a Button, an Input, a Select: the app paints these by its own theme) stands on that ground with its words in these keys, so
// its contrast holds with no work of ours. A hex ground is for words that stand alone on the scene. The default text has no
// color. The terminal draws with LOOK's keys and never reads this file. This file imports only the steps of space.ts.
import { SPACE } from './space'

export const THEME = {
  ground: 'inverseText',
  line: 'inactive',
  dim: 'inactive',
  accent: 'suggestion',
  ok: 'success',
  warn: 'warning',
  // A failed task's word: the pane's colors have no fault key, and the theme's own `error` follows the theme as the others do.
  fault: 'error',
  // The full ink: the theme's own text key, the edge of an open box and of the lean answer.
  ink: 'text',
} as const

// THE PRESS BOX's sizes and spaces, ONCE: no other file types one (order DP, P1).
// Rows are down and cells are across. A box of one line is `high` rows and each further line adds `perLine`, so n lines are n + 1 rows; it is
// as wide as its label and `across` cells (a cell of padding and the edge, each side), never under `least`; a row of a list is the card's width
// less `listLess`, which is the card's edge and `cardPad` cells of padding each side. `between` rows lie between two pressed rows, `beside`
// cells between two side by side (`besideNarrow` at `NARROW_AT` columns and under, where three answers need 30), `apart` the least cells
// between a label and its value cell. `chrome` is the rows a card
// takes besides its boxes and the rows between them, so a list of n one-line boxes stands whole where 4 + 3n <= C (C: the rows the canvas
// leaves), else k = floor((C - 7) / 3) a page with the pager's row. `openWord` stands in the value cell of the open row.
export const PRESS = {
  high: 2,
  perLine: 1,
  across: 4,
  padX: 1,
  least: 8,
  listLess: 6,
  cardPad: 2,
  between: 1,
  apart: 1,
  beside: 2,
  besideNarrow: 1,
  chrome: 5,
  // The rows the edge of a box adds in all, top and bottom together (so n lines are n + 1 rows), and the end of the key of its Box.
  edgeRows: 1,
  boxKey: '-box',
  openWord: 'open',
  // The leading dot of the label of the lean answer, before its words and a space (`● Update`). Never an arrow: the arrow says a box opens a place.
  leanMark: '●',
  // The shelf place (order P7, C2): the least cells of an item's box in a plank, and the least rows the canvas leaves from which an item
  // stands as a tile over its box (below it the item is its box alone, one line). 18 is what one line of tile over box takes with BOTH
  // pagers, the planks' and the plank's own: the card's 4 rows, the counted line, the plank's head, the tile and the box 3 rows each, and
  // the pagers' 3 each. `shelfGap` is the least rows from which the row between two parts of the card stands (never taken where it is
  // what fits): a plank that pages twice takes four of them, so it is shelfTile and those four, as the sweep of every pane height shows
  // (tests/shelf-room.test.ts).
  shelfItem: 20,
  shelfTile: 18,
  shelfGap: 22,
} as const

// THE STRIP of a card or a window (order DP, P2), ONCE: 3 rows, a press box 2 rows high at the top and one row of air under it, on the
// theme's ground; Back at the left, the title, Close at the right; the first part of the card follows the strip at once, so the row of air
// is the space between them, and `titleLeast` cells are kept for the title before Back is cut. The box and its look are PRESS's.
export const STRIP = {
  rows: 3,
  titleLeast: 4,
  // the cells the title needs to be drawn at all; under them the strip leaves it out
  titleShown: 3,
} as const

// A press box by its Box: a bordered Box whose key ends in PRESS.boxKey. The pane's estimates of rows (views/cells.ts, and the test frame)
// count the edge of this box as PRESS.edgeRows, not as a row a side as a card's.
export const isPressBox = (node: any): boolean => {
  const key = node?.key ?? node?.props?.key
  return typeof key === 'string' && key.endsWith(PRESS.boxKey) && node?.props?.borderStyle !== undefined
}
export const NARROW_AT = 40
export const besideOf = (columns?: number): number => (columns !== undefined && columns <= NARROW_AT ? PRESS.besideNarrow : PRESS.beside)

// The side padding of a card, in cells: the step `inset`, held here until space.ts has it, and the step `control` under INSET_UNDER columns of the pane.
export const INSET = 3
export const INSET_UNDER = 60
export const insetOf = (columns?: number): number => (columns !== undefined && columns < INSET_UNDER ? SPACE.control : INSET)

// The cells of a card's own content: its width less the border (one cell a side) and the side padding. With no width, no limit.
export const innerOf = (width?: number, columns?: number): number => (width === undefined ? Number.POSITIVE_INFINITY : width - 2 - 2 * insetOf(columns))

// The letters of a text as the eye sees them: one entry for a letter with its marks, a joined emoji or a pair of flags, never
// half of a surrogate pair. Where the host has no segmenter, one entry for each code point.
const lettersOf = (text: string): string[] => {
  const Segmenter = (Intl as any).Segmenter
  return Segmenter === undefined ? Array.from(text) : Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (part: any) => part.segment as string)
}

// The code points that take two cells: Hangul, the CJK blocks and their forms, the full-width forms, flags and emoji.
const WIDE: [number, number][] = [
  [0x1100, 0x115f], [0x2e80, 0x303e], [0x3041, 0x33ff], [0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xa000, 0xa4cf], [0xac00, 0xd7a3],
  [0xf900, 0xfaff], [0xfe30, 0xfe4f], [0xff00, 0xff60], [0xffe0, 0xffe6], [0x1f1e6, 0x1f1ff], [0x1f300, 0x1f64f], [0x1f680, 0x1f6ff],
  [0x1f900, 0x1f9ff], [0x1fa70, 0x1faff], [0x20000, 0x3fffd],
]

// The cells of one letter: 2 for a wide one (a joined or variation-selected emoji too), 0 for a control, else 1.
const cellsOfLetter = (letter: string): number => {
  const point = letter.codePointAt(0) ?? 0
  if (point < 0x20 || (point >= 0x7f && point < 0xa0)) return 0
  if (letter.includes('‍') || letter.includes('️')) return 2
  return WIDE.some(([from, to]) => point >= from && point <= to) ? 2 : 1
}

// The cells a text takes in a row of the app: a wide letter is two.
export const cellsOf = (text: string): number => lettersOf(text).reduce((sum, letter) => sum + cellsOfLetter(letter), 0)

// The most letters of a text that fit `cells`, cut at a letter and never inside one (a pair, a joined emoji, a letter and its marks).
export function cutCells(text: string, cells: number): string {
  let used = 0
  let kept = ''
  for (const letter of lettersOf(text)) {
    const width = cellsOfLetter(letter)
    if (used + width > cells) break
    used += width
    kept += letter
  }
  return kept
}

// The label of a Button that must fit a row. A Button of the app is its label alone and does not wrap, so a label that does
// not fit the cells is the short one when it does, else cut at its end with an ellipsis (a row says it was cut, never wraps it).
// The count and the cut are by cells: a wide letter is two, and no letter is cut in half.
export function fitted(label: string, inner: number, short?: string): string {
  if (cellsOf(label) <= inner) return label
  if (short !== undefined && cellsOf(short) <= inner) return short
  return inner > 1 ? `${cutCells(label, inner - 1)}…` : cutCells(label, Math.max(0, inner))
}

// What a view takes of the pane's layout: the column's width in cells, and whether the acts of a card
// stack. With no plan a view draws as it did before, at the width it was given.
export type Plan = { width: number; stack: boolean }

// The one card: a round border in `line`, the theme's ground, the side padding and one row above and
// below, and one row between its parts. `width` is the plan's; with none the card takes the width of its place.
export const cardProps = (width?: number, columns?: number) =>
  ({
    flexDirection: 'column',
    gap: SPACE.line,
    borderStyle: 'round',
    borderColor: THEME.line,
    backgroundColor: THEME.ground,
    paddingX: insetOf(columns),
    paddingY: SPACE.line,
    ...(width === undefined ? {} : { width }),
  }) as const

// How the acts of a card lie: stacked in a column at the left under the stack, else a row with the link at the left and the
// picks at the right, wrapping when the row is full.
export const actsProps = (stack = false) =>
  stack
    ? ({ flexDirection: 'column', alignItems: 'flex-start', rowGap: SPACE.line } as const)
    : ({ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: SPACE.group, rowGap: SPACE.line } as const)

// A row of controls that sit together: a pick of several, the choices of a wait.
export const picksProps = { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: SPACE.control, rowGap: SPACE.line } as const
