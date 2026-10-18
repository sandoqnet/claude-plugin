// The walk as the node shows it: a tree of blocks, one line a block, and the head and the tabs of the walk
// panel (the operator face). Pure, with no `$`; the views only lay them out. Run by `node` too: no enums,
// `import type` for types, `.ts` in imports.
import { ID_FIRST, blockWords, countOf, depthsOf, fenceText, idOf, parentOf, parseBlocks } from './blocks.ts'
import { ulidMs } from './feed.ts'
import type { Lens } from './feed.ts'
import { fill, pickLayout } from './layouts.ts'
import { clockText, eventsOf } from './motion.ts'
import { chipsOf, pieceTable, seatCall } from './operator.ts'
import { isDecision, readingOf } from './reading.ts'
import type { CatalogEntry } from './shelf.ts'
import { INDENT, capitalize, isListening, opCard, usdText, versionLabel } from './walk.ts'
import type { Card } from './walk.ts'

// What hangs under a block of the tree: the text box under the card's root, the egress box under its route,
// a reading box under the object it reads.
export type Anchor = 'root' | 'route' | 'object' | ''

// One line of the tree: a block, its depth under its parent, its taxonomy as "chi" and "::che::cho", its form
// "(N,K)" (its lead and its close), the count of blocks under it "(C)" ('' for none), and the block as written.
export type TreeRow = {
  index: number
  id: string
  depth: number
  chi: string
  tail: string
  form: string
  count: string
  anchor: Anchor
  header: string
  fenceLines: string[]
}

// The guides of a depth: a thin bar at each indent, the bars INDENT columns apart ("│ │" for depth 2).
export const guidesOf = (depth: number): string => Array.from({ length: Math.max(0, depth) }, () => '│').join(' '.repeat(INDENT - 1))

export function treeRows(raw: string): TreeRow[] {
  const blocks = parseBlocks(raw)
  const depths = depthsOf(blocks)
  const root = blocks.find(block => block.cho === 'source')
  const route = blocks.find(block => block.cho === 'route')
  return blocks.map((block, index) => {
    const kids = blocks.filter(other => idOf(block) !== '' && parentOf(other) === idOf(block)).length
    const anchor: Anchor = block === root ? 'root' : block === route ? 'route' : block.cho === 'object' && block.che === 'source' ? 'object' : ''
    return {
      index,
      id: idOf(block),
      depth: depths[index],
      chi: block.chi,
      tail: `::${block.che}::${block.cho}`,
      form: `(${block.lead},${block.close})`,
      count: kids === 0 ? '' : `(${kids})`,
      anchor,
      header: block.header,
      fenceLines: block.fenceLines,
    }
  })
}

// A piece of the card's sentence as its own line of the tree, one indent in under the route: the glyph, the
// role, the record it found and the form of the decision that found it.
export type PieceLine = { glyph: string; role: string; name: string; form: string }

export function pieceLines(raw: string, entries: CatalogEntry[], roomFiles: Record<string, string> = {}): PieceLine[] {
  const reading = readingOf(raw, entries)
  const picked = pickLayout(reading, roomFiles)
  const decisions = parseBlocks(raw).filter(isDecision)
  return fill(picked.layout, reading).flatMap((piece): PieceLine[] => {
    if (piece.type === 'text') return []
    if (piece.type === 'gap') return [{ glyph: '◇', role: piece.role, name: 'not said', form: '' }]
    if (piece.type === 'said') return [{ glyph: '◇', role: piece.role, name: piece.words, form: '' }]
    const decision = decisions.find(block => ID_FIRST.exec(block.words)?.[1] === piece.id)
    return [{ glyph: '◆', role: piece.role, name: piece.name, form: decision === undefined ? '' : `(${decision.lead},${decision.close})` }]
  })
}

// The chip of the walk panel: failed N while a fault stands, held, waits for an ask, live while the room walks
// the card, else done. `kind` is what the view colors it by.
export type ChipKind = 'fault' | 'held' | 'quiet' | 'live'
export type PanelChip = { text: string; kind: ChipKind }

export function panelChip(card: Card): PanelChip {
  const faults = parseBlocks(card.raw).filter(block => block.cho === 'fault').length
  if (faults > 0) return { text: `failed ${faults}`, kind: 'fault' }
  if (chipsOf(card.raw).includes('held')) return { text: 'held', kind: 'held' }
  if (card.walk.waiting) return { text: 'waits', kind: 'quiet' }
  if (!card.walk.answered) return { text: '● live', kind: 'live' }
  return { text: 'done', kind: 'quiet' }
}

// The time of the card's longest block, in ms: the wall time of its walk.
const longestMs = (card: Card): number =>
  Math.max(0, ...parseBlocks(card.raw).map(block => Number(block.fence.ms)).filter(ms => !Number.isNaN(ms)))

