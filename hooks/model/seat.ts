// The seat face of the room (order A-S1): which seat each open ask waits on, what waits on this seat, what he
// answered of it lately, and the level up, each seat with a wait. Read from the walks and from shelves/room/
// seats.md. Pure, with no `$`, and it imports no view and no host module. A key the walk or the file does not
// hold leaves its value out, and nothing is guessed. Run by `node` too: no enums, `import type`, `.ts` in
// imports.
//
// seats.md is read as roomplace.ts reads it (a block `NAME / ROLE / { room::seat::role }` a seat, in file order),
// and two keys of the block's fence besides, which seatsOf does not read: `kind` (a desk, a seat; a seat when it
// is not there) and `folder` (the seat's folder relative to the room; '' when it is not there). A seat line holds
// no session: a card names its seat in the fence of its root.
import { blockWords, fenceText, idOf, parentOf, parseBlocks, preview } from './blocks.ts'
import type { Block } from './blocks.ts'
import { reasonOf } from './gate.ts'
import type { AskWhy, Decision, Draft } from './gate.ts'
import { ageWords, ulidMs } from './profile.ts'
import type { WalkText } from './profile.ts'
import type { CatalogEntry } from './shelf.ts'
import { turnsOf } from './turn.ts'
import type { Turn } from './turn.ts'
import { readOf } from './walkread.ts'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
// An answered wait folds to one line for this long.
export const FOLD_MS = 10 * MINUTE

// A seat of seats.md: its name, its kind and its folder relative to the room. `told` is the kind the line SAYS ('' when its fence has
// no `kind`): `kind` falls back to a seat, which is no word of the room's, so a line that says who a seat is reads `told`.
// `role` is the word after the slash of the line's title ("lab / builder": builder), '' when the line has none.
export type SeatEntry = { name: string; kind: string; folder: string; told: string; role: string }

// An open ask, and the seat it waits on. `from` is the seat that asks ('' for a card of his own); `form` is an ask
// that offers no choice, so he writes his words: an input form, where the other is a gate.
export type SeatWait = {
  cardId: string
  askId: string
  seat: string
  from: string
  title: string
  body: string
  why: string
  age: string
  form: boolean
  // What gate.ts gives for the ask: the picks it offers (none for a form), the pick the room leans to ('' for none)
  // and the draft a seat made under it, as it stands in the walk (`choice` still holds its ULID, if any).
  choices: string[]
  lean: string
  draft?: Draft
  // Why the keeper asked a name (from, quote, what each choice does), where the ask's fence holds it.
  reason?: AskWhy
  // A card said TO this seat (order C3): its wait is on its receiver until a card of that seat answers it. `by` is the seat
  // that said it ('' for his own voice). It has no ask: `askId` names the receiver, `form` is true and no choice is offered.
  said?: { by: string }
}
// An ask he answered a moment ago: what he took, and the ask's title. `detail` is the second term of its decided block, where it has
// one (`Update/alpha, beta`: alpha, beta); left out for a decision of one term, whose line says the title.
export type Fold = { cardId: string; askId: string; act: string; title: string; detail?: string }

export type SeatFace = {
  seat: string
  // The open asks of this seat, the oldest first.
  waits: SeatWait[]
  // How many open asks wait on the other seats.
  others: number
  // The asks of this seat he answered today, by the local day.
  answeredToday: number
  // The asks of this seat he answered in the last 10 minutes, the oldest first.
  folds: Fold[]
  // Every ask of this seat he answered today, the oldest first ("Answered today N ›" shows them whole).
  today: Fold[]
}

// One seat of the level up with a wait: its count and the title of its first (oldest) wait.
export type LevelRow = { name: string; kind: string; here: boolean; count: number; first: string; told: string; role: string }
export type Level = {
  // Every open ask of the room, the seats that have one, and the seats the room knows.
  total: number
  waiting: number
  known: number
  // The seats with a wait, this seat first, then the others in the order of seats.md; the seats with none by name.
  rows: LevelRow[]
  quiet: string[]
}

export type SeatState = {
  walks: WalkText[]
  // The text of shelves/room/seats.md ('' when the file is missing).
  seatsText: string
  // The name of this seat (see seatName).
  seat: string
  now: number
  // The clock's offset from UTC in minutes: a day is read in it.
  zone?: number
  // The shelf's records, to tell two candidates of one name apart; none tells them by their names alone.
  entries?: CatalogEntry[]
}

