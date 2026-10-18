import { gateOf } from '../model/gate'
import { pageAt, pageBy } from '../model/pages'
import type { Page as Lines } from '../model/pages'
import { momentLine, profileOf, shelfOf } from '../model/profile'
import type { Row, WalkText } from '../model/profile'
import { buildItem, itemLines } from '../model/shelf'
import type { CatalogEntry } from '../model/shelf'
import { FILES_NONE, GROUP_LINES, SEATS_READ_MOST, clockOf, entriesOf, isNewFile, linePages, sizeWords, whenShort } from '../model/shelffiles'
import type { Entry, SeatCount, ShelfFile, ShelfFilesRead } from '../model/shelffiles'
import type { PlaceRule, ShelfItem, ShelfPlace } from '../model/shelfplace'
import { standingRules } from '../model/shelfplace'
import { pageOf, planksOf, recordOf, seatPlanksOf } from '../model/shelfreads'
import type { Plank, PlankItem, SeatShelf, Whose } from '../model/shelfreads'
import { gateView } from './gate'
import type { GateActions } from './gate'
import { isApp } from './glass'
import { LOOK } from './look'
import { listRowWidth, pressBox, pressHigh, pressPagerRows, pressPagerView, pressWidth } from './press'
import { cardsWord } from './profile'
import { SPACE } from './space'
import { PRESS, THEME, besideOf, cardProps, cellsOf, fitted, innerOf } from './theme'
import type { Plan } from './theme'
import type { Face, ShelfProps, Ui } from './types'

// The shelf, in place of the feed, with no frame: the quiet title, the switch between the kinds and the
// time (the shown one is the primary Button: the kit's Button has no underline), a quiet count line, and one
// row a record. A row is its Button with the name, the line that tells two of a name apart and the cards
// it has (quiet), and an arrow in the accent; the open record's row starts with an accent mark. By kind, a
// quiet label line a kind with its count and an empty line before it. A row's key is its place in the
// catalog, so a record keeps its key in either grouping. The back Button is the pane's, not this view's.
// Returns the elements to sit among the children of the view that holds it. `now` is the time the ages
// are said against, Date.now() when none.
export function shelfView({ ui, entries, walks, by, openId, now = Date.now(), actions }: ShelfProps) {
  const { Box, Text, Button } = ui
  const view = shelfOf(entries, walks, now)
  const rowView = (row: Row) => {
    const place = entries.findIndex(entry => entry.id === row.id)
    return (
      <Box key={`shelf-row-${place}`} flexDirection="row">
        {row.id === openId && <Text color={LOOK.accent}>▸ </Text>}
        <Button
          key={`item-${place}`}
          label={row.name}
          onPress={() => {
            void actions.open({ view: 'profile', recordId: row.id })
          }}
        />
        <Text color={LOOK.quiet}>{` · ${row.line} · ${cardsWord(row.cards)}`}</Text>
        <Text color={LOOK.accent}> ›</Text>
      </Box>
    )
  }
  return [
    <Text key="shelf-title" color={LOOK.quiet}>your shelf</Text>,
    (['kind', 'time'] as const).map(name => (
      <Button
        key={`shelf-by-${name}`}
        label={`by ${name}`}
        variant={by === name ? 'primary' : 'secondary'}
        onPress={() => {
          void actions.open({ view: 'shelf', by: name })
        }}
      />
    )),
    <Text key="shelf-count" color={LOOK.quiet}>{`${view.total} records · ${view.newToday} new today`}</Text>,
    entries.length === 0 && <Text key="shelf-none" color={LOOK.quiet}>Nothing yet.</Text>,
    by === 'kind' &&
      view.sections.map(section => [
        <Text key={`section-gap-${section.chi}`}> </Text>,
        <Text key={`section-${section.chi}`} color={LOOK.quiet}>{`${section.title} (${section.rows.length})`}</Text>,
        section.rows.map(rowView),
      ]),
    by === 'time' && [<Text key="shelf-gap"> </Text>, view.byTime.map(rowView)],
  ]
}

// ---- the shelf place (order B-P4)

// How many items of the shelf the place lists before "N more ›".
export const SHELF_SHOWN = 3

export type ShelfPlaceActions = Pick<GateActions, 'tap' | 'tapDraft'> & {
  // A decision's row opens its card.
  open: (cardId: string) => void | Promise<void>
  // A rule opens to change or remove.
  openRule: (ruleId: string) => void | Promise<void>
  // "Add a rule ›". The pane wires it to the composer or an Input.
  addRule: () => void | Promise<void>
  // An item opens its profile.
  openItem: (id: string) => void | Promise<void>
  // "N more ›" opens the rest of the items; none lists them all.
  more?: () => void | Promise<void>
}

export type ShelfPlaceProps = {
  ui: Ui
  // The host's surface: an app draws the shelf as one card on the theme's ground, anything else the terminal's column.
  surface?: string
  place: ShelfPlace
  // The walks of the run folder: the gate of each ask that waits is read from its card.
  walks: WalkText[]
  // The rest of the items has been opened.
  showAll?: boolean
  actions: ShelfPlaceActions
  // The layout of the column (order D1) and the pane's columns: the card of the app draws to the plan's width, its side padding
  // set by the columns. With none the card is as wide as its place.
  plan?: Plan
  columns?: number
  // Whether the gate of a wait holds the hotkey 1 on its lean pick (gate.tsx): the shelf is no Letters, so the pane gives none there.
  leanKey?: boolean
  // The small terminal (views/frame.tsx terminalSize): the head rows of the sections and "Add a rule" go (Settings holds the rules' own card), so the
  // rows of the place are its waits, its rules, its answers and its items, and they page under the pager from the first.
  small?: boolean
}

// "what · how" of an item: the parts the walk holds.
const kindLine = (item: ShelfItem): string => [item.what, item.how].filter(part => part !== '').join(' · ')

