// THE STRIP of a card or a window of the app's canvas (order DP, P2): 3 rows on the theme's ground, Back at the left, the title, Close at
// the right, each of the two a press box of views/press.tsx, 2 rows high at the top with one row of air under it, which is the space to the
// first part of its card. Back's label says where he CAME from (`‹ Letters`, `‹ Settings`), never `Back`. Never a foot row, never a word
// alone far from its card. The sizes and the spaces are STRIP's and PRESS's names in views/theme.ts; this file types none. The rows it
// takes (STRIP.rows) are the pane's LINK_ROWS. The terminal draws none of this.
import { settingsTitle } from './settingslist'
import { pressBox, pressHigh, pressWidth } from './press'
import { DOOR_TITLE, PLAYS_TITLE, ROOM_TITLE } from './roomcard'
import { SPACE } from './space'
import { STRIP, THEME, besideOf, fitted } from './theme'
import type { Face, Nav, Ui } from './types'

export const CLOSE_WORD = 'Close'

export type StripAct = { press: () => void | Promise<void>; hotkey?: string }
export type StripProps = {
  ui: Ui
  // The key of the strip's Box; the Buttons of its boxes are `back-room` and the Close's `closeId`.
  id: string
  // The card's width in cells, and the pane's columns (the beside space of two boxes by the one function of the press box).
  width: number
  columns?: number
  title: string
  back?: StripAct & { label: string }
  close?: StripAct & { id: string }
}

// The cells inside the strip, and what its three parts take: Back is cut to the cells the title and Close leave it (never under the least
// of a box), and the title takes what is left, centred, cut by cells and left out under STRIP.titleShown.
export function stripPartsOf(width: number, columns: number | undefined, title: string, backLabel?: string, hasClose = true): { back: number; close: number; title: number; shown: string } {
  const beside = besideOf(columns)
  const inner = Math.max(0, width - 2 * SPACE.control)
  const close = hasClose ? pressWidth(CLOSE_WORD) : 0
  const gaps = (backLabel === undefined ? 0 : beside) + (hasClose ? beside : 0)
  const back = backLabel === undefined ? 0 : Math.min(pressWidth(backLabel), Math.max(pressWidth(''), inner - close - gaps - STRIP.titleLeast))
  const room = Math.max(0, inner - back - close - gaps)
  return { back, close, title: room, shown: room >= STRIP.titleShown ? fitted(title, room) : '' }
}

export function stripView({ ui, id, width, columns, title, back, close }: StripProps) {
  const { Box, Text } = ui
  const parts = stripPartsOf(width, columns, title, back?.label, close !== undefined)
  return (
    <Box key={id} flexDirection="column" width={width} backgroundColor={THEME.ground}>
      <Box key={`${id}-row`} flexDirection="row" alignItems="flex-start" columnGap={besideOf(columns)} paddingX={SPACE.control}>
        {back !== undefined && pressBox({ ui, id: 'back-room', label: back.label, width: parts.back, ...(back.hotkey === undefined ? {} : { hotkey: back.hotkey }), onPress: back.press })}
        <Box key={`${id}-title`} width={parts.title} height={pressHigh()} alignItems="center" justifyContent="center">
          {parts.shown !== '' && (
            <Text key={`${id}-words`} bold>
              {parts.shown}
            </Text>
          )}
        </Box>
        {close !== undefined && pressBox({ ui, id: close.id, label: CLOSE_WORD, width: parts.close, ...(close.hotkey === undefined ? {} : { hotkey: close.hotkey }), onPress: close.press })}
      </Box>
      <Text key={`${id}-air`}> </Text>
    </Box>
  )
}

// The title of a window by where the nav stands: the place's own name, or the name of the thing opened.
export function stripTitleOf(nav: Nav, seat: string, face: Face): string {
  switch (nav.view) {
    case 'level':
      return 'Seats'
    case 'answered':
      return 'Answered today'
    case 'settings':
      return settingsTitle(nav.section)
    case 'room':
      return nav.card === 'door' ? DOOR_TITLE : nav.card === 'plays' ? PLAYS_TITLE : ROOM_TITLE
    // a seat's shelf and its record are named as the Back of the record names that shelf (`‹ NAME shelf`)
    case 'shelf':
      return nav.of === undefined || nav.of === '' ? 'Shelf' : `${nav.of} shelf`
    case 'profile':
      return nav.of === undefined || nav.of === '' ? 'Record' : `${nav.of} shelf`
    case 'ur':
      return 'Ur'
    case 'wait':
      return 'Wait'
    case 'yours':
      return 'Card'
    case 'seat':
      return nav.name === '' || nav.name === seat ? 'Letters' : nav.name
    case 'feed':
      return nav.cardId !== '' ? 'Card' : face === 'public' ? 'Letters' : face === 'operator' ? 'Operator' : 'Trace'
  }
}
