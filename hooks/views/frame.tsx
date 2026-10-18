// The frame of the room as a small desktop (order D1, still A1; the dock is order D2, still F1): the floating top bar, the dock of four
// places with no composer, and the answered place. App surfaces only; the terminal draws as it did. Each view takes its data and its acts by props
// and draws to the width it is told: the pane tells the columns, and `plan` (views/space.ts layout) says the canvas's own.
import { FROM_DESK } from '../model/desk'
import { DOCK_PLACES, TILE_CELL, TILE_ROWS, dockFootOf, dockOf, dockWord } from '../model/dock'
import type { DockSlot } from '../model/dock'
import { tileOf, tileTip } from '../model/marks'
import { pageAt } from '../model/pages'
import type { Tones } from '../model/tones'
import { bodyOf, wrapCells } from './card-rows'
import { pagerLinesOf, pagerView } from './pager'
import { BREAK_STACK, SPACE } from './space'
import { THEME, cardProps, innerOf } from './theme'
import type { Plan } from './theme'
import { tilesOn } from './tiles'
import type { Actions, Nav, Ui } from './types'

// The floating bar stands a row from the top, two cells from each side; the canvas starts a block under it. It is two rows high with a
// round border: the app draws that border as a line inside the box and pads the box itself (measured in the app: about 9 px above
// the words and 14 px a side), so two rows of 20.3 px hold one row of words. The test host's layout counts a border as a cell a side
// and is not the app's own drawing; tests/frame.test.ts holds the height and the one row of words that is never wrapped.
export const BAR_TOP = SPACE.line
export const BAR_ROWS = 2
export const EDGE = SPACE.control
export const CANVAS_TOP = BAR_TOP + BAR_ROWS + SPACE.block

// The rows of the pane the canvas can hold, for a list that pages: the pane's rows, less what stands over it (the bar and its gap) and
// what stands under it, the dock's foot (model/dock.ts: ONE function of the columns, 6 rows or 7, never changing with a wait). Never
// under CANVAS_LEAST, so a short pane still shows one card. `over` (order MR, R4) is what the canvas itself draws first, over its body:
// the line of a door that did not start and its Button, with the gap under them (pane.tsx counts them, starterRowsOf).
export const CANVAS_LEAST = 6
export const canvasRowsOf = (rows: number, columns: number, over = 0): number => Math.max(CANVAS_LEAST, rows - CANVAS_TOP - dockFootOf(columns) - Math.max(0, over))

// The width of the bar's middle (the date and the time, or the time alone), the columns from which the date stands, and the
// columns from which the door's words stand beside its dot.
const MIDDLE_WIDE = 22
const MIDDLE_NARROW = 8
const BREAK_DATE = 64

export type DockPlace = DockSlot

// The place the nav lights in the dock ('' for one no place of the dock holds, the Room place): the desk, a seat's own face (Letters, which
// stands under the desk), the feed, Answered and a letter opened from the desk are the Desk; the level up, another seat's face and a wait
// opened from a seat's window are Seats; the shelf and a profile are the Shelf.
export function dockPlaceOf(nav: Nav, seat: string): DockPlace | '' {
  switch (nav.view) {
    case 'desk':
    case 'feed':
    case 'answered':
    case 'yours':
    case 'ur':
      return 'desk'
    case 'seat':
      return nav.name === '' || nav.name === seat ? 'desk' : 'seats'
    case 'wait':
      return nav.from === FROM_DESK ? 'desk' : 'seats'
    case 'level':
      return 'seats'
    case 'shelf':
    case 'profile':
      return 'shelf'
    case 'settings':
      return 'settings'
    default:
      return ''
  }
}

export type BarProps = {
  ui: Ui
  columns: number
  tones: Tones
  // The room's name and the seat's: the words of the path, never a folder and never the world's own word.
  room: string
  seat: string
  // The date and the time of the middle ('' leaves each out), and the lens word of the tray ('' while the lens is the plain one).
  date: string
  time: string
  lens: string
  // What waits on him (his count of the desk): the tray says `N wait` in the warn tone before the door; none at zero or when not given.
  wait?: number
  // The door of the tray: lit while it runs, and its words ("door up", "door down", "no door in this room"; '' says none).
  doorUp: boolean
  doorWords: string
}

// The door's word of the bar before the room is read, and before the door is asked: no door is said down that was not found down. Its
// dot is dim, as with no word: no orange.
export const DOOR_READING = 'reading'

