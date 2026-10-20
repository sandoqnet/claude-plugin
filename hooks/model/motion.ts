// The world in motion: one row an event of the shown cards, oldest first, so the newest is at the
// bottom. Pure, with no `$`; the trace face only lays the rows out. Run by `node` too: no enums,
// `import type` for types, `.ts` in imports.
import { ID_FIRST, blockWords, closerOf, fenceText, idOf, parentOf, parseBlocks, preview } from './blocks.ts'
import type { Block } from './blocks.ts'
import { ulidMs } from './feed.ts'
import { isCall, isLate, seatCall } from './operator.ts'
import { capitalize, isMuse, museLabel, usdText } from './walk.ts'
import type { Card } from './walk.ts'

// A tap the person made that stands in taps/GATE, which the door has not taken yet.
export type PendingTap = { cardId: string; askId: string; choice: string }

export type MotionRow = {
  // The time of the event, in ms.
  ms: number
  cardId: string
  // The place of the row among the rows of its card.
  index: number
  // The first words of the card.
  first: string
  text: string
  // The seat that wrote the event, and how many blocks hang under its block.
  seat: string
  count: number
  // A late call is machine text of its own, not the card's news.
  isDim: boolean
}

const TAP_ASK = /@([0-9A-Za-z]{20,})/

// The choice is written as one safe term: %2F for a slash and so on.
function unsafe(term: string): string {
  try {
    return decodeURIComponent(term)
  } catch {
    return term
  }
}

// The taps of one file of taps/GATE (its name, without .md, is the card). The file also holds the
// keeper's answer blocks, which are no tap of the person's.
export function pendingTaps(cardId: string, text: string): PendingTap[] {
  return parseBlocks(text)
    .filter(block => block.chi === 'walk' && block.che === 'hand' && block.cho === 'tap')
    .map(block => ({
      cardId,
      askId: TAP_ASK.exec(block.words)?.[1] ?? '',
      choice: unsafe(blockWords(block.words)),
    }))
    .filter(tap => tap.askId !== '')
}

// "14:05:09" at the zone's offset from UTC, in minutes.
export function clockText(ms: number, zone = 0): string {
  if (Number.isNaN(ms)) return ''
  const day = 24 * 60 * 60 * 1000
  const seconds = Math.floor((((ms + zone * 60 * 1000) % day) + day) % day / 1000)
  const two = (value: number): string => String(value).padStart(2, '0')
  return `${two(Math.floor(seconds / 3600))}:${two(Math.floor((seconds % 3600) / 60))}:${two(seconds % 60)}`
}

// One line of a row: the time, the card's first words and the event.
export const rowText = (row: MotionRow, zone = 0): string => `${clockText(row.ms, zone)} · ${row.first} · ${row.text}`

// The time column of event rows: the whole clock with its milliseconds where the second is not the one of the
// row before, else ".mmm" alone, padded to the width of the whole.
const WHOLE = 'HH:MM:SS.mmm'.length
export function timeCells(times: number[], zone = 0): string[] {
  let before = ''
  return times.map(ms => {
    const second = clockText(ms, zone)
    const milli = `.${String(((Math.floor(ms) % 1000) + 1000) % 1000).padStart(3, '0')}`
    const cell = second === before ? milli.padStart(WHOLE) : `${second}${milli}`
    before = second
    return cell
  })
}

// An event's first word and the rest of it.
export const wordsOfEvent = (text: string): { word: string; rest: string } => {
  const at = text.indexOf(' ')
  return at < 0 ? { word: text, rest: '' } : { word: text.slice(0, at), rest: text.slice(at) }
}

// The seat that wrote a block: the augmenter its readings, the keeper its calls and picks, the person their
// taps and answers, the seat its reply, else the door.
export function seatOf(block: Block): string {
  const by = fenceText(block, 'by')
  if (isMuse(block)) return 'augmenter'
  if (by === 'keeper' || (isCall(block) && block.che === 'keeper')) return 'keeper'
  if (by === 'you') return 'you'
  return isCall(block) ? 'seat' : 'door'
}

const whoOf = (by: string): string => (by === 'jev' ? 'Jev' : by)

// The record a decision chose: its name, or none when it names no record.
const chosenName = (decided: Block): string => (ID_FIRST.test(decided.words) ? (blockWords(decided.words).split('/').at(-1) ?? '') : 'none')

// The picks of the keeper in a card: the decision block's id and the name it chose.
export function keeperPicks(raw: string): { id: string; name: string }[] {
  return parseBlocks(raw)
    .filter(block => block.cho === 'decided' && fenceText(block, 'by') === 'keeper')
    .map(block => ({ id: idOf(block), name: chosenName(block) }))
}

