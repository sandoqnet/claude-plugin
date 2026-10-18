// The toast as the desk's doorbell (order T2, the shelf note toast-news): what rings, in which words, and how many at once. Pure: no host, no view.
// Run by `node` too: no enums, `import type`, `.ts` in imports. The kit's toast takes a text and a time and no press, so a line is words alone;
// the tray's count and the desk are the press away.
import { YOU } from './desk.ts'
import type { DeskItem } from './desk.ts'

// One thing that rang: WHO put it or asked, and WHAT it says (its kind word and its words, or the ask's words).
export type Ring = { who: string; text: string }

// The width of one line of a toast, in characters: a line past it is cut with the ellipsis.
export const TOAST_COLS = 72
// The least room a keeper's note is worth: a note that has less goes, and the ask stands whole.
const NOTE_MIN = 8

const flat = (text: string): string => text.replace(/\s+/g, ' ').trim()

// The text on one line of `cols` characters at most, cut with ` …` where it was longer.
export function fit(text: string, cols: number): string {
  const one = flat(text)
  return one.length <= cols ? one : `${one.slice(0, Math.max(cols - 2, 1)).trimEnd()} …`
}

// The kind word of an item, as a toast and a pile say it: sign, decide, test, read. Another word (a newer sandoq) is drawn as it is.
const KIND_WORD: Record<string, string> = { sign: 'sign', decision: 'decide', test: 'test', reading: 'read' }
export const kindWord = (kind: string): string => KIND_WORD[kind] ?? (flat(kind) === '' ? 'item' : flat(kind))

// WHO: WHAT on one line. A WHO that is empty is the room.
export const ringLine = (ring: Ring): string => fit(`${flat(ring.who) === '' ? 'room' : flat(ring.who)}: ${ring.text}`, TOAST_COLS)

// The keeper's pick of an ask: the ask whole if it fits, then the note in the room that is left; with no room for a note the note goes.
// The line never holds two cut previews: where the ask had to be cut the note is gone.
export function keeperRing(name: string, ask: string, note: string): Ring {
  const who = 'keeper'
  const left = TOAST_COLS - who.length - 2
  const whole = `chose ${flat(name)} for "${flat(ask)}"`
  if (whole.length > left) {
    const bare = `chose ${flat(name)} for ""`.length
    return { who, text: `chose ${flat(name)} for "${fit(ask, Math.max(left - bare, NOTE_MIN))}"` }
  }
  const room = left - whole.length - 2
  return { who, text: flat(note) === '' || room < NOTE_MIN ? whole : `${whole}: ${fit(note, room)}` }
}

// An item of the desk as it rings: its `by` and its kind word with its words.
export const itemRing = (item: DeskItem): Ring => ({ who: item.by, text: `${kindWord(item.kind)} ${flat(item.words)}`.trim() })

// The items of one read of the desk that ring: open, for him, and an id not rung for yet; the oldest first, so the newest comes last. An item
// for a seat, an item done and an item rung for stay quiet.
export function freshRings(items: DeskItem[], seen: ReadonlySet<string>): Ring[] {
  return items
    .filter(item => !item.done && item.for === YOU && !seen.has(item.id))
    .sort((a, b) => a.atMs - b.atMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(itemRing)
}

// What one read rings: nothing, the one line of one thing, or `desk: N new, waits on you` for two or more, with the newest WHO (the last of
// the rings) after it where it fits.
export function bellLine(rings: Ring[]): string {
  if (rings.length === 0) return ''
  if (rings.length === 1) return ringLine(rings[0])
  const head = `desk: ${rings.length} new, waits on you`
  const who = flat(rings[rings.length - 1].who)
  const full = who === '' ? head : `${head}, newest from ${who}`
  return full.length <= TOAST_COLS ? full : head
}
