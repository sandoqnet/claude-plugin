import { CHANNEL, VERSION, roomPagePath } from '../host'
import { CALM_HOUR, HOUR_OWN_LINE, backgroundLine, isOwnWall } from '../model/background'
import type { Background } from '../model/background'
import { FROM_DESK, deskRows, doneToday, hisCount, rowKey, shapesAnsweredToday } from '../model/desk'
import type { DeskCard, DeskRow } from '../model/desk'
import { chatThread } from '../model/chat'
import { feedOf, quietOf } from '../model/feed'
import { keeperRows } from '../model/keeperrow'
import { countOf, stripUlid } from '../model/blocks'
import { motionRows } from '../model/motion'
import { costOf, headerMeta } from '../model/operator'
import { pageKindOf } from '../model/page'
import { ageWords, ulidMs } from '../model/profile'
import { drawnNow, noteDraw } from '../model/draws'
import type { Drawn } from '../model/draws'
import { hourOf, sceneSize } from '../model/scene'
import { tonesOf } from '../model/tones'
import { DEFAULTS, changedCard, clockText, dateText } from '../model/settings'
import type { Settings } from '../model/settings'
import { SHOWN_CARDS } from '../model/shelf'
import { THIS_SEAT, askedWait, asideLast, level, seatFace, seatWindow, waitsLine, waitsOnHim } from '../model/seat'
import type { SeatState } from '../model/seat'
import { feedLines, openShapes, shapeAsks } from '../model/roomfeed'
import type { ShapeAsk } from '../model/roomfeed'
import { isIdle, roomOf, sizeOf as bytesWords } from '../model/roomplace'
import { MAKE_BUTTON, MAKING, START_BUTTON, STARTING, linesAtWord, makeWords } from '../model/roomstart'
import { freshCount, whoseOf } from '../model/shelfreads'
import { rulesToday, shelfOf } from '../model/shelfplace'
import { FACES, openAsks } from '../model/walk'
import type { WalkText } from '../model/walk'
import { OPEN_PAGE } from '../model/pages'
import { writeLineOf, yourCardsOf } from '../model/yourcards'
import { BAR_HEIGHT, captureView, keyLineView } from './capture'
import type { KeyPlace } from './capture'
import { cardView } from './card'
import { CHAT_LIST, chatRoomOf, chatView, holdsThread } from './chat'
import { DESK_LIST, deskItemView, deskView, itemTitleOf } from './desk'
import { isApp } from './glass'
import { hotkeyProps, hotkeysOn } from './keys'
import { asTerminal, buttonCells, kidsOf, namesOf, sizeOf } from './cells'
import { FIT_LEAST, fitBody, pagedBody, withKids } from './paged'
import { terminalPaged } from './termpage'
import { answeredView, barView, CANVAS_TOP, canvasRowsOf, dockPlaceOf, dockPress, dockView, EDGE, terminalSize } from './frame'
import type { TerminalSize } from './frame'
import { lensView } from './lens'
import { LOOK } from './look'
import { bannerView, olderWords, operatorLensView, operatorView } from './operator'
import { profileView } from './profile'
import { roomView } from './room'
import { doorView, playsView, roomCardView, roomFeedView } from './roomcard'
import { sceneElement } from './scene'
import { LETTER_TEXT, levelView, seatView } from './seat'
import { shapeView } from './shape'
import type { SeatProps } from './seat'
import { seatWindowView, seatsView } from './seats'
import { nudgeShown } from '../model/nudge'
import { keysView, nudgeView, secretsView, settingsParts } from './settings'
import { settingsListView } from './settingslist'
import { busyOf, versionsView } from './versions'
import { wordRows, wrapRows } from './versions-table'
import { shelfPlaceView, shelfRecordView, shelfRoomView } from './shelf'
import { canvasWidthOf, layout, SPACE } from './space'
import type { Plan } from './space'
import { STRIP, THEME, cardProps, fitted, innerOf } from './theme'
import { CLOSE_WORD, stripTitleOf, stripView } from './strip'
import { motionView, traceLensView } from './trace'
import { asksFit, yourCardView } from './yourcard'
import { urPlaceView, urRowView } from './ur'
import { letterTabs, openInAppView, walkView } from './walk'
import { yoursBody } from './yours'
import type { Expanded, Face, Lens, Nav, PaneProps, Starter, Ui } from './types'

// What the register hands the pane besides the room's state: the surface the pane is drawn on (terminal,
// desktop, vscode or mobile), the columns of its body and the rows of the viewport, the room's name, and what
// "Show N more" and "N more ›" of the operator lens have opened for the open card.
export type PlaceProps = PaneProps & {
  surface?: string
  bodyColumns?: number
  rows?: number
  roomName?: string
  expanded?: Expanded
  // The pane counts its draws and the changes of its scene (order A-M11): the register asks the foot of the operator lens
  // to say them, and gives the time of this draw in ms (none is `now`).
  countDraws?: boolean
  drawnAt?: number
  // One quiet line under the head, set by the guard (views/guard.tsx) when the lens the person chose threw: it names the lens
  // and the first line of the error, and the pane is drawn on Public.
  failure?: string
  // The room's own background (order BG), as the poll read it: the text to draw, or why it is not drawn; none for a room with no file.
  background?: Background
}

// What the head calls a room that has no name of its own (a room.sh install, a room of the world).
const ROOM_WORD = 'room'
// The word of the world's own room, which the bar's path never reads (order D1): the room's word stands in its place.
const WORLD_WORD = 'us'
// The least the pane is high, in rows (the register's paneRows gives no less).
const LEAST_ROWS = 24
// The hotkeys of `‹ Back to WHERE` and of Close (order D1, fact 5), held only while the switch of views/keys.ts is on (it is off in
// 0.8.1): Esc is the app's and hands the keys back, so each is a Button with a key of its own. The dock holds 1 to 5 and a gate's lean 1 while Letters is open: no key stands on two Buttons of one draw. A row
// one step deep has Back alone; the root of an open place has Close alone, so b and x never stand together.
export const BACK_KEY = 'b'
export const CLOSE_KEY = 'x'
export { CLOSE_WORD }
// The keys of the two Closes of the strips: the place's (the left card from 128 columns, else the only one) and the right card's.
const CLOSE_PLACE = 'close-place'
const CLOSE_CARD = 'close-card'

// The room's state a face reads: the pane's props (`face` is the shown lens: public, operator or trace; `cards` the
// cards the lens shows, the quiet feed's under Operator), the lens of the open card, and whether the pane is drawn as
// a place (an Svg under glass) or as the terminal's column. `hidden` is how many of the cards read the setting Gates and
// questions leaves out of the Operator feed, counted once, where the pane filters them (paneView); 0 when none is left out.
// `starterFirst`: the door line and its Button are the first block of the Letters body (order MR, R4), not a band over the canvas.
// `opened`: from 128 columns the list at the left is drawn on its own nav; this is the nav of the row open at the right, so the list can keep that row's open look.
// `size` and `termRoom` are the terminal's alone: its layout (views/frame.tsx terminalSize) and the rows its body has left under the bar, the keys or
// the tabs and the status line, which a place that pages takes as the canvas's rows (canvasLeftOf); none where the host told no rows.
type RoomState = PlaceProps & {
  lens: Lens
  app: boolean
  layer: number
  plan: Plan
  columns: number
  drawn?: Drawn
  hidden?: number
  starterFirst?: boolean
  opened?: Nav
  size?: TerminalSize
  termRoom?: number
}

// What every view is told of the canvas it draws in (order D1): the layout's plan (the column's width, `stack`) and the pane's
// columns. A view that does not take them yet leaves them be; one that does draws to that width, with no number of its own. Spread
// into each call by name, so a view's props need not name them before it takes them.
const frameOf = (state: RoomState): { plan: Plan; columns: number } => ({ plan: state.plan, columns: state.columns })

// The surface the views are told: the place's own (an app draws on glass), none in the terminal's column, even on a
// host whose surface is an app but which has no Svg to draw the place with.
const surfaceOf = ({ app, surface }: RoomState): string | undefined => (app ? surface : undefined)

// A face is a program's own section of the pane: a function of the room's state that returns the elements of its
// Box. The pane holds the faces by name: `us`, the feed of cards read in the shown lens, and `shelf`, its own place
// (the shelf of records and a profile). A face a disc carries later (its face/ folder) is one more entry. The head,
// the composer and the status line are the pane's own and are not faces. Public, Operator and Trace are LENSES of
// the us face, as news, walk and trace are of a card; the head's tabs are the lens tabs.
type FaceName = 'us' | 'shelf' | 'settings' | 'room' | 'answered' | 'desk'
type FaceView = (state: RoomState) => any[]

// The face the nav shows: the feed, a seat's face and the level up are us; his desk, Settings, the Room place and today's answers are each
// their own place; the shelf and a profile are the shelf face.
const faceOf = (nav: Nav): FaceName =>
  nav.view === 'feed' || nav.view === 'seat' || nav.view === 'level' || nav.view === 'wait' || nav.view === 'yours' || nav.view === 'ur'
    ? 'us'
    : nav.view === 'desk'
      ? 'desk'
      : nav.view === 'settings'
        ? 'settings'
        : nav.view === 'room'
          ? 'room'
          : nav.view === 'answered'
            ? 'answered'
            : 'shelf'

// The nav the Operator and Trace bodies and the bar read: a seat's face and the level up draw the feed with no card
// named (Public draws the seat views, see publicView).
const bodyNavOf = (nav: Nav): Nav =>
  nav.view === 'seat' || nav.view === 'level' || nav.view === 'wait' || nav.view === 'yours' || nav.view === 'ur' || nav.view === 'desk' ? { view: 'feed', cardId: '', lens: 'news' } : nav

// The seat the head names: the seat of the nav's face, else this seat ('' when the room names none).
const seatOf = ({ nav, seat = '' }: { nav: Nav; seat?: string }): string => (nav.view === 'seat' && nav.name !== '' ? nav.name : seat)

// "Back to SEAT" shows on the level up, on another seat's face and in the places off the us face.
const isOwnFace = (nav: Nav, seat: string): boolean =>
  nav.view === 'feed' || nav.view === 'desk' || (nav.view === 'seat' && (nav.name === '' || nav.name === seat))
const showsBack = (nav: Nav, seat: string): boolean => !isOwnFace(nav, seat)
const backWords = (seat: string): string => (seat === '' ? 'Back to this seat' : `Back to ${seat}`)

// A word with its first letter big, for the lens word of the tray.
const cap = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

// The pane's own settings: the defaults while none are read.
const settingsOf = (state: RoomState): Settings => state.settings ?? DEFAULTS

// The lenses the head has a tab for: Public always, Operator and Trace unless the settings hide them. A lens that is
// hidden is never the shown one: the pane falls back to Public.
const lensesOf = (settings: Settings): Face[] => FACES.filter(name => name === 'public' || settings[name as 'operator' | 'trace'])
const shownLens = (face: Face, settings: Settings): Face => (lensesOf(settings).includes(face) ? face : 'public')

// The line of a room that is not read yet or not there. In an app it lies on a block of the theme's ground, the smallest that holds
// it, so its words stand on that ground and not on the scene.
// Under it, where a room may be made from here (order MR, R2): the line the last call left (cut at a word to MAKE_ROWS rows; the read tool
// says it whole), the Button `Make a room here` and one dim line that names where, or while the call runs the one line that says so.
// In an app the lines and the Button lie on the same block of ground, the Button plain as Back and Close are.
const MAKE_ROWS = 3
// The pane's own lines (the too old line, the line of what is not known) are drawn whole in this many rows, sandoq's in MAKE_ROWS.
const MAKE_OWN_ROWS = 5
// The door of a room that stands (order MR, R3) is drawn the same way, by `askView`, under the keys `start-door-*`: its line and Button stand
// where the line of a thing that did not answer stands, and no dim line follows the Button.
type Ask = { making: boolean; line: string; own: boolean; button: boolean; press: () => void }
const askKids = ({ ui, app, plan, columns }: RoomState, key: string, ask: Ask, text: { label: string; making: string; dim: string }) => {
  const { Text, Button } = ui
  const width = Math.max(10, app ? plan.width - 2 * SPACE.control : columns)
  const dim = app ? THEME.dim : LOOK.quiet
  const warn = app ? THEME.warn : LOOK.warn
  const words = (at: string, said: string, color: string, rows = MAKE_ROWS) =>
    linesAtWord(said, width, rows).map((line, row) => (
      <Text key={`${key}-${at}-${row}`} color={color}>
        {line}
      </Text>
    ))
  const kids = ask.making
    ? words('making', text.making, dim)
    : [
        ...words('line', ask.line, warn, ask.own ? MAKE_OWN_ROWS : MAKE_ROWS),
        ...(ask.button
          ? [
              app ? <Button key={key} plain label={text.label} onPress={ask.press} /> : <Button key={key} label={text.label} onPress={ask.press} />,
              ...words('dim', text.dim, dim),
            ]
          : []),
      ]
  return kids
}

const askView = (state: RoomState, key: string, ask: Ask, text: { label: string; making: string; dim: string }) => {
  const { Box } = state.ui
  const { app } = state
  const kids = askKids(state, key, ask, text)
  if (kids.length === 0) return []
  return [
    app ? (
      <Box key={`${key}-block`} flexDirection="column" alignSelf="flex-start" paddingX={SPACE.control} backgroundColor={THEME.ground}>
        {kids}
      </Box>
    ) : (
      <Box key={`${key}-block`} flexDirection="column">
        {kids}
      </Box>
    ),
  ]
}