// THE TOP BAR: it floats, one row of words alone on glass made from the wallpaper, never wrapped. At the left the room's name
// then the seat's in bold; in the middle the date and the time; at the right the tray: the lens word when it is not the plain one,
// then `N wait` in the warn tone while something waits on him, then the door, a dot and its words. The date leaves under 64 columns and
// the door's words under 48. No lens word stands while the lens is the plain one. (A press on the tray is a later still: a clear region
// over it.)
export function barView({ ui, columns, tones, room, seat, date, time, lens, wait = 0, doorUp, doorWords }: BarProps) {
  const { Box, Text } = ui
  const width = columns - 2 * EDGE
  const inner = width - 2 * SPACE.control - 2
  const hasDate = columns >= BREAK_DATE && date !== ''
  const middle = columns >= BREAK_DATE ? MIDDLE_WIDE : MIDDLE_NARROW
  const side = Math.max(1, Math.floor((inner - middle) / 2))
  return (
    <Box
      key="bar"
      position="absolute"
      top={BAR_TOP}
      left={EDGE}
      width={width}
      height={BAR_ROWS}
      flexDirection="row"
      alignItems="center"
      borderStyle="round"
      borderColor={tones.line}
      backgroundColor={tones.ground}
      paddingX={SPACE.control}
    >
      <Box key="bar-left" width={side} flexDirection="row" columnGap={SPACE.near}>
        <Text key="bar-room" color={tones.dim} wrap="truncate-end">
          {room}
        </Text>
        {seat !== '' && (
          <Text key="bar-sep" color={tones.dim} wrap="truncate-end">
            ›
          </Text>
        )}
        {seat !== '' && (
          <Text key="bar-seat" bold color={tones.text} wrap="truncate-end">
            {seat}
          </Text>
        )}
      </Box>
      <Box key="bar-mid" width={middle} flexDirection="row" justifyContent="center" columnGap={SPACE.near}>
        {hasDate && (
          <Text key="bar-date" color={tones.dim} wrap="truncate-end">
            {date}
          </Text>
        )}
        {time !== '' && (
          <Text key="bar-time" bold color={tones.text} wrap="truncate-end">
            {time}
          </Text>
        )}
      </Box>
      <Box key="bar-tray" width={side} flexDirection="row" justifyContent="flex-end" columnGap={SPACE.near}>
        {lens !== '' && (
          <Text key="tray-lens" color={tones.accent} wrap="truncate-end">
            {lens}
          </Text>
        )}
        {wait > 0 && (
          <Text key="tray-wait" color={tones.warn} wrap="truncate-end">
            {`${wait} wait`}
          </Text>
        )}
        <Text key="tray-dot" color={doorWords === '' || doorWords === DOOR_READING ? tones.dim : doorUp ? tones.ok : tones.warn} wrap="truncate-end">
          ●
        </Text>
        {columns >= BREAK_STACK && doorWords !== '' && (
          <Text key="tray-door" color={tones.text} wrap="truncate-end">
            {doorWords}
          </Text>
        )}
      </Box>
    </Box>
  )
}

export type DockProps = {
  ui: Ui
  columns: number
  // The colors made from the wallpaper: the tile's ring, its badge and the line over it.
  tones: Tones
  // The place lit ('' for none), and the counts of the two places that count: the rows that wait on HIM (the Desk), the seats that
  // wait (Seats).
  open: DockPlace | ''
  desk: number
  seats: number
  // The records new on the shelf since he last opened it (order T4a): the Shelf says it quietly, a dot on the tile and `Shelf: N new` in its
  // tip, `Shelf N new` in the words where the dock has the columns spare. None at zero, and none while the Shelf is the place lit.
  fresh?: number
  actions: { open: (place: DockPlace) => void | Promise<void> }
}

// What a press on a place of the dock does, whether it comes from a word's Button or from a clear region over a cell (the register's
// message): the open place shuts its window, any other opens its place. The Desk is lit under Letters, Answered and the feed too: where the
// pane is not on the desk itself (`onDesk` false) a press on it opens the desk, and shuts nothing.
export type DockActs = Pick<Actions, 'open' | 'shut' | 'openLevel'>
export const dockPress =
  (actions: DockActs, open: DockPlace | '', onDesk = true) =>
  (place: DockPlace): void | Promise<void> => {
    if (open === place && (place !== 'desk' || onDesk)) return actions.shut?.()
    if (place === 'desk') return actions.open({ view: 'desk' })
    if (place === 'seats') return actions.openLevel !== undefined ? actions.openLevel() : actions.open({ view: 'level' })
    if (place === 'shelf') return actions.open({ view: 'shelf', by: 'kind' })
    return actions.open({ view: 'settings' })
  }

