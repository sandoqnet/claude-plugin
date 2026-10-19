// The props of every view: the contract the views are built on. A view never takes `$`: it gets its data
// and its actions by props alone, and register.tsx makes the actions. A view is a function of its
// props that returns elements (a view of a part returns an array of them, to sit among the children
// of the view that holds it); the kit it draws with comes in `ui`.
import type { DeskCard, Group as DeskGroup } from '../model/desk.ts'
import type { Expanded, MoreWhat } from '../model/expanded.ts'
import type { Lens } from '../model/feed.ts'
import type { MotionRow, PendingTap } from '../model/motion.ts'
import type { FeedEntry } from '../model/roomfeed.ts'
import type { KeysCard } from '../model/keys.ts'
import type { NudgeCard } from '../model/nudge.ts'
import type { SecretsCard } from '../model/secrets.ts'
import type { SettingKey, Settings } from '../model/settings.ts'
import type { CatalogEntry, Disc } from '../model/shelf.ts'
import type { ShelfFilesRead } from '../model/shelffiles.ts'
import type { SeatShelf } from '../model/shelfreads.ts'
import type { Card, Face, OpenAsk, WalkText } from '../model/walk.ts'
import type { SettingsSection } from './settingslist'
import type { Plan } from './theme'
import type { VersionsCard } from './versions'

// Face, Card, WalkText, Lens, Expanded and MoreWhat live in the model (a model never imports a view); the views
// and the register take them from here.
export type { Expanded, MoreWhat } from '../model/expanded.ts'
export type { Lens } from '../model/feed.ts'
export type { Card, Face, WalkText } from '../model/walk.ts'

// The open view: the feed with one card open in one lens, a profile of one record, the shelf grouped by kind or
// by time, the Settings place, the Room place (under Operator alone), the face of a seat (its name; '' is this seat) or
// the level up, each seat's waits. Under Public they are seatView and levelView (views/seat.tsx); under Operator and
// Trace the feed with no card named.
export type Nav =
  | { view: 'feed'; cardId: string; lens: Lens }
  // `of` is the seat whose shelf the record or the shelf is (order P7, C3); none is the room's own.
  | { view: 'profile'; recordId: string; of?: string }
  | { view: 'shelf'; by: 'kind' | 'time'; of?: string }
  // Settings is a list of its sections in the app; `section` is the one it opened (none for the list).
  | { view: 'settings'; section?: SettingsSection }
  // The room card (order DP, P4): its rows, or one card of it: `door`, or `plays` (the discs stand once, here); `from` is the seat the
  // card was opened from, where its Back goes (none: the room card).
  | { view: 'room'; card?: 'door' | 'plays' | 'feed'; from?: string }
  | { view: 'seat'; name: string }
  | { view: 'level' }
  // Today's answers, the dock's Answered place (an app's; the terminal reaches them by "Answered today N ›").
  | { view: 'answered' }
  // A wait that asks HIM, opened from the window of the seat that asked (order D1, still A2): the same window as under Letters, with
  // its answer; `from` is that seat, where its Back goes.
  // A letter opened from the desk has `from` FROM_DESK (model/desk.ts) and the pile and the sort it came from: its Back is `‹ Desk` on that pile.
  | { view: 'wait'; cardId: string; askId: string; from: string; pile?: string; group?: DeskGroup }
  // A card of HIS opened from Your cards in Letters (order YC, Y2c): the Letters window, `‹ Letters` on top, his words then the answer.
  | { view: 'yours'; cardId: string }
  // The window of a game of Ur (order UR, cut U2), a place of its own: the card handed to ur whose game it plays, and where he came from
  // ('letters' or 'card'), where its Back goes; from a card, `lens` is the lens that card stood open in, which Back returns to (the register
  // fills it from the open card when the press names none).
  | { view: 'ur'; cardId: string; from: 'letters' | 'card'; lens?: Lens }
  // His desk (order DESK): what waits on him, the open asks then the items sandoq lists. The pane opens on it. `pile` is the pile open (the key
  // of model/desk.ts pilesOf; none is ALL), `group` how the piles are made (a pile a kind, or a folder a seat; none is a kind) and `item` the id of
  // the item opened from the list, a step from the desk (a letter opens as a `wait` from FROM_DESK).
  | { view: 'desk'; pile?: string; group?: DeskGroup; item?: string }