// The width of the name column of the shelf rows: every item's name starts the row, what and how come after it. It
// is 16 so that a row such as "a dependency · you and lab-seat" fits the 56 cells of the card; a "what · how" that is
// still too long shrinks, cut with an ellipsis, so that "when" stays at the right.
const NAME_COLUMN = 16

// Who answered by a rule, at the right of its row: "the keeper, 4 today" when the keeper made them all, else the
// count first and then who, when he answered: "1 today, landed by you". "0 today" alone when none.
const ruleWho = (rule: PlaceRule): string =>
  rule.by === '' ? `${rule.today} today` : rule.by === 'the keeper' ? `the keeper, ${rule.today} today` : `${rule.today} today, landed by ${rule.by}`

// The shelf as the place, a face: the room's state as props, its Box back. Four sections, each a
// bold title and its count dim. Waits for you: the gate of each ask that waits, of any day (gateView, the same
// as on the card, answered here, without its own "Waits for you": the title says it), none draws the title and
// 0 alone. Your rules: each rule that stands in its words,
// a plain Button with an arrow that opens it, who answered by it today at the right ("the keeper, 4
// today", "1 today, landed by you"), then "Add a rule ›". Answered today: a row a decision in the order they came, the words as a plain
// Button with an arrow that opens its card, who answered at the right. On your shelf: the first three items, the
// name as a plain Button with an arrow in a column of a fixed width (16), then "what · how" dim, which
// shrinks when the row is full, and when at the right, then "N more ›".
// In an app (desktop, vscode, mobile) it is one card on the theme's ground (views/theme.ts), its words in the theme's keys
// and every Button its label alone, cut at its end when it does not fit its row (a Button does not wrap); in
// the terminal the same sections are a column in the theme keys with string-labeled Buttons, no hover and no hex.
// The CLI host cannot draw the app branch. A part the room does not hold is left out of its row. Returns the
// elements to sit among the children of the view that holds it.
export function shelfPlaceView({ ui, surface, place, walks, showAll = false, actions, plan, columns, leanKey = true, small = false }: ShelfPlaceProps) {
  const { Box, Text, Button } = ui
  const app = isApp(surface)
  const bare = small && !app
  const dim = app ? THEME.dim : LOOK.quiet
  const ink = {}
  const width = plan?.width
  const inner = innerOf(width, columns)
  // A row of the app wraps when its parts do not fit the card: the second part goes under the first.
  const wrapRow = app ? ({ flexWrap: 'wrap', rowGap: SPACE.line } as const) : {}
  // The items past the first three: none when all are shown, because the rest was opened or has no action.
  const rest = (count: number) => (actions.more === undefined || showAll ? 0 : Math.max(0, count - SHELF_SHOWN))

  const head = (id: string, title: string, count: number) => (
    <Box key={`place-head-${id}`} flexDirection="row" columnGap={1}>
      <Text bold {...ink}>
        {title}
      </Text>
      <Text color={dim}>{String(count)}</Text>
    </Box>
  )
  const row = (key: string, left: any, right: string) => (
    <Box key={key} flexDirection="row" justifyContent="space-between" columnGap={2} {...wrapRow}>
      {left}
      {right !== '' && (
        <Box key={`${key}-right`} flexShrink={0}>
          <Text color={dim}>{right}</Text>
        </Box>
      )}
    </Box>
  )
  // A Button of words with an arrow after them: its label alone in an app, cut by cells to `room` (the card's inner width, or
  // the name's column) when it is longer; the row wraps, so the part at its right goes under it and the label keeps the row. A
  // string label in the terminal.
  const goes = (key: string, words: string, onPress: () => void, room = inner) =>
    app ? <Button key={key} plain label={fitted(`${words} ›`, room)} onPress={onPress} /> : <Button key={key} label={`${words} ›`} onPress={onPress} />

  const waits = place.waits.flatMap(wait => {
    const gate = gateOf(walks.find(walk => walk.id === wait.cardId)?.text ?? '', wait.askId)
    if (gate === undefined) return []
    return gateView({ ui, surface, cardId: wait.cardId, gate, bare: true, leanKey, actions: { tap: actions.tap, tapDraft: actions.tapDraft } })
  })
  const rules = place.rules.map(rule =>
    row(
      `place-rule-${rule.id}`,
      goes(`place-rule-open-${rule.id}`, rule.words, () => {
        void actions.openRule(rule.id)
      }),
      ruleWho(rule),
    ),
  )
  const answered = place.answered.map((item, i) =>
    row(
      `place-answered-${i}`,
      goes(`place-answered-open-${i}`, item.words, () => {
        void actions.open(item.cardId)
      }),
      item.who,
    ),
  )
  const shown = showAll || actions.more === undefined ? place.shelf : place.shelf.slice(0, SHELF_SHOWN)
  const items = shown.map((item, i) =>
    row(
      `place-item-${i}`,
      <Box key={`place-item-left-${i}`} flexDirection="row" columnGap={2} flexShrink={1} {...wrapRow}>
        <Box key={`place-item-name-${i}`} width={NAME_COLUMN} flexShrink={0}>
          {goes(
            `place-item-open-${i}`,
            item.name,
            () => {
              void actions.openItem(item.id)
            },
            NAME_COLUMN,
          )}
        </Box>
        {kindLine(item) !== '' && (
          <Text color={dim} wrap="truncate-end">
            {kindLine(item)}
          </Text>
        )}
      </Box>,
      item.when,
    ),
  )
  const more = rest(place.shelf.length)
  const moreButton =
    more > 0 &&
    (app ? (
      <Button
        key="place-more"
        plain
        label={`${more} more ›`}
        onPress={() => {
          void actions.more?.()
        }}
      />
    ) : (
      <Button
        key="place-more"
        label={`${more} more ›`}
        onPress={() => {
          void actions.more?.()
        }}
      />
    ))
  const addRule = (
    <Button
      key="place-add-rule"
      {...(app ? { plain: true } : {})}
      label={app ? 'Add a rule ›' : 'Add a rule'}
      onPress={() => {
        void actions.addRule()
      }}
    />
  )
  const section = (id: string, title: string, count: number, children: any[]) => (
    <Box key={`place-${id}`} flexDirection="column">
      {!bare && head(id, title, count)}
      {children}
    </Box>
  )
  return [
    <Box key="shelf-place" {...(app ? cardProps(width, columns) : { flexDirection: 'column', gap: bare ? 0 : 1 })}>
      {section('waits', 'Waits for you', place.waits.length, waits)}
      {section('rules', 'Your rules', place.rules.length, bare ? rules : [...rules, addRule])}
      {section('answered', 'Answered today', place.answered.length, answered)}
      {section('shelf', 'On your shelf', place.shelf.length, [...items, moreButton])}
    </Box>,
  ]
}

