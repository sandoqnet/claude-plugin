// The pager of a list longer than the canvas (order D1, still A2): the link `N more ›` that turns the page in place, `‹ Earlier` from
// the second page on, and the words "page 2 of 3" between them. Nothing scrolls. A Button of the app is its label alone, cut by
// cells when it does not fit. It draws inside a card on the theme's ground (views/theme.ts), so its words take the theme's keys;
// the terminal's lists keep their own links and never draw this. The pages come from model/pages.ts.
import { pageAt, pageWords } from '../model/pages'
import type { Page } from '../model/pages'
import { SPACE } from './space'
import { THEME, cellsOf, fitted } from './theme'
import type { Ui } from './types'

export type PagerProps = {
  ui: Ui
  // The name of the list: the keys of its parts and the page's place in the pane's memory.
  list: string
  page: Page
  // The cells inside the card, which a label is cut to; with none, no limit.
  inner?: number
  // The page asked: the pane keeps it by the name of the list.
  onPage: (page: number) => void
  // The words of the page, "page 2 of 3": left out (false) by the compact pager over a wait that stands alone on a narrow canvas, where
  // the three parts would wrap to three rows and push the wait's answers under the dock. With none the words stand.
  words?: boolean
}

export const EARLIER = '‹ Earlier'
export const moreWords = (after: number): string => `${after} more ›`

// The rows the pager's own words take in a card `inner` cells wide, for a list of `count` items, in the worst case (a middle page, with
// both links and the widest numbers): the links and the page's words are laid on a row with the gap between, and a row that is full
// wraps, so the rows are stacked with `rowGap` between them. One row when the words fit, three at the most at 40 columns. `words` false
// is the compact pager (order YC, Y2b): the two links alone, with no words of the page between them.
export function pagerLinesOf(inner: number, count: number, words = true): number {
  const widths = [EARLIER, ...(words ? [pageWords({ from: 0, to: 0, page: count - 1, pages: count, after: 0 })] : []), moreWords(count)].map(text => Math.min(cellsOf(text), inner))
  let rows = 1
  let used = 0
  for (const width of widths) {
    if (used > 0 && used + SPACE.control + width > inner) {
      rows += 1
      used = width
    } else used = used === 0 ? width : used + SPACE.control + width
  }
  return rows + (rows - 1) * SPACE.line
}

export type LinesProps = {
  ui: Ui
  // The name of the text: the keys of its pager and the page's place in the pane's memory.
  list: string
  // The rows of the text as they stand, each one row of the card (a text cut by its cells).
  lines: string[]
  // The rows the lines and the pager may take together, and the rows between the lines and the pager.
  room: number
  gap: number
  // The page asked (from 0) and the cells inside the card.
  wanted: number
  inner?: number
  onPage: (page: number) => void
}

// A text of rows paged inside its card (order P1: nothing scrolls): the rows that stand on the page asked and the pager under them. A text that fits
// `room` is one page and has no pager; a page is never less than three rows.
export function pageLines({ ui, list, lines, room, gap, wanted, inner = Number.POSITIVE_INFINITY, onPage }: LinesProps): { shown: string[]; pager: any[]; page: Page } {
  const budget = Math.max(3, room)
  const page = pageAt(
    lines.map(() => 1),
    budget,
    wanted,
    0,
    gap + pagerLinesOf(inner, Math.max(2, lines.length)),
  )
  return { shown: lines.slice(page.from, page.to), pager: pagerView({ ui, list, page, inner, onPage }), page }
}

// Nothing when the list is one page; else one row, wrapping when the card is narrow: the earlier link at the left (not on the first
// page), the page's words dim, the more link at the right (not on the last page).
export function pagerView({ ui, list, page, inner = Number.POSITIVE_INFINITY, onPage, words = true }: PagerProps) {
  const { Box, Text, Button } = ui
  if (page.pages <= 1) return []
  const earlier = page.page > 0
  const more = page.after > 0
  return [
    <Box key={`${list}-pager`} flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" columnGap={SPACE.control} rowGap={SPACE.line}>
      {earlier && (
        <Button
          key={`${list}-earlier`}
          plain
          label={fitted(EARLIER, inner)}
          onPress={() => {
            onPage(page.page - 1)
          }}
        />
      )}
      {words && (
        <Text key={`${list}-page`} color={THEME.dim}>
          {pageWords(page)}
        </Text>
      )}
      {more && (
        <Button
          key={`${list}-more`}
          plain
          label={fitted(moreWords(page.after), inner)}
          onPress={() => {
            onPage(page.page + 1)
          }}
        />
      )}
    </Box>,
  ]
}
