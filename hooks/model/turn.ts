// The turn of a card: each ask of its walk, open or decided, with its candidates, and the capture bar's
// reading of what the person types. Pure, with no `$`: every time word takes `now` as a value. A
// candidate's choice is `@ULID`, the others are `new` and `none`. Run by `node` too: no enums,
// `import type`, `.ts` in imports.
import { ID_FIRST, blockWords, closerOf, fenceText, idOf, parentOf, parseBlocks, stripUlid } from './blocks.ts'
import type { Block } from './blocks.ts'
import { ageWords, indexWalks, occurrenceMap, toldApart, ulidMs } from './profile.ts'
import type { WalkText } from './profile.ts'
import type { CatalogEntry } from './shelf.ts'
import { usdText } from './walk.ts'

const AT_ID = /@([0-9A-Za-z]{20,})/
const FILE_LINE = /^\s*([^\s|]+:\d+)/

export type Pick = {
  // What a tap sends: `@ULID`, or the name when the candidate holds no ULID.
  choice: string
  name: string
  initial: string
  // What tells it from another of the name: the newest line of its profile, else its kind.
  line: string
  cards: number
  // On a decided ask: this is the one the decision holds.
  chosen: boolean
}

export type Turn = {
  askId: string
  question: string
  // The ask's age from its ULID, '' when it has none.
  age: string
  isOpen: boolean
  // The words of the phrase the ask is about.
  words: string
  hint: string
  picks: Pick[]
  // Choices of the ask's fence beyond new and none, each a plain word to tap.
  extras: string[]
  keeperAsked: boolean
  // Decided: who decided, what the decision took when no candidate is it, the keeper's line, late calls.
  by: string
  outcome: string
  keeperChose: string
  late: string[]
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
const sameName = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

// FILE:LINE of the first quote of a keeper's decision, from its fence, else from the keeper's call.
function quotedFrom(decision: Block, blocks: Block[], askId: string): string {
  const quotes = decision.fence.quotes
  let first = Array.isArray(quotes) ? String(quotes[0] ?? '') : typeof quotes === 'string' ? quotes : ''
  if (first === '') first = blocks.find(block => block.cho === 'call' && block.che === 'keeper' && fenceText(block, 'ask') === askId)?.body.split('\n')[0] ?? ''
  return FILE_LINE.exec(first)?.[1] ?? ''
}

const isLate = (block: Block): boolean => block.fence.late !== undefined && block.fence.late !== false

// Every ask of the card, in walk order. `entries` and `walks` give each candidate its line and its
// card count; with none, a candidate's line is its kind.
export function turnsOf(raw: string, entries: CatalogEntry[] | undefined, walks: WalkText[] | undefined, now: number): Turn[] {
  const blocks = parseBlocks(raw)
  const byId = new Map(blocks.map(block => [idOf(block), block] as const))
  const occurrences = occurrenceMap(indexWalks(walks ?? []))
  return blocks
    .filter(block => block.cho === 'ask')
    .map((ask): Turn => {
      const askId = idOf(ask)
      const decision = closerOf(blocks, ask)
      const chosenId = decision ? (ID_FIRST.exec(decision.words)?.[1] ?? '') : ''
      const phrase = byId.get(parentOf(ask))
      const words = phrase?.cho === 'mention' ? blockWords(phrase.words).split('/')[0].trim() : ''
      const picks = blocks
        .filter(block => block.cho === 'candidate' && parentOf(block) === askId)
        .map((candidate): Pick => {
          const id = AT_ID.exec(candidate.words)?.[1] ?? ''
          const entry = id === '' ? undefined : entries?.find(item => item.id === id)
          const name = blockWords(candidate.words).split('/')[0].trim() || (entry ? stripUlid(entry.name) : '')
          const mine = occurrences.get(id) ?? []
          return {
            choice: id === '' ? name : `@${id}`,
            name,
            initial: name.charAt(0).toUpperCase(),
            line: toldApart(mine) || (entry?.chi ?? candidate.chi),
            cards: new Set(mine.map(item => item.cardId)).size,
            chosen: id !== '' && id === chosenId,
          }
        })
      const offered = Array.isArray(ask.fence.choices) ? ask.fence.choices.map(String) : []
      const shared = picks.some((pick, i) => picks.some((other, j) => i !== j && sameName(pick.name, other.name)))
      const by = decision ? fenceText(decision, 'by') : ''
      const chosen = picks.find(pick => pick.chosen)
      // What a decision took when no candidate is it: a new record, none, or a record the ask did not list.
      const taken = decision ? (blockWords(decision.words).split('/').at(-1) ?? '').trim() : ''
      let outcome = ''
      if (decision && chosen === undefined) outcome = decision.fence.grown !== undefined ? `a new record, ${taken}` : chosenId === '' ? 'none' : taken
      return {
        askId,
        question: capitalize(blockWords(ask.words)),
        age: ageWords(ulidMs(askId), now),
        isOpen: decision === undefined,
        words,
        hint: shared
          ? 'Two on your shelf share the name. Which one, or a new one?'
          : `${words === '' ? '' : `You said ${words}. `}A new one, or none?`,
        picks,
        extras: offered.filter(choice => !/^(new|none)$/i.test(choice)),
        keeperAsked: ask.fence.keeper !== undefined,
        by,
        outcome,
        keeperChose:
          decision && by === 'keeper' && chosen
            ? `the keeper chose ${chosen.name}${quotedFrom(decision, blocks, askId) === '' ? '' : `, from ${quotedFrom(decision, blocks, askId)}`}`
            : '',
        late: blocks
          .filter(block => block.cho === 'call' && block.che === 'keeper' && isLate(block) && fenceText(block, 'ask') === askId)
          .map(block => `the keeper answered late, ${usdText(Number(block.fence.usd) || 0)}`),
      }
    })
}

// ---- the capture bar
export type Target = { line: string; placeholder: string }

export const ROOM_TARGET: Target = { line: 'to the room · a new card', placeholder: 'say to the room' }

// The target of the bar: the open card's first open ask when the feed is open, else the room.
export const targetOf = (open: { question: string } | undefined): Target =>
  open === undefined
    ? ROOM_TARGET
    : { line: `to this card · answers: ${open.question}`, placeholder: 'type new, none or a name' }

export type Answer = { kind: 'tap'; choice: string } | { kind: 'refuse'; text: string }

// What typed words do on an open ask, trimmed and case-blind: new, none or an extra choice taps it, the
// name of exactly one candidate taps its choice, a name two share or any other words is refused with the
// choices named as the pick rows name them.
export function answerOf(typed: string, turn: Turn): Answer {
  const word = typed.trim().toLowerCase()
  if (word === 'new' || word === 'none') return { kind: 'tap', choice: word }
  const extra = turn.extras.find(choice => choice.toLowerCase() === word)
  if (extra !== undefined) return { kind: 'tap', choice: extra }
  const named = turn.picks.filter(pick => pick.name.toLowerCase() === word)
  if (named.length === 1) return { kind: 'tap', choice: named[0].choice }
  const choices = ['new', 'none', ...turn.picks.map(pick => pick.name), ...turn.extras]
  return { kind: 'refuse', text: `not a choice: ${choices.join(', ')}` }
}
