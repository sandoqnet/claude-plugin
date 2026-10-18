// The rows of a walk, for the walk tab of a letter (order W2, the model alone): the blocks of a walk file in the order of the file, each
// with its weight (N,K) as the file says it, its cho, the seat that wrote it, its fields and its quote, and the table of the fields that
// matter for each cho. No view and no arithmetic: the weight is the slashes of the block's header, counted by the walk's own parse
// (parseBlocks of blocks.ts, which parseWalk of walk.ts reads too). Pure, with no `$`. Run by `node` too: no enums, `import type`
// for types, `.ts` in imports.
import { blockWords, depthsOf, fenceText, idOf, parseBlocks } from './blocks.ts'
import type { Block } from './blocks.ts'
import { seatOf } from './motion.ts'
import { choicesText, parseWalk } from './walk.ts'

export type WalkRow = {
  id: string
  // The block's s_open and s_close, the slashes that open and close its header, and the two as the pane says them: `(21,2)`.
  open: number
  close: number
  weight: string
  // The form of the block, `chi::che::cho`, and the last word of it, which the table of the fields is read by.
  form: string
  cho: string
  // The seat that wrote it, as the trace face says it (seatOf of motion.ts): the augmenter, the keeper, you, the seat, else the door.
  writer: string
  // The block's words with the ids taken out: the question of an ask, the name of a mention, the choice of a decision.
  words: string
  // The fields that matter for the cho (see MATTERS), as pairs, in the order of the table. A key the block does not hold is left out.
  matters: [string, string][]
  // Every `key: value` line of the block's fence, in the order of the file, and the quote among them.
  fields: [string, string][]
  quote: string
  // The block's body, whole (the card's text for the first row, the answer of a call).
  body: string
  // How deep the block hangs under its parent: 0 for the first row.
  depth: number
}

// The card's text (as parseWalk says it) and the rows of its walk, in file order. No rows for a text that holds no block.
export type WalkRows = { text: string; rows: WalkRow[] }

// The keys of a block that are its own, not what it says: left out of the first-two-fields fallback.
const OWN_KEYS = ['id', 'ms', 'parent']

// The fields that matter, by the block's cho (and its chi or che where the cho alone is too wide). The first rule that fits is the one. A cho
// that no rule fits shows its first two fields that are not its own. The question of an ask, the choice of a decision and the name of a
// mention are the row's `words`, so the rules hold what is left:
//   source: the session the card came from
//   intent decision: by whom, the intent picked, p
//   ask: the choices and the lean
//   decision: by whom and the why
//   keeper call: the model, the note, the cost
//   mention: the frame of a verb, the role
//   route and call: by whom and what it did (`act`, such as held)
export const MATTERS: { cho: string; chi?: string; che?: string; keys: string[] }[] = [
  { cho: 'source', keys: ['session'] },
  { cho: 'decided', chi: 'intent', keys: ['by', 'pick', 'p'] },
  { cho: 'decided', keys: ['by', 'why'] },
  { cho: 'ask', keys: ['choices', 'lean'] },
  { cho: 'call', che: 'keeper', keys: ['model', 'note', 'usd'] },
  { cho: 'mention', keys: ['frame', 'role'] },
  { cho: 'route', keys: ['by', 'act'] },
  { cho: 'call', keys: ['by', 'act'] },
]

// A fence value on one line: a scalar as written, an array or an object as JSON.
const plainOf = (value: unknown): string => (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value))
// The same for a field that matters: the choices of an ask as the pane says them, `new or none`.
const matterOf = (key: string, value: unknown): string => (key === 'choices' && Array.isArray(value) ? choicesText(value.map(String)) : plainOf(value))

// The keys the table gives a block.
export function mattersOf(block: Block): string[] {
  const rule = MATTERS.find(item => item.cho === block.cho && (item.chi === undefined || item.chi === block.chi) && (item.che === undefined || item.che === block.che))
  return rule === undefined ? Object.keys(block.fence).filter(key => !OWN_KEYS.includes(key)).slice(0, 2) : rule.keys
}

function rowOf(block: Block, depth: number): WalkRow {
  const pair = (key: string): [string, string] => [key, matterOf(key, block.fence[key])]
  return {
    id: idOf(block),
    open: block.lead,
    close: block.close,
    weight: `(${block.lead},${block.close})`,
    form: `${block.chi}::${block.che}::${block.cho}`,
    cho: block.cho,
    writer: seatOf(block),
    words: blockWords(block.words),
    matters: mattersOf(block)
      .filter(key => block.fence[key] !== undefined && pair(key)[1] !== '')
      .map(pair),
    fields: Object.keys(block.fence).map((key): [string, string] => [key, plainOf(block.fence[key])]),
    quote: fenceText(block, 'quote'),
    body: block.body,
    depth,
  }
}

export function walkRows(text: string): WalkRows {
  const blocks = parseBlocks(text)
  const depths = depthsOf(blocks)
  return { text: parseWalk(text).text, rows: blocks.map((block, i) => rowOf(block, depths[i])) }
}