// What this seat is called when the room names none (no session folder, no line, no name): its waits still sit in a row.
export const THIS_SEAT = 'this seat'
const hereOf = (state: SeatState): string => (state.seat === '' ? THIS_SEAT : state.seat)
const flat = (text: string): string => text.replace(/\s+/g, ' ').trim()
// A fence word, '' when it is missing or `none`.
const wordOf = (block: Block, key: string): string => {
  const text = flat(fenceText(block, key))
  return text === 'none' ? '' : text
}
const dayOf = (ms: number, zone: number): number => Math.floor((ms + zone * MINUTE) / DAY)

// The seats of seats.md, in file order: a seat with no name is left out.
export function seatList(seatsText: string): SeatEntry[] {
  return parseBlocks(seatsText)
    .filter(block => block.chi === 'room' && block.che === 'seat' && block.cho === 'role')
    .map(block => {
      const [name, ...rest] = blockWords(block.words).split('/')
      return {
        name: name.trim(),
        kind: wordOf(block, 'kind') || 'seat',
        folder: wordOf(block, 'folder'),
        told: wordOf(block, 'kind'),
        role: flat(rest.join('/')),
      }
    })
    .filter(seat => seat.name !== '')
}

// Who a seat is, in the room's own word: the kind its line of seats.md says ("desk", "seat"), '' when the line says none or no
// line names the seat. Never a guess: a seat the room does not list has no kind, and one that lists no kind has none.
export const kindTold = (seatsText: string, name: string): string => seatList(seatsText).find(seat => seat.name === name)?.told ?? ''

// The role word of a seat's line of seats.md ("builder" of "lab / builder"), '' when the line has none or no line names the seat.
export const roleTold = (seatsText: string, name: string): string => seatList(seatsText).find(seat => seat.name === name)?.role ?? ''

// The seat whose line in seats.md names this folder (the line's folder is relative to the room, so the folder ends
// with it, the longest line first); with none, the folder's own last name.
export function seatName(folder: string, seatsText: string): string {
  const path = folder.replace(/\/+$/, '')
  let best: SeatEntry | undefined
  for (const seat of seatList(seatsText)) {
    const rel = seat.folder.replace(/^(\.\/)+/, '').replace(/^\/+|\/+$/g, '')
    if (rel === '' || rel === '.') continue
    if (path !== rel && !path.endsWith(`/${rel}`)) continue
    if (best === undefined || rel.length > best.folder.replace(/^(\.\/)+/, '').replace(/^\/+|\/+$/g, '').length) best = seat
  }
  return best === undefined ? path.slice(path.lastIndexOf('/') + 1) : best.name
}

// The seat an open ask waits on: its fence `to` when set; else the fence `seat` of its card's root (card.py --seat
// writes it); else this seat. A gate has no `to`; a session names no seat.
export function seatOfAsk(ask: Block, root: Block | undefined, here: string): string {
  const to = wordOf(ask, 'to')
  if (to !== '') return to
  const seat = root === undefined ? '' : wordOf(root, 'seat')
  return seat === '' ? here : seat
}

// The seat that asks: the fence `from` when set, else ''. An ask that holds a `quote` is the keeper's name ask, whose `from` is who said the words that hold the name
// (model/gate.ts reasonOf), not a seat that asks: it is no seat's question.
export const fromOfAsk = (ask: Block): string => (reasonOf(ask) === undefined ? wordOf(ask, 'from') : '')

type Asked = { wait: SeatWait; decision?: Decision }

// What an ask offers to tap, as the turn of the card has always offered it. An ask with candidates offers each one (its
// name, then its `@ULID`, which stripUlid takes off for the words and which the tap sends alone; two of one name are
// told apart by the line of their profile), then the other choices of its fence, then `new` and `none`. An ask with
// none offers the choices of its fence. An ask that offers nothing is a form: he writes his words.
function choicesOf(blocks: Block[], ask: Block, turns: () => Turn[]): string[] {
  const askId = idOf(ask)
  const offered = Array.isArray(ask.fence.choices) ? ask.fence.choices.map(String) : []
  if (!blocks.some(block => block.cho === 'candidate' && parentOf(block) === askId)) return offered
  const turn = turns().find(item => item.askId === askId)
  const picks = turn?.picks ?? []
  const shared = (name: string): boolean => picks.filter(pick => pick.name.toLowerCase() === name.toLowerCase()).length > 1
  const words = picks.map(pick => {
    if (!pick.choice.startsWith('@')) return pick.name
    return `${shared(pick.name) && pick.line !== '' ? `${pick.name} · ${pick.line}` : pick.name} ${pick.choice}`
  })
  return [...new Set([...words, ...(turn?.extras ?? []), 'new', 'none'])].filter(choice => choice !== '')
}

// Does an ask of a card wait on HIM. A card the harness sent (its source, read by parseWalk: the rule of order B-M5) is the
// session's own: its asks wait on nobody in Public, no count, no toast, no dot, no target, and under Operator they show
// as they are. One rule, the one the slot draws by; the face is the lens the person looks through.
// A mail (order G2 M1) is never his word: it waits on nobody on any face, whatever its text holds.
export const waitsOnHim = (source: string, face: string): boolean => source !== 'mail' && (source !== 'harness' || face === 'operator')

