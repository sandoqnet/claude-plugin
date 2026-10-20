// What the shelf place shows (order B-P4), read from the room's state: the asks that wait, his rules and
// how many decisions each answered today, the decisions of today and who made them, and the items of the
// catalog, the newest first. Pure, with no `$`, and it imports no view and no host module. A key the walk does
// not hold leaves its part out, and no section is ever guessed. Run by `node` too: no enums, `import type`,
// `.ts` in imports.
import { ID_FIRST, blockWords, fenceText, idOf, parseBlocks, preview, stripUlid } from './blocks.ts'
import type { Decision } from './gate.ts'
import { dateOf, ulidMs } from './profile.ts'
import type { WalkText } from './profile.ts'
import { itemFacts } from './shelf.ts'
import type { CatalogEntry } from './shelf.ts'
import { readOf } from './walkread.ts'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
const WEEKS = 30

// An open ask of a card, of any day.
export type Wait = { cardId: string; askId: string; question: string }
// A rule that stands, the decisions of today that it answered, and who made them ("the keeper" when the keeper
// made them all, else the words of who answered; none when it answered none today).
export type PlaceRule = { id: string; words: string; today: number; by: string }
// A decision of today: the card's first words, then ":" and the choice; and who answered.
export type Answered = { cardId: string; words: string; who: string }
// An item of the catalog: its name, its id, what it is, how it came, and when.
export type ShelfItem = { name: string; id: string; what: string; how: string; when: string }

export type ShelfPlace = { waits: Wait[]; rules: PlaceRule[]; answered: Answered[]; shelf: ShelfItem[] }

export type ShelfState = {
  walks: WalkText[]
  entries: CatalogEntry[]
  // The text of rules.md of the room shelf.
  rulesText: string
  now: number
  // The clock's offset from UTC in minutes: the day of `now` and of every time is read in it.
  zone?: number
}

export const dayOf = (ms: number, zone: number): number => Math.floor((ms + zone * MINUTE) / DAY)

// Who answered, in the words of the shelf: "you", "the keeper", "you and SEAT" when his tap sent a seat's draft.
// Empty when the decision does not say (a decision of the door or of a match is no answer of his or the keeper's).
export function whoOf(decision: Decision): string {
  if (decision.by === 'keeper') return 'the keeper'
  if (decision.by === 'you') return decision.draftedBy === undefined ? 'you' : `you and ${decision.draftedBy}`
  return ''
}

// His rules that stand: each block `WORDS / { keeper::ask::rule }` of rules.md, and no rule a later block
// `@RULEID / { keeper::ask::withdrawn }` took off. A rule with no id or no words is left out.
export function standingRules(rulesText: string): { id: string; words: string }[] {
  const rules = new Map<string, { id: string; words: string }>()
  for (const block of parseBlocks(rulesText)) {
    if (block.chi !== 'keeper' || block.che !== 'ask') continue
    if (block.cho === 'rule') {
      const id = idOf(block)
      const words = blockWords(block.words)
      if (id !== '' && words !== '') rules.set(id, { id, words })
    } else if (block.cho === 'withdrawn') {
      const id = ID_FIRST.exec(block.words)?.[1]
      if (id !== undefined) rules.delete(id)
    }
  }
  return [...rules.values()]
}

// A rule of the keeper as Settings lists it (order B-S3): its words, its note (the line under the rule in rules.md,
// none when it has none) and how many decisions of today carry its `rule: "@ID"`.
export type RuleToday = { id: string; words: string; note: string; today: number }

// The rules that stand, each with its note and its count today. `today` is a time of the day to count, in ms (the
// pane passes its clock's now) and `zone` the clock's offset from UTC in minutes. A decision counts when it is
// his or the keeper's (as the shelf place counts it) and was made on that day; a rule that was taken off counts
// nowhere. The note is the first line under the rule's block, the ULIDs left out.
export function rulesToday(rulesText: string, walks: WalkText[], today: number, zone = 0): RuleToday[] {
  const day = dayOf(today, zone)
  const counts = new Map<string, number>()
  for (const walk of walks) {
    for (const gate of readOf(walk).gates) {
      const decision = gate.decision
      if (decision?.rule === undefined || whoOf(decision) === '') continue
      if (dayOf(ulidMs(decision.id), zone) !== day) continue
      counts.set(decision.rule, (counts.get(decision.rule) ?? 0) + 1)
    }
  }
  const notes = new Map<string, string>()
  for (const block of parseBlocks(rulesText)) {
    if (block.chi === 'keeper' && block.che === 'ask' && block.cho === 'rule') {
      notes.set(idOf(block), stripUlid(block.body.split('\n')[0] ?? '').trim())
    }
  }
  return standingRules(rulesText).map(rule => ({ ...rule, note: notes.get(rule.id) ?? '', today: counts.get(rule.id) ?? 0 }))
}

