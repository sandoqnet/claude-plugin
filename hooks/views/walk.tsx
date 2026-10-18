// THE WALK TAB OF A LETTER (order W2): a letter opened from the desk has two tabs under its head, Text (the default, the letter as it was) and Walk.
// Walk draws the card's walk as rows, in the order of the file, one row a block (walkRows of model/walkrows.ts): the weight as the file says it,
// the form, the seat that wrote it, and under them the words of the block and the fields that matter for its cho. The card's own text folds under
// the first row: the row shows its first line, and a press opens it whole. A press on a row opens it in place, every field as written and its
// quote; one row is open at a time and a second press shuts it. NOTHING SCROLLS (order P1): the rows page inside their card, four a page at the
// most and fewer where the card has fewer rows, with the pager of the desk's lists; the fields of an open row that do not fit the card page inside
// it. A walk that is not in the room, or has no block, says so in one plain line. The app draws a row as the one press box (views/press.tsx), the
// terminal as a Button of its first line with the dim lines under it (the terminal pages nothing). Pure draw: the pane gives the text of the walk,
// the open row, the rows the card may take and the pages it keeps. A row of the app is two lines at the most, its head and ONE dim line cut with
// an ellipsis at the card's edge (order P1b); the whole words are in the open row. It is a PLAIN press (order P1c): no frame, 2 rows a row with
// one row of air between two; the open row is told by its bold head and the word `open`, and its detail stands under it. Where the room app is there
// (order O2) a press on a row opens the walk in the app at that row and the row does not open in place: the pane gives the act, this draw is as it was.
import { walkRows } from '../model/walkrows.ts'
import type { WalkRow } from '../model/walkrows.ts'
import { namesOf, sizeOf, wrapRows } from './cells'
import { wrapped } from './desk'
import { LOOK } from './look'
import { CARD_ROWS } from './paged'
import { pageLines } from './pager'
import { pressBox, pressPagerRows, pressPagerView } from './press'
import { SPACE } from './space'
import { PRESS, THEME, cardProps, cellsOf, innerOf } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

export type LetterTab = 'text' | 'walk'
export const LETTER_TABS: { key: LetterTab; label: string }[] = [
  { key: 'text', label: 'Text' },
  { key: 'walk', label: 'Walk' },
]
export const NO_WALK = 'The walk of this letter is not in the room.'
export const EMPTY_WALK = 'This walk holds no block.'
// The names of the lists of the walk in the pane's memory of pages, and the rows a page holds at the most.
export const WALK_LIST = 'walk'
export const WALK_OPEN = 'walk-open'
export const WALK_PER_PAGE = 4

// The key of a row: its id, else its place in the file (a block with no id).
export const walkKeyOf = (row: WalkRow, index: number): string => (row.id === '' ? `#${index}` : row.id)

// The first line of the row: the weight, the form and the writer.
export const walkHeadOf = (row: WalkRow): string => `${row.weight}  ${row.form}  ${row.writer}`

// What a field that matters says: the choices of an ask as they are, any other as its key and its value.
const matterOf = ([key, value]: [string, string]): string => (key === 'choices' ? value : `${key} ${value}`)

// The words under the first line: the block's words and its matters on one run, each part after a dot (the card's first line for the source),
// cut into lines of `cells` at a space.
export function walkDimOf(row: WalkRow, cells: number): string[] {
  const first = row.cho === 'source' ? (row.body.split('\n').find(line => line.trim() !== '') ?? '').trim() : row.words
  const run = [first, ...row.matters.map(matterOf)].filter(part => part !== '').join(' · ')
  return run === '' ? [] : wrapped(run, Math.max(1, cells))
}

export type LetterTabsProps = {
  ui: Ui
  app: boolean
  tab: LetterTab
  actions: { tab: (tab: LetterTab) => void }
  // What stands at the right end of the tabs' row (order O1): the press that opens the letter in the room app, or none.
  extra?: any[]
}

