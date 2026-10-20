// The files of the shelf (order shelf-files): a seat's shelf holds records and files, and the pane reads the files with the CLI as its own process
// (`sandoq shelf list --json`, `sandoq shelf list SEAT --json`), never from a folder. This is the check of what the CLI says, the words of a size
// and of a date, and the lines of one seat's shelf. The argv and the press are the host's (host.ts). Pure, with no `$`; it imports no host module and no
// view. Run by `node` too: no enums, `import type` for types, `.ts` in imports.
import { dayOf, whenOf } from './shelfplace.ts'
import type { Plank } from './shelfreads.ts'

// A seat with files: its name, how many files it has and the time of its newest (ms; 0 when the CLI gave none).
export type SeatCount = { seat: string; count: number; newest: number }
export type SeatsRead = { seats: SeatCount[]; total: number }
// A file of a seat's shelf: its path inside the shelf, its length in bytes, its time (ms) and whether the seat made it (`file`) or put it
// there for another seat to read (`put`).
export type ShelfFile = { name: string; length: number; ms: number; kind: 'file' | 'put' }
export type SeatFiles = { seat: string; total: number; files: ShelfFile[] }

// What the pane holds of the files: `read` is false until a read of them has ended; `line` is the one line of why there is nothing to list (an older
// sandoq, a refusal, an answer in a shape the pane does not know), '' while there is a list. `lists` holds the list of a seat by its name, or the one line
// of why that seat's list has none. `seen` is the time (ms) he had seen on the shelf when its window opened: a file after it is new while the window
// stands; none is no file new.
export type SeatList = { line: string; total: number; files: ShelfFile[] }
export type ShelfFilesRead = { read: boolean; line: string; seats: SeatCount[]; total: number; lists: Record<string, SeatList>; seen?: number }

export const NO_FILES: ShelfFilesRead = { read: false, line: '', seats: [], total: 0, lists: {} }

// The time of the newest file of the seats, 0 where none is read or none has a file.
export const newestFile = (read: ShelfFilesRead): number => read.seats.reduce((most, one) => Math.max(most, one.newest), 0)

// Whether a file is new: after the time he had seen when the shelf opened.
export const isNewFile = (read: ShelfFilesRead, ms: number): boolean => read.seen !== undefined && ms > read.seen

// At most this many seats have their list read: the groups of the room's shelf come from them, the rest are `N more seats` in the room app.
export const SEATS_READ_MOST = 6
// The lines of files in a seat group on the room's shelf, always, so the card never moves with the count.
export const GROUP_LINES = 3

export const FILES_BAD = 'The pane does not know the answer of sandoq about the files.'
export const FILES_NONE = 'No files on the shelf yet.'
export const oldLine = (from: string): string => `Files on the shelf come with sandoq ${from}.`
// The dim lines of a read that could not start, one for each way it stops before the CLI is asked (shelf open, so the Files part is drawn).
export const NO_SANDOQ_LINE = 'Files on the shelf: the pane found no sandoq to ask.'
export const VERSION_UNSAID_LINE = 'Files on the shelf: sandoq did not say its version.'
export const VERSION_LATE_LINE = 'Files on the shelf: sandoq did not answer its version in time.'
export const VERSION_NOT_RUN_LINE = 'Files on the shelf: sandoq --version did not run.'
export const SEAT_UNFIT_LINE = "Files not asked: this seat's name is not one sandoq takes."

// A seat's name as the CLI takes it: letters, digits, dash and underscore, the first not a dash.
export const SEAT_NAME = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

// A file's path inside a seat's shelf as the CLI takes it and the pane puts it in an argv: forward slashes, each part not empty, not starting with a
// dash (so it is read as no flag) or a dot, and no control character, no backslash.
export function fileNameFit(name: string): boolean {
  if (name === '' || /[\\\u0000-\u001f\u007f]/.test(name)) return false
  return name.split('/').every(part => part !== '' && !part.startsWith('-') && !part.startsWith('.'))
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; line: string }
const bad = (): { ok: false; line: string } => ({ ok: false, line: FILES_BAD })

