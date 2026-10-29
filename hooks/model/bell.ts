// The toast as the desk's doorbell (order T2, the shelf note toast-news): what rings, in which words, and how many at once. Pure: no host, no view.
// Run by `node` too: no enums, `import type`, `.ts` in imports. The kit's toast takes a text and a time and no press, so a line is words alone;
// the tray's count and the desk are the press away.
import { YOU } from './desk.ts'
import type { DeskItem } from './desk.ts'
import { senderOf } from './mail.ts'
import type { Mail } from './mail.ts'

// One thing that rang: WHO put it or asked, and WHAT it says (its kind word and its words, or the ask's words). `on` is what the words are on, where the feed's
// answer says it: the line reads `WHO on ON: WHAT`, and WHO alone stays the name of the newest in a fold.
export type Ring = { who: string; text: string; on?: string; mail?: boolean }

// The width of one line of a toast, in characters: a line past it is cut with the ellipsis.
export const TOAST_COLS = 72
// The least room a keeper's note is worth: a note that has less goes, and the ask stands whole.
const NOTE_MIN = 8
// The least of the words of a feed toast that stand when its `on` is cut to make room.
const WORDS_MIN = 24

const flat = (text: string): string => text.replace(/\s+/g, ' ').trim()

// The text on one line of `cols` characters at most, cut with ` …` where it was longer.
export function fit(text: string, cols: number): string {
  const one = flat(text)
  return one.length <= cols ? one : `${one.slice(0, Math.max(cols - 2, 1)).trimEnd()} …`
}

// The kind word of an item, as a toast and a pile say it: sign, decide, test, read. Another word (a newer sandoq) is drawn as it is.
const KIND_WORD: Record<string, string> = { sign: 'sign', decision: 'decide', test: 'test', reading: 'read' }
export const kindWord = (kind: string): string => KIND_WORD[kind] ?? (flat(kind) === '' ? 'item' : flat(kind))

// WHO: WHAT on one line, or WHO on ON: WHAT where the ring is on something. A WHO that is empty is the room. The words come first: ON is cut so that
// at least WORDS_MIN characters of WHAT stand (or all of WHAT where it is shorter), and with no room for a cut ON the line is WHO: WHAT.
export function ringLine(ring: Ring): string {
  const who = flat(ring.who) === '' ? 'room' : flat(ring.who)
  const words = flat(ring.text)
  const on = flat(ring.on ?? '')
  // the words that stand: all of them where they are WORDS_MIN or fewer, else WORDS_MIN and the ` …` of their cut
  const room = TOAST_COLS - who.length - ' on '.length - ': '.length - Math.min(words.length, WORDS_MIN + 2)
  if (on === '' || room < NOTE_MIN) return fit(`${who}: ${words}`, TOAST_COLS)
  return fit(`${who} on ${fit(on, room)}: ${words}`, TOAST_COLS)
}

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

// A mail that came in (order G2 M2) as it rings: `mail: NAME, SUBJECT`, NAME the sender's name else its address. A mail with no subject rings the sender alone.
export const mailRing = (mail: Mail): Ring => ({ who: 'mail', text: flat(mail.subject) === '' ? senderOf(mail) : `${senderOf(mail)}, ${flat(mail.subject)}`, mail: true })

// What one read rings: nothing, the one line of one thing, or `desk: N new, waits on you` for two or more, with the newest WHO (the last of
// the rings) after it where it fits.
export function bellLine(rings: Ring[]): string {
  if (rings.length === 0) return ''
  if (rings.length === 1) return ringLine(rings[0])
  // two mails or more of one read, and nothing else: they wait on nobody, so the line does not say they wait on him
  if (rings.every(ring => ring.mail === true)) return fit(`mail: ${rings.length} new, newest ${flat(rings[rings.length - 1].text)}`, TOAST_COLS)
  const head = `desk: ${rings.length} new, waits on you`
  const who = flat(rings[rings.length - 1].who)
  const full = who === '' ? head : `${head}, newest from ${who}`
  return full.length <= TOAST_COLS ? full : head
}
