// The page of a desk item (order R3), under its words and its Done: the md file the item's origin names, drawn by the kit's Markdown (headings,
// paragraphs, lists, quotes and code are the kit's), in the app and in the terminal alike. NOTHING SCROLLS (order P2), so the file is not one Markdown but
// several, one for each block (a heading with the paragraph under it, a paragraph, a whole list, a quote, a code fence), and a block taller than the
// card's rows is cut at its lines: the pane's one rule then pages the card of the item by these parts, as it pages a letter. While the file is read it
// says so; a refused path, a missing file or a read that failed is the one line of why. The path itself stands on the item's own origin line. Pure draw:
// the register reads the file.
import { PAGE_READING, pageParts } from '../model/page.ts'
import type { PageRead } from '../model/page.ts'
import { LOOK } from './look'
import { THEME } from './theme'
import type { Ui } from './types'

// The rows of the card that are not the page's: its border and padding, and the pager under a page (its gap and its rows), so a block cut to fit
// `rows` still stands on a page of its own with the pager.
const CHROME_ROWS = 7
// The least rows of a piece of a cut block, whatever the pane gives.
const LEAST_PIECE = 3
// The columns of a card when the caller gives none: the least the pane draws.
const WIDTH_LEAST = 36

// `rows` is the rows the canvas leaves for the body, `width` the columns of the card's inner; both unknown, no block is cut.
export type PageProps = { ui: Ui; app: boolean; page: PageRead; rows?: number; width?: number }

export function pageView({ ui, app, page, rows, width }: PageProps) {
  const { Text, Markdown } = ui
  const key = `page-${page.item}`
  if (page.state === 'reading') return [<Text key={`${key}-reading`} color={app ? THEME.dim : LOOK.quiet}>{PAGE_READING}</Text>]
  if (page.line !== '') {
    return [
      <Text key={`${key}-line`} color={app ? THEME.warn : LOOK.warn} wrap="wrap">
        {page.line}
      </Text>,
    ]
  }
  const piece = rows === undefined ? undefined : Math.max(LEAST_PIECE, rows - CHROME_ROWS)
  return pageParts(page.text, piece, width ?? WIDTH_LEAST).map((text, at) => <Markdown key={`${key}-text-${at}`} text={text} />)
}