// The two tabs under the head of the letter: plain Buttons, the shown one with a rule under it (a state is never colour alone) in the app, and
// the shown one primary in the terminal. With `extra` the row holds it at its right end, on the row of the tab buttons and in the rows the rule
// of the tabs already takes, so the press costs the page no row (a row that came with it would push a letter that stood in a tight pane into
// "This place needs N rows"); where the two do not fit one line the press takes the next.
export function letterTabs({ ui, app, tab, actions, extra = [] }: LetterTabsProps) {
  const { Box, Text, Button } = ui
  if (!app) {
    return [
      <Box key="letter-tabs" flexDirection="row" {...(extra.length === 0 ? {} : { flexWrap: 'wrap' })} columnGap={SPACE.near}>
        {LETTER_TABS.map(item => (
          <Button key={`tab-${item.key}`} label={item.label} variant={item.key === tab ? 'primary' : 'secondary'} onPress={() => actions.tab(item.key)} />
        ))}
        {extra}
      </Box>,
    ]
  }
  const tabs = LETTER_TABS.map(item => (
    <Box key={`tab-${item.key}`} flexDirection="column" alignItems="center">
      <Button key={`tab-button-${item.key}`} plain label={item.label} {...(item.key === tab ? {} : { dimColor: true })} onPress={() => actions.tab(item.key)} />
      <Text key={`tab-rule-${item.key}`}>{item.key === tab ? '─'.repeat(cellsOf(item.label)) : ' '}</Text>
    </Box>
  ))
  if (extra.length === 0) {
    return [
      <Box key="letter-tabs" flexDirection="row" columnGap={SPACE.control}>
        {tabs}
      </Box>,
    ]
  }
  return [
    <Box key="letter-tabs" flexDirection="row" flexWrap="wrap" alignItems="flex-start" justifyContent="space-between" columnGap={SPACE.control}>
      <Box key="letter-tabs-pair" flexDirection="row" columnGap={SPACE.control}>
        {tabs}
      </Box>
      {extra}
    </Box>,
  ]
}

// THE OPEN IN THE ROOM APP of a letter (orders O1, O2): one plain press at the right end of the tabs of the letter (its Text and its Walk), "Open in the
// room app ›"; once the verb ended 0 the same press says "Opened in the room app ›", a quiet word that takes no row of its own. The press is as
// wide as the wider of its two words, and no wider than the card.
export const OPEN_APP = 'Open in the room app'
export const OPENED_APP = 'Opened in the room app'
export type OpenInAppProps = { ui: Ui; plan: Plan; columns: number; opened: boolean; onPress: () => void | Promise<void> }
export function openInAppView({ ui, plan, columns, opened, onPress }: OpenInAppProps) {
  const inner = innerOf(plan.width, columns)
  const wide = cellsOf(`${OPENED_APP}${' '.repeat(PRESS.apart)}›`)
  return pressBox({ ui, id: 'letter-open-app', label: opened ? OPENED_APP : OPEN_APP, width: Math.min(inner, wide), plain: true, arrow: true, onPress })
}

export type WalkViewProps = {
  ui: Ui
  plan: Plan
  columns: number
  app: boolean
  // The text of the walk file of the card, or none when the room holds no such walk.
  text: string | undefined
  // The key of the row that is open ('' for none).
  open: string
  actions: { row: (key: string) => void }
  // The rows the card of the walk may take (order P1) and the pages the pane keeps, by the name of the list, with the act that turns one. With no
  // rows the card is as high as its rows.
  room?: number
  pages?: Record<string, number>
  onPage?: (list: string, page: number) => void
}

