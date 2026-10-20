// The walk of one card and its three faces. Each builder takes the text of a walk (and the catalog or
// versions text where it needs them) and returns plain values; the views only lay them out. Pure,
// with no `$`. Run by `node` too (the hooks import it): no enums, `import type`, `.ts` in imports.
import { ID_FIRST, blockWords, closerOf, depthsOf, fenceText, fmtMs, idOf, parentOf, parseBlocks, preview, stripUlid } from './blocks.ts'
import type { Block } from './blocks.ts'
import type { CatalogEntry } from './shelf.ts'
import { taskOf } from './task.ts'
import type { Task } from './task.ts'

export const STEP_COLUMN = 10
export const INDENT = 2

// The faces of the pane: what the person sees, what the operator sees, the trace.
export type Face = 'public' | 'operator' | 'trace'

// One row of the walk view: a block, indented by its depth under its parent.
export type Step = { ms: string; step: string; notation: string; role: string; rate: string; depth: number }
export type Walk = {
  head: string
  // The card's text (the body of its root block; a harness card's is its one line: a task's title, else the tag in
  // plain words and the first words of its body) and the answer of its call
  // block, if any.
  text: string
  // Who sent the card: the harness (a block it wrote round a prompt) or the person. A harness card's `words` are its
  // block whole with the tags taken out, one line a line; a person's are its text.
  source: Source
  words: string
  // The parts of a task notification (its name, status, ids and output file), drawn from the egress layout `task`;
  // none for any other card.
  task: Task | undefined
  answer: string
  answered: boolean
  steps: Step[]
  choices: string[]
  waiting: boolean
  question: string
  hasFault: boolean
  act: string
  // The session a bridged card names in its root's fence, '' for a card of the pane.
  session: string
  // The seats a card was said TO (order C3): the root's `to`, a list of names on one line. Empty when the root holds none,
  // and when its `to` is not a list of strings (a string, or a list over several lines): never a throw.
  to: string[]
  // The id (no dot) of the card this one answers: the root's `re`. '' when it holds none.
  re: string
  // The instance the room handed the card to, such as `ur`: its route is of kind `door`, names one instance and
  // holds `card` in its fence. '' for a card that was not handed on.
  handedTo: string
  // The board's keys of the frame that answers a handed card (not the block's own id, ms and parent), as plain
  // `[key, value]` pairs, `game` first: the operator face shows them under the answer. Empty when there is no frame.
  frame: [string, string][]
}

// A card is named by the ULID of its root block; the reader sees its first words, never the id.
export type Card = { id: string; text: string; raw: string; walk: Walk }
// A walk of the run folder, by its card id.
export type WalkText = { id: string; text: string }

// ---- the readings of the augmenter: a file's reading, a `walk::muse::call` block labelled caption,
// transcript, draft, watch or extract, hung under the file's object block by `parent`, or naming it in
// `object` when the object was no longer open on the path. A transcription gives two, a draft (fence
// `pass: draft`) and a final, written in one append; the draft ends no wait and is never a card's text.
export const isMuse = (block: Block): boolean => block.chi === 'walk' && block.che === 'muse' && block.cho === 'call'
const isDraft = (block: Block): boolean => isMuse(block) && block.fence.pass === 'draft'
const isObject = (block: Block): boolean => block.cho === 'object' && block.che === 'source'
const isOn = (block: Block, id: string): boolean => parentOf(block) === id || fenceText(block, 'object') === id
const VOICE = 'audio'
// The most characters of a watch or extract reading a line shows.
export const SHOWN = 300
const oneLine = (text: string): string => text.split(/\s+/).filter(word => word !== '').join(' ')
// The label of a reading: its first term.
export const museLabel = (block: Block): string => blockWords(block.words).split('/')[0].trim()

// The final readings under an object block, a draft left out.
const heard = (blocks: Block[], id: string): Block[] => blocks.filter(block => isMuse(block) && !isDraft(block) && isOn(block, id))
// The reading of an object on one line, the final of a two-pass reading, else ''.
const heardText = (blocks: Block[], id: string): string => {
  const first = heard(blocks, id)[0]
  return first === undefined ? '' : oneLine(first.body)
}
// The audio object whose final is the text of a card with no words, the first such; a card with words has none.
// '' when there is none.
function voiceOf(blocks: Block[]): string {
  const source = blocks.find(block => block.cho === 'source')
  if (source === undefined || source.body.trim() !== '') return ''
  const voice = blocks.find(block => isObject(block) && block.chi === VOICE && heardText(blocks, idOf(block)) !== '')
  return voice === undefined ? '' : idOf(voice)
}

