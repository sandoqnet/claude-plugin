// THE ROOM CARD of the app (order DP, P4). The
// place `The room` is ONE card of rows, each a press box (views/press.tsx) with its name at the left, one dim line of its state and the arrow
// at the right: Door, Seats and Shelf in each lens, and in Operator What it plays, Versions and Folder too. Folder says the last two parts
// of the folder and is no press. Door, Seats, Shelf, What it plays and Versions each open ONE place. The strip says the title and holds
// Close (views/strip.tsx), so this card holds no title and no foot row.
// Two cards come of it: THE DOOR (its up or down, the last tick, the day, the programs that run, what the room has grown, `Put it up`) and
// WHAT IT PLAYS, where the discs stand ONCE: each a row of the same height, the card one list paged by the one rule of model/pages.ts (the
// pager's rows counted in it as views/press.tsx counts them, a count never typed): its line, the ask of an update that waits and the box
// that checks come first, each an item of the list, then the discs; a state word and `all current` stand only where the last check gave
// them, with its hour. With no check the card says the count and `Check for updates`. THE ACTS OF THE DISCS stand here (order DP, P4 part 3;
// model/discacts.ts): a disc that waits holds a box `Update` under its row and `Update all` stands where two wait, by the register's one
// act (the table of Versions holds the pane's line alone); the words of a run (what runs, a refusal, a plain line) stand over the discs.
// The terminal draws none of it (views/room.tsx is its column). Read over the fake kit alone: no row has been seen drawn in the app.
import { countOf } from '../model/blocks'
import { DOOR_STANDS, LONG, discActsOf, runningWords } from '../model/discacts'
import type { Busy } from '../model/discacts'
import { pageAt } from '../model/pages'
import { feedLabel } from '../model/roomfeed'
import type { FeedLine } from '../model/roomfeed'
import { readyWords } from '../model/roomplace'
import type { Update } from '../model/roomplace'
import { groupOf, isNotAFault, noteOf } from '../model/steps'
import { updateView } from './room'
import { listRowWidth, pressBox, pressHigh, pressPagerRows, pressPagerView } from './press'
import { PRESS, THEME, cardProps, cellsOf, fitted } from './theme'
import type { Plan } from './theme'
import type { DiscChecks, Ui } from './types'
import { cutRows, wordRows, wrapRows } from './versions-table'
import type { VersionsTable } from './versions-table'

export const ROOM_TITLE = 'The room'
export const PLAYS_TITLE = 'What it plays'
export const DOOR_TITLE = 'Door'
export const FEED_TITLE = 'The feed'

// One row of a card of the room: a press (with the arrow) where `press` is given, else a row of the same height with no edge, for a thing
// that is not pressed.
// `arrow` is false for a press that acts and opens no place (`Put it up`).
// `act` is a press box under a row that is not pressed (the Update of a disc that waits), and `note` the words of its record under it, dim
// and wrapped (why a disc was refused, what is newer than the one held): the row, its note and its act are ONE item of the list, so a page
// never parts a disc from its act. `tone` is the key of the value of a row that is not pressed (a wait warns, a refusal errs).
export type RoomRow = {
  id: string
  label: string
  value: string
  press?: () => void | Promise<void>
  open?: boolean
  arrow?: boolean
  tone?: { color: string; bold?: boolean }
  note?: string
  act?: { id: string; label: string; press: () => void | Promise<void> }
}

// The rows a text takes in `width` cells: counted by its cells and by its words, whichever is more (a word does not break).
const rowsOfWords = (text: string, width: number): number => Math.max(wrapRows(text, width), wordRows(text, width))
// The most rows of the words of a run (what it refused, what it said) and of the note of a disc in this card: the rest of a run is in
// Versions, behind its fold.
const RUN_ROWS = 3

// The rows one item of the list takes: its line, its note wrapped in the cells a row's words have, and its act with the row between.
const rowHigh = (row: RoomRow, width: number): number =>
  pressHigh() + (row.note === undefined || row.note === '' ? 0 : rowsOfWords(row.note, Math.max(1, width - PRESS.across))) + (row.act === undefined ? 0 : PRESS.between + pressHigh())

