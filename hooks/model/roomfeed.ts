// The room's feed (order room-feed, part A): feed/GATE.md of the run, append only. Two kinds of block, in the document form of the walks:
//   SAYER / { feed::KIND::entry }   (34,3)  KIND his, row, answer or memory; the fence holds id, session, seat, seq and at; the body is the text whole
//   @ID / { feed::door::answer }    (13,3)  a LATER block, after its entry, that the door wrote: to, card, rule, noul, fault, on and at
//   @ENTRYID / { feed::shape::ask }          (21,2)  a LATER block under his entry, that the keeper wrote: id, shape, title, why, choices, lean, by and at
//   @ASKID Make|Leave / { feed::shape::decided } (13,3) the block that closes an ask: the choice is in the head; by, made (Make only) and at in the fence
// The entry is written before the door asks, so an entry may have no answer yet. Pure, with no `$`: the views only lay out what is read here, and the register
// toasts what freshFeed gives. Run by `node` too: no enums, `import type`, `.ts` in imports.
import { ID_FIRST, fenceText, parseBlocks } from './blocks.ts'
import type { Block } from './blocks.ts'
import type { Ring } from './bell.ts'

// The door's answer to one entry: the addresses it passed the entry to, the card's word, the rule that decided, and the fault that kept it from deciding.
// `n` is the place of the block in the file, so the answers are met in the order they were written. `on` is the first line of what the entry answers (the
// door's key, 60 characters at most); an answer of an older door, or one for an entry that answers nothing known, has none.
export type FeedAnswer = { to: string[]; card: string; rule: string; fault: string; at: string; n: number; on?: string }

// What closed a shape ask: the choice its block's head names (Make or Leave), who took it, the todo it made (Make only; a Leave has none) and when.
export type ShapeDecided = { choice: string; by: string; made: string; at: string }

// The keeper's proposal to make a shape of an entry (a todo), with the words of the entry it stands under. OPEN while no decided block names its id.
export type ShapeAsk = {
  id: string
  entry: string
  words: string
  shape: string
  title: string
  why: string
  choices: string[]
  lean: string
  by: string
  at: string
  atMs: number
  decided?: ShapeDecided
}

// One entry of the feed with its answer, or none while the door has not answered. `shapes` are the asks standing under it, none where it has no ask.
export type FeedEntry = {
  id: string
  kind: string
  sayer: string
  session: string
  seat: string
  seq: string
  at: string
  text: string
  answer?: FeedAnswer
  shapes?: ShapeAsk[]
}

export const TOASTS = 'desk/toasts'

// A fence value as a word: a null, a missing key and `none` are no word.
function wordOf(block: Block, key: string): string {
  const value = block.fence[key]
  if (value === undefined || value === null) return ''
  const word = fenceText(block, key).trim()
  return word === 'none' ? '' : word
}

// The addresses of `to`: a list, or the words on one line apart by commas or spaces; `none` and a missing key are no address.
function addressesOf(block: Block): string[] {
  const value = block.fence.to
  const words = Array.isArray(value) ? value.map(String) : typeof value === 'string' ? value.split(/[\s,]+/) : []
  return [...new Set(words.map(word => word.trim()).filter(word => word !== '' && word !== 'none'))]
}

const sayerOf = (block: Block): string => block.words.replace(/^[\s/]+|[\s/]+$/g, '').trim() || 'room'

// The entries of a feed document in the order they were written, each with the newest answer written for it. An entry with no id and an answer of no entry
// are left out; none of it throws.
export function parseFeed(text: string): FeedEntry[] {
  const entries: FeedEntry[] = []
  const byId = new Map<string, FeedEntry>()
  const decided = new Map<string, ShapeDecided>()
  const asks: ShapeAsk[] = []
  parseBlocks(text).forEach((block, n) => {
    if (block.chi !== 'feed') return
    if (block.che === 'shape') {
      if (block.cho === 'ask') {
        const entry = byId.get(ID_FIRST.exec(block.words)?.[1] ?? '')
        const ask = entry === undefined ? undefined : shapeAskOf(block, entry)
        if (entry === undefined || ask === undefined) return
        entry.shapes = [...(entry.shapes ?? []), ask]
        asks.push(ask)
      } else if (block.cho === 'decided') {
        const id = ID_FIRST.exec(block.words)?.[1] ?? ''
        const choice = block.words.replace(/[\s/]+$/, '').split('/').pop()?.trim() ?? ''
        if (id !== '' && choice !== '' && !decided.has(id)) decided.set(id, { choice, by: wordOf(block, 'by'), made: wordOf(block, 'made'), at: wordOf(block, 'at') })
      }
      return
    }
    if (block.cho === 'entry') {
      const id = fenceText(block, 'id').trim()
      if (id === '' || byId.has(id)) return
      const entry: FeedEntry = { id, kind: block.che, sayer: sayerOf(block), session: wordOf(block, 'session'), seat: wordOf(block, 'seat'), seq: wordOf(block, 'seq'), at: wordOf(block, 'at'), text: block.body }
      byId.set(id, entry)
      entries.push(entry)
    } else if (block.che === 'door' && block.cho === 'answer') {
      const entry = byId.get(ID_FIRST.exec(block.words)?.[1] ?? '')
      if (entry === undefined) return
      const on = firstLineOf(wordOf(block, 'on'))
      entry.answer = { to: addressesOf(block), card: wordOf(block, 'card'), rule: wordOf(block, 'rule'), fault: wordOf(block, 'fault'), at: wordOf(block, 'at'), n, ...(on === '' ? {} : { on }) }
    }
  })
  // A decided block comes after its ask, but it is met by the ask's id, so the order of the file is not trusted.
  for (const ask of asks) {
    const closed = decided.get(ask.id)
    if (closed !== undefined) ask.decided = closed
  }
  return entries
}

