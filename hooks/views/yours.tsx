// The first of Letters and Your cards (order YC, Y2b), the app's alone: the one dim line of where to write, and the list of the cards he wrote,
// the newest first, each with its state. The list is a part of the Letters body: in the card that says nothing waits it stands over the link
// `Answered today`, with a wait it is a card of its own under the wait. Nothing scrolls: the cards that do not fit the rows the canvas leaves
// stand behind the app's own pager (views/pager.tsx, model/pages.ts). The ROW OF A CARD is `cardRowOf`, one function, and no size, space or
// color is typed in this file: each comes from the theme's and space's names, so a new look is one edit there.
import { firstLine, NO_CARD_LINE, tailOf, YOUR_HEAD } from '../model/yourcards'
import type { YourCard } from '../model/yourcards'
import { kidsOf, namesOf, propsOf, sizeOf } from './cells'
import { CARD_ROWS as BOX_ROWS, pagerCardRows, withKids } from './paged'
import { pagerLinesOf, pagerView } from './pager'
import { SPACE } from './space'
import { THEME, cardProps, cellsOf, fitted, innerOf } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'
import { listRowsOf, yourPageOf, yourPageWith } from './yourfit'

// The name of the list: its page in the pane's memory and the keys of its parts.
export const YOURS_LIST = 'yours'
// The rows of the head `Your cards`.
const HEAD_ROWS = 1
// The pages the pager is counted for, beside the line and the first block of the body: the worst case of its words (a middle page).
const LEAD_PAGES = 4

export type YoursProps = {
  ui: Ui
  plan: Plan
  columns: number
  // The line of where to write (model/yourcards.ts writeLineOf).
  line: string
  // His cards, newest first (yourCardsOf), cut here to the page.
  cards: YourCard[]
  // The pane's rows (the least the pane is high already held), and the rows the canvas keeps for Back or Close; none for the rows is a
  // host that does not say them, and no list is cut to a height nobody told.
  rows?: number
  reserved: number
  // The blocks the pane puts first in the body, before the line (the door line and its Button, order MR, R4): blocks of the body like the
  // others, so they share the first page where they fit and stand on it alone where they do not.
  first?: any[]
  pages?: Record<string, number>
  actions: { open: (cardId: string) => void; page: (list: string, page: number) => void }
}

const keyOf = (node: any): string => String(node?.key ?? propsOf(node).key ?? '')

// THE ROW OF A CARD, the one function: its words as a plain Button that opens it, cut by cells with an ellipsis, and under it one dim line,
// its state (the theme's warning where it waits on him) and what follows it (the first line of its answer, its age), cut by cells.
export function cardRowOf(ui: Ui, card: YourCard, inner: number, open: (cardId: string) => void) {
  const { Box, Text, Button } = ui
  const tail = tailOf(card)
  const room = inner - cellsOf(card.word) - SPACE.near
  return (
    <Box key={`${YOURS_LIST}-card-${card.id}`} flexDirection="column">
      <Button
        key={`${YOURS_LIST}-open-${card.id}`}
        plain
        label={fitted(firstLine(card.text), inner)}
        onPress={() => {
          open(card.id)
        }}
      />
      <Box key={`${YOURS_LIST}-state-${card.id}`} flexDirection="row" columnGap={SPACE.near}>
        <Text color={card.state === 'waits' ? THEME.warn : THEME.dim}>{card.word}</Text>
        {tail !== '' && room > 0 && <Text color={THEME.dim}>{fitted(tail, room)}</Text>}
      </Box>
    </Box>
  )
}

// The line of where to write: the smallest block of the theme's ground that holds it, its words dim and wrapping under 70 columns.
const lineView = ({ ui, line }: YoursProps) => {
  const { Box, Text } = ui
  return (
    <Box key={`${YOURS_LIST}-line`} alignSelf="flex-start" paddingX={SPACE.control} backgroundColor={THEME.ground}>
      <Text color={THEME.dim} wrap="wrap">
        {line}
      </Text>
    </Box>
  )
}