// The cells the label and the value of a row that is not pressed leave each other: the value is cut to the cells the label leaves. Its
// words stand where a press box's do (the padding and the cell of its edge each side: PRESS.across), so the two rows align.
const plainRow = ({ ui, id, label, value, width, tone }: { ui: Ui; id: string; label: string; value: string; width: number; tone?: RoomRow['tone'] }) => {
  const { Box, Text } = ui
  const inner = Math.max(1, width - PRESS.across)
  const room = Math.max(0, inner - cellsOf(label) - PRESS.apart)
  return (
    <Box key={`${id}-plain`} flexDirection="row" justifyContent="space-between" alignItems="center" paddingX={PRESS.padX + 1} width={width} height={pressHigh()}>
      <Text key={`${id}-label`} bold wrap="truncate-end">
        {fitted(label, inner)}
      </Text>
      {value !== '' && room >= 3 && (
        <Text key={`${id}-value`} color={tone?.color ?? THEME.dim} {...(tone?.bold === true ? { bold: true } : {})} wrap="truncate-end">
          {fitted(value, room)}
        </Text>
      )}
    </Box>
  )
}

export type RoomRowsProps = {
  ui: Ui
  plan: Plan
  columns: number
  // The name of the list: the keys of its rows and the page's place in the pane's memory.
  list: string
  rows: RoomRow[]
  // The parts that stand before the rows, each with the rows it takes: they are items of the list, so a page takes what fits of them and
  // of the rows after them, and a card that is short never runs under the dock.
  parts?: { node: any; rows: number }[]
  // The rows the canvas leaves for the card and the page asked: a list taller than the canvas pages by the one rule (nothing scrolls).
  canvasRows?: number
  page?: number
  actions: { page?: (list: string, page: number) => void }
}

// The card of rows: the parts, then a press box or a plain row each, then the pager where the list makes more than one page.
export function roomRowsView({ ui, plan, columns, list, rows, parts = [], canvasRows, page = 0, actions }: RoomRowsProps) {
  const { Box, Text } = ui
  const width = listRowWidth(plan.width)
  const heights = [...parts.map(part => part.rows), ...rows.map(row => rowHigh(row, width))]
  const shown = pageAt(heights, canvasRows === undefined ? Number.POSITIVE_INFINITY : canvasRows - PRESS.chrome, page, PRESS.between, pressPagerRows(width, columns))
  const cut = parts.length
  const here = rows.slice(Math.max(0, shown.from - cut), Math.max(0, shown.to - cut))
  return [
    <Box key={`${list}-card`} {...cardProps(plan.width, columns)} paddingX={PRESS.cardPad}>
      {parts.slice(shown.from, Math.min(shown.to, cut)).map(part => part.node)}
      {here.length > 0 && (
        <Box key={`${list}-rows`} flexDirection="column" gap={PRESS.between}>
          {here.map(row => {
            const line =
              row.press === undefined
                ? plainRow({ ui, id: `${list}-${row.id}`, label: row.label, value: row.value, width, ...(row.tone === undefined ? {} : { tone: row.tone }) })
                : pressBox({
                    ui,
                    id: `${list}-${row.id}`,
                    label: row.label,
                    width,
                    ...(row.value === '' ? {} : { value: row.value }),
                    arrow: row.arrow !== false,
                    open: row.open === true,
                    onPress: row.press,
                  })
            const one =
              row.note === undefined || row.note === '' ? (
                line
              ) : (
                <Box key={`${list}-${row.id}-held`} flexDirection="column">
                  {line}
                  <Box key={`${list}-${row.id}-note-box`} paddingX={PRESS.padX + 1} width={width}>
                    <Text key={`${list}-${row.id}-note`} color={THEME.dim} wrap="wrap">
                      {row.note}
                    </Text>
                  </Box>
                </Box>
              )
            return row.act === undefined ? (
              one
            ) : (
              <Box key={`${list}-${row.id}-pair`} flexDirection="column" gap={PRESS.between}>
                {one}
                {pressBox({ ui, id: `${list}-${row.act.id}`, label: row.act.label, width, onPress: row.act.press })}
              </Box>
            )
          })}
        </Box>
      )}
      {pressPagerView({ ui, list, page: shown, inner: width, columns, onPage: n => actions.page?.(list, n) })}
    </Box>,
  ]
}