// The label and the text of an object's reading: a caption and a transcript whole, a watch or extract of more
// than SHOWN characters cut at a word with its length after it.
function heardParts(blocks: Block[], id: string): { label: string; text: string } {
  const label = museLabel(heard(blocks, id)[0])
  const chars = Array.from(heardText(blocks, id))
  if ((label !== 'watch' && label !== 'extract') || chars.length <= SHOWN) return { label, text: chars.join('') }
  const cut = chars.slice(0, SHOWN).join('')
  const at = cut.lastIndexOf(' ')
  return { label, text: `${at < 0 ? cut : cut.slice(0, at)} ... (${chars.length} characters)` }
}

// One reading for each object of a card that has its final reading, in the order of the objects, with the
// id of the object it hangs under. The voice of a card with no words is its text, so it has none.
export function readingBoxes(raw: string): { objectId: string; label: string; text: string }[] {
  const blocks = parseBlocks(raw)
  const voice = voiceOf(blocks)
  return blocks
    .filter(block => isObject(block) && idOf(block) !== voice && heardText(blocks, idOf(block)) !== '')
    .map(block => ({ objectId: idOf(block), ...heardParts(blocks, idOf(block)) }))
}

// "LABEL: TEXT" for each reading, one line.
export const readingLines = (raw: string): string[] => readingBoxes(raw).map(box => `${box.label}: ${box.text}`)

// A draft is never the card's text and never on the band; the operator face may show it, one line.
export const draftLines = (raw: string): string[] =>
  parseBlocks(raw)
    .filter(block => isDraft(block) && block.body.trim() !== '')
    .map(block => `draft: ${oneLine(block.body)}`)

// True while a card with no words waits for the final transcript of its audio object: it has one, with no
// final and no refusal under it yet.
export function isListening(raw: string): boolean {
  const blocks = parseBlocks(raw)
  const source = blocks.find(block => block.cho === 'source')
  if (source === undefined || source.body.trim() !== '' || voiceOf(blocks) !== '') return false
  return blocks.some(block => isObject(block) && block.chi === VOICE && !blocks.some(other => other.cho === 'fault' && isOn(other, idOf(block))))
}

// The short step label from the form.
export function stepLabel(block: Block): string {
  if (block.cho === 'source') return 'card'
  if (isMuse(block)) return 'reading'
  if (block.cho === 'call') return 'call'
  if (block.cho === 'decided') return block.chi === 'intent' ? 'act' : 'decide'
  if (block.cho === 'mention') return block.chi === 'verb' ? 'verb' : 'find'
  return block.cho
}

// by / p / in / usd, rounded.
function rateOf(block: Block): string {
  const parts: string[] = []
  if (block.fence.by !== undefined) parts.push(fenceText(block, 'by'))
  const p = Number(block.fence.p)
  if (block.fence.p !== undefined && !Number.isNaN(p)) parts.push(`p ${p.toFixed(2)}`)
  if (block.fence.in !== undefined) parts.push(`in ${fenceText(block, 'in')}`)
  const usd = Number(block.fence.usd)
  if (block.fence.usd !== undefined && !Number.isNaN(usd)) parts.push(`$${usd.toFixed(4)}`)
  return parts.join(' ')
}

const isCall = (block: Block): boolean => block.chi === 'walk' && block.cho === 'call'

// The instance a route names as its one term, '' when it names none or more than one.
function instanceOf(route: Block): string {
  const terms = blockWords(route.words)
    .split('/')
    .map(term => term.trim())
    .filter(term => term !== '')
  return terms.length === 1 ? terms[0] : ''
}

