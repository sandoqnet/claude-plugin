// What a card reads from its walk for its gate: an ask, the room's lean, a seat's last draft under it, and
// the decision with the door's word and the rule that answered. Pure, with no `$`, and it imports no view
// and no host module. A key the walk does not hold is left out of the value, never made up. Run by `node`
// too: no enums, `import type`, `.ts` in imports.
import { ID_FIRST, blockWords, fenceText, idOf, namesWords, parentOf, parseBlocks } from './blocks.ts'
import type { Block } from './blocks.ts'

const AT_ID = /@([0-9A-Za-z]{20,})/
// A line of a rule as the keeper's shelf shows it, or as a quote of it: `rules.md:2 | WORDS/{ keeper::ask::rule }///`.
const RULE_LINE = /\|\s*(.*?)\s*\/\{\s*keeper::ask::rule\s*\}\/*\s*$/

// A seat's draft answer under an ask: its block id, the seat, the choice it drafted.
export type Draft = { id: string; by: string; choice: string }

// The door's decision under an ask. `choice` is what it took: the candidate's name, `new` when a record grew,
// else `none`. `by` is you or keeper; `draftedBy` the seat, when his tap sent that seat's draft; `rule` the id
// of the keeper's rule, without the `@`. `detail` is the second term of the decided block of the sandoq disc card (`Update/alpha, beta`:
// the choice, then what it took) as the Room place says the names, the first three and N more past three (namesWords); left out for a
// block of one term, for another card's block and for one that names a record's `@ULID`.
export type Decision = {
  id: string
  choice: string
  detail?: string
  by?: string
  draftedBy?: string
  door?: 'in' | 'out'
  why?: string
  rule?: string
  quotes?: string[]
}

export type Gate = {
  askId: string
  question: string
  choices: string[]
  lean?: string
  draft?: Draft
  decision?: Decision
}

const textKey = (block: Block, key: string): string | undefined => {
  const text = fenceText(block, key)
  return text === '' ? undefined : text
}

// What a decision took: the name of the candidate its `@ULID` names, `new` when it grew a record, else the
// word it holds (`none`).
function choiceOf(decision: Block, blocks: Block[], askId: string): string {
  const id = ID_FIRST.exec(decision.words)?.[1] ?? ''
  if (id !== '') {
    const candidate = blocks.find(block => block.cho === 'candidate' && parentOf(block) === askId && AT_ID.exec(block.words)?.[1] === id)
    if (candidate !== undefined) return blockWords(candidate.words).split('/')[0].trim()
    if (decision.fence.grown !== undefined) return 'new'
    return (blockWords(decision.words).split('/').at(-1) ?? '').trim()
  }
  return blockWords(decision.words).split('/')[0].trim() || 'none'
}

function decisionOf(decision: Block, blocks: Block[], askId: string): Decision {
  const door = fenceText(decision, 'door')
  const rule = fenceText(decision, 'rule').replace(/^@/, '')
  const quotes = decision.fence.quotes
  const lines = Array.isArray(quotes) ? quotes.map(String) : typeof quotes === 'string' && quotes !== '' ? [quotes] : []
  const out: Decision = { id: idOf(decision), choice: choiceOf(decision, blocks, askId) }
  const by = textKey(decision, 'by')
  const draftedBy = textKey(decision, 'drafted_by')
  const why = textKey(decision, 'why')
  // Only the decided block of the sandoq disc card (taxonomy sandoq::disc::decided) says what it took in its second term: the person
  // room's `Kai/contact` has one too (the kind of record), and its line stays the question.
  const tells = decision.chi === 'sandoq' && decision.che === 'disc' && !ID_FIRST.test(decision.words)
  const detail = tells ? namesWords((blockWords(decision.words).split('/')[1] ?? '').split(',').map(name => name.trim()).filter(name => name !== '')) : ''
  if (detail !== '') out.detail = detail
  if (by !== undefined) out.by = by
  if (draftedBy !== undefined) out.draftedBy = draftedBy
  if (door === 'in' || door === 'out') out.door = door
  if (why !== undefined) out.why = why
  if (rule !== '') out.rule = rule
  if (lines.length > 0) out.quotes = lines
  return out
}

function gateFrom(ask: Block, blocks: Block[]): Gate {
  const askId = idOf(ask)
  const offered = ask.fence.choices
  const choices = Array.isArray(offered) ? offered.map(String) : []
  const gate: Gate = { askId, question: blockWords(ask.words), choices }
  const lean = ask.fence.lean
  if (typeof lean === 'string' && choices.includes(lean)) gate.lean = lean
  const draft = blocks.filter(block => block.chi === 'walk' && block.che === 'seat' && block.cho === 'draft' && parentOf(block) === askId).at(-1)
  if (draft !== undefined) gate.draft = { id: idOf(draft), by: fenceText(draft, 'by'), choice: fenceText(draft, 'choice') }
  const decided = blocks.find(block => block.cho === 'decided' && parentOf(block) === askId)
  if (decided !== undefined) gate.decision = decisionOf(decided, blocks, askId)
  return gate
}

// The gate of one ask of a walk, none when the walk holds no such ask.
export function gateOf(raw: string, askId: string): Gate | undefined {
  const blocks = parseBlocks(raw)
  const ask = blocks.find(block => block.cho === 'ask' && idOf(block) === askId)
  return ask === undefined ? undefined : gateFrom(ask, blocks)
}

// Every ask of a walk as a gate, in walk order, the waiting ones with no decision.
export function gatesOf(raw: string): Gate[] {
  const blocks = parseBlocks(raw)
  return blocks.filter(block => block.cho === 'ask').map(ask => gateFrom(ask, blocks))
}

// Who answered, in the words of the card: "answered by you", "answered by the keeper", "answered by you and
// SEAT" when his tap sent a seat's draft. Empty when the decision does not say.
export function answeredBy(decision: Decision): string {
  if (decision.by === 'keeper') return 'answered by the keeper'
  if (decision.by === 'you') return decision.draftedBy === undefined ? 'answered by you' : `answered by you and ${decision.draftedBy}`
  return ''
}

// The words of a rule: its line on the room shelf's rules.md when the text is given and holds the id, else the
// line of one of the decision's quotes that is a rule's. None when neither holds them.
export function ruleWords(rule: string, quotes: string[] = [], rulesText = ''): string | undefined {
  const own = parseBlocks(rulesText).find(block => block.chi === 'keeper' && block.che === 'ask' && block.cho === 'rule' && idOf(block) === rule)
  const fromShelf = own === undefined ? '' : blockWords(own.words)
  if (fromShelf !== '') return fromShelf
  for (const quote of quotes) {
    const words = blockWords(RULE_LINE.exec(quote)?.[1] ?? '')
    if (words !== '') return words
  }
  return undefined
}