// Every ask of every walk, the open ones with their seat, the decided ones with the decision. The seat face, the level up,
// the line of waits and the letter on the sill are all Public: a card of the harness has no ask in them.
function asksOf(state: SeatState): Asked[] {
  const out: Asked[] = []
  for (const walk of state.walks) {
    const { blocks, read, gates } = readOf(walk)
    if (!waitsOnHim(read.source, 'public')) continue
    const asks = blocks.filter(block => block.cho === 'ask')
    if (asks.length === 0) continue
    const root = blocks.find(block => block.cho === 'source')
    let turns: Turn[] | undefined
    const turnsOfWalk = (): Turn[] => (turns ??= turnsOf(walk.text, state.entries, state.walks, state.now))
    for (const ask of asks) {
      const askId = idOf(ask)
      const gate = gates.find(item => item.askId === askId)
      const choices = choicesOf(blocks, ask, turnsOfWalk)
      const wait: SeatWait = {
        cardId: walk.id,
        askId,
        seat: seatOfAsk(ask, root, hereOf(state)),
        from: fromOfAsk(ask),
        title: blockWords(ask.words),
        body: read.text,
        why: wordOf(ask, 'why'),
        age: ageWords(ulidMs(walk.id), state.now),
        form: choices.length === 0,
        choices,
        lean: gate?.lean ?? '',
        ...(gate?.draft === undefined ? {} : { draft: gate.draft }),
        ...(gate?.reason === undefined ? {} : { reason: gate.reason }),
      }
      out.push({ wait, decision: gate?.decision })
    }
  }
  for (const wait of saidOf(state)) out.push({ wait })
  return out
}

// The wait of one ask whether it is open or decided (order T3): the keeper's pick on the desk opens its ask with its choices, so he can change it.
// None when no walk holds the ask or its card is the harness's.
export function askedWait(state: SeatState, cardId: string, askId: string): SeatWait | undefined {
  return asksOf({ ...state, walks: state.walks.filter(walk => walk.id === cardId) }).find(item => item.wait.askId === askId)?.wait
}

// The seat a card's root names: the fence `seat` ('' for his own voice, a card that names none).
const rootSeatOf = (blocks: Block[]): string => {
  const root = blocks.find(block => block.cho === 'source')
  return root === undefined ? '' : wordOf(root, 'seat')
}

// The waits of the cards said TO seats (order C3): a card whose root holds `to` waits on each receiver until THAT seat says a card
// whose `re` names it. No ask, no session call and no answer block ends it, and a card of his own (no seat) answers for nobody.
// A card said to its own sayer wakes nobody and waits on nobody. The words are the card's, the line says who said it.
function saidOf(state: SeatState): SeatWait[] {
  const reads = state.walks.map(walk => ({ walk, ...readOf(walk) }))
  const answered = new Map<string, Set<string>>()
  for (const { blocks, read } of reads) {
    const by = rootSeatOf(blocks)
    if (read.re === '' || by === '') continue
    answered.set(read.re, (answered.get(read.re) ?? new Set<string>()).add(by))
  }
  const out: SeatWait[] = []
  for (const { walk, blocks, read } of reads) {
    if (read.to.length === 0 || !waitsOnHim(read.source, 'public')) continue
    const by = rootSeatOf(blocks)
    const title = preview(read.text)
    for (const name of new Set(read.to)) {
      if (name === by || answered.get(walk.id)?.has(name) === true) continue
      out.push({
        cardId: walk.id,
        askId: `said.${name}`,
        seat: name,
        from: '',
        title,
        body: read.text === title ? '' : read.text,
        why: `said to you by ${by === '' ? 'you' : by}`,
        age: ageWords(ulidMs(walk.id), state.now),
        form: true,
        choices: [],
        lean: '',
        said: { by },
      })
    }
  }
  return out
}

// The open waits of the room, the oldest first: an ask by its id, a card said to a seat by its own.
const keyOf = (wait: SeatWait): string => (wait.said === undefined ? wait.askId : wait.cardId)
const openOf = (asked: Asked[]): SeatWait[] =>
  asked
    .filter(item => item.decision === undefined)
    .map(item => item.wait)
    .sort((a, b) => {
      const [left, right] = [[keyOf(a), a.cardId, a.askId], [keyOf(b), b.cardId, b.askId]]
      for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1
      return 0
    })

