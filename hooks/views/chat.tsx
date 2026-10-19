// THE THREAD OF HIS CHAT WITH THE KEEPER (order keeper chat, pane 0.8.71): on a letter opened from the desk, under the card's words and over its ask, the lines
// of the card's walk in the order of the file, each line a row of its own with the name dim at the left (you, keeper) and the words. His line that has no
// answer yet says `Sent.` dim under it; a line that failed says its why under it in the warn color. NOTHING SCROLLS: the thread pages, NEWEST LAST, so
// the page it opens on is the last one, with `‹ Earlier` back; a thread that fits the rows it has is one page with no pager. ONE PAGER ON A PAGE (pane 0.8.72):
// where the terminal pages the letter, the thread is given no rows to page in: it hands ALL its rows to the terminal's pager (views/termpage.tsx), which opens
// on the page of the thread's newest row, the older rows behind its `‹ Earlier`; the thread's own pager draws only where the letter is one page. Pure draw: the
// rows of the thread come from model/chat.ts, the pane gives the cells inside the card and the rows left.
import type { ChatLine } from '../model/chat.ts'
import { kidsOf, propsOf, wrapRows } from './cells'
import { LOOK } from './look'
import { pageLines } from './pager'
import { SPACE } from './space'
import { THEME, cellsOf, cutCells } from './theme'
import type { Ui } from './types'

export const CHAT_LIST = 'chat'
// The key of a row of the thread is this and its place in the thread; the terminal's pager finds the thread's rows by it.
export const CHAT_ROW = 'chat-row-'
export const CHAT_THREAD = 'chat-thread'
export const SENT = 'Sent.'
// The name column: the longest name, and the gap before the words.
const NAME_CELLS = 'keeper'.length
const NAMES = { you: 'you', keeper: 'keeper' } as const

// One row of the thread: its name (the first row of a line only), its words, and the tone of the words.
export type ChatRow = { name: string; words: string; tone: 'ink' | 'dim' | 'warn' }

// A text in rows of at most `cells`: wrapped at its words, a word wider than a row cut at a letter.
const rowsOf = (words: string, cells: number): string[] =>
  words
    .split('\n')
    .flatMap(line => wrapRows(line, cells))
    .flatMap(row => {
      const out: string[] = []
      let rest = row
      while (cellsOf(rest) > cells) {
        const cut = cutCells(rest, cells)
        if (cut === '') break
        out.push(cut)
        rest = rest.slice(cut.length)
      }
      return [...out, rest]
    })
    .map(row => (row === '' ? ' ' : row))

// The rows of the thread in `cells` cells inside the card: a line is its words in rows, the name on the first; under his line `Sent.` while it waits, and
// its why when it failed.
export function chatRows(lines: ChatLine[], cells: number): ChatRow[] {
  const words = Math.max(1, cells - NAME_CELLS - SPACE.near)
  return lines.flatMap(line => {
    const own = rowsOf(line.words, words).map((row, at): ChatRow => ({ name: at === 0 ? NAMES[line.who] : '', words: row, tone: 'ink' }))
    const after: ChatRow[] = [
      ...(line.waiting ? [{ name: '', words: SENT, tone: 'dim' as const }] : []),
      ...(line.fault === '' ? [] : rowsOf(line.fault, words).map((row): ChatRow => ({ name: '', words: row, tone: 'warn' }))),
    ]
    return [...own, ...after]
  })
}

// The rows of the thread of a letter: the most it takes of the `left` rows the card has for its words, the thread and its ask, and never fewer than CHAT_LEAST.
// The ask keeps the rest, and the words page in what both leave.
export const CHAT_LEAST = 4
export const chatRoomOf = (left: number): number => Math.max(CHAT_LEAST, Math.floor(left / 2))

export type ChatViewProps = {
  ui: Ui
  app: boolean
  lines: ChatLine[]
  // The cells inside the card the thread stands in.
  cells: number
  // The rows the thread and its pager may take; none, the whole thread.
  room?: number
  // The page asked, from 0; none opens on the last page, the newest.
  page?: number
  onPage?: (page: number) => void
}

// Whether a body holds the thread of a letter, whoever drew it.
export const holdsThread = (node: any): boolean =>
  typeof node === 'object' && node !== null && 'type' in node && (propsOf(node).key === CHAT_THREAD || kidsOf(node).some(holdsThread))

// The elements of the thread, to sit among the children of the letter's card; none for a walk that holds no chat. With no `room` the thread hands ALL its
// rows over and draws no pager: the terminal's pager pages them with the rest of the letter (order chat pager).
export function chatView({ ui, app, lines, cells, room, page, onPage }: ChatViewProps) {
  const { Box, Text } = ui
  const rows = chatRows(lines, cells)
  if (rows.length === 0) return []
  const dim = app ? THEME.dim : LOOK.quiet
  const warn = app ? THEME.warn : LOOK.warn
  const shown = room === undefined ? undefined : pageLines({ ui, list: CHAT_LIST, lines: rows.map(row => row.words), room, gap: SPACE.line, wanted: page ?? Number.MAX_SAFE_INTEGER, inner: cells, onPage: next => onPage?.(next) })
  const from = shown === undefined ? 0 : shown.page.from
  const standing = shown === undefined ? rows : rows.slice(from, shown.page.to)
  return [
    <Box key={CHAT_THREAD} flexDirection="column" gap={SPACE.line}>
      <Box key="chat-rows" flexDirection="column">
        {standing.map((row, at) => (
          <Box key={`${CHAT_ROW}${from + at}`} flexDirection="row" columnGap={SPACE.near}>
            <Text color={dim}>{row.name.padEnd(NAME_CELLS)}</Text>
            <Text {...(row.tone === 'dim' ? { color: dim } : row.tone === 'warn' ? { color: warn } : {})}>{row.words}</Text>
          </Box>
        ))}
      </Box>
      {shown?.pager}
    </Box>,
  ]
}
