// The profile of one record and the rows of the shelf, from the catalog and the walks of the run folder
// (read only). Pure, with no `$`: every time word takes `now` as a value. A record is named on a
// card by a decision whose first term is its ULID (or by a reference that no decision closed).
import { ID_FIRST, fenceText, idOf, parentOf, preview, stripUlid } from './blocks.ts'
import type { Block } from './blocks.ts'
import { frameNameOf, isDecision } from './reading.ts'
import type { CatalogEntry } from './shelf.ts'
import { readOf } from './walkread.ts'
import type { Read } from './walkread.ts'

export type WalkText = { id: string; text: string }

// ---- time: a block or a card is as old as the first ten letters of its ULID, Crockford base32, ms.
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEKS = 30 * DAY

export function ulidMs(id: string): number {
  if (id.length < 10) return 0
  let ms = 0
  for (const char of id.slice(0, 10).toUpperCase()) {
    const digit = CROCKFORD.indexOf(char)
    if (digit < 0) return 0
    ms = ms * 32 + digit
  }
  return ms
}

export const dateOf = (ms: number): string => (ms > 0 ? new Date(ms).toISOString().slice(0, 10) : '')

// now, Nm, Nh, Nd, then the date.
export function ageWords(ms: number, now: number): string {
  const age = now - ms
  if (ms <= 0) return ''
  if (age < MINUTE) return 'now'
  if (age < HOUR) return `${Math.floor(age / MINUTE)}m`
  if (age < DAY) return `${Math.floor(age / HOUR)}h`
  if (age < WEEKS) return `${Math.floor(age / DAY)}d`
  return dateOf(ms)
}

// ---- the walks, read once: each card's blocks, oldest card first.
export type Indexed = { id: string; first: string; blocks: Block[]; byId: Map<string, Block> }

// Each walk is indexed once for as long as its text stands (order walks-once): the result hangs on the walk's read (walkread.ts), which a changed text
// replaces and a walk that is gone drops, so the index of the same walks a second time is the same objects and parses nothing.
const indexed = new WeakMap<Read, Indexed>()

export function indexWalks(walks: WalkText[]): Indexed[] {
  return [...walks]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(walk => {
      const read = readOf(walk)
      const kept = indexed.get(read)
      if (kept !== undefined) return kept
      const { blocks } = read
      const source = blocks.find(block => block.cho === 'source')
      const made: Indexed = { id: walk.id, first: preview(source?.body ?? ''), blocks, byId: new Map(blocks.map(block => [idOf(block), block] as const)) }
      indexed.set(read, made)
      return made
    })
}

// One place a record is named on a card: the decision (or the unclosed reference), the role it has
// there (every phrase that holds it, `it` too), who decided and when.
export type Occurrence = {
  cardId: string
  first: string
  kind: 'decision' | 'reference'
  ms: number
  by: string
  isGrown: boolean
  // The keeper's quote, FILE:LINE, when the keeper decided it and its call quotes one.
  from: string
  name: string
  chi: string
  roles: { role: string; frame: string }[]
}

const isPhrase = (block: Block): boolean => block.cho === 'mention' && block.chi !== 'verb'
const AT_ID = /@([0-9A-Za-z]{20,})/

function up(block: Block, byId: Map<string, Block>, test: (item: Block) => boolean): Block | undefined {
  let at: Block | undefined = byId.get(parentOf(block))
  for (let hops = 0; at && hops < 20; hops++) {
    if (test(at)) return at
    at = byId.get(parentOf(at))
  }
  return undefined
}

function rolesOf(block: Block, walk: Indexed): { role: string; frame: string }[] {
  const phrase = isPhrase(block) ? block : up(block, walk.byId, isPhrase)
  if (!phrase) return []
  const holders = [phrase, ...walk.blocks.filter(item => item.fence.refers === `@${idOf(phrase)}`)]
  const roles: { role: string; frame: string }[] = []
  for (const holder of holders) {
    const role = fenceText(holder, 'role')
    const verb = up(holder, walk.byId, item => item.chi === 'verb' && item.cho === 'mention')
    const frame = verb === undefined ? '' : frameNameOf(verb)
    if (role !== '' && !roles.some(item => item.role === role && item.frame === frame)) roles.push({ role, frame })
  }
  return roles
}

