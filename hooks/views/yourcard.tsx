// A card of his, open (order YC, Y2c), the app's alone: the Letters window with `‹ Letters` on top (the canvas draws it, backOf of pane.tsx),
// the card's state on its head, then his words WHOLE and the answer WHOLE, wrapped to the card's cells, a line a row. Nothing scrolls: the
// lines that do not fit the rows the canvas leaves stand behind the app's own pager, its page kept in the pane's memory by OPEN_PAGE. The size,
// the space and the color are the theme's and space's names, never typed here.
import { OPEN_PAGE, pageAt } from '../model/pages'
import type { YourCard } from '../model/yourcards'
import { wrapCells } from './card-rows'
import { CARD_ROWS } from './paged'
import { pagerLinesOf, pagerView } from './pager'
import { SPACE } from './space'
import { THEME, cardProps, fitted, innerOf } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

export const ANSWER_HEAD = 'The answer'
export const GONE_LINE = 'This card is not on your list now.'

// The rows the card takes besides its lines: its box (paged's CARD_ROWS), the head's row and the gap after it.
const CHROME = CARD_ROWS + 1 + SPACE.line

// Where the canvas has not the rows for the ask beside the card, the card takes the whole canvas and says where the ask stands: in Letters, above
// Your cards, answered as it is today. The ask stands under the card where the canvas leaves it LEAST_LINES lines and the pager besides.
export const ANSWER_IN_LETTERS = 'Answer it in Letters.'
const LEAST_LINES = 3
export const asksFit = (room: number, asked: number, inner: number): boolean => room - asked >= CHROME + LEAST_LINES + SPACE.line + pagerLinesOf(inner, 99)

export type OpenLine = { text: string; dim: boolean }

// The lines of an open card at `inner` cells: his words, then, when the room answered, the dim head of the answer and the answer.
export function openLinesOf(card: YourCard, inner: number): OpenLine[] {
  const words = wrapCells(card.text.trim(), inner).map(text => ({ text, dim: false }))
  if (card.whole === '') return words
  return [...words, { text: ANSWER_HEAD, dim: true }, ...wrapCells(card.whole, inner).map(text => ({ text, dim: false }))]
}

// The head of the open card: its state's word (the theme's warning where it waits on him) and its age.
export const headOf = (card: YourCard): string => [card.word, card.age].filter(part => part !== '').join(' · ')

export type OpenProps = {
  ui: Ui
  plan: Plan
  columns: number
  // The card, or none when it has left the list (the ids moved on).
  card: YourCard | undefined
  // The rows the canvas leaves for this card (less Back and what stands beside it); none is a host that does not say them, and no card is
  // cut to a height nobody told.
  rows?: number
  pages?: Record<string, number>
  onPage: (page: number) => void
  // The card waits on him and its ask does not stand beside it: one dim line under the head says where to answer.
  answerIn?: boolean
}

export function yourCardView({ ui, plan, columns, card, rows, pages = {}, onPage, answerIn = false }: OpenProps) {
  const { Box, Text } = ui
  const inner = innerOf(plan.width, columns)
  if (card === undefined) {
    return (
      <Box key="yours-open" {...cardProps(plan.width, columns)}>
        <Text key="yours-open-gone" color={THEME.dim}>
          {GONE_LINE}
        </Text>
      </Box>
    )
  }
  const lines = openLinesOf(card, inner)
  const chrome = CHROME + (answerIn ? 1 + SPACE.line : 0)
  const page = rows === undefined ? undefined : pageAt(lines.map(() => 1), rows - chrome, pages[OPEN_PAGE] ?? 0, 0, SPACE.line + pagerLinesOf(inner, lines.length))
  const shown = page === undefined ? lines : lines.slice(page.from, page.to)
  return (
    <Box key="yours-open" {...cardProps(plan.width, columns)}>
      <Text key="yours-open-head" color={card.state === 'waits' ? THEME.warn : THEME.dim}>
        {fitted(headOf(card), inner)}
      </Text>
      {answerIn && (
        <Text key="yours-open-answer-in" color={THEME.dim}>
          {fitted(ANSWER_IN_LETTERS, inner)}
        </Text>
      )}
      <Box key="yours-open-lines" flexDirection="column">
        {shown.map((line, at) => (
          <Text key={`yours-open-line-${(page?.from ?? 0) + at}`} {...(line.dim ? { color: THEME.dim } : {})}>
            {line.text}
          </Text>
        ))}
      </Box>
      {page !== undefined && pagerView({ ui, list: OPEN_PAGE, page, inner, onPage })}
    </Box>
  )
}