// The face of one seat: its open asks, what waits on the others, what he answered of it today and a moment ago.
export function seatFace(state: SeatState, seat: string = hereOf(state)): SeatFace {
  const asked = asksOf(state)
  const open = openOf(asked)
  const zone = state.zone ?? 0
  const today = dayOf(state.now, zone)
  const own = asked.filter(item => item.wait.seat === seat)
  // An answer of his: the decision names `you` as who decided (the keeper's is not his).
  const hisAnswers = own.flatMap(item => (item.decision?.by === 'you' ? [{ wait: item.wait, decision: item.decision }] : []))
  const foldOf = ({ wait, decision }: { wait: SeatWait; decision: Decision }): Fold => ({
    cardId: wait.cardId,
    askId: wait.askId,
    act: decision.choice,
    title: wait.title,
    ...(decision.detail === undefined ? {} : { detail: decision.detail }),
  })
  const oldest = (a: { decision: Decision }, b: { decision: Decision }): number => (a.decision.id < b.decision.id ? -1 : 1)
  const answeredNow = hisAnswers.filter(({ decision }) => dayOf(ulidMs(decision.id), zone) === today)
  const folds = hisAnswers
    .filter(({ decision }) => {
      const at = ulidMs(decision.id)
      return at > 0 && state.now - at >= 0 && state.now - at <= FOLD_MS
    })
    .sort(oldest)
    .map(foldOf)
  return {
    seat,
    waits: open.filter(wait => wait.seat === seat),
    others: open.filter(wait => wait.seat !== seat).length,
    answeredToday: answeredNow.length,
    folds,
    today: [...answeredNow].sort(oldest).map(foldOf),
  }
}

// A wait's name among the waits: its card and its ask.
export const waitKey = (wait: { cardId: string; askId: string }): string => `${wait.cardId}-${wait.askId}`

// "Not now": the waits set aside (their keys, in the order they were set aside) go after the others, so the next wait
// shows; the others keep their order. A wait that is not there is ignored, and nothing is written to the room.
export function asideLast<T extends { cardId: string; askId: string }>(waits: T[], aside: string[]): T[] {
  const kept = waits.filter(wait => !aside.includes(waitKey(wait)))
  const set = aside.flatMap(key => waits.filter(wait => waitKey(wait) === key))
  return [...kept, ...set]
}

// The level up: each seat with a wait, then the seats with none.
export function level(state: SeatState): Level {
  const open = openOf(asksOf(state))
  const seats = seatList(state.seatsText)
  const home = hereOf(state)
  const names = seats.map(seat => seat.name)
  for (const name of [home, ...open.map(wait => wait.seat)]) if (!names.includes(name)) names.push(name)
  const kindOf = (name: string): string => seats.find(seat => seat.name === name)?.kind ?? ''
  const rowOf = (name: string): LevelRow => {
    const waits = open.filter(wait => wait.seat === name)
    return { name, kind: kindOf(name), here: name === home, count: waits.length, first: waits[0]?.title ?? '', told: kindTold(state.seatsText, name), role: roleTold(state.seatsText, name) }
  }
  const rows = names.map(rowOf).filter(row => row.count > 0)
  const here = rows.filter(row => row.here)
  return {
    total: open.length,
    waiting: rows.length,
    known: names.length,
    rows: [...here, ...rows.filter(row => !row.here)],
    quiet: names.filter(name => !rows.some(row => row.name === name)),
  }
}

// A wait in the window of another seat (order D1, still A2): the wait, and whom it asks. A wait on that seat asks the seat; a wait
// that seat asked of THIS seat asks `you`, and is a letter: `hisOwn`, the one the window opens as under Letters. He answers no wait for a seat.
export type WindowWait = { wait: SeatWait; asks: string; hisOwn: boolean }
export type SeatWindow = { name: string; told: string; role: string; waits: WindowWait[] }

// The window of a seat other than this one: its waits as rows, the oldest first, and the kind and the role its line says.
export function seatWindow(state: SeatState, name: string): SeatWindow {
  const home = hereOf(state)
  const waits = openOf(asksOf(state)).flatMap((wait): WindowWait[] =>
    wait.seat === name ? [{ wait, asks: name, hisOwn: false }] : wait.from === name && wait.seat === home ? [{ wait, asks: 'you', hisOwn: true }] : [],
  )
  return { name, told: kindTold(state.seatsText, name), role: roleTold(state.seatsText, name), waits }
}

// The words of the composer's status, after the door: this seat's waits, or on the level up all of them and
// how many are this seat's.
export function waitsLine(state: SeatState, isLevel = false): string {
  const mine = seatFace(state).waits.length
  if (!isLevel) return mine === 0 ? 'nothing waits on you' : `${mine} waits on you`
  const total = level(state).total
  return total === 0 ? 'nothing waits on you' : `${total} waiting, ${mine} on you`
}