// What the last check of the discs gave: its hour (HH:MM) and the state word of each disc by its name. Made only after a check.
export type DiscChecks = { at: string; states: Record<string, string> }

export type Actions = {
  say: (text: string) => void | Promise<void>
  tap: (cardId: string, askId: string, choice: string) => void | Promise<void>
  open: (nav: Nav) => void | Promise<void>
  setLens: (cardId: string, lens: Lens) => void | Promise<void>
  // Shows 8 more of the older cards.
  older: () => void | Promise<void>
  // "Show N more" and "N more ›" of the operator lens: opens the rest of a card's events or every disc, for the
  // card named ('' when none is open); `machine` is the fold of the open card's machine lines, and each press of it opens
  // them or shuts them. The register keeps it in memory and forgets it when the card closes. With none, the lens shows
  // every event, every disc and the machine lines.
  more?: (cardId: string, what: MoreWhat) => void | Promise<void>
  // Today's pane also moves between faces and picks a row of the trace: these two stay until a
  // later step folds them into open and setLens.
  setFace: (face: Face) => void | Promise<void>
  pickRow: (index: number) => void | Promise<void>
  // A line for the reader in a toast, for a typed answer that is no choice. With none, it is not sent.
  notice?: (text: string) => void
  // The bar's other targets: a reply to a card, a say about a record, and the switch between the room
  // and the open card. With none, the bar says to the room alone.
  reply?: (cardId: string, text: string) => void | Promise<void>
  about?: (recordId: string, text: string) => void | Promise<void>
  setTarget?: (target: 'room' | 'card' | 'keeper') => void | Promise<void>
  // His line to the keeper on a desk card (order keeper chat): the card's bare id and his words; `sandoq room run chat GATE .CARD` in a marked room. With none,
  // the bar offers no keeper target.
  chat?: (cardId: string, words: string) => void | Promise<void>
  // The Settings place: a setting changed to a value (it applies at once and is written to the pane's own file),
  // and the last change undone. With none, the place changes nothing.
  changeSetting?: (key: SettingKey, value: Settings[SettingKey]) => void | Promise<void>
  undoSetting?: () => void | Promise<void>
  // The gate's acts (order A-W234), each through the room's own scripts and in a local room alone. His send of a
  // seat's draft as it was (tap.sh with --draft); "Ask me next time" (rule.sh off of the rule a decision names).
  tapDraft?: (cardId: string, askId: string, choice: string, draftId: string) => void | Promise<void>
  ruleOff?: (ruleId: string) => void | Promise<void>
  // A rule opens on the shelf face. "Add a rule ›" opens the composer on the target "A rule"; its send is
  // rule.sh add of his words, and its Select leaving "A rule" closes it.
  openRule?: (ruleId: string) => void | Promise<void>
  addRule?: () => void | Promise<void>
  sendRule?: (words: string) => void | Promise<void>
  cancelRule?: () => void | Promise<void>
  // A decision's row of the shelf opens its card in the Public lens; an item opens its profile; "N more ›" lists
  // the rest of the items.
  openCard?: (cardId: string) => void | Promise<void>
  openItem?: (recordId: string) => void | Promise<void>
  moreItems?: () => void | Promise<void>
  // Files on the shelf (order shelf-files): a file of a seat opens in the room app (`room open NAME file SEAT FILE`), and "N more" of a seat or "N more
  // seats" opens the list there (`... files SEAT`, `... files`). A press stands only where the sandoq has them (SHELF_FILES_FROM of host.ts).
  openFile?: (seat: string, file: string) => void | Promise<void>
  openFiles?: (seat?: string) => void | Promise<void>
  // The head's path (order A-S1): "us" goes one level up, a seat opens its face, and "Back to SEAT" returns to this
  // seat's face, the lens kept.
  openSeat?: (name: string) => void | Promise<void>
  openLevel?: () => void | Promise<void>
  backToSeat?: () => void | Promise<void>
  // The Shut of the seat card of a session that is the seat of a joined room: it does what `/sandoq shut` does.
  shutSeat?: () => void | Promise<void>
  // The seat face's acts (order A-S4), in memory only and forgotten when he leaves the face: "Not now" sets a wait
  // aside (nothing is written to the room), "Answered today N ›" opens today's answers whole and a second press
  // folds them, "N more seats, nothing waits ›" lists the idle seats.
  notNow?: (cardId: string, askId: string) => void | Promise<void>
  // The words he sent under a card said TO this seat (order C3, part A): a say of this seat that answers that card, to the seat that
  // said it ('' for his own voice). With none, the Input of the card says nothing.
  answerSaid?: (cardId: string, by: string, words: string) => void | Promise<void>
  toggleAnswered?: () => void | Promise<void>
  moreSeats?: () => void | Promise<void>
  // The Room place's acts (order A-W6), the acts of views/room.tsx: "Who may do what ›" opens its card of seats (in
  // memory only, forgotten when he leaves the place), "What changes ›" opens the page of an update, "Put it up" starts
  // the door. Its Update and Not now are `tap`, and "N more seats ›" is `moreSeats`.
  openRoomCard?: (card: string) => void | Promise<void>
  openPage?: (page: string) => void | Promise<void>
  putUp?: () => void | Promise<void>
  // "Check now" of the Versions card of Settings: sandoq update and sandoq room update, each with the word --check, never an update.
  checkVersions?: () => void | Promise<void>
  // The Secrets section of Settings (order S2): the section opens in the app and reads the list of names; the terminal's column reads it on the
  // press of "Show the names ›". A press on a name shows the line `sandoq secret set NAME` under it, to copy (a second press hides it). The pane
  // takes no value and runs no set: a secret is set in a terminal or in the sandoq control panel.
  readSecrets?: () => void | Promise<void>
  showSecret?: (name: string) => void | Promise<void>
  // The Keys section of Settings (order keys): "Add them to your keys" writes the missing lines to the Chat block of his keybindings.json. It is
  // his tap alone that calls it; a key bound to another thing is never written over.
  addKeys?: () => void | Promise<void>
  // Nudge (order nudge pane): the bar's toggle turns it on at the picked interval or off; with an interval (the Every of Settings) it sets that one while on and
  // picks it for the next turn on while off.
  nudge?: (every?: string) => void | Promise<void>
  // The app's canvas (order D1): a press on the dock's open place shuts its window, and the pane is at rest again.
  shut?: () => void | Promise<void>
  // A list longer than the canvas turns its page in place (order D1, still A2): the list by its name, the page from 0. The register
  // keeps it in memory and forgets it when the place changes.
  page?: (list: string, page: number) => void | Promise<void>
  // The composer says to a seat (order D1, still A2): "Say to NAME" of a seat's window sets the composer's Select to that seat ('' sets
  // it back to the room), and a send then says `@NAME words` to the room's say, as `/room @NAME words` does. With none, the composer says
  // to the room alone.
  setSeatTo?: (seat: string) => void | Promise<void>
  sayTo?: (seat: string, text: string) => void | Promise<void>
  // The game of Ur (order UR, cuts U1 and U2): what the last read of the game left for the card named, or for the newest card that has a game when
  // the id is '' (the row of Letters), or none when that is not the card whose game was read; and the press of one of HIS choices, which runs
  // tap.sh in the run folder (never the bell) and reads the game again.
  urWindow?: (cardId: string) => UrWindow | undefined
  urTap?: (game: string, ask: string, choice: string) => void | Promise<void>
  // His desk (order DESK): the items are read (`sandoq room desk list --json --all`) when the desk opens, after a Done and on the poll, shown or at
  // rest, never on a timer of its own; Done takes an item that is for him off (`sandoq room desk done ID`, one call, then the read again, a refusal
  // is sandoq's one line under the row); an origin opens by its kind: a card in the feed, a record in its profile, a web page in his browser (the
  // item named by `id` is then said opened), and a page of the run or any other origin opens nothing.
  readDesk?: () => void | Promise<void>
  doneDesk?: (id: string) => void | Promise<void>
  // OK on the keeper's pick (order T3): the pick is off the desk for good, kept in the pane's own file (pane-desk.json beside pane.json), and no
  // call is made to sandoq.
  keeperOk?: (key: string) => void | Promise<void>
  // OK all on the fold of the keeper's picks (order D2): every key off the desk in one write. foldPicks opens the fold's picks in place, or folds them.
  keeperOkAll?: (keys: string[]) => void | Promise<void>
  foldPicks?: () => void
  // A letter opened from the desk has two tabs, Text and Walk (order W2): the tab shown, and a press on a row of the walk, which opens it in place or
  // shuts it (one row is open at a time). The register keeps both in memory and forgets them when the letter closes. With none, the letter has no tabs.
  letterTab?: (tab: 'text' | 'walk') => void
  walkRow?: (key: string) => void
  // The room app (orders O1, O2): "Open in the room app ›" on a letter runs `sandoq room open NAME letter ID`, the card's id; on its Walk tab
  // `... walk ID`, and a press on a row of the walk `... walk ID BLOCK`, the row's id (none for a row with no id). With none, the letter has no press.
  // A page item of the desk (order O3) runs `... page PATH`, the path of its origin.
  openInApp?: (kind: 'letter' | 'walk' | 'page', id: string, block?: string) => void | Promise<void>
  openOrigin?: (origin: string, id?: string) => void | Promise<void>
}