// ---- the room's own shelf in the app (order P7, C2)
// The place is ONE card: the counted line, then the planks of the shelf (People, Things, Places, Media, Rules: model/shelfreads.ts),
// each a head (its name bold and its count dim) and its items as press boxes (views/press.tsx), and the record of an item in the same
// card. NOTHING SCROLLS: the canvas leaves `canvasRows`, and every count of rows and of items a page is one rule here (layoutOf over
// pageAt), never a number of its own. Where the rows lack, the planks page under the counted line, one plank or more a page, and a
// plank taller than a page pages its own items by its pager at its right end, lines of items a page. The Rules plank holds `Add a
// rule` as its last box on every page of it. Rules are the room's alone.

// The rows of the card round its parts: its edge and its padding above and below. The counted line is one row.
const CARD_ROWS = 2 * (1 + SPACE.line)
const COUNTED_ROWS = 1

// The rows of the canvas as a number, none when the host did not tell its height.
const finiteRows = (rows?: number): number | undefined => (rows === undefined || !Number.isFinite(rows) ? undefined : rows)

// The row between two parts of the card: kept from the rows of PRESS.shelfGap, never taken where it is what fits (a short pane keeps
// every row for the items).
export const gapOf = (rows?: number): number => (rows === undefined || rows >= PRESS.shelfGap ? PRESS.between : 0)

// An item stands as a tile over its box from `shelfTile` rows of the canvas; under it, as its box alone. The rows of the canvas alone say
// it (never the items), so the look does not change as the shelf grows.
export const tileStands = (rows?: number): boolean => rows === undefined || rows >= PRESS.shelfTile

// The rows of a line of items: the box of two lines under its tile (as high as the box), or the box alone of one line.
const lineRowsOf = (tile: boolean): number => (tile ? 2 * pressHigh(2) : pressHigh(1))

// The items of a line in a row `inner` cells wide: the boxes at their least width and the cells between two, one at least.
export const itemsAcross = (inner: number, columns?: number): number => {
  const beside = besideOf(columns)
  return Math.max(1, Math.floor((inner + beside) / (PRESS.shelfItem + beside)))
}

// A part of the card with a head row, its lines (each a height in rows) and a tail kept under them on every page of its lines.
export type Block = { id: string; lines: number[]; lineGap: number; tail: number }
export type Layout = { blocks: Lines; placed: Lines[] }

// The rows of a block whole: the head, the lines and the tail, a `lineGap` between two.
export function blockRows({ lines, lineGap, tail }: Block): number {
  const parts = [1, ...lines, ...(tail > 0 ? [tail] : [])]
  return parts.reduce((sum, rows) => sum + rows, 0) + lineGap * (parts.length - 1)
}

// The lines of a block that stand in `room` rows, the page asked: what the head, the tail and the pager leave. The pager's rows are those
// of pressPagerRows, counted the same as for any list.
function linesPageOf(block: Block, room: number, wanted: number, inner: number, columns?: number): Lines {
  const spare = room - 1 - block.lineGap - (block.tail > 0 ? block.lineGap + block.tail : 0)
  return pageAt(block.lines, spare, wanted, block.lineGap, pressPagerRows(inner, columns))
}

// The blocks that stand in `budget` rows, `gap` between two: the page of blocks asked (`memory[name]`), and for each block of it the page
// of its lines (`memory[name-ID]`). A page of several blocks holds each whole; a block that stands alone on a page and is taller than it
// pages its own lines, in the rows the pager of the blocks leaves it.
export function layoutOf(blocks: Block[], budget: number, gap: number, name: string, memory: Record<string, number>, inner: number, columns?: number): Layout {
  const pager = pressPagerRows(inner, columns)
  const page = pageAt(blocks.map(blockRows), budget, memory[name] ?? 0, gap, pager)
  const only = page.to - page.from === 1
  const room = only ? (page.pages > 1 ? budget - pager : budget) : Number.POSITIVE_INFINITY
  return { blocks: page, placed: blocks.slice(page.from, page.to).map(block => linesPageOf(block, room, memory[`${name}-${block.id}`] ?? 0, inner, columns)) }
}

type PagerProps = { ui: Ui; list: string; page: Lines; inner: number; columns?: number; onPage: (list: string, page: number) => void }

// The pager of a list at its right end: nothing when the list is one page.
const pagerView = ({ ui, list, page, inner, columns, onPage }: PagerProps) => {
  const { Box } = ui
  const boxes = pressPagerView({ ui, list, page, inner, columns, onPage: at => onPage(list, at) })
  return boxes.length === 0 ? [] : [<Box key={`${list}-end`} flexDirection="row" justifyContent="flex-end">{boxes}</Box>]
}

// `note` is the words dim after the title in place of the count.
type BlockViewProps = PagerProps & { id: string; title: string; count: number; gap: number; lines: any[]; tail?: any; note?: string }