const makerView = (state: RoomState) => {
  const { maker } = state
  if (maker === undefined) return []
  return askView(state, 'make-room', { ...maker, press: maker.onMake }, { label: MAKE_BUTTON, making: MAKING, dim: makeWords(maker.name, maker.where) })
}

const starterAsk = (starter: Starter): [Ask, { label: string; making: string; dim: string }] => [
  { ...starter, making: starter.starting, press: starter.onStart },
  { label: START_BUTTON, making: STARTING, dim: '' },
]

const starterView = (state: RoomState) => {
  const { starter } = state
  if (starter === undefined) return []
  const [ask, text] = starterAsk(starter)
  return askView(state, 'start-door', ask, text)
}

// The rows the door's line and its Button take over the body of the canvas (order MR, R4), with the gap under them: each row of the block
// is one row, as the block draws them. Counted in canvasRowsOf, so the body never passes the canvas with the door line standing.
const starterRowsOf = (state: RoomState): number => {
  const { starter } = state
  if (!state.app || starter === undefined) return 0
  const [ask, text] = starterAsk(starter)
  const rows = askKids(state, 'start-door', ask, text).length
  return rows === 0 ? 0 : rows + SPACE.block
}

const noRoomView = (state: RoomState) => {
  const { ui, exists, noRoomText, app } = state
  const { Box, Text } = ui
  if (exists) return []
  if (!app) return [<Text key="no-room" color={LOOK.quiet}>{noRoomText}</Text>, ...makerView(state)]
  return [
    <Box key="no-room" alignSelf="flex-start" paddingX={SPACE.control} backgroundColor={THEME.ground}>
      <Text color={THEME.dim}>{noRoomText}</Text>
    </Box>,
    ...makerView(state),
  ]
}

// What the nav shows in place of the feed: the way back (in the place it is the head's "Back to the room"), then a
// profile or the shelf.
const backView = ({ ui, app, size, actions }: RoomState) => {
  const { Button } = ui
  // the terminal's way back is the key line's b (small) or the tab row (wide), never a row of the place
  return app || size !== undefined
    ? []
    : [
        <Button
          key="back"
          label="‹ room"
          onPress={() => {
            void actions.open({ view: 'feed', cardId: '', lens: 'news' })
          }}
        />,
      ]
}

// The shelf as a place (order B-P4): the asks that wait, his rules, the decisions of today and the first items, read
// from the walks, the catalog and rules.md. A rule taken off by "Ask me next time" leaves the list at once. Each
// act is the register's; one it does not give (a room of the world) does nothing.
const shelfPlace = (state: RoomState) => {
  const { ui, walks, entries, now, zone, rulesText = '', takenOff = [], shelfAll = false, actions } = state
  // the app draws the room's own shelf as planks (order P7, C2); the terminal keeps the place below
  if (state.app) {
    // the shelf shown: the room's own, or a seat's (nav.of); the whose row stands where two or more shelves do (order P7, C3)
    const of = state.nav.view === 'shelf' ? (state.nav.of ?? '') : ''
    return shelfRoomView({
      ui,
      ...frameOf(state),
      entries,
      walks,
      rulesText,
      takenOff,
      now,
      zone,
      canvasRows: canvasRowsNow(state) - LINK_ROWS,
      pages: state.pages,
      whose: whoseOf(state.shelfNames ?? []),
      of,
      ...(of === '' || state.seatShelves?.[of] === undefined ? {} : { seat: state.seatShelves[of] }),
      // the files of the shelf (order shelf-files): the Files part of the room's shelf, and the files in the list of a seat's
      ...(state.shelfFiles === undefined ? {} : { files: state.shelfFiles }),
      actions: {
        openItem: recordId => (of === '' ? actions.openItem?.(recordId) : actions.open({ view: 'profile', recordId, of })),
        openRule: ruleId => actions.openRule?.(ruleId),
        addRule: () => actions.addRule?.(),
        page: (list, page) => void actions.page?.(list, page),
        openShelf: (name, own) => actions.open({ view: 'shelf', by: 'kind', ...(own ? {} : { of: name }) }),
        openCard: cardId => actions.openCard?.(cardId),
        openFile: (seat, file) => actions.openFile?.(seat, file),
        openFiles: seat => actions.openFiles?.(seat),
      },
    })
  }
  const place = shelfOf({ walks, entries, rulesText, now, zone })
  return shelfPlaceView({
    ui,
    ...frameOf(state),
    surface: surfaceOf(state),
    // the shelf is no Letters: a wait's lean pick holds no hotkey there (the dock's Letters holds the 1)
    leanKey: !state.app,
    small: state.size === 'small',
    place: { ...place, rules: place.rules.filter(rule => !takenOff.includes(rule.id)) },
    walks,
    showAll: shelfAll,
    actions: {
      tap: actions.tap,
      tapDraft: actions.tapDraft,
      open: cardId => actions.openCard?.(cardId),
      openRule: ruleId => actions.openRule?.(ruleId),
      addRule: () => actions.addRule?.(),
      openItem: recordId => actions.openItem?.(recordId),
      more: actions.moreItems,
    },
  })
}

const navView = (state: RoomState) => {
  const { ui, nav, entries, walks, now, app, face, actions } = state
  const { Text } = ui
  if (nav.view === 'feed' || nav.view === 'settings') return []
  const shelfEntries = nav.view === 'profile' && nav.of !== undefined && nav.of !== '' ? (state.seatShelves?.[nav.of]?.entries ?? []) : entries
  return [
    ...backView(state),
    ...(nav.view === 'profile' && app
      ? shelfRecordView({
          ui,
          ...frameOf(state),
          face,
          // a record of a seat's shelf reads that shelf's catalog, and keeps its Back there
          entry: shelfEntries.find(item => item.id === nav.recordId),
          entries: shelfEntries,
          walks,
          now,
          canvasRows: canvasRowsNow(state) - LINK_ROWS,
          pages: state.pages,
          seat: nav.of !== undefined && nav.of !== '',
          actions: {
            open: recordId => void actions.open({ view: 'profile', recordId, ...(nav.of === undefined || nav.of === '' ? {} : { of: nav.of }) }),
            openCard: cardId => void actions.open({ view: 'feed', cardId, lens: 'news' }),
            page: (list, page) => void actions.page?.(list, page),
          },
        })
      : nav.view === 'profile'
      ? [profileView({ ui, ...frameOf(state), surface: surfaceOf(state), face, entry: entries.find(item => item.id === nav.recordId), walks, entries, now, actions })]
      : shelfPlace(state)),
    ...(app ? [] : [<Text key="nav-space"> </Text>]),
  ]
}

// The pane's own "Settings changed" card: its title and age, what changed in one sentence, and who did it. In an app
// it is the theme card as the cards of the room are; in the terminal the theme's frame. It is the pane's own and no room card:
// nothing is sent to the door for it.
const changedView = ({ ui, now, app, changed, plan, columns }: RoomState) => {
  const { Box, Text } = ui
  const card = changed === undefined ? undefined : changedCard(changed.lines)
  if (changed === undefined || card === undefined) return undefined
  const age = ageWords(changed.at, now)
  if (!app) {
    return (
      <Box key="settings-card" flexDirection="column" {...LOOK.frame}>
        <Box key="settings-card-head" flexDirection="row" columnGap={1}>
          <Text bold>{card.title}</Text>
          <Text color={LOOK.quiet}>{age}</Text>
        </Box>
        <Text>{card.text}</Text>
        <Text color={LOOK.quiet}>{card.by}</Text>
      </Box>
    )
  }
  return (
    <Box key="settings-card" {...cardProps(plan.width, columns)}>
      <Box key="settings-card-head" flexDirection="row" alignItems="center" columnGap={SPACE.control}>
        <Text bold>{card.title}</Text>
        <Box key="settings-card-grow" flexGrow={1} />
        <Text color={THEME.dim}>{age}</Text>
      </Box>
      <Text>{card.text}</Text>
      <Box key="settings-card-by" flexDirection="row" columnGap={SPACE.near}>
        <Text color={THEME.ok}>●</Text>
        <Text color={THEME.dim}>{card.by}</Text>
      </Box>
    </Box>
  )
}

// The line of the cards the setting Gates and questions leaves out, and the Button that shows every card: the same words as
// the place's operator lens says them (views/operator.tsx), as the terminal's feed draws them. None when no card is left out.
const hiddenView = ({ ui, hidden = 0, app, actions }: RoomState) => {
  if (hidden <= 0) return []
  const { Box, Text, Button } = ui
  return [
    <Box key="hidden" flexDirection="column">
      <Text key="hidden-line" color={app ? THEME.dim : LOOK.quiet}>
        {hidden === 1 ? '1 card with no question is not shown' : `${hidden} cards with no question are not shown`}
      </Text>
      {actions.changeSetting !== undefined && (
        <Box key="hidden-row" flexDirection="row">
          <Button
            key="show-every"
            label="Show every card"
            variant="secondary"
            onPress={() => {
              void actions.changeSetting?.('shows', 'every')
            }}
          />
        </Box>
      )}
    </Box>,
  ]
}

// The cards of the feed, newest at the foot, with the button that reads 8 more above them. In the terminal's operator
// lens the pane's own "Settings changed" card stands among them by the time of the change: after the cards older than
// it. (Public is the seat face alone, and the operator lens of a place has its own rows, headed by the card.)
const feedView = (state: RoomState) => {
  const { ui, face, cards, current, total, hasOlder, now, entries, versions, pickedRow, walks, roomFiles, zone, lens, app, actions } = state
  const { Box, Button } = ui
  const items = feedOf(cards, current?.id ?? '', now)
  const own = face === 'operator' ? changedView(state) : undefined
  const before = state.changed === undefined ? 0 : items.filter(item => ulidMs(item.card.id) <= state.changed!.at).length
  const drawn = items.map(item => (
    <Box key={`feed-${item.card.id}`} flexDirection="column">
      {cardView({
        ui,
        ...frameOf(state),
        face,
        card: item.card,
        age: item.age,
        asked: item.asked,
        isOpen: item.isOpen,
        lens,
        entries,
        versions,
        walks,
        roomFiles,
        now,
        pickedRow,
        zone,
        surface: surfaceOf(state),
        actions,
        // the card's gate holds the hotkey 1 in the terminal, and in the app only while the switch of the app's hotkeys is on
        leanKey: !app || hotkeysOn(),
        gate: {
          actions: { tapDraft: actions.tapDraft, ruleOff: actions.ruleOff, openRule: actions.openRule },
          rulesText: state.rulesText,
          takenOff: state.takenOff,
        },
      })}
    </Box>
  ))
  if (own !== undefined) drawn.splice(before, 0, own)
  return [
    ...hiddenView(state),
    ...(hasOlder
      ? [
          <Button
            key="older"
            label={app ? olderWords(total, cards.length, state.hidden ?? 0) : 'older'}
            {...(app ? { variant: 'secondary' } : {})}
            onPress={() => {
              void actions.older()
            }}
          />,
        ]
      : []),
    ...drawn,
  ]
}

function bannerOf({ ui, cards, app }: RoomState) {
  return [bannerView({ ui, cards, app })]
}

// What the terminal keeps above the feed, and above the shelf too, in each lens: the operator lens its banner.
const ABOVE: Record<Face, FaceView> = {
  public: state => noRoomView(state),
  operator: state => [...bannerOf(state), ...noRoomView(state)],
  trace: state => noRoomView(state),
}

// The operator lens in the place: its rows, the open card and what runs, in one Box on solid glass.
const operatorLens = (state: RoomState) =>
  operatorLensView({
    ui: state.ui,
    ...frameOf(state),
    cards: state.cards,
    openId: state.nav.view === 'feed' ? state.nav.cardId : '',
    lens: state.lens,
    doorDown: state.doorWord === 'door down',
    surface: surfaceOf(state),
    total: state.total,
    hasOlder: state.hasOlder,
    hidden: state.hidden ?? 0,
    now: state.now,
    entries: state.entries,
    versions: state.versions,
    walks: state.walks,
    roomFiles: state.roomFiles,
    zone: state.zone,
    pickedRow: state.pickedRow,
    discs: state.discs,
    expanded: state.expanded ?? {},
    ...(state.drawn === undefined ? {} : { drawn: state.drawn }),
    onPlays: () => void state.actions.open({ view: 'room', card: 'plays', from: state.seat === undefined || state.seat === '' ? THIS_SEAT : state.seat }),
    actions: state.actions,
  })

// The motion rows of the shown cards, a row an event.
const motionOf = (state: RoomState) => ({
  ui: state.ui,
  ...frameOf(state),
  rows: motionRows(state.cards, state.taps, state.now),
  zone: state.zone,
  actions: state.actions,
})

const AT_ID = /@[0-9A-Za-z]{20,}/

// The kind of a seat as the level up says it: "a desk", "a seat".
const kindWords = (kind: string): string => (kind === 'desk' || kind === 'seat' ? `a ${kind}` : kind)

// Who a seat is, in one dim line of the Seats place and of a seat's window: the ROLE word of its line of seats.md alone, never the
// body's sentence. When the line also writes a kind key, the kind goes before the role ("a desk · steers"). With neither, no line
// stands: never a guess.
const whoWords = (told: string, role: string): string => [told === '' ? '' : kindWords(told), role].filter(part => part !== '').join(' · ')

