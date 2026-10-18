// What the shelf place reads (order P7, cut C1): the group of a kind, the planks of one shelf, a page of a plank,
// one record whole, whose shelves there are, and the artist's themes with the one on the wall. Pure, with no `$`, and
// it imports no view and no host module. It adds no rule the other model files hold: the order of the items is
// shelfplace.ts's, the media rule is roomplace.ts's, the record is profile.ts's. Run by `node` too: no enums,
// `import type`, `.ts` in imports.
import { parseBlocks } from './blocks.ts'
import { profileOf, ulidMs } from './profile.ts'
import type { About, Moment, WalkText } from './profile.ts'
import { isMedia } from './roomplace.ts'
import type { CatalogEntry } from './shelf.ts'
import { shelfOf } from './shelfplace.ts'
import type { ShelfItem, ShelfState } from './shelfplace.ts'

// ---- the group of a kind
export type Group = 'People' | 'Places' | 'Rules' | 'Things'
// Media is a plank of its own, never in Things. `Told` and `Themes` are the planks of a seat's shelf alone (what it was told, and the
// artist's themes).
export type PlankName = Group | 'Media' | 'Told' | 'Themes'

// A kind is the class (chi) of a record: person to People, location to Places, rule to Rules, any other to Things.
export function groupOf(kind: string): Group {
  switch (kind.trim().toLowerCase()) {
    case 'person':
      return 'People'
    case 'location':
      return 'Places'
    case 'rule':
      return 'Rules'
    default:
      return 'Things'
  }
}

// Media is the records of the class `media`, by roomplace.ts's one rule (isMedia). On a seat's shelf the rules are the
// room's, so a seat's record of the kind rule is a thing.
const plankOf = (entry: CatalogEntry, seat = false): PlankName => {
  if (isMedia(entry)) return 'Media'
  const group = groupOf(entry.chi)
  return seat && group === 'Rules' ? 'Things' : group
}

// ---- the planks of one shelf
// An item as shelfplace.ts gives it, with its class, its kind and its time in ms.
export type PlankItem = ShelfItem & { chi: string; che: string; ms: number }
export type Plank = { name: PlankName; count: number; items: PlankItem[] }

// The order of the planks, Media before Rules so that the last box of the shelf, `Add a rule`, ends the last plank.
const ORDER: PlankName[] = ['People', 'Things', 'Places', 'Media', 'Rules']

// The planks of one shelf, each with its name, its count and its items, newest first. The order of the items is
// shelfplace.ts's own (the ULID's time, the later row first). An empty plank is left out, but Rules always stands.
// The rules are the standing rules of rules.md, newest first by their ULID, with any record of the group Rules.
// `seat` is true for a seat's shelf: the rules are the room's alone, so it has no Rules plank, and a record of the kind
// rule is a thing.
export function planksOf(state: ShelfState, seat = false): Plank[] {
  const place = shelfOf(state)
  const entries = new Map<string, CatalogEntry[]>()
  for (const entry of state.entries) entries.set(entry.id, [...(entries.get(entry.id) ?? []), entry])
  const items = new Map<PlankName, PlankItem[]>(ORDER.map(name => [name, []]))
  for (const item of place.shelf) {
    // the later row of a shared id comes first in shelfplace.ts
    const entry = entries.get(item.id)?.pop()
    if (entry === undefined) continue
    items.get(plankOf(entry, seat))?.push({ ...item, chi: entry.chi, che: entry.che, ms: ulidMs(item.id) })
  }
  if (!seat) {
    const held = new Set((items.get('Rules') ?? []).map(item => item.id))
    const standing = place.rules
      .filter(rule => !held.has(rule.id))
      .map((rule): PlankItem => ({ name: rule.words, id: rule.id, what: 'a rule', how: rule.by, when: '', chi: 'rule', che: '', ms: ulidMs(rule.id) }))
      .reverse()
    items.set('Rules', [...standing, ...(items.get('Rules') ?? [])].sort((a, b) => b.ms - a.ms))
  }
  return ORDER.map(name => ({ name, count: (items.get(name) ?? []).length, items: items.get(name) ?? [] })).filter(
    plank => plank.count > 0 || (plank.name === 'Rules' && !seat),
  )
}

// ---- a page of a plank
export type Page<T> = { items: T[]; offset: number; count: number; total: number; hasBefore: boolean; hasAfter: boolean }

const whole = (value: number): number => (Number.isFinite(value) ? Math.floor(value) : 0)