// A block: its head, its lines, its tail, its pager at the right end of it.
function blockView({ ui, id, title, count, gap, lines, tail, note, ...pager }: BlockViewProps) {
  const { Box, Text } = ui
  const dim = note ?? String(count)
  return (
    <Box key={`shelf-${id}`} flexDirection="column" gap={gap}>
      <Box key={`shelf-${id}-head`} flexDirection="row" columnGap={SPACE.near}>
        <Text bold>{title}</Text>
        {dim !== '' && <Text color={THEME.dim}>{dim}</Text>}
      </Box>
      {lines}
      {tail}
      {pagerView({ ui, ...pager })}
    </Box>
  )
}

const things = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`

export type ShelfRoomActions = {
  // An item of a plank opens its record; a rule that stands opens to change or remove; "Add a rule" opens the composer.
  openItem: (id: string) => void | Promise<void>
  openRule: (id: string) => void | Promise<void>
  addRule: () => void | Promise<void>
  page: (list: string, page: number) => void
  // A box of the whose row shows that shelf (the room's own is named by `room`'s `own`); a told row or a theme opens the card it names.
  openShelf?: (name: string, own: boolean) => void | Promise<void>
  openCard?: (cardId: string) => void | Promise<void>
  // A file of a seat opens in the room app; "N more" of a seat lists its files there, "N more seats" every seat's (order shelf-files).
  openFile?: (seat: string, file: string) => void | Promise<void>
  openFiles?: (seat?: string) => void | Promise<void>
}

export type ShelfRoomProps = {
  ui: Ui
  plan: Plan
  columns: number
  entries: CatalogEntry[]
  walks: WalkText[]
  // The text of rules.md of the room shelf, and the ids of the rules taken off by "Ask me next time" (which leave the plank at once).
  rulesText: string
  takenOff?: string[]
  now: number
  zone?: number
  // The rows the canvas leaves for the card; none is no limit. The page each list stands on, by the list's name.
  canvasRows?: number
  pages?: Record<string, number>
  // Whose shelves stand (model/shelfreads.ts whoseOf), and the shelf shown: the seat's name, none is the room's own. The whose row is drawn
  // only where two or more stand. A seat's shelf is `seat` (its catalog in `entries`, its told rows and themes); it has no Rules plank.
  whose?: Whose[]
  of?: string
  seat?: SeatShelf
  // The files of the shelf as the CLI lists them (order shelf-files): none, or not read yet, draws no Files part.
  files?: ShelfFilesRead
  actions: ShelfRoomActions
}

const lowerOf = (name: string): string => name.toLowerCase()

// The plank that is a plain list of boxes a line, whatever the rows: the rules. The others are the items of a shelf, a tile over a box where
// the rows allow.
const LISTED = new Set<string>(['Rules'])

// The boxes of a row packed into lines of `inner` cells with `beside` between two, as pressLinesOf counts them: the indexes of each line.
export function packLines(widths: number[], inner: number, beside: number): number[][] {
  const lines: number[][] = []
  let used = 0
  widths.forEach((each, at) => {
    const width = Math.min(each, inner)
    if (lines.length > 0 && used > 0 && used + beside + width <= inner) {
      lines[lines.length - 1].push(at)
      used += beside + width
    } else {
      lines.push([at])
      used = width
    }
  })
  return lines
}

// The word the shown shelf's box says in its value cell.
export const SHOWN_WORD = 'shown'

// ---- the files of the shelf (order shelf-files)
// A group of the room's shelf is the seat's head and GROUP_LINES lines, always, so the card never moves with the count of files.
const GROUP_ROWS = 1 + GROUP_LINES
// The foot of the Files part is one row; its head is the block's own.
const FOOT_ROWS = 1
// The bound of the lines of one seat's shelf when the host gave no rows.
const SEAT_LINES_MOST = 500

type Spread = { ui: Ui; key: string; left: any; right?: any }

// A row with its parts at the two ends: the left holds what presses, the right keeps its cells. Words at the right are dim.
const spread = ({ ui, key, left, right }: Spread) => {
  const { Box, Text } = ui
  return (
    <Box key={key} flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
      {left}
      {right !== undefined && right !== '' && (
        <Box key={`${key}-right`} flexShrink={0}>
          {typeof right === 'string' ? <Text color={THEME.dim}>{right}</Text> : right}
        </Box>
      )}
    </Box>
  )
}

// A seat's shelf (Frame B): the head with what it holds, then records and files in ONE list by date under the heads of the days, paged by whole pages
// under the pager of the pane where the lines pass the rows (a page that starts inside a day draws its head again), and a foot that sends the files
// past the list read to the room app. A record, a theme or a told row opens as it did on the planks; a file opens in the room app. The way to
// another seat's shelf is the room's shelf (its Shelves row), where the Back of the head goes.
type SeatViewProps = {
  ui: Ui
  plan: Plan
  columns: number
  of: string
  planks: Plank[]
  files?: ShelfFilesRead
  now: number
  zone: number
  canvasRows?: number
  // The name of the room's own shelf, where the Back of the head goes.
  own: string
  // The page each list stands on, by the list's name.
  pagesAsked: Record<string, number>
  actions: ShelfRoomActions
}

// The list of a seat's shelf, one for its lines (its page is kept like the planks', by the name).
const SEAT_LIST = 'shelf-lines'

function shelfSeatView({ ui, plan, columns, of, planks, files, now, zone, canvasRows, own, pagesAsked, actions }: SeatViewProps) {
  const { Box, Text, Button } = ui
  const rows = finiteRows(canvasRows)
  const gap = gapOf(rows)
  const row = listRowWidth(plan.width)
  const list = files?.read === true ? files.lists[of] : undefined
  const listed = list !== undefined && list.line === ''
  const note = files?.read === true ? (files.line !== '' ? files.line : (list?.line ?? '')) : ''
  const entries = entriesOf(planks, listed ? list.files : [])
  const records = planks.reduce((sum, plank) => sum + plank.count, 0)
  const total = listed ? list.total : 0
  // the card's edge and padding, the head and the foot, the row between its three parts, and the line that says why there are no files
  const fits = rows === undefined ? SEAT_LINES_MOST : Math.max(0, rows - CARD_ROWS - 2 - 2 * gap - (note === '' ? 0 : 1))
  // The lines page by whole pages under the pager of the pane when they pass the rows; the page asked is held to the pages there are.
  const { pages: byPage } = linePages(entries, fits, pressPagerRows(row, columns), now, zone)
  const page = pageBy(byPage.length, 1, pagesAsked[SEAT_LIST] ?? 0)
  const lines = byPage[page.from] ?? []
  // the files past the list the CLI gave: the room app has them, the pane does not
  const left = listed ? Math.max(0, total - list.files.length) : 0
  const counts = `${things(records, 'record')}${files?.read === true ? ` · ${things(total, 'file')}` : ''}`
  const lineView = (line: (typeof lines)[number], at: number) => {
    if ('head' in line) {
      return (
        <Box key={`seat-day-${page.page}-${at}`} flexDirection="row" columnGap={SPACE.near}>
          <Text bold>{line.head}</Text>
          <Text color={THEME.dim}>{String(line.count)}</Text>
        </Box>
      )
    }
    const entry: Entry = line.entry
    const isFile = entry.kind === 'file' || entry.kind === 'put'
    const right = entry.size === '' ? clockOf(entry.ms, zone) : `${entry.size}  ${clockOf(entry.ms, zone)}`
    const fresh = isFile && files !== undefined && isNewFile(files, entry.ms)
    const cells = Math.max(1, row - cellsOf(right) - SPACE.control - SPACE.near - cellsOf(entry.word) - (fresh ? 1 + SPACE.near : 0))
    const press = (): void => {
      if (isFile) void actions.openFile?.(of, entry.id)
      else if (entry.kind === 'record') void actions.openItem(entry.id)
      else if (entry.card !== '') void actions.openCard?.(entry.card)
    }
    return spread({
      ui,
      key: `seat-line-${entry.kind}-${entry.id}`,
      left: (
        <Box key={`seat-line-${entry.kind}-${entry.id}-left`} flexDirection="row" flexShrink={1} columnGap={SPACE.near}>
          {fresh && <Text color={THEME.dim}>●</Text>}
          <Button key={`seat-open-${entry.kind}-${entry.id}`} plain label={fitted(entry.name, cells)} onPress={press} />
          <Text color={entry.kind === 'record' ? THEME.accent : THEME.dim}>{entry.word}</Text>
        </Box>
      ),
      right,
    })
  }
  const moreWords = left === 0 ? '' : `${left} more ›`
  const foot = files?.read === true ? 'records open here, files in the room app' : 'records open here'
  return [
    <Box key="shelf-room" {...cardProps(plan.width, columns)} paddingX={PRESS.cardPad} gap={gap}>
      {spread({
        ui,
        key: 'seat-head',
        left: <Button key="seat-back" plain label={fitted(`‹ ${of}'s shelf`, Math.max(1, row - cellsOf(counts) - SPACE.control))} onPress={() => void actions.openShelf?.(own, true)} />,
        right: counts,
      })}
      <Box key="seat-list" flexDirection="column">
        {note !== '' && (
          <Text key="seat-note" color={THEME.dim} wrap="truncate-end">
            {fitted(note, row)}
          </Text>
        )}
        {entries.length === 0 && note === '' && (
          <Text key="seat-none" color={THEME.dim}>
            Nothing on this shelf yet.
          </Text>
        )}
        {lines.map(lineView)}
      </Box>
      {pagerView({ ui, list: SEAT_LIST, page, inner: row, columns, onPage: actions.page })}
      {spread({
        ui,
        key: 'seat-foot',
        left: <Text color={THEME.dim}>{fitted(foot, Math.max(1, row - cellsOf(moreWords) - SPACE.control))}</Text>,
        right: moreWords === '' ? '' : <Button key="seat-more-open" plain label={moreWords} onPress={() => void actions.openFiles?.(of)} />,
      })}
    </Box>,
  ]
}