// A tile's picture is made once for its inputs and kept: a redraw of the pane for any other cause hands the app the very same element,
// so the host has nothing new to load and the eye sees no flicker. A session starts with none kept.
const keptTiles = new Map<string, { Svg: any; element: any }>()
export const forgetTiles = (): void => keptTiles.clear()

// The line over a tile may be this wide at the most: its words, a cell each side, and ` · open`. The dock's border is a cell.
const TIP_MOST = 44
const BORDER = 1

// THE DOCK: it floats at the foot, a row above the pane's foot, centered, on the theme's ground with a border in the theme's line key (the
// app paints the Buttons inside it by its own theme, so the plate follows the theme too). NO SAY BAR: his words go in the session's chat
// box. FROM 70 COLUMNS, with the switch of views/tiles.ts on and the kit giving a picture and a clear region, four PICTURE TILES, a cell
// 6 across and 3 rows high, no name and no key: the plate of the place, the count on its corner, a ring round the lit one, and over the
// cell a clear region that takes the pointer and the press; under the pointer one line stands over the tile (the place, its count in
// words, and `open` for the lit one) and is shifted left so it ends inside the pane. OTHERWISE four WORDS, each a plain Button with its
// label alone, the place's name and its count (`Desk 1`, `Seats 3`, `Shelf`, `Settings`), two cells between, in a cell of its own
// (3 rows in one row of words, the word on the middle row, 2 rows in two rows of two) with the same clear region under it. THE OPEN WORD
// has a rule, a line as wide as the word on the row under it, and the full ink; the others are dim with no rule, so the words never move
// as the open place changes. model/dock.ts says the rows from the columns alone. No Button holds a hotkey.
export function dockView({ ui, columns, tones, open, desk, seats, fresh = 0, actions }: DockProps) {
  const { Box, Button, Text, Svg, Client } = ui
  const news = open === 'shelf' ? 0 : fresh
  const dock = dockOf(columns, tilesOn() && Svg !== undefined && Client !== undefined, news > 0)
  const counts: Record<DockPlace, number> = { desk, seats, shelf: news, settings: 0 }
  const chip = { chip: tones.solid, ink: tones.text }
  // The clear region over a cell: a Client of the pane's own item module (hooks/item.tsx, a path from THIS file), placed over the cell,
  // that posts the press to the register. (`h` is the JSX factory of this file: no name of a size is `h`.)
  const region = (place: DockPlace, across: number, high: number, tip: string, shift: number) =>
    Client !== undefined && (
      <Box key={`over-${place}`} position="absolute" top={tip === '' ? 0 : -SPACE.line} left={0} width={tip === '' ? across : TIP_MOST}>
        <Client key={`region-${place}`} module="../item.tsx" props={{ w: across, h: high, tip, tipAbove: tip !== '', tipShift: shift, press: place, ...chip }} />
      </Box>
    )
  const picture = (place: DockPlace, lit: boolean, alt: string) => {
    const art = tileOf(place, counts[place], lit, tones)
    const key = `dock-icon-${place}-${counts[place] > 9 ? '9+' : counts[place]}-${lit ? `lit${tones.edge}` : 'rest'}-${tones.solid}${tones.text}`
    const held = keptTiles.get(key)
    if (held !== undefined && held.Svg === Svg) return held.element
    const element = <Svg key={key} source={art.source} alt={alt} width={art.width} height={art.height} />
    keptTiles.set(key, { Svg, element })
    return element
  }
  return (
    <Box
      key="dock"
      position="absolute"
      bottom={BAR_TOP}
      left={dock.left}
      width={dock.width}
      flexDirection="column"
      borderStyle="round"
      borderColor={THEME.line}
      backgroundColor={THEME.ground}
      paddingX={dock.tiles ? SPACE.near : SPACE.control}
    >
      <Box key="dock-places" flexDirection="row" flexWrap="wrap" justifyContent="center" columnGap={dock.gap}>
        {DOCK_PLACES.map((place, i) => {
          const lit = open === place
          if (dock.tiles) {
            // the line over the tile, with the room it needs (its words and a cell each side), kept inside the pane's edges
            const line = tileTip(place, counts[place], lit)
            const cellLeft = dock.left + BORDER + SPACE.near + i * (TILE_CELL + dock.gap)
            const shift = Math.max(-(cellLeft - EDGE), Math.min(0, columns - EDGE - (cellLeft + line.length + 2 * SPACE.near)))
            return (
              <Box key={`dock-cell-${place}`} flexDirection="column" alignItems="center" width={TILE_CELL}>
                <Box key={`dock-mark-${place}`} position="relative" width={TILE_CELL} height={TILE_ROWS}>
                  {picture(place, lit, line)}
                  {region(place, TILE_CELL, TILE_ROWS, line, shift)}
                </Box>
              </Box>
            )
          }
          const word = dockWord(place, counts[place], dock.shelfNew)
          return (
            <Box key={`word-${place}`} position="relative" width={dock.cells[i]} height={dock.wordH} flexShrink={0} flexDirection="column" paddingTop={dock.wordH === 3 ? 1 : 0}>
              {region(place, dock.cells[i], dock.wordH, '', 0)}
              <Button
                key={place}
                plain
                label={word}
                {...(lit ? {} : { dimColor: true })}
                onPress={() => {
                  void actions.open(place)
                }}
              />
              {lit && (
                <Text key={`rule-${place}`} wrap="truncate-end">
                  {'─'.repeat(word.length)}
                </Text>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export type AnsweredProps = {
  ui: Ui
  // The plan's width and the columns of the pane: the card stands at the plan's width, like each card of the app's places.
  plan: Plan
  columns: number
  // What he answered today, the newest first: the act he chose and the title of the wait.
  folds: { act: string; title: string }[]
  // The rows the canvas leaves for the card, the page asked (from 0) and the act that turns it. With no `rows` the card holds every
  // answer; with them it shows what fits (a row of an answer is the rows of its words at the card's width), then `N more ›`.
  rows?: number
  page?: number
  onPage?: (page: number) => void
}

export const NOTHING_ANSWERED = 'Nothing answered today.'

// The rows a card takes besides its items: the border, the padding above and below, the title row and the `line` after it.
const CARD_CHROME = 2 + 2 * SPACE.line + 1 + SPACE.line

// The answered place: today's answers, a line each, "● ACT: TITLE", on the theme card (the ground and the keys of views/theme.ts)
// at the plan's width, as each place of the app that holds a control stands. A day with more answers than the canvas holds pages in
// place: the answers that fit, the words "page 2 of 3", `N more ›` and `‹ Earlier` (views/pager.tsx).
export function answeredView({ ui, plan, columns, folds, rows, page = 0, onPage }: AnsweredProps) {
  const { Box, Text } = ui
  const inner = innerOf(plan.width, columns)
  const words = (fold: { act: string; title: string }): string => `${fold.act}: ${fold.title}`
  // a dot, its gap and the words: the words have the card's inner width less those cells
  const across = Math.max(1, inner - 2)
  const wanted = folds.map(fold => wrapCells(words(fold), across).length)
  const room = rows === undefined ? Number.POSITIVE_INFINITY : rows - CARD_CHROME
  // the list is more than one page where its rows and the gaps are more than the card leaves
  const paged = wanted.reduce((sum, high, at) => sum + high + (at > 0 ? SPACE.line : 0), 0) > room
  // the pager keeps its words where the first answer still stands with them; on a short canvas it is the two links, one row
  const pagerWords = !paged || (wanted[0] ?? 0) + SPACE.line + pagerLinesOf(inner, folds.length) <= room
  const pagerRows = SPACE.line + pagerLinesOf(inner, folds.length, pagerWords)
  // an answer taller than a page with its pager is cut by its lines, the last ending in "…", so one always stands with the pager
  const most = paged ? Math.max(1, room - pagerRows) : Number.POSITIVE_INFINITY
  const heights = wanted.map(high => Math.min(high, most))
  const shown = rows === undefined ? undefined : pageAt(heights, room, page, SPACE.line, pagerRows)
  const items = shown === undefined ? folds : folds.slice(shown.from, shown.to)
  const wordsOf = (fold: { act: string; title: string }, at: number): string => (wanted[at] > heights[at] ? bodyOf(words(fold), across, heights[at]).join('\n') : words(fold))
  return [
    <Box key="answered" {...cardProps(plan.width, columns)}>
      <Text bold>Answered today</Text>
      {folds.length === 0 && <Text color={THEME.dim}>{NOTHING_ANSWERED}</Text>}
      {items.map((fold, i) => (
        <Box key={`answered-${(shown?.from ?? 0) + i}`} flexDirection="row" columnGap={SPACE.near}>
          <Text color={THEME.ok}>●</Text>
          <Text color={THEME.dim} wrap="wrap">{wordsOf(fold, (shown?.from ?? 0) + i)}</Text>
        </Box>
      ))}
      {shown !== undefined && onPage !== undefined && pagerView({ ui, list: 'answered', page: shown, inner, onPage, words: pagerWords })}
    </Box>,
  ]
}