// What a record is, "a board", "an item".
const whatOf = (che: string): string => (che === '' ? '' : `${/^[aeiou]/i.test(che) ? 'an' : 'a'} ${che}`)

// The card that grew each record, by the record's id, in one pass over the walks in the order of their ids: the first card whose decision (no intent's)
// holds the id first and has a `grown` key. It is what itemFacts finds for one record at a time, for a catalog of many records (order walks-once).
function grownBy(walks: WalkText[]): Map<string, string> {
  const grown = new Map<string, string>()
  for (const walk of walks) {
    for (const block of readOf(walk).blocks) {
      if (block.cho !== 'decided' || block.chi === 'intent' || block.fence.grown === undefined) continue
      const id = ID_FIRST.exec(block.words)?.[1]
      if (id !== undefined && !grown.has(id)) grown.set(id, walk.id)
    }
  }
  return grown
}

// How a record came: the decision that grew it, by whom, as the card wrote it. Empty when no card holds it.
function howOf(entry: CatalogEntry, walks: WalkText[], grown: Map<string, string>): string {
  // A record with an id is looked up in the one pass over the walks (grownBy); one with none is found by its name, walk by walk.
  const added = entry.id !== '' ? (grown.get(entry.id) ?? '') : itemFacts(entry, walks).addedId
  const walk = walks.find(item => item.id === added)
  if (walk === undefined) return ''
  const decision = readOf(walk).blocks.find(
    block => block.cho === 'decided' && block.chi !== 'intent' && ID_FIRST.exec(block.words)?.[1] === entry.id && block.fence.grown !== undefined,
  )
  if (decision === undefined) return ''
  const by = fenceText(decision, 'by')
  const seat = fenceText(decision, 'drafted_by')
  if (by === 'you') return seat === '' ? 'by your tap' : `you and ${seat}`
  if (by === 'keeper') return 'by the keeper'
  return ''
}

// "today", "yesterday", "3d ago", then the date.
export function whenOf(ms: number, now: number, zone: number): string {
  if (ms <= 0) return ''
  const days = dayOf(now, zone) - dayOf(ms, zone)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return days < WEEKS ? `${days}d ago` : dateOf(ms)
}

export function shelfOf({ walks, entries, rulesText, now, zone = 0 }: ShelfState): ShelfPlace {
  const today = dayOf(now, zone)
  const ordered = [...walks].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const waits: Wait[] = []
  const answered: (Answered & { at: string; rule?: string })[] = []
  for (const walk of ordered) {
    const { gates, read } = readOf(walk)
    // A gate waits until it is answered, of any day.
    for (const gate of gates) if (gate.decision === undefined) waits.push({ cardId: walk.id, askId: gate.askId, question: gate.question })
    const first = preview(read.text)
    for (const gate of gates) {
      const decision = gate.decision
      if (decision === undefined || whoOf(decision) === '') continue
      if (dayOf(ulidMs(decision.id), zone) !== today) continue
      answered.push({ cardId: walk.id, words: first === '' ? decision.choice : `${first}: ${decision.choice}`, who: whoOf(decision), at: decision.id, rule: decision.rule })
    }
  }
  // The order they came: a decision's own ULID sorts by time.
  answered.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))

  const rules = standingRules(rulesText).map(rule => {
    const own = answered.filter(item => item.rule === rule.id)
    const whos = [...new Set(own.map(item => item.who))]
    const by = own.length === 0 ? '' : whos.every(who => who === 'the keeper') ? 'the keeper' : whos.join(', ')
    return { id: rule.id, words: rule.words, today: own.length, by }
  })

  const grown = grownBy(ordered)
  const shelf = entries
    .map((entry, place) => ({ entry, place, ms: ulidMs(entry.id) }))
    .sort((a, b) => b.ms - a.ms || b.place - a.place)
    .map(({ entry, ms }) => ({ name: entry.name, id: entry.id, what: whatOf(entry.che), how: howOf(entry, ordered, grown), when: whenOf(ms, now, zone) }))

  return {
    waits,
    rules,
    answered: answered.map(({ cardId, words, who }) => ({ cardId, words, who })),
    shelf,
  }
}
