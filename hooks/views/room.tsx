import { countOf } from '../model/blocks'
import { isIdle, readyWords, sizeOf } from '../model/roomplace'
import type { RoomPlace, Update } from '../model/roomplace'
import { isApp } from './glass'
import { LOOK } from './look'
import { SPACE } from './space'
import { THEME, fitted } from './theme'
import type { Ui } from './types'

// How many seats the closed card lists, and how many the open one, before "N more seats ›".
export const SEATS_CLOSED = 2
export const SEATS_SHOWN = 8

// A count with a comma between its thousands: 6,156.
const grouped = (count: number): string => String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export type RoomActions = {
  // "Who may do what ›" opens a card of the place; the one it names is `seats`.
  open: (card: string) => void | Promise<void>
  // "N more seats ›" lists every seat.
  moreSeats: () => void | Promise<void>
  // "What changes ›" opens the page of an update.
  openPage: (page: string) => void | Promise<void>
  // Update or Not now, the choice of the ask of an update: the same tap as any gate.
  tap: (cardId: string, askId: string, choice: string) => void | Promise<void>
  // "Put it up": the pane starts the door.
  putUp: () => void | Promise<void>
}

export type RoomProps = {
  ui: Ui
  room: RoomPlace
  // The card that is open: `seats` draws every seat with its words under it and an accent border.
  open?: string
  // The rest of the seats has been opened: all are listed.
  allSeats?: boolean
  // The size of what the room has grown on disk, in bytes, when the register can read it: What it has grown says
  // it at the right of its title. With none, there is no size.
  bytes?: number
  actions: RoomActions
}

export type UpdateProps = {
  ui: Ui
  surface?: string
  update: Update
  // Whether Update holds the hotkey 1 (order D1, fact 5): where the dock's Letters holds that key (the app), the pane gives none. With
  // none, Update holds it.
  leanKey?: boolean
  // The cells inside the card: a link that does not fit is cut at its end.
  inner: number
  actions: Pick<RoomActions, 'tap' | 'openPage'>
}

// The ask of an update that waits, as the Room place and the card of What it plays say it: "Waits for you" bold and "· NAME VERSION is
// ready." in the warn color, "What changes ›" when it has a page, Not now secondary and Update the one primary Button.
export function updateView({ ui, surface, update, leanKey = true, inner, actions }: UpdateProps) {
  const { Box, Text, Button } = ui
  const app = isApp(surface)
  const warn = app ? THEME.warn : LOOK.warn
  const wrap = app ? { wrap: 'wrap' } : {}
  const wrapRow = app ? ({ flexWrap: 'wrap', rowGap: SPACE.line } as const) : {}
  const { cardId, askId, page } = update
  const choose = (choice: string) => () => {
    void actions.tap(cardId, askId, choice)
  }
  const words = 'What changes'
  return (
    <Box key="room-update" flexDirection="column" gap={1}>
      <Box key="room-update-line" flexDirection="row" flexWrap="wrap" columnGap={1}>
        <Text bold>Waits for you</Text>
        <Text color={warn} {...wrap}>{`· ${readyWords(update)}`}</Text>
      </Box>
      <Box key="room-update-acts" flexDirection="row" alignItems="center" justifyContent={page !== '' ? 'space-between' : 'flex-end'} columnGap={2} {...wrapRow}>
        {page !== '' &&
          (app ? (
            <Button key="room-update-page" plain label={fitted(`${words} ›`, inner)} onPress={() => void actions.openPage(page)} />
          ) : (
            <Button key="room-update-page" label={`${words} ›`} onPress={() => void actions.openPage(page)} />
          ))}
        <Box key="room-update-picks" flexDirection="row" columnGap={2}>
          <Button key="room-update-not-now" variant="secondary" label="Not now" onPress={choose('Not now')} />
          <Button key="room-update-yes" variant="primary" {...(leanKey ? { hotkey: '1' } : {})} label="Update" onPress={choose('Update')} />
        </Box>
      </Box>
    </Box>
  )
}

