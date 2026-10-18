// What the Room place shows (order B-P6), read from the files the room writes: who sits
// (shelf/seats.md), what it plays (discs.md) with the update that waits on a walk, the door
// (logs/tick.md and whether it is up), the programs (cache/programs/NAME.md), and what it has grown
// (the blocks of the walks and the records of the catalog). Pure, with no `$`, and it imports no view
// and no host module. A file that is missing or bad leaves its section out, nothing throws and
// nothing is guessed. Run by `node` too: no enums, `import type`, `.ts` in imports.
import { blockWords, idOf, namesWords, parentOf, parseBlocks } from './blocks.ts'
import type { Block } from './blocks.ts'
import { clockText } from './motion.ts'
import type { WalkText } from './profile.ts'
import type { CatalogEntry } from './shelf.ts'

const MINUTE = 60_000

// A seat of shelf/seats.md: its name, its role, and the words of what it may do, as the owner wrote them.
export type Seat = { name: string; role: string; words: string }
// A disc of discs.md and its version; none when the file says `none`.
export type Disc = { name: string; version: string }
// The door. `lastTick` reads "now" under one minute old, else HH:MM:SS in the zone; none with no tick.
// `downSince` is HH:MM of the last tick, only when the door is down. The counts are the tick's, and only when
// the tick's day is today's UTC date (the door counts by UTC).
export type Door = { up: boolean; lastTick: string; downSince: string; ticksToday?: number; usdToday?: number }
// A program of cache/programs/NAME.md: what it is doing, and since when (HH:MM in the zone, none when `at` is bad).
export type Program = { name: string; state: string; since: string }
// A disc of an update that waits: `from` and `page` are '' when the ask says `none` or holds no such key.
export type UpdateDisc = { name: string; from: string; version: string; page: string }
// The newest update that waits: the open ask of `sandoq::disc::ask` on a walk. An ask of one card holds ONE ask for the discs of a
// check: the list `discs` of its fence, one object a disc. `name`, `from`, `version` and `page` are those of its first disc (an ask
// made before the list holds them as its own top keys and has no `discs`), `page` only where the discs of the list share one page.
export type Update = { cardId: string; askId: string; name: string; from: string; version: string; page: string; discs?: UpdateDisc[] }

// What the room has grown: the blocks of all the walks (its steps), the records of the catalog (its items) and,
// of them, the ones whose chi is `media`. The size on disk is not here: the register gives it as `bytes`.
export type Grown = { steps: number; items: number; media: number }

export type RoomPlace = { seats: Seat[]; discs: Disc[]; door: Door; programs: Program[]; update?: Update; grown?: Grown }

export type RoomState = {
  // shelf/seats.md of the room shelf, discs.md and logs/tick.md, each as the text of the file ('' when it is missing).
  seatsText: string
  discsText: string
  tickText: string
  // The text of each file of cache/programs/.
  programs: string[]
  // The records of the catalog of the room shelf, none when the file is missing.
  entries?: CatalogEntry[]
  walks: WalkText[]
  isDoorUp: boolean
  now: number
  // The clock's offset from UTC in minutes.
  zone?: number
}

// A program with nothing to say, or `idle`, is not running.
export const isIdle = (state: string): boolean => state === '' || state.toLowerCase() === 'idle'

const flat = (text: string): string => text.replace(/\s+/g, ' ').trim()
const word = (value: unknown): string => (typeof value === 'string' && value !== 'none' ? flat(value) : '')
const msOf = (value: unknown): number => (typeof value === 'string' ? Date.parse(value) : Number.NaN)
// HH:MM in the zone.
const hourMinute = (ms: number, zone: number): string => clockText(ms, zone).slice(0, 5)

// A name, then the rest after the first slash of a block's words: `keeper/shelf`, `room-seat/0.4.0`.
function split(words: string): [string, string] {
  const text = blockWords(words)
  const at = text.indexOf('/')
  return at < 0 ? [text, ''] : [text.slice(0, at).trim(), text.slice(at + 1).trim()]
}

export function seatsOf(text: string): Seat[] {
  return parseBlocks(text)
    .filter(block => block.chi === 'room' && block.che === 'seat' && block.cho === 'role')
    .map(block => {
      const [name, role] = split(block.words)
      return { name, role, words: flat(block.body) }
    })
    .filter(seat => seat.name !== '')
}

export function discsOf(text: string): Disc[] {
  return parseBlocks(text)
    .filter(block => block.chi === 'sandoq' && block.che === 'disc' && block.cho === 'version')
    .map(block => {
      const [name, version] = split(block.words)
      return { name, version: version === 'none' ? '' : version }
    })
    .filter(disc => disc.name !== '')
}

export function doorOf(tickText: string, isDoorUp: boolean, now: number, zone = 0): Door {
  const door: Door = { up: isDoorUp, lastTick: '', downSince: '' }
  const tick = parseBlocks(tickText)
    .filter(block => block.chi === 'walk' && block.che === 'door' && block.cho === 'tick')
    .at(-1)
  if (tick === undefined) return door
  const last = msOf(tick.fence.last)
  if (!Number.isNaN(last)) {
    door.lastTick = now - last < MINUTE ? 'now' : clockText(last, zone)
    if (!isDoorUp) door.downSince = hourMinute(last, zone)
  }
  // The counts are of the tick's day: they stand only when that day is today's UTC date, because the door counts
  // by UTC, whatever the zone of the clock.
  const today = Number.isFinite(now) ? new Date(now).toISOString().slice(0, 10) : ''
  if (today !== '' && tick.fence.day === today) {
    const { ticks, usd } = tick.fence
    if (typeof ticks === 'number' && Number.isInteger(ticks) && ticks >= 0) door.ticksToday = ticks
    if (typeof usd === 'number' && Number.isFinite(usd) && usd >= 0) door.usdToday = usd
  }
  return door
}

