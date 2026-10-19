// His desk (order DESK, part D1): what waits on him, read from `sandoq room desk list --json --all` and from the open asks of the room. Pure: no
// host, no view, and the asks are never copied: a row of the desk is the ask as seat.ts gives it, or an item as sandoq says it. The pane draws the
// items as given and never reads the shelf's desk.md. Run by `node` too: no enums, `import type`, `.ts` in imports.
import type { KeeperRow } from './keeperrow.ts'
import type { PageRead } from './page.ts'
import type { ShapeAsk } from './roomfeed.ts'
import type { SeatWait } from './seat.ts'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

// The kinds of an item, in the order the desk lists them. A kind outside the four (a newer sandoq) lists after them.
export const DESK_KINDS = ['sign', 'decision', 'test', 'reading']

// Where an item came from, as the pane opens it: a card, a record of the shelf, a web page, the run's own page (the pane has no page of its own
// yet) or any other word (drawn as it is, opens nothing). `value` is the ULID, the address or the text.
export type OriginKind = 'card' | 'record' | 'https' | 'page' | 'other'
export type Origin = { kind: OriginKind; value: string }

// One item as `desk list --json` says it. `opens` is its origin read; `canDone` is true only on an open item that is for `you`: Done is his.
export type DeskItem = {
  id: string
  kind: string
  words: string
  origin: string
  opens: Origin
  by: string
  for: string
  at: string
  atMs: number
  done: boolean
  doneBy: string
  doneAt: string
  doneMs: number
  canDone: boolean
}

// A row of the desk: an open ask of the room, the keeper's proposal to make a shape of an entry of his (a todo), the keeper's pick of an ask of his for
// the day (order T3), or an item.
export type DeskRow = { row: 'ask'; wait: SeatWait } | { row: 'shape'; shape: ShapeAsk } | { row: 'pick'; pick: KeeperRow } | { row: 'item'; item: DeskItem }

// What the register hands the view: the state of the read, the items it gave (open and done), the one line a call left under an item (by its
// id) or under the head, the id of the item whose Done runs, the id of the item whose page was opened in his browser, and whether this
// sandoq has no `room desk` at all.
export type DeskCard = {
  state: 'rest' | 'reading' | 'done'
  items: DeskItem[]
  lines: Record<string, string>
  line: string
  busy: string
  opened: string
  older: boolean
  // No sandoq was found for this room, so no item can be read (the plain line); '' when one was.
  cannot: string
  // What the last read of a page item's file left (order R3), for the item it names; none before one was opened.
  page?: PageRead
  // The fold of the keeper's picks stands open (order D2): its picks are drawn under it; none or false is folded.
  fold?: boolean
}

export const YOU = 'you'
const ULID = /^[0-9A-Z]{26}$/
export const isDeskId = (text: string): boolean => ULID.test(text)

// An origin read. The same four shapes sandoq's put takes (card:ULID, record:ULID, https://..., page:PATH, a path with no slash at its head and
// no `..`); any other text is `other`.
export function originOf(text: string): Origin {
  const card = /^card:([0-9A-Z]{26})$/.exec(text)
  if (card !== null) return { kind: 'card', value: card[1] }
  const record = /^record:([0-9A-Z]{26})$/.exec(text)
  if (record !== null) return { kind: 'record', value: record[1] }
  if (/^https:\/\/\S+$/.test(text)) return { kind: 'https', value: text }
  const page = /^page:(?!\/)(?!\S*\.\.)(\S+)$/.exec(text)
  if (page !== null) return { kind: 'page', value: page[1] }
  return { kind: 'other', value: text }
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '')
const timeOf = (at: string): number => {
  const ms = Date.parse(at)
  return Number.isFinite(ms) ? ms : 0
}

function itemOf(object: Record<string, unknown>): DeskItem | undefined {
  const id = text(object.id)
  if (id === '') return undefined
  const done = object.done === true
  const origin = text(object.origin)
  const whom = text(object.for)
  return {
    id,
    kind: text(object.kind),
    words: text(object.words),
    origin,
    opens: originOf(origin),
    by: text(object.by),
    for: whom,
    at: text(object.at),
    atMs: timeOf(text(object.at)),
    done,
    doneBy: text(object.done_by),
    doneAt: text(object.done_at),
    doneMs: timeOf(text(object.done_at)),
    canDone: !done && whom === YOU,
  }
}