// The head of the walk panel: the card's id, when it ended (its time and its longest block), its chip, and
// "wall 5.58s · 12 events · 9 blocks".
export type PanelHead = { id: string; ended: string; chip: PanelChip; wall: string; events: number; blocks: number }

export function panelHead(card: Card, zone = 0): PanelHead {
  const blocks = parseBlocks(card.raw)
  const longest = longestMs(card)
  const start = ulidMs(card.id)
  return {
    id: card.id,
    ended: Number.isNaN(start) ? '' : clockText(start + longest, zone),
    chip: panelChip(card),
    wall: `wall ${(longest / 1000).toFixed(2)}s`,
    events: eventsOf(card).length,
    blocks: blocks.length,
  }
}

// The tabs of the walk panel, each the lens it shows and its count: overview is the card with its block
// tree (the walk lens), events its motion rows, blocks the trace lens, egress the layout and its pieces.
export type Tab = { label: string; lens: Lens; count: number | undefined }

export function tabsOf(card: Card, entries: CatalogEntry[], roomFiles: Record<string, string> = {}): Tab[] {
  return [
    { label: 'overview', lens: 'walk', count: undefined },
    { label: 'events', lens: 'events', count: eventsOf(card).length },
    { label: 'blocks', lens: 'trace', count: parseBlocks(card.raw).length },
    { label: 'egress', lens: 'egress', count: pieceTable(card.raw, entries, roomFiles).rows.length },
  ]
}

// The wall, the events and the blocks of a head as one machine line.
export const headLine = (head: PanelHead): string => `${head.wall} · ${countOf(head.events, 'event')} · ${countOf(head.blocks, 'block')}`

// One row of the operator lens' list in the place, a card: his words, its state and its wall time. The tone is
// what the view colors the state by: a card at an open ask waits (warn), a fault fails (fault), a held card
// is held (warn), a card the room still walks is live (accent), else done (dim).
export type Tone = 'dim' | 'warn' | 'fault' | 'accent'
export type CardRow = { words: string; state: string; tone: Tone; wall: string }

const LISTENING = 'the room is listening'

export function cardRow(card: Card): CardRow {
  const chip = panelChip(card)
  const words = isListening(card.raw) ? LISTENING : card.text.replace(/\s+/g, ' ').trim()
  const longest = longestMs(card)
  const wall = longest > 0 ? `${(longest / 1000).toFixed(1)}s` : '–'
  if (chip.kind === 'fault') return { words, state: 'failed', tone: 'fault', wall }
  if (chip.kind === 'held') return { words, state: 'held', tone: 'warn', wall }
  if (chip.text === 'waits') return { words, state: 'waits ›', tone: 'warn', wall: '–' }
  if (chip.kind === 'live') return { words, state: 'live', tone: 'accent', wall: '–' }
  return { words, state: 'done', tone: 'dim', wall }
}

// The machine lines of the open card in the place, each a label and its value: the card's ULID, when it ended
// and its wall time, how it was read (the act, who decided, the rules), the route and the seat, the seat's
// reply (the model, the tokens in, the seconds, the cost). A line the walk holds no value for is left out.
export type MachineLine = { label: string; value: string }

export function machineLines(card: Card, versionsText: string, zone = 0): MachineLine[] {
  const blocks = parseBlocks(card.raw)
  const op = opCard(card.id, card.raw)
  const head = panelHead(card, zone)
  const route = blocks.find(block => block.cho === 'route')
  const call = seatCall(blocks)
  const longest = longestMs(card)
  const rules = route === undefined ? '' : versionLabel(versionsText, fenceText(route, 'rules'))
  const seat = route === undefined ? '' : fenceText(route, 'seat')
  const tokens = call === undefined ? NaN : Number(call.fence.in)
  const seconds = call === undefined || route === undefined ? NaN : (Number(call.fence.ms) - Number(route.fence.ms)) / 1000
  const usd = call === undefined ? 0 : Number(call.fence.usd) || 0
  const parts = (...items: string[]): string => items.filter(item => item !== '').join(' · ')
  const lines: MachineLine[] = [
    { label: 'Card', value: card.id },
    { label: 'Ended', value: parts(head.ended, longest > 0 ? `wall ${(longest / 1000).toFixed(1)}s` : '') },
    { label: 'Read as', value: parts(op.act, op.by === '' ? '' : `by ${op.by}`, rules) },
    { label: 'Route', value: route === undefined ? '' : parts(route.che, seat) },
    {
      label: 'Reply',
      value:
        call === undefined
          ? ''
          : parts(
              capitalize(blockWords(call.words)),
              Number.isNaN(tokens) ? '' : `${tokens.toLocaleString('en-US')} in`,
              Number.isNaN(seconds) || seconds < 0 ? '' : `${seconds.toFixed(1)}s`,
              usd > 0 ? usdText(usd) : '',
            ),
    },
  ]
  return lines.filter(line => line.value !== '')
}