// The game of a card handed to ur as the window reads it: the card's id, the game's id (urGameOf), the text of its walk file as the last read
// left it ('' while none is read), the one line the last tap left ('' for none) and whether a tap runs now.
export type UrWindow = { card: string; game: string; text: string; line: string; busy: boolean }

// The kit a view draws with (the host hands it to the pane as `$.ui.resolve(e)`).
export type Ui = { Box: any; Text: any; Button: any; Input: any; Markdown: any; Select?: any; Svg?: any; Client?: any }

// The Button that makes a room where none stands (order MR, R2), drawn under the no room line: the name the room gets, where it is made
// (the last two parts of the session's folder), whether the call runs, the one line the last call left (whole: the draw cuts it at a word
// and the read tool says it whole), whether that line is the pane's own (drawn in more rows) or sandoq's, whether the Button stands,
// and its press. None where no room may be made from here.
export type Maker = { name: string; where: string; making: boolean; line: string; own: boolean; button: boolean; onMake: () => void }

// The same for the door of a room that stands (order MR, R3): whether the call runs, the one line the last call left (whole), whether that
// line is the pane's own, whether the Button `Start the door` stands, and its press. None while the door goes well and quietly.
export type Starter = { starting: boolean; line: string; own: boolean; button: boolean; onStart: () => void }