// The route of a card the room handed to a program's gate: the last route, of kind `door`, naming one instance and
// holding `card`, the new card's word, in its fence (the forms of the room README). A route with no `card` is the
// room's own, and is none of this.
function handedRoute(blocks: Block[]): Block | undefined {
  const route = blocks.filter(block => block.cho === 'route').at(-1)
  if (route === undefined || route.che !== 'door' || route.fence.card === undefined) return undefined
  return instanceOf(route) === '' ? undefined : route
}

// The newest frame of a handed card: the last block after the route written at (144,3) whose chi is the route's
// term and whose cho is `frame`, `INSTANCE::game::frame`. The game writes a new frame at each move. The boards of
// the game's own walk, `ur::move::board`, have another cho and are none of the pane's.
function frameOf(blocks: Block[], route: Block, instance: string): Block | undefined {
  return blocks
    .slice(blocks.indexOf(route) + 1)
    .filter(block => block.lead === 144 && block.close === 3 && block.chi === instance && block.cho === 'frame')
    .at(-1)
}

// A fence value on one line: a scalar as written, an array or an object as JSON.
const pairValue = (value: unknown): string => (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value))

// The keys of a frame's fence as pairs, `game` first, the rest in the order written. `id`, `ms` and `parent` are the
// block's own keys, not the board's, and are left out.
const BLOCK_KEYS = ['id', 'ms', 'parent']
const pairsOf = (frame: Block | undefined): [string, string][] =>
  frame === undefined
    ? []
    : Object.keys(frame.fence)
        .filter(key => !BLOCK_KEYS.includes(key))
        .sort((a, b) => Number(b === 'game') - Number(a === 'game'))
        .map(key => [key, pairValue(frame.fence[key])])

// ---- who sent a card (order B-S7). The hook bridges every prompt of a session as a card, and the harness sends some
// of them itself: a background task's notification, a reminder, a command's output, a subagent's hand-back.
export type Source = 'harness' | 'person'
const ANY_TAG = /<\/?[A-Za-z][\w-]*(?:\s[^<>]*)?>/g
// THE RULE (order B-M5, one for the hook and the pane): a text whose first thing is an opening tag whose name holds a
// hyphen is the harness's (agent-message, system-reminder, bash-input and the ones not yet seen). A tag with no hyphen
// (`<div>`, `<3`) is words, and a card that only quotes a tag later in its words is his.
const HYPHEN_OPEN = /^<([A-Za-z]\w*(?:-\w+)+)(?=[\s>/]|$)/

// The name of the hyphenated tag a text opens with, or '' when it opens with none.
export const harnessTag = (text: string): string => HYPHEN_OPEN.exec(text.trim())?.[1] ?? ''

export const sourceOf = (text: string): Source => (harnessTag(text) === '' ? 'person' : 'harness')

// A tag's name in plain words, for the one line of a harness card. A name not named here reads as its own words.
const HARNESS_KINDS: Record<string, string> = {
  'agent-message': 'a message of an agent',
  'system-reminder': 'a reminder of the system',
  'local-command-stdout': 'the output of a command',
  'local-command-caveat': 'a note on a command',
  'command-name': 'a command',
  'bash-input': 'a terminal command',
  'bash-stdout': 'the output of a terminal command',
  'bash-stderr': 'the errors of a terminal command',
}
export const harnessKind = (tag: string): string => HARNESS_KINDS[tag] ?? `a message tagged ${tag.split('-').join(' ')}`