// The strip's line on the canvas (order LINE): the line of a thing that did not answer or a part of the read that failed is at most 120
// cells; on the canvas it stands at its words, cut with an ellipsis to LATE_ROWS rows of the column less the block's padding, so a short
// pane keeps its room for the place that stands under it. The whole line stays in the read tool. A first word wider than the rows is cut
// by cells. The rows it takes, with the gap under it, are the canvas's less: the lists that page leave them.
export const LATE_ROWS = 2
// A part that did not answer says its name and its seconds, and they are what the cut must keep: where the line is cut they stand first,
// the words that say it did not answer after them (`The pane could not read the seats (0.3 s): it did not answer`).
const SLOW_PART = /^(The pane could not read .+?): it did not answer in (\d+(?:\.\d+)? s)$/
export const lateShown = (state: Pick<RoomState, 'lateWord' | 'plan'>): string => {
  const { lateWord = '', plan } = state
  const inner = canvasWidthOf(plan) - 2 * SPACE.control
  const fits = (text: string): boolean => Math.max(wrapRows(text, inner), wordRows(text, inner)) <= LATE_ROWS
  if (fits(lateWord)) return lateWord
  const slow = SLOW_PART.exec(lateWord)
  const line = slow === null ? lateWord : `${slow[1]} (${slow[2]}): it did not answer`
  if (fits(line)) return line
  const words = line.split(/\s+/).filter(word => word !== '')
  let kept = words.length - 1
  while (kept > 1 && !fits(`${words.slice(0, kept).join(' ')}…`)) kept -= 1
  const cut = `${words.slice(0, kept).join(' ')}…`
  return kept > 1 && fits(cut) ? cut : fitted(line, LATE_ROWS * inner)
}
const lateRowsOf = (state: RoomState): number => {
  const { lateWord = '', exists, plan } = state
  if (lateWord === '' || !exists) return 0
  const inner = canvasWidthOf(plan) - 2 * SPACE.control
  const shown = lateShown(state)
  return Math.max(wrapRows(shown, inner), wordRows(shown, inner)) + SPACE.block
}

// The rows the canvas leaves for a list that pages: the pane's own rows less the bar and the dock (frame.tsx, an estimate), less the
// rows of the door line and its Button when they stand over the page (`over`), and less the rows of the strip's line when one stands.
// A host that gives no rows leaves the height unknown, and a list is not cut to a height nobody told.
// The terminal has no bar over its canvas and no dock under it: its rows are the body's less the bar, the keys or the tabs and the status line
// (termRoom), and the places subtract the strip's rows from what they are given, so those are added here.
const canvasLeftOf = (state: RoomState, over: number): number =>
  state.rows === undefined || (!state.app && state.termRoom === undefined)
    ? Number.POSITIVE_INFINITY
    : !state.app
      ? Math.max(LINK_ROWS + 1, (state.termRoom as number) + LINK_ROWS)
      : Math.max(LINK_ROWS + 1, canvasRowsOf(Math.max(LEAST_ROWS, state.rows), state.columns, over) - lateRowsOf(state))
const canvasRowsNow = (state: RoomState): number => canvasLeftOf(state, starterRowsOf(state))

// The same without the door line: the canvas whole, for the body that carries the door line as its first block (it takes its rows on its page).
const canvasRowsPlain = (state: RoomState): number => canvasLeftOf(state, 0)

// The strip at the top of the canvas (order DP, P2: 3 rows, its row of air the space to the first part), which a paged body leaves.
export const LINK_ROWS = STRIP.rows

// The places that page their own lists by their own rows: the Seats place, a seat's window (another seat's face), Answered, the list
// of Settings and its Versions section when the card draws the table (the table pages its entries; the card of the lines form, which an
// older sandoq keeps, has no pager of its own, so the body pager still pages it).
const pagesItself = (nav: Nav, seat: string, tabled: boolean): boolean =>
  nav.view === 'level' ||
  nav.view === 'desk' ||
  nav.view === 'answered' ||
  nav.view === 'yours' ||
  nav.view === 'room' ||
  nav.view === 'shelf' ||
  nav.view === 'profile' ||
  (nav.view === 'settings' && (nav.section === undefined || (nav.section === 'versions' && tabled))) ||
  (nav.view === 'seat' && nav.name !== '' && nav.name !== (seat === '' ? THIS_SEAT : seat))

// The Public lens is PaneSeat (order A-S4) and nothing else: this seat's face (or another seat's, by the nav), or the
// level up, each seat's waits. The model (seat.ts) is mapped to the props of views/seat.tsx here, and the acts of the
// register to its acts: a tap and a send are today's taps, "Not now" sets the wait aside in memory (the next shows), "Read
// the step ›" opens the card under Operator, "Answered today N ›" opens today's answers whole and a second press folds
// them. "Who sits, what it plays, the door ›" is the Operator's and waits for the Room place.
function publicView(state: RoomState) {
  const { ui, nav, walks, entries, seatsText = '', seat = '', now, zone, aside = [], answeredOpen = false, allSeats = false, actions } = state
  const model: SeatState = { walks, seatsText, seat, now, zone, entries }
  // The app with no room says so alone: no seat face, so no "Nothing waits on" a seat that is a folder's name.
  if (state.app && !state.exists) return noRoomView(state)
  // The keeper's shape ask, opened from the desk: its own gate view (Yes makes the todo, No leaves it), not a letter of the walks.
  const shape = shapeOfNav(state)
  if (shape !== undefined) {
    return [
      ...noRoomView(state),
      ...shapeView({
        ui,
        plan: state.plan,
        columns: state.columns,
        app: state.app,
        ask: shape,
        now,
        sent: (state.shapeSent ?? []).includes(shape.id),
        actions: { tap: choice => actions.tap(shape.id, shape.id, choice) },
      }),
    ]
  }
  if (state.app && nav.view === 'level') {
    const up = level(model)
    return [
      ...noRoomView(state),
      ...seatsView({
        ui,
        ...frameOf(state),
        rows: up.rows.map(row => ({ name: row.name, here: row.here, count: row.count, first: row.first, who: whoWords(row.told, row.role) })),
        quiet: up.quiet,
        canvasRows: canvasRowsNow(state) - LINK_ROWS,
        pages: state.pages,
        actions: {
          openSeat: name => void actions.openSeat?.(name),
          page: (list, page) => void actions.page?.(list, page),
        },
      }),
    ]
  }
  if (state.app && nav.view === 'seat' && nav.name !== '' && nav.name !== (seat === '' ? THIS_SEAT : seat)) {
    const named = nav.name
    const window = seatWindow(model, named)
    return [
      ...noRoomView(state),
      ...seatWindowView({
        ui,
        ...frameOf(state),
        name: named,
        who: whoWords(window.told, window.role),
        waits: window.waits.map(item => ({ cardId: item.wait.cardId, askId: item.wait.askId, title: item.wait.title, asks: item.asks, hisOwn: item.hisOwn })),
        saying: state.seatTo === named,
        canvasRows: canvasRowsNow(state) - LINK_ROWS,
        pages: state.pages,
        actions: {
          openWait: (cardId, askId) => void actions.open({ view: 'wait', cardId, askId, from: named }),
          sayTo: () => void actions.setSeatTo?.(named),
          page: (list, page) => void actions.page?.(list, page),
        },
      }),
    ]
  }
  if (nav.view === 'level') {
    const up = level(model)
    return [
      ...noRoomView(state),
      ...levelView({
        ui,
        ...frameOf(state),
        surface: surfaceOf(state),
        width: state.layer,
        total: up.total,
        seatsWithWait: up.waiting,
        seatsKnown: up.known,
        rows: up.rows.map(row => ({ name: row.name, kind: kindWords(row.kind), isHere: row.here, count: row.count, first: row.first })),
        idle: up.quiet,
        allSeats,
        isOperator: false,
        actions: {
          openSeat: name => actions.openSeat?.(name),
          moreSeats: () => actions.moreSeats?.(),
          openRoom: () => {},
        },
      }),
    ]
  }
  const named = nav.view === 'seat' && nav.name !== '' ? nav.name : undefined
  const face = named === undefined ? seatFace(model) : seatFace(model, named)
  // A wait opened from a seat's window is the same window as under Letters: this seat's face, that wait alone.
  // A card of his that holds an ask waiting on him shows that ask under its words, answered as it is today.
  // An ask the keeper decided is no open wait: opened from the desk by Change on its pick (order T3) it stands with its choices as a letter does.
  const decidedWait = nav.view === 'wait' && nav.from === FROM_DESK ? askedWait(model, nav.cardId, nav.askId) : undefined
  const waits =
    nav.view === 'wait'
      ? face.waits.some(wait => wait.cardId === nav.cardId && wait.askId === nav.askId) || decidedWait === undefined
        ? face.waits.filter(wait => wait.cardId === nav.cardId && wait.askId === nav.askId)
        : [decidedWait]
      : nav.view === 'yours'
        ? face.waits.filter(wait => wait.cardId === nav.cardId)
        : asideLast(face.waits, aside)
  const seatPart = (part: 'whole' | 'head' | 'rest', text?: SeatProps['text'], thread?: SeatProps['thread']) =>
    seatView({
      part,
      ...(text === undefined ? {} : { text }),
      ...(thread === undefined ? {} : { thread }),
      ui,
      ...frameOf(state),
      surface: surfaceOf(state),
      ...(state.seatOpen === undefined
        ? {}
        : { open: { seat: state.seatOpen.seat, last: state.seatOpen.last, note: state.seatOpen.note, onShut: () => void actions.shutSeat?.() } }),
      seat: face.seat,
      isHere: named === undefined || named === (seat === '' ? THIS_SEAT : seat),
      // The lean pick holds the hotkey 1 only while the Desk is the open place (Letters stands under it): the dock's Desk holds it in every other place.
      leanKey: !state.app || (hotkeysOn() && dockPlaceOf(nav, seat) === 'desk'),
      waits: waits.map(wait => ({
        cardId: wait.cardId,
        askId: wait.askId,
        title: wait.title,
        // under an open card of his the ask keeps its question and its answers: his words stand whole above it, not twice
        body: nav.view === 'yours' ? '' : wait.body,
        from: wait.from,
        why: wait.why,
        age: wait.age,
        // An ask a seat drafted an answer for is drawn as the form of frame 3: the draft is what he sends or changes.
        kind: wait.form || wait.draft !== undefined ? 'form' : 'gate',
        choices: wait.choices,
        lean: wait.lean,
        ...(wait.draft === undefined ? {} : { draft: { words: stripUlid(wait.draft.choice), by: wait.draft.by } }),
        ...(wait.reason === undefined ? {} : { reason: wait.reason }),
      })),
      others: face.others,
      // the shape asks he closed today count here as on the desk, for this seat's own face
      answered: face.answeredToday + (named === undefined ? shapesAnsweredToday(shapeAsks(state.feed), now, zone).length : 0),
      folds: (nav.view === 'wait' || nav.view === 'yours' ? [] : answeredOpen ? face.today : face.folds).map(fold => ({ act: fold.act, title: fold.title, ...(fold.detail === undefined ? {} : { detail: fold.detail }) })),
      actions: {
        open: cardId => actions.openCard?.(cardId),
        // A candidate is offered as "NAME @ULID" and tapped by its `@ULID` alone, as the turn of a card taps it.
        tap: (cardId, askId, choice) => actions.tap(cardId, askId, AT_ID.exec(choice)?.[0] ?? choice),
        // His words: the draft as it stood is tapDraft (the door writes drafted_by), anything else is a plain tap.
        send: (cardId, askId, words) => {
          const said = waits.find(wait => wait.cardId === cardId && wait.askId === askId)?.said
          // A card said to this seat is answered by a say that names it: no tap, for it has no ask.
          if (said !== undefined) return actions.answerSaid?.(cardId, said.by, words)
          const draft = waits.find(wait => wait.cardId === cardId && wait.askId === askId)?.draft
          if (draft !== undefined && actions.tapDraft !== undefined && words === stripUlid(draft.choice)) {
            return actions.tapDraft(cardId, askId, draft.choice, draft.id)
          }
          return actions.tap(cardId, askId, words)
        },
        notNow: (cardId, askId) => actions.notNow?.(cardId, askId),
        openAnswered: () => actions.toggleAnswered?.(),
      },
    })
  const body = seatPart('whole')
  // The app's Letters, this seat's own face (not a wait opened from a window): the line of where to write first, and Your cards after the
  // waits (order YC, Y2b).
  // A letter opened from the desk has two tabs, Text and Walk (order W2): the walk of its card as rows, where the register gives the acts.
  // The question of the letter stays the head above the tabs on both; Text holds the rest of the card, Walk the rows. Nothing scrolls (order P1): what
  // the head and the tabs leave of the canvas is the rows of the tab, whose words or rows page inside their card.
  if (nav.view === 'wait' && nav.from === FROM_DESK && state.exists && actions.letterTab !== undefined) {
    const tab = state.letterTab ?? 'text'
    // The head and its tabs are ONE block of the page (order P1b): the air between them gives way with the other air of a tight pane, which two
    // blocks of the page could not do, so the first page of a letter (question, tabs, picks) stands at the pane's least.
    const { Box } = ui
    // The press that opens the letter in the room app (orders O1, O2) stands at the right end of the tabs' row, where the room's sandoq has the verb:
    // it costs the page no row, and the head measures it where the tabs wrap. The tab shown says what opens: the Text tab the letter, the Walk tab the
    // walk at its top, and only the press of the kind that opened says Opened.
    const kind = tab === 'walk' ? 'walk' : 'letter'
    const inApp = state.roomApp === true && actions.openInApp !== undefined
    const openApp = inApp
      ? [openInAppView({ ui, plan: state.plan, columns: state.columns, opened: state.appOpened === `${kind}:${nav.cardId}`, onPress: () => actions.openInApp?.(kind, nav.cardId) })]
      : []
    // Where the app is there a press on a row of the walk opens the walk in the app at that row (a row with no id, keyed by its place, at the top); else
    // the row opens in place.
    const onRow = (key: string) => (inApp ? void actions.openInApp?.('walk', nav.cardId, key.startsWith('#') ? undefined : key) : void actions.walkRow?.(key))
    const head = (
      <Box key="letter-head" flexDirection="column" gap={SPACE.block}>
        {seatPart('head')}
        {letterTabs({ ui, app: state.app, tab, actions: { tab: next => void actions.letterTab?.(next) }, extra: openApp })}
      </Box>
    )
    const above = [...noRoomView(state), head]
    const names = namesOf(ui as any)
    const left =
      !state.app || state.rows === undefined
        ? undefined
        : canvasRowsNow(state) - LINK_ROWS - above.reduce((sum, part) => sum + sizeOf(part, state.plan.width, names).h + SPACE.block, 0)
    const onPage = (list: string, page: number) => void actions.page?.(list, page)
    const walkText = walks.find(walk => walk.id === nav.cardId)?.text
    // His chat with the keeper stands between the card's words and its ask (order keeper chat). It takes at most half of the rows the card has, and pages
    // newest last inside them. The terminal's rows are what its frame leaves less the head and the tabs.
    const termLeft =
      state.app || state.termRoom === undefined ? undefined : state.termRoom - above.reduce((sum, part) => sum + sizeOf(part, state.columns, names).h + SPACE.block, 0)
    const chatLeft = left ?? termLeft
    const thread = chatView({
      ui,
      app: state.app,
      lines: chatThread(walkText ?? '', state.chatSent?.[nav.cardId] ?? []),
      cells: state.app ? innerOf(state.plan.width, state.columns) : Math.max(1, state.columns - 4),
      ...(chatLeft === undefined || state.chatWhole === true ? {} : { room: chatRoomOf(chatLeft) }),
      ...(state.pages?.[CHAT_LIST] === undefined ? {} : { page: state.pages[CHAT_LIST] }),
      onPage: next => onPage(CHAT_LIST, next),
    })
    return [
      ...above,
      ...(tab === 'walk'
        ? walkView({
            ui,
            plan: state.plan,
            columns: state.columns,
            app: state.app,
            text: walkText,
            open: state.walkOpen ?? '',
            actions: { row: onRow },
            ...(left === undefined ? {} : { room: left, pages: state.pages, onPage }),
          })
        : seatPart('rest', left === undefined ? undefined : { room: left, page: state.pages?.[LETTER_TEXT] ?? 0, onPage: next => onPage(LETTER_TEXT, next) }, thread)),
    ]
  }
  if (!state.app || !state.exists || nav.view === 'wait') return [...noRoomView(state), ...body]
  const yours = yourCardsOf(state.yours ?? [], state.yourIds ?? [], now, state.saidIds ?? [])
  // A card of his, open (order YC, Y2c): the card itself, and under it the ask that waits on him, if it holds one. The card pages by its
  // own rows: what the canvas leaves less Back and the ask under it.
  if (nav.view === 'yours') {
    const names = namesOf(ui as any)
    const room = state.rows === undefined ? undefined : canvasRowsNow(state) - LINK_ROWS
    const standing = (waits.length === 0 ? [] : body).reduce((sum, part) => sum + sizeOf(part, state.plan.width, names).h + SPACE.block, 0)
    // The ask stands under the card where the canvas leaves room for both; on a short pane the card takes it all and says where to answer.
    const beside = room === undefined || asksFit(room, standing, innerOf(state.plan.width, state.columns))
    const asks = waits.length === 0 || !beside ? [] : body
    return [
      ...noRoomView(state),
      yourCardView({
        ui,
        ...frameOf(state),
        card: yours.find(card => card.id === nav.cardId),
        rows: room === undefined ? undefined : room - (beside ? standing : 0),
        pages: state.pages,
        onPage: page => void actions.page?.(OPEN_PAGE, page),
        answerIn: waits.length > 0 && !beside,
      }),
      ...asks,
    ]
  }
  return [
    ...noRoomView(state),
    ...yoursBody(
      {
        ui,
        ...frameOf(state),
        line: writeLineOf(state.bridgeOff === true),
        cards: yours,
        rows: state.rows === undefined ? undefined : Math.max(LEAST_ROWS, state.rows),
        // The row of his turn in Ur (order UR, cut U2) while his ask is open, then the door line: both stand in the body as its first blocks where
        // they can (the door line when starterFirst, else over the canvas on every page).
        first: [...urRowView({ ui, window: actions.urWindow?.(''), surface: surfaceOf(state), actions }), ...(state.starterFirst === true ? starterView(state) : [])],
        reserved: LINK_ROWS + (state.starterFirst === true ? 0 : starterRowsOf(state)),
        pages: state.pages,
        actions: {
          // A press on a card of his opens it in the Letters window.
          open: cardId => void actions.open({ view: 'yours', cardId }),
          page: (list, page) => void actions.page?.(list, page),
        },
      },
      body,
    ),
  ]
}