export type PaneProps = {
  ui: Ui
  face: Face
  nav: Nav
  // The room was found and its folder read; false shows the line `noRoomText` when set.
  exists: boolean
  noRoomText: string
  maker?: Maker
  starter?: Starter
  // Your cards (order YC, Y2b): the session ids of this folder from room-pane-sessions.json (newest first), the ids of the cards a say of the
  // pane made in this session, and whether the plugin option turned the bridge off (the line of where to write says so).
  yours?: Card[]
  yourIds?: string[]
  saidIds?: string[]
  bridgeOff?: boolean
  // The shown cards, newest first, with the open one among them, and how many cards the gate holds.
  cards: Card[]
  current: Card | undefined
  total: number
  // More cards than the shown ones wait behind "older".
  hasOlder: boolean
  // The time the ages of the cards are read against, in ms.
  now: number
  entries: CatalogEntry[]
  versions: string
  discs: Disc[]
  // The picked row of the trace face and of the trace lens, -1 for none.
  pickedRow: number
  // The record whose profile is open, by its catalog id ('' for none).
  openId: string
  // Every walk of the gate, for the card counts of the turn, the profiles and the shelf.
  walks: WalkText[]
  // The layout files (the pane carries none): the room's own (shelves/room/egress) by file name, then each disc's
  // by its path under unpacked/ (see layersOf); none when the folders are not there.
  roomFiles: Record<string, string>
  // The taps of the person that stand in taps/GATE, which the door has not taken yet.
  taps: PendingTap[]
  // A door runs (the pane's own or one found running): the header's dot is lit. None is not lit.
  isDoorUp?: boolean
  // What the status line under the bar says of the door, as the band does: "door up", "door down", "no door in
  // this room"; none (a room of the world) says nothing of it.
  doorWord?: string
  // The one plain line of a thing that did not answer in its time ("the find of sandoq did not answer in 2 s"); the status line
  // says it first. None when everything answered.
  lateWord?: string
  // The one plain line of a sandoq under the least the pane needs ("This pane needs sandoq 0.4.19 or later: run sandoq update."); the status line
  // says it after the late line. None when the sandoq was not read or is new enough.
  needWord?: string
  // This session is the open seat of a joined room (order session open): the room, the seat, the last row a turn told ('' for none) and the one line of a
  // wake that stopped or a submit that was refused ('' for none). The seat card says it in two lines and a Shut. None when no seat is open.
  seatOpen?: { room: string; seat: string; last: string; note: string }
  // The offset of the clock from UTC, in minutes, the times of the trace face are said in.
  zone: number
  // Where a say goes when the open card has no open ask: the room, a reply to the open card, or (on a letter opened from the desk) the keeper on that card.
  target: 'room' | 'card' | 'keeper'
  // The words he sent to the keeper that the walk does not hold yet, by the card's id (order keeper chat): each is drawn as his line, `Sent.` under it, until the
  // walk holds a line of those words.
  chatSent?: Record<string, string[]>
  // The thread of a letter hands ALL its rows over, with no pager of its own (order chat pager): set by the terminal's pager when it pages the letter, which then
  // pages the thread's rows with the rest and opens on the thread's last page.
  chatWhole?: boolean
  // The pane's own settings, read from its file at each draw; none are the defaults.
  settings?: Settings
  // The plain words of the last change and the setting it changed (the Settings place shows them with Undo).
  lastLine?: string
  lastKey?: SettingKey
  // The pane's own "Settings changed" card: when the last change was made, and the line of each change.
  changed?: { at: number; lines: string[] }
  // The text of rules.md of the room shelf (the words of his rules), and the ids of the rules taken off by "Ask me
  // next time" (kept in memory until the door has written the withdrawal).
  rulesText?: string
  takenOff?: string[]
  // The names of the folders under shelves/ (the room's own and each seat's), and what stands in each seat's: its catalog where one
  // stands, what it was told, and the artist's themes with the one on the wall (order P7, C3). None is the room's shelf alone.
  shelfNames?: string[]
  seatShelves?: Record<string, SeatShelf>
  // The files of the shelf (order shelf-files), as the CLI lists them: the seats with files, and the list of the seats that have one read. None
  // before the first read, which the shelf window open makes.
  shelfFiles?: ShelfFilesRead
  // "Add a rule ›" was pressed: the composer's target is "A rule". The rest of the shelf's items has been opened.
  adding?: boolean
  shelfAll?: boolean
  // This seat's name (the seat whose line of seats.md names the session's folder, else the folder's own name; ''
  // when unknown), and the text of seats.md of the room shelf.
  seat?: string
  seatsText?: string
  // The seat face's memory (see Actions.notNow): the keys of the waits set aside, in order (waitKey of
  // model/seat.ts), whether today's answers stand open, and whether the level up lists every idle seat.
  aside?: string[]
  answeredOpen?: boolean
  allSeats?: boolean
  // The Room place (order A-W6): logs/tick.md and discs.md of the run folder ('' when missing), the text of each file
  // of cache/programs/ by its name, the size on disk of the walks and the shelf (none when the host does not say it), and the
  // card of the place that is open ('seats' or '').
  tickText?: string
  discsText?: string
  programTexts?: Record<string, string>
  bytes?: number
  roomOpen?: string
  // The room's feed (order room-feed, part A): the entries of feed/GATE.md with their answers, oldest first. The feed card of the room card lays them out.
  feed?: FeedEntry[]
  // The keeper's shape asks he tapped (their ids) and whose decided block is not read yet: their Yes and No are held, one tap an ask (step 3 of the terminal pane).
  shapeSent?: string[]
  // The room card (order DP, P4): the last two parts of the session's folder (its Folder row), what the last check of the discs gave
  // (its hour and each disc's state word, none before a check), and the nav the open place was opened from (the room card or none), so
  // a Back says where he CAME from.
  roomWhere?: string
  discChecks?: DiscChecks
  came?: Nav
  // The Versions card of the Settings place: the pane's version, the discs of the room and the state of the check. None draws no card.
  versionsCard?: VersionsCard
  // The Secrets card of the Settings place (order S2): the names sandoq lists and where each is kept, never a value. None draws no card.
  secretsCard?: SecretsCard
  // The Keys card of the Settings place (order keys): what his keybindings.json says of the five keys. None draws no card.
  keysCard?: KeysCard
  // The five keys are set, so the key line of the small terminal shows its prefix, once and dim (order keys).
  keysSet?: boolean
  // The Nudge of the pane's seat (order nudge pane): the bar's toggle and the Nudge section of Settings read it. None draws no toggle.
  nudgeCard?: NudgeCard
  // His desk (order DESK): what the last read of the items gave, drawn by the desk place, and counted by the dock and the tray at rest too.
  deskCard?: DeskCard
  // The keys of the keeper's picks he took off the desk by OK (order T3): a pick of these is no row.
  keeperOk?: string[]
  // The time of the newest record he has seen on the Shelf place (order T4a), in ms; none before the first read of the room has seeded it. A
  // record after it is new on the shelf, and the dock's Shelf says so quietly.
  shelfSeen?: number
  // The app's canvas: whether a window stands open (a place of the dock). At rest none does. With none given a window stands, as
  // the pane drew it before the desktop; the terminal reads none of it.
  windowOpen?: boolean
  // The tab of the open letter (order W2; none is Text) and the key of the row of its walk that is open ('' or none: no row).
  letterTab?: 'text' | 'walk'
  walkOpen?: string
  // The room app (order O1): whether the room's sandoq has the verb `room open` (the press stands only then), and what is said opened in it (`KIND:ID`;
  // for a page `page:PATH`). roomPage (order O3) is the same for the page verb, which has its own release.
  roomApp?: boolean
  roomPage?: boolean
  appOpened?: string
  // The page each list that pages stands on, by the list's name, from 0 (none is the first page).
  pages?: Record<string, number>
  // The seat the composer says to ('' or none: the room), while that seat's window stands open.
  seatTo?: string
  actions: Actions
}