// A harness block read as plain words: every tag taken out, each line trimmed, the empty lines gone.
export const harnessLines = (text: string): string[] =>
  text
    .replace(ANY_TAG, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')

// The one line a harness card is named by: its summary tag's text when it has one, else the first line of its words.
export function harnessTitle(text: string): string {
  const summary = /<summary(?:\s[^<>]*)?>([\s\S]*?)<\/summary>/.exec(text)?.[1]
  const said = summary === undefined ? '' : oneLine(summary)
  return said !== '' ? said : (harnessLines(text)[0] ?? '')
}

// The ONE line of a harness card that is no task notification: what it is in plain words, then the first words of its
// body, cut to one row. The whole text is the operator face's alone.
export function harnessRow(text: string): string {
  const first = preview(harnessTitle(text))
  const kind = harnessKind(harnessTag(text))
  return first === '' ? kind : `${kind}: ${first}`
}

// A seat's name as the line may draw it: word letters, dashes and dots, at most 32 of them.
const SEAT_NAME = /^[\w.-]{1,32}$/
// The most names the quiet line draws; the rest are counted.
const SAID_NAMES = 5

// The names of a root's `to`: a list of seat names; anything else, one odd name included, reads as none.
function toOf(root: Block | undefined): string[] {
  const named = root?.fence.to
  if (!Array.isArray(named) || !named.every(name => typeof name === 'string' && SEAT_NAME.test(name.trim()))) return []
  return named.map(name => name.trim())
}

// The id a root's `re` names: the value without its dot, '' when the root holds none or holds no word.
function reOf(root: Block | undefined): string {
  const value = root?.fence.re
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim().replace(/^\./, '') : ''
}

// The words that name a card answered: its first words when the room's list holds it, else the first eight word letters of its id.
export function answeredWords(re: string, walks: WalkText[]): string {
  const found = walks.find(item => item.id === re)
  const words = found === undefined ? '' : preview(parseWalk(found.text).text)
  return words !== '' ? words : re.replace(/\W/g, '').slice(0, 8)
}

// The ONE quiet line of a card said to seats (order C3): `to NAME, NAME`, and `answers` with the first words of the card
// answered when the root holds `re`. '' for a card with neither. No colon, no button.
export function sayLine(walk: Walk, walks: WalkText[]): string {
  const parts: string[] = []
  if (walk.to.length > 0) {
    const more = walk.to.length - SAID_NAMES
    parts.push(`to ${walk.to.slice(0, SAID_NAMES).join(', ')}${more > 0 ? ` plus ${more}` : ''}`)
  }
  const answered = walk.re === '' ? '' : answeredWords(walk.re, walks)
  if (answered !== '') parts.push(`answers ${answered}`)
  return parts.join(' · ')
}

// The walk of one card. Its text is the body of the root block (a harness card's, its title); its answer the body of the seat's
// or the keeper's call block (a failed call's body reads `failed: REASON`). For a card handed to a program the
// answer is its newest frame, the one row the game writes under the route: a call is never that answer, a
// reading of the augmenter neither, and until a frame comes the card has no answer.
export function parseWalk(text: string): Walk {
  const blocks = parseBlocks(text)
  const depths = depthsOf(blocks)
  const source = blocks.find(block => block.cho === 'source')
  // A card with no words says its voice: the final transcript of its audio object.
  const voice = voiceOf(blocks)
  const said = voice === '' ? (source?.body ?? '') : heardText(blocks, voice)
  // A harness card is named by its title, so every row and toast that names a card by its first words reads that.
  const sent = sourceOf(said)
  const task = sent === 'harness' ? taskOf(said) : undefined
  const cardText = sent === 'harness' ? (task === undefined ? harnessRow(said) : harnessTitle(said)) : said
  const head = source ? `walk ${preview(cardText)} to ${fenceText(source, 'gate')} at ${fenceText(source, 'at')}` : ''
  const steps: Step[] = blocks.map((block, i) => ({
    ms: fenceText(block, 'ms'),
    step: stepLabel(block),
    notation: block.cho === 'source' ? preview(block.body) : blockWords(block.words),
    role: fenceText(block, 'role') || fenceText(block, 'act'),
    rate: rateOf(block),
    depth: depths[i],
  }))
  // An ask waits while no decision closes it.
  const open = blocks.find(block => block.cho === 'ask' && closerOf(blocks, block) === undefined)
  const choices: string[] = []
  if (open) {
    for (const child of blocks) {
      if (child.cho === 'candidate' && parentOf(child) === idOf(open)) choices.push(blockWords(child.words))
    }
    const offered = open.fence.choices
    if (Array.isArray(offered)) choices.push(...offered.map(String))
  }
  const act = blocks.find(block => block.cho === 'decided' && block.chi === 'intent')
  const order = act?.fence.order
  // A reading of the augmenter is no answer of the room.
  const handed = handedRoute(blocks)
  const handedTo = handed === undefined ? '' : instanceOf(handed)
  const frame = handed === undefined ? undefined : frameOf(blocks, handed, handedTo)
  const answerBlock = handed === undefined ? blocks.filter(block => isCall(block) && !isMuse(block)).at(-1) : frame
  return {
    head,
    text: cardText,
    source: sent,
    words: sent === 'harness' ? harnessLines(said).join('\n') : said,
    task,
    answer: answerBlock ? cleanAnswer(answerBlock.body) : '',
    answered: answerBlock !== undefined,
    frame: pairsOf(frame),
    steps,
    choices: [...new Set(choices)],
    waiting: open !== undefined,
    question: open ? blockWords(open.words) : '',
    hasFault: blocks.some(block => block.cho === 'fault'),
    session: source ? fenceText(source, 'session') : '',
    to: toOf(source),
    re: reOf(source),
    handedTo,
    // The act is the decision's che; a held card carries the seat's pick, else the first of its order.
    act: act ? fenceText(act, 'pick') || (act.che !== 'held' ? act.che : Array.isArray(order) ? String(order[0] ?? '') : '') : '',
  }
}

// A call's body for the reader: no ULID, and a quoted row `Mara / @ULID / { ... }` keeps its slashes tidy.
export const cleanAnswer = (body: string): string =>
  stripUlid(body.replace(/\s*\/\s*@(?:cha:)?[0-9A-Za-z]{20,}\s*\//g, ' /')).trim()

// ---- The three faces.
export const FACES: Face[] = ['public', 'operator', 'trace']
export const DEFAULT_FACE: Face = 'public'
export const LANE = 24

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
const firstTerm = (block: Block): string => blockWords(block.words).split('/')[0].trim()
const callsOf = (blocks: Block[]): Block[] => blocks.filter(isCall)
const routeOf = (blocks: Block[]): Block | undefined => blocks.find(block => block.cho === 'route')
const msOf = (block: Block): number => {
  const ms = Number(block.fence.ms)
  return Number.isNaN(ms) ? 0 : ms
}

// ---- public
export type PublicAsk = { question: string; choice: string; isOpen: boolean }
export type PublicView = {
  said: string
  asks: PublicAsk[]
  understood: string
  answer: string
  openQuestion: string
  choices: string[]
  shelf: { name: string; chi: string }[]
}

// A typed new record reads "you said a new person"; a none reads "you said not on the shelf";
// a record picked reads "you picked Ardalan".
export function askPhrase(ask: Block, decided: Block | undefined): string {
  if (decided === undefined) return ''
  if (decided.fence.grown !== undefined) return `you said a new ${ask.chi}`
  if (!ID_FIRST.test(decided.words)) return 'you said not on the shelf'
  return `you picked ${blockWords(decided.words).split('/').at(-1) ?? ''}`
}

// "ardalan, a person, recipient of sent" -> "ardalan, a person"; "me, the author, ..." -> "me, the author".
export function foundItem(line: string): string {
  const parts = line.split(',').map(part => part.trim())
  const kind = parts[1] ?? ''
  return /^(an? |the author)/.test(kind) ? `${parts[0]}, ${kind}` : parts[0]
}

export function foundList(blocks: Block[]): string[] {
  const found = routeOf(blocks)?.fence.found
  return Array.isArray(found) ? found.map(String) : []
}

export function understoodSentence(blocks: Block[]): string {
  const items = foundList(blocks).map(foundItem)
  return items.length === 0 ? '' : `The room read: ${items.join('; ')}.`
}

// The shelf records this card grew or matched, by the ULID its decisions hold.
export function touchedRecords(blocks: Block[], catalog: CatalogEntry[]): { name: string; chi: string }[] {
  const out: { name: string; chi: string }[] = []
  for (const block of blocks) {
    if (block.cho !== 'decided' || block.chi === 'intent') continue
    const grown = typeof block.fence.grown === 'string' ? block.fence.grown : ''
    const id = ID_FIRST.exec(block.words)?.[1] ?? /@([0-9A-Za-z]{20,})/.exec(grown)?.[1] ?? ''
    const entry = id === '' ? undefined : catalog.find(item => item.id === id)
    if (entry && !out.some(record => record.name === stripUlid(entry.name))) {
      out.push({ name: stripUlid(entry.name), chi: entry.chi })
    }
  }
  return out
}

export function publicView(text: string, catalog: CatalogEntry[]): PublicView {
  const blocks = parseBlocks(text)
  const walk = parseWalk(text)
  const asks: PublicAsk[] = blocks
    .filter(block => block.cho === 'ask')
    .map(ask => {
      const decided = closerOf(blocks, ask)
      return {
        question: capitalize(blockWords(ask.words)),
        choice: askPhrase(ask, decided),
        isOpen: decided === undefined,
      }
    })
  const failed = walk.answer.startsWith('failed:')
  return {
    said: walk.text,
    asks,
    understood: understoodSentence(blocks),
    answer: failed ? 'The room could not answer this one.' : walk.answer,
    openQuestion: walk.question,
    choices: walk.choices,
    shelf: touchedRecords(blocks, catalog),
  }
}

export function publicLines(view: PublicView): string[] {
  const lines = ['YOU SAID', view.said, '']
  if (view.asks.length > 0) {
    lines.push('THE ROOM ASKED')
    for (const ask of view.asks) lines.push(ask.isOpen ? `${ask.question} · waiting for you` : `${ask.question} · ${ask.choice}`)
    lines.push('')
  }
  if (view.understood !== '') lines.push('THE ROOM UNDERSTOOD', view.understood, '')
  if (view.openQuestion !== '') lines.push(`WAITING FOR YOU: ${view.openQuestion} (${view.choices.join(' · ')})`, '')
  else if (view.answer !== '') lines.push('THE ANSWER', view.answer, '')
  lines.push('ON THE SHELF')
  if (view.shelf.length === 0) lines.push('nothing from this card')
  for (const record of view.shelf) lines.push(`${record.name} · ${record.chi}`)
  return lines
}

// ---- operator
export type OpCard = {
  id: string
  first: string
  act: string
  by: string
  route: string
  usd: number
  faults: string[]
  hasNoKey: boolean
}

const NO_KEY = /^no key\b/i

export function opCard(id: string, text: string): OpCard {
  const blocks = parseBlocks(text)
  const walk = parseWalk(text)
  const faults = blocks.filter(block => block.cho === 'fault').map(block => blockWords(block.words))
  const hasNoKey = faults.some(fault => NO_KEY.test(fault))
  const act = blocks.find(block => block.cho === 'decided' && block.chi === 'intent')
  const by = act ? fenceText(act, 'by') : ''
  let decidedBy = by
  if (by === 'jev') decidedBy = hasNoKey ? 'no Jev (held)' : 'Jev'
  const usd = callsOf(blocks).reduce((sum, call) => sum + (Number(call.fence.usd) || 0), 0)
  return {
    id,
    first: preview(walk.text),
    act: walk.act || act?.che || '',
    by: decidedBy,
    route: routeOf(blocks)?.che ?? '',
    usd,
    faults,
    hasNoKey,
  }
}

// The warning band: the missing key first, then every other fault by its text.
// The band says the room's state NOW, never its past: Jev's state is the newest card that went to
// Jev, and the other faults are the newest card's. A fault mended since (a key set, a door
// restarted) leaves the band with the next card. Cards come newest first.
const JEV_FAULT = /^jev\b|TYPESAFE_API_KEY/i
export function operatorWarnings(cards: OpCard[]): string[] {
  const lines: string[] = []
  const jev = cards.find(card => /jev/i.test(card.by) || card.hasNoKey || card.faults.some(f => JEV_FAULT.test(f)))
  if (jev?.hasNoKey) lines.push('Jev has no key: the newest card was held for the seat')
  else {
    const fault = jev?.faults.find(f => JEV_FAULT.test(f))
    if (fault) lines.push(`Jev failed on the newest card: ${fault.slice(0, 100)}`)
  }
  for (const fault of cards[0]?.faults ?? []) {
    if (!NO_KEY.test(fault) && !JEV_FAULT.test(fault)) lines.push(`fault: ${fault.slice(0, 100)}`)
  }
  return lines
}

export const usdText = (usd: number): string => (usd === 0 ? '-' : `$${usd.toFixed(4)}`)

// "rules v2" for a rules or calls id, numbered in the order versions.md holds them.
export function versionLabel(versionsText: string, id: string): string {
  if (id === '') return ''
  const seen: Record<string, number> = {}
  for (const block of parseBlocks(versionsText)) {
    if (block.cho !== 'rule' || block.che !== 'door') continue
    const name = blockWords(block.words).split('/')[0]
    seen[name] = (seen[name] ?? 0) + 1
    if (idOf(block) === id) return `${name} v${seen[name]}`
  }
  return `rules ${id.slice(-4)}`
}

// ---- trace
export type TraceKind = 'tick' | 'wait' | 'model'
export type TraceRow = {
  depth: number
  form: string
  label: string
  note: string
  ms: number
  kind: TraceKind
  bar: string
  header: string
  fenceLines: string[]
}

function laneBar(start: number, end: number, last: number, glyph: string): string {
  const at = (ms: number): number => (last <= 0 ? 0 : Math.min(LANE - 1, Math.round((ms / last) * (LANE - 1))))
  const from = at(start)
  const to = Math.max(from, at(end))
  return Array.from({ length: LANE }, (_, i) => (i >= from && i <= to ? glyph : '·')).join('')
}

export function traceRows(text: string): TraceRow[] {
  const blocks = parseBlocks(text)
  const depths = depthsOf(blocks)
  const last = Math.max(0, ...blocks.map(msOf))
  const byId = new Map(blocks.map(block => [idOf(block), block] as const))
  return blocks.map((block, i) => {
    const ms = msOf(block)
    let kind: TraceKind = 'tick'
    let start = ms
    let end = ms
    let note = [fenceText(block, 'role'), fenceText(block, 'by'), fenceText(block, 'act')].filter(part => part !== '').join(' · ')
    if (block.cho === 'ask') {
      const answer = closerOf(blocks, block)
      if (answer && fenceText(answer, 'by') === 'you') {
        kind = 'wait'
        end = msOf(answer)
        note = `waiting for you · ${fmtMs(end - ms)}`
      }
    } else if (isCall(block)) {
      kind = 'model'
      start = msOf(byId.get(parentOf(block)) ?? block)
      end = ms
      note = `model call · ${fmtMs(end - start)}`
    }
    const glyph = kind === 'wait' ? '░' : kind === 'model' ? '▓' : '█'
    const label = block.cho === 'source' ? preview(block.body) : block.cho === 'ask' ? capitalize(blockWords(block.words)) : firstTerm(block)
    return {
      depth: depths[i],
      form: `(${block.lead},${block.close})`,
      label: label.length > 40 ? `${label.slice(0, 39)}…` : label,
      note,
      ms,
      kind,
      bar: laneBar(start, end, last, glyph),
      header: block.header,
      fenceLines: block.fenceLines,
    }
  })
}

export const traceRowText = (row: TraceRow): string =>
  `${' '.repeat(row.depth * INDENT)}${row.form} ${row.label}`.padEnd(46) + ` ${row.bar} ${fmtMs(row.ms)}`

// The picked row as written: the notation line and its fence.
export const traceBlockLines = (row: TraceRow): string[] => [row.header, '```yaml', ...row.fenceLines, '```']

// ---- the bridge: asks as the session and the band name them.
export type OpenAsk = { id: string; question: string; choices: string[] }

const askChoices = (blocks: Block[], ask: Block): string[] => {
  const out: string[] = []
  for (const child of blocks) if (child.cho === 'candidate' && parentOf(child) === idOf(ask)) out.push(blockWords(child.words))
  const offered = ask.fence.choices
  if (Array.isArray(offered)) out.push(...offered.map(String))
  return [...new Set(out)]
}

// Every ask of a walk no decision closes, each with its own ULID and choices.
export function openAsks(text: string): OpenAsk[] {
  const blocks = parseBlocks(text)
  return blocks
    .filter(block => block.cho === 'ask' && closerOf(blocks, block) === undefined)
    .map(ask => ({ id: idOf(ask), question: blockWords(ask.words), choices: askChoices(blocks, ask) }))
}

// "new or none", the choices as the band and the session read them.
export const choicesText = (choices: string[]): string => choices.join(' or ')

// The band's line while any ask is open; '' when none.
export const waitingLine = (asks: OpenAsk[]): string =>
  asks.length === 0 ? '' : `room · waiting for you · ${asks.map(ask => `${ask.question} ${choicesText(ask.choices)}`.trim()).join('; ')}`