// The lenses of the us face, by the shown tab of the head. Public: the seat face and the level up (publicView).
// Operator: the walk panel of each card (in the place a list of rows, the banner of a door that is down, the open
// card under its row), and what runs at its foot. Trace: the world in motion, a row an event.
const LENS_VIEWS: Record<Face, FaceView> = {
  public: publicView,
  operator: state => {
    // The pane's own "Settings changed" card heads the rows of a place; the terminal's feed holds it by its time.
    const own = state.app ? changedView(state) : undefined
    return state.app
      ? [...(own === undefined ? [] : [own]), ...operatorLens(state)]
      : [...ABOVE.operator(state), ...feedView(state), operatorView({ ui: state.ui, discs: state.discs })]
  },
  trace: state =>
    state.app
      ? [...noRoomView(state), ...traceLensView(motionOf(state))]
      : [...ABOVE.trace(state), motionView(motionOf(state))],
}

// The scene's card of Settings (views/settings.tsx) with one dim line more in its head, under its own line: which
// background the pane draws (order BG). The card is the same card, rebuilt with its head's children and one more. Where the room's own
// drawing is the wall, the row of the hour holds one dim line in place of its choices: the hour does not change that wall.
function withBackgroundLine(state: RoomState, card: any) {
  const { ui, background } = state
  const { Text } = ui
  const parts = kidsOf(card)
  if (parts.length === 0) return card
  const [head, ...rest] = parts
  const line = (
    <Text key="background-line" color={THEME.dim} wrap="wrap">
      {backgroundLine(background)}
    </Text>
  )
  const hourLine = (
    <Text key="hour-own-line" color={THEME.dim} wrap="wrap">
      {HOUR_OWN_LINE}
    </Text>
  )
  const keyOf = (node: any): string => String(node?.key ?? node?.props?.key ?? '')
  const own = isOwnWall(settingsOf(state).scene, background)
  const rows = rest.map(part => (own && keyOf(part) === 'row-hour' ? hourLine : part))
  return withKids(ui, card, [withKids(ui, head, [...kidsOf(head), line]), ...rows])
}

// The Settings place: the cards of the groups under the head (the way back stands in the terminal's column), with the
// last change and its Undo under the group it changed. The scene stays behind; there is no composer.
const settingsPlace = (state: RoomState) => {
  const { ui, app, nav, lastLine, lastKey, walks, now, zone, rulesText = '', takenOff = [], actions } = state
  const { Text } = ui
  // His rules that stand, each with its count today (a rule taken off by "Ask me next time" has left the list).
  const rules = rulesToday(rulesText, walks, now, zone).filter(rule => !takenOff.includes(rule.id))
  const parts = settingsParts({
    ui,
    ...frameOf(state),
    surface: surfaceOf(state),
    width: state.layer,
    settings: settingsOf(state),
    lastLine,
    lastKey,
    rules,
    actions: {
      onChange: (key, value) => actions.changeSetting?.(key, value),
      onUndo: () => {
        void actions.undoSetting?.()
      },
      openRule: ruleId => actions.openRule?.(ruleId),
      addRule: () => actions.addRule?.(),
    },
  })
  // The lens pick: with the head gone from the app's place the lens is picked here (the app's alone).
  const lens = lensView({
    ui,
    ...frameOf(state),
    surface: surfaceOf(state),
    width: state.layer,
    lenses: lensesOf(settingsOf(state)),
    face: state.face,
    roomShown: state.face === 'operator',
    actions: {
      setFace: name => actions.setFace(name),
      openRoom: () => actions.open({ view: 'room' }),
    },
  })
  // The card of Versions; with no card handed over it is not drawn. Its table takes the rows the body of a place has (the frame's one
  // count less the Back link), and none when the host gave no rows: then it has no limit and no pages.
  const card = state.versionsCard
  const versions =
    card === undefined
      ? []
      : versionsView({
          ui,
          ...frameOf(state),
          surface: surfaceOf(state),
          width: state.layer,
          card: card.table === undefined || state.rows === undefined ? card : { ...card, table: { ...card.table, rows: canvasRowsNow(state) - LINK_ROWS } },
          onCheck: () => {
            void actions.checkVersions?.()
          },
          ...(app ? { onPlays: () => void actions.open({ view: 'room', card: 'plays' }) } : {}),
        })
  // The Secrets card (order S2): the names sandoq lists and the line of the one that is shown; with no card handed over it is not drawn.
  const secrets =
    state.secretsCard === undefined
      ? []
      : [
          secretsView({
            ui,
            ...frameOf(state),
            surface: surfaceOf(state),
            width: state.layer,
            card: state.secretsCard,
            actions: {
              read: () => void actions.readSecrets?.(),
              show: name => void actions.showSecret?.(name),
            },
          }),
        ]
  // The Nudge card (order nudge pane): the state of the verb for this pane's seat, and its intervals; with no card handed over it is not drawn.
  const nudge =
    state.nudgeCard === undefined
      ? []
      : [
          nudgeView({
            ui,
            ...frameOf(state),
            surface: surfaceOf(state),
            width: state.layer,
            card: state.nudgeCard,
            zone: state.zone ?? 0,
            keysSet: state.keysSet === true,
            actions: { every: every => void actions.nudge?.(every), toggle: () => void actions.nudge?.() },
          }),
        ]
  // The Keys card (order keys): what his keybindings.json says of the five keys; with no card handed over it is not drawn.
  const keys =
    state.keysCard === undefined
      ? []
      : [keysView({ ui, ...frameOf(state), surface: surfaceOf(state), width: state.layer, card: state.keysCard, actions: { add: () => void actions.addKeys?.() } })]
  if (app) {
    // The app's Settings is the list of its sections; one section opens alone, with "Back to Settings" on top (the canvas's).
    const section = nav.view === 'settings' ? nav.section : undefined
    if (section === undefined) {
      return settingsListView({
        ui,
        ...frameOf(state),
        data: { settings: settingsOf(state), face: state.face, rules: rules.length, versions: state.versionsCard, secrets: state.secretsCard, nudge: state.nudgeCard, keys: state.keysCard },
        canvasRows: canvasRowsNow(state) - LINK_ROWS,
        page: state.pages?.settings ?? 0,
        ...(state.opened?.view === 'settings' && state.opened.section !== undefined ? { openSection: state.opened.section } : {}),
        actions: { open: id => actions.open({ view: 'settings', section: id }), page: (list, page) => void actions.page?.(list, page) },
      })
    }
    return { lens, feed: [parts.groups.lenses], scene: [withBackgroundLine(state, parts.groups.scene)], rules: [parts.rules], secrets, nudge, keys, versions }[section]
  }
  return [...backView(state), ...reachLenses(state), parts.groups.lenses, parts.groups.scene, parts.rules, ...secrets, ...nudge, ...keys, ...lens, ...versions, <Text key="nav-space"> </Text>]
}