// FILE:LINE of the first quote of a keeper's decision, from its fence or from the keeper's call under the ask.
function quoteFrom(decision: Block, walk: Indexed): string {
  const quotes = decision.fence.quotes
  let first = Array.isArray(quotes) ? String(quotes[0] ?? '') : typeof quotes === 'string' ? quotes : ''
  if (first === '') {
    const call = walk.blocks.find(block => block.cho === 'call' && fenceText(block, 'ask') === parentOf(decision))
    first = call?.body.split('\n')[0] ?? ''
  }
  return /^\s*([^\s|]+:\d+)/.exec(first)?.[1] ?? ''
}

// Every record's occurrences, by catalog ULID, in the order of the cards (oldest first).
export function occurrenceMap(walks: Indexed[]): Map<string, Occurrence[]> {
  const out = new Map<string, Occurrence[]>()
  const add = (id: string, occurrence: Occurrence) => out.set(id, [...(out.get(id) ?? []), occurrence])
  for (const walk of walks) {
    const decisions = walk.blocks.filter(isDecision)
    for (const block of decisions) {
      const id = ID_FIRST.exec(block.words)?.[1]
      if (id === undefined) continue
      const by = fenceText(block, 'by')
      add(id, {
        cardId: walk.id,
        first: walk.first,
        kind: 'decision',
        ms: ulidMs(idOf(block)) || ulidMs(walk.id),
        by,
        isGrown: block.fence.grown !== undefined,
        from: by === 'keeper' ? quoteFrom(block, walk) : '',
        name: stripUlid(block.words).replace(/\/{2,}/g, '/').replace(/^[\s/]+|[\s/]+$/g, '').split('/').at(-1) ?? '',
        chi: block.chi,
        roles: rolesOf(block, walk),
      })
    }
    for (const block of walk.blocks.filter(item => item.cho === 'reference')) {
      const id = AT_ID.exec(block.words)?.[1]
      if (id === undefined) continue
      const isClosed = decisions.some(item => ID_FIRST.exec(item.words)?.[1] === id && up(item, walk.byId, other => other === block))
      if (isClosed) continue
      add(id, {
        cardId: walk.id,
        first: walk.first,
        kind: 'reference',
        ms: ulidMs(idOf(block)) || ulidMs(walk.id),
        by: '',
        isGrown: false,
        from: '',
        name: stripUlid(block.words).split('/')[0].trim(),
        chi: block.chi,
        roles: rolesOf(block, walk),
      })
    }
  }
  return out
}

const cardsOf = (occurrences: Occurrence[]): string[] => [...new Set(occurrences.map(item => item.cardId))]

// ---- about: one line a role the record has on a card, newest card first.
export type About = { text: string; cardId: string; first: string; when: string }

export function aboutText(role: string, frame: string): string {
  if (role === '') return 'named'
  return frame === '' ? `the ${role}` : `the ${role} of ${frame}`
}

export function aboutOf(occurrences: Occurrence[], now: number): About[] {
  const lines: About[] = []
  for (const item of [...occurrences].reverse()) {
    const texts = item.roles.length === 0 ? ['named'] : item.roles.map(one => aboutText(one.role, one.frame))
    for (const text of texts) {
      if (lines.some(line => line.cardId === item.cardId && line.text === text)) continue
      lines.push({ text, cardId: item.cardId, first: item.first, when: ageWords(ulidMs(item.cardId), now) })
    }
  }
  return lines
}

// What tells a record from another of its name: the newest about line, '' when no card names it.
export const toldApart = (occurrences: Occurrence[]): string => aboutOf(occurrences, 0)[0]?.text ?? ''

// The line a slot gives a person piece when two records share the name.
export function lineFor(entry: CatalogEntry, walks: WalkText[]): string {
  return toldApart(occurrenceMap(indexWalks(walks)).get(entry.id) ?? [])
}

// ---- the profile
export type Moment = { when: string; text: string; by: string; from: string; cardId: string; ms: number }
export type Connection = { id: string; name: string; kind: string; cards: number }
export type ProfileView = {
  name: string
  chi: string
  che: string
  id: string
  since: string
  origin: string
  about: About[]
  connections: Connection[]
  moments: Moment[]
  references: { cardId: string; first: string }[]
}

