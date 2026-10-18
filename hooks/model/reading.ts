// The reading of a card for the layouts: the act, the frames and the phrases with the record each one
// found, read from the walk's blocks. Pure, with no `$`. A phrase's record is the decision under it,
// its first term the record's ULID, looked up in the catalog.
import { ID_FIRST, blockWords, fenceText, idOf, parentOf, parseBlocks, stripUlid } from './blocks.ts'
import type { Block } from './blocks.ts'
import type { Phrase, Reading } from './layouts.ts'
import type { CatalogEntry } from './shelf.ts'

export type Found = { id: string; name: string; chi: string; che: string }

const isVerb = (block: Block): boolean => block.cho === 'mention' && block.chi === 'verb'
const isPhrase = (block: Block): boolean => block.cho === 'mention' && block.chi !== 'verb'
export const isDecision = (block: Block): boolean => block.cho === 'decided' && block.chi !== 'intent'

// The record a decision names: its first term `@ULID`, found in the catalog; with no row there, the
// decision's own words and taxonomy. A decision of `none` names no record.
export function foundBy(decision: Block, entries: CatalogEntry[]): Found | undefined {
  const id = ID_FIRST.exec(decision.words)?.[1]
  if (id === undefined) return undefined
  const entry = entries.find(item => item.id === id)
  if (entry) return { id, name: stripUlid(entry.name), chi: entry.chi, che: entry.che }
  return { id, name: blockWords(decision.words).split('/').at(-1)?.trim() ?? '', chi: decision.chi, che: decision.che }
}

// Whether `block` hangs under `ancestorId`, at any depth.
function hangsUnder(block: Block, ancestorId: string, byId: Map<string, Block>): boolean {
  let at: Block | undefined = byId.get(parentOf(block))
  for (let hops = 0; at && hops < 20; hops++) {
    if (idOf(at) === ancestorId) return true
    at = byId.get(parentOf(at))
  }
  return false
}

// The frame of a verb block: the `frame` of its fence in lower case when it holds one (`frame: "Acting"`), else its che. Today
// the che is the frame in lower case; in the next form of the walk it is the sense, and the fence holds the frame. The layouts and
// the profile line take the frame from here alone.
export function frameNameOf(verb: Block): string {
  const named = fenceText(verb, 'frame').trim().toLowerCase()
  return named === '' ? verb.che : named
}

// The nearest verb above a block, '' when it hangs under the act.
function frameOf(block: Block, byId: Map<string, Block>): string {
  let at: Block | undefined = byId.get(parentOf(block))
  for (let hops = 0; at && hops < 20; hops++) {
    if (isVerb(at)) return frameNameOf(at)
    at = byId.get(parentOf(at))
  }
  return ''
}

// A verb is embedded when it fills an open role of another verb (`fills`, as the door writes it: every
// verb hangs under the act) or hangs under one. The root clause is the first verb that is not.
const isEmbedded = (verb: Block, byId: Map<string, Block>): boolean => fenceText(verb, 'fills') !== '' || frameOf(verb, byId) !== ''

const wordsOf = (block: Block): string => blockWords(block.words).split('/')[0].trim()

// A verb that fills an open role of another verb (`fills: ROLE of @ID`) gives that role one phrase: its
// words, then the words of its own phrases in the card's order, with no record. The frame is the frame of
// the verb @ID names, '' when @ID is no verb.
function filledPhrase(verb: Block, blocks: Block[], byId: Map<string, Block>): Phrase | undefined {
  const fills = /^(\S+)\s+of\s+@?(\S+)$/.exec(fenceText(verb, 'fills').trim())
  if (!fills) return undefined
  const target = byId.get(fills[2])
  const own = blocks.filter(block => isPhrase(block) && fenceText(block, 'role') !== '' && hangsUnder(block, idOf(verb), byId))
  return {
    role: fills[1],
    frame: target && isVerb(target) ? frameNameOf(target) : '',
    words: [wordsOf(verb), ...own.map(wordsOf)].join(' '),
    record: undefined,
    isNew: false,
    by: '',
  }
}

export function readingOf(raw: string, entries: CatalogEntry[]): Reading {
  const blocks = parseBlocks(raw)
  const byId = new Map(blocks.map(block => [idOf(block), block] as const))
  const decisions = blocks.filter(isDecision)
  const frames: string[] = []
  for (const block of blocks.filter(isVerb)) if (!frames.includes(frameNameOf(block))) frames.push(frameNameOf(block))
  const rootVerb = blocks.find(block => isVerb(block) && !isEmbedded(block, byId))
  const root = rootVerb === undefined ? '' : frameNameOf(rootVerb)
  const phrases: Phrase[] = []
  for (const block of blocks.filter(item => isVerb(item) || isPhrase(item))) {
    if (isVerb(block)) {
      const filled = filledPhrase(block, blocks, byId)
      if (filled) phrases.push(filled)
      continue
    }
    const role = fenceText(block, 'role')
    if (role === '') continue
    // `it` refers to an earlier phrase, and the decision stands under that one.
    const target = byId.get(fenceText(block, 'refers').replace(/^@/, '')) ?? block
    const decision = decisions.find(item => hangsUnder(item, idOf(target), byId))
    phrases.push({
      role,
      frame: frameOf(block, byId),
      words: wordsOf(block),
      record: decision ? foundBy(decision, entries) : undefined,
      isNew: decision?.fence.grown !== undefined,
      by: decision ? fenceText(decision, 'by') : '',
    })
  }
  const act = blocks.find(block => block.cho === 'decided' && block.chi === 'intent')
  return { act: act?.che ?? '', frames, root, phrases }
}

// The records of the shelf this card decided, each once, with the ULID that opens its profile.
export function touchedOf(raw: string, entries: CatalogEntry[]): Found[] {
  const out: Found[] = []
  for (const block of parseBlocks(raw).filter(isDecision)) {
    const found = foundBy(block, entries)
    if (found && entries.some(item => item.id === found.id) && !out.some(item => item.id === found.id)) out.push(found)
  }
  return out
}
