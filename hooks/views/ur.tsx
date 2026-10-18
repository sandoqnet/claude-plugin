import { pageAt } from '../model/pages'
import type { Board } from '../model/ur'
import { boardRows, faultLine, moveLine, motionOf, movesOf, readGame, rollLine, sideRow, stoodLine, tappable, turnLine, urGameOf } from '../model/ur'
import { CALM_HOUR } from '../model/background'
import { tonesOf } from '../model/tones'
import type { Tones } from '../model/tones'
import { boardPicture, pictureRows, plateOf } from '../model/urboard'
import type { Picture } from '../model/urboard'
import { namesOf, sizeOf } from './cells'
import { isApp } from './glass'
import { LOOK } from './look'
import { listRowWidth, pressBox, pressLinesOf, pressPagerRows, pressPagerView, pressWidth } from './press'
import { CELL, SPACE } from './space'
import { PRESS, THEME, besideOf, cardProps, fitted, innerOf, insetOf } from './theme'
import type { Plan } from './theme'
import type { Actions, Card, Ui, UrWindow } from './types'

export const PLAY_LABEL = 'Play Ur'
export const TURN_LABEL = 'Your turn in Ur'
export const GONE_LINE = 'This game is not there now.'
// The rows of the moves list that make one part of the window, and the most a square of the board's smaller picture is across, in pixels.
const MOVES_BY = 3
const SMALL_SQUARE = 16

// The one press box that opens the game, after the handed line of an open card handed to ur (order UR, cut U2; a press box of views/press.tsx,
// order DP, P1, in the app; the terminal keeps its Button). It stands where the card has a game (urGameOf, the one function that names it)
// and nowhere else; a press opens the window of the game with Back to this card.
export function urPlayView({ ui, card, surface, actions }: { ui: Ui; card: Card; surface?: string; actions: Actions }) {
  const { Button } = ui
  if (urGameOf(card.raw) === '') return []
  const open = () => {
    void actions.open({ view: 'ur', cardId: card.id, from: 'card' })
  }
  if (isApp(surface)) return [pressBox({ ui, id: `ur-play-${card.id}`, label: PLAY_LABEL, onPress: open })]
  return [<Button key={`ur-play-${card.id}`} label={PLAY_LABEL} onPress={open} />]
}

// The one row of Letters while his ask is open (order UR, cut U2): the press box `Your turn in Ur`, on a block of the theme's ground, the
// smallest that holds the box, as Back stands. None where no game is read, its ask is none, is a seat's, or has no choice to tap; the app's alone.
export function urRowView({ ui, window, surface, actions }: { ui: Ui; window: UrWindow | undefined; surface?: string; actions: Actions }) {
  const { Box } = ui
  if (window === undefined || !isApp(surface) || !tappable(readGame(window.text))) return []
  return [
    <Box key="ur-turn-row" alignSelf="flex-start" paddingX={SPACE.control} backgroundColor={THEME.ground}>
      {pressBox({
        ui,
        id: 'ur-turn',
        label: TURN_LABEL,
        onPress: () => {
          void actions.open({ view: 'ur', cardId: window.card, from: 'letters' })
        },
      })}
    </Box>,
  ]
}

// The board's picture as an element of the kit, in a Box of its own that holds the picture's cells (as the dock's tiles do), so the pane counts its
// rows (views/cells.ts). Its words for the eye that cannot see it are the two side rows.
// A picture is made once for its source and kept (order MOTION): a draw of the window for any cause that changes no word of the board hands the app
// the very same element, so the host has nothing new to load and the move's animation, which a new element would start again, plays once, when the
// board is new. Each source stays as long as the last few; a session starts with none kept (forgetPictures).
const KEPT_MOST = 16
const keptPictures = new Map<string, { Box: any; Svg: any; element: any }>()
export const forgetPictures = (): void => keptPictures.clear()

function pictureNode({ Box, Svg }: { Box: any; Svg: any }, picture: Picture, board: Board, at: string) {
  const alt = `${sideRow('You', board.you)}. ${sideRow('Them', board.them)}.`
  const key = `${at}|${alt}|${picture.source}`
  const held = keptPictures.get(key)
  if (held !== undefined && held.Box === Box && held.Svg === Svg) return held.element
  const element = (
    <Box key={`ur-picture-${at}`} position="relative" width={Math.ceil(picture.width / CELL.width)} height={pictureRows(picture)}>
      <Svg key={`ur-board-${at}`} source={picture.source} alt={alt} width={picture.width} height={picture.height} />
    </Box>
  )
  keptPictures.delete(key)
  keptPictures.set(key, { Box, Svg, element })
  if (keptPictures.size > KEPT_MOST) keptPictures.delete(keptPictures.keys().next().value as string)
  return element
}