// One card of the feed: its age, its asked line (feed.ts), whether it is the open one, and the lens
// the open one is read in.
export type CardProps = {
  ui: Ui
  face: Face
  card: Card
  age: string
  asked: string
  isOpen: boolean
  lens: Lens
  entries: CatalogEntry[]
  // The versions text, for the rules of the facts line.
  versions: string
  // Every walk of the gate and the room's own layouts, for the turn and the slot of the card.
  walks: WalkText[]
  roomFiles: Record<string, string>
  // The time the ages are said against, the poll's.
  now: number
  pickedRow: number
  // The offset of the clock from UTC, in minutes, the times of the walk panel are said in; none is UTC.
  zone?: number
  // The host's surface: an app (desktop, vscode, mobile) draws the card on glass, anything else the terminal's.
  surface?: string
  actions: Actions
}

export type SlotProps = {
  ui: Ui
  face: Face
  card: Card
  entries: CatalogEntry[]
  // The walks of the run folder, for the line that tells two records of one name apart.
  walks?: WalkText[]
  // The room's and the discs' layout files (see layersOf); none is read yet.
  roomFiles?: Record<string, string>
  // A closed card: the answer cut at 3 lines and a "more" Button that opens the card, no records and no
  // lens switch; a held card draws nothing.
  brief?: boolean
  // The shown lens, and whether this is the open card: the open card draws the lens switch at the foot of
  // its egress box and a border of the accent; the others a quiet border.
  lens?: Lens
  isOpen?: boolean
  // An app surface draws the sentence alone, in the glass colors, for the card on glass to hold.
  surface?: string
  actions: Actions
}