// The shelf shown: the room's own, or a seat's. The counted line and the planks, as one card of the theme.
export function shelfRoomView({ ui, plan, columns, entries, walks, rulesText, takenOff = [], now, zone, canvasRows, pages = {}, whose = [], of = '', seat, files, actions }: ShelfRoomProps) {
  const { Box, Text, Button } = ui
  const rows = finiteRows(canvasRows)
  const gap = gapOf(rows)
  const tile = tileStands(rows)
  const row = listRowWidth(plan.width)
  const beside = besideOf(columns)
  const standing = new Set(standingRules(rulesText).map(rule => rule.id))
  const theirs = of === '' ? undefined : seat
  // A seat's shelf is Frame B: its records and its files in one list (shelfSeatView).
  if (theirs !== undefined) {
    return shelfSeatView({
      ui,
      plan,
      columns,
      of,
      planks: seatPlanksOf(theirs, { walks, now, ...(zone === undefined ? {} : { zone }) }),
      ...(files === undefined ? {} : { files }),
      now,
      zone: zone ?? 0,
      ...(canvasRows === undefined ? {} : { canvasRows }),
      own: whose.find(shelf => shelf.own)?.name ?? 'room',
      pagesAsked: pages,
      actions,
    })
  }
  const state = { walks, entries, rulesText, now, ...(zone === undefined ? {} : { zone }) }
  const planks: Plank[] = planksOf(state).map(plank =>
    plank.name === 'Rules' ? { ...plank, items: plank.items.filter(item => !takenOff.includes(item.id)), count: plank.items.filter(item => !takenOff.includes(item.id)).length } : plank,
  )
  const across = (plank: Plank): number => (LISTED.has(plank.name) ? 1 : itemsAcross(row, columns))
  const blocks: Block[] = planks.map(plank => {
    const lines = Math.ceil(plank.count / across(plank))
    return {
      id: lowerOf(plank.name),
      lines: Array.from({ length: lines }, () => (LISTED.has(plank.name) ? pressHigh(1) : lineRowsOf(tile))),
      lineGap: gap,
      tail: plank.name === 'Rules' ? pressHigh(1) : 0,
    }
  })
  // THE WHOSE ROW: the boxes of the shelves that stand, the shown one with the double edge and the word `shown`, the first block of the
  // planks (a block paged like any, so a short pane never passes its canvas): drawn only where two or more shelves stand.
  const shelves = whose.length >= 2
  const isShown = (shelf: Whose): boolean => shelf.own
  const widthOfShelf = (shelf: Whose): number => pressWidth(isShown(shelf) ? `${shelf.name} ${SHOWN_WORD}` : shelf.name)
  const whoseLines = shelves ? packLines(whose.map(widthOfShelf), row, beside) : []
  if (shelves) blocks.unshift({ id: 'whose', lines: whoseLines.map(() => pressHigh(1)), lineGap: gap, tail: 0 })
  const budget = rows === undefined ? Number.POSITIVE_INFINITY : rows - CARD_ROWS - COUNTED_ROWS - gap
  // THE FILES PART (order shelf-files, Frame A): the last block, after the planks. Where the CLI gave no list it is one dim line (an older sandoq, a
  // refusal, no file at all); else a group a seat, the seats' lists that were read, newest seat first, GROUP_ROWS rows each, as many as the rows of a
  // page hold (the pager's rows kept), and a foot. The rest of the seats is "N more seats" in the room app. None before the first read.
  const read = files !== undefined && files.read ? files : undefined
  const note = read === undefined ? '' : read.line !== '' ? read.line : read.seats.length === 0 ? FILES_NONE : ''
  const groups = read === undefined || note !== '' ? [] : read.seats.slice(0, SEATS_READ_MOST).filter(one => read.lists[one.seat] !== undefined)
  const groupsFit = Math.max(1, Math.min(groups.length, Math.floor((budget - pressPagerRows(row, columns) - 1 - FOOT_ROWS) / GROUP_ROWS)))
  const groupsShown = groups.slice(0, groupsFit)
  if (read !== undefined) blocks.push(note !== '' ? { id: 'files', lines: [1], lineGap: 0, tail: 0 } : { id: 'files', lines: groupsShown.map(() => GROUP_ROWS), lineGap: 0, tail: FOOT_ROWS })
  const layout = layoutOf(blocks, budget, gap, 'shelf', pages, row, columns)
  const wide = (n: number): number => Math.floor((row - beside * (n - 1)) / n)
  const itemView = (item: PlankItem, width: number) => {
    const open = () => actions.openItem(item.id)
    if (!tile) return pressBox({ ui, id: `item-${item.id}`, label: item.name, width, value: item.what, onPress: open })
    return (
      <Box key={`shelf-item-${item.id}`} flexDirection="column" width={width}>
        <Box key={`item-${item.id}-tile`} borderStyle="round" borderColor={THEME.line} width={width} justifyContent="center">
          <Text color={THEME.dim}>picture</Text>
        </Box>
        {pressBox({ ui, id: `item-${item.id}`, label: item.name, width, more: [[item.what, item.when].filter(part => part !== '').join(' · ')], onPress: open })}
      </Box>
    )
  }
  // The plank that is a list of boxes a line is the rules: a rule that stands opens to change or remove, any other opens its record.
  const listedView = (item: PlankItem) =>
    pressBox({
      ui,
      id: `rule-${item.id}`,
      label: item.name,
      width: row,
      ...(item.how === '' ? {} : { value: item.how }),
      arrow: true,
      onPress: () => (standing.has(item.id) ? actions.openRule(item.id) : actions.openItem(item.id)),
    })
  const whoseBlock = (at: number) => {
    const page = layout.placed[at]
    const line = (indexes: number[], number: number) => (
      <Box key={`shelf-whose-line-${number}`} flexDirection="row" columnGap={beside}>
        {indexes.map(index => {
          const shelf = whose[index]
          const here = isShown(shelf)
          return pressBox({
            ui,
            id: `whose-${shelf.name}`,
            label: shelf.name,
            width: widthOfShelf(shelf),
            ...(here ? { open: true, value: SHOWN_WORD, word: SHOWN_WORD } : {}),
            onPress: () => actions.openShelf?.(shelf.name, shelf.own),
          })
        })}
      </Box>
    )
    return blockView({
      ui,
      id: 'whose',
      title: 'Shelves',
      count: whose.length,
      gap,
      lines: whoseLines.slice(page.from, page.to).map((indexes, number) => line(indexes, page.from + number)),
      list: 'shelf-whose',
      page,
      inner: row,
      columns,
      onPage: actions.page,
    })
  }
  // A dashed line fills a group that has fewer files than GROUP_LINES.
  const dashes = (key: string) => (
    <Text key={key} color={THEME.dim}>
      {'┄'.repeat(Math.max(1, row))}
    </Text>
  )
  const fileLine = (seatName: string, file: ShelfFile) => {
    const right = `${sizeWords(file.length)}  ${whenShort(file.ms, now, zone ?? 0)}`
    const fresh = read !== undefined && isNewFile(read, file.ms)
    const put = file.kind === 'put'
    const cells = Math.max(1, row - cellsOf(right) - SPACE.control - (fresh ? 1 + SPACE.near : 0) - (put ? cellsOf('put') + SPACE.near : 0))
    return spread({
      ui,
      key: `file-${seatName}-${file.name}`,
      left: (
        <Box key={`file-${seatName}-${file.name}-left`} flexDirection="row" flexShrink={1} columnGap={SPACE.near}>
          {fresh && <Text color={THEME.dim}>●</Text>}
          <Button key={`file-open-${seatName}-${file.name}`} plain label={fitted(file.name, cells)} onPress={() => void actions.openFile?.(seatName, file.name)} />
          {put && <Text color={THEME.dim}>put</Text>}
        </Box>
      ),
      right,
    })
  }
  const groupView = (one: SeatCount) => {
    const list = read?.lists[one.seat]
    const files3 = list === undefined || list.line !== '' ? [] : list.files.slice(0, GROUP_LINES)
    const more = Math.max(0, one.count - GROUP_LINES)
    const count = things(one.count, 'file')
    const filled = Array.from({ length: GROUP_LINES }, (_, at) => {
      const file = files3[at]
      if (file !== undefined) return fileLine(one.seat, file)
      return at === 0 && list !== undefined && list.line !== '' ? (
        <Text key={`files-${one.seat}-line`} color={THEME.dim} wrap="truncate-end">
          {fitted(list.line, row)}
        </Text>
      ) : (
        dashes(`files-${one.seat}-dash-${at}`)
      )
    })
    return (
      <Box key={`files-${one.seat}`} flexDirection="column">
        {spread({
          ui,
          key: `files-${one.seat}-head`,
          left: (
            <Box key={`files-${one.seat}-name`} flexDirection="row" columnGap={SPACE.near}>
              <Button key={`files-open-${one.seat}`} plain label={fitted(one.seat, Math.max(1, row - cellsOf(count) - cellsOf(`${more} more ›`) - 2 * SPACE.control))} onPress={() => void actions.openShelf?.(one.seat, false)} />
              <Text color={THEME.dim}>{count}</Text>
            </Box>
          ),
          right: more === 0 ? '' : <Button key={`files-more-${one.seat}`} plain label={`${more} more ›`} onPress={() => void actions.openFiles?.(one.seat)} />,
        })}
        {filled}
      </Box>
    )
  }
  const filesBlock = (at: number) => {
    const page = layout.placed[at]
    const moreSeats = read === undefined ? 0 : Math.max(0, read.seats.length - groupsShown.length)
    const moreWords = moreSeats === 0 ? '' : `${moreSeats} more seats ›`
    const words = 'a file opens in the room app'
    return blockView({
      ui,
      id: 'files',
      title: 'Files',
      count: 0,
      note: note !== '' ? '' : `${things(read?.seats.length ?? 0, 'seat')}, newest first`,
      gap: 0,
      lines: note !== '' ? [<Text key="files-note" color={THEME.dim} wrap="truncate-end">{fitted(note, row)}</Text>] : groupsShown.slice(page.from, page.to).map(groupView),
      tail:
        note !== ''
          ? undefined
          : spread({
              ui,
              key: 'files-foot',
              left: <Text color={THEME.dim}>{fitted(words, Math.max(1, row - cellsOf(moreWords) - SPACE.control))}</Text>,
              right: moreWords === '' ? '' : <Button key="files-more-seats" plain label={moreWords} onPress={() => void actions.openFiles?.()} />,
            }),
      list: 'shelf-files',
      page,
      inner: row,
      columns,
      onPage: actions.page,
    })
  }
  const shown = blocks.slice(layout.blocks.from, layout.blocks.to).map((block, at) => {
    if (block.id === 'whose') return whoseBlock(at)
    if (block.id === 'files') return filesBlock(at)
    const plank = planks[layout.blocks.from + at - (shelves ? 1 : 0)]
    const page = layout.placed[at]
    const n = across(plank)
    const slice = pageOf(plank.items, page.from * n, (page.to - page.from) * n)
    const lines = LISTED.has(plank.name)
      ? slice.items.map(listedView)
      : Array.from({ length: page.to - page.from }, (_, line) => (
          <Box key={`shelf-line-${lowerOf(plank.name)}-${page.from + line}`} flexDirection="row" columnGap={beside}>
            {slice.items.slice(line * n, (line + 1) * n).map(item => itemView(item, wide(n)))}
          </Box>
        ))
    return blockView({
      ui,
      id: lowerOf(plank.name),
      title: plank.name,
      count: plank.count,
      gap,
      lines,
      tail: plank.name === 'Rules' ? pressBox({ ui, id: 'add-rule', label: 'Add a rule', width: row, arrow: true, onPress: () => actions.addRule() }) : undefined,
      list: `shelf-${lowerOf(plank.name)}`,
      page,
      inner: row,
      columns,
      onPage: actions.page,
    })
  })
  // The counted line names the things and the rules of the room's shelf.
  const kinds = planks.filter(plank => plank.name !== 'Rules').reduce((sum, plank) => sum + plank.count, 0)
  const rules = planks.find(plank => plank.name === 'Rules')?.count ?? 0
  const short = `${things(kinds, 'thing')}, ${things(rules, 'rule')}`
  const counted = `The room's shelf: ${short}`
  return [
    <Box key="shelf-room" {...cardProps(plan.width, columns)} paddingX={PRESS.cardPad} gap={gap}>
      <Text key="shelf-count" color={THEME.dim}>
        {fitted(counted, row, short)}
      </Text>
      {shown}
      {pagerView({ ui, list: 'shelf', page: layout.blocks, inner: row, columns, onPage: actions.page })}
    </Box>,
  ]
}