// The Room place (order A-W6), under Operator alone: who sits, what it plays, the door, the programs running and what
// the room has grown, read by roomOf from the files the register hands the pane (a file that is missing leaves its
// section out). The way back stands in the terminal's column; the scene stays behind and there is no composer. Each
// act is the register's; one it does not give does nothing.
const roomPlace = (state: RoomState) => {
  const { ui, app, exists, entries, walks, now, zone, isDoorUp = false, seatsText = '', discsText = '', tickText = '', programTexts = {} } = state
  const { bytes, roomOpen = '', allSeats = false, actions } = state
  const { Text } = ui
  if (!exists) return app ? [] : backView(state)
  const room = roomOf({
    seatsText,
    discsText,
    tickText,
    programs: Object.keys(programTexts).sort().map(name => programTexts[name]),
    entries,
    walks,
    isDoorUp,
    now,
    zone,
  })
  // The app's room place is the room card (order DP, P4): its rows, or one card of it. The terminal keeps its column of cards below.
  if (app) {
    const { nav, pages = {}, walks: heard, seat = '', entries: kept, rulesText = '', takenOff = [], roomWhere = '', discChecks } = state
    const card = nav.view === 'room' ? nav.card : undefined
    const openCard = state.opened?.view === 'room' ? state.opened.card : undefined
    const canvasRows = canvasRowsNow(state) - LINK_ROWS
    const page = (list: string, at: number) => void actions.page?.(list, at)
    const common = { ui, ...frameOf(state), canvasRows }
    const { door } = room
    if (card === 'door') {
      const today = [door.usdToday === undefined ? '' : `$${door.usdToday.toFixed(2)}`, door.ticksToday === undefined ? '' : countOf(door.ticksToday, 'tick')].filter(part => part !== '').join(' · ')
      return doorView({
        ...common,
        doorUp: door.up,
        downSince: door.downSince,
        lastTick: door.lastTick,
        today,
        programs: room.programs.filter(program => !isIdle(program.state)),
        ...(room.grown === undefined ? {} : { grown: room.grown }),
        size: bytesWords(bytes),
        page: pages.door ?? 0,
        actions: { putUp: () => actions.putUp?.(), page },
      })
    }
    if (card === 'plays') {
      return playsView({
        ...common,
        surface: surfaceOf(state),
        discs: room.discs,
        ...(discChecks === undefined ? {} : { checks: discChecks }),
        ...(room.update === undefined ? {} : { update: room.update }),
        // the acts of the discs stand where the discs do (order DP, P4 part 3): the card of Versions, as the register reads it, gives them
        ...(state.versionsCard?.table === undefined || state.versionsCard.older === true
          ? {}
          : { acts: { table: state.versionsCard.table, cannot: state.versionsCard.cannot, busy: busyOf(state.versionsCard) } }),
        // the dock's Letters holds the hotkey 1 in the app
        leanKey: false,
        page: pages.plays ?? 0,
        actions: { ...(actions.checkVersions === undefined ? {} : { check: () => actions.checkVersions?.() }), tap: actions.tap, openPage: pageOf => actions.openPage?.(pageOf), page },
      })
    }
    const entriesOfFeed = state.feed ?? []
    if (card === 'feed') return roomFeedView({ ...common, lines: feedLines(entriesOfFeed), page: pages.feed ?? 0, actions: { page } })
    const rules = rulesToday(rulesText, heard, now, zone).filter(rule => !takenOff.includes(rule.id))
    return roomCardView({
      ...common,
      operator: state.face === 'operator',
      data: {
        doorUp: door.up,
        downSince: door.downSince,
        ...(door.ticksToday === undefined ? {} : { ticksToday: door.ticksToday }),
        seats: room.seats.length,
        seatsWaiting: level({ walks: heard, seatsText, seat, now, zone, entries: kept }).waiting,
        records: kept.length,
        rules: rules.length,
        discs: room.discs.length,
        feed: entriesOfFeed.length,
        pane: VERSION,
        where: roomWhere,
      },
      ...(openCard === undefined ? {} : { openCard }),
      page: pages.roomcard ?? 0,
      actions: {
        openDoor: () => actions.open({ view: 'room', card: 'door' }),
        openSeats: () => actions.open({ view: 'level' }),
        openShelf: () => actions.open({ view: 'shelf', by: 'kind' }),
        openPlays: () => actions.open({ view: 'room', card: 'plays' }),
        openFeed: () => actions.open({ view: 'room', card: 'feed' }),
        openVersions: () => actions.open({ view: 'settings', section: 'versions' }),
        page,
      },
    })
  }
  return [
    ...backView(state),
    ...roomView({
      ui,
      room,
      open: roomOpen,
      allSeats,
      bytes,
      actions: {
        open: card => actions.openRoomCard?.(card),
        moreSeats: () => actions.moreSeats?.(),
        openPage: page => actions.openPage?.(page),
        tap: actions.tap,
        putUp: () => actions.putUp?.(),
      },
    }),
    <Text key="nav-space"> </Text>,
  ]
}

// What a desk card says before the register has read anything (a draw with no card given).
const NO_DESK_CARD: DeskCard = { state: 'rest', items: [], lines: {}, line: '', busy: '', opened: '', older: false, cannot: '' }

// The rows of his desk: this seat's open asks (the letters), the keeper's picks of the day on his asks he has not taken off (order T3), then the
// items sandoq lists, in the one order of model/desk.ts.
// The keeper's open shape asks (the proposals to make a todo, read from the feed) stand with his letters.
type DeskState = Pick<RoomState, 'walks' | 'seatsText' | 'seat' | 'now' | 'zone' | 'entries' | 'deskCard' | 'keeperOk' | 'feed'>
const deskRowsOf = (state: DeskState): DeskRow[] =>
  deskRows(
    seatFace({ walks: state.walks, seatsText: state.seatsText ?? '', seat: state.seat ?? '', now: state.now, zone: state.zone, entries: state.entries }).waits,
    (state.deskCard ?? NO_DESK_CARD).items,
    keeperRows({ walks: state.walks, seatsText: state.seatsText ?? '', seat: state.seat ?? '', now: state.now, zone: state.zone, entries: state.entries }, new Set(state.keeperOk ?? [])),
    openShapes(state.feed),
  )

// The count the dock and the tray say: the rows that wait on him, letters, the keeper's shape asks, the keeper's picks and his open items; none for a seat's.
// The terminal's Desk N, its status line and the band over the prompt (the register's bandText) say this one number.
export const deskCountOf = (state: DeskState): number => hisCount(deskRowsOf(state))

// The shape ask a wait names: the desk opens it as a wait whose card and ask are its own id (a letter's card and ask are two ids). Open or closed.
function shapeOfNav({ nav, feed }: Pick<RoomState, 'nav' | 'feed'>): ShapeAsk | undefined {
  if (nav.view !== 'wait' || nav.from !== FROM_DESK || nav.cardId !== nav.askId) return undefined
  const id = nav.cardId
  return shapeAsks(feed).find(ask => ask.id === id)
}

// The card the bar can chat about with the keeper (order keeper chat): a letter opened from the desk whose card has its walk in the room. A shape ask lies on no
// card of the walks and has no thread. '' for any other place.
function chatCardOf(nav: Nav, walks: WalkText[], feed: RoomState['feed']): string {
  if (nav.view !== 'wait' || nav.from !== FROM_DESK || shapeOfNav({ nav, feed }) !== undefined) return ''
  const id = nav.cardId
  return walks.some(walk => walk.id === id) ? id : ''
}

// HIS DESK (order DESK, D2), the place the pane opens on: the list of the open pile, or one item opened from it, a step from the desk. A letter opens
// as a wait of this seat (publicView), with its picks. Under 128 columns the item takes the list's place with `‹ Desk`; from 128 it stands at the right.
function deskPlace(state: RoomState) {
  const { ui, nav, actions, now, zone } = state
  if (nav.view !== 'desk') return []
  if (state.app && !state.exists) return noRoomView(state)
  const card = state.deskCard ?? NO_DESK_CARD
  const group = nav.group ?? 'kind'
  const keep = { ...(nav.pile === undefined ? {} : { pile: nav.pile }), ...(nav.group === undefined ? {} : { group: nav.group }) }
  const item = nav.item === undefined ? undefined : card.items.find(one => one.id === nav.item && !one.done)
  if (item !== undefined) {
    const room = state.rows === undefined ? undefined : canvasRowsNow(state) - LINK_ROWS
    // A page item opens in the room app (order O3) where the room's sandoq has the page verb and the path of its origin passes the rule of roomPagePath.
    // A text page, an image, a video and a sound share roomPage (order O4, one release); an svg, html or pdf has no press.
    const pageKind = item.opens.kind === 'page' ? pageKindOf(item.opens.value) : 'other'
    const has = pageKind !== 'other' && state.roomPage === true
    const path = has && actions.openInApp !== undefined ? roomPagePath(item.opens.value) : undefined
    const body = [
      ...noRoomView(state),
      ...deskItemView({
        ui,
        plan: state.plan,
        columns: state.columns,
        app: state.app,
        item,
        now,
        card,
        rows: room,
        ...(path === undefined ? {} : { inApp: { path, opened: state.appOpened === `page:${path}` } }),
        actions: {
          done: id => void actions.doneDesk?.(id),
          openOrigin: (origin, id) => void actions.openOrigin?.(origin, id),
          openInApp: page => void actions.openInApp?.('page', page),
        },
      }),
    ]
    // NOTHING SCROLLS (order P2): the opened item pages by the parts of its card; its pager is scoped by the item, so another item opens on its first page.
    if (!state.app || room === undefined) return body
    return pagedBody({ ui, plan: state.plan, columns: state.columns, rows: room, pages: state.pages, scope: `item-${item.id}-`, onPage: (list, page) => void actions.page?.(list, page) }, body)
  }
  const rows = deskRowsOf(state)
  const asked = state.opened
  const open = asked?.view === 'desk' && asked.item !== undefined ? `item-${asked.item}` : asked?.view === 'wait' && asked.from === FROM_DESK ? `ask-${asked.cardId}-${asked.askId}` : undefined
  const face = seatFace({ walks: state.walks, seatsText: state.seatsText ?? '', seat: state.seat ?? '', now, zone, entries: state.entries })
  return [
    ...noRoomView(state),
    ...deskView({
      ui,
      plan: state.plan,
      columns: state.columns,
      app: state.app,
      rows,
      group,
      pile: nav.pile,
      now,
      card,
      // the shape asks he closed today count as answers do
      answered: face.answeredToday + shapesAnsweredToday(shapeAsks(state.feed), now, zone).length,
      sent: state.shapeSent ?? [],
      done: doneToday(card.items, now, zone),
      canvasRows: state.rows === undefined ? undefined : canvasRowsNow(state) - LINK_ROWS,
      page: state.pages?.[DESK_LIST] ?? 0,
      small: state.size === 'small',
      ...(open === undefined ? {} : { open }),
      actions: {
        openPile: key => void actions.open({ view: 'desk', pile: key, ...(nav.group === undefined ? {} : { group: nav.group }) }),
        openRow: row => {
          if (row.row === 'ask') return void actions.open({ view: 'wait', cardId: row.wait.cardId, askId: row.wait.askId, from: FROM_DESK, ...keep })
          // The keeper's shape ask opens as a wait whose card and ask are its own id (shapeOfNav), in the gate view of views/shape.tsx.
          if (row.row === 'shape') return void actions.open({ view: 'wait', cardId: row.shape.id, askId: row.shape.id, from: FROM_DESK, ...keep })
          // The keeper's pick: Change opens the ask it answered, as a letter opens, with its choices.
          if (row.row === 'pick') return void actions.open({ view: 'wait', cardId: row.pick.cardId, askId: row.pick.askId, from: FROM_DESK, ...keep })
          // A link opens in his browser and the row says so; any other item opens a step from the desk.
          if (row.item.opens.kind === 'https') return void actions.openOrigin?.(row.item.origin, row.item.id)
          return void actions.open({ view: 'desk', ...keep, item: row.item.id })
        },
        keeperOk: key => void actions.keeperOk?.(key),
        keeperOkAll: keys => void actions.keeperOkAll?.(keys),
        foldPicks: () => void actions.foldPicks?.(),
        // Yes is Make and No is Leave: the ask's id is both the card and the ask of the tap.
        shape: (id, choice) => void actions.tap(id, id, choice),
        done: id => void actions.doneDesk?.(id),
        page: page => void actions.page?.(DESK_LIST, page),
        openAnswered: () => void actions.open({ view: 'answered' }),
        openLetters: () => void (actions.backToSeat !== undefined ? actions.backToSeat() : actions.open({ view: 'seat', name: '' })),
      },
    }),
  ]
}

// Today's answers, a line each, whole (the Answered place of the dock).
const answeredPlace = (state: RoomState) => {
  const { ui, walks, entries, seatsText = '', seat = '', now, zone } = state
  const face = seatFace({ walks, seatsText, seat, now, zone, entries })
  return answeredView({
    ui,
    ...frameOf(state),
    // the shape asks he closed today stand after the letters, by what he took (Make or Leave)
    folds: [
      ...face.today.map(fold => ({ act: fold.act, title: fold.title })),
      ...shapesAnsweredToday(shapeAsks(state.feed), now, zone).map(ask => ({ act: ask.decided?.choice ?? '', title: ask.title })),
    ],
    rows: canvasRowsNow(state) - LINK_ROWS,
    page: state.pages?.answered ?? 0,
    onPage: page => {
      void state.actions.page?.('answered', page)
    },
  })
}

// The made colors of the pane at its hour: the bar and the dock take them, and so does the picture of a game of Ur. Where the room's own drawing is
// the wall the hour moves nothing of them, so they keep the one calm color.
const placeTones = (state: RoomState) => {
  const settings = settingsOf(state)
  return tonesOf(isOwnWall(settings.scene, state.background) ? CALM_HOUR : settings.hour === 'clock' ? hourOf(state.now, state.zone) : settings.hour)
}

// The window of a game of Ur (order UR, cut U2): a place of its own on the us face, whatever the lens, its Back in the canvas's strip (backOf).
// The terminal has no strip: the window draws its own Back. In the app its picture takes the pane's tones (order TONES).
function urPlace(state: RoomState) {
  const { ui, nav, actions, plan, columns } = state
  if (nav.view !== 'ur') return []
  if (state.app && !state.exists) return noRoomView(state)
  return [
    ...noRoomView(state),
    ...urPlaceView({
      ui,
      plan,
      columns,
      surface: surfaceOf(state),
      rows: state.rows === undefined ? undefined : canvasRowsNow(state) - LINK_ROWS,
      window: actions.urWindow?.(nav.cardId),
      back: backOf(state),
      page: state.pages?.ur ?? 0,
      onPage: page => {
        void actions.page?.('ur', page)
      },
      actions,
      tones: placeTones(state),
    }),
  ]
}

const FACE_VIEWS: Record<FaceName, FaceView> = {
  // His desk, where the pane opens: its own place, whatever the lens.
  desk: deskPlace,
  // Today's answers: its own place, whatever the lens.
  answered: answeredPlace,
  // The feed of cards, read in the shown lens; the window of a game of Ur is a place of its own, whatever the lens.
  us: state => (state.nav.view === 'ur' ? urPlace(state) : LENS_VIEWS[state.face](state)),
  // The shelf of records, or one profile: its own place. The terminal keeps above it what the lens kept.
  shelf: state => [...(state.app ? noRoomView(state) : ABOVE[state.face](state)), ...navView(state)],
  settings: settingsPlace,
  // The Room place: the terminal keeps above it what the lens kept, as above the shelf.
  room: state => [...(state.app ? noRoomView(state) : ABOVE[state.face](state)), ...roomPlace(state), ...reachSettings(state)],
}