// The Room place (order B-P6): the cards under the head, which is the pane's and is not drawn here. Who sits:
// closed, the first two seats as a row of the name and its words, then "Who may do what ›"; open, each seat on
// two lines, the name bold and the role dim, the words dim under them, at most eight and then "N more seats ›",
// the border in the accent. What it plays: a row a disc, its version at the right (none when the file says none),
// and, when an update waits, "Waits for you" bold and "· NAME VERSION is ready." in the warn color (for two discs or more,
// "· 2 discs are ready: alpha, beta.", the names of the first three), "What changes ›" when it has a page, Not now secondary and Update the one primary Button with the hotkey 1. The
// door: up or down at the right, the last tick and the day's cost and ticks; down, "Down since HH:MM." in the
// warn color (left out with no tick), "Cards wait at the door until it is up." dim, and "Put it up" secondary
// at the foot. Programs running: a row a program that is not idle, its words and "since HH:MM"; an idle program
// has no row, and with none running the card is not drawn. With Who sits open the place is that card and The door
// alone; What it plays, Programs running and What it has
// grown, last: Walks "N steps" and Shelf "N items · media N" (media only when the catalog holds any), its size
// "N MB" at the right of the title when `bytes` is given, none otherwise. A section the room holds nothing for is
// not drawn; the sealed layer waits on R8 and has no row. This is the TERMINAL's column: the rows are a column in LOOK's theme
// keys, string labels, no hover and no hex. The app draws the room card (views/roomcard.tsx) and no card of this column.
// Returns the elements to sit among the children of the pane.
export function roomView({ ui, room, open, allSeats = false, bytes, actions }: RoomProps) {
  const { Box, Text, Button } = ui
  const dim = LOOK.quiet
  const warn = LOOK.warn
  const ink = {}

  const card = (id: string, title: string, right: string, rows: any[], extras: any[] = [], edge: 'line' | 'accent' = 'line') => (
    <Box key={`room-${id}`} flexDirection="column" gap={1} {...(edge === 'accent' ? LOOK.open : LOOK.section)}>
      <Box key={`room-body-${id}`} flexDirection="column">
        <Box key={`room-head-${id}`} flexDirection="row" justifyContent="space-between" columnGap={2}>
          <Text bold {...ink}>
            {title}
          </Text>
          {right !== '' && <Text color={dim}>{right}</Text>}
        </Box>
        {rows}
      </Box>
      {extras}
    </Box>
  )
  // A label dim at the left, its value, and a third column at the right when the row has one.
  const row = (key: string, label: string, value: any, right = '') => (
    <Box key={key} flexDirection="row" justifyContent="space-between" columnGap={2}>
      <Box key={`${key}-left`} flexDirection="row" columnGap={2}>
        <Box width={14}>
          <Text color={dim}>{label}</Text>
        </Box>
        {value}
      </Box>
      {right !== '' && <Text color={dim}>{right}</Text>}
    </Box>
  )
  // A link: a Button, its words with an arrow after them as its label alone.
  const link = (key: string, words: string, onPress: () => void) => <Button key={key} label={`${words} ›`} onPress={onPress} />

  const cards: any[] = []

  const { seats, discs, door, programs, update } = room
  // With Who sits open, the place is Who sits and The door alone, as frame 2 draws it.
  const seatsOpen = open === 'seats' && seats.length > 0
  if (seats.length > 0) {
    if (seatsOpen) {
      const shown = allSeats ? seats : seats.slice(0, SEATS_SHOWN)
      const more = seats.length - shown.length
      cards.push(
        card(
          'seats',
          'Who sits',
          `${seats.length} here`,
          [
            <Box key="room-seats-list" flexDirection="column" gap={1}>
              {shown.map((seat, i) => (
                <Box key={`room-seat-${i}`} flexDirection="column">
                  <Box key={`room-seat-name-${i}`} flexDirection="row" columnGap={1}>
                    <Text bold {...ink}>
                      {seat.name}
                    </Text>
                    {seat.role !== '' && <Text color={dim}>{seat.role}</Text>}
                  </Box>
                  {seat.words !== '' && (
                    <Text color={dim}>{seat.words}</Text>
                  )}
                </Box>
              ))}
              {more > 0 &&
                link('room-seats-more', `${more} more seats`, () => {
                  void actions.moreSeats()
                })}
            </Box>,
          ],
          [],
          'accent',
        ),
      )
    } else {
      cards.push(
        card('seats', 'Who sits', `${seats.length} here`, [
          ...seats.slice(0, SEATS_CLOSED).map((seat, i) =>
            row(
              `room-seat-${i}`,
              seat.name,
              seat.words !== '' && (
                <Text {...ink}>{seat.words}</Text>
              ),
            ),
          ),
          link('room-seats-open', 'Who may do what', () => {
            void actions.open('seats')
          }),
        ]),
      )
    }
  }

  if (!seatsOpen && (discs.length > 0 || update !== undefined)) {
    const extras: any[] = []
    // the terminal never cuts a link at its end: no cells are given
    if (update !== undefined) extras.push(updateView({ ui, update, inner: Number.MAX_SAFE_INTEGER, actions }))
    cards.push(
      card(
        'discs',
        'What it plays',
        countOf(discs.length, 'disc'),
        discs.map((disc, i) => row(`room-disc-${i}`, disc.name, undefined, disc.version)),
        extras,
      ),
    )
  }

  const today = [door.usdToday === undefined ? '' : `$${door.usdToday.toFixed(2)}`, door.ticksToday === undefined ? '' : countOf(door.ticksToday, 'tick')].filter(part => part !== '')
  cards.push(
    card(
      'door',
      'The door',
      door.up ? 'up' : 'down',
      [
        !door.up && door.downSince !== '' && (
          <Text key="room-door-since" color={warn}>{`Down since ${door.downSince}.`}</Text>
        ),
        !door.up && (
          <Text key="room-door-waits" color={dim}>
            Cards wait at the door until it is up.
          </Text>
        ),
        door.lastTick !== '' && row('room-door-last', 'Last tick', <Text {...ink}>{door.lastTick}</Text>),
        today.length > 0 && row('room-door-today', 'Today', <Text {...ink}>{today.join(' · ')}</Text>),
      ],
      [
        !door.up && (
          <Box key="room-door-foot" flexDirection="row" justifyContent="flex-end">
            <Button
              key="room-put-up"
              variant="secondary"
              label="Put it up"
              onPress={() => {
                void actions.putUp()
              }}
            />
          </Box>
        ),
      ],
    ),
  )

  // Only the programs that are not idle have a row; with none running there is no card.
  const running = programs.filter(program => !isIdle(program.state))
  if (!seatsOpen && running.length > 0) {
    cards.push(
      card(
        'programs',
        'Programs running',
        String(running.length),
        running.map((program, i) =>
          row(
            `room-program-${i}`,
            program.name,
            <Text {...ink}>{program.state}</Text>,
            program.since === '' ? '' : `since ${program.since}`,
          ),
        ),
      ),
    )
  }

  // What it has grown: the steps of the walks and the items of the shelf, its size at the right of the title when the
  // register gave the bytes. No Sealed row and no "next at": R8 is held.
  if (!seatsOpen && room.grown !== undefined) {
    const { steps, items, media } = room.grown
    const size = sizeOf(bytes)
    cards.push(
      card('grown', 'What it has grown', size, [
        row('room-grown-walks', 'Walks', <Text {...ink}>{`${grouped(steps)} ${steps === 1 ? 'step' : 'steps'}`}</Text>),
        row('room-grown-shelf', 'Shelf', <Text {...ink}>{[`${grouped(items)} ${items === 1 ? 'item' : 'items'}`, media > 0 ? `media ${grouped(media)}` : ''].filter(part => part !== '').join(' · ')}</Text>),
      ]),
    )
  }

  return cards
}
