// THE ONE PRESS BOX of the app (order DP, P1). Every thing the person presses is this box: a keyed Box with a round edge and ONE plain Button inside,
// 2 rows high for one line and n + 1 for n, as wide as its label and 4 cells and never under 8, a row of a list the card's width less 6
// (the sizes and the spaces are names in views/theme.ts, PRESS, and no other file types one). A clear region of the box's size lies over it
// (a Client of hooks/item.tsx, as the dock's words have): a press anywhere on the box acts, and the Button inside carries Tab and Enter.
// THE STATES, the same in each place: rest, the made edge tone; hover, the accent edge (the Box's own hover); open, the DOUBLE edge in the
// full ink AND the word `open` in the value cell where the row has one, the label bold; the lean answer, the ink edge, a bold label AND a
// leading dot in its label string (a dot and a space before the words, `● Update`; no arrow, which says a box opens a place). Never color alone. FOCUS is the Button's own inverse: the
// accent edge is the hover's alone (a Box has no focus prop). The label is bold by a Text child of the Button, which the app was seen to draw
// as the label alone (and the CLI host refuses): so bold is extra and never relied on; the double edge, the word `open` and the lean's dot
// still say the state. The terminal draws none of this.
// This file also holds the PURE counts of a list of boxes and of its pager: the pager's own rows are counted by the SAME function as a
// list's, so a page is never typed (a list of n one-line boxes stands whole where 4 + 3n <= C, else k = floor((C - 7) / 3) a page).
import { pageAt, pageWords } from '../model/pages'
import type { Page } from '../model/pages'
import { PRESS, THEME, besideOf, cellsOf, fitted } from './theme'
import type { Ui } from './types'

// The rows of a box of `lines` lines: 2 for one, n + 1 for n.
export const pressHigh = (lines = 1): number => PRESS.high + (Math.max(1, Math.floor(lines)) - 1) * PRESS.perLine

// The cells of a box that holds `words` on one line: the words and 4, never under 8.
export const pressWidth = (words: string): number => Math.max(PRESS.least, cellsOf(words) + PRESS.across)

// The cells of a row of a list in a card `cardWidth` cells wide: the card's width less its edge and its side padding each side, the one rule
// of innerOf (views/theme.ts). A card of the lists sets its padding to PRESS.cardPad, so that is the default (PRESS.listLess is its value);
// a card that keeps the padding of cardProps passes it, `insetOf(columns)`.
export const listRowWidth = (cardWidth: number, inset: number = PRESS.cardPad): number => cardWidth - 2 - 2 * inset

// The lines a row of boxes `widths` takes in `inner` cells with `beside` cells between two: a box that does not fit starts a line.
export function pressLinesOf(widths: number[], inner: number, beside: number): number {
  let lines = 1
  let used = 0
  for (const width of widths.map(each => Math.min(each, inner))) {
    if (used > 0 && used + beside + width > inner) {
      lines += 1
      used = width
    } else used = used === 0 ? width : used + beside + width
  }
  return lines
}

// The rows of `lines` lines of one-line boxes, a row between two lines.
export const pressStackRows = (lines: number): number => (lines <= 0 ? 0 : lines * PRESS.high + (lines - 1) * PRESS.between)

export const PREVIOUS = '‹ Previous'
export const NEXT = 'Next ›'
const PAGER_BOXES = [pressWidth(PREVIOUS), pressWidth(NEXT)]

// The rows the pager takes under a list of boxes in a card `inner` cells wide (the worst case, a middle page with both boxes): the row
// between the list and the pager, then the lines of its boxes, counted by the function that counts a list's lines. One line is 3 rows.
export const pressPagerRows = (inner: number, columns?: number): number => PRESS.between + pressStackRows(pressLinesOf(PAGER_BOXES, inner, besideOf(columns)))