export type TurnProps = {
  ui: Ui
  face: Face
  card: Card
  asks: OpenAsk[]
  // The catalog and the walks, for the line and the card count of each candidate; none gives the kind.
  entries?: CatalogEntry[]
  walks?: WalkText[]
  // The time the ages are said against; none is Date.now().
  now?: number
  actions: Actions
}

export type CaptureProps = {
  ui: Ui
  nav: Nav
  card: Card | undefined
  asks: OpenAsk[]
  // Where a say goes when the open card has no open ask; none is the room.
  target?: 'room' | 'card' | 'keeper'
  // The card of a letter opened from the desk that the bar can chat about (its bare id), '' or none for any other place: the bar then offers the keeper on this
  // card beside the room, and a send to it is `actions.chat`.
  keeper?: string
  // The catalog, for the name of the open profile.
  entries?: CatalogEntry[]
  // The host's surface: an app draws the composer on glass, anything else the terminal's bar.
  surface?: string
  // The seat the words go to ('' or none: the room): the Select reads "To NAME" and a send is `actions.sayTo`. Its other option is the room.
  seatTo?: string
  actions: Actions
}

export type ProfileProps = {
  ui: Ui
  // The host's surface: an app draws the record as one card of the theme (the plan's width, the pane's columns), anything else the
  // terminal's column.
  surface?: string
  plan?: Plan
  columns?: number
  face: Face
  entry: CatalogEntry | undefined
  walks: WalkText[]
  // The catalog, for the names of the connections.
  entries?: CatalogEntry[]
  // The time the ages are said against; none is Date.now().
  now?: number
  actions: Actions
}