// COUNT items from OFFSET (the view's count, never typed here). An offset under 0 is 0 and one past the end is the
// end; a count under 0 is 0. `hasBefore` and `hasAfter` say whether a page stands before and after this one.
export function pageOf<T>(items: T[], offset: number, count: number): Page<T> {
  const total = items.length
  const size = Math.max(0, whole(count))
  const from = Math.min(Math.max(0, whole(offset)), total)
  return { items: items.slice(from, from + size), offset: from, count: size, total, hasBefore: from > 0, hasAfter: from + size < total }
}

// ---- one record whole
// A connection of the record: its id, its name, its class as the catalog holds it (else as the cards name it), its
// kind (none when the catalog has no row for it), its plank, and the cards it shares with the record.
export type ReadConnection = { id: string; name: string; kind: string; che: string; group: PlankName; cards: number }
export type RecordRead = {
  id: string
  name: string
  chi: string
  che: string
  group: PlankName
  since: string
  origin: string
  about: About[]
  connections: ReadConnection[]
  moments: Page<Moment>
}

// `seat` is true for a record of a seat's shelf: its planks are those of planksOf's seat switch.
export type RecordState = { entries: CatalogEntry[]; walks: WalkText[]; now: number; seat?: boolean }

// What profile.ts gives (its name, class, kind, since, origin, about lines, connections with the cards they share,
// moments oldest first) is taken whole. What it lacks is added: the kind and the plank of each connection, so each
// draws its own tile, and the moments newest first a page at a time. The count of a page is the view's: no default here.
export function recordOf(entry: CatalogEntry, { entries, walks, now, seat = false }: RecordState, offset: number, count: number): RecordRead {
  const profile = profileOf(entry, entries, walks, now)
  const connections = profile.connections.map((connection): ReadConnection => {
    const row = entries.find(item => item.id === connection.id)
    return { ...connection, che: row?.che ?? '', group: plankOf(row ?? { name: connection.name, id: connection.id, chi: connection.kind, che: '' }, seat) }
  })
  return {
    id: profile.id,
    name: profile.name,
    chi: profile.chi,
    che: profile.che,
    group: plankOf(entry, seat),
    since: profile.since,
    origin: profile.origin,
    about: profile.about,
    connections,
    moments: pageOf([...profile.moments].reverse(), offset, count),
  }
}

// ---- whose shelves
export type Whose = { name: string; own: boolean }

// The room's shelf, then each other folder of the run's shelves folder by name. The room's own always stands first,
// listed or not; a name that is empty, holds a dot (a hidden folder, or a file such as notes.md: a shelf's name has none) or holds a
// slash is no shelf; a name stands once.
export function whoseOf(names: string[], room = 'room'): Whose[] {
  const others = [...new Set(names.map(name => name.trim()))]
    .filter(name => name !== '' && name !== room && !name.includes('.') && !name.includes('/'))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  return [{ name: room, own: true }, ...others.map(name => ({ name, own: false }))]
}

// ---- the artist's themes
// A theme of themes/ID.md: the block `NAME / @ID / { theme::wallpaper::made }` at (34,3), its fence `sha256` of the
// drawing and `card` that made it. `inUse` is true for the one theme on the wall.
export type Theme = { id: string; name: string; sha256: string; card: string; ms: number; inUse: boolean }

const NAME_ID = /^(.*)\/@([0-9A-Za-z]{20,})\s*$/

const fenceWord = (value: unknown): string => (typeof value === 'string' ? value : '')

// The theme of one file's text: its first block of the taxonomy, none when the file holds none or its terms are not
// the name and the at id.
function themeOf(text: string): Theme | undefined {
  const block = parseBlocks(text).find(item => item.chi === 'theme' && item.che === 'wallpaper' && item.cho === 'made' && item.lead === 34 && item.close === 3)
  const terms = block === undefined ? null : NAME_ID.exec(block.words)
  if (block === undefined || terms === null) return undefined
  return { id: terms[2], name: terms[1].trim(), sha256: fenceWord(block.fence.sha256).toLowerCase(), card: fenceWord(block.fence.card), ms: ulidMs(terms[2]), inUse: false }
}

