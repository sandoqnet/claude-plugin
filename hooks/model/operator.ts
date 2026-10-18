// The operator face's data: the header meta, the chips and the facts line of a card, and the piece table
// of the open card. Pure, with no `$`; the views only lay them out. The layouts and the reading are
// read here, never changed.
import { blockWords, countOf, fenceText, idOf, parentOf, parseBlocks } from './blocks.ts'
import type { Block } from './blocks.ts'
import { fill, pickLayout } from './layouts.ts'
import type { Piece } from './layouts.ts'
import { readingOf } from './reading.ts'
import type { CatalogEntry } from './shelf.ts'
import { capitalize, cleanAnswer, isMuse, opCard, usdText, versionLabel } from './walk.ts'
import type { Card } from './walk.ts'

// A call of the room (the seat's or the keeper's); a reading of the augmenter is none.
export const isCall = (block: Block): boolean => block.chi === 'walk' && block.cho === 'call' && !isMuse(block)
// A call written after its ask was decided carries `late` in its fence; it is never the answer.
export const isLate = (block: Block): boolean => block.fence.late !== undefined && block.fence.late !== false
const msOf = (block: Block): number => Number(block.fence.ms)

// The seat's call: the last call under the route that is not late.
export function seatCall(blocks: Block[]): Block | undefined {
  const route = blocks.find(block => block.cho === 'route')
  if (route === undefined) return undefined
  return blocks.filter(block => isCall(block) && !isLate(block) && parentOf(block) === idOf(route)).at(-1)
}

// What the cards given (the shown ones) cost, in dollars.
export const costOf = (cards: Card[]): number => cards.reduce((sum, card) => sum + opCard(card.id, card.raw).usd, 0)

// "N faults · $COST" over the cards given (the shown ones).
export function headerMeta(cards: Card[]): string {
  const faults = cards.reduce((sum, card) => sum + opCard(card.id, card.raw).faults.length, 0)
  return `${countOf(faults, 'fault')} · $${costOf(cards).toFixed(4)}`
}

// The chips of a card: its act (held, remind, report, question or another), "fault: TEXT" for each
// fault block, and "late call" when a keeper call carries `late`. A card with no decision has none.
export function chipsOf(raw: string): string[] {
  const blocks = parseBlocks(raw)
  const act = blocks.find(block => block.cho === 'decided' && block.chi === 'intent')?.che ?? ''
  const faults = blocks.filter(block => block.cho === 'fault').map(block => `fault: ${blockWords(block.words).slice(0, 100)}`)
  const isLateKeeper = blocks.some(block => isCall(block) && block.che === 'keeper' && isLate(block))
  return [act, ...faults, ...(isLateKeeper ? ['late call'] : [])].filter(chip => chip !== '')
}

const groups = (count: number): string => count.toLocaleString('en-US')

// "decided by BY · route ROUTE · rules vN · MODEL IN in · $USD · S s", each part left out when the walk
// does not hold it; '' for a card with none (a live card). A held card has no route.
export function factsLine(raw: string, versionsText: string): string {
  const blocks = parseBlocks(raw)
  const op = opCard('', raw)
  const route = blocks.find(block => block.cho === 'route')
  const call = seatCall(blocks)
  const parts: string[] = []
  if (op.by !== '') parts.push(`decided by ${op.by}`)
  if (route !== undefined) {
    parts.push(`route ${route.che}`)
    const rules = versionLabel(versionsText, fenceText(route, 'rules'))
    if (rules !== '') parts.push(rules)
  }
  if (call !== undefined) {
    const tokens = Number(call.fence.in)
    const model = capitalize(blockWords(call.words))
    parts.push(call.fence.in === undefined || Number.isNaN(tokens) ? model : `${model} ${groups(tokens)} in`)
  }
  if (op.usd > 0) parts.push(usdText(op.usd))
  if (call !== undefined && route !== undefined) {
    const seconds = (msOf(call) - msOf(route)) / 1000
    if (!Number.isNaN(seconds) && seconds >= 0) parts.push(`${seconds.toFixed(1)} s`)
  }
  return parts.join(' · ')
}

// The act line of the public face: "remind · decided by one match · route seat", each part left out when the
// walk does not hold it; '' for a card with no decision and for a held card (the operator's word).
export function actLine(raw: string): string {
  const op = opCard('', raw)
  if (op.act === 'held') return ''
  return [op.act, op.by === '' ? '' : `decided by ${op.by}`, op.route === '' ? '' : `route ${op.route}`].filter(part => part !== '').join(' · ')
}

// One row of the piece table. A fixed piece with no word in it (the closing dot) has none.
function pieceRow(piece: Piece): string[] {
  if (piece.type === 'text') {
    return /[\p{L}\p{N}]/u.test(piece.words) ? [`fixed · ${piece.words.trim()} · from the layout`] : []
  }
  if (piece.type === 'gap') return [`${piece.role} · not said`]
  if (piece.type === 'said') return [`${piece.role} · ${piece.words} · said, no record`]
  const by = piece.by === '' ? '' : ` · by ${piece.by}`
  return [`${piece.role} · ${piece.name} · ${piece.isNew ? 'new' : 'found'}${by}`]
}

export type PieceTable = { layout: string; rows: string[] }

// The layout that drew the card's slot and one row a piece of it, then the answer row, from the seat's call.
// The room's own layouts are `roomFiles`, the same the slot is drawn with: a room file that wins draws the table.
export function pieceTable(raw: string, entries: CatalogEntry[], roomFiles: Record<string, string> = {}): PieceTable {
  const reading = readingOf(raw, entries)
  const picked = pickLayout(reading, roomFiles)
  const rows = fill(picked.layout, reading).flatMap(pieceRow)
  const call = seatCall(parseBlocks(raw))
  if (call !== undefined) {
    const words = cleanAnswer(call.body).split(/\s+/).filter(word => word !== '').length
    rows.push(`answer · ${capitalize(blockWords(call.words))} · ${countOf(words, 'word')}`)
  }
  return { layout: `layout ${picked.name} from ${picked.layout.source}`, rows }
}