// The body of Letters with the line first and the list after what waits: `body` is what the seat face drew (views/seat.tsx). In the card
// that says nothing waits (key `seat-quiet`) the list stands over its link `Answered today`, a part of that card; else it is a card of its
// own under the wait.
export function yoursBody(props: YoursProps, body: any[]): any[] {
  const { ui, plan, columns, cards, rows, reserved, first = [], pages = {}, actions } = props
  const { Box, Text } = ui
  const names = namesOf(ui as any)
  const inner = innerOf(plan.width, columns)
  const line = lineView(props)
  const above = [...first, line, ...body]
  // The rows the first blocks take with the gap under each, before the line.
  const firstRows = first.reduce((sum, part) => sum + sizeOf(part, plan.width, names).h + SPACE.block, 0)
  const quiet = body.findIndex(part => keyOf(part) === 'seat-quiet')
  // The line is the first of Letters where it stands on the first page with the first block of the body. A wait taller than the canvas leaves
  // beside the line (with the pager under them) keeps the first page, and the line stands after the waits, over Your cards: what waits on him
  // is seen at once. In the card that says nothing waits the line is always first.
  const lead = body.findIndex(part => part !== null && part !== undefined && part !== false)
  const beside = quiet >= 0 || rows === undefined || lead < 0 || firstRows + sizeOf(line, plan.width, names).h + SPACE.block + sizeOf(body[lead], plan.width, names).h + SPACE.block + BOX_ROWS + pagerLinesOf(inner, LEAD_PAGES) <= listRowsOf(rows, columns, reserved)
  // What stands above the list, and what lies round it: the gap, and the card's own rows when the list is a card of its own.
  const standing = above.reduce((sum, part, at) => sum + sizeOf(part, plan.width, names).h + (at > 0 ? SPACE.block : 0), 0)
  const round = (quiet >= 0 ? SPACE.line : SPACE.block + BOX_ROWS) + HEAD_ROWS
  // The body with the list cut to the rows `above` leaves it: the list as a part of its own, then put in its place.
  const compose = (leaves: number, apart: boolean): any[] => {
    // With the body paged (apart) the list is a card of its own with the compact pager, one row: where each row counts, the words of the page go
    const tight = pagerLinesOf(inner, cards.length, false)
    const page =
      rows === undefined
        ? { from: 0, to: cards.length, page: 0, pages: 1, after: 0 }
        : apart
          ? yourPageWith(cards.length, rows, columns, leaves, pages[YOURS_LIST] ?? 0, tight)
          : yourPageOf(cards.length, rows, columns, leaves, pages[YOURS_LIST] ?? 0)
    const part = (
      <Box key={YOURS_LIST} flexDirection="column">
        <Text key={`${YOURS_LIST}-head`} color={THEME.dim}>
          {YOUR_HEAD}
        </Text>
        {cards.length === 0 ? (
          <Text key={`${YOURS_LIST}-none`} color={THEME.dim}>
            {NO_CARD_LINE}
          </Text>
        ) : (
          <Box key={`${YOURS_LIST}-rows`} flexDirection="column">
            {cards.slice(page.from, page.to).map(card => cardRowOf(ui, card, inner, actions.open))}
          </Box>
        )}
        {pagerView({ ui, list: YOURS_LIST, page, inner, onPage: n => actions.page(YOURS_LIST, n), words: !apart })}
      </Box>
    )
    if (quiet < 0 || apart) {
      // drawn tight where the body is paged, as a wait that stands alone is (paged.tsx): the blank rows above and below the part are gone
      const own = (
        <Box key={`${YOURS_LIST}-card`} {...cardProps(plan.width, columns)} {...(apart ? { paddingY: 0 } : {})}>
          {part}
        </Box>
      )
      return beside ? [...first, line, ...body, own] : [...first, ...body, line, own]
    }
    const kids = kidsOf(body[quiet])
    const link = kids.findIndex(kid => keyOf(kid) === 'seat-answered')
    const at = link < 0 ? kids.length : link
    const card = withKids(ui, body[quiet], [...kids.slice(0, at), part, ...kids.slice(at)])
    return [...first, line, ...body.slice(0, quiet), card, ...body.slice(quiet + 1)]
  }
  const shared = compose(reserved + standing + round, false)
  if (rows === undefined) return shared
  // Where the body with the list cut so, with the line and the waits, is more than the canvas leaves, the app pages the body by its blocks and
  // puts its pager card on the page of the list: the list is then a card of its own, cut to what stands on a page of its own with that
  // pager (paged.tsx), the first card and the pager's links within the canvas.
  const blocks = shared.flat(Infinity).filter(part => part !== null && part !== undefined && part !== false)
  const total = blocks.reduce((sum, part, at) => sum + sizeOf(part, plan.width, names).h + (at > 0 ? SPACE.block : 0), 0)
  if (total <= listRowsOf(rows, columns, reserved)) return shared
  return compose(reserved + pagerCardRows(plan, columns, blocks.length + 1) + BOX_ROWS - 2 * SPACE.line + HEAD_ROWS, true)
}