const objectOf = (text: string): Record<string, unknown> | undefined => {
  try {
    const value: unknown = JSON.parse(text)
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

const count = (value: unknown): number | undefined => (typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined)

// The time of a date the CLI says (`2026-10-17T14:02:00Z`), in ms; none when it is not a date.
const timeOf = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) return undefined
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : undefined
}

// The answer of `sandoq shelf list --json`: {"seats": [{"seat", "count", "newest"}], "total"}. A seat with no files has a null newest. One bad field
// makes the whole answer one line; never a throw.
export function parseSeats(text: string): Parsed<SeatsRead> {
  const object = objectOf(text)
  const total = count(object?.total)
  if (object === undefined || total === undefined || !Array.isArray(object.seats)) return bad()
  const seats: SeatCount[] = []
  for (const item of object.seats as unknown[]) {
    const one = item !== null && typeof item === 'object' ? (item as Record<string, unknown>) : undefined
    const files = count(one?.count)
    const newest = one?.newest === null ? 0 : timeOf(one?.newest)
    if (one === undefined || typeof one.seat !== 'string' || !SEAT_NAME.test(one.seat) || files === undefined || newest === undefined) return bad()
    seats.push({ seat: one.seat, count: files, newest })
  }
  return { ok: true, value: { seats, total } }
}

// The answer of `sandoq shelf list SEAT --json`: {"seat", "total", "bound", "files": [{"name", "sha256", "length", "date", "kind"}]}, newest first.
// A kind that is neither `file` nor `put`, a name that is not a path of a shelf, or a seat that is not the one asked for is a bad answer.
export function parseList(text: string, seat: string): Parsed<SeatFiles> {
  const object = objectOf(text)
  const total = count(object?.total)
  if (object === undefined || object.seat !== seat || total === undefined || count(object.bound) === undefined || !Array.isArray(object.files)) return bad()
  const files: ShelfFile[] = []
  for (const item of object.files as unknown[]) {
    const one = item !== null && typeof item === 'object' ? (item as Record<string, unknown>) : undefined
    const length = count(one?.length)
    const ms = timeOf(one?.date)
    if (one === undefined || typeof one.name !== 'string' || !fileNameFit(one.name) || typeof one.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(one.sha256) || length === undefined || ms === undefined) return bad()
    if (one.kind !== 'file' && one.kind !== 'put') return bad()
    files.push({ name: one.name, length, ms, kind: one.kind })
  }
  return { ok: true, value: { seat, total, files } }
}

// The one line of a refusal: the first line of what the CLI said on its error stream, whole; else the code it ended with.
export function refusalLine(err: string, code: number | undefined): string {
  const first = err.split('\n').map(line => line.trim()).find(line => line !== '') ?? ''
  return first !== '' ? first : `sandoq shelf list exited ${code ?? 'with no code'}.`
}

// The size of a file: bytes under 1000, KB with one decimal under 1 MB, then MB with one decimal.
export function sizeWords(length: number): string {
  if (!Number.isFinite(length) || length < 0) return ''
  if (length < 1000) return `${Math.floor(length)} B`
  const kb = Math.round(length / 100) / 10
  if (kb < 1000) return `${kb.toFixed(1)} KB`
  return `${(Math.round(length / 100_000) / 10).toFixed(1)} MB`
}

// ---- the words of a date, as the shelf's records say them (shelfplace.ts): "today", "yesterday", "3d ago", then the date
const MINUTE = 60_000
const DAY = 86_400_000

// The day of a file as a shelf record says it.
export const whenWords = whenOf

// The time of a file on the room's shelf: the clock of a file of today, else the day in the words above.
export function whenShort(ms: number, now: number, zone: number): string {
  return whenWords(ms, now, zone) === 'today' ? clockOf(ms, zone) : whenWords(ms, now, zone)
}