// The page asked of a list of boxes, `lines` the lines of each box: the rows of the list are the boxes and the row between two, and the
// canvas leaves `canvasRows` (none: no limit); the card's own rows are `chrome` (PRESS.chrome, or more for a card that holds a row of its
// own above its boxes) and the pager's are counted by pressPagerRows.
export function pressPageOf(lines: number[], canvasRows: number | undefined, page: number, inner: number, columns?: number, chrome: number = PRESS.chrome): Page {
  const budget = canvasRows === undefined ? Number.POSITIVE_INFINITY : canvasRows - chrome
  return pageAt(lines.map(pressHigh), budget, page, PRESS.between, pressPagerRows(inner, columns))
}

// The regions that act: a press posted by a clear region names its box by `press:ID`, and the register runs the act drawn last.
const REGION = 'press:'
const ACTS = new Map<string, () => void | Promise<void>>()
export async function pressedRegion(word: unknown): Promise<boolean> {
  const act = typeof word === 'string' ? ACTS.get(word) : undefined
  if (act === undefined) return false
  await act()
  return true
}

export type PressProps = {
  ui: Ui
  // The key of the Button inside; the Box is `ID-box` and the region `ID-region` (no key of a box ends in `-more` or `-earlier`, which
  // name a pager's Buttons).
  id: string
  label: string
  // The cells of the box; none is the label and 4 cells, never under 8.
  width?: number
  // The value cell at the right, dim, and the arrow `›` that says the box opens a place.
  value?: string
  arrow?: boolean
  // The further lines of a box of more than one line, dim, under the label.
  more?: string[]
  // This place is the one showing, and the lean answer. An open box with a value says `word` in its value cell where one is given
  // (the shelf's whose row says `shown`), else PRESS.openWord.
  open?: boolean
  word?: string
  lean?: boolean
  // A PLAIN press (order P1c): no edge and no padding, the label and its further lines as they are, 1 row for one line and n for n; the
  // region lies over all of it. Under the pointer it takes a ground (PLAIN_HOVER). The open state is the bold label and the word `open` at
  // the right (give `value: ''`), never the edge.
  plain?: boolean
  hotkey?: string
  onPress: () => void | Promise<void>
}

// The cue of a PLAIN press under the pointer (order P1c): a ground behind the box, the Box's own hover, so a row with no frame does not read as
// text. A grey at a fifth of its strength keeps the label and the dim line legible on a light theme and on a dark one.
export const PLAIN_HOVER = { backgroundColor: '#80808033' } as const