export type UrPlaceProps = {
  ui: Ui
  plan: Plan
  columns: number
  surface?: string
  // The rows the canvas leaves for the window (less the row of Back and its gap); none is a host that does not say them, and the window is
  // not cut to a height nobody told.
  rows?: number
  // What the register read of the game of the card the nav names; none when that card has no game now.
  window: UrWindow | undefined
  // The way back, drawn by the window itself in the terminal; the canvas of the app draws it in its strip.
  back?: { label: string; press: () => void }
  // The page of the choices the pane keeps (from 0) and the act that turns it: the choices are press boxes, which page by the one rule.
  page?: number
  onPage?: (page: number) => void
  actions: Actions
  // The hour's made colors the picture takes (the ones the bar and the dock take, handed down by the pane); the calm hour where none is handed.
  tones?: Tones
}

// The window of a game of Ur, a place of its own (order UR, cut U2), as a wait's own window: the title Ur, the board as text rows (his side
// first, then theirs, the last move, who won), then what the game asks. HIS open ask is its roll, its words and each choice as a Button; a press
// runs the tap.sh of room-seat in the run folder, as the instance ur (actions.urTap), and the game is read again. A seat's ask is one line, "NAME's turn.", and no Button. The move that
// stood is one line, a fault of a tap under the open ask is one line with its WHY, and the one line the last tap left stands under them.
// It is one card in the app. Where the card is taller than the canvas it is drawn tight, then the ask with its choices stands FIRST under the
// title, so the choices are on the page he sees; what is left pages by the app's one rule (paged.tsx pagedCard, by its parts). Each key carries
// the card's id.
export function urPlaceView({ ui, plan, columns, surface, rows, window, back, page = 0, onPage, actions, tones = tonesOf(CALM_HOUR) }: UrPlaceProps) {
  const { Box, Text, Button } = ui
  const glass = isApp(surface)
  const quiet = glass ? THEME.dim : LOOK.quiet
  const warn = glass ? THEME.warn : LOOK.warn
  const at = window?.card ?? ''
  const line = (key: string, words: string, color?: string) => (
    <Text key={`ur-${key}-${at}`} wrap="wrap" {...(color === undefined ? {} : { color })}>
      {words}
    </Text>
  )
  // The title Ur is the canvas's strip in the app (views/strip.tsx: Back, the title, Close); the terminal has no strip and the window says it.
  const head = glass
    ? []
    : [
        <Text key={`ur-head-${at}`} bold>
          Ur
        </Text>,
      ]
  const backRow =
    glass || back === undefined ? [] : [<Button key={`ur-back-${at}`} plain label={back.label} onPress={back.press} />]
  const section = (key: string, kids: any[]) =>
    kids.length === 0 ? [] : [
      <Box key={`ur-${key}-${at}`} flexDirection="column">
        {kids}
      </Box>,
    ]
  let place: any[]
  if (window === undefined) place = [...head, ...section('gone', [line('gone-line', GONE_LINE, quiet)])]
  else {
    const game = readGame(window.text)
    const ask = game.ask
    // The board as text rows: his side and theirs, then the last move and who won. The app may put its picture in place of the two sides.
    const board: any[] = []
    if (game.board === undefined && ask === undefined) board.push(line('none', 'The game has not begun.', quiet))
    if (game.board !== undefined) boardRows(game.board).forEach((words, i) => board.push(line(`board-${i}`, words)))
    const sidesAt = game.board === undefined ? board.length : 2
    // The moves of the game, newest first, three rows to a part, so they page by parts as the rest of the window does (app alone).
    const moveRows = glass ? movesOf(window.text).map(moveLine) : []
    const chunks: any[] = []
    for (let i = 0; i < moveRows.length; i += MOVES_BY) {
      chunks.push(
        <Box key={`ur-moves-${i / MOVES_BY}-${at}`} flexDirection="column">
          {moveRows.slice(i, i + MOVES_BY).map((words, j) => line(`move-${i + j}`, words, quiet))}
        </Box>,
      )
    }
    // the lines of the ask before its choices and after them, and the choices themselves (HIS open ask, whose id is an id, when no tap runs)
    const before: any[] = []
    const under: any[] = []
    const after: any[] = []
    let choices: string[] = []
    if (ask !== undefined && game.open) {
      if (!game.his) before.push(line('turn', turnLine(ask), quiet))
      else {
        if (rollLine(ask) !== '') before.push(line('roll', rollLine(ask)))
        if (ask.words !== '') before.push(line('words', ask.words))
        if (window.busy) before.push(line('busy', 'Sending…', quiet))
        else if (tappable(game)) choices = ask.choices
      }
      if (game.fault !== undefined) under.push(line('fault', faultLine(game.fault), warn))
    } else if (game.stood !== undefined) after.push(line('stood', stoodLine(game.stood), quiet))
    if (window.line !== '') after.push(line('tap', window.line, quiet))
    // A choice is a press box in the app (views/press.tsx: as wide as its words and 4 cells, never under 8, cut at the card's list width) and
    // the terminal's Button; the press sends the whole choice, never the label. The ask names no lean choice, so none carries the lean mark.
    const wide = listRowWidth(plan.width, insetOf(columns))
    const tap = (choice: string) => () => {
      void actions.urTap?.(window.game, ask!.id, choice)
    }
    const boxOf = (choice: string, i: number) => pressBox({ ui, id: `ur-choice-${i}-${at}`, label: choice, width: Math.min(pressWidth(choice), wide), onPress: tap(choice) })
    const buttonOf = (choice: string, i: number) => <Button key={`ur-choice-${i}-${at}`} label={fitted(choice, wide)} onPress={tap(choice)} />
    // The boxes flow side by side, as many on a line as the width holds: the line a box starts is the one where the lines of the boxes so far
    // (pressLinesOf, the count of the pager and the strip) grow, the cells between two are besideOf, and a row of a line is a Box of its own.
    const beside = besideOf(columns)
    const widths = choices.map(choice => Math.min(pressWidth(choice), wide))
    const flows: number[][] = []
    widths.forEach((_, i) => {
      if (i === 0 || pressLinesOf(widths.slice(0, i + 1), wide, beside) > pressLinesOf(widths.slice(0, i), wide, beside)) flows.push([i])
      else flows[flows.length - 1].push(i)
    })
    const flowOf = (members: number[], n: number) => (
      <Box key={`ur-flow-${n}-${at}`} flexDirection="row" columnGap={beside}>
        {members.map(i => boxOf(choices[i], i))}
      </Box>
    )
    // the choices as one list: lines of boxes in the app, a row of Buttons in the terminal
    const listed =
      choices.length === 0
        ? []
        : [
            glass ? (
              <Box key={`ur-choices-${at}`} flexDirection="column" gap={PRESS.between}>
                {flows.map(flowOf)}
              </Box>
            ) : (
              <Box key={`ur-choices-${at}`} flexDirection="row" flexWrap="wrap" columnGap={SPACE.control} rowGap={SPACE.near}>
                {choices.map(buttonOf)}
              </Box>
            ),
          ]
    // The board's picture (the app alone, where the kit draws an Svg): the squares and the pieces of the newest board on a plate of their own, the
    // waiting and the off beside it, as wide as the card's inside and never wider. It stands for the two rows of the sides; the last move and who
    // won stay as words. The text rows are the picture's fallback (and the terminal's board).
    const { Svg } = ui as { Svg?: any }
    const asks = section('ask', [...before, ...listed, ...under])
    const afters = section('after', after)
    // the board in two blocks, as the pager takes them: the sides (the picture or their two rows), then the last move and who won
    const blocksOf = (picture: Picture | undefined) => ({
      sides: picture === undefined || game.board === undefined ? board.slice(0, sidesAt) : [pictureNode({ Box, Svg }, picture, game.board, at)],
      last: board.slice(sidesAt),
    })
    const partsOf = (picture: Picture | undefined) => section('board', [...blocksOf(picture).sides, ...blocksOf(picture).last])
    const names = namesOf(ui as any)
    const card = (kids: any[], tight: boolean) => (
      <Box key={`ur-window-${at}`} {...cardProps(plan.width, columns)} {...(tight ? { gap: 0, paddingY: 0 } : {})}>
        {kids}
      </Box>
    )
    const high = (node: any): number => sizeOf(node, plan.width, names).h
    const fits = (node: any): boolean => rows === undefined || high(node) <= rows
    // The picture is the largest of two that lets the board and the ask with its choices stand together on the canvas; none (the text rows)
    // where neither does. With no rows told, the largest.
    let picture: Picture | undefined
    if (glass && Svg !== undefined && game.board !== undefined) {
      const inner = innerOf(plan.width, columns)
      const plate = plateOf(tones)
      // the newest move of the text moves a piece in the picture (none for a pass, a win, the first board); the same text, the same picture
      const motion = motionOf(window.text)
      const options = [boardPicture(game.board, inner, plate, undefined, false, motion), boardPicture(game.board, inner, plate, SMALL_SQUARE, true, motion)].filter((one): one is Picture => one !== undefined)
      picture = options.find(one => [false, true].some(tight => fits(card([...head, ...partsOf(one), ...asks, ...afters], tight)))) ?? (rows === undefined ? options[0] : undefined)
    }
    const boards = partsOf(picture)
    // the whole window as it reads, the board first; under a canvas that is too short for it the ask and its choices come first
    const natural = [...head, ...boards, ...asks, ...afters, ...chunks]
    const first = [...head, ...asks, ...afters, ...boards, ...chunks]
    place = natural
    if (glass && rows !== undefined) {
      const whole = [card(natural, false), card(natural, true)].find(fits)
      if (whole !== undefined) return [whole]
      // No choice to press: the card is drawn tight with the ask first, and the card's pager (paged.tsx pagedCard) takes what is left.
      if (choices.length === 0) return [card(first, true)]
      // Too tall for the canvas, with choices: they page by the one rule of the press boxes (views/press.tsx). The items are, in order, the ask's
      // lines with the first line of boxes (a page never holds the question or a line of boxes alone), the other lines of boxes, the fault, the
      // line of the last tap, then the board (its picture or its sides, then the last move), then the moves, three rows a part, newest first, each
      // a block of its own; a page is a column of the items that fit and the pager of boxes under them, so where the canvas holds two lines of
      // boxes the question and every choice stand on the first page he sees and the board and the moves after. The rows round the items are the
      // card's own, measured on the card with nothing in it.
      const paged = (tight: boolean, asked: number) => {
        const items: any[] = [
          <Box key={`ur-ask-${at}`} flexDirection="column" gap={tight ? 0 : PRESS.between}>
            {section('lines', before)}
            {flowOf(flows[0], 0)}
          </Box>,
          ...flows.slice(1).map((members, i) => flowOf(members, i + 1)),
          ...section('fault-box', under),
          ...section('tap-box', after),
          ...section('sides', blocksOf(picture).sides),
          ...section('last', blocksOf(picture).last),
          ...chunks,
        ]
        const alone = (node: any): number => high(card([node], true)) - high(card([], true))
        const shown = pageAt(items.map(alone), rows - high(card([], tight)), asked, PRESS.between, pressPagerRows(wide, columns))
        const pager = pressPagerView({ ui, list: 'ur', page: shown, inner: wide, columns, onPage: n => onPage?.(n) })
        const body = (
          <Box key={`ur-page-${at}`} flexDirection="column" gap={PRESS.between}>
            {items.slice(shown.from, shown.to)}
            {pager}
          </Box>
        )
        return { node: card([body], tight), pages: shown.pages }
      }
      // The card is loose or tight the same for every page, so the pages are the same list whichever is shown: the one whose every page fits the
      // canvas with the fewer pages (loose at a tie), else the tight.
      const ways = [false, true].map(tight => {
        const pages = paged(tight, 0).pages
        return { tight, pages, ok: Array.from({ length: pages }, (_, n) => paged(tight, n)).every(one => fits(one.node)) }
      })
      const best = ways.filter(way => way.ok).sort((a, b) => a.pages - b.pages)[0] ?? ways[1]
      return [paged(best.tight, page).node]
    }
  }
  if (glass) {
    return [
      <Box key={`ur-window-${at}`} {...cardProps(plan.width, columns)}>
        {place}
      </Box>,
    ]
  }
  return [
    <Box key={`ur-window-${at}`} flexDirection="column">
      {backRow}
      {place}
    </Box>,
  ]
}