export function walkView({ ui, plan, columns, app, text, open, actions, room, pages = {}, onPage }: WalkViewProps) {
  const { Box, Text, Button } = ui
  const dim = app ? THEME.dim : LOOK.quiet
  const inner = innerOf(plan.width, columns)
  const names = namesOf(ui as any)
  const rows = text === undefined ? [] : walkRows(text).rows
  const line = (key: string, words: string) => (
    <Text key={key} color={dim} wrap="wrap">
      {words}
    </Text>
  )

  // The fields of an open row, every one as written, then its quote; the source row holds the card's text whole.
  const wholeDetail = (row: WalkRow, key: string) => (
    <Box key={`walk-open-${key}`} flexDirection="column" paddingX={SPACE.control}>
      {row.cho === 'source' && row.body !== '' && (
        <Text key={`walk-body-${key}`} wrap="wrap">
          {row.body}
        </Text>
      )}
      {app && row.cho !== 'source' && row.words !== '' && (
        <Text key={`walk-words-${key}`} wrap="wrap">
          {row.words}
        </Text>
      )}
      {row.fields
        .filter(([name]) => name !== 'quote')
        .map(([name, value], at) => line(`walk-field-${key}-${at}`, `${name}: ${value}`))}
      {row.quote !== '' && (
        <Text key={`walk-quote-${key}`} wrap="wrap">
          {`“${row.quote}”`}
        </Text>
      )}
    </Box>
  )

  // The same words cut into rows of the card and paged inside it where they pass `left` rows: the page asked, and the pager of the words under it.
  const pagedDetail = (row: WalkRow, key: string, left: number) => {
    const whole = wholeDetail(row, key)
    if (sizeOf(whole, inner, names).h <= left) return whole
    const cells = Math.max(1, inner - 2 * SPACE.control)
    const rowsOf = (words: string) => wrapRows(words, cells).map(each => (each === '' ? ' ' : each))
    const lines: { words: string; field: boolean; quote: boolean }[] = [
      ...(row.cho === 'source' && row.body !== '' ? row.body.split('\n').flatMap(rowsOf).map(words => ({ words, field: false, quote: false })) : []),
      ...(row.cho !== 'source' && row.words !== '' ? rowsOf(row.words).map(words => ({ words, field: false, quote: false })) : []),
      ...row.fields.filter(([name]) => name !== 'quote').flatMap(([name, value]) => rowsOf(`${name}: ${value}`).map(words => ({ words, field: true, quote: false }))),
      ...(row.quote !== '' ? rowsOf(`“${row.quote}”`).map(words => ({ words, field: false, quote: true })) : []),
    ]
    const shown = pageLines({ ui, list: WALK_OPEN, lines: lines.map(each => each.words), room: left, gap: SPACE.line, wanted: pages[WALK_OPEN] ?? 0, inner: cells, onPage: next => onPage?.(WALK_OPEN, next) })
    return (
      <Box key={`walk-open-${key}`} flexDirection="column" paddingX={SPACE.control} gap={SPACE.line}>
        <Box key={`walk-lines-${key}`} flexDirection="column">
          {lines.slice(shown.page.from, shown.page.to).map((each, at) =>
            each.field ? (
              line(`walk-field-${key}-${shown.page.from + at}`, each.words)
            ) : (
              <Text key={`walk-text-${key}-${shown.page.from + at}`} wrap="wrap">
                {each.words}
              </Text>
            ),
          )}
        </Box>
        {shown.pager}
      </Box>
    )
  }

  // A row, closed or open; `left` is the rows the page leaves an open row's fields (none: they are drawn whole).
  const slotOf = (row: WalkRow, index: number, isOpen: boolean, left?: number) => {
    const key = walkKeyOf(row, index)
    const press = () => actions.row(key)
    if (!app) {
      return (
        <Box key={`walk-slot-${key}`} flexDirection="column">
          <Button key={`walk-row-${key}`} label={`${walkHeadOf(row)}${isOpen ? ' (open)' : ''}`} onPress={press} />
          {walkDimOf(row, Number.POSITIVE_INFINITY).map((words, at) => line(`walk-dim-${key}-${at}`, words))}
          {isOpen && wholeDetail(row, key)}
        </Box>
      )
    }
    return (
      <Box key={`walk-slot-${key}`} flexDirection="column">
        {pressBox({ ui, id: `walk-row-${key}`, label: walkHeadOf(row), width: inner, plain: true, value: '', open: isOpen, more: walkDimOf(row, Number.POSITIVE_INFINITY).slice(0, 1), onPress: press })}
        {isOpen && (left === undefined ? wholeDetail(row, key) : pagedDetail(row, key, left))}
      </Box>
    )
  }

  const said = text === undefined ? NO_WALK : rows.length === 0 ? EMPTY_WALK : ''
  const sum = (heights: number[]) => heights.reduce((total, high, at) => total + high + (at > 0 ? PRESS.between : 0), 0)
  let shown = rows.map((row, at) => ({ row, at }))
  let pager: any[] = []
  let left: number | undefined
  if (app && said === '' && room !== undefined) {
    const heightOf = (row: WalkRow, at: number, isOpen: boolean) => sizeOf(slotOf(row, at, isOpen), inner, names).h
    const closed = rows.map((row, at) => heightOf(row, at, false))
    const standing = rows.map((row, at) => heightOf(row, at, walkKeyOf(row, at) === open))
    if (sum(standing) > room - CARD_ROWS) {
      // Does not fit: the rows page by four, or by the rows the card has, with the pager of the desk's lists under them.
      const budget = room - CARD_ROWS - pressPagerRows(inner, columns)
      const slices: [number, number][] = []
      for (let from = 0; from < rows.length; ) {
        let to = from + 1
        while (to < rows.length && to - from < WALK_PER_PAGE && sum(closed.slice(from, to + 1)) <= budget) to += 1
        slices.push([from, to])
        from = to
      }
      const asked = Math.min(Math.max(0, Math.floor(pages[WALK_LIST] ?? 0)), slices.length - 1)
      const [from, to] = slices[asked]
      shown = shown.slice(from, to)
      // one page holds every row closed: its card is as it was, and no pager takes rows
      const more = slices.length > 1
      pager = more ? pressPagerView({ ui, list: WALK_LIST, page: { from, to, page: asked, pages: slices.length, after: rows.length - to }, inner, columns, onPage: next => onPage?.(WALK_LIST, next) }) : []
      left = (more ? budget : room - CARD_ROWS) - sum(closed.slice(from, to))
    }
  }
  const list = (
    <Box key="walk-rows" flexDirection="column" gap={PRESS.between}>
      {said === '' ? shown.map(({ row, at }) => slotOf(row, at, walkKeyOf(row, at) === open, left)) : line('walk-none', said)}
    </Box>
  )
  if (!app) return [list]
  return [
    <Box key="walk-card" {...cardProps(plan.width, columns)}>
      {list}
      {pager}
    </Box>,
  ]
}
