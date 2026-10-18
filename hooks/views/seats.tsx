// The Seats place and the window of a seat (order D1, still A2), the app's alone: the terminal keeps the level up of views/seat.tsx.
// Both are the theme card of views/theme.ts at the plan's width, every Button its label alone. Nothing scrolls: the Waiting rows page
// by the rows the canvas leaves, the Quiet names six to a page, and a seat's waits by the rows too (model/pages.ts, views/pager.tsx).
import { pageAt, pageBy } from '../model/pages'
import type { Page } from '../model/pages'
import { pagerLinesOf, pagerView } from './pager'
import { SPACE } from './space'
import { THEME, actsProps, cardProps, fitted, innerOf, insetOf } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

export const NOTHING_WAITS_ON_ANY = 'Nothing waits on any seat.'
// The quiet seats show this many names a page, whatever the rows.
export const QUIET_SHOWN = 6
export const SAY_TO = (name: string): string => `Say to ${name}`
export const ANSWERS_THESE = (name: string): string => `${name} answers these`

// The rows a card takes besides its items: the border, the padding above and below, the title row and the `line` after it.
const CARD_CHROME = 2 + 2 * SPACE.line + 1 + SPACE.line
// The rows of a seat's window besides its waits, at the most (an ESTIMATE: the host does not say how a row wraps): the card's own,
// the name, the line of who it is, the line of whom it answers for, the acts (two rows when they wrap) and the `line` between parts.
const WINDOW_CHROME = 2 + 2 * SPACE.line + 3 + 2 + 4 * SPACE.line

export type SeatsRow = {
  name: string
  here: boolean
  // The open waits of the seat and the title of the first.
  count: number
  first: string
  // Who the seat is in the room's own data: its role word, after a kind the room writes ('' when it says none: no line is drawn).
  who: string
}

export type SeatsProps = {
  ui: Ui
  plan: Plan
  columns: number
  // Each seat with a wait, this seat first, and the names of the seats with none.
  rows: SeatsRow[]
  quiet: string[]
  // The rows the canvas leaves, and the page each list stands on (from 0).
  canvasRows: number
  pages?: Record<string, number>
  actions: { openSeat: (name: string) => void; page: (list: string, page: number) => void }
}

// The two links that turn between the Waiting and the Quiet card, where the canvas holds one of them: each names the card it goes to.
const OTHER_CARD = { earlier: '‹ Waiting', more: 'Quiet ›' }

// The pager of a list takes its words ("page 2 of 12") only where the first item still stands with them in the rows given; else it is the
// two links alone, which are one row, so an item is never left under the dock for the words of a pager.
const wordsFit = (first: number, room: number, inner: number, count: number): boolean => first + SPACE.line + pagerLinesOf(inner, count) <= room

// The rows of the items of a page, one gap between two.
const stackOf = (heights: number[], page: Page): number => heights.slice(page.from, page.to).reduce((sum, high, at) => sum + high + (at > 0 ? SPACE.line : 0), 0)