// The items of the text `desk list --json` printed: one JSON object a line, in the order sandoq gave. A line that is no object with an id is
// left out. Nothing at all is no item; a text that holds lines and no item is no list the pane reads: none is returned, and the card says so.
export function parseDeskList(out: string): DeskItem[] | undefined {
  const lines = out
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
  const items: DeskItem[] = []
  for (const line of lines) {
    let object: unknown
    try {
      object = JSON.parse(line)
    } catch {
      continue
    }
    if (object === null || typeof object !== 'object' || Array.isArray(object)) continue
    const item = itemOf(object as Record<string, unknown>)
    if (item !== undefined) items.push(item)
  }
  return lines.length > 0 && items.length === 0 ? undefined : items
}

// An older sandoq has no `room desk`: its refusal is exit 2 and the usage line of the noun, `usage: sandoq room new|list|...`, whose verbs hold
// no `desk` (a sandoq that has the verb and takes the words wrong names `desk` in its usage line).
export function noDeskVerb(code: number | undefined, err: string): boolean {
  if (code !== 2) return false
  const first = /^usage: sandoq room ((?:[a-z]+\|)*[a-z]+)$/.exec(err.split('\n')[0].trim())
  return first !== null && !first[1].split('|').includes('desk')
}

// The open items in the order of the desk: the oldest first across the kinds, an item of the same time by its id.
export function openItems(items: DeskItem[]): DeskItem[] {
  return items.filter(item => !item.done).sort((a, b) => a.atMs - b.atMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

// The rows of ALL, the one order of the desk everywhere: his open letters first (the open asks of the room, in the order given: seat.ts gives them
// oldest first), then the keeper's picks of the day on his asks (oldest first, as keeperRows gives them), then his open items oldest first across
// the kinds, then the items that wait on a seat, oldest first. The keeper's open proposals of a shape (the fourth argument, in the order they were written)
// stand with his letters, after the asks.
export function deskRows(waits: SeatWait[], items: DeskItem[], picks: KeeperRow[] = [], shapes: ShapeAsk[] = []): DeskRow[] {
  const open = openItems(items)
  const item = (one: DeskItem): DeskRow => ({ row: 'item', item: one })
  return [
    ...waits.map((wait): DeskRow => ({ row: 'ask', wait })),
    ...shapes.map((shape): DeskRow => ({ row: 'shape', shape })),
    ...picks.map((pick): DeskRow => ({ row: 'pick', pick })),
    ...open.filter(one => one.for === YOU).map(item),
    ...open.filter(one => one.for !== YOU).map(item),
  ]
}

// ---- a row as the view draws it

// An ask is a letter: it goes off by its answer, never by Done, and so is the keeper's pick of one (it goes off by OK or by his tap). An item is a
// letter's kin by its kind (sign, decision, test, reading).
export const LETTER = 'letter'
export const rowKind = (row: DeskRow): string => (row.row === 'item' ? row.item.kind : LETTER)
// Whom a row waits on: an ask waits on him, a pick is his own to see, an item on its `for`. His rows are the desk's count.
export const isHis = (row: DeskRow): boolean => row.row !== 'item' || row.item.for === YOU
// Who put it ('' for an ask on a card of his own, and for a pick: the row says the keeper in its words).
export const rowBy = (row: DeskRow): string => (row.row === 'ask' ? row.wait.from : row.row === 'shape' ? row.shape.by : row.row === 'pick' ? '' : row.item.by)
// A pick lies on its ask: the ask is no open letter while it stands, so the key is the letter's own, and the ask opened from the pick is the open row.
// A shape ask has its own id for both halves of the key: it lies on no card of the walks, and its press opens it as a wait of that id.
export const rowKey = (row: DeskRow): string =>
  row.row === 'item'
    ? `item-${row.item.id}`
    : row.row === 'shape'
      ? shapeKey(row.shape.id)
      : `ask-${row.row === 'ask' ? `${row.wait.cardId}-${row.wait.askId}` : `${row.pick.cardId}-${row.pick.askId}`}`
export const shapeKey = (id: string): string => `ask-${id}-${id}`
// The kind of origin a row opens: an ask lies on its card, and so does a pick.
export const rowOrigin = (row: DeskRow): OriginKind => (row.row === 'item' ? row.item.opens.kind : 'card')
// A row that has a Done: his item that is open. A letter goes off by its answer.
export const hasDone = (row: DeskRow): boolean => row.row === 'item' && row.item.canDone

// The mark and the word of an origin, on each row: a mark is never alone. `page` and `other` open nothing; they are words.
export const ORIGIN_MARK: Record<OriginKind, string> = { card: '▭', record: '▤', https: '↗', page: '▫', other: '▫' }
export const ORIGIN_WORD: Record<OriginKind, string> = { card: 'card', record: 'record', https: 'link', page: 'page', other: 'note' }
// What an origin is, as the opened item says it after Open origin.
export const ORIGIN_FROM: Record<OriginKind, string> = {
  card: 'the card in the room feed',
  record: 'the record on the room shelf',
  https: 'the page in your browser',
  page: 'a page of the run',
  other: 'a note',
}
// An origin the pane opens: a card, a record, a web page. A page of the run and any other open nothing.
export const opensOrigin = (kind: OriginKind): boolean => kind === 'card' || kind === 'record' || kind === 'https'

// The `from` of a wait that was opened from the desk: its Back is `‹ Desk`, and the desk stands at its left from 128 columns. No seat is named so.
export const FROM_DESK = '@desk'
// The head of the press a clear region over a pile of the desk's picture posts (the key of the pile follows it): the register opens that pile.
export const DESK_PILE = 'desk-pile:'

// ---- the piles

// One pile a kind (Group `kind`) or one a seat that put something (Group `seat`), and ALL first: the open pile lists its rows, his before the
// seats' (the order of deskRows). A pile with no row is not made. A pile's count is his rows alone.
export type Group = 'kind' | 'seat'
export type PileArt = 'all' | 'letter' | 'sign' | 'decision' | 'test' | 'reading' | 'seat'
export type Pile = { key: string; name: string; head: string; rows: DeskRow[]; art: PileArt; tint: number }
export const ALL_PILE = 'all'
export const PILE_NAME: Record<string, string> = { letter: 'Letters', sign: 'Sign', decision: 'Decide', test: 'Test', reading: 'Read' }
const PILE_HEAD: Record<string, string> = { all: 'All', letter: 'Letters', sign: 'To sign', decision: 'To decide', test: 'To test by hand', reading: 'To read' }
const ART: PileArt[] = ['letter', 'sign', 'decision', 'test', 'reading']

export const hisCount = (rows: DeskRow[]): number => rows.filter(isHis).length
// The seat name of a pile: who put the row, `you` for a card of his own.
const seatOf = (row: DeskRow): string => (rowBy(row) === '' ? YOU : rowBy(row))

export function pilesOf(rows: DeskRow[], group: Group): Pile[] {
  if (rows.length === 0) return []
  const all: Pile = { key: ALL_PILE, name: 'All', head: PILE_HEAD.all, rows, art: 'all', tint: 0 }
  if (group === 'kind') {
    const kinds = [LETTER, ...DESK_KINDS].filter(kind => rows.some(row => rowKind(row) === kind))
    return [all, ...kinds.map((kind): Pile => ({ key: kind, name: PILE_NAME[kind], head: PILE_HEAD[kind], rows: rows.filter(row => rowKind(row) === kind), art: ART[ART.indexOf(kind as PileArt)], tint: 0 }))]
  }
  const seats: string[] = []
  for (const row of rows) if (!seats.includes(seatOf(row))) seats.push(seatOf(row))
  return [all, ...seats.map((seat, tint): Pile => ({ key: `seat-${seat}`, name: seat, head: `From ${seat}`, rows: rows.filter(row => seatOf(row) === seat), art: 'seat', tint }))]
}

// The pile the nav names, else the first (ALL).
export const pileAt = (piles: Pile[], key: string | undefined): Pile | undefined => piles.find(pile => pile.key === key) ?? piles[0]

// The items done today, by the local day of `zone` (minutes east of UTC): "Done today N".
const dayOf = (ms: number, zone: number): number => Math.floor((ms + zone * MINUTE) / DAY)
export const doneToday = (items: DeskItem[], now: number, zone: number): number =>
  items.filter(item => item.done && item.doneMs > 0 && dayOf(item.doneMs, zone) === dayOf(now, zone)).length

// The shape asks he closed today (a decided block stands, Make or Leave), by the same local day: they count in "Answered today" as an answer does, oldest first.
export const shapesAnsweredToday = (asks: ShapeAsk[], now: number, zone: number): ShapeAsk[] =>
  asks.filter(ask => {
    const ms = timeOf(ask.decided?.at ?? '')
    return ms > 0 && dayOf(ms, zone) === dayOf(now, zone)
  })