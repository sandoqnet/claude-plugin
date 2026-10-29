// The rows of a card of the app at a width (order D1, part B, still 2). A pure function: it reads a card's walk and the width of
// its column in cells and says how many rows each part of the card takes, and so how tall the card is. It draws nothing and
// reads no host. The pane pages the column with it (as many cards as fit, then one link "N more"): nothing scrolls. The card of
// the app draws its words from the same helpers (wrapCells, bodyOf), so the rows said here are the rows drawn there.
// It counts the card AT REST, the one that stands in the column: an open card takes the column's place whole, under a link Back.
import { stripUlid } from '../model/blocks'
import { answeredBy, gatesOf, reasonText, ruleWords } from '../model/gate'
import type { Gate } from '../model/gate'
import { panelChip } from '../model/tree'
import { isListening, sayLine } from '../model/walk'
import type { Card, Walk, WalkText } from '../model/walk'
import { DRAFTED, TAKEN_OFF, picksOf } from './gate'
import type { GateExtras } from './gate'
import { FAILED, handedLine } from './slot'
import { SPACE } from './space'
import { cellsOf, cutCells, fitted, innerOf } from './theme'

// A closed card draws this many rows of its body, the rest is in the open card. Its last row says it was cut with "…".
export const BODY_ROWS = 3

// What the host does not tell us: the frame the app draws round a pick's label. Counted as two cells a side, an over-count on
// purpose, so a page of cards never runs over its column. The gap between two picks is the `control` step of the pane's spacing.
const PICK_FRAME = 4

// A text as the rows it takes in `cells`: broken at its new lines, then at its spaces; a word longer than a row is cut by cells,
// never inside a letter. With no limit (infinite cells) a text is its lines as written.
export function wrapCells(text: string, cells: number): string[] {
  const rows: string[] = []
  for (const line of text.split('\n')) {
    if (!Number.isFinite(cells)) {
      rows.push(line)
      continue
    }
    const room = Math.max(1, Math.floor(cells))
    let row = ''
    for (const word of line.split(' ')) {
      const joined = row === '' ? word : `${row} ${word}`
      if (cellsOf(joined) <= room) {
        row = joined
        continue
      }
      if (row !== '') rows.push(row)
      let rest = word
      while (cellsOf(rest) > room) {
        const head = cutCells(rest, Math.max(room, 2))
        rows.push(head)
        rest = rest.slice(head.length)
      }
      row = rest
    }
    rows.push(row)
  }
  return rows
}

// The body of a closed card: the first BODY_ROWS rows of its words at `cells`, the last ending in "…" when more follows.
export function bodyOf(text: string, cells: number, rows = BODY_ROWS): string[] {
  const all = wrapCells(text.trimEnd(), cells)
  if (all.length <= rows) return all
  const shown = all.slice(0, rows)
  const last = shown[rows - 1]
  shown[rows - 1] = cellsOf(last) < cells ? `${last}…` : `${cutCells(last, cells - 1)}…`
  return shown
}

// The author line of a card the harness sent (order B-S7): the session's, never his name.
export const FROM_SESSION = 'From the session'

// A row of a name and what it did, "ur · game": the two pieces as the card draws them, the name cut to the row and the act cut to
// what the name leaves. The row is one row at any width, so the card counts it as one and draws these very pieces.
export function whoPieces(name: string, act: string, cells: number): { name: string; act: string } {
  const named = fitted(name, cells)
  const room = cells - cellsOf(named) - SPACE.near
  return { name: named, act: act === '' || room < 2 ? '' : fitted(`· ${act}`, room) }
}

// The lines a text draws: its rows at `cells`, joined by new lines, so the host breaks no row on its own and the rows drawn are the rows counted.
export const wrappedAt = (text: string, cells: number): string => wrapCells(text, cells).join('\n')

// The answer a card shows: the walk's, or the one sentence of a failed call.
export const answerOf = (walk: Walk): string => (walk.answer.startsWith('failed:') ? FAILED : walk.answer)

// The cells the title leaves on its row: the card's inner width, less the age (closed) and the live word.
export function titleRoom(inner: number, age: string, live: string): number {
  return inner - (age === '' ? 0 : cellsOf(age) + SPACE.near) - (live === '' ? 0 : cellsOf(live) + SPACE.near)
}

// What a card said to seats (order C3) says as its body when it has no answer: its own words, when its title could not hold
// them in one row. A card with an answer shows the answer; a task, a voice not heard yet and a card not said to a seat show none.
export function wordsBodyOf(card: Card, room: number): string {
  const walk = card.walk
  if (walk.task || isListening(card.raw) || (walk.to.length === 0 && walk.re === '')) return ''
  return card.text.includes('\n') || cellsOf(card.text) > room ? card.text : ''
}