// The words of the rows of the room card, from what the pane holds: each one line, cut by the row's cells.
export type RoomCardData = {
  doorUp: boolean
  // HH:MM of the last tick when the door is down ('' with none), and the ticks of the day (none when the tick holds no count).
  downSince: string
  ticksToday?: number
  seats: number
  seatsWaiting: number
  records: number
  rules: number
  discs: number
  // The entries of the room's feed (feed/GATE.md): the feed row says their count.
  feed: number
  pane: string
  where: string
}

const plural = (count: number, noun: string): string => countOf(count, noun)

export function doorWords(data: Pick<RoomCardData, 'doorUp' | 'downSince' | 'ticksToday'>): string {
  const day = data.ticksToday === undefined ? '' : plural(data.ticksToday, 'tick')
  const state = data.doorUp ? 'up' : data.downSince === '' ? 'down' : `down since ${data.downSince}`
  return [state, day === '' ? '' : `${day} today`].filter(part => part !== '').join(' · ')
}

export const seatsWords = ({ seats, seatsWaiting }: Pick<RoomCardData, 'seats' | 'seatsWaiting'>): string =>
  seats === 0 ? 'none yet' : [String(seats), seatsWaiting > 0 ? `${seatsWaiting} wait` : ''].filter(part => part !== '').join(' · ')

export const shelfWords = ({ records, rules }: Pick<RoomCardData, 'records' | 'rules'>): string =>
  [plural(records, 'record'), rules > 0 ? plural(rules, 'rule') : ''].filter(part => part !== '').join(' · ')

export type RoomCardProps = {
  ui: Ui
  plan: Plan
  columns: number
  // Operator draws the rows after Shelf; Public draws Door, Seats and Shelf.
  operator: boolean
  data: RoomCardData
  // The card of the room that stands open beside the list (from 128 columns): its row keeps the open look while its card is open.
  openCard?: 'door' | 'plays' | 'feed'
  canvasRows?: number
  page?: number
  actions: {
    openDoor: () => void | Promise<void>
    openSeats: () => void | Promise<void>
    openShelf: () => void | Promise<void>
    openPlays: () => void | Promise<void>
    openFeed: () => void | Promise<void>
    openVersions: () => void | Promise<void>
    page?: (list: string, page: number) => void
  }
}

// The count of the feed row: `none yet`, `1 entry`, `3 entries`.
export const feedWords = (count: number): string => (count === 0 ? 'none yet' : `${count} ${count === 1 ? 'entry' : 'entries'}`)

// The room card, the rows in a fixed order. A room with no disc says `none yet` for What it plays.
export function roomCardView({ ui, plan, columns, operator, data, openCard, canvasRows, page, actions }: RoomCardProps) {
  const rows: RoomRow[] = [
    { id: 'door', label: 'Door', value: doorWords(data), press: actions.openDoor, open: openCard === 'door' },
    { id: 'seats', label: 'Seats', value: seatsWords(data), press: actions.openSeats },
    { id: 'shelf', label: 'Shelf', value: shelfWords(data), press: actions.openShelf },
    ...(operator
      ? [
          { id: 'plays', label: PLAYS_TITLE, value: data.discs === 0 ? 'none yet' : plural(data.discs, 'disc'), press: actions.openPlays, open: openCard === 'plays' },
          { id: 'feed', label: FEED_TITLE, value: feedWords(data.feed), press: actions.openFeed, open: openCard === 'feed' },
          { id: 'versions', label: 'Versions', value: `pane ${data.pane}`, press: actions.openVersions },
          ...(data.where === '' ? [] : [{ id: 'folder', label: 'Folder', value: data.where }]),
        ]
      : []),
  ]
  return roomRowsView({ ui, plan, columns, list: 'roomcard', rows, ...(canvasRows === undefined ? {} : { canvasRows }), ...(page === undefined ? {} : { page }), actions })
}