// The path of the head, "ROOM › SEAT" (order A-S1, the words of A-M4): the room's name, a plain Button that goes one level
// up, then the seat bold. At the room's own folder the seat has no name and the path is the room's name alone. On the level
// up and in the Room place the path is the room's name, bold. The terminal draws it in the theme's keys, an app in the glass
// hexes.
function pathView(state: RoomState) {
  const { ui, nav, app, actions, roomName = '' } = state
  const { Box, Text, Button } = ui
  const shown = seatOf(state)
  const isLevel = nav.view === 'level' || nav.view === 'room'
  const dim = app ? THEME.dim : LOOK.quiet
  const ink = {}
  const room = roomName === '' ? ROOM_WORD : roomName
  return (
    <Box key="path" flexDirection="row" flexWrap="wrap" columnGap={app ? SPACE.near : 1}>
      {isLevel ? (
        <Text key="path-room" bold {...ink}>
          {room}
        </Text>
      ) : (
        <Button
          key="path-room"
          plain
          label={room}
          onPress={() => {
            void actions.openLevel?.()
          }}
        />
      )}
      {!isLevel && shown !== '' && (
        <Text key="path-sep" color={dim}>
          ›
        </Text>
      )}
      {!isLevel && shown !== '' && (
        <Text key="path-seat" bold {...ink}>
          {shown}
        </Text>
      )}
    </Box>
  )
}

// The place a press on a tab or a key opens, as a nav: the desk, the Room place (the door) or the shelf.
const placeNavOf = (place: KeyPlace): Nav => (place === 'desk' ? { view: 'desk' } : place === 'door' ? { view: 'room' } : { view: 'shelf', by: 'kind' })

// The tab the nav lights in the wide terminal: the desk (with a letter opened from it), the shelf (with a record), the door; none for any other.
const tabOf = (nav: Nav): KeyPlace | undefined =>
  nav.view === 'desk' || (nav.view === 'wait' && nav.from === FROM_DESK) ? 'desk' : nav.view === 'shelf' || nav.view === 'profile' ? 'shelf' : nav.view === 'room' ? 'door' : undefined

// Where the terminal's Back goes, and its words from the longest to the shortest (order 341734, fault 2): the place it CAME from. Settings opened from the
// Door goes back to the Door, from the Desk or the Shelf to that tab (the register keeps the place in `came`), and a section of Settings (Versions) to
// the Door it was opened from, else to Settings; any other place goes to this seat's face, as it has.
const CAME_WORDS: Record<KeyPlace, string> = { desk: 'Back to the Desk', shelf: 'Back to the Shelf', door: 'Back to the Door' }
function terminalBackOf(state: RoomState): { words: string[]; press: () => void } {
  const { nav, seat = '', actions, came } = state
  const home = { words: [backWords(seat), 'Back', '‹'], press: () => void goBack(state) }
  if (nav.view !== 'settings') return home
  const place = came === undefined ? undefined : tabOf(came)
  if (came !== undefined && place !== undefined && (nav.section === undefined || place === 'door')) return { words: [CAME_WORDS[place], 'Back', '‹'], press: () => void actions.open(came) }
  if (nav.section !== undefined) return { words: ['Back to Settings', 'Back', '‹'], press: () => void actions.open({ view: 'settings' }) }
  return home
}

// Whether the place open is a root of one of the three tabs: it has no Back, the tab is its way.
const isTabRoot = (nav: Nav): boolean =>
  (nav.view === 'desk' && nav.item === undefined) || (nav.view === 'shelf' && (nav.of === undefined || nav.of === '')) || (nav.view === 'room' && nav.card === undefined && nav.from === undefined)

// Whether the small terminal is at rest: the bar and its keys alone, the seat's own face with nothing open (the register shows the seat's face
// in place of the desk there). A room that is not read or not there says so in the place, so it is never at rest.
const isRest = (nav: Nav, seat: string, exists: boolean | undefined): boolean => exists === true && ((nav.view === 'seat' && (nav.name === '' || nav.name === seat)) || (nav.view === 'feed' && nav.cardId === ''))

// The terminal's status line: a dot lit while a door runs, the channel (prod or dev, quiet), the path ROOM › SEAT, then the quiet words (the door, what waits, the cards and the
// cost); off the Public lens the cost and the count (the faults too under Operator) stand at the right, as the head said them.
function terminalStatus(state: RoomState) {
  const { ui, face, exists, cards, total, isDoorUp = false } = state
  const { Box, Text } = ui
  const cost = costOf(cards)
  const meta =
    face === 'public'
      ? []
      : [countOf(total, 'card'), face === 'operator' ? headerMeta(cards) : cost > 0 ? `$${cost.toFixed(4)}` : ''].filter(part => part !== '')
  return (
    <Box key="status-line" flexDirection="row" flexWrap="wrap" columnGap={1}>
      <Text color={isDoorUp ? LOOK.ok : LOOK.quiet}>●</Text>
      <Text color={LOOK.quiet}>{CHANNEL}</Text>
      {pathView(state)}
      {exists && placeStatusTerminal(state)}
      {exists && meta.length > 0 && <Text color={LOOK.quiet}>{meta.join(' · ')}</Text>}
    </Box>
  )
}

// THE TAB ROW IS ONE ROW at any wide width, from SMALL_COLUMNS (order mend terminal real, mend 2): Desk N, Shelf and Door always; then Settings and the
// lens tabs, each whole, in that order, as many as the columns hold (a Button counted as the host draws it, views/cells.ts); the first that does not fit
// ends the row. What the row leaves out is reached from a place: Settings from the Door (a Button at the end of it), a lens from the Lens line of
// Settings. The Back, where a place deeper than a tab is open, stands first: its words, `Back to SEAT`, where the row holds them with the Settings tab,
// else `Back`, else `‹` alone (the first that holds the three tabs and Settings, else the first that holds the three tabs).
const TAB_GAP = 1
type TabPlan = { back: string | undefined; settings: boolean; lenses: Face[]; left: { settings: boolean; lenses: Face[] } }
function tabPlanOf(state: RoomState): TabPlan {
  const { nav, seat = '', columns } = state
  const waiting = deskCountOf(state)
  const core = [waiting > 0 ? `Desk ${waiting}` : 'Desk', 'Shelf', 'Door'].map(label => buttonCells(label))
  const coreCells = core.reduce((sum, cells) => sum + cells, 0) + TAB_GAP * (core.length - 1)
  const optional: { settings: boolean; face?: Face; label: string }[] = [{ settings: true, label: 'Settings' }, ...lensesOf(settingsOf(state)).map(name => ({ settings: false, face: name, label: name }))]
  // how many of the optional tabs stand, whole and in order, in a row that has `used` cells so far
  const heldAt = (start: number): number => {
    let used = start
    let held = 0
    while (held < optional.length && used + TAB_GAP + buttonCells(optional[held].label) <= columns) {
      used += TAB_GAP + buttonCells(optional[held].label)
      held += 1
    }
    return held
  }
  const backCells = (words: string): number => TAB_GAP + buttonCells(words, false, BACK_KEY)
  const wantsBack = showsBack(nav, seat) && !isTabRoot(nav)
  const words = terminalBackOf(state).words
  const settingsCells = TAB_GAP + buttonCells('Settings')
  const back = !wantsBack ? undefined : (words.find(one => coreCells + backCells(one) + settingsCells <= columns) ?? words.find(one => coreCells + backCells(one) <= columns) ?? '‹')
  const held = heldAt(coreCells + (back === undefined ? 0 : backCells(back)))
  const shown = optional.slice(0, held)
  const left = optional.slice(held)
  return {
    back,
    settings: shown.some(item => item.settings),
    lenses: shown.flatMap(item => (item.face === undefined ? [] : [item.face])),
    left: { settings: left.some(item => item.settings), lenses: left.flatMap(item => (item.face === undefined ? [] : [item.face])) },
  }
}

// The line the Door ends with where the tab row has no room for Settings (and in the small terminal, which has no tab row): one Button that opens it.
function reachSettings(state: RoomState) {
  if (state.app || (state.size === 'wide' && !tabPlanOf(state).left.settings)) return []
  const { ui, actions } = state
  const { Button } = ui
  return [<Button key="settings-door" label="Settings" onPress={() => void actions.open({ view: 'settings' })} />]
}

// The Lens line of the terminal's Settings, where the tab row has no room for a lens (and in the small terminal, which has no tab row): the lenses
// left out, each a Button that sets it. The lens the head shows stays lit there too.
function reachLenses(state: RoomState) {
  if (state.app) return []
  const lenses = state.size === 'wide' ? tabPlanOf(state).left.lenses : lensesOf(settingsOf(state))
  if (lenses.length === 0) return []
  const { ui, face, actions } = state
  const { Box, Text, Button } = ui
  return [
    <Box key="settings-lens-line" flexDirection="row" flexWrap="wrap" columnGap={1}>
      <Text key="settings-lens-word" color={LOOK.quiet}>
        Lens
      </Text>
      {lenses.map(name => (
        <Button
          key={`lens-${name}`}
          label={name}
          variant={face === name ? 'primary' : 'secondary'}
          dimColor={face !== name}
          onPress={() => {
            void actions.setFace(name)
          }}
        />
      ))}
    </Box>,
  ]
}

// The wide terminal's tab row, the same on every place: Desk N, Shelf and Door, the open one primary and the others dim as the lens tabs mark
// theirs; after them, dim, Settings and the lens tabs the head had, as many as the row holds (tabPlanOf).
function terminalTabs(state: RoomState) {
  const { ui, face, nav, seat = '', actions } = state
  const { Box, Button } = ui
  const lit = tabOf(nav)
  const waiting = deskCountOf(state)
  const plan = tabPlanOf(state)
  const tabs: { place: KeyPlace; key: string; label: string }[] = [
    { place: 'desk', key: 'desk', label: waiting > 0 ? `Desk ${waiting}` : 'Desk' },
    { place: 'shelf', key: 'shelf', label: 'Shelf' },
    { place: 'door', key: 'room', label: 'Door' },
  ]
  return (
    <Box key="head-faces" flexDirection="row" columnGap={TAB_GAP}>
      {plan.back !== undefined && (
        <Button
          key="back-room"
          label={plan.back}
          variant="secondary"
          hotkey={BACK_KEY}
          onPress={() => {
            void terminalBackOf(state).press()
          }}
        />
      )}
      {tabs.map(tab => (
        <Button
          key={tab.key}
          label={tab.label}
          variant={lit === tab.place ? 'primary' : 'secondary'}
          dimColor={lit !== tab.place}
          onPress={() => {
            void actions.open(placeNavOf(tab.place))
          }}
        />
      ))}
      {plan.settings && (
        <Button
          key="settings"
          label="Settings"
          variant="secondary"
          dimColor
          onPress={() => {
            void actions.open({ view: 'settings' })
          }}
        />
      )}
      {plan.lenses.map(name => (
        <Button
          key={`face-${name}`}
          label={name}
          variant={face === name && lit === undefined ? 'primary' : 'secondary'}
          dimColor={face !== name || lit !== undefined}
          onPress={() => {
            void actions.setFace(name)
          }}
        />
      ))}
    </Box>
  )
}

// THE PANE IN THE TERMINAL, the parts round the place (order terminal step 1). Small: the key line d desk, o door, s shelf under the bar, with b back
// at its end while a place is open, which returns to the bar and the keys alone; `bare` says the place is none. Wide: the tab row over the place and
// the status line under it. `top`, `back` and `foot` are the elements over the place, over it again and under it (`back` stays empty: Back is in the
// key line and in the tab row).
function terminalFrame(state: RoomState): { top: any[]; back: any[]; foot: any[]; bare: boolean } {
  const { ui, size, nav, seat = '', actions } = state
  if (size === 'wide') return { top: [terminalTabs(state)], back: [], foot: [terminalStatus(state)], bare: false }
  const rest = isRest(nav, seat, state.exists)
  return {
    top: [keyLineView({ ui, onOpen: place => void actions.open(placeNavOf(place)), ...(rest ? {} : { onBack: () => void terminalBackOf(state).press() }), prefix: state.keysSet === true })],
    back: [],
    foot: [],
    bare: rest,
  }
}

// "Back to SEAT": this seat's face, the lens kept (the lens is the pane's, not the nav's).
const goBack = ({ actions }: RoomState) =>
  actions.backToSeat !== undefined ? actions.backToSeat() : actions.open({ view: 'feed', cardId: '', lens: 'news' })