export type ShelfRecordActions = {
  // A connection opens its record; a reference opens its card; a pager turns a page.
  open: (recordId: string) => void | Promise<void>
  openCard: (cardId: string) => void | Promise<void>
  page: (list: string, page: number) => void
}

export type ShelfRecordProps = {
  ui: Ui
  plan: Plan
  columns: number
  face: Face
  entry: CatalogEntry | undefined
  entries: CatalogEntry[]
  walks: WalkText[]
  now: number
  canvasRows?: number
  pages?: Record<string, number>
  // The record is of a seat's shelf, where there are no rules: its connections group as planksOf's seat switch says.
  seat?: boolean
  actions: ShelfRecordActions
}

// One record in the same card (Back is the pane's): its name and its kind line, its tile where the rows allow, then About, Connections
// (press boxes), Moments (newest first), the cards that name it and, under the operator lens, the item's facts, each a block of the
// same layout: the blocks page under the head, and a block taller than a page pages its lines.
export function shelfRecordView({ ui, plan, columns, face, entry, entries, walks, now, canvasRows, pages = {}, seat = false, actions }: ShelfRecordProps) {
  const { Box, Text } = ui
  const row = listRowWidth(plan.width)
  if (entry === undefined) {
    return [
      <Box key="shelf-record" {...cardProps(plan.width, columns)} paddingX={PRESS.cardPad}>
        <Text key="record-none" color={THEME.dim}>no such record on the shelf</Text>
      </Box>,
    ]
  }
  const rows = finiteRows(canvasRows)
  const gap = gapOf(rows)
  const tile = tileStands(rows)
  const state = { entries, walks, now, seat }
  const read = recordOf(entry, state, 0, 0)
  const profile = profileOf(entry, entries, walks, now)
  const firstOf = new Map(profile.references.map(reference => [reference.cardId, reference.first] as const))
  const item = face === 'operator' ? itemLines(buildItem(entry, walks)) : []
  const none = (id: string) => <Text key={`record-${id}-none`} color={THEME.dim}>none</Text>
  const dim = (key: string, words: string) => (
    <Text key={key} color={THEME.dim} wrap="truncate-end">
      {fitted(words, row)}
    </Text>
  )
  // each block: its id, its title, its count, the height of each line, the gap between two, and the lines of a range as elements
  const parts: { id: string; title: string; count: number; lines: number[]; lineGap: number; at: (from: number, to: number) => any[] }[] = [
    {
      id: 'about',
      title: 'About',
      count: read.about.length,
      lines: read.about.length === 0 ? [1] : read.about.map(() => 1),
      lineGap: 0,
      at: (from, to) => (read.about.length === 0 ? [none('about')] : read.about.slice(from, to).map((line, i) => dim(`record-about-${from + i}`, `${line.text} · ${line.first} · ${line.when}`))),
    },
    {
      id: 'connections',
      title: 'Connections',
      count: read.connections.length,
      lines: read.connections.length === 0 ? [1] : read.connections.map(() => pressHigh(1)),
      lineGap: read.connections.length === 0 ? 0 : gap,
      at: (from, to) =>
        read.connections.length === 0
          ? [none('connections')]
          : read.connections.slice(from, to).map(connection =>
              pressBox({
                ui,
                id: `record-connection-${connection.id}`,
                label: connection.name,
                width: row,
                value: `${connection.kind} · ${cardsWord(connection.cards)}`,
                arrow: true,
                onPress: () => actions.open(connection.id),
              }),
            ),
    },
    {
      id: 'moments',
      title: 'Moments',
      count: read.moments.total,
      lines: read.moments.total === 0 ? [1] : Array.from({ length: read.moments.total }, () => 1),
      lineGap: 0,
      at: (from, to) =>
        read.moments.total === 0
          ? [none('moments')]
          : recordOf(entry, state, from, to - from).moments.items.map((moment, i) => dim(`record-moment-${from + i}`, momentLine(moment, firstOf.get(moment.cardId) ?? ''))),
    },
    ...(profile.references.length === 0
      ? []
      : [
          {
            id: 'cards',
            title: 'Cards',
            count: profile.references.length,
            lines: profile.references.map(() => pressHigh(1)),
            lineGap: gap,
            at: (from: number, to: number) =>
              profile.references.slice(from, to).map(reference =>
                pressBox({ ui, id: `record-card-${reference.cardId}`, label: reference.first, width: row, arrow: true, onPress: () => actions.openCard(reference.cardId) }),
              ),
          },
        ]),
    ...(item.length === 0
      ? []
      : [{ id: 'item', title: 'Item', count: item.length, lines: item.map(() => 1), lineGap: 0, at: (from: number, to: number) => item.slice(from, to).map((line, i) => dim(`record-item-${from + i}`, line)) }]),
  ]
  const head = [
    <Text key="record-name" bold wrap="truncate-end">{fitted(read.name, row)}</Text>,
    dim('record-kind', `${read.chi} · on your shelf since ${read.since}`),
    ...(tile && read.origin !== '' ? [dim('record-origin', read.origin)] : []),
  ]
  const above = head.length + (tile ? gap + pressHigh(2) : 0) + gap
  const budget = rows === undefined ? Number.POSITIVE_INFINITY : rows - CARD_ROWS - above
  const layout = layoutOf(parts.map(({ id, lines, lineGap }) => ({ id, lines, lineGap, tail: 0 })), budget, gap, 'record', pages, row, columns)
  const shown = parts.slice(layout.blocks.from, layout.blocks.to).map((part, at) =>
    blockView({
      ui,
      id: `record-${part.id}`,
      title: part.title,
      count: part.count,
      gap: part.lineGap,
      lines: part.at(layout.placed[at].from, layout.placed[at].to),
      list: `record-${part.id}`,
      page: layout.placed[at],
      inner: row,
      columns,
      onPage: actions.page,
    }),
  )
  return [
    <Box key="shelf-record" {...cardProps(plan.width, columns)} paddingX={PRESS.cardPad} gap={gap}>
      <Box key="record-head" flexDirection="column">
        {head}
      </Box>
      {tile && (
        <Box key="record-tile" borderStyle="round" borderColor={THEME.line} width={row} justifyContent="center">
          <Text color={THEME.dim}>picture</Text>
        </Box>
      )}
      {shown}
      {pagerView({ ui, list: 'record', page: layout.blocks, inner: row, columns, onPage: actions.page })}
    </Box>,
  ]
}