export type PlaysProps = {
  ui: Ui
  surface?: string
  plan: Plan
  columns: number
  discs: { name: string; version: string }[]
  // What the last check gave; none before a check.
  checks?: DiscChecks
  update?: Update
  canvasRows?: number
  page?: number
  leanKey?: boolean
  // What the card of Versions holds of the last check and the last run (order DP, P4 part 3): the acts of the discs are drawn from it, by
  // the register's one act (table.onUpdate: a disc's name, or none for `Update all`). With none no Button of an update stands.
  acts?: { table: VersionsTable; cannot: string; busy: Busy }
  actions: {
    check?: () => void | Promise<void>
    tap: (cardId: string, askId: string, choice: string) => void | Promise<void>
    openPage: (page: string) => void | Promise<void>
    page?: (list: string, page: number) => void
  }
}

// The words of the line over the discs: the count, and after a check its hour and whether each disc is current. With none, the count and the
// versions stand and the box `Check for updates` asks for one.
export function playsLine(count: number, checks?: DiscChecks): string {
  if (count === 0) return 'No disc is played yet.'
  if (checks === undefined) return `${countOf(count, 'disc')}, not checked yet.`
  const behind = Object.values(checks.states).filter(word => word !== 'current').length
  return behind === 0 && Object.keys(checks.states).length > 0 ? `${countOf(count, 'disc')}, all current at the ${checks.at} check.` : `${countOf(count, 'disc')}, ${behind} to look at after the ${checks.at} check.`
}

// The rows the ask of an update takes (updateView of views/room.tsx): its words (`Waits for you`, then its line, which goes under the first
// where the two do not fit one row), the row between, and its acts: one row where the link and the two picks fit side by side (a pick is its
// label and two cells, and four cells are kept spare), else the link over the picks with the row between them.
export function askRows(update: Update, width: number): number {
  const room = Math.max(1, width)
  const words = cellsOf(`· ${readyWords(update)}`)
  const line = cellsOf('Waits for you') + 1 + words <= room ? 1 : 1 + Math.ceil(words / room)
  const picks = cellsOf('Not now') + cellsOf('Update') + 4 + 2
  const link = update.page === '' ? 0 : Math.min(room, cellsOf('What changes ›')) + 2
  return line + 1 + (link + picks + 4 <= room ? 1 : 3)
}