export function programsOf(texts: string[], zone = 0): Program[] {
  const programs: Program[] = []
  for (const text of texts) {
    for (const block of parseBlocks(text)) {
      if (block.chi !== 'room' || block.che !== 'program' || block.cho !== 'state') continue
      const name = blockWords(block.words)
      if (name === '') continue
      const at = msOf(block.fence.at)
      programs.push({ name, state: flat(block.body), since: Number.isNaN(at) ? '' : hourMinute(at, zone) })
    }
  }
  return programs.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}

// The discs of an ask: the objects of the list `discs` of its fence, each with a name and a version (one without is left out). With no
// list, or none of its objects readable, the ask's own top keys name, from, version and page are the one disc (an ask made before the
// list); with none of them either, no disc.
function discsOfAsk(ask: Block): { discs: UpdateDisc[]; listed: boolean } {
  const list = Array.isArray(ask.fence.discs) ? ask.fence.discs : []
  const discs: UpdateDisc[] = []
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue
    const one = item as Record<string, unknown>
    const name = word(one.name)
    const version = word(one.version)
    if (name !== '' && version !== '') discs.push({ name, from: word(one.from), version, page: word(one.page) })
  }
  if (discs.length > 0) return { discs, listed: true }
  const name = word(ask.fence.name)
  const version = word(ask.fence.version)
  return { discs: name !== '' && version !== '' ? [{ name, from: word(ask.fence.from), version, page: word(ask.fence.page) }] : [], listed: false }
}

// The newest open ask of `sandoq::disc::ask` on the walks: no decision under it. An ask with no id, or with no disc that has a name
// and a version, is left out.
export function updateOf(walks: WalkText[]): Update | undefined {
  let newest: Update | undefined
  for (const walk of walks) {
    const blocks = parseBlocks(walk.text)
    for (const ask of blocks) {
      if (ask.chi !== 'sandoq' || ask.che !== 'disc' || ask.cho !== 'ask') continue
      const askId = idOf(ask)
      const { discs, listed } = discsOfAsk(ask)
      if (askId === '' || discs.length === 0) continue
      if (blocks.some(block => block.cho === 'decided' && parentOf(block) === askId)) continue
      if (newest !== undefined && newest.askId >= askId) continue
      const [first] = discs
      const pages = [...new Set(discs.map(disc => disc.page))]
      const update: Update = { cardId: walk.id, askId, name: first.name, from: first.from, version: first.version, page: pages.length === 1 ? pages[0] : '' }
      if (listed) update.discs = discs
      newest = update
    }
  }
  return newest
}

// What the Room place says of an update that waits, after "Waits for you ·": one disc, `NAME VERSION is ready.`; two or more, their
// count and the names of the first three, `2 discs are ready: alpha, beta.` and, past three, `13 discs are ready: alpha, beta, gamma and 10 more.`
export function readyWords(update: Update): string {
  const discs = update.discs ?? []
  if (discs.length < 2) return `${update.name} ${update.version} is ready.`
  return `${discs.length} discs are ready: ${namesWords(discs.map(disc => disc.name))}.`
}

// Media is the one rule of a record: its chi is `media`, whatever its case. The shelf place's planks ask it of one record.
export const isMedia = (entry: CatalogEntry): boolean => entry.chi.toLowerCase() === 'media'

// The steps are the blocks of the walks, the items the records of the catalog, the media the records of the chi
// `media`. None when the room has no step and no item.
export function grownOf(walks: WalkText[], entries: CatalogEntry[]): Grown | undefined {
  const steps = walks.reduce((sum, walk) => sum + parseBlocks(walk.text).length, 0)
  if (steps === 0 && entries.length === 0) return undefined
  return { steps, items: entries.length, media: entries.filter(isMedia).length }
}

// The size on disk as the card says it: "41 MB", one decimal under 10 MB ("2.4 MB"), "620 KB" under 1 MB. Empty
// when the size is not known: no bytes, or none grown.
export function sizeOf(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 999_500) return `${Math.max(1, Math.round(bytes / 1000))} KB`
  const mb = bytes / 1_000_000
  return `${mb < 10 ? String(Math.round(mb * 10) / 10) : String(Math.round(mb))} MB`
}

export function roomOf({ seatsText, discsText, tickText, programs, entries = [], walks, isDoorUp, now, zone = 0 }: RoomState): RoomPlace {
  const place: RoomPlace = {
    seats: seatsOf(seatsText),
    discs: discsOf(discsText),
    door: doorOf(tickText, isDoorUp, now, zone),
    programs: programsOf(programs, zone),
  }
  const update = updateOf(walks)
  if (update !== undefined) place.update = update
  const grown = grownOf(walks, entries)
  if (grown !== undefined) place.grown = grown
  return place
}