// The text a closed card draws as its body, and the rows of it: the answer, else the words of a card said to seats.
export function closedBody(card: Card, age: string, inner: number): string[] {
  const live = panelChip(card).kind === 'live' ? panelChip(card).text : ''
  const answer = answerOf(card.walk)
  const text = answer !== '' ? answer : wordsBodyOf(card, titleRoom(inner, age, live))
  return text === '' ? [] : bodyOf(text, inner)
}

// How many rows a row of picks takes at `cells`: the picks fill a row, then wrap.
function picksLines(labels: string[], cells: number): number {
  let rows = 0
  let used = 0
  for (const label of labels) {
    const need = cellsOf(label) + PICK_FRAME
    if (rows > 0 && used + SPACE.control + need <= cells) used += SPACE.control + need
    else {
      rows += 1
      used = need
    }
  }
  return rows
}

// The rows of the gate that waits: the ask, then the picks (or the seat's draft and its Input and the other picks), and the
// Input. The parts of the gate are one `line` apart.
function waitingLines(gate: Gate, cells: number): number {
  const parts = [wrapCells(`Waits for you · ${gate.question}`, cells).length]
  // the lines of why the keeper asked a name stand in one block under the ask, no row between them
  const why = gate.reason === undefined ? 0 : reasonText(gate.reason).reduce((sum, line) => sum + wrapCells(line, cells).length, 0)
  if (why > 0) parts.push(why)
  const picks = picksLines(picksOf(gate).map(({ choice }) => stripUlid(choice)), cells)
  if (gate.draft === undefined) parts.push(...(picks > 0 ? [picks] : []), 1)
  else parts.push(wrapCells(`${gate.draft.by} ${DRAFTED}`, cells).length, 1, ...(picks > 0 ? [picks] : []))
  return parts.reduce((sum, part) => sum + part, 0) + (parts.length - 1) * SPACE.line
}

// The rows of the line of a gate that closed, at rest: "● WHO · your rule: WORDS ›", and "Ask me next time" under it.
function closedLines(gate: Gate, cells: number, extras?: GateExtras): number {
  const decision = gate.decision
  if (decision === undefined) return 0
  const by = answeredBy(decision)
  const rule = decision.rule
  const named = decision.by === 'keeper' && rule !== undefined
  if (by === '' && !named) return 0
  const words = rule === undefined ? '' : (ruleWords(rule, decision.quotes, extras?.rulesText) ?? 'your rule')
  const who = named && by !== '' ? `${by} · your rule:` : by !== '' ? by : 'your rule:'
  const line = wrapCells(['●', who, ...(named ? [`${words} ›`] : [])].join(' '), cells).length
  const taken = rule !== undefined && (extras?.takenOff ?? []).includes(rule)
  const again = !named ? 0 : taken ? wrapCells(TAKEN_OFF, cells).length : extras?.actions?.ruleOff === undefined ? 0 : 1
  return line + again
}

export type CardRow = { key: string; lines: number }

export type CardRowsInput = {
  card: Card
  age: string
  walks: WalkText[]
  // The column's width and the pane's columns, as the card is drawn (the plan). With no width the rows are the lines as written.
  width?: number
  columns?: number
  gate?: GateExtras
}

// The rows of a card at rest, in the order they are drawn, and the height they make with the card's border, its padding above
// and below and the `line` between two parts.
export function cardRows({ card, age, walks, width, columns, gate: extras }: CardRowsInput): { rows: CardRow[]; height: number } {
  const walk = card.walk
  const inner = innerOf(width, columns)
  const harness = walk.source === 'harness'
  const waitsOnHim = walk.waiting && !harness
  const gates = harness || walk.source === 'mail' ? [] : gatesOf(card.raw)
  const waiting = gates.filter(gate => gate.decision === undefined).slice(0, 1)
  const answer = answerOf(walk)
  const said = sayLine(walk, walks)
  const rows: CardRow[] = [{ key: 'head', lines: 1 }]
  const add = (key: string, lines: number) => {
    if (lines > 0) rows.push({ key, lines })
  }
  // The card draws each of these rows from the same cells it is counted by: the author and answerer rows are one row cut to the
  // inner width (whoPieces), the said and handed lines are the rows of wrapCells.
  add('author', harness || walk.session !== '' ? 1 : 0)
  add('said', said === '' ? 0 : wrapCells(said, inner).length)
  add('handed', walk.handedTo !== '' ? wrapCells(handedLine(walk.handedTo), inner).length : 0)
  add('answerer', walk.handedTo !== '' && !waitsOnHim && answer !== '' ? 1 : 0)
  if (!waitsOnHim) add('body', closedBody(card, age, inner).length)
  if (waitsOnHim) add('gate', waiting.length > 0 ? waitingLines(waiting[0], inner) : wrapCells(`Waits for you · ${walk.question}`, inner).length)
  gates.filter(gate => gate.decision !== undefined).forEach((gate, i) => add(`closed-${i}`, closedLines(gate, inner, extras)))
  const lines = rows.reduce((sum, row) => sum + row.lines, 0)
  return { rows, height: lines + (rows.length - 1) * SPACE.line + 2 + 2 * SPACE.line }
}