function originOf(occurrences: Occurrence[]): string {
  const grown = occurrences.find(item => item.isGrown)
  if (grown) return `new, by ${grown.by || 'you'}`
  const by = occurrences.find(item => item.kind === 'decision')?.by ?? ''
  if (by === 'keeper') return 'by the keeper'
  if (by === 'one match') return 'found by one match'
  return by === '' ? '' : `found by ${by}`
}

export function profileOf(entry: CatalogEntry, entries: CatalogEntry[] | undefined, walks: WalkText[], now: number): ProfileView {
  const map = occurrenceMap(indexWalks(walks))
  const mine = map.get(entry.id) ?? []
  const mineCards = new Set(cardsOf(mine))
  const connections: Connection[] = []
  for (const [id, others] of map) {
    if (id === entry.id) continue
    const shared = cardsOf(others).filter(card => mineCards.has(card)).length
    if (shared === 0) continue
    const row = entries?.find(item => item.id === id)
    connections.push({ id, name: row ? stripUlid(row.name) : others[0].name, kind: row?.chi ?? others[0].chi, cards: shared })
  }
  connections.sort((a, b) => b.cards - a.cards || a.name.localeCompare(b.name))
  const moments = mine
    .map(item => ({
      when: ageWords(item.ms, now),
      text: item.kind === 'reference' ? 'matched' : item.isGrown ? 'added as new' : 'named',
      by: item.by,
      from: item.from,
      cardId: item.cardId,
      ms: item.ms,
    }))
    .sort((a, b) => a.ms - b.ms)
  return {
    name: stripUlid(entry.name),
    chi: entry.chi,
    che: entry.che,
    id: entry.id,
    since: dateOf(ulidMs(entry.id)),
    origin: originOf(mine),
    about: aboutOf(mine, now),
    connections,
    moments,
    references: [...cardsOf(mine)].reverse().map(cardId => ({ cardId, first: mine.find(item => item.cardId === cardId)?.first ?? '' })),
  }
}

// One moment as a line: when, what, the card, by whom, and the keeper's quote.
export const momentLine = (moment: Moment, first: string): string =>
  [moment.when, moment.text, first, moment.by === '' ? '' : `by ${moment.by}`, moment.from === '' ? '' : `from ${moment.from}`]
    .filter(part => part !== '')
    .join(' · ')

// ---- the shelf
export type Row = { id: string; name: string; chi: string; che: string; line: string; cards: number; ms: number }
export type Section = { chi: string; title: string; rows: Row[] }
export type ShelfView = { total: number; newToday: number; sections: Section[]; byTime: Row[] }

const TITLES: Record<string, string> = { person: 'people', document: 'documents' }
const RANK = ['person', 'document']

export function shelfOf(entries: CatalogEntry[], walks: WalkText[], now: number): ShelfView {
  const map = occurrenceMap(indexWalks(walks))
  const today = dateOf(now)
  const rows = entries.map((entry): Row => {
    const occurrences = map.get(entry.id) ?? []
    const cards = cardsOf(occurrences).length
    const line = cards === 0 ? 'not named yet' : cards === 1 ? 'named once' : toldApart(occurrences)
    return { id: entry.id, name: stripUlid(entry.name), chi: entry.chi, che: entry.che, line, cards, ms: ulidMs(entry.id) }
  })
  const newToday = entries.filter(entry => (map.get(entry.id) ?? []).some(item => item.isGrown && dateOf(item.ms) === today)).length
  const chis = [...new Set(rows.map(row => row.chi))].sort((a, b) => {
    const rank = (chi: string): number => (RANK.includes(chi) ? RANK.indexOf(chi) : RANK.length)
    return rank(a) - rank(b) || a.localeCompare(b)
  })
  const sections = chis.map(chi => ({
    chi,
    title: TITLES[chi] ?? chi,
    rows: rows.filter(row => row.chi === chi).sort((a, b) => a.name.localeCompare(b.name)),
  }))
  const byTime = [...rows].sort((a, b) => b.ms - a.ms || a.name.localeCompare(b.name))
  return { total: rows.length, newToday, sections, byTime }
}