export type Event = { ms: number; text: string; seat: string; count: number; isDim: boolean }

// The events of one card, oldest first by their full time (milliseconds too); events of one time keep the
// order of their blocks. A block with no time of its own takes the time of the block before it in the file;
// the first of them, the start of the card (the time in its ULID).
export function eventsOf(card: Card): Event[] {
  const blocks = parseBlocks(card.raw)
  const start = ulidMs(card.id)
  const base = Number.isNaN(start) ? 0 : start
  const route = blocks.find(block => block.cho === 'route')
  const seat = seatCall(blocks)
  const events: Event[] = []
  let at = base
  for (const block of blocks) {
    const ms = Number(block.fence.ms)
    if (block.fence.ms !== undefined && !Number.isNaN(ms)) at = base + ms
    const count = blocks.filter(other => parentOf(other) === idOf(block) && idOf(block) !== '').length
    const push = (text: string, isDim = false) => events.push({ ms: at, text, seat: seatOf(block), count, isDim })
    if (block.chi === 'walk' && block.cho === 'source') push('card in')
    else if (block.cho === 'decided') {
      const by = fenceText(block, 'by')
      if (block.chi === 'intent') push(`act ${block.che}${by === '' ? '' : ` by ${whoOf(by)}`}`)
      else if (by === 'keeper') push(`keeper chose ${chosenName(block)}`)
      else push(by === '' ? 'decided' : `decided by ${whoOf(by)}`)
    } else if (block.cho === 'ask') {
      push(`asks: ${capitalize(blockWords(block.words))}`)
      if (fenceText(block, 'keeper') === 'asked') push('keeper asked')
    } else if (block.cho === 'route') push(`route ${block.che}`)
    else if (block.cho === 'fault') push(`fault ${blockWords(block.words).slice(0, 100)}`)
    else if (isMuse(block)) {
      // A draft is written with its final and is no event of its own.
      if (block.fence.pass !== 'draft') push(`${museLabel(block)} in`)
    } else if (isCall(block) && isLate(block)) push('late call', true)
    else if (isCall(block) && block === seat) {
      const parts = [`reply ${capitalize(blockWords(block.words))}`]
      const usd = Number(block.fence.usd) || 0
      if (usd > 0) parts.push(usdText(usd))
      const seconds = route === undefined ? NaN : (Number(block.fence.ms) - Number(route.fence.ms)) / 1000
      if (!Number.isNaN(seconds) && seconds >= 0) parts.push(`${seconds.toFixed(1)} s`)
      push(parts.join(' · '))
    }
  }
  // The sort is stable: a tie keeps the order of the blocks.
  return events.sort((a, b) => a.ms - b.ms)
}

// One row an event of the cards, in time order, oldest first. A pending tap of a card whose ask is
// still open is "you tapped CHOICE" at `now`: the tap file holds no time, and it stands there now.
export function motionRows(cards: Card[], pending: PendingTap[], now: number): MotionRow[] {
  const oldest = [...cards].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const rows: (MotionRow & { order: number })[] = []
  for (const card of oldest) {
    const first = preview(card.text)
    const blocks = parseBlocks(card.raw)
    const events = eventsOf(card)
    for (const tap of pending.filter(item => item.cardId === card.id)) {
      const ask = blocks.find(block => block.cho === 'ask' && idOf(block) === tap.askId)
      if (ask !== undefined && closerOf(blocks, ask) === undefined) events.push({ ms: now, text: `you tapped ${tap.choice}`, seat: 'you', count: 0, isDim: false })
    }
    events.forEach((event, index) => rows.push({ ...event, cardId: card.id, index, first, order: rows.length }))
  }
  return rows.sort((a, b) => a.ms - b.ms || a.order - b.order).map(({ order: _order, ...row }) => row)
}

// The events of a card the place shows at first; the rest are behind "Show N more".
export const SHOWN_EVENTS = 12

// One row an event of one card, for the events tab: the time cell, the event's first word and the rest, the
// seat that wrote it and the count of blocks under its block.
export type EventRow = { time: string; word: string; rest: string; seat: string; count: number }
export function eventRows(card: Card, zone = 0): EventRow[] {
  const events = eventsOf(card)
  const times = timeCells(
    events.map(event => event.ms),
    zone,
  )
  return events.map((event, i) => ({ time: times[i], ...wordsOfEvent(event.text), seat: event.seat, count: event.count }))
}