export type ShelfProps = {
  ui: Ui
  entries: CatalogEntry[]
  walks: WalkText[]
  by: 'kind' | 'time'
  // The record whose profile is open, by its catalog id ('' for none).
  openId: string
  // The time the ages are said against; none is Date.now().
  now?: number
  actions: Actions
}

// What runs, at the foot of the operator feed.
export type OperatorProps = {
  ui: Ui
  discs: Disc[]
}

// The banner under the header: the warnings of the shown cards, newest first.
export type BannerProps = {
  ui: Ui
  cards: Card[]
}

// The machine line of one card, under its answer. The catalog and the room's layouts name the kind of its
// layout; none names no kind.
export type ChipsProps = {
  ui: Ui
  card: Card
  versions: string
  entries?: CatalogEntry[]
  roomFiles?: Record<string, string>
}

// The head of the walk panel (the operator face): the card's id, when it ended, its chip, its wall. A card that
// is not open has the line alone, with a button that opens it.
export type HeadProps = {
  ui: Ui
  card: Card
  zone: number
  isOpen: boolean
  actions: Actions
}

// The tabs of the walk panel: overview, events, blocks, egress, each with its count, the shown one primary.
export type TabsProps = {
  ui: Ui
  card: Card
  lens: Lens
  entries: CatalogEntry[]
  roomFiles: Record<string, string>
  actions: Actions
}

// The piece table of the open card, under its slot.
export type PieceTableProps = {
  ui: Ui
  card: Card
  entries: CatalogEntry[]
  // The room's and the discs' layout files (see layersOf), none until they are read.
  roomFiles?: Record<string, string>
}

// The motion list of the trace face: one Button a row.
export type MotionProps = {
  ui: Ui
  rows: MotionRow[]
  zone: number
  actions: Actions
}

// The blocks tab and the trace lens: the card's own header and words stand above.
export type TraceProps = {
  ui: Ui
  card: Card
  pickedRow: number
  actions: Actions
}

// The events tab of the walk panel: one row an event of the card.
export type EventsProps = {
  ui: Ui
  card: Card
  zone: number
}

// The block tree of the walk lens and the overview tab. The slot is the egress box under the route; the
// text box and the readings hang under their blocks.
export type TreeProps = {
  ui: Ui
  face: Face
  card: Card
  isOpen: boolean
  entries: CatalogEntry[]
  roomFiles: Record<string, string>
  pickedRow: number
  // What hangs under the root, the objects and the route: the views of the card, drawn where the tree says.
  under: { root: any[]; route: any[]; objects: Record<string, any[]> }
  actions: Actions
}