// The themes of the files' texts, newest first (the ULID's time, the greater id first). In use is the NEWEST theme
// whose sha256 equals SHA256, the sha256 of the bytes of the wall; none when no theme matches: a wall of his own hand.
// A theme with no sha256 matches nothing, and neither does an empty SHA256. A theme id stands once.
export function themesOf(texts: string[], sha256: string): Theme[] {
  const seen = new Set<string>()
  const themes: Theme[] = []
  for (const text of texts) {
    const theme = themeOf(text)
    if (theme === undefined || seen.has(theme.id)) continue
    seen.add(theme.id)
    themes.push(theme)
  }
  themes.sort((a, b) => b.ms - a.ms || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
  const wall = sha256.trim().toLowerCase()
  const on = wall === '' ? undefined : themes.find(theme => theme.sha256 === wall)
  return themes.map(theme => (theme === on ? { ...theme, inUse: true } : theme))
}

// ---- a seat's shelf
// A seat's shelf, shelves/PART/ beside the room's: no index.md stands in it today (read where one does, as the room's catalog), and no
// rules, which are the room's alone. What stands is told.md, append only, one block a card, `HEAD / @CARD / { walk::PART::told }` at
// (34,3) with the fence `card`, `words` and `theme` (the id of the theme it made, or `none`), and for the artist alone themes/.
// The prompt is never read.
export type Told = { id: string; head: string; words: string; theme: string; ms: number }
export type SeatShelf = { entries: CatalogEntry[]; told: Told[]; themes: Theme[] }

// What a seat was told, from the text of told.md: the blocks of the taxonomy walk::PART::told at (34,3) whose terms are the head and the
// at id of the card, newest first (the ULID's time, the greater id first); a card stands once.
export function toldOf(text: string): Told[] {
  const seen = new Set<string>()
  const told: Told[] = []
  for (const block of parseBlocks(text)) {
    if (block.chi !== 'walk' || block.cho !== 'told' || block.lead !== 34 || block.close !== 3) continue
    const terms = NAME_ID.exec(block.words)
    if (terms === null || seen.has(terms[2])) continue
    seen.add(terms[2])
    told.push({ id: terms[2], head: terms[1].trim(), words: fenceWord(block.fence.words), theme: fenceWord(block.fence.theme) || 'none', ms: ulidMs(terms[2]) })
  }
  return told.sort((a, b) => b.ms - a.ms || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
}

// The planks of a seat's shelf: those of planksOf on its catalog with the seat switch (no Rules), then Themes and Told, each left out
// where it is empty. A theme is an item `theme`, or `in use` where it is the one on the wall; a told row is an item `told`, named by its
// head (the card's first words), its id the card's.
export function seatPlanksOf(shelf: SeatShelf, state: Omit<ShelfState, 'entries' | 'rulesText'>): Plank[] {
  const planks = planksOf({ ...state, entries: shelf.entries, rulesText: '' }, true)
  const themes: PlankItem[] = shelf.themes.map(theme => ({ name: theme.name, id: theme.id, what: theme.inUse ? 'in use' : 'theme', how: theme.card, when: '', chi: 'theme', che: '', ms: theme.ms }))
  const told: PlankItem[] = shelf.told.map(row => ({ name: row.head === '' ? row.id : row.head, id: row.id, what: 'told', how: row.words, when: '', chi: 'told', che: row.theme, ms: row.ms }))
  return [
    ...planks,
    ...(themes.length === 0 ? [] : [{ name: 'Themes' as const, count: themes.length, items: themes }]),
    ...(told.length === 0 ? [] : [{ name: 'Told' as const, count: told.length, items: told }]),
  ]
}

// ---- what is new on the shelf (order T4a)
// A record is new on the shelf when its ULID's time is after the newest he has seen on the Shelf place. The records are the room's planks
// but Rules (a rule is his own act or a standing line of rules.md, no walk filed it). The pane keeps the time he has seen in its own file
// `pane-shelf.json` beside pane.json: the first read of a room seeds it (nothing is new then), opening the Shelf place moves it to the
// newest, a reopen of the session reads it again.
export const SHELF_SEEN_FILE = 'pane-shelf.json'
export const shelfSeenPath = (root: string): string => (root === '' ? '' : `${root.replace(/\/+$/, '')}/${SHELF_SEEN_FILE}`)

const recordTimes = (state: ShelfState): number[] => planksOf(state).flatMap(plank => (plank.name === 'Rules' ? [] : plank.items.map(item => item.ms)))

// The time of the newest record of the shelf, 0 for a shelf with none.
export const newestRecord = (state: ShelfState): number => recordTimes(state).reduce((most, ms) => Math.max(most, ms), 0)

// How many records are new since SEEN; none before the first read has seeded it (SEEN is not yet given).
export const freshCount = (state: ShelfState, seen: number | undefined): number => (seen === undefined ? 0 : recordTimes(state).filter(ms => ms > seen).length)

// The pane's file of the time he has seen: `{"shelfSeen": MS}`. A text that is no such file is no time (the next read seeds again).
export function parseSeen(text: string): number | undefined {
  try {
    const object: unknown = JSON.parse(text)
    const ms = object !== null && typeof object === 'object' ? (object as Record<string, unknown>).shelfSeen : undefined
    return typeof ms === 'number' && Number.isFinite(ms) && ms >= 0 ? ms : undefined
  } catch {
    return undefined
  }
}

export const seenText = (ms: number): string => `${JSON.stringify({ shelfSeen: ms })}\n`