// The choices of an ask: a list, or words apart by commas; the two of the contract where the block holds none.
function choicesOf(block: Block): string[] {
  const value = block.fence.choices
  const words = Array.isArray(value) ? value.map(String) : typeof value === 'string' ? value.split(',') : []
  const list = [...new Set(words.map(word => word.trim()).filter(word => word !== ''))]
  return list.length === 0 ? ['Make', 'Leave'] : list
}

// One ask of the fence, or none when it holds no id. `entry` is the entry the block stands under: its words are copied, so the ask is read without it.
function shapeAskOf(block: Block, entry: FeedEntry): ShapeAsk | undefined {
  const id = wordOf(block, 'id')
  if (id === '') return undefined
  const at = wordOf(block, 'at')
  const ms = Date.parse(at)
  return {
    id,
    entry: entry.id,
    words: entry.text,
    shape: wordOf(block, 'shape') || 'todo',
    title: firstLineOf(wordOf(block, 'title')),
    why: firstLineOf(wordOf(block, 'why')),
    choices: choicesOf(block),
    lean: wordOf(block, 'lean'),
    by: wordOf(block, 'by'),
    at,
    atMs: Number.isFinite(ms) ? ms : 0,
  }
}

// What the press and the toast of an ask say: `Make a todo: List the boxes to rent, with prices`.
export const shapeWords = (ask: ShapeAsk): string => `Make a ${ask.shape}: ${ask.title}`

// Every ask of a feed in the order they were written, and the ones still open (no decided block names them).
export const shapeAsks = (entries: FeedEntry[] | undefined): ShapeAsk[] => (entries ?? []).flatMap(entry => entry.shapes ?? [])
export const openShapes = (entries: FeedEntry[] | undefined): ShapeAsk[] => shapeAsks(entries).filter(ask => ask.decided === undefined)

// The first line of a text, cut of its blanks.
export const firstLineOf = (text: string): string => (text.split('\n').find(line => line.trim() !== '') ?? '').replace(/\s+/g, ' ').trim()

// The name of an address as a person reads it: desk/cards is `cards`, desk/toasts is `toasts`; an address of another place stands as it is.
const addressWord = (address: string): string => (address.startsWith('desk/') ? address.slice('desk/'.length) : address)

// Where an entry went, from its answer: `no answer yet`, `fault` with its why, `none`, or its addresses (`cards`, `toasts`).
export function whereWords(entry: FeedEntry): string {
  const answer = entry.answer
  if (answer === undefined) return 'no answer yet'
  if (answer.fault !== '') return `fault: ${firstLineOf(answer.fault)}`
  return answer.to.length === 0 ? 'none' : answer.to.map(addressWord).join(' and ')
}

// One line of the feed view: who said it, what kind it is, the number of a row, the first line of its text and where it went.
export type FeedLine = { id: string; sayer: string; kind: string; seq: string; first: string; where: string }

// The entries newest first as the view lays them out.
export const feedLines = (entries: FeedEntry[]): FeedLine[] =>
  [...entries].reverse().map(entry => ({ id: entry.id, sayer: entry.sayer, kind: entry.kind, seq: entry.seq, first: firstLineOf(entry.text), where: whereWords(entry) }))

// The name of a line: `mara · row 41` for a row (its number), `you · his` for the rest.
export const feedLabel = (line: FeedLine): string => `${line.sayer} · ${line.kind}${line.kind === 'row' && line.seq !== '' ? ` ${line.seq}` : ''}`

// The text of a row without the sayer's name at its head: a row says `mara: the lamp test ended green` and the toast puts the name before the text, so the
// name is cut from the text once. A text that does not begin with the name and a colon stands as it is.
const withoutSayer = (sayer: string, text: string): string => (text.startsWith(`${sayer}:`) ? text.slice(sayer.length + 1).trimStart() : text)

// What one read of the feed rings: the answers not rung for yet, in the order they were written. An answer whose `to` holds desk/toasts rings its entry's
// sayer and text, the text without the sayer's name at its head and the sayer said `SAYER on ON` where the answer says what the entry is on; an answer with
// a fault rings once for a run of faults, one that follows a fault already rung or seen at the pane's start rings nothing, and an answer without a fault ends
// the run. The run is met from the first answer of the file, so a read needs no state of it. `ids` are the entries answered, to be kept as rung.
export function freshFeed(entries: FeedEntry[], seen: ReadonlySet<string>): { rings: Ring[]; ids: string[] } {
  const rings: Ring[] = []
  const answered = entries.filter(entry => entry.answer !== undefined).sort((a, b) => (a.answer?.n ?? 0) - (b.answer?.n ?? 0))
  let run = false
  for (const entry of answered) {
    const answer = entry.answer
    if (answer === undefined) continue
    if (answer.fault !== '') {
      if (!run && !seen.has(entry.id)) rings.push({ who: 'room', text: `the feed door failed: ${firstLineOf(answer.fault)}` })
      run = true
    } else {
      run = false
      if (!seen.has(entry.id) && answer.to.includes(TOASTS)) rings.push({ who: entry.sayer, text: withoutSayer(entry.sayer, entry.text), ...(answer.on === undefined ? {} : { on: answer.on }) })
    }
  }
  return { rings, ids: answered.map(entry => entry.id) }
}
