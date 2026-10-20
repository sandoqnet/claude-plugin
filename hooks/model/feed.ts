// The feed: which card is open, each card's age and asked line, the strip of the asks that wait for
// the person, and the lines of the walk lens. Pure, with no `$`; the views only lay them out.
import { ID_FIRST, blockWords, closerOf, fenceText, fmtMs, parseBlocks, preview } from './blocks.ts'
import { INDENT, capitalize } from './walk.ts'
import type { Card, Walk } from './walk.ts'

// How one card is read: its news (the public words), its walk (the block tree), its trace (the blocks as
// written); on the operator face also its events and its egress, the tabs of the walk panel.
export type Lens = 'news' | 'walk' | 'trace' | 'events' | 'egress'

// The lenses of the public face; the operator face's tabs are model/tree.ts.
export const LENSES: Lens[] = ['news', 'walk', 'trace']

// The lens a face shows: the operator face has no news (its overview is the walk), the public face no
// events or egress tab.
export const lensOn = (lens: Lens, face: 'public' | 'operator' | 'trace'): Lens => {
  if (face === 'operator') return lens === 'news' ? 'walk' : lens
  return lens === 'events' || lens === 'egress' ? 'news' : lens
}

// A card's name is a ULID: ten Crockford characters of time in ms, then the rest.
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function ulidMs(id: string): number {
  if (id.length < 10) return NaN
  let ms = 0
  for (const char of id.slice(0, 10).toUpperCase()) {
    const digit = CROCKFORD.indexOf(char)
    if (digit < 0) return NaN
    ms = ms * 32 + digit
  }
  return ms
}

// now, Nm, Nh or Nd; '' for a name that is no ULID.
export function ageWords(id: string, now: number): string {
  const ms = ulidMs(id)
  if (Number.isNaN(ms)) return ''
  const gap = Math.max(0, now - ms)
  if (gap < MINUTE) return 'now'
  if (gap < HOUR) return `${Math.floor(gap / MINUTE)}m`
  if (gap < DAY) return `${Math.floor(gap / HOUR)}h`
  return `${Math.floor(gap / DAY)}d`
}

const oldestFirst = (cards: Card[]): Card[] => [...cards].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

// The open card: the one asked for, else the newest (the greatest ULID).
export function openCardId(cards: Card[], cardId: string): string {
  if (cards.some(card => card.id === cardId)) return cardId
  return cards.reduce((newest, card) => (card.id > newest ? card.id : newest), '')
}

// What a decision under an ask says: "a new person", "not on the shelf", or the record's name, with
// "by the keeper" when the keeper picked it.
function answerWords(ask: { chi: string }, decided: { words: string; fence: Record<string, unknown> }): string {
  if (decided.fence.grown !== undefined) return `a new ${ask.chi}`
  if (!ID_FIRST.test(decided.words)) return 'not on the shelf'
  const name = blockWords(decided.words).split('/').at(-1) ?? ''
  return decided.fence.by === 'keeper' ? `${name} by the keeper` : name
}

// The answered asks of a card in one line, "asked: Which resume? a new document · Who is Kai? Kai";
// '' when no ask was answered.
export function askedLine(text: string): string {
  const blocks = parseBlocks(text)
  const parts: string[] = []
  for (const ask of blocks.filter(block => block.cho === 'ask')) {
    const decided = closerOf(blocks, ask)
    if (decided !== undefined) parts.push(`${capitalize(blockWords(ask.words))} ${answerWords(ask, decided)}`)
  }
  return parts.length === 0 ? '' : `asked: ${parts.join(' · ')}`
}

export type FeedItem = { card: Card; age: string; isOpen: boolean; asked: string }

// The cards from oldest to newest, each with its age at `now`, its asked line, and whether it is open.
export function feedOf(cards: Card[], cardId: string, now: number): FeedItem[] {
  const open = openCardId(cards, cardId)
  return oldestFirst(cards).map(card => ({
    card,
    age: ageWords(card.id, now),
    isOpen: card.id === open,
    asked: askedLine(card.raw),
  }))
}

// The quiet feed of the Operator lens (Settings, Shows: Gates and questions): only the cards where an ask first shows,
// a gate or an input form, answered or not; the card named stays, so a card he opened is never hidden from him.
export function quietOf(cards: Card[], keepId = ''): Card[] {
  return cards.filter(card => card.id === keepId || parseBlocks(card.raw).some(block => block.cho === 'ask'))
}

// One ask that waits: its question and the first words of its card.
export type StripRow = { cardId: string; question: string; first: string }
// `rows` wait for the person and are counted; `keeper` is asked and is not counted.
export type Strip = { count: number; rows: StripRow[]; keeper: StripRow[] }

export function stripOf(cards: Card[]): Strip {
  const rows: StripRow[] = []
  const keeper: StripRow[] = []
  for (const card of oldestFirst(cards)) {
    const blocks = parseBlocks(card.raw)
    for (const ask of blocks) {
      if (ask.cho !== 'ask' || closerOf(blocks, ask) !== undefined) continue
      const row = { cardId: card.id, question: capitalize(blockWords(ask.words)), first: preview(card.text) }
      if (fenceText(ask, 'keeper') === 'asked') keeper.push(row)
      else rows.push(row)
    }
  }
  return { count: rows.length, rows, keeper }
}

// The strip folded to one line for the public face, "2 wait for you ›"; '' when no ask waits. The
// keeper's asks are not counted, as in the strip.
export function stripLine(strip: Strip): string {
  if (strip.count === 0) return ''
  return `${strip.count} ${strip.count === 1 ? 'waits' : 'wait'} for you ›`
}

// The walk lens: one line a step, its label, its role and its ms, indented under its parent.
export function walkLines(walk: Walk): string[] {
  return walk.steps.map(step => {
    const ms = Number(step.ms)
    const parts = [step.step, step.role, step.ms === '' || Number.isNaN(ms) ? '' : fmtMs(ms)].filter(part => part !== '')
    return `${' '.repeat(step.depth * INDENT)}${parts.join(' · ')}`
  })
}