// What it plays: the line over the discs, the ask of an update that waits, the box that checks (only where no check was made), the words of
// a run and the acts of the discs, then the discs by the one rule. A disc row carries its version, and after a check its state word beside
// it; it opens nothing, so it is no press, but a disc that waits holds a box under it, `Update` (`Update, restart door` under a door of the
// unit), and `Update all` stands where two wait (model/discacts.ts says which Button stands; a Button stands only while no command runs).
export function playsView({ ui, surface, plan, columns, discs, checks, update, canvasRows, page, leanKey, acts, actions }: PlaysProps) {
  const { Box, Text } = ui
  const width = listRowWidth(plan.width)
  const line = playsLine(discs.length, checks)
  const dim = (key: string, words: string) => ({
    node: (
      <Text key={key} color={THEME.dim} wrap="wrap">
        {words}
      </Text>
    ),
    rows: rowsOfWords(words, width),
  })
  const table = acts?.table
  const doing = acts === undefined || table === undefined ? undefined : discActsOf({ steps: table.steps, door: table.door, busy: acts.busy, cannot: acts.cannot, long: table.long })
  // the line is counted at its cells and its words: a line that wraps takes the rows it wraps to
  const parts: { node: any; rows: number }[] = [dim('plays-line', line)]
  if (update !== undefined) parts.push({ node: updateView({ ui, surface, update, ...(leanKey === undefined ? {} : { leanKey }), inner: width, actions }), rows: askRows(update, width) })
  if (checks === undefined && actions.check !== undefined) parts.push({ node: pressBox({ ui, id: 'plays-check', label: 'Check for updates', onPress: actions.check }), rows: pressHigh() })
  if (acts !== undefined && table !== undefined && doing !== undefined) {
    if (acts.busy === 'updating' && table.running !== undefined) parts.push(dim('plays-running', runningWords(table.running)))
    if (doing.stands) parts.push(dim('plays-door-stands', DOOR_STANDS))
    if (doing.long) parts.push(dim('plays-long', LONG))
    if (doing.all !== undefined) parts.push({ node: pressBox({ ui, id: 'plays-update-all', label: doing.all, width, onPress: () => table.onUpdate('') }), rows: pressHigh() })
    // what the last run said, while no command runs: its refusal (the true exit code, in the error key and bold) and its plain line
    if (acts.busy === 'rest' && table.refused !== undefined) {
      const head = `Update refused, exit ${table.refused.code}.`
      const err = cutRows(table.refused.err, width, RUN_ROWS)
      parts.push({
        node: (
          <Box key="plays-refused" flexDirection="column">
            <Text key="plays-refused-head" color={THEME.fault} bold wrap="wrap">
              {head}
            </Text>
            {err !== '' && (
              <Text key="plays-refused-err" color={THEME.dim} wrap="wrap">
                {err}
              </Text>
            )}
          </Box>
        ),
        rows: rowsOfWords(head, width) + (err === '' ? 0 : rowsOfWords(err, width)),
      })
    }
    if (acts.busy === 'rest' && table.said !== undefined && table.said.plain !== '') parts.push(dim('plays-said', cutRows(table.said.plain, width, RUN_ROWS)))
  }
  const rows: RoomRow[] = discs.map((disc, at) => {
    const label = doing?.each[disc.name]
    // what the last check said of the disc: a wait warns (bold), a refusal errs, the rest is dim; the record's words stand under it
    const step = table?.steps.find(one => one.noun === 'disc' && one.name === disc.name)
    const group = step === undefined ? undefined : groupOf(step.state)
    const tone = step === undefined || isNotAFault(step.state) ? undefined : group === 'wait' ? { color: THEME.warn, bold: true } : group === 'refused' ? { color: THEME.fault } : undefined
    // the note stands in the cells a row's words have (rowHigh counts it so) and takes three rows at most, as the words of a run do: the row,
    // its note and its act are one item that cannot split, so a why of 120 cells must not make it taller than the canvas: where the canvas is
    // low it takes the rows that leave the item, with the card's rows and the pager's, within the canvas (one row at least)
    const room = canvasRows === undefined ? RUN_ROWS : canvasRows - PRESS.chrome - pressPagerRows(width, columns) - pressHigh() - (label === undefined ? 0 : PRESS.between + pressHigh())
    const note = step === undefined ? '' : cutRows(noteOf(step), Math.max(1, width - PRESS.across), Math.max(1, Math.min(RUN_ROWS, room)))
    return {
      id: `disc-${at}`,
      label: disc.name,
      value: [disc.version, checks?.states[disc.name] ?? ''].filter(part => part !== '').join(' · '),
      ...(tone === undefined ? {} : { tone }),
      ...(note === '' ? {} : { note }),
      ...(label === undefined || table === undefined ? {} : { act: { id: `update-${disc.name}`, label, press: () => table.onUpdate(disc.name) } }),
    }
  })
  return roomRowsView({ ui, plan, columns, list: 'plays', rows, parts, ...(canvasRows === undefined ? {} : { canvasRows }), ...(page === undefined ? {} : { page }), actions })
}

export type DoorCardProps = {
  ui: Ui
  plan: Plan
  columns: number
  doorUp: boolean
  downSince: string
  lastTick: string
  today: string
  programs: { name: string; state: string; since: string }[]
  grown?: { steps: number; items: number; media: number }
  size: string
  canvasRows?: number
  page?: number
  actions: { putUp?: () => void | Promise<void>; page?: (list: string, page: number) => void }
}