// The place, two cards: Waiting, a row a seat (its name a Button that opens the seat, "N waiting" at the right, the title of its first
// wait under it, then one dim line that says who the seat is when the room says), and Quiet N, the names alone, six to a page. The two
// stand together where the canvas holds both (the Quiet names fewer a page, down to one, before they do not); where it cannot hold even
// one row of each, they are the two pages of one list (`seats`), Waiting first, and a pager under the card turns to the other.
export function seatsView({ ui, plan, columns, rows, quiet, canvasRows, pages = {}, actions }: SeatsProps) {
  const { Box, Text, Button } = ui
  const inner = innerOf(plan.width, columns)

  const heights = rows.map(row => 1 + (row.first === '' ? 0 : 1) + (row.who === '' ? 0 : 1))
  // the Waiting card in `room` rows: its page and what it takes (an empty card says so in one row)
  const emptyRow = rows.length === 0 ? 1 : 0
  const waitingIn = (room: number) => {
    const left = room - CARD_CHROME - emptyRow
    const words = wordsFit(heights[0] ?? 0, left, inner, rows.length)
    const pager = SPACE.line + pagerLinesOf(inner, rows.length, words)
    const page = pageAt(heights, left, pages.waiting ?? 0, SPACE.line, pager)
    return { page, words, high: CARD_CHROME + emptyRow + stackOf(heights, page) + (page.pages > 1 ? pager : 0) }
  }
  // the Quiet card with `names` a page at the most, and what it takes
  const quietOf = (names: number) => {
    const page = pageBy(quiet.length, Math.max(1, Math.min(QUIET_SHOWN, names)), pages.quiet ?? 0)
    return { page, high: CARD_CHROME + (page.to - page.from) + (page.pages > 1 ? SPACE.line + pagerLinesOf(inner, quiet.length) : 0) }
  }

  // together: the Quiet names as many as the canvas leaves the Waiting card its first row
  const sizes = quiet.length === 0 ? [0] : Array.from({ length: Math.min(QUIET_SHOWN, quiet.length) }, (_, at) => Math.min(QUIET_SHOWN, quiet.length) - at)
  const together = sizes
    .map(names => {
      const quietNow = quiet.length === 0 ? undefined : quietOf(names)
      const under = quietNow === undefined ? 0 : SPACE.block + quietNow.high
      return { waitingNow: waitingIn(canvasRows - under), quietNow, under }
    })
    .find(one => one.waitingNow.high + one.under <= canvasRows)
  // apart: one card a page, the pager of the two cards (its links alone) under it
  const apart = together === undefined
  const cards = pageBy(quiet.length === 0 ? 1 : 2, 1, pages.seats ?? 0)
  const cardsPager = SPACE.block + pagerLinesOf(inner, 2, false)
  const quietRoom = canvasRows - cardsPager - CARD_CHROME
  const quietApart = quietOf(quiet.length > QUIET_SHOWN || quiet.length > quietRoom ? quietRoom - SPACE.line - pagerLinesOf(inner, quiet.length) : quietRoom)
  const waitingShown = together?.waitingNow ?? waitingIn(canvasRows - (quiet.length === 0 ? 0 : cardsPager))
  const quietShown = together === undefined ? quietApart : together.quietNow
  const showWaiting = !apart || cards.page === 0
  const showQuiet = quiet.length > 0 && (!apart || cards.page === 1)
  const waiting = waitingShown.page
  const quietPage = quietShown?.page ?? pageBy(0, 1)

  const rowViews = rows.slice(waiting.from, waiting.to).map(row => {
    const count = `${row.count} waiting`
    // the name is cut to the cells the count and the gap leave, so a row is one row at any width
    const room = inner - count.length - SPACE.control - (row.here ? 'here'.length + SPACE.near : 0)
    return (
      <Box key={`seats-row-${row.name}`} flexDirection="column">
        <Box key={`seats-head-${row.name}`} flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
          <Box key={`seats-left-${row.name}`} flexDirection="row" columnGap={SPACE.near}>
            <Button
              key={`seats-open-${row.name}`}
              plain
              label={fitted(row.name, Math.max(2, room))}
              onPress={() => {
                actions.openSeat(row.name)
              }}
            />
            {row.here && <Text color={THEME.dim}>here</Text>}
          </Box>
          <Text bold>{count}</Text>
        </Box>
        {row.first !== '' && (
          <Text color={THEME.dim} wrap="truncate-end">
            {row.first}
          </Text>
        )}
        {row.who !== '' && (
          <Text color={THEME.dim} wrap="truncate-end">
            {fitted(row.who, inner)}
          </Text>
        )}
      </Box>
    )
  })

  return [
    ...(showWaiting
      ? [
          <Box key="seats-waiting" {...cardProps(plan.width, columns)}>
            <Box key="seats-waiting-head" flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
              <Text bold>Waiting</Text>
              <Text color={THEME.dim}>{String(rows.length)}</Text>
            </Box>
            {rows.length === 0 && <Text color={THEME.dim}>{NOTHING_WAITS_ON_ANY}</Text>}
            {rowViews.length > 0 && (
              <Box key="seats-rows" flexDirection="column" gap={SPACE.line}>
                {rowViews}
              </Box>
            )}
            {pagerView({ ui, list: 'waiting', page: waiting, inner, onPage: page => actions.page('waiting', page), words: waitingShown.words })}
          </Box>,
        ]
      : []),
    ...(showQuiet
      ? [
          <Box key="seats-quiet" {...cardProps(plan.width, columns)}>
            <Box key="seats-quiet-head" flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
              <Text bold>Quiet</Text>
              <Text color={THEME.dim}>{String(quiet.length)}</Text>
            </Box>
            <Box key="seats-quiet-names" flexDirection="column">
              {quiet.slice(quietPage.from, quietPage.to).map(name => (
                <Text key={`seats-quiet-${name}`} color={THEME.dim} wrap="truncate-end">
                  {name}
                </Text>
              ))}
            </Box>
            {pagerView({ ui, list: 'quiet', page: quietPage, inner, onPage: page => actions.page('quiet', page) })}
          </Box>,
        ]
      : []),
    // the pager of the two cards stands on the theme's ground, as the card's words do, for it holds Buttons
    ...(apart && cards.pages > 1
      ? [
          <Box key="seats-cards" backgroundColor={THEME.ground} paddingX={insetOf(columns)} width={plan.width}>
            <Box key="seats-pager" flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" columnGap={SPACE.control} rowGap={SPACE.line}>
              {cards.page > 0 && <Button key="seats-earlier" plain label={fitted(OTHER_CARD.earlier, inner)} onPress={() => actions.page('seats', cards.page - 1)} />}
              {cards.after > 0 && <Button key="seats-more" plain label={fitted(OTHER_CARD.more, inner)} onPress={() => actions.page('seats', cards.page + 1)} />}
            </Box>
          </Box>,
        ]
      : []),
  ]
}