// The step back of an opened row in the app's canvas (order D1; order DP, P2 says its words): the place he CAME from, and the words that
// NAME it, the angle and the place, never `Back`. Another seat's face goes to the Seats (`‹ Seats`), a wait opened from a seat's window to
// that window (`‹ NAME`), a profile to the shelf (`‹ Shelf`), an open card and the Room place to this seat's face (`‹ SEAT`). The root of a
// place (this seat's face, the level up, the shelf, Answered, Settings) has none. None when the nav holds no opened row.
export type Back = { label: string; press: () => void }
const BACK_DESK = '‹ Desk'
const BACK_LETTERS = '‹ Letters'
const BACK_ROOM = '‹ The room'
function backOf(state: RoomState): Back | undefined {
  const { nav, seat = '', actions } = state
  const go = (next: Nav) => () => void actions.open(next)
  if (nav.view === 'seat' && nav.name !== '' && nav.name !== seat) return { label: '‹ Seats', press: () => void actions.openLevel?.() }
  // the desk: its root has the Sort box where another place has its Back (a pile a kind, or a folder a seat); a letter or an item opened from it
  // goes back to the desk, on the pile and the sort it came from. A clear desk (no rows) has nothing to sort: no box.
  if (nav.view === 'desk' && nav.item === undefined) {
    if (deskRowsOf(state).length === 0) return undefined
    const group = nav.group ?? 'kind'
    return { label: `Sort ${group}`, press: () => void actions.open({ view: 'desk', group: group === 'kind' ? 'seat' : 'kind' }) }
  }
  if (nav.view === 'desk' || (nav.view === 'wait' && nav.from === FROM_DESK)) {
    return { label: BACK_DESK, press: () => void actions.open({ view: 'desk', ...(nav.pile === undefined ? {} : { pile: nav.pile }), ...(nav.group === undefined ? {} : { group: nav.group }) }) }
  }
  // a wait opened from a seat's window goes back to that window; the composer's target comes back with the step
  if (nav.view === 'wait') return { label: `‹ ${nav.from}`, press: () => void actions.openSeat?.(nav.from) }
  // a card of his goes back to Letters, the list on the page it stood
  if (nav.view === 'yours') return { label: BACK_LETTERS, press: () => void actions.backToSeat?.() }
  // the window of a game of Ur goes back to the place it was opened from, by that place's name: Letters, or the open card (the Operator
  // lens, where the card opens)
  if (nav.view === 'ur') {
    const cardId = nav.cardId
    return nav.from === 'letters'
      ? { label: BACK_LETTERS, press: () => void actions.backToSeat?.() }
      : { label: '‹ Card', press: go({ view: 'feed', cardId, lens: nav.lens ?? 'walk' }) }
  }
  // a record goes back to the shelf it was opened from: the room's (`‹ Shelf`, the strip's word) or a seat's, named by it
  if (nav.view === 'profile') {
    const of = nav.of ?? ''
    return { label: of === '' ? '‹ Shelf' : `‹ ${of} shelf`, press: go({ view: 'shelf', by: 'kind', ...(of === '' ? {} : { of }) }) }
  }
  // a card of the room goes back to where he came from: the seat that opened it, else the room card
  if (nav.view === 'room' && nav.card !== undefined) {
    const from = nav.from
    if (from === undefined) return { label: BACK_ROOM, press: go({ view: 'room' }) }
    return { label: `‹ ${from}`, press: () => void (from === THIS_SEAT ? goBack(state) : actions.openSeat?.(from)) }
  }
  // Seats, the Shelf and Versions opened from the room card go back to it
  const cameFromRoom = state.came?.view === 'room' && state.came.card === undefined
  if (cameFromRoom && (nav.view === 'level' || nav.view === 'shelf' || (nav.view === 'settings' && nav.section === 'versions'))) return { label: BACK_ROOM, press: go({ view: 'room' }) }
  // a section of Settings goes back to the list of its sections
  if (nav.view === 'settings' && nav.section !== undefined) return { label: '‹ Settings', press: go({ view: 'settings' }) }
  if ((nav.view === 'feed' && nav.cardId !== '') || nav.view === 'room') return { label: `‹ ${seat === '' ? 'this seat' : seat}`, press: () => void goBack(state) }
  return undefined
}

// The list an opened row came from (order D1, still A2), as a nav: another seat's face came from the Seats place (the level up), a
// profile from the shelf. None for a row with no list (an open card, the Room place) and for a root of a place. Only the Public lens
// has seat faces, so another seat under Operator or Trace is no row.
export function listOf(nav: Nav, seat: string, face: Face): Nav | undefined {
  if (nav.view === 'seat' && nav.name !== '' && nav.name !== seat && face === 'public') return { view: 'level' }
  // an item or a letter opened from the desk stands in the right column, the desk at the left on the pile it came from
  if (nav.view === 'desk' && nav.item !== undefined) return { view: 'desk', ...(nav.pile === undefined ? {} : { pile: nav.pile }), ...(nav.group === undefined ? {} : { group: nav.group }) }
  if (nav.view === 'wait' && nav.from === FROM_DESK) return { view: 'desk', ...(nav.pile === undefined ? {} : { pile: nav.pile }), ...(nav.group === undefined ? {} : { group: nav.group }) }
  // a wait opened from a seat's window stands in the right column, the Seats place at the left (a wait is a window of its own)
  if (nav.view === 'wait') return { view: 'level' }
  // a card of his stands at the right of the Letters list, which stays at the left
  if (nav.view === 'yours') return { view: 'seat', name: '' }
  // the game opened from Letters stands at the right of the Letters list; from a card it stands alone
  if (nav.view === 'ur' && nav.from === 'letters') return { view: 'seat', name: '' }
  if (nav.view === 'profile') return { view: 'shelf', by: 'kind', ...(nav.of === undefined || nav.of === '' ? {} : { of: nav.of }) }
  // a card of the room (the door, the discs) stands at the right of the room card, unless a seat opened it
  if (nav.view === 'room' && nav.card !== undefined && nav.from === undefined) return { view: 'room' }
  // a section of Settings stands at the right of the list of the sections
  if (nav.view === 'settings' && nav.section !== undefined) return { view: 'settings' }
  return undefined
}

// The title of a window: the desk's own words (its place, the word of the origin of an item opened from it, a letter), else the strip's.
function titleOf(state: RoomState, nav: Nav): string {
  if (nav.view === 'desk') {
    const item = nav.item === undefined ? undefined : state.deskCard?.items.find(one => one.id === nav.item && !one.done)
    return item === undefined ? 'Desk' : itemTitleOf(item)
  }
  if (nav.view === 'wait' && nav.from === FROM_DESK) return 'Letter'
  return stripTitleOf(nav, state.seat ?? '', state.face)
}

// The canvas of the app (order D1, still A2): at rest no window. Under 128 columns one column of the layout's width, and an opened
// row takes its list's place with `‹ Back` on top. From 128 two columns: the list stands at the left and its open row at the right,
// `‹ Back` on top of the row, and a press on another row of the list swaps the right column, never a third. What the pane has to say
// whatever stands open (a room not found, a thing that did not answer in its time, a lens that threw) stands first, on a block of
// the theme's ground, so the words never lie on the picture alone. `list` is the body of the list the open row came from, drawn by
// the pane only when the plan has two columns.
function canvasView(state: RoomState, body: any[], failure: any, list?: any[]) {
  const { ui, exists, lateWord = '', windowOpen = true, plan, nav, seat = '', face } = state
  const { Box, Text } = ui
  const back = windowOpen ? backOf(state) : undefined
  const said = [
    ...(windowOpen ? [] : noRoomView(state)),
    ...(state.starterFirst === true ? [] : starterView(state)),
    ...(lateWord === '' || !exists
      ? []
      : [
          <Box key="late" alignSelf="flex-start" paddingX={SPACE.control} backgroundColor={THEME.ground}>
            <Text color={THEME.warn}>{lateShown(state)}</Text>
          </Box>,
        ]),
    failure,
  ]
  const shown = windowOpen ? body : []
  // EVERY card and window holds a strip of 3 rows (views/strip.tsx, order DP, P2): Back at the left where it is a row one step deep, the
  // title, Close at the right. From 128 columns the list stands at the left and its open row at the right, each card its own strip: the
  // left Close shuts the place, the right Close shuts the right card alone (the list stays), and the right card holds no Back, for the
  // place it came from is in view.
  const paired = windowOpen && list !== undefined && plan.cols === 2
  if (!windowOpen && !said.some(item => item !== null)) return null
  const close = (id: string, press: () => void | Promise<void>, key?: string) => ({ id, press, ...(key === undefined ? {} : hotkeyProps(key)) })
  const shut = () => void state.actions.shut?.()
  const strip = (id: string, title: string, parts: { back?: Back; close: ReturnType<typeof close> }) =>
    stripView({
      ui,
      id,
      width: plan.width,
      columns: state.columns,
      title,
      ...(parts.back === undefined ? {} : { back: { label: parts.back.label, press: parts.back.press, ...hotkeyProps(BACK_KEY) } }),
      close: parts.close,
    })
  const bodyOf = (kids: any[]) => (
    <Box key={`face-body-${state.face}`} flexDirection="column" gap={SPACE.block}>
      {kids}
    </Box>
  )
  // the list the open row came from, as a nav (only where the plan has two columns)
  const listNav = paired ? listOf(nav, seat, face) : undefined
  return (
    <Box key="canvas" position="absolute" top={CANVAS_TOP} left={EDGE} width={canvasWidthOf(plan)} flexDirection="column" gap={SPACE.block}>
      {said}
      {!windowOpen ? null : paired && listNav !== undefined ? (
        <Box key="canvas-columns" flexDirection="row" alignItems="flex-start" columnGap={SPACE.group}>
          <Box key="canvas-list" width={plan.width} flexDirection="column">
            {strip('top-strip-list', titleOf(state, listNav), { close: close(CLOSE_PLACE, shut, CLOSE_KEY) })}
            <Box key="list-body" flexDirection="column" gap={SPACE.block}>
              {list}
            </Box>
          </Box>
          <Box key="canvas-row" width={plan.width} flexDirection="column">
            {strip('top-strip-card', titleOf(state, nav), { close: close(CLOSE_CARD, () => void state.actions.open(listNav)) })}
            {bodyOf(shown)}
          </Box>
        </Box>
      ) : (
        <Box key="canvas-card" flexDirection="column">
          {strip('top-strip', titleOf(state, nav), { ...(back === undefined ? {} : { back }), close: close(CLOSE_PLACE, shut, CLOSE_KEY) })}
          {bodyOf(shown)}
        </Box>
      )}
    </Box>
  )
}

// What waits on him in the terminal's status line, counted as the desk counts it (deskCountOf): "nothing waits on you" or "N waits on you"; on the
// level up the seats' waits first, "T waiting, N on you".
function deskWaitsLine(state: RoomState, isLevel: boolean): string {
  const mine = deskCountOf(state)
  const total = isLevel ? level({ walks: state.walks, seatsText: state.seatsText ?? '', seat: state.seat ?? '', now: state.now, zone: state.zone, entries: state.entries }).total : 0
  if (total > 0) return `${total} waiting, ${mine} on you`
  return waitsOnYouWords(mine)
}

// The words of Desk N: the status line under the terminal's place and the band over the prompt say the count so.
export const waitsOnYouWords = (mine: number): string => (mine === 0 ? 'nothing waits on you' : `${mine} waits on you`)

// The words of the status line (order A-S1): the door, then what waits on him in the Public lens ("nothing waits on
// you", "N waits on you" of this seat, and on the level up "T waiting, N on you"), else the cards and the cost, as
// the Operator status line has always said them. Its dollars are the cost of the cards it counts, so it says "on these cards":
// the Room place's "Today" is the door's own day and is a different number. Under Operator the line beside it (terminalStatus) says the
// cards, the faults and the cost, so here are the door's words alone.
function statusWords(state: RoomState): string[] {
  const { cards, total, doorWord = '', lateWord = '', needWord = '', face, nav, walks, seatsText = '', seat = '', now, zone } = state
  // The terminal's count is the desk's own (Desk N in its tabs): the letters, the keeper's picks and his open items; on the level up the seats' waits stand with it.
  if (face === 'public' && !state.app) return [lateWord, needWord, doorWord, deskWaitsLine(state, nav.view === 'level')].filter(part => part !== '')
  if (face === 'public') return [lateWord, needWord, doorWord, waitsLine({ walks, seatsText, seat, now, zone }, nav.view === 'level')].filter(part => part !== '')
  if (face === 'operator' && !state.app) return [lateWord, needWord, doorWord].filter(part => part !== '')
  return [lateWord, needWord, doorWord, countOf(total, 'card'), `$${costOf(cards).toFixed(2)} on these cards`].filter(part => part !== '')
}

// The composer with its Select on the target "A rule" (the shelf's "Add a rule ›"): the Input sends his words to
// the register's sendRule, and the Select leaving "A rule" for the room closes it. It is the pane's own: the bar of
// captureView has the targets of the room and the card alone. In the terminal the bar says it in one quiet line and
// holds a Button that closes it.
function ruleBar(state: RoomState) {
  const { ui, app, actions } = state
  const { Box, Text, Button, Input } = ui
  const send = (words: string) => {
    void actions.sendRule?.(words)
  }
  if (!app) {
    return [
      <Box key="capture-bar" flexDirection="column" {...LOOK.bar} height={BAR_HEIGHT}>
        <Box key="capture-target-rule" flexDirection="row" columnGap={1}>
          <Text color={LOOK.quiet}>a rule for the keeper</Text>
          <Button
            key="rule-cancel"
            label="cancel"
            onPress={() => {
              void actions.cancelRule?.()
            }}
          />
        </Box>
        <Input key="say" label="Add a rule" placeholder="write a rule for the keeper" value="" submitLabel="↑" onSubmit={send} />
      </Box>,
    ]
  }
  // The app has no composer (order D2, still F1): the rule's Input stands as a card of the canvas, under the shelf, until its own
  // window (still F2). It is the plan's card, the Input alone.
  return [
    <Box key="rule-card" {...cardProps(state.plan.width, state.columns)}>
      <Input key="say" label="Add a rule" placeholder="Write a rule for the keeper" value="" submitLabel="send" onSubmit={send} />
    </Box>,
  ]
}