// The head of a day in the list of a seat's shelf: the words above, with the first letter up.
export function dayHead(ms: number, now: number, zone: number): string {
  const words = whenWords(ms, now, zone)
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// The clock of a time in the pane's zone (minutes from UTC), HH:MM.
export function clockOf(ms: number, zone: number): string {
  const day = (((ms + zone * MINUTE) % DAY) + DAY) % DAY
  const two = (n: number): string => String(n).padStart(2, '0')
  return `${two(Math.floor(day / 3_600_000))}:${two(Math.floor((day % 3_600_000) / MINUTE))}`
}

// ---- one seat's shelf: records and files in one list by date
// The kind word of a line: a record, a theme or a told row of the seat's planks, a file the seat made, a file put on its shelf for it to read.
export type LineKind = 'record' | 'theme' | 'told' | 'file' | 'put'
// `card` is the card a theme or a told row opens (the card that made it, the card it was told in); '' for the others. `word` is the kind word the line
// says: its kind, but `in use` for the theme that is on the wall.
export type Entry = { kind: LineKind; id: string; name: string; ms: number; size: string; card: string; word: string }
export type Line = { head: string; count: number } | { entry: Entry }

// The entries of a seat's shelf: the items of its planks (a record by its catalog id, a theme or a told row by the id of its card) and its files,
// newest first, a record before a file of the same time.
export function entriesOf(planks: Plank[], files: ShelfFile[]): Entry[] {
  const records: Entry[] = planks.flatMap(plank =>
    plank.items.map((item): Entry => {
      const kind: LineKind = plank.name === 'Themes' ? 'theme' : plank.name === 'Told' ? 'told' : 'record'
      return { kind, id: item.id, name: item.name, ms: item.ms, size: '', card: plank.name === 'Themes' ? item.how : plank.name === 'Told' ? item.id : '', word: item.what === 'in use' ? 'in use' : kind }
    }),
  )
  const made: Entry[] = files.map((file): Entry => ({ kind: file.kind, id: file.name, name: file.name, ms: file.ms, size: sizeWords(file.length), card: '', word: file.kind }))
  const rank = (entry: Entry): number => (entry.kind === 'file' || entry.kind === 'put' ? 1 : 0)
  return [...records, ...made].sort((a, b) => b.ms - a.ms || rank(a) - rank(b) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}

// The pages of the entries, whole pages of `room` lines: a head above each day (the head counts as a line) that says the count of the day's entries
// WHOLE, and a page that starts inside a day draws that day's head again. A page never ends on a head. A list that fits in `room` is one page; else
// the pages are packed again with the `pager` rows kept free. A room of under two lines still holds one entry (with its head) a page.
export type LinePages = { pages: Line[][] }
export function linePages(entries: Entry[], room: number, pager: number, now: number, zone: number): LinePages {
  const perDay = new Map<number, number>()
  for (const entry of entries) perDay.set(dayOf(entry.ms, zone), (perDay.get(dayOf(entry.ms, zone)) ?? 0) + 1)
  const pack = (rows: number): Line[][] => {
    const pages: Line[][] = []
    let page: Line[] = []
    let day: number | undefined
    for (const entry of entries) {
      const mine = dayOf(entry.ms, zone)
      if (page.length > 0 && page.length + (day === mine ? 1 : 2) > rows) {
        pages.push(page)
        page = []
      }
      if (page.length === 0 || day !== mine) page.push({ head: dayHead(entry.ms, now, zone), count: perDay.get(mine) ?? 0 })
      page.push({ entry })
      day = mine
    }
    if (page.length > 0) pages.push(page)
    return pages
  }
  const whole = pack(Math.max(2, room))
  return { pages: whole.length <= 1 ? whole : pack(Math.max(2, room - pager)) }
}