export type SeatWindowWait = { cardId: string; askId: string; title: string; asks: string; hisOwn: boolean }

export type SeatWindowProps = {
  ui: Ui
  plan: Plan
  columns: number
  name: string
  // Who the seat is in the room's own word ('' draws no line).
  who: string
  waits: SeatWindowWait[]
  // Whether the composer says to this seat now.
  saying: boolean
  canvasRows: number
  pages?: Record<string, number>
  actions: {
    openWait: (cardId: string, askId: string) => void
    sayTo: () => void
    page: (list: string, page: number) => void
  }
}

// The window of a seat other than this one: its name bold and, dim, who it is (when the room says) and, when a wait asks it, the line
// "NAME answers these"; its waits as rows, each with a dim line that says whom it asks. A wait that asks HIM is a Button that opens
// the SAME window as under Letters, with its answer; a wait that asks the seat is words, for he answers none for a seat. The one act:
// "Say to NAME", which sets the composer's Select to that seat. The window is a row one step deep, so its top holds "‹ Back to Seats"
// alone (the pane's canvas draws it) and the step away sets the composer back to the room.
export function seatWindowView({ ui, plan, columns, name, who, waits, saying, canvasRows, pages = {}, actions }: SeatWindowProps) {
  const { Box, Text, Button } = ui
  const inner = innerOf(plan.width, columns)
  const heights = waits.map(() => 2)
  // the pager keeps its words where the first wait still stands with them; on a short canvas it is the two links, one row
  const words = wordsFit(2, canvasRows - WINDOW_CHROME, inner, waits.length)
  const shown = pageAt(heights, canvasRows - WINDOW_CHROME, pages['seat-waits'] ?? 0, SPACE.line, SPACE.line + pagerLinesOf(inner, waits.length, words))
  const asksSeat = waits.some(wait => !wait.hisOwn)
  return [
    <Box key="seat-window" {...cardProps(plan.width, columns)}>
      <Box key="seat-window-head" flexDirection="column">
        <Text bold wrap="truncate-end">
          {name}
        </Text>
        {who !== '' && (
          <Text color={THEME.dim} wrap="truncate-end">
            {fitted(who, inner)}
          </Text>
        )}
        {asksSeat && (
          <Text color={THEME.dim} wrap="truncate-end">
            {ANSWERS_THESE(name)}
          </Text>
        )}
      </Box>
      {waits.length === 0 && <Text color={THEME.dim}>{`Nothing waits on ${name}.`}</Text>}
      {waits.length > 0 && (
        <Box key="seat-window-waits" flexDirection="column" gap={SPACE.line}>
          {waits.slice(shown.from, shown.to).map(wait => (
            <Box key={`seat-wait-${wait.cardId}-${wait.askId}`} flexDirection="column">
              {wait.hisOwn ? (
                <Button
                  key={`seat-open-${wait.cardId}-${wait.askId}`}
                  plain
                  label={fitted(wait.title, inner)}
                  onPress={() => {
                    actions.openWait(wait.cardId, wait.askId)
                  }}
                />
              ) : (
                <Text wrap="truncate-end">{wait.title}</Text>
              )}
              <Text color={THEME.dim} wrap="truncate-end">{`asks ${wait.asks}`}</Text>
            </Box>
          ))}
        </Box>
      )}
      {pagerView({ ui, list: 'seat-waits', page: shown, inner, onPage: page => actions.page('seat-waits', page), words })}
      <Box key="seat-window-acts" {...actsProps(plan.stack)}>
        <Button
          key="seat-say-to"
          variant={saying ? 'primary' : 'secondary'}
          label={fitted(SAY_TO(name), inner)}
          onPress={() => {
            actions.sayTo()
          }}
        />
      </Box>
    </Box>,
  ]
}
