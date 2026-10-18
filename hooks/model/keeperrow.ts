// The keeper's pick as a row of his desk (order T3, the shelf note toast-news, section 4): a pick of the keeper on an ask that waits on HIM stands on
// the desk the day it was made, `keeper chose NAME for "ASK"` and the keeper's note under it, with Change (opens the ask's choices) and OK (takes the
// row off). Read from the walk, as the asks are: never put on the shelf and never a `room desk` item. A pick of an ask that is a seat's, a pick of an
// earlier day, a pick he changed (his own tap stands as a second decision under the ask) and a pick he took off by OK are no row. Pure: no host, no
// view. Run by `node` too: no enums, `import type`, `.ts` in imports.
import { fenceText, idOf, parentOf, parseBlocks } from './blocks.ts'
import { gatesOf } from './gate.ts'
import { keeperPicks } from './motion.ts'
import { ulidMs } from './profile.ts'
import type { WalkText } from './profile.ts'
import { THIS_SEAT, askedWait, waitsOnHim } from './seat.ts'
import type { SeatState } from './seat.ts'
import { parseWalk } from './walk.ts'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
// The keys of the picks he took off that the pane's own file keeps: the newest of them (a pick draws on its own day only, so no old key matters).
export const KEPT_MAX = 300

// One pick of the keeper. `key` is the pick as the pane keeps it, `cardId:decisionId` (the name where the decision has no id), the same key the
// doorbell uses for the toast. `note` is the decision's why, `atMs` the time the keeper decided.
export type KeeperRow = { key: string; cardId: string; askId: string; name: string; ask: string; note: string; atMs: number }

const flat = (text: string): string => text.replace(/\s+/g, ' ').trim()
const dayOf = (ms: number, zone: number): number => Math.floor((ms + zone * MINUTE) / DAY)

type Pick = KeeperRow & { changed: boolean }

// The picks of one walk, whatever their day: a walk is read once for as long as its text stands.
const kept = new Map<string, { text: string; picks: Pick[] }>()

function picksOf(walk: WalkText): Pick[] {
  const held = kept.get(walk.id)
  if (held !== undefined && held.text === walk.text) return held.picks
  const made = readPicks(walk)
  if (kept.size > 2000) kept.clear()
  kept.set(walk.id, { text: walk.text, picks: made })
  return made
}

function readPicks(walk: WalkText): Pick[] {
  // Only a walk that names the keeper holds a pick: the cheap test first.
  if (!walk.text.includes('keeper')) return []
  const blocks = parseBlocks(walk.text)
  const decided = blocks.filter(block => block.cho === 'decided' && fenceText(block, 'by') === 'keeper')
  if (decided.length === 0 || !waitsOnHim(parseWalk(walk.text).source, 'public')) return []
  const names = keeperPicks(walk.text)
  const gates = gatesOf(walk.text)
  const start = ulidMs(walk.id)
  // A block with no time of its own takes the time of the block before it; the first of them, the start of the card (as eventsOf says).
  const times = new Map<object, number>()
  let at = Number.isNaN(start) ? 0 : start
  for (const block of blocks) {
    const ms = Number(block.fence.ms)
    if (block.fence.ms !== undefined && !Number.isNaN(ms)) at = (Number.isNaN(start) ? 0 : start) + ms
    times.set(block, at)
  }
  const out: Pick[] = []
  const asked = new Set<string>()
  decided.forEach((block, nth) => {
    const askId = parentOf(block)
    // A pick with no ask above it has no choices to change, and one ask is one row.
    if (askId === '' || asked.has(askId) || !blocks.some(other => other.cho === 'ask' && idOf(other) === askId)) return
    asked.add(askId)
    const gate = gates.find(item => item.askId === askId)
    const pick = names[nth]
    out.push({
      key: `${walk.id}:${pick.id || pick.name}`,
      cardId: walk.id,
      askId,
      name: pick.name,
      ask: flat(gate?.question ?? ''),
      note: flat(fenceText(block, 'why')),
      atMs: times.get(block) ?? 0,
      // His own tap on the ask stands as a second decision under it: the pick is changed.
      changed: blocks.some(other => other !== block && other.cho === 'decided' && parentOf(other) === askId && fenceText(other, 'by') !== 'keeper'),
    })
  })
  return out
}

// The rows of the keeper's picks for the desk, oldest pick first: the picks of today (the local day of the state's zone, minutes east of UTC) on an
// ask of THIS seat (the asks of the letters: an ask put to another seat is that seat's, and its pick is no row of his) that he did not change and
// did not take off by OK (`off` holds the keys he took off).
export function keeperRows(state: SeatState, off: ReadonlySet<string>): KeeperRow[] {
  const zone = state.zone ?? 0
  const here = state.seat === '' ? THIS_SEAT : state.seat
  const rows: KeeperRow[] = []
  for (const walk of state.walks) {
    for (const { changed, ...row } of picksOf(walk)) {
      if (changed || off.has(row.key) || dayOf(row.atMs, zone) !== dayOf(state.now, zone)) continue
      if (askedWait(state, row.cardId, row.askId)?.seat === here) rows.push(row)
    }
  }
  return rows.sort((a, b) => a.atMs - b.atMs || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
}

// The line of a row (its note is the one dim line under it, and none when the decision has none).
export const rowWords = (row: KeeperRow): string => `keeper chose ${row.name} for "${row.ask === '' ? 'this ask' : row.ask}"`

// ---- the fold (order D2): two or more picks of a list stand as ONE row, `N keeper picks`, with OK all beside it; a press opens the picks in place
// and a second folds them. One pick stays a row of its own. The keys are the picks' own, in the list's order.
export const FOLD_FROM = 2
export const FOLD_KEY = 'picks-fold'
export type KeeperFold = { picks: KeeperRow[]; keys: string[] }
export const foldOf = (picks: readonly KeeperRow[]): KeeperFold | undefined =>
  picks.length < FOLD_FROM ? undefined : { picks: [...picks], keys: picks.map(pick => pick.key) }
export const foldWords = (fold: KeeperFold): string => `${fold.picks.length} keeper picks`

// The keys he took off with these keys added, each once and the newest KEPT_MAX kept: OK on one pick and OK all are this one step, and so one write.
export const withOk = (off: ReadonlySet<string>, keys: readonly string[]): Set<string> => new Set([...off, ...keys.filter(key => key !== '')].slice(-KEPT_MAX))

// The pane's own file of what he took off: `{"keeperOk": [KEY, ...]}`. A text that is no such file is no key.
export function parseKept(text: string): string[] {
  try {
    const object: unknown = JSON.parse(text)
    const list = object !== null && typeof object === 'object' ? (object as Record<string, unknown>).keeperOk : undefined
    return Array.isArray(list) ? list.filter((key): key is string => typeof key === 'string' && key !== '').slice(-KEPT_MAX) : []
  } catch {
    return []
  }
}

export const keptText = (keys: Iterable<string>): string => `${JSON.stringify({ keeperOk: [...keys].slice(-KEPT_MAX) })}\n`