const grouped = (count: number): string => String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

// The door card: what the door says of itself, the programs that run (an idle one has no row), what the room has grown, and, with the door
// down, `Put it up`. Every row is one line; the list pages by the one rule.
export function doorView({ ui, plan, columns, doorUp, downSince, lastTick, today, programs, grown, size, canvasRows, page, actions }: DoorCardProps) {
  const rows: RoomRow[] = [
    { id: 'state', label: 'Door', value: doorUp ? 'up' : downSince === '' ? 'down' : `down since ${downSince}` },
    ...(lastTick === '' ? [] : [{ id: 'tick', label: 'Last tick', value: lastTick }]),
    ...(today === '' ? [] : [{ id: 'today', label: 'Today', value: today }]),
    ...programs.map((program, at) => ({ id: `program-${at}`, label: program.name, value: [program.state, program.since === '' ? '' : `since ${program.since}`].filter(part => part !== '').join(' · ') })),
    ...(grown === undefined
      ? []
      : [
          { id: 'walks', label: 'Walks', value: `${grouped(grown.steps)} ${grown.steps === 1 ? 'step' : 'steps'}` },
          { id: 'items', label: 'Shelf', value: [`${grouped(grown.items)} ${grown.items === 1 ? 'item' : 'items'}`, grown.media > 0 ? `media ${grouped(grown.media)}` : ''].filter(part => part !== '').join(' · ') },
          ...(size === '' ? [] : [{ id: 'size', label: 'On disk', value: size }]),
        ]),
    ...(!doorUp && actions.putUp !== undefined ? [{ id: 'put-up', label: 'Put it up', value: '', press: actions.putUp, arrow: false }] : []),
  ]
  return roomRowsView({ ui, plan, columns, list: 'door', rows, ...(canvasRows === undefined ? {} : { canvasRows }), ...(page === undefined ? {} : { page }), actions })
}

export type FeedCardProps = {
  ui: Ui
  plan: Plan
  columns: number
  // The entries of the feed, newest first (model/roomfeed.ts feedLines).
  lines: FeedLine[]
  canvasRows?: number
  page?: number
  actions: { page?: (list: string, page: number) => void }
}

// The most entries the feed card lays out, the newest; the line over them says so where the feed holds more.
export const FEED_SHOWN = 200

// The feed card (order room-feed, part A): the entries of feed/GATE.md newest first, each a row of the same height: who said it and what kind it is (and the number of a
// row) at the left, where the door sent it at the right (cards, toasts, none, the fault, or no answer yet), and the first line of its text under, cut to the cells of the
// row. It is no press. The list pages by the one rule and never scrolls.
export function roomFeedView({ ui, plan, columns, lines, canvasRows, page, actions }: FeedCardProps) {
  const { Text } = ui
  const width = listRowWidth(plan.width)
  const inner = Math.max(1, width - PRESS.across)
  const shown = lines.slice(0, FEED_SHOWN)
  const said = lines.length === 0 ? 'Nothing is on the feed yet.' : lines.length > shown.length ? `The newest ${shown.length} of ${lines.length} entries.` : ''
  const parts =
    said === ''
      ? []
      : [
          {
            node: (
              <Text key="feed-line" color={THEME.dim} wrap="wrap">
                {said}
              </Text>
            ),
            rows: rowsOfWords(said, width),
          },
        ]
  const rows: RoomRow[] = shown.map(line => ({
    id: line.id,
    label: feedLabel(line),
    value: line.where,
    ...(line.first === '' ? {} : { note: fitted(line.first, inner) }),
    ...(line.where.startsWith('fault') ? { tone: { color: THEME.fault } } : {}),
  }))
  return roomRowsView({ ui, plan, columns, list: 'feed', rows, parts, ...(canvasRows === undefined ? {} : { canvasRows }), ...(page === undefined ? {} : { page }), actions })
}
