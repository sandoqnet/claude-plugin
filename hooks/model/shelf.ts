// The shelf and the run folder's listing: the catalog of records, the cards by time, what each record
// grew from, and what runs. Pure, with no `$`. Run by `node` too (hook.ts imports newestIds): no
// enums, `import type`, `.ts` in imports.
import { ID_FIRST, blockWords, fenceText, idOf, parentOf, preview, stripUlid } from './blocks.ts'
import type { Block } from './blocks.ts'
import { parseWalk } from './walk.ts'
import { readOf } from './walkread.ts'
import type { Read } from './walkread.ts'

// How many of the newest cards the pane lists.
export const SHOWN_CARDS = 8

export type ShelfRecord = { name: string; che: string }
export type CatalogEntry = { name: string; id: string; chi: string; che: string }

// One catalog row, the cha block `//…//NAME/@ULID/{ chi::che::record }///`.
export function catalogRow(line: string): CatalogEntry | null {
  const block = line.match(/^\/+([^/]+?)\/@([0-9A-Za-z]{20,})\/\{\s*([^}]*?)\s*\}\/+\s*$/)
  if (!block) return null
  const fence = block[3].split('::').map(part => part.trim())
  if (fence[2] !== 'record') return null
  return { name: block[1].trim(), id: block[2], chi: fence[0] ?? '', che: fence[1] ?? '' }
}

export function parseCatalog(text: string): ShelfRecord[] {
  return parseCatalogEntries(text).map(entry => ({ name: entry.name, che: entry.che }))
}

export function parseCatalogEntries(text: string): CatalogEntry[] {
  return text.split('\n').map(catalogRow).filter((entry): entry is CatalogEntry => entry !== null)
}

// A card's name is its ULID, which sorts by time: the greatest names are the newest. Newest first,
// the first `count` only (SHOWN_CARDS by default).
export function newestIds(names: string[], count: number = SHOWN_CARDS): string[] {
  return names
    .map(name => name.match(/^([0-9A-Za-z]{20,})\.md$/)?.[1])
    .filter((id): id is string => id !== undefined)
    .sort()
    .reverse()
    .slice(0, count)
}

export type Mention = { id: string; role: string }
export type ItemFacts = { addedId: string; mentions: Mention[] }

// A block's role: its own, else the nearest ancestor's (the mention a decision hangs under).
function roleUp(block: Block, byId: Map<string, Block>): string {
  let at: Block | undefined = block
  for (let hops = 0; at && hops < 20; hops++) {
    const role = fenceText(at, 'role')
    if (role !== '') return role
    at = byId.get(parentOf(at))
  }
  return ''
}

// Which card grew the record (a decision holding its ULID first, with a `grown` key) and which
// later cards decide it again (a decision holding its ULID first). Walks are { id, text }; the
// ULIDs sort by time.
// The decisions of a walk that are no intent's, found once for as long as the walk's text stands (a catalog of many records asks every walk for each).
const decidedKept = new WeakMap<Read, Block[]>()
function decidedOf(read: Read): Block[] {
  const kept = decidedKept.get(read)
  if (kept !== undefined) return kept
  const made = read.blocks.filter(block => block.cho === 'decided' && block.chi !== 'intent')
  decidedKept.set(read, made)
  return made
}

export function itemFacts(entry: CatalogEntry, walks: { id: string; text: string }[]): ItemFacts {
  // The poll's walks come sorted by their names; a sort of two thousand for each record of the catalog is left out when they stand in order.
  const inOrder = walks.every((walk, at) => at === 0 || walks[at - 1].id <= walk.id)
  const ordered = inOrder ? walks : [...walks].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const decisions = ordered.map(walk => {
    const read = readOf(walk)
    const held = decidedOf(read).filter(block =>
      entry.id !== '' ? ID_FIRST.exec(block.words)?.[1] === entry.id : blockWords(block.words) === entry.name,
    )
    return { id: walk.id, held, blocks: read.blocks }
  })
  const added = decisions.find(walk => walk.held.some(block => block.fence.grown !== undefined))
  const mentions: Mention[] = []
  for (const walk of decisions) {
    if (added && walk.id <= added.id) continue
    // the index of the walk's blocks is made for a walk that holds the record only
    const byId = walk.held.length === 0 ? new Map<string, Block>() : new Map(walk.blocks.map(block => [idOf(block), block] as const))
    for (const block of walk.held) {
      const mention = { id: walk.id, role: roleUp(block, byId) || 'decided' }
      if (!mentions.some(m => m.id === mention.id && m.role === mention.role)) mentions.push(mention)
    }
  }
  return { addedId: added?.id ?? '', mentions }
}

// ---- one record's facts as the Item section shows them, from the walks of the run folder (read only):
// its row, the card that grew it with that card's text, and the later cards that name it.
export type ItemView = {
  name: string
  che: string
  chi: string
  id: string
  hasAdded: boolean
  addedText: string
  mentions: (Mention & { text: string })[]
}

export function buildItem(entry: CatalogEntry, walks: { id: string; text: string }[]): ItemView {
  const facts = itemFacts(entry, walks)
  const textOf = (id: string): string => parseWalk(walks.find(walk => walk.id === id)?.text ?? '').text
  return {
    name: entry.name,
    che: entry.che,
    chi: entry.chi,
    id: entry.id,
    addedText: facts.addedId === '' ? '' : textOf(facts.addedId),
    mentions: facts.mentions.map(mention => ({ ...mention, text: textOf(mention.id) })),
    hasAdded: facts.addedId !== '',
  }
}

// The record's facts as plain lines: the id is shown here only; cards are shown by their first words.
export function itemLines(view: ItemView): string[] {
  const lines = [stripUlid(view.name), `kind: ${view.che}`, `class: ${view.chi}`, `id: ${view.id === '' ? 'none' : view.id}`]
  lines.push(view.hasAdded ? `added by: ${preview(view.addedText)}` : 'added by: no card found')
  lines.push(view.mentions.length === 0 ? 'named since: no card' : 'named since:')
  for (const mention of view.mentions) lines.push(`${preview(mention.text)} ${mention.role}`)
  return lines
}

// ---- what runs: the pane's version and each disc unpacked in the run folder.
export type Disc = { name: string; sha: string }

// RUN/unpacked/NAME.record opens with the line `disc SHA` (16 hex); a record of another shape has no sha.
export const parseRecord = (file: string, text: string): Disc => ({
  name: file.replace(/\.record$/, ''),
  sha: text.split('\n')[0].match(/^disc\s+([0-9a-f]{16})\s*$/)?.[1] ?? '',
})

export function whatRuns(version: string, discs: Disc[]): string[] {
  const lines = [`pane ${version}`]
  if (discs.length === 0) lines.push('no discs unpacked')
  for (const disc of [...discs].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    lines.push(`${disc.name} ${disc.sha === '' ? 'no sha' : disc.sha}`)
  }
  return lines
}