// The Pane. On the desktop app, VS Code and mobile it is a place: the scene as an Svg that fills the pane, by
// the hour, with a letter on the sill while an ask waits and the window dark with the door down, and over it
// one absolute column of 56 cells: the head, the shown face, the composer and the status line. In the terminal
// (no Svg, no absolute Box) it is a column in the theme's keys, in one of two layouts (terminalSize of views/frame.tsx), and it pages as the app
// does: nothing scrolls. Small: the capture bar and one key line, d desk, o door, s shelf, the place a key opens under them with its Back. Wide:
// the capture bar, the tab row (Desk N, Shelf, Door, then Settings and the lens tabs, dim), the place, and one quiet status line: a dot lit
// while a door runs, the path, the door, what waits, the cards and the cost. The pane's own settings (its file in the
// run folder) drive it: the scene off leaves no Svg, the hour held is the hour of the scene, a lens hidden has no
// tab, and the plate says the time and the date over the scene. Settings is a place of its own: the cards of the
// settings under the head, the scene behind, and no composer.
export function paneView(props: PlaceProps) {
  const { surface, bodyColumns = 80, rows = 30, now, zone, isDoorUp = false, target, entries, actions } = props
  const { Box, Svg } = props.ui as Ui & { Svg?: any }
  const app = isApp(surface) && Svg !== undefined
  // The terminal's kit is marked, so every fit counts a Button as the terminal's host draws it (views/cells.ts); the app's is not.
  const ui = app ? props.ui : asTerminal(props.ui)
  const settings = props.settings ?? DEFAULTS
  const face = shownLens(props.face, settings)
  // His desk is the Public lens's place: under Operator or Trace the first place of the dock shows that lens's own face (the card rows, the motion),
  // as Letters showed it, so each lens stays one press away.
  const nav: Nav = props.nav.view === 'desk' && face !== 'public' ? { view: 'seat', name: '' } : props.nav
  // Operator with Shows: Gates and questions draws the quiet feed: the cards where an ask first shows, and the card
  // the nav names. The open card the bar speaks to is one of them, else none.
  const cards =
    face === 'operator' && settings.shows === 'gates' ? quietOf(props.cards, nav.view === 'feed' ? nav.cardId : '') : props.cards
  const current = cards.find(card => card.id === props.current?.id)
  // How many of the cards read the filter left out: the same list, less the one it kept, counted here and nowhere else. The
  // open card the filter keeps is kept, so it is no part of the count; a card of the walk's cache is never counted.
  const hidden = props.cards.length - cards.length
  // This call is one draw. The scene's element is made before the faces, so the foot of the Operator lens says its count.
  const at = props.drawnAt ?? now
  noteDraw(at)
  // The canvas's layout by the pane's columns, and the wallpaper at the pane's whole size (sceneSize), so it meets the pane's foot.
  const plan = layout(bodyColumns)
  const hour = settings.hour === 'clock' ? hourOf(now, zone) : settings.hour
  // The waits that ask HIM: this seat's own, not any ask of the room. The letter lies on the sill while one stands.
  const mine = seatFace({ walks: props.walks, seatsText: props.seatsText ?? '', seat: props.seat ?? '', now, zone }).waits.length
  const { width, height } = sceneSize(bodyColumns, Math.max(LEAST_ROWS, rows))
  const scene =
    app && settings.scene
      ? sceneElement({ Svg, hour, waiting: mine > 0, doorUp: isDoorUp, width, height, windowStands: plan.window, at, own: props.background?.drawn ? props.background.text : undefined })
      : undefined
  const state: RoomState = {
    ...props,
    ui,
    nav,
    cards,
    current,
    hidden,
    face,
    settings,
    lens: nav.view === 'feed' ? nav.lens : 'news',
    app,
    // The width the cards draw to: the canvas's column in an app (the layout's, no fixed 56), the whole body in the terminal.
    layer: app ? plan.width : bodyColumns,
    plan,
    columns: bodyColumns,
    // The Letters body of this seat's own face carries the door line as its first block (order MR, R4): the pages after the first have the canvas whole.
    starterFirst: app && props.windowOpen !== false && props.exists === true && nav.view === 'seat' && !pagesItself(nav, props.seat ?? '', false),
    ...(app ? {} : { size: terminalSize(bodyColumns, props.rows) }),
    ...(props.countDraws === true ? { drawn: drawnNow() } : {}),
  }
  // Public is the seat face: the bar says to the room there, and answers no card of the feed.
  const barCard = face === 'public' ? undefined : current
  // The terminal holds the capture bar over its place, the Room place (the Door tab) too, so the tab row and the key line stand at the same row
  // on every place; the terminal's Settings has none. The app has NO composer (order D2, still F1): his words go in the session's chat box. A
  // rule's Input stands in the canvas, after the face's body.
  const hasBar = !app && nav.view !== 'settings'
  const adding = state.adding === true && actions.sendRule !== undefined
  // Nudge (order nudge pane): the toggle at the right of the bar's top line, for a pane with a seat and a road to the verb.
  const nudgeCard = state.nudgeCard
  const nudgeBar = actions.nudge !== undefined && nudgeShown(nudgeCard) ? { card: nudgeCard, press: () => void actions.nudge?.() } : undefined
  const bar = !hasBar
    ? []
    : adding
        ? ruleBar(state)
        : captureView({
          ui,
          nav: bodyNavOf(nav),
          card: barCard,
          // an ask of a card the harness sent waits on nobody in the lenses of Public and Trace: the bar answers none
          asks: barCard === undefined || !waitsOnHim(barCard.walk.source, face) ? [] : openAsks(barCard.raw),
          target,
          entries,
          surface: surfaceOf(state),
          seatTo: state.seatTo,
          keeper: chatCardOf(nav, props.walks, state.feed),
          actions,
          columns: bodyColumns,
          ...(nudgeBar === undefined ? {} : { nudge: nudgeBar }),
        })
  const ruleCard = app && adding ? ruleBar(state) : []
  const { Text } = ui
  const failure =
    props.failure === undefined || props.failure === '' ? null : app ? (
      <Box key="failure-ground" alignSelf="flex-start" paddingX={SPACE.control} backgroundColor={THEME.ground}>
        <Text key="failure" color={THEME.dim}>
          {props.failure}
        </Text>
      </Box>
    ) : (
      <Text key="failure" color={LOOK.quiet}>
        {props.failure}
      </Text>
    )
  // THE TERMINAL'S FRAME (order terminal step 1): the parts that stand round the place are made first, so the rows they take are known and the
  // place is paged to what is left (state.termRoom). Small: the bar, the key line, and the place with its Back when one is open. Wide: the bar,
  // the tabs, the place, the status line.
  const frame = app ? undefined : terminalFrame(state)
  if (frame !== undefined && props.rows !== undefined) {
    const names = namesOf(ui as any)
    const rowsOf = (parts: any[]): number => parts.reduce((sum: number, part) => sum + sizeOf(part, bodyColumns, names).h, 0)
    // A BODY TOO SHORT FOR THE BAR (order mend terminal real, mend 6): when the rows the host gave are fewer than the bar and the key line need, the pane
    // draws the key line alone, one row, so a key still opens a place when the dock is opened bigger. (The bar holds its own rows, BAR_HEIGHT.)
    if (state.size === 'small' && props.rows < rowsOf([...bar, ...frame.top])) return <Box flexDirection="column">{frame.top}</Box>
    state.termRoom = Math.max(1, props.rows - rowsOf([...bar, ...frame.top, failure, ...starterView(state), ...frame.back, ...frame.foot]))
  }
  // NOTHING SCROLLS: a body longer than the canvas is paged by the block, or by the parts of its one card (views/paged.tsx). The places
  // that page themselves (the Seats place, a seat's window, Answered, a letter of the desk and its walk) fit their rows already. The terminal
  // pages the same way, to the rows the frame leaves, in the one column of its columns.
  const paged = (body: any[], at: Nav, scope: string) => {
    if (!app && state.termRoom === undefined) return body
    const room = app ? (state.starterFirst === true ? canvasRowsPlain(state) : canvasRowsNow(state)) - LINK_ROWS : (state.termRoom as number)
    const framed: Plan = app ? plan : { ...plan, width: bodyColumns }
    // A letter of the desk with its tabs pages its own words or rows inside its card (publicView), under its head, which stays.
    const ownTabs = at.view === 'wait' && at.from === FROM_DESK && actions.letterTab !== undefined && shapeOfNav({ nav: at, feed: state.feed }) === undefined
    const placed = ownTabs || pagesItself(at, props.seat ?? '', state.versionsCard?.table !== undefined && state.versionsCard.older !== true)
      ? body
      : pagedBody({ ui, plan: framed, columns: bodyColumns, rows: room, pages: state.pages, scope, onPage: (list, page) => void actions.page?.(list, page) }, body)
    // THE FIT (order FIT): a page that still passes the canvas gives its fixed parts way, else it is the one line (views/paged.tsx). The terminal
    // has no floor of FIT_LEAST rows: its rows are the host's own.
    if (state.rows === undefined) return placed
    const fitted = fitBody({ ui, plan: framed, columns: bodyColumns, rows: app ? room : room + Math.max(0, FIT_LEAST - state.rows), paneRows: state.rows }, placed)
    // THE TERMINAL NEVER SAYS "needs N rows" while a page can hold a part (order mend terminal real, mend 4): the body is cut into its parts and paged
    // under one row of links (views/termpage.tsx); the line stays only where not even one part stands with the links.
    if (app || fitted.length !== 1 || (fitted[0]?.key ?? fitted[0]?.props?.key) !== 'fit-line') return fitted
    // ONE PAGER ON A PAGE (order chat pager): a letter with his chat that the terminal pages hands the thread's rows to this pager, which opens on the thread's
    // last page; the thread's own pager draws only where the letter is one page (it fitted above).
    const whole = ownTabs && state.chatWhole !== true && body.some(holdsThread) ? FACE_VIEWS[faceOf(at)]({ ...state, chatWhole: true }) : body
    return terminalPaged({ ui, columns: bodyColumns, room, pages: state.pages, onPage: (list, page) => void actions.page?.(list, page) }, whole) ?? fitted
  }
  const faceBody = app && props.windowOpen === false ? [] : frame?.bare === true ? [] : paged(FACE_VIEWS[faceOf(nav)](state), nav, '')
  // From 128 columns an opened row stands at the right of its list (listOf): the list is drawn by the same face views, on its own nav.
  const listNav = app && props.windowOpen !== false && plan.cols === 2 ? listOf(nav, props.seat ?? '', face) : undefined
  const listBody = listNav === undefined ? undefined : paged(FACE_VIEWS[faceOf(listNav)]({ ...state, nav: listNav, opened: nav }), listNav, 'list-')
  if (frame !== undefined) {
    return (
      <Box flexDirection="column">
        {bar}
        {frame.top}
        {failure}
        {starterView(state)}
        {frame.back}
        {faceBody}
        {frame.foot}
      </Box>
    )
  }
  // The app's place (order D1): the wallpaper over the whole pane, the floating bar, the canvas (no window at rest), and the dock
  // with its composer. The pane is as high as the wallpaper, whether the wallpaper is drawn or not.
  const open = props.windowOpen === false ? '' : dockPlaceOf(nav, props.seat ?? '')
  const room = (props.roomName ?? '') === '' || props.roomName === WORLD_WORD ? ROOM_WORD : (props.roomName as string)
  // Where the room's own drawing is the wall the hour moves nothing of it, so the bar and the dock keep the one calm color, not the hour's.
  const tones = placeTones(state)
  const seatsWaiting = level({ walks: props.walks, seatsText: props.seatsText ?? '', seat: props.seat ?? '', now, zone, entries }).waiting
  // What waits on him, the letters and his open items: the tray says it, and the Desk of the dock counts it.
  const waiting = deskCountOf(state)
  // The records new on the shelf since he last opened it (order T4a): the dock's Shelf says it quietly; none before the first read seeded the time.
  const fresh = freshCount({ walks: props.walks, entries, rulesText: props.rulesText ?? '', now, zone }, props.shelfSeen)
  // A press on the open place shuts its window; on any other it opens that place (the register's message of a region does the same).
  const pressed = dockPress(actions, open, nav.view === 'desk' || (nav.view === 'wait' && nav.from === FROM_DESK))
  return (
    // The layers are the kit's: an absolute Box is painted over the Boxes before it, so the wallpaper, the canvas, the bar and the dock stand absolute in
    // that order, in the place's one height: the pane's rows, never more (order P1: nothing scrolls).
    <Box key="place" flexDirection="column" position="relative" width={bodyColumns} height={Math.max(LEAST_ROWS, rows)}>
      {scene}
      {canvasView(state, [...faceBody, ...ruleCard], failure, listBody)}
      {barView({
        ui,
        columns: bodyColumns,
        tones,
        room,
        // No room, no seat: the folder's name is not a seat's, so the bar names none.
        seat: props.exists ? props.seat ?? '' : '',
        // The date and the time stand in the bar always: the plate's corner of the settings is gone from the app's place.
        date: dateText(now, zone),
        time: clockText(now, zone),
        lens: face === 'public' ? '' : cap(face),
        wait: waiting,
        doorUp: isDoorUp,
        doorWords: props.doorWord ?? '',
      })}
      {dockView({ ui, columns: bodyColumns, tones, open, desk: waiting, seats: seatsWaiting, fresh, actions: { open: pressed } })}
    </Box>
  )
}

// The terminal's status line: the quiet words, as the band says the door.
function placeStatusTerminal(state: RoomState) {
  const { Text } = state.ui
  const status = statusWords(state)
  return status.length > 0 ? <Text color={LOOK.quiet}>{status.join(' · ')}</Text> : null
}