// The box. The label is the Button's, cut to the cells the value cell and the arrow leave it; the value cell is cut to the cells the label
// leaves it (and left out under 3), but the word `open` and the arrow stand whole.
export function pressBox({ ui, id, label, width, value, arrow = false, more = [], open = false, word: said, lean = false, plain = false, hotkey, onPress }: PressProps) {
  const { Box, Text, Button, Client } = ui
  const hasValue = value !== undefined
  const bold = open || lean
  const tail = arrow ? '›' : ''
  // the lean answer carries its DOT in the label string (a dot and a space before the words), so it is told by more than color or
  // weight: the app was seen to draw a Button's Text child as the label alone, and a bold child is never relied on
  const lead = lean ? `${PRESS.leanMark} ` : ''
  const across = plain ? 0 : PRESS.across
  const words = [`${lead}${label}`, hasValue ? value : '', tail].filter(part => part !== '').join(' '.repeat(PRESS.apart))
  const wide = width ?? (plain ? Math.max(PRESS.least, cellsOf(words)) : pressWidth(words))
  const inner = Math.max(1, wide - across)
  const word = open && hasValue ? (said ?? PRESS.openWord) : value ?? ''
  // the cells the value cell and the arrow may take: what the label leaves, and the arrow and the open word always
  const tailCells = tail === '' ? 0 : cellsOf(tail) + (word === '' ? 0 : PRESS.apart)
  const keep = open && hasValue ? cellsOf(word) : Math.min(cellsOf(word), Math.max(0, inner - cellsOf(`${lead}${label}`) - PRESS.apart - tailCells))
  const shown = word !== '' && keep >= Math.min(3, cellsOf(word)) ? fitted(word, keep) : ''
  const cell = [shown, tail].filter(part => part !== '').join(' '.repeat(PRESS.apart))
  const room = Math.max(1, inner - (cell === '' ? 0 : cellsOf(cell) + PRESS.apart))
  // the dot stands whole; the words are cut to the cells it leaves
  const shownLabel = `${lead}${fitted(label, Math.max(1, room - cellsOf(lead)))}`
  const press = () => void onPress()
  const high = plain ? 1 + more.length : pressHigh(1 + more.length)
  if (Client !== undefined) ACTS.set(REGION + id, onPress)
  const button = bold ? (
    <Button key={id} plain label={shownLabel} {...(hotkey === undefined ? {} : { hotkey })} onPress={press}>
      <Text bold>{shownLabel}</Text>
    </Button>
  ) : (
    <Button key={id} plain label={shownLabel} {...(hotkey === undefined ? {} : { hotkey })} onPress={press} />
  )
  return (
    <Box
      key={`${id}${PRESS.boxKey}`}
      flexDirection="column"
      {...(plain
        ? { hover: PLAIN_HOVER }
        : { borderStyle: open ? 'double' : 'round', borderColor: open || lean ? THEME.ink : THEME.line, paddingX: PRESS.padX, hover: { borderColor: THEME.accent } })}
      width={wide}
      position="relative"
    >
      <Box key={`${id}-row`} flexDirection="row" justifyContent="space-between">
        {button}
        {cell !== '' && (
          <Text key={`${id}-value`} color={open ? THEME.ink : THEME.dim} bold={open} wrap="truncate-end">
            {cell}
          </Text>
        )}
      </Box>
      {more.map((line, at) => (
        <Text key={`${id}-more-${at}`} color={THEME.dim} wrap="truncate-end">
          {fitted(line, inner)}
        </Text>
      ))}
      {Client !== undefined && (
        <Box key={`${id}-over`} position="absolute" top={0} left={0} width={wide}>
          <Client key={`${id}-region`} module="../item.tsx" props={{ w: wide, h: high, tip: '', tipAbove: false, tipShift: 0, press: REGION + id }} />
        </Box>
      )}
    </Box>
  )
}

export type PressPagerProps = {
  ui: Ui
  // The name of the list: the keys of the boxes and the page's place in the pane's memory.
  list: string
  page: Page
  // The cells inside the card and the pane's columns; the page's words stand between the boxes where all three fit one line.
  inner: number
  columns?: number
  onPage: (page: number) => void
}

// Nothing when the list is one page; else one row of boxes: `‹ Previous` at the left (not on the first page), the page's words dim
// between them where they fit (`page 2 of 3`, else `2/3`), `Next ›` at the right (not on the last page). The rows are those of pressPagerRows.
export function pressPagerView({ ui, list, page, inner, columns, onPage }: PressPagerProps) {
  const { Box, Text } = ui
  if (page.pages <= 1) return []
  // "page 2 of 3" where it fits between the boxes on their one line, else "2/3" where that fits, else none
  const words = [pageWords(page), `${page.page + 1}/${page.pages}`].find(each => pressLinesOf([...PAGER_BOXES, cellsOf(each)], inner, besideOf(columns)) === 1) ?? ''
  return [
    <Box key={`${list}-pager`} flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" columnGap={besideOf(columns)} rowGap={PRESS.between}>
      {page.page > 0 && pressBox({ ui, id: `${list}-earlier`, label: PREVIOUS, onPress: () => onPage(page.page - 1) })}
      {words !== '' && (
        <Text key={`${list}-page`} color={THEME.dim}>
          {words}
        </Text>
      )}
      {page.after > 0 && pressBox({ ui, id: `${list}-more`, label: NEXT, onPress: () => onPage(page.page + 1) })}
    </Box>,
  ]
}
