// THE PAGER OF THE PLACES IN THE TERMINAL (order mend terminal real, mend 4): NOTHING SCROLLS, and no place says "This place needs N rows" while its
// body has the rows to page in. A place whose parts do not stand whole in the rows the frame leaves (views/paged.tsx fitBody found no way) is cut
// into its parts: a column goes down to its rows, a row, a Text or a Button is one part, and the borders and the air between go (the tight form).
// The parts that fit stand on the page asked, then ONE row of plain links as the desk's: `[ ‹ Earlier ]`, the page's words quiet, `[ N more › ]`.
// A place whose first part is taller than the rows with the pager is none of this, and keeps its line. Pure over the kit: the rows come from
// views/cells.ts (a Button counted as the host draws it), the pages from model/pages.ts.
import { pageAt, pageWords } from '../model/pages'
import type { Page } from '../model/pages'
import { BUTTON_CELLS, kidsOf, namesOf, propsOf, sizeOf } from './cells'
import type { Names } from './cells'
import { LOOK } from './look'
import { EARLIER, moreWords } from './pager'
import type { Ui } from './types'

// The name of the list in the pane's memory (steps to another place forget it, model/pages.ts pagesKept) and the keys of its links.
export const TERMINAL_LIST = 'terminal'
const LINK_GAP = 2

// The rows the pager takes in `inner` cells for a list of `pages` pages, in the worst case (a middle page, the widest numbers): the links and the
// words laid on a row with the gap between, wrapping where they pass the width.
export function terminalPagerRows(inner: number, pages: number): number {
  const widths = [BUTTON_CELLS + EARLIER.length, pageWords({ from: 0, to: 0, page: Math.max(0, pages - 1), pages, after: 0 }).length, BUTTON_CELLS + moreWords(pages).length]
  let rows = 1
  let used = 0
  for (const width of widths) {
    if (used > 0 && used + LINK_GAP + width > inner) {
      rows += 1
      used = width
    } else used = used === 0 ? width : used + LINK_GAP + width
  }
  return rows
}

// Nothing when the list is one page; else the row of the links, the earlier one not on the first page, the more one not on the last.
export function terminalPagerView({ ui, list, page, onPage }: { ui: Ui; list: string; page: Page; onPage: (page: number) => void }) {
  const { Box, Text, Button } = ui
  if (page.pages <= 1) return []
  return [
    <Box key={`${list}-pager`} flexDirection="row" flexWrap="wrap" columnGap={LINK_GAP}>
      {page.page > 0 && <Button key={`${list}-earlier`} label={EARLIER} onPress={() => onPage(page.page - 1)} />}
      <Text key={`${list}-page`} color={LOOK.quiet}>
        {pageWords(page)}
      </Text>
      {page.after > 0 && <Button key={`${list}-more`} label={moreWords(page.after)} onPress={() => onPage(page.page + 1)} />}
    </Box>,
  ]
}

// The parts of a node: a column Box (no row, no absolute place) is its children's parts; any other node is one part.
function partsOf(names: Names, node: any): any[] {
  if (typeof node !== 'object' || node === null) return node === '' || node === false || node === null || node === undefined ? [] : [node]
  if (!('type' in node)) return []
  const own = propsOf(node)
  if (names(node.type) !== 'Box' || own.flexDirection === 'row' || own.position === 'absolute') return [node]
  return kidsOf(node).flatMap(kid => partsOf(names, kid))
}

export type TerminalPageProps = {
  ui: Ui
  // The columns of the body and the rows the frame leaves for the place.
  columns: number
  room: number
  // The pages the pane keeps, by the name of the list, and the act that turns one.
  pages?: Record<string, number>
  onPage: (list: string, page: number) => void
}

// The body cut into pages, or none where no page can hold a part with the pager (the caller keeps its line then).
export function terminalPaged({ ui, columns, room, pages = {}, onPage }: TerminalPageProps, body: any[]): any[] | undefined {
  const names = namesOf(ui as any)
  const parts = body.flat(Infinity).flatMap(node => partsOf(names, node))
  if (parts.length === 0) return undefined
  const heights = parts.map(part => sizeOf(part, columns, names).h)
  const pagerRows = terminalPagerRows(columns, parts.length)
  const page = pageAt(heights, room, pages[TERMINAL_LIST] ?? 0, 0, pagerRows)
  const used = heights.slice(page.from, page.to).reduce((sum, high) => sum + high, 0) + (page.pages > 1 ? pagerRows : 0)
  if (page.to <= page.from || used > room) return undefined
  return [...parts.slice(page.from, page.to), ...terminalPagerView({ ui, list: TERMINAL_LIST, page, onPage: at => onPage(TERMINAL_LIST, at) })]
}
