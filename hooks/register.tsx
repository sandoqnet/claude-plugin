import type { Register } from 'claude-code'

import {
  BACKGROUND_FILE,
  CHANNEL,
  DISC_NAME,
  NO_ROOM,
  NO_SANDOQ,
  POLL_MS,
  ROOM_APP_FROM,
  ROOM_APP_LIMIT,
  ROOM_PAGE_FROM,
  SEAT_FOLDER_FROM,
  SESSION_OPEN_FROM,
  SHELF_FILES_FROM,
  VERSION,
  bytesOf,
  deskDoneArgv,
  deskListArgv,
  detectMode,
  discsPath,
  doorFromKnock,
  doorKnockArgv,
  doorPyPath,
  doorRunningArgv,
  forgetSandoq,
  listEntries,
  limitOf,
  localNewArgv,
  mayTakeLong,
  inRunArgv,
  noHost,
  openPageArgv,
  openerFault,
  paneNeedsLine,
  programsPath,
  roomAppHas,
  roomAppVersionArgv,
  roomFileArgv,
  roomFilesArgv,
  roomNudgeArgv,
  roomOpenArgv,
  roomOpenWhy,
  roomPagePath,
  roomUpdateArgv,
  roomUpdateCheckArgv,
  secretListArgv,
  updateCheckArgv,
  updatePaneArgv,
  urTapArgv,
  urWalkPath,
  readCached,
  readDiscs,
  readTapFiles,
  readText,
  roomNewArgv,
  roomStartArgv,
  folderSeatShowArgv,
  sandoqFault,
  sandoqIn,
  seatRowsArgv,
  seatSayArgv,
  seatWakeArgv,
  has,
  fileText,
  keptPath,
  parseOwnCard,
  settingsPath,
  writeText,
  backgroundPath,
  barCardArgv,
  chatArgv,
  localAboutArgv,
  localFeedArgv,
  localReplyArgv,
  localRuleAddArgv,
  localRuleOffArgv,
  localTapDraftArgv,
  rulesPath,
  sayArgv,
  seatNameOf,
  seatsPath,
  seatShelfPath,
  sessionsPath,
  shelfListArgv,
  shelfPath,
  shelfSeatsArgv,
  shelvesPath,
  startArgv,
  takeFaults,
  tapArgv,
  themesPath,
  tickPath,
  worldNudgeArgv,
  worldPostArgv,
} from './host'
import { bareIdFrom, cardIdFrom, feedWord, foldersUp, isBridgeOff, relativeTo } from './bridge'
import type { Env } from './bridge'
import type { FileCache, FileEntry, Host, Io, OwnCard, RoomKind } from './host'
import { labWordsOf } from './labwords'
import type { LabWords } from './labwords'
import { midEdit } from './midsay'
import { BACKGROUND_MOST, backgroundKey, backgroundLine, backgroundOf, bytesOfText, keptFor } from './model/background'
import type { Background, KeptBackground } from './model/background'
import { TOAST_COLS, bellLine, fit, freshRings, keeperRing } from './model/bell'
import type { Ring } from './model/bell'
import { preview, stripUlid } from './model/blocks'
import { CHAT_NO_CARD, CHAT_USAGE, chatCommandOf, chatLongWords, chatTooLong, chatWords, keptTap } from './model/chat'
import { DESK_PILE, FROM_DESK, isDeskId, noDeskVerb, originOf, parseDeskList } from './model/desk'
import type { DeskCard, DeskItem } from './model/desk'
import { leaveCard, openMore, toggleMore } from './model/expanded'
import type { ExpandedByCard } from './model/expanded'
import { openCardId } from './model/feed'
import { gatesOf } from './model/gate'
import { FOLD_FROM, keeperRows, keptText, parseKept, withOk } from './model/keeperrow'
import { drawnNow, failedNow, firstLine, noteFailure, resetDrawn } from './model/draws'
import { ACTIONS, PLACES, THEMES, TOOL, isAction, isIn, kitThemeOf, noAction, noValue, themeWords, widthOf } from './model/driven'
import type { KitTheme, ThemeAsk } from './model/driven'
import { discNamesOf, roomDiscNamesOf } from './model/layouts'
import { clockText, keeperPicks, pendingTaps } from './model/motion'
import type { PendingTap } from './model/motion'
import { pagesKept } from './model/pages'
import { PAGE_MOST, PAGE_NO_FOLDER, PAGE_OTHER, PAGE_TOO_BIG, pageEmpty, pageFailed, pageKindOf, pageLine, pageMedia, pageMissing, pagePathOf } from './model/page'
import type { PageRead } from './model/page'
import { addKeys, keyLineSet, readKeys } from './model/keys'
import type { KeysCard, KeysRead } from './model/keys'
import { NUDGE_EVERY, NUDGE_FIRST, nudgeShown, nudgeWhy, parseNudge } from './model/nudge'
import type { NudgeCard, NudgeRead } from './model/nudge'
import { lastLineOf, parseSecretList } from './model/secrets'
import type { SecretRow, SecretsCard } from './model/secrets'
import { freshFeed, parseFeed, shapeAsks, whereWords } from './model/roomfeed'
import type { FeedEntry } from './model/roomfeed'
import { discsOf, doorOf, programsOf, sizeOf } from './model/roomplace'
import { DOOR_NOT_READ, DOOR_REFUSED, DOOR_UNKNOWN, ROOM_NOT_READ, ROOM_REFUSED, ROOM_TOO_OLD, ROOM_UNKNOWN, roomNameOf, roomStartOf, whereOf } from './model/roomstart'
import { seatFace, waitKey, waitsOnHim } from './model/seat'
import {
  NEEDS_SEAT,
  NONE_OPEN,
  OPEN_USAGE,
  RE_REFUSED,
  SEATED_BY_SANDOQ,
  SEAT_WORD,
  WAIT_LINE,
  badRowLine,
  kitHolds,
  lastSeq,
  openLine,
  openToast,
  otherOpenLine,
  parseRows,
  roomRowsText,
  rowsOfSeat,
  rowsText,
  seatPrompt,
  seatWordsOf,
  seatedByLine,
  shutLine,
  shutToast,
  submitRefusedLine,
  turnText,
  underLine,
  wakeEndedLine,
} from './model/sessionseat'
import type { SeatRow } from './model/sessionseat'
import { isUrId, tapLine, urGameOf } from './model/ur'
import { DEFAULTS, change, changeMany, parseSettings } from './model/settings'
import type { SettingKey, Settings } from './model/settings'
import { SHOWN_CARDS, buildItem, itemLines, newestIds, parseCatalog, parseCatalogEntries } from './model/shelf'
import type { CatalogEntry, Disc, ShelfRecord } from './model/shelf'
import { keepWalks } from './model/walkread'
import { sha256Of } from './model/sha256'
import { NO_FILES, NO_SANDOQ_LINE, SEATS_READ_MOST, SEAT_UNFIT_LINE, VERSION_LATE_LINE, VERSION_NOT_RUN_LINE, VERSION_UNSAID_LINE, newestFile, oldLine, parseList, parseSeats, refusalLine } from './model/shelffiles'
import type { SeatList, ShelfFilesRead } from './model/shelffiles'
import { newestRecord, parseSeen, seenText, shelfSeenPath, themesOf, toldOf, whoseOf } from './model/shelfreads'
import type { SeatShelf } from './model/shelfreads'
import { groundsOf, hourFor, paneRows } from './model/scene'
import { afterLine, checkedSteps, doorNotUp, doorOfCheck, isNoClaude, isPaneRestart, paneStepOf, readSteps, stepLines, waits, withoutProgress, wordOf as stateWord } from './model/steps'
import type { Door, Step } from './model/steps'
import { DEFAULT_FACE, FACES, INDENT, openAsks, parseWalk, waitingLine } from './model/walk'
import { DOOR_LATE, NO_CARD_LINE, candidatesOf, cardAtPlace, idOfSay, keepSaid, lineOf, newestIdOf, sessionIdsOf, withoutSlashWords, writeLineOf, yourCardsOf } from './model/yourcards'
import { failureLine, guardedPane, plainBlock } from './views/guard'
import { deskCountOf, waitsOnYouWords } from './views/pane'
import { countWords, failureWords, linesOf, pairWords, pairsOf, scrub } from './views/inspect'
import { LOOK } from './views/look'
import { fitted } from './views/theme'
import { forgetScene } from './views/scene'
import { isApp } from './views/glass'
import { DOCK_PLACES, dockOf } from './model/dock'
import type { DockSlot } from './model/dock'
import { DOOR_READING, canvasRowsOf, dockPlaceOf, dockPress, forgetTiles, terminalRowsOf, terminalSize } from './views/frame'
import { pressedRegion } from './views/press'
import { forgetPictures } from './views/ur'
import { CHAT_LIST } from './views/chat'
import { TERMINAL_LIST } from './views/termpage'
import { DESK_LIST, forgetDeskPicture } from './views/desk'
import { LETTER_TEXT } from './views/seat'
import { WALK_LIST, WALK_OPEN } from './views/walk'
import { tilesOn } from './views/tiles'
import { layout } from './views/space'
import type { Actions, Card, DiscChecks, Face, Maker, Nav, Starter, UrWindow, WalkText } from './views/types'
import type { CheckResult, UpdateResult, VersionsCard } from './views/versions'

const PANE = 'room'
// A card's file in the gate's walks folder: its ULID, then .md.
const CARD_FILE = /^[0-9A-Za-z]{20,}\.md$/

type Snapshot = {
  exists: boolean
  cards: Card[]
  // How many cards the gate holds, of which `cards` are the newest `shown`.
  total: number
  records: ShelfRecord[]
  entries: CatalogEntry[]
  versions: string
  discs: Disc[]
  // Every walk of the gate, for the card counts of the turn, the profiles and the shelf.
  walks: WalkText[]
  // The layout files, as layersOf reads them (the pane carries none): the room's own (shelves/room/egress) by
  // file name, then each disc's (unpacked/DISC/egress/FILE) and its class file (unpacked/DISC/shelf/class.md)
  // by their path under unpacked/, the discs in the order they are looked at.
  roomFiles: Record<string, string>
  // The taps of the person the door has not taken yet.
  taps: PendingTap[]
  // rules.md of the room shelf: his rules, and the withdrawal of each he took off.
  rulesText: string
  // seats.md of the room shelf: who sits, with each seat's kind and folder ('' when the room holds none).
  seatsText: string
  // What the Room place reads (each '' or empty when the file is missing): logs/tick.md and discs.md of the run folder (.sandoq), the
  // text of each file of cache/programs/ by its name, and the size on disk of the walks and the shelf when the listings say it.
  tickText: string
  discsText: string
  programTexts: Record<string, string>
  bytes?: number
  // The room's own background (order BG): the text to draw or why it is not drawn; none for a room with no background.svg.
  background: Background | undefined
  // The folders under shelves/ (the room's and each seat's), and what stands in each seat's (order P7, C3): read only where two or more
  // shelves stand, its catalog where one stands, what it was told and the themes with the one on the wall.
  shelfNames: string[]
  seatShelves: Record<string, SeatShelf>
  // The files of the shelf (order shelf-files), as `sandoq shelf list` says them: read only with the shelf window open, and the last reading stands after.
  shelfFiles: ShelfFilesRead
  // The entries of the room's feed (feed/GATE.md of the run) with their answers, oldest first; none when the file was there and could not be read.
  feed: FeedEntry[] | undefined
}

const emptySnap = (): Snapshot => ({
  background: undefined,
  exists: false,
  cards: [],
  total: 0,
  records: [],
  entries: [],
  versions: '',
  discs: [],
  walks: [],
  roomFiles: {},
  taps: [],
  rulesText: '',
  seatsText: '',
  tickText: '',
  discsText: '',
  programTexts: {},
  shelfNames: [],
  seatShelves: {},
  shelfFiles: NO_FILES,
  feed: [],
})

// The latest read of the folder, what every drawing shows.
let snap: Snapshot = emptySnap()
// The face the pane shows, kept for the session; the trace row picked on the trace face and lens.
let face: Face = DEFAULT_FACE
let pickedRow = -1
let signature = ''
// The open view: his desk at first (order DESK, D2), or the level up when Settings, On open, says the room's.
let nav: Nav = { view: 'desk' }
// Whether a window of the app's canvas stands open (a place of the dock); at rest none does (after its Close). A session starts on the desk, its
// window open. The terminal draws the nav alone and reads none of it.
let windowOpen = true
// The page each list that pages stands on, by the list's name (order D1, still A2); a step to another place, or a shut window, forgets them.
let pages: Record<string, number> = {}
// The seat the composer says to ('' for the room): set by "Say to NAME" of that seat's window, put back to the room by its Close and by
// any step away from the window (order D1, still A2).
let seatTo = ''
// Where a say goes when the open card has no open ask: the room, or a reply to the card `targetFor`, the
// one open when the person picked it. Another open card, or a send, puts it back to the room.
// On a letter opened from the desk the target is the room or the keeper on that card (order keeper chat), `targetFor` its id.
let target: 'room' | 'card' | 'keeper' = 'room'
let targetFor = ''
// The words he sent to the keeper on a card that the walk does not hold yet, by the card's id: each is drawn as his line with Sent. under it until the walk
// holds a line of those words (model/chat.ts). In memory only.
let chatSent: Record<string, string[]> = {}
// How many of the newest cards the feed reads; "older" adds SHOWN_CARDS.
let shown = SHOWN_CARDS
// What "Show N more" and "N more ›" of the operator lens have opened, by the card the lens has open ('' for
// none). In memory only: a card that is left drops its entry (see openNav).
let expanded: ExpandedByCard = new Map()
// The pane's own settings and its own "Settings changed" card, read at each poll from its file in the run folder
// (none: the defaults and no card). The last change is in memory only: the settings before it (what Undo writes
// back), its line, the setting it changed and when. A change made within a minute of the last one joins its line.
let settings: Settings = DEFAULTS
let ownCard: OwnCard | undefined
// Your cards (order YC, Y2b): the session ids of this folder, read at each poll from the pane's file in the run folder (the submit hook
// writes it; none is an empty list), and the ids of the cards a say of the pane made in this session, in memory only: a new session
// forgets them.
let yourIds: string[] = []
let saidIds: string[] = []
// The cards that may be his, out of every walk of the gate (candidatesOf), read at each poll after the ids.
let yourCards: Card[] = []
let lastChange: { before: Settings; line: string; key: SettingKey; at: number } | undefined
const ONE_LINE_MS = 60000
// The card keeps the lines of the latest changes, no more.
const CARD_LINES = 3
// The gate's state, in memory only: the rules taken off by "Ask me next time" (the card says so at once, before
// the door has written the withdrawal), the composer's target "A rule", and the rest of the shelf's items.
const takenOff = new Set<string>()
let adding = false
let shelfAll = false
// The seat face's memory (order A-S4), forgotten when he leaves the face: the waits "Not now" set aside, in order
// (waitKey of model/seat.ts), whether "Answered today N ›" has opened today's answers, and whether the level up lists
// every idle seat. Nothing here is written to the room.
let aside: string[] = []
let answeredOpen = false
let allSeats = false
// The open letter's tab and the row of its walk that is open (order W2), in memory only and forgotten when the letter changes or closes.
let letterTab: 'text' | 'walk' = 'text'
let walkOpen = ''
// The Room place's card that is open ('seats' draws every seat); in memory only, forgotten when he leaves the place.
// `allSeats` is its "N more seats ›" too.
let roomOpen = ''
// The nav the open place was opened from, only when that was the room card (order DP, P4): the Back of Seats, the Shelf and Versions says
// `‹ The room` then. Forgotten when he opens a place from anywhere else.
let came: Nav | undefined
// The surface the session started on, as its start said it: only the terminal asks for the keyboard when the pane opens (openPane).
let startedOn = ''
// What a seat drives and reads (order A-M12), in memory alone. The tree of the last draw, with the surface, the columns of
// the pane and the rows it was drawn at; the width the pane is laid out at (0 is the real width, set by the tool
// room_pane_do and back to 0 at each opening); the theme the seat asked for and the theme the kit says.
let drawnLast: { tree: unknown; surface: string; columns: number; rows: number; high: number; at: number; tiles: boolean } | undefined
// The draws the pane made this session, and the last room_pane_do call with the draws it found: the read says its lines are the tree of the
// LAST draw while its head is live, so a do call moves the head and not the lines when the app draws nothing after it.
let drawsMade = 0
let lastDo: { at: number; draws: number } | undefined
let laidAt = 0
let themeAsked: ThemeAsk = 'auto'
let kitTheme: KitTheme = 'unknown'

// The texts of the gate's walks and of the layout files, cached by file name, a folder a cache: a file is
// read again only when it is new or its size changed.
const walkCache: FileCache = new Map()
const folderCaches = new Map<string, FileCache>()
// The room's feed (order room-feed, part A): feed/GATE.md of the run, cached by size and time as a walk is, and parsed again only when its text moved. No side file:
// the answers that toast are kept by their id in memory (`feedSeen`), as the desk's items are; the first read of the feed only seeds.
const feedCache: FileCache = new Map()
let feedDir = ''
let feedParsed: { text: string; entries: FeedEntry[] } | undefined
const feedSeen = new Set<string>()
let feedSeeded = false
const forgetFeed = (): void => {
  feedCache.clear()
  feedDir = ''
  feedParsed = undefined
  feedSeen.clear()
  feedSeeded = false
}
// The room's own background, kept with the size and the change time of the file it was read from, and the room it was read in: the
// file is read again ONLY when one of them moved (or the room did), never at a draw.
let backgroundKept: KeptBackground | undefined
// The sha256 of the wall's text (order P7, C3), for the theme in use: made ONLY where the file was read again (its size or its change time
// moved, or the room did), kept with the reading; none ('') for no file or a file over the most, which is never read.
let wallSha = ''
// What the seats' shelves read last (order P7, OPEN), with the room it was read in: a poll with no shelf open reads no seat file and
// draws what stood; another room, or a new session, drops it.
let seatsKept: { root: string; seatShelves: Record<string, SeatShelf> } | undefined
// What the files of the shelf read last (order shelf-files), with the room it was read in and, for each seat, the count and the newest time its
// list was read for: a list is read again only when the seats answer says either moved. A poll with no shelf open runs nothing and draws what stood.
let filesKept: { root: string; read: ShelfFilesRead; stamps: Record<string, string> } | undefined
// The time seen on the shelf (ms) at the moment the shelf window opened: a file after it is new while the window stands. The live time moves at
// the open (keepShelfSeen), so the marks keep this one.
let filesSeenAt: number | undefined
let walkDir = ''
// The time of the latest poll: the card ages and the turn read against it.
let pollNow = Date.now()
// The time the poll reads: the system's, or the one a test fixes through setClock.
let clockNow = (): number => Date.now()
export function setClock(now?: () => number) {
  clockNow = now ?? (() => Date.now())
}
let isSeeded = false
let isBusy = false
const answerSeen = new Set<string>()
const askSeen = new Set<string>()
const pickSeen = new Set<string>()
// The doorbell (order T2): the ids of the desk's items rung for (every id a read of the desk gave), whether the desk was read once (that read
// only seeds), what a read has to ring and not rung yet, and the cards he answered by a tap of his own (their answer is no news).
const itemSeen = new Set<string>()
let deskSeeded = false
let bell: Ring[] = []
const tapped = new Set<string>()
// The keeper's shape asks he tapped (their ids): the ask is one tap, so its Yes and No are held from the tap until the feed is read with the decided block. In memory only.
const shapeSent = new Set<string>()
// The reads of the room that have not reached their ring: the bell does not ring while one is out, so one read gives one toast (order T2B).
const holding = new Set<object>()
// The keeper's picks he took off his desk by OK (order T3), by the key of the pick (model/keeperrow.ts), with the room folder they were read for. They
// are kept in the pane's own file `pane-desk.json` beside pane.json, read again when the room folder changes and written at each OK, so an OK stays
// through a reopen and the next session. No call is made to sandoq.
let keeperOk = new Set<string>()
let keeperOkRoot: string | undefined
// The fold of the picks stands open (order D2); the desk card carries it to the view.
let keeperFold = false
// The time of the newest record he has seen on the Shelf place (order T4a), kept in the pane's own file `pane-shelf.json` beside pane.json: the first
// read of a room seeds it, opening the Shelf place moves it to the newest, and a record after it is new on the shelf (the dock's Shelf says so,
// quietly). None before it is read or seeded. No toast, no tray count, no call to sandoq.
let shelfSeen: number | undefined
let shelfSeenRoot: string | undefined

// Where the room is, read again at each poll from the session's folder and up to six above.
let host: Host = noHost()
const isLocal = (): boolean => host.mode === 'room'
// The local door's life: '' (not looked at), starting, up, stopped, none (the room holds no door program).
let doorState = ''
let door: { return: (value?: unknown) => Promise<unknown> } | undefined
// A door of someone else's was found running when the session began, so the pane started none.
let doorFound = false
// The door has been asked once since the session started (the knock, or the reason none is asked): until then the bar says reading.
let doorAsked = false

// The environment the pane reads for the plugin option that names sandoq: the process's own, or the one a test sets.
let envNow: Env | undefined
export function setEnv(env?: Env) {
  envNow = env
}

// How long the pane waits for what it asks of the machine, in ms (order C3, the hang of a session start). Past the limit the
// pane goes on with what it has and says one plain line that names what did not answer. The limits are about ten times what the
// thing takes: the find of sandoq is a script that tests four places; the knock is one connect; a read of the room is a find and
// some folders; a say, a tap, a card and a new room are the room's own program, which may take its turn; the opener of a page
// hands it to the system. The session start waits for the first read a moment only, so a normal start has the room drawn and a
// hung one answers at once.
// The checks of the Versions card ask the network, so each has a limit of its own, 150 s; the update of the pane fetches and
// installs, so it has 1800 s, sandoq's own bound of a player install: a limit under it would cut a run sandoq still holds. The
// limits of the card's commands are said once, in limitOf of host.ts, and these two are read from it. The call that starts a door
// (order MR) has 60 s: it brings the unit up.
export const LIMIT = { start: 250, find: 2000, door: 2000, poll: 10000, open: 3000, send: 20000, page: 5000, discs: 3000, check: limitOf('check'), update: limitOf('pane'), doorStart: 60000 }
// After a find of sandoq did not answer, the polls ask no more for this many of them (about 30 seconds), so a hung process is
// not started again every two seconds.
const FIND_HOLD = 15
// What the pane says of a say or a tap that did not answer: it never guesses that the room took it.
const READING = 'reading the room'
const READING_LINE = 'Reading the room…'
const NOT_SENT = 'It is NOT sent as far as the pane knows: look at the room before you send it again.'
// A line to the keeper needs the program `chat` of a room found by its mark, which sandoq runs by its bare name.
const NO_CHAT = 'a line to the keeper needs a room found by its mark: run sandoq room new in this folder. Nothing was sent.'
// A seat's name as an at word may carry it: letters, digits, dashes, dots and underscores.
const SAY_NAME = /^[\w.-]+$/
// What the pane says of a card id that holds a sign the room does not read in an id: it sends nothing.
const BAD_CARD_ID = 'room: Nothing was sent, the card id holds a sign that is not a letter, a digit, a dash, a dot or an underscore.'
// The say that answers a card said to this seat: `@ID @SEAT words`, the id first. The id is checked as a seat's name is; a bad id
// gives nothing, and the answer sends nothing. A sayer's name that fails the test is left out, as before.
export const answerSay = (cardId: string, by: string, text: string): string | undefined =>
  SAY_NAME.test(cardId) ? [`@${cardId}`, ...(SAY_NAME.test(by) ? [`@${by}`] : []), text].join(' ') : undefined
// What the pane says of a seat's name that holds a sign the room does not read in an at name: it sends nothing.
const BAD_SEAT_NAME = 'room: Nothing was sent, the seat name holds a sign that is not a letter, a digit, a dash, a dot or an underscore.'
// What the pane says of an at name with no words after it: it runs nothing.
const NO_WORDS = 'room: Nothing was sent, no words after the at name.'

// The error of a thing past its limit: its message is the plain line, and `unanswered` tells it from any other error.
const Unanswered = (what: string, ms: number): Error & { unanswered: true } =>
  Object.assign(new Error(`${what} did not answer in ${ms / 1000} s`), { unanswered: true as const })
const isUnanswered = (error: unknown): error is Error & { unanswered: true } => (error as { unanswered?: boolean } | undefined)?.unanswered === true

// `work` or an Unanswered at the limit. The work goes on after it (a host process has no way to be stopped), and its late
// answer is dropped.
function within<T>($, ms: number, what: string, work: Promise<T>): Promise<T> {
  return new Promise<T>((done, fail) => {
    let over = false
    $.clock.after(ms, () => {
      if (over) return
      over = true
      fail(Unanswered(what, ms))
    })
    work.then(
      value => {
        if (!over) done(value)
        over = true
      },
      error => {
        if (!over) fail(error)
        over = true
      },
    )
  })
}

// The line the pane says of the last thing that did not answer, and how many did not since the pane opened; '' when the read
// of the room has gone through since. The polls hold the find of sandoq for a number of polls after it did not answer.
let late = ''
let doorLate = ''
let lateCount = 0
// The newest part of the read of the room that threw, in one line, kept until a read goes through with no part failing; and how many
// reads had a part fail since the session started (the read tool says it). A part that threw is no thing that did not answer.
let partLate = ''
let partReads = 0
// A find of sandoq that errored (a fault the pane kept, not a wait) says its line last.
const lateLine = (): string => (late !== '' ? late : partLate !== '' ? partLate : doorLate !== '' ? doorLate : sandoqFault())
let findHold = 0
// The room has been read once since the session started (a poll went through); until then the pane says it reads.
let isRead = false
// The one poll clock (order walks-once): `pollGen` is the number of the newest start, whose tick alone polls; `pollStop` is what the host gave to stop the
// clock before (if it gives one).
let pollGen = 0
let pollStop: unknown
// The poll that runs now: a session start drops it (its late answer changes nothing) and frees the poll.
let reading: { dead: boolean; before: number } | undefined
// The reads of the room that began and have not returned, those past their limit among them (a host process cannot be stopped).
// While two are out the polls begin no new one, so a stuck folder is not read again every poll; the line says so once. A session
// start drops them, as it drops the poll.
const READS_OUT_MAX = 2
const readsOut = new Set<object>()
let heldSaid = false
const HELD = 'two reads of the room have not answered; no new read starts until one does'
const noteLate = (error: unknown): boolean => {
  if (!isUnanswered(error)) return false
  late = error.message
  lateCount += 1
  return true
}

// A part of the read of the room that threw (an error that is no run past its time): the line says its name and the first line of
// its error, no path of this machine in it, at most 120 cells. The read goes on with the part's empty value and the rest.
const PART_CELLS = 120
// `ms` is set for a part that did not answer in its own time: its line says the seconds, never an error's words.
type Said = { part: string; error: unknown; ms?: number }
const partLine = (said: Said): string =>
  fitted(`The pane could not read ${said.part}: ${said.ms === undefined ? firstLine(said.error) : `it did not answer in ${said.ms / 1000} s`}`, PART_CELLS)
const noteRead = (said: Said): void => {
  partLate = partLine(said)
  partReads += 1
}
// Each part of the read has its OWN limit, by the pane's clock, in ms (order E1b). A part that does not answer in it gives its empty
// value, the read goes on and ends, and the line names the part. Read one after the other with the find of sandoq (LIMIT.find),
// the limits stay under the poll's (LIMIT.poll): 2000 and 7500 are 9500 of 10000. The walks have the most: a first read of a
// room with many cards is many files. The new answers are no part that waits: they only toast.
export const PART_LIMIT: Record<string, number> = {
  'the walks': 2500,
  'the catalog': 400,
  'the versions': 300,
  'the disc records': 500,
  'the layouts': 500,
  'the taps': 500,
  'the rules': 300,
  'the seats': 300,
  "the Room place's files": 600,
  'the shelf listing': 500,
  'the background': 600,
  "the pane's own file": 500,
}
// A test may make a part throw by its name (a part that only reads a file has nothing in it that throws by itself), or make it
// slow: it never answers, and only its limit ends the wait; or late: its work begins when the promise given for it is done, which
// may be after its limit (a read of 3 s), and the work then goes on to its end as the host's own would.
export const readFault: { make?: (part: string) => unknown; slow?: (part: string) => boolean; late?: (part: string) => Promise<void> | undefined } = {}
// The cache of the walks emptied, as a session in another room finds it (a test fills it again by a read).
export const forgetWalkCache = (): void => {
  walkCache.clear()
  walkDir = ''
}
// The parts whose work, past its limit, has not returned: the host cannot stop it, so the next reads do not start it again (a hung
// folder would add a call at each poll); the part says again that it did not answer. After PART_HOLD reads the part is asked again, in
// case the host has found its feet. A session start forgets them.
const PART_HOLD = 15
let partsOut = new Map<string, { skipped: number }>()
// One part taken apart from the read: it gives its value, or when it throws or does not answer, its empty value and its place in `said`.
async function takeApart<T>($, said: Said[], part: string, empty: () => T, work: () => Promise<T> | T): Promise<T> {
  const ms = PART_LIMIT[part]
  try {
    const fault = readFault.make?.(part)
    if (fault !== undefined) throw fault
    if (ms === undefined) return await work()
    const out = partsOut.get(part)
    if (out !== undefined && (out.skipped += 1) < PART_HOLD) throw Unanswered(part, ms)
    const mine = { skipped: 0 }
    partsOut.set(part, mine)
    const done = (async () => {
      if (readFault.slow?.(part) === true) await new Promise<never>(() => undefined)
      await readFault.late?.(part)
      return await work()
    })()
    void done.then(
      () => undefined,
      () => undefined,
    ).finally(() => {
      if (partsOut.get(part) === mine) partsOut.delete(part)
    })
    return await within($, ms, part, done)
  } catch (error) {
    said.push(isUnanswered(error) && ms !== undefined ? { part, error, ms } : { part, error })
    return empty()
  }
}

// The four reads the host's finder needs, made from `$` here: the host follows `$` only inside this file. Its one process is the
// find of sandoq: it has a limit, and after it the polls ask no more for a while.
const ioOf = ($): Io => ({
  cwd: () => $.session.cwd(),
  exists: path => $.fs.exists(path),
  read: path => $.fs.read(path),
  list: path => $.fs.list(path),
  write: (path, text) => $.fs.write(path, text),
  run: async argv => {
    if (findHold > 0) throw Unanswered('the find of sandoq', LIMIT.find)
    try {
      return await within($, LIMIT.find, 'the find of sandoq', $.process.run(argv))
    } catch (error) {
      if (noteLate(error)) findHold = FIND_HOLD
      throw error
    }
  },
  env: () => envOf(),
})
const envOf = (): Env => envNow ?? (globalThis as any).process?.env ?? {}

// The app limits a process by itself (30 s) and cuts it before the pane's own limit; the cut arrives as a plain error whose words
// say `aborted` and `still running after NNNNms`. It is a thing that did not answer, never a run that did not run, so the pane
// makes its own error of it: the app's words and its ms never reach a line. N is the app's number read from the error, in seconds
// (none, when the error gives none). The words that tell it: `still running after`, or `process run` then `aborted` on the same
// line; the word `aborted` alone is no cut (a folder may bear it). The error is marked `cut`, so the pane can tell the app's cut
// from its own limit.
const CUT_WORDS = /still running after|process run\b.*\baborted\b/i
const cutOf = (error: unknown, what: string): unknown => {
  const text = String(error)
  if (!CUT_WORDS.test(text)) return error
  const ms = /after\s+(\d+)\s*ms/i.exec(text)
  const seconds = ms === null ? '' : ` in ${Math.max(1, Math.round(Number(ms[1]) / 1000))} s`
  return Object.assign(new Error(`${what} did not answer${seconds}`), { unanswered: true as const, cut: true as const })
}
const isCut = (error: unknown): error is Error & { unanswered: true; cut: true } => isUnanswered(error) && (error as { cut?: boolean }).cut === true

// One process of the room, with its limit: its run, or the line that names it. A run past its limit is never read as an answer.
async function runWithin($, argv: string[], ms: number, what: string): Promise<{ exitCode?: number; stdout?: string; stderr?: string }> {
  const ran = async () => {
    try {
      return await $.process.run(argv)
    } catch (error) {
      throw cutOf(error, what)
    }
  }
  return within($, ms, what, ran())
}

// A long run (the update of the Versions card, and the second try of a check the app cut) by process.spawn with the argv alone, as
// the door is: the app's own limit of 30 s on process.run does not hold it, so the pane's own limit comes first. The pieces of the
// stream are gathered into what the card reads: a piece is an object with the name of its stream and its text (a string alone is
// the out); the end of the stream gives the code. The late end of a run past the pane's limit is dropped, as for any run, and the
// pane never stops the run: the stream is read to its end and not returned.
export async function gather(child: AsyncIterable<unknown>): Promise<{ exitCode?: number; stdout?: string; stderr?: string }> {
  const out: string[] = []
  const err: string[] = []
  const stream = child[Symbol.asyncIterator]()
  for (;;) {
    const step = await stream.next()
    if (step.done === true) {
      const code = (step.value as { code?: unknown } | undefined)?.code
      return { exitCode: typeof code === 'number' ? code : undefined, stdout: out.join(''), stderr: err.join('') }
    }
    const piece = step.value as string | { stream?: unknown; text?: unknown } | undefined
    if (typeof piece === 'string') out.push(piece)
    else if (typeof piece?.text === 'string') (piece.stream === 'stderr' ? err : out).push(piece.text)
  }
}

async function spawnWithin($, argv: string[], ms: number, what: string): Promise<{ exitCode?: number; stdout?: string; stderr?: string }> {
  const ran = async () => {
    try {
      return await gather($.process.spawn({ argv }))
    } catch (error) {
      throw cutOf(error, what)
    }
  }
  return within($, ms, what, ran())
}

// The Versions card of Settings (cut 1, the pane alone). The pane's version and the discs of the room are read with no process.
// "Check now" is the one act that runs one: sandoq update and sandoq room update, each with the word --check (host.ts), each its
// own process with its own limit, never in the poll and never at a draw. Without the word nothing runs. What each said is kept in
// the memory of the session: a session start forgets it, and a check that was out then changes nothing when it comes back.
const MAX_CHECK_LINES = 40
let check: { state: 'rest' | 'checking' | 'done'; at: string; results: CheckResult[] } = { state: 'rest', at: '', results: [] }
let checkRun = 0
const NO_CHECK = 'No sandoq was found for this room, so no check can run.'

const CHECK_CURRENT = 'Each is up to date.'
const CHECK_BEHIND = 'An update waits, or a part was not read. See the lines.'
const CHECK_NOT_TAKEN = "The pane's command was not taken."

// The scrubbed, non-empty lines of one stream.
const streamLines = (text: string | undefined): string[] =>
  (text ?? '')
    .split('\n')
    .map(line => scrub(line.trim()))
    .filter(line => line !== '')

// One check. Sandoq's exit codes: 0 is each component up to date, 1 is something behind (an update waits, or a part was not read;
// its lines are on the out, one a component), 2 is usage; a refusal is one line on the err and none on the out. So the lines of the
// out are shown whole whatever the code, and the head comes from the code alone, never from a word of a line. With no line on the
// out a code that is not 0 is the refusal (the last line of the err), or for 2 the plain line that the command was not taken.
// What one check gave: the lines form of it (the old card's), and its out and exit code for the table, which reads the json form.
// `answered` is false for a check that did not run or did not answer in its time.
type Checked = { result: CheckResult; out: string; code: number | undefined; answered: boolean }

// A check goes by process.run first, the way that is proven. Only when the app cut it (its limit of 30 s) the pane tries it once
// more by spawn under the limit of a check: a check changes nothing, so it is safe to run twice. Lines from that second try are the
// card's; a second try with no line and no code gives the line of the first, did not answer.
async function runCheck($, name: string, argv: string[]): Promise<Checked> {
  try {
    const run = await (async () => {
      try {
        return await runWithin($, argv, LIMIT.check, name)
      } catch (cut) {
        if (!isCut(cut)) throw cut
        let again: { exitCode?: number; stdout?: string; stderr?: string }
        try {
          again = await spawnWithin($, argv, LIMIT.check, name)
        } catch (error) {
          throw isUnanswered(error) ? error : cut
        }
        if (streamLines(again.stdout).length === 0 && again.exitCode === undefined) throw cut
        return again
      }
    })()
    // the json form (one object a step) is drawn here as the lines form: each step as its own `line`
    const said = streamLines(stepLines(run.stdout ?? '').join('\n'))
    const rest = said.length - MAX_CHECK_LINES
    const lines = rest > 0 ? [...said.slice(0, MAX_CHECK_LINES), `…and ${rest} more lines`] : said
    const code = run.exitCode
    const given = (result: CheckResult): Checked => ({ result, out: run.stdout ?? '', code, answered: true })
    if (code === 2) return given({ name, head: '', lines, plain: CHECK_NOT_TAKEN })
    // A pane with no claude is ok and exit 0, but nothing of it was checked: the head Each is up to date stays off, its line says the in-app steps.
    const unchecked = readSteps(run.stdout ?? '').steps.some(isNoClaude)
    if (said.length > 0) return given({ name, head: code === 0 ? (unchecked ? '' : CHECK_CURRENT) : code === 1 ? CHECK_BEHIND : `It exited ${code ?? 'with no code'}. See the lines.`, lines, plain: '' })
    if (code === 0) return given({ name, head: CHECK_CURRENT, lines: [], plain: '' })
    const refusal = streamLines(withoutProgress(run.stderr)).at(-1) ?? `it exited ${code ?? 'with no code'}`
    return given({ name, head: '', lines: [], plain: `${name} was refused: ${refusal}` })
  } catch (error) {
    const plain = isUnanswered(error) ? `${error.message}; nothing was updated. Try again.` : `${name} did not run: ${scrub(String(error)).slice(0, 160)}`
    return { result: { name, head: '', lines: [], plain }, out: '', code: undefined, answered: false }
  }
}

// THE TABLE (order V3): what the last check said as steps (model/steps.ts reads the json form), the door it read, whether the sandoq
// here printed no json form (exit 2, or no object on the out: the card keeps the lines form for that run and says so), and the plain
// lines of a check that did not answer. What a press of an update gave stands in `ran`, what runs in `running`, and the fold is where he
// left it. Like the check's, all of it is the memory of the session.
let table: { steps: Step[]; door: Door; older: boolean; notes: string[] } = { steps: [], door: 'none', older: false, notes: [] }
let ran: { refused?: { code: number; err: string }; said?: { plain: string; lines: string[]; pane?: Step }; notes: string[]; doorNotUp: boolean; older?: boolean } = { notes: [], doorNotUp: false }
let running: { what: string; restart: boolean } | undefined
let tablePage = 0
let tableFold = false
let tableLinesPage = 0
const forgetTable = () => {
  table = { steps: [], door: 'none', older: false, notes: [] }
  ran = { notes: [], doorNotUp: false }
  running = undefined
  tablePage = 0
  tableFold = false
  tableLinesPage = 0
}
const noSandoq = (): boolean => host.sandoq === undefined || host.sandoq === ''

// The two checks, one table.
async function doCheck($): Promise<void> {
  if (check.state === 'checking' || noSandoq()) return
  const run = (checkRun += 1)
  check = { state: 'checking', at: '', results: [] }
  $.ui.invalidate('ui.render')
  const checked = await Promise.all([
    runCheck($, 'sandoq update --check', updateCheckArgv(host)),
    runCheck($, 'sandoq room update --check', roomUpdateCheckArgv(host)),
  ])
  if (run !== checkRun) return
  const steps = checkedSteps(readSteps(checked[0].out), readSteps(checked[1].out))
  table = {
    steps,
    door: doorOfCheck(steps),
    older: checked.some(one => one.answered && (one.code === 2 || readSteps(one.out).steps.length === 0)),
    notes: checked.filter(one => !one.answered).map(one => one.result.plain),
  }
  tablePage = 0
  check = { state: 'done', at: clockText(clockNow(), zoneOf()).slice(0, 5), results: checked.map(one => one.result) }
  $.ui.invalidate('ui.render')
}

async function checkVersions($): Promise<void> {
  if (check.state === 'checking' || update.state === 'updating' || noSandoq()) return
  ran = { notes: [], doorNotUp: false }
  tableFold = false
  tableLinesPage = 0
  await doCheck($)
}

// The update of the pane (pane 0.7.11): "Update the pane" on the pane's own line of the card runs sandoq pane update, one process
// with its own limit, on the press alone: never in a poll, never at a draw. It is the only update the pane runs (the checks above
// hold the word --check). It changes nothing of the room and stops no door. Like the check, its answer is the memory of the session.
let update: UpdateResult = { state: 'rest', lines: [], plain: '' }
let updateRun = 0
const UPDATE_DONE = 'Open a new session to load it.'
const UPDATE_UNKNOWN = 'The pane does not know whether it was updated. sandoq may still be at work; sandoq update --check tells where it stands.'
const UPDATE_UNREAD = 'The update ran; the pane could not read what it said.'

// The update goes by spawn, for a cut update is the worse harm. A run past the pane's limit is left running: the pane never stops
// it. A stream that ends with no code and no line is not the shape the pane reads: it says so, then asks what stands by the check
// of sandoq (a check, by the way above) and shows its lines.
async function runUpdate($): Promise<UpdateResult> {
  const name = 'sandoq pane update'
  try {
    const run = await spawnWithin($, updatePaneArgv(host), LIMIT.update, name)
    const code = run.exitCode
    // After exit 0 the pane's step that waits for a new session is said by the card in its own words (views/versions.tsx), not by its line.
    const said = streamLines(stepLines(run.stdout ?? '', code === 0 ? isPaneRestart : undefined).join('\n'))
    const rest = said.length - MAX_CHECK_LINES
    const lines = rest > 0 ? [...said.slice(0, MAX_CHECK_LINES), `…and ${rest} more lines`] : said
    if (code === undefined && said.length === 0) {
      const after = (await runCheck($, 'sandoq update --check', updateCheckArgv(host))).result
      return { state: 'done', lines: after.lines.length > 0 ? after.lines : [after.head !== '' ? after.head : after.plain].filter(line => line !== ''), plain: UPDATE_UNREAD }
    }
    // Exit 0 says Open a new session only where the steps say it (their `after` word, as the table press does): a pane with no claude
    // loaded nothing. A sandoq that printed no json form has no step to read, and its exit 0 says it as it did.
    if (code === 0) {
      const read = readSteps(run.stdout ?? '')
      const restart = read.steps.find(isPaneRestart)
      return { state: 'done', lines, plain: read.steps.length === 0 ? UPDATE_DONE : afterLine(read.steps), ...(restart === undefined ? {} : { pane: restart }) }
    }
    if (said.length > 0) return { state: 'done', lines, plain: `It exited ${code ?? 'with no code'}. See the lines.` }
    const refusal = streamLines(withoutProgress(run.stderr)).at(-1) ?? `it exited ${code ?? 'with no code'}`
    return { state: 'done', lines: [], plain: `${name} was refused: ${refusal}` }
  } catch (error) {
    return { state: 'done', lines: [], plain: isUnanswered(error) ? UPDATE_UNKNOWN : `${name} did not run: ${scrub(String(error)).slice(0, 160)}` }
  }
}

async function updatePane($): Promise<void> {
  if (update.state === 'updating' || host.sandoq === undefined || host.sandoq === '') return
  const run = (updateRun += 1)
  update = { state: 'updating', lines: [], plain: '' }
  $.ui.invalidate('ui.render')
  const result = await runUpdate($)
  if (run !== updateRun) return
  update = result
  discsWanted = true
  $.ui.invalidate('ui.render')
}

// The Button that makes a room where none stands (order MR, R2): "Make a room here" runs `sandoq room new NAME --json` in the session's
// folder, by process run alone (it is short) and with NO second try: a run the app cut, or past the pane's limit, may have made the room,
// so the pane says it knows nothing of it and asks the person to look in the folder. The pane reads no version of sandoq to decide: the
// call is the sign, an older sandoq answers with usage (exit 2) and does nothing, and then no Button stands for the rest of the session.
// `rest` has the Button, `making` is the call out, `refused` has sandoq's line and the Button again, `unknown` has the line of what is
// not known and no Button until a poll that began after the call finds no room again. In memory only; a session start forgets it.
// `own` says the line is the pane's own, not sandoq's: the draw gives it more rows and does not cut it at three.
type Make = { stage: 'rest' | 'making' | 'refused' | 'unknown'; line: string; own: boolean; after: number }
const NO_MAKE: Make = { stage: 'rest', line: '', own: true, after: 0 }
let make: Make = NO_MAKE
let makeRun = 0
let makerOld = false
// The number of the last read of the room that began: a read that began after a call ended is one that saw what the call left.
let readNo = 0

const makeLine = (): string => (makerOld ? ROOM_TOO_OLD : make.line)

async function makeRoom($): Promise<void> {
  if (make.stage === 'making' || makerOld || host.mode !== 'none' || host.maker === undefined || host.maker === '') return
  const run = (makeRun += 1)
  const argv = roomNewArgv(host, host.session)
  make = { stage: 'making', line: '', own: true, after: readNo }
  $.ui.invalidate('ui.render')
  let next: Make = { stage: 'unknown', line: ROOM_NOT_READ, own: true, after: 0 }
  let isOld = false
  try {
    const call = await runWithin($, argv, LIMIT.send, 'sandoq room new')
    const read = roomStartOf(call.stdout ?? '', call.exitCode)
    if (read.read && read.ok) next = NO_MAKE
    else if (read.read) next = { stage: 'refused', line: read.line === '' ? ROOM_REFUSED : read.line, own: read.line === '', after: 0 }
    else if (read.reason === 'usage') isOld = true
  } catch (error) {
    next = { stage: 'unknown', line: `${isUnanswered(error) ? error.message : `sandoq room new did not run: ${scrub(String(error)).slice(0, 100)}`}. ${ROOM_UNKNOWN}`, own: true, after: 0 }
  }
  if (run !== makeRun) return
  if (isOld) {
    makerOld = true
    next = NO_MAKE
  }
  make = next.stage === 'unknown' ? { ...next, after: readNo } : next
  $.ui.invalidate('ui.render')
  // A room made is found by the next poll: it is asked now.
  if (next === NO_MAKE && !isOld) await poll($)
}

// The Button as the views draw it: only where no room is found and a room may be made here; None otherwise.
const makerNow = ($): Maker | undefined =>
  host.mode !== 'none' || host.maker === undefined || host.maker === ''
    ? undefined
    : {
        name: roomNameOf(host.session),
        where: whereOf(host.session),
        making: make.stage === 'making',
        line: makeLine(),
        own: makerOld || make.own,
        button: !makerOld && (make.stage === 'rest' || make.stage === 'refused'),
        onMake: () => {
          void makeRoom($)
        },
      }

// The door of a room found by its mark (order MR, R3): where the pane starts the door by itself it makes the one call `sandoq room start
// --unit --json` and holds no child. By process run first (the app cuts it at 30 s, and a true start may need that long); ONLY where the
// app cut it, ONCE more by spawn under LIMIT.doorStart: a start is safe twice, the second says `door-stands`. `started` and `door-stands`
// take sandoq's word that the door stands (the pane holds no child; the next opening or put-up knocks again) and say nothing. `refused`
// has sandoq's line and the Button `Start the door`, the same call; a run that did not answer or an out not read says nothing is known of
// the door, with the Button too (a start is safe twice). The pane never tries again by itself. Where the second try gives no object the
// pane says nothing of sandoq. Exit 2 with no object is an older sandoq: nothing was started, the old road (the spawn of runDoor) is taken
// and the call is made no more in this session. In memory only; a session start forgets it.
type Start = { stage: 'rest' | 'starting' | 'refused' | 'unknown'; line: string; own: boolean }
const NO_START: Start = { stage: 'rest', line: '', own: true }
let start: Start = NO_START
let startRun = 0
let startOld = false

async function startByCall($): Promise<void> {
  if (start.stage === 'starting' || startOld || host.sandoq === undefined || host.sandoq === '') return
  const run = (startRun += 1)
  const argv = roomStartArgv(host)
  start = { stage: 'starting', line: '', own: true }
  doorState = 'starting'
  $.ui.invalidate('ui.render')
  let next: Start = { stage: 'unknown', line: DOOR_NOT_READ, own: true }
  let isOld = false
  let isUp = false
  try {
    let isAgain = false
    const call = await (async () => {
      try {
        return await runWithin($, argv, LIMIT.doorStart, 'sandoq room start')
      } catch (cut) {
        if (!isCut(cut)) throw cut
        isAgain = true
        try {
          return await spawnWithin($, argv, LIMIT.doorStart, 'sandoq room start')
        } catch (error) {
          throw isUnanswered(error) ? error : cut
        }
      }
    })()
    const read = roomStartOf(call.stdout ?? '', call.exitCode)
    if (read.read && read.ok) isUp = true
    else if (read.read) next = { stage: 'refused', line: read.line === '' ? DOOR_REFUSED : read.line, own: read.line === '' }
    else if (read.reason === 'usage') isOld = true
    // The second try gave no object: nothing is said of sandoq, the door is left to be read.
    else if (isAgain) next = NO_START
  } catch (error) {
    next = { stage: 'unknown', line: `${isUnanswered(error) ? error.message : `sandoq room start did not run: ${scrub(String(error)).slice(0, 100)}`}. ${DOOR_UNKNOWN}`, own: true }
  }
  if (run !== startRun) return
  doorState = ''
  if (isUp) {
    start = NO_START
    doorFound = true
  } else if (isOld) {
    start = NO_START
    startOld = true
  } else start = next
  $.ui.invalidate('ui.render')
  if (isOld) void runDoor($)
  else await poll($)
}

// The Button as the views draw it: only where the call has left a line or runs; None while the door goes well and quietly.
const starterNow = ($): Starter | undefined =>
  !host.marked || start.stage === 'rest'
    ? undefined
    : {
        starting: start.stage === 'starting',
        line: start.line,
        own: start.own,
        button: start.stage === 'refused' || start.stage === 'unknown',
        onStart: () => {
          void startByCall($)
        },
      }

// The update of the table (order V3): the pane's line runs sandoq pane update, a disc's line sandoq room update NAME (with the restart
// flag when the check said the door of the unit would restart), the foot's `Update all` the same with no name; never sandoq disc
// update. One command at a time, on the press alone, each with its own limit (host.ts limitOf: one disc waits for a press on one name,
// the count of the waits for Update all). While it runs the card holds no Update and no Check Button. After its answer the table is
// drawn again from a new check, and ONE plain line says what is left (by the `after` key of the objects of THIS run alone).
type Press = { kind: 'pane' } | { kind: 'room'; name: string }

async function pressUpdate($, press: Press): Promise<void> {
  if (update.state === 'updating' || check.state === 'checking' || noSandoq()) return
  // The name comes from the out of a check: it is tested before anything runs, so a name that holds a sign a name does not never
  // reaches an argv.
  if (press.kind === 'room' && press.name !== '' && !DISC_NAME.test(press.name)) {
    $.ui.toast('room: nothing was updated, the name of the disc holds a sign that a name does not')
    return
  }
  const restart = press.kind === 'room' && table.door === 'would-restart'
  const waiting = press.kind === 'room' ? (press.name === '' ? table.steps.filter(step => step.noun === 'disc' && waits(step)).length : 1) : 0
  const argv = press.kind === 'pane' ? updatePaneArgv(host) : roomUpdateArgv(host, press.name, restart)
  const name = press.kind === 'pane' ? 'sandoq pane update' : 'sandoq room update'
  const run = (updateRun += 1)
  update = { state: 'updating', lines: [], plain: '' }
  running = { what: press.kind === 'pane' ? 'the pane' : press.name === '' ? 'each disc' : press.name, restart }
  ran = { notes: [], doorNotUp: false }
  tableFold = false
  tablePage = 0
  tableLinesPage = 0
  $.ui.invalidate('ui.render')
  try {
    // An update goes by spawn, as the pane's own does (runUpdate): a run past its limit is left running, never stopped.
    const answer = await spawnWithin($, argv, press.kind === 'pane' ? limitOf('pane') : limitOf('room', waiting, restart), name)
    if (run !== updateRun) return
    const code = answer.exitCode
    const read = readSteps(answer.stdout ?? '')
    const last = streamLines(withoutProgress(answer.stderr)).at(-1) ?? ''
    const said = streamLines([...read.steps.map(step => step.line), ...read.plain].join('\n'))
    const rest = said.length - MAX_CHECK_LINES
    const lines = rest > 0 ? [...said.slice(0, MAX_CHECK_LINES), `…and ${rest} more lines`] : said
    if (code === undefined && said.length === 0) {
      // A stream with no code and no line is not the shape the pane reads: it says so, and the check that follows tells what stands.
      ran = { notes: [UPDATE_UNREAD], doorNotUp: false }
      update = { state: 'rest', lines: [], plain: '' }
    } else if (code === 2 || read.steps.length === 0) {
      // An older sandoq: the card keeps the lines form of this run, and says so (the new check does not take the line back).
      ran = { notes: [], doorNotUp: false, older: true }
      update = {
        state: 'done',
        lines,
        plain: code === 0 ? (press.kind === 'pane' ? UPDATE_DONE : '') : lines.length > 0 ? `It exited ${code ?? 'with no code'}. See the lines.` : `${name} was refused: ${last === '' ? `it exited ${code ?? 'with no code'}` : last}`,
      }
    } else {
      ran = {
        notes: typeof code === 'number' ? [] : ['It exited with no code. See the lines.'],
        doorNotUp: doorNotUp(read.steps),
        ...(typeof code === 'number' && code !== 0 ? { refused: { code, err: last } } : {}),
        // The pane's step that waits for a new session after exit 0 is what the table says under the pane's entry (the check that follows
        // does not give it back), as its call to action.
        said: { plain: afterLine(read.steps), lines, ...(code === 0 && read.steps.some(isPaneRestart) ? { pane: read.steps.find(isPaneRestart)! } : {}) },
      }
      update = { state: 'rest', lines: [], plain: '' }
    }
  } catch (error) {
    if (run !== updateRun) return
    ran = {
      notes: [isUnanswered(error) ? UPDATE_UNKNOWN : `${name} did not run: ${scrub(String(error)).slice(0, 160)}`],
      doorNotUp: false,
    }
    update = { state: 'rest', lines: [], plain: '' }
  }
  running = undefined
  discsWanted = true
  $.ui.invalidate('ui.render')
  await doCheck($)
}

// "Start the door", after a run that left the door down: what Put it up runs today, then the table is drawn again.
async function startTheDoor($): Promise<void> {
  if (update.state === 'updating' || check.state === 'checking' || noSandoq()) return
  ran = { ...ran, doorNotUp: false }
  $.ui.invalidate('ui.render')
  await putUp($)
  await doCheck($)
}

// The pane and the discs of the room as steps, for the card at rest: no check was made, so no state and no `there`.
const stepOf = (noun: string, name: string, here: string): Step => ({ noun, name, state: '', here, there: '', why: '', ok: true, line: '', after: '' })

// What the last check gave of the discs (order DP, P4): its hour and the state word of each disc; none before a check, or when the check
// said nothing of a disc. The room card says a state word and `all current` only from this.
const discChecksNow = (): DiscChecks | undefined => {
  if (check.state !== 'done') return undefined
  const states: Record<string, string> = {}
  for (const step of table.steps) if (step.noun === 'disc' && step.name !== '') states[step.name] = stateWord(step.state)
  return Object.keys(states).length === 0 ? undefined : { at: check.at, states }
}

// The Secrets section of Settings (order S2). `sandoq secret list` is read when the section opens in the app, or on the press of the terminal's
// "Show the names ›" (its column has no section): never on a timer, never at a draw, never at the opening of Settings. A press on a name shows its
// line, `sandoq secret set NAME`, to copy. The pane runs no set and takes no value: a secret is set in a terminal or in the sandoq control panel.
type SecretsKept = { state: 'rest' | 'reading' | 'done'; rows: SecretRow[]; open: string; line: string }
const NO_SECRETS: SecretsKept = { state: 'rest', rows: [], open: '', line: '' }
let secrets: SecretsKept = NO_SECRETS
let secretsRun = 0
const NO_SECRETS_LINE = 'No sandoq was found for this room, so no secret can be read.'
const secretsCardNow = (): SecretsCard => ({
  state: secrets.state,
  rows: secrets.rows,
  open: secrets.open,
  line: secrets.line,
  cannot: noSandoq() ? NO_SECRETS_LINE : '',
})
const forgetSecrets = (): void => {
  secrets = NO_SECRETS
  secretsRun += 1
}

async function readSecrets($): Promise<void> {
  if (noSandoq()) return
  const run = (secretsRun += 1)
  secrets = { ...secrets, state: 'reading' }
  $.ui.invalidate('ui.render')
  let rows: SecretRow[] | undefined
  let line = ''
  try {
    const got = await runWithin($, secretListArgv(host), LIMIT.poll, 'sandoq secret list')
    if (got.exitCode === 0) {
      rows = parseSecretList(String(got.stdout ?? ''))
      if (rows === undefined) line = 'The pane could not read the list sandoq gave.'
    } else {
      line = scrub(lastLineOf(got.stderr)) || `sandoq secret list exited ${got.exitCode ?? 'with no code'}.`
    }
  } catch (error) {
    line = isUnanswered(error) ? 'sandoq did not answer in time; the list is as it was.' : 'sandoq secret list did not run.'
  }
  if (run !== secretsRun) return
  secrets = { ...secrets, state: 'done', rows: rows ?? secrets.rows, line }
  $.ui.invalidate('ui.render')
}

// THE KEYS (order keys): ctrl+x then d, o, s, b or n, bound in the Chat block of his keybindings.json to the five commands of the pane. The file is read
// when the pane opens (the session start and /sandoq) and when the Keys section opens, never on a timer and never at a draw; it is WRITTEN only by the tap
// on "Add them to your keys" (his dotfile: his tap is his word), and only the lines no Chat block holds, never over a key bound to another thing. A file
// the pane cannot read or that is no keybindings is one line, and nothing is written.
let keysRead: KeysRead | undefined
let keysLine = ''
const keysCardNow = (): KeysCard => ({ read: keysRead, line: keysLine })
const BROKEN_KEYS: KeysRead = { file: 'broken', set: [], missing: [], clash: [] }

// The path of his file: the folder named by CLAUDE_CONFIG_DIR, else `.claude` under his home; '' when neither is known.
function keybindingsPath(): string {
  const env = envOf()
  const folder = env.CLAUDE_CONFIG_DIR ?? (env.HOME === undefined || env.HOME === '' ? '' : `${env.HOME.replace(/\/+$/, '')}/.claude`)
  return folder === '' ? '' : `${folder.replace(/\/+$/, '')}/keybindings.json`
}

// The file read once: its text (undefined when the file is none), or 'cannot' when it stands and could not be read. A file that is not there is
// none, never a thing to write over a file that is.
async function keysTextOf($): Promise<string | undefined | 'cannot'> {
  const path = keybindingsPath()
  if (path === '') return 'cannot'
  try {
    if (!(await $.fs.exists(path))) return undefined
    return String(await $.fs.read(path))
  } catch {
    return 'cannot'
  }
}

async function readKeysFile($): Promise<void> {
  const text = await keysTextOf($)
  keysRead = text === 'cannot' ? BROKEN_KEYS : readKeys(text)
}

// "Add them to your keys": the file is read again, the lines it lacks are added to its Chat block and written back, once, and the card says how many.
// A file that cannot be read, or whose text the add would not make whole, is one line and no write. The pane draws what it holds after it.
async function addKeysFile($): Promise<void> {
  keysLine = ''
  try {
    const text = await within($, LIMIT.send, 'keybindings.json', keysTextOf($))
    const made = text === 'cannot' ? undefined : addKeys(text)
    if (text === 'cannot' || made === undefined) {
      keysRead = BROKEN_KEYS
      keysLine = 'keybindings.json could not be read as keybindings: nothing was written.'
    } else if (made.added.length === 0) {
      keysRead = readKeys(made.text)
      keysLine = 'Nothing to add: no key is missing.'
    } else {
      await within($, LIMIT.send, 'keybindings.json', Promise.resolve($.fs.write(keybindingsPath(), made.text)))
      keysRead = readKeys(made.text)
      keysLine = `Added ${made.added.length} ${made.added.length === 1 ? 'line' : 'lines'} to the Chat block of keybindings.json.`
    }
  } catch (error) {
    keysLine = isUnanswered(error) ? `${error.message}; the pane cannot say it was written.` : `keybindings.json was not written: ${scrub(String(error)).slice(0, 120)}`
  }
  $.ui.invalidate('ui.render')
}

// The five commands: each opens its place as the key line Button does and brings the pane up. They are immediate: a key bound to one runs from the
// prompt, even while the session works.
async function doKey($, place: 'desk' | 'door' | 'shelf' | 'back'): Promise<string> {
  const actions = actionsOf($)
  if (place === 'back') await actions.backToSeat?.()
  else await actions.open(place === 'desk' ? { view: 'desk' } : place === 'door' ? { view: 'room' } : { view: 'shelf', by: 'kind' })
  await $.ui.open({ id: PANE, title: 'Room' })
  return `Room pane: ${place}.`
}

// NUDGE (order nudge pane): the seat of this pane is woken at an interval by the verb of the world (`salam/cli.py nudge`) or of the room (`sandoq room nudge`);
// the schedule is kept on the disc. The pane holds NO timer and NO clock for it: the state is read on open (the session start, /sandoq and the Nudge
// section), after a press of its own, and at a wake (the turn of the seat ends), never on a timer and never at a draw. A read that fails leaves the
// last state and says nothing; a press that fails shows the verb's line whole (a toast and the Settings line) and changes nothing.
let nudgeRead: NudgeRead | undefined
let nudgePicked = NUDGE_FIRST
let nudgeLine = ''
let nudgeOlder = false
let nudgeBusy = false
let nudgeRun = 0
// The argv of the verb for this pane's mode and seat; none where no road stands (no seat, no room, a room.sh room, no sandoq).
const nudgeArgvOf = (change?: string): string[] | undefined =>
  host.mode === 'world' ? worldNudgeArgv(host.cliPy, seatNow(), change) : host.mode === 'room' ? roomNudgeArgv(host, seatNow(), change) : undefined
const nudgeCardNow = (): NudgeCard => ({ seat: seatNow(), can: nudgeArgvOf() !== undefined, read: nudgeRead, picked: nudgePicked, line: nudgeLine, older: nudgeOlder, busy: nudgeBusy })
const forgetNudge = (): void => {
  nudgeRead = undefined
  nudgePicked = NUDGE_FIRST
  nudgeLine = ''
  nudgeOlder = false
  nudgeBusy = false
  nudgeRun += 1
}

// One call of the verb: an interval or `off` is a press, none is a read. A read whose press came after it is dropped.
async function callNudge($, change?: string): Promise<void> {
  const argv = nudgeArgvOf(change)
  if (argv === undefined) return
  const press = change !== undefined
  const run = press ? (nudgeRun += 1) : nudgeRun
  if (press) {
    nudgeBusy = true
    $.ui.invalidate('ui.render')
  }
  let read: NudgeRead | undefined
  let line = ''
  let older = false
  try {
    const got = await runWithin($, argv, press ? LIMIT.send : LIMIT.poll, 'the nudge')
    if (got.exitCode === 0) {
      read = parseNudge(String(got.stdout ?? ''))
      if (read === undefined) line = 'The pane could not read the state nudge gave.'
    } else {
      const why = nudgeWhy(got.exitCode, String(got.stderr ?? ''))
      line = scrub(why.line)
      older = why.older
    }
  } catch (error) {
    line = isUnanswered(error) ? 'nudge did not answer in time; the state is as it was.' : 'nudge did not run.'
  }
  if (run !== nudgeRun) return
  if (press) nudgeBusy = false
  if (read !== undefined) {
    nudgeRead = read
    nudgeOlder = false
    nudgeLine = ''
    if (NUDGE_EVERY.includes(read.every)) nudgePicked = read.every
  } else {
    nudgeOlder = older
    if (press) {
      nudgeLine = line
      $.ui.toast(line, { timeoutMs: 15000 })
    }
  }
  $.ui.invalidate('ui.render')
}

const readNudge = ($): Promise<void> => callNudge($)

// The toggle (the bar's Button, the key n, ctrl+x n): on at the picked interval, or off. A press of an interval in Settings sets it again while on, and
// picks it for the next turn on while off. A call out holds the next press.
async function pressNudge($, every?: string): Promise<void> {
  const card = nudgeCardNow()
  if (!nudgeShown(card) || nudgeBusy) return
  if (every !== undefined) {
    if (!NUDGE_EVERY.includes(every)) return
    nudgePicked = every
    if (card.read?.on !== true) {
      $.ui.invalidate('ui.render')
      return
    }
    return callNudge($, every)
  }
  return callNudge($, card.read?.on === true ? 'off' : card.picked)
}

// ctrl+x n: the same toggle from the prompt, and the line that says what it did.
async function doNudge($): Promise<string> {
  const card = nudgeCardNow()
  if (card.seat === '') return 'Nudge needs a seat: this pane has none.'
  if (!card.can) return 'Nudge has no road here: no room with a sandoq, and no world, was found.'
  await pressNudge($)
  const now = nudgeCardNow()
  return now.line !== '' ? now.line : now.read?.on === true ? `Nudge on, every ${now.read.every}.` : 'Nudge off.'
}

// A press on a name: its line shows under the row, or hides when it shows. A name the list does not hold shows nothing.
function showSecret($, name: string): void {
  secrets = secrets.open === name || !secrets.rows.some(row => row.name === name) ? { ...secrets, open: '' } : { ...secrets, open: name }
  $.ui.invalidate('ui.render')
}

// His desk (order DESK). `sandoq room desk list --json --all` is read when the desk opens, after a Done, and on the poll, the desk shown or at rest
// (the tray's count and the clear desk need it at rest): never on a timer of its own and never at a draw. A poll's read is quiet (no state of
// reading, a draw only when what it read differs), and the items stay drawn while a read runs.
// Done is one call, then the read again; a refusal is sandoq's one line under the row, and an item that is not for him is no call at all. The pane
// runs no put. An older sandoq has no `room desk`: its usage refusal gives no item and no line, and the open asks still show.
type DeskKept = { state: 'rest' | 'reading' | 'done'; items: DeskItem[]; lines: Record<string, string>; line: string; busy: string; opened: string; older: boolean }
const NO_DESK: DeskKept = { state: 'rest', items: [], lines: {}, line: '', busy: '', opened: '', older: false }
let desk: DeskKept = NO_DESK
let deskRun = 0
const NO_DESK_LINE = 'No sandoq was found for this room, so no item of the desk can be read.'
// The page of the page item that is open (order R3): read from the room's folder when the item opens, kept for that item alone.
let deskPageRead: PageRead | undefined
let deskPageRun = 0
const deskCardNow = (): DeskCard => ({ ...desk, ...(deskPageRead === undefined ? {} : { page: deskPageRead }), ...(keeperFold ? { fold: true } : {}), cannot: noSandoq() ? NO_DESK_LINE : '' })
const forgetDesk = (): void => {
  desk = NO_DESK
  keeperFold = false
  deskPageRead = undefined
  deskPageRun += 1
  deskRun += 1
  deskPolling = false
  deskAsked = false
  // A new session reads the desk as its first: that read only seeds.
  itemSeen.clear()
  deskSeeded = false
  bell = []
  // A new session reads what he took off by OK from the pane's own file again.
  keeperOk = new Set<string>()
  keeperOkRoot = undefined
  shapeSent.clear()
  // And the words he sent to the keeper that the walk did not hold yet, and the target that was the keeper's.
  chatSent = {}
  if (target === 'keeper') target = 'room'
  // And the time he has seen on the Shelf from its file: a new session reads the room as its first, which only seeds.
  shelfSeen = undefined
  shelfSeenRoot = undefined
  // And the sandoq's version for the room app (order O1) and the band's need, asked again at the pane's start.
  roomApp = undefined
  roomAppFault = ''
  appOpened = ''
}
// The page of the desk's list a letter was opened from, so its `‹ Desk` lands on the same page.
let deskPageKept = 0
// A read of the desk by the poll is out: the next poll starts none until it ends.
let deskPolling = false
// The desk was asked for (opened by a press or a tool), not only the place the session began on: the terminal draws it then, and not before.
let deskAsked = false

async function readDesk($, quiet = false): Promise<void> {
  if (noSandoq()) return
  const fault = readFault.make?.('his desk')
  if (fault !== undefined) throw fault
  const run = (deskRun += 1)
  if (!quiet) {
    desk = { ...desk, state: 'reading' }
    $.ui.invalidate('ui.render')
  }
  const before = JSON.stringify(desk)
  let items: DeskItem[] | undefined
  let older = false
  let line = ''
  try {
    const got = await runWithin($, deskListArgv(host), LIMIT.poll, 'sandoq room desk list')
    const err = String(got.stderr ?? '')
    if (got.exitCode === 0) {
      items = parseDeskList(String(got.stdout ?? ''))
      if (items === undefined) line = 'The pane could not read the list sandoq gave.'
    } else if (noDeskVerb(got.exitCode, err)) {
      items = []
      older = true
    } else {
      line = scrub(lastLineOf(err)) || `sandoq room desk list exited ${got.exitCode ?? 'with no code'}.`
    }
  } catch (error) {
    line = isUnanswered(error) ? 'sandoq did not answer in time; the desk is as it was.' : 'sandoq room desk list did not run.'
  }
  if (run !== deskRun) return
  const kept = items ?? desk.items
  const open = new Set(kept.filter(item => !item.done).map(item => item.id))
  desk = { ...desk, state: 'done', items: kept, older, line, opened: open.has(desk.opened) ? desk.opened : '', lines: Object.fromEntries(Object.entries(desk.lines).filter(([id]) => open.has(id))) }
  // The doorbell (order T2): the first read of the desk only seeds; after it an item new and for him rings once, from this same read. A read that
  // gave no list (a refusal, a time out) seeds nothing and rings nothing.
  if (items !== undefined) {
    if (deskSeeded) bell.push(...freshRings(kept, itemSeen))
    for (const item of kept) itemSeen.add(item.id)
    deskSeeded = true
    ringBell($)
  }
  // An item opened from the list that is gone from it (done by its Done, or by another hand) leaves its card: the desk stands again.
  if (nav.view === 'desk' && nav.item !== undefined && !open.has(nav.item)) await openNav($, { view: 'desk', ...(nav.pile === undefined ? {} : { pile: nav.pile }), ...(nav.group === undefined ? {} : { group: nav.group }) })
  if (!quiet || JSON.stringify(desk) !== before) $.ui.invalidate('ui.render')
}

// Done of an item: his alone. An item that is for a seat, or is not on the desk, makes no call; its line says so. One call at a time. A refusal of
// sandoq is its one line under the row, and the desk is read again either way.
async function doneDesk($, id: string): Promise<void> {
  const item = desk.items.find(one => one.id === id)
  if (noSandoq() || desk.busy !== '' || !isDeskId(id) || item === undefined || item.done) return
  if (!item.canDone) {
    desk = { ...desk, lines: { ...desk.lines, [id]: `This item is for ${item.for === '' ? 'no one' : item.for}, not for you.` } }
    $.ui.invalidate('ui.render')
    return
  }
  desk = { ...desk, busy: id, lines: Object.fromEntries(Object.entries(desk.lines).filter(([key]) => key !== id)) }
  $.ui.invalidate('ui.render')
  const done = await runLine($, deskDoneArgv(host, id), 'sandoq room desk done', LIMIT.send)
  desk = { ...desk, busy: '', ...(done.failed === '' ? {} : { lines: { ...desk.lines, [id]: done.failed } }) }
  // His Done that stood is the row changing in place and no news; one that failed rings too, its line under the row as well (order T2).
  if (done.failed !== '') $.ui.toast(fit(`room: ${done.failed}`, TOAST_COLS), { timeoutMs: 15000 })
  await readDesk($)
}

// The page of a page item (order R3), read when the item opens: PATH of `page:PATH` under the room's folder (the folder that holds its mark), through
// the host's read as the pane's other files are read. A path that is absolute or steps above the folder is refused with one line and nothing is read;
// a file that is not there, one that is empty and one that fails to read each say so. The text is kept for this item alone; a read of another item
// that began later wins.
async function readPage($, id: string): Promise<void> {
  const item = desk.items.find(one => one.id === id && !one.done)
  const named = item === undefined ? undefined : pagePathOf(item.origin)
  if (item === undefined || named === undefined) return
  const run = (deskPageRun += 1)
  const say = (page: PageRead): void => {
    if (run !== deskPageRun) return
    deskPageRead = page
    $.ui.invalidate('ui.render')
  }
  if (named.refused !== undefined) return say(pageLine(id, item.origin, named.refused))
  // An image, a video or a sound is never read (order O4: it may be 2 GB), nor is an svg, html or pdf: the item says what it is, with no file touched.
  const kind = pageKindOf(named.path)
  if (kind === 'image' || kind === 'video' || kind === 'sound') return say(pageMedia(id, item.origin, kind))
  if (kind === 'other') return say(pageLine(id, item.origin, PAGE_OTHER))
  const folder = host.depth === undefined ? '' : (foldersUp(host.session)[host.depth] ?? '')
  if (folder === '') return say(pageLine(id, item.origin, PAGE_NO_FOLDER))
  say({ item: id, state: 'reading', path: named.path, text: '', line: '' })
  const io = ioOf($)
  const whole = `${folder.replace(/\/+$/, '')}/${named.path}`
  const path = relativeTo(host.session, whole)
  try {
    if (!(await io.exists(path))) return say(pageLine(id, item.origin, pageMissing(named.path)))
    // A text page over PAGE_MOST is not read: the size is the one the listing of its folder gives; with no size the page is read as it was.
    const at = whole.lastIndexOf('/')
    const size = (await listEntries(io, host, whole.slice(0, at))).find(entry => entry.name === whole.slice(at + 1))?.size
    if (size !== undefined && size > PAGE_MOST) return say(pageLine(id, item.origin, PAGE_TOO_BIG))
    const text = await io.read(path)
    if (typeof text !== 'string') return say(pageLine(id, item.origin, pageFailed(named.path)))
    say(text.trim() === '' ? pageLine(id, item.origin, pageEmpty(named.path)) : { item: id, state: 'done', path: named.path, text, line: '' })
  } catch {
    say(pageLine(id, item.origin, pageFailed(named.path)))
  }
}

// An origin opens by its kind: a card in the feed, a record in its profile, a web page in his browser (the item `id` is then said opened, when the
// opener of the system ran); a page of the run and any other origin open nothing (no file path ever opens from the pane).
async function openOrigin($, origin: string, id = ''): Promise<void> {
  const found = originOf(origin)
  if (found.kind === 'card') await openCardFeed($, found.value)
  else if (found.kind === 'record') await openNav($, { view: 'profile', recordId: found.value })
  else if (found.kind === 'https') {
    const ran = await openPage($, found.value, 'the page of the desk item')
    if (ran && id !== '' && desk.items.some(item => item.id === id && !item.done)) {
      desk = { ...desk, opened: id }
      $.ui.invalidate('ui.render')
    }
  }
}

// THE ROOM APP (orders O1, O2): "Open in the room app ›" on a letter opened from the desk, and on its Walk tab (the walk, or a row of it). The press stands only where the room's sandoq has the verb
// `room open`, so the pane reads `sandoq --version` once for the sandoq it runs (at the pane's start, after the first read of the room, and again when
// a letter from the desk opens if that answer did not come) and compares it with ROOM_APP_FROM of host.ts. A press runs the verb through the host's run with ROOM_APP_LIMIT
// ms: exit 0 says the letter opened in the app (the press's own words turn to Opened), any other end is ONE toast with the verb's first line of error, or
// that this sandoq has no room app yet. The pane starts no browser: the verb opens it.
// The version said is kept (order O3), so each verb compares it with its own release: ROOM_APP_FROM for the letter and the walk, ROOM_PAGE_FROM for the page.
let roomApp: { sandoq: string; said: string } | undefined
// Why the last read of the version kept nothing ('' while it is kept or none was asked): the Files part says it in one dim line.
let roomAppFault = ''
let appOpened = ''

const roomAppFrom = (from: string): boolean => roomApp !== undefined && roomApp.sandoq === host.sandoq && roomAppHas(roomApp.said, from) && roomOpenArgv(host, 'letter', 'a') !== undefined
const roomAppNow = (): boolean => roomAppFrom(ROOM_APP_FROM)
const roomPageNow = (): boolean => roomAppFrom(ROOM_PAGE_FROM)

async function readRoomApp($): Promise<void> {
  const sandoq = host.sandoq ?? ''
  if (sandoq === '' || roomApp?.sandoq === sandoq) return
  try {
    const run = await runWithin($, roomAppVersionArgv(host), LIMIT.open, 'sandoq --version')
    const said = run.exitCode === 0 ? String(run.stdout ?? '') : ''
    // A read that gave no version is not kept for the path: it is asked again at the next read that needs it (a shelf read, a letter of the desk).
    if (!/\d+\.\d+\.\d+/.test(said)) {
      roomAppFault = VERSION_UNSAID_LINE
      return
    }
    roomApp = { sandoq, said }
    roomAppFault = ''
  } catch (error) {
    roomAppFault = isUnanswered(error) ? VERSION_LATE_LINE : VERSION_NOT_RUN_LINE
    return
  }
  $.ui.invalidate('ui.render')
}

// The band's one line for a sandoq under PANE_NEEDS_SANDOQ (host.ts), from the version read above: none before that read, none for a sandoq it did not name.
const needLine = (): string => (roomApp !== undefined && roomApp.sandoq === host.sandoq ? paneNeedsLine(roomApp.said) : '')

// A walk (order O2) opens at a block when it is given one the verb can take; a block that cannot be named (not of the plain word shape) opens the
// walk at its top, as a row with no id does. appOpened is `KIND:ID`, so the press of the tab whose kind opened says Opened, and the other does not.
// A page (order O3) has its path for the id (`page:PATH`, the clean path), so the item pressed says Opened and no other page does.
async function openInApp($, kind: RoomKind, id: string, block?: string): Promise<void> {
  const argv = roomOpenArgv(host, kind, id, block) ?? (block === undefined ? undefined : roomOpenArgv(host, kind, id))
  if (argv === undefined || !(kind === 'page' ? roomPageNow() : roomAppNow())) return
  let why = ''
  try {
    const run = await runWithin($, argv, ROOM_APP_LIMIT, 'sandoq room open')
    if (run.exitCode === 0) {
      appOpened = `${kind}:${kind === 'page' ? (roomPagePath(id) ?? id) : id}`
      $.ui.invalidate('ui.render')
      return
    }
    why = roomOpenWhy(run.exitCode, String(run.stderr ?? ''))
  } catch (error) {
    why = isUnanswered(error) ? error.message : scrub(String(error)).slice(0, 160)
  }
  $.ui.toast(`room: ${scrub(why).slice(0, 160)}`)
}

// A file of a seat's shelf, or the list of a seat's files or of every seat's (order shelf-files), opens in the room app by `room open NAME file|files ...`. The press
// stands only where the room's sandoq has the kinds (SHELF_FILES_FROM); a refused open is one toast with the first line of what the verb said.
async function openShelfFiles($, argv: string[] | undefined): Promise<void> {
  if (argv === undefined || !roomAppFrom(SHELF_FILES_FROM)) return
  let why = ''
  try {
    const run = await runWithin($, argv, ROOM_APP_LIMIT, 'sandoq room open')
    if (run.exitCode === 0) return
    why = roomOpenWhy(run.exitCode, String(run.stderr ?? ''))
  } catch (error) {
    why = isUnanswered(error) ? error.message : scrub(String(error)).slice(0, 160)
  }
  $.ui.toast(`room: ${scrub(why).slice(0, 160)}`)
}

const versionsCardNow = ($): VersionsCard => {
  const discs = discsOf(snap.discsText)
  const rest: Step[] = [stepOf('pane', '', VERSION), ...discs.map(disc => stepOf('disc', disc.name, disc.version === '' ? 'none' : disc.version))]
  const steps = table.steps.length === 0 ? rest : paneStepOf(table.steps) !== undefined ? table.steps : [rest[0], ...table.steps]
  const door = table.door
  const waiting = steps.filter(step => step.noun === 'disc' && waits(step)).length
  return {
    pane: VERSION,
    discs,
    state: check.state,
    at: check.at,
    results: check.results,
    cannot: noSandoq() ? NO_CHECK : '',
    update,
    onUpdate: () => {
      void updatePane($)
    },
    older: table.older || ran.older === true,
    table: {
      steps,
      loaded: VERSION,
      door,
      long: door === 'would-restart' && mayTakeLong(limitOf('room', Math.max(1, waiting), true)),
      // No rows here: views/pane.tsx fills them from the frame's one count (canvasRowsOf, less the Back link), and gives none when the
      // host gave no rows, so the card has no limit and no pages, as the cards of the pane have none.
      page: tablePage,
      ...(running === undefined ? {} : { running }),
      ...(ran.refused === undefined ? {} : { refused: ran.refused }),
      ...(ran.said === undefined ? {} : { said: ran.said }),
      unfolded: tableFold,
      linesPage: tableLinesPage,
      doorNotUp: ran.doorNotUp,
      notes: [...table.notes, ...ran.notes],
      onUpdate: name => {
        void pressUpdate($, { kind: 'room', name })
      },
      onUpdatePane: () => {
        void pressUpdate($, { kind: 'pane' })
      },
      onStartDoor: () => {
        void startTheDoor($)
      },
      onUnfold: () => {
        tableFold = !tableFold
        tableLinesPage = 0
        $.ui.invalidate('ui.render')
      },
      onLinesPage: page => {
        tableLinesPage = page
        $.ui.invalidate('ui.render')
      },
      onPage: page => {
        tablePage = page
        $.ui.invalidate('ui.render')
      },
    },
  }
}

// The files of one folder that end in .md, by name, read again only when new or changed; no folder means none.
async function readFolder(io: Io, dir: string, only: (name: string) => boolean): Promise<Record<string, string>> {
  let cache = folderCaches.get(dir)
  if (cache === undefined) {
    cache = new Map()
    folderCaches.set(dir, cache)
  }
  const entries = (await listEntries(io, host, dir)).filter(entry => only(entry.name))
  await readCached(io, host, dir, entries, cache, new Set(entries.map(entry => entry.name)))
  const files: Record<string, string> = {}
  for (const entry of entries) {
    const kept = cache.get(entry.name)
    if (kept !== undefined) files[entry.name] = kept.text
  }

  return files
}

// The discs of the room as `sandoq room discs` named them (order RD1), from the room's own folder, no flag, nothing written. The call is
// made ONCE at a session start and ONCE after an update run ends, never at a poll: `discsWanted` says one is owed, and the next read
// of the room makes it. Its answer stays in memory (`roomDiscs`); a session start forgets it. No answer (an older sandoq, a room not
// born, a call past its limit or one that threw) leaves it undefined, and readLayouts reads class.md as before. A call that a
// session start passed while it ran changes nothing when it comes back (`discsRun`).
const roomDiscsArgv = (host: Host): string[] => inRunArgv(host, [host.sandoq ?? '', 'room', 'discs'])
let roomDiscs: string[] | undefined
let discsWanted = true
let discsRun = 0
async function askRoomDiscs($): Promise<void> {
  if (!discsWanted || noSandoq()) return
  discsWanted = false
  const run = discsRun
  let names: string[] | undefined
  try {
    const answer = await runWithin($, roomDiscsArgv(host), LIMIT.discs, 'sandoq room discs')
    names = roomDiscNamesOf(answer.stdout ?? '', answer.exitCode)
  } catch {
    names = undefined
  }
  if (run === discsRun) roomDiscs = names
}

// The layers, in the order they are looked at (the pane has none of its own): the room's own layouts (shelves/room/egress),
// then each disc's egress/ folder, the later disc of the room's `discs` list (the call's names where it gave them, else its
// class.md) before the earlier, and room-seat last when it carries one and is not in the list. Each disc's class file comes
// along, for the roles' ches. A disc's files are named by their path under unpacked/.
async function readLayouts(io: Io, root: string): Promise<Record<string, string>> {
  const isMd = (name: string): boolean => name.endsWith('.md')
  const files = await readFolder(io, `${root}/shelves/room/egress`, isMd)
  const names = roomDiscs ?? discNamesOf(await readText(io, host, `${root}/shelves/room/class.md`))
  const looked = [...names].reverse()
  if (!names.includes('room-seat')) looked.push('room-seat')
  for (const disc of looked) {
    const layouts = await readFolder(io, `${root}/unpacked/${disc}/egress`, isMd)
    for (const [file, text] of Object.entries(layouts)) files[`${disc}/egress/${file}`] = text
  }
  for (const disc of names) {
    const classes = await readFolder(io, `${root}/unpacked/${disc}/shelf`, name => name === 'class.md')
    for (const [file, text] of Object.entries(classes)) files[`${disc}/shelf/${file}`] = text
  }

  return files
}

// The room's own background (order BG) from the listing of the room's shelf the poll takes anyway: none when the shelf holds no
// background.svg or the file cannot be read (never a fault); else the reading of backgroundOf. The file is read again ONLY when its size
// or its change time moved, or the room did; a file over the most is refused by its size and never read. A listing that gives neither
// size nor time cannot say it did not change, so the file is read at each poll (the signature draws again only when its text changed).
async function readBackground(io: Io, listing: FileEntry[]): Promise<Background | undefined> {
  const entry = listing.find(item => item.name === BACKGROUND_FILE)
  if (entry === undefined) {
    backgroundKept = undefined
    wallSha = ''
    return undefined
  }
  const kept = keptFor(backgroundKept, host.root, entry)
  if (kept !== undefined) return kept
  let background: Background
  wallSha = ''
  if (entry.size !== undefined && entry.size > BACKGROUND_MOST) background = backgroundOf('', entry.size)
  else {
    const text = await readText(io, host, backgroundPath(host))
    // a read that failed (no text for a file that has a size) is no file: the next poll reads it again
    if (text === '' && (entry.size ?? 1) > 0) {
      backgroundKept = undefined
      return undefined
    }
    background = backgroundOf(text, entry.size ?? bytesOfText(text))
    // the text is over the most when its size was not told: it is not hashed either
    if (bytesOfText(text) <= BACKGROUND_MOST) wallSha = sha256Of(text)
  }
  backgroundKept = { root: host.root, size: entry.size, mtimeMs: entry.mtimeMs, background }
  return background
}

// FILES ON THE SHELF (order shelf-files). The pane runs `sandoq shelf list --json` for the seats that have files and `sandoq shelf list SEAT --json` for
// the list of a seat, as its own processes; it walks no folder and reads no file of a shelf. It runs only with the shelf window open (the moments the
// seats' shelves are read), with no clock of its own. The lists are those of the first SEATS_READ_MOST seats of the answer and of the seat whose shelf
// is open, and a list is read again only when its seat's count or newest time moved. A sandoq under SHELF_FILES_FROM runs nothing and the Files part says
// so in one line; its version is the one read for the room app (readRoomApp), asked again at a shelf read while none is kept, and a sandoq not found, a
// version not said, not answered or not run is one line each. A refusal, bad words or a call that did not answer is one line, shown whole. With no shelf
// open the last reading of this room stands.
async function readFiles($, root: string, withSeats: boolean): Promise<ShelfFilesRead> {
  const kept = filesKept?.root === root ? filesKept : undefined
  // with no shelf open nothing is drawn: the last reading stands. With it open, no way to stop is silent: each says its one line.
  if (!withSeats) return kept?.read ?? NO_FILES
  const stop = (line: string): ShelfFilesRead => ({ ...NO_FILES, read: true, line })
  if (noSandoq()) return stop(NO_SANDOQ_LINE)
  await readRoomApp($)
  const said = roomApp !== undefined && roomApp.sandoq === host.sandoq ? roomApp.said : ''
  if (!/\d+\.\d+\.\d+/.test(said)) return stop(roomAppFault !== '' ? roomAppFault : VERSION_UNSAID_LINE)
  if (!roomAppHas(said, SHELF_FILES_FROM)) return stop(oldLine(SHELF_FILES_FROM))
  let seats: ShelfFilesRead
  try {
    const got = await runWithin($, shelfSeatsArgv(host), LIMIT.poll, 'sandoq shelf list')
    if (got.exitCode !== 0) return stop(scrub(refusalLine(String(got.stderr ?? ''), got.exitCode)))
    const parsed = parseSeats(String(got.stdout ?? ''))
    if (!parsed.ok) return stop(parsed.line)
    seats = { ...NO_FILES, read: true, seats: parsed.value.seats, total: parsed.value.total }
  } catch (error) {
    return stop(isUnanswered(error) ? 'sandoq did not answer in time; the files are as they were.' : 'sandoq shelf list did not run.')
  }
  const open = nav.view === 'shelf' || nav.view === 'profile' ? (nav.of ?? '') : ''
  const wanted = [...new Set([...seats.seats.slice(0, SEATS_READ_MOST).map(one => one.seat), ...(open === '' ? [] : [open])])]
  const stamps: Record<string, string> = {}
  const lists: Record<string, SeatList> = {}
  await Promise.all(
    wanted.map(async seat => {
      const count = seats.seats.find(one => one.seat === seat)
      const stamp = count === undefined ? '' : `${count.count}:${count.newest}`
      const before = kept?.read.lists[seat]
      if (stamp !== '' && kept?.stamps[seat] === stamp && before !== undefined) {
        stamps[seat] = stamp
        lists[seat] = before
        return
      }
      const argv = shelfListArgv(host, seat)
      if (argv === undefined) {
        lists[seat] = { line: SEAT_UNFIT_LINE, total: 0, files: [] }
        return
      }
      try {
        const got = await runWithin($, argv, LIMIT.poll, 'sandoq shelf list SEAT')
        if (got.exitCode !== 0) {
          lists[seat] = { line: scrub(refusalLine(String(got.stderr ?? ''), got.exitCode)), total: 0, files: [] }
          return
        }
        const parsed = parseList(String(got.stdout ?? ''), seat)
        if (!parsed.ok) lists[seat] = { line: parsed.line, total: 0, files: [] }
        else {
          lists[seat] = { line: '', total: parsed.value.total, files: parsed.value.files }
          stamps[seat] = stamp
        }
      } catch (error) {
        lists[seat] = { line: isUnanswered(error) ? 'sandoq did not answer in time; the files are as they were.' : 'sandoq shelf list did not run.', total: 0, files: [] }
      }
    }),
  )
  const read = { ...seats, lists }
  filesKept = { root, read, stamps }
  return read
}

// The feed of the room: its file in the run's feed folder, named for the gate. No file is no entry; a file that is there and could not be read is none (the toasts
// wait for the next read and the view keeps what it showed).
async function readFeed(io: Io, dir: string): Promise<FeedEntry[] | undefined> {
  if (dir !== feedDir) {
    feedCache.clear()
    feedParsed = undefined
  }
  feedDir = dir
  const name = `${host.gate}.md`
  const listed = (await listEntries(io, host, dir)).filter(entry => entry.name === name)
  await readCached(io, host, dir, listed, feedCache, new Set([name]))
  if (listed.length === 0) return []
  const text = feedCache.get(name)?.text
  if (text === undefined) return undefined
  if (feedParsed?.text !== text) feedParsed = { text, entries: parseFeed(text) }
  return feedParsed.entries
}

// Each part of the read is taken apart (takeApart): one that throws gives its empty value, is named in `said`, and the rest is read.
async function readSnapshot($, isRoom: boolean, withDiscs: boolean, withSeats: boolean, said: Said[]): Promise<Snapshot> {
  const ROOT = host.root
  const io = ioOf($)
  if (ROOT === '' || !(await has(io, host, ROOT))) return emptySnap()
  // Every walk of the gate is read once and again only when its size changed; the shown cards are the
  // newest of them, and the turn, the profiles and the shelf read the rest for their card counts. A
  // listing with no size reads the newest SHOWN_CARDS again at each poll, as a live card is still written.
  const dir = `${ROOT}/walks/${host.gate}`
  if (dir !== walkDir) walkCache.clear()
  walkDir = dir
  const { files, names, walks, cards } = await takeApart(
    $,
    said,
    'the walks',
    () => ({ files: [] as FileEntry[], names: [] as string[], walks: [] as WalkText[], cards: [] as Card[] }),
    async () => {
      const files = (await listEntries(io, host, dir)).filter(entry => CARD_FILE.test(entry.name))
      const names = files.map(entry => entry.name)
      await readCached(io, host, dir, files, walkCache, new Set(newestIds(names).map(id => `${id}.md`)))
      const walks: WalkText[] = names.sort().map(name => ({ id: name.replace(/\.md$/, ''), text: walkCache.get(name)?.text ?? '' }))
      // The reads of the walks the model keeps (model/walkread.ts) are those of the walks that stand: one that is gone is dropped.
      keepWalks(walks)
      const cards: Card[] = []
      for (const id of newestIds(names, shown)) {
        const raw = walkCache.get(`${id}.md`)?.text ?? ''
        const walk = parseWalk(raw)
        cards.push({ id, text: walk.text, raw, walk })
      }
      return { files, names, walks, cards }
    },
  )
  const { records, entries } = await takeApart(
    $,
    said,
    'the catalog',
    () => ({ records: [] as ShelfRecord[], entries: [] as CatalogEntry[] }),
    async () => {
      const catalog = await readText(io, host, `${ROOT}/shelves/room/index.md`)
      return { records: parseCatalog(catalog), entries: parseCatalogEntries(catalog) }
    },
  )
  const versions = await takeApart($, said, 'the versions', () => '', () => readText(io, host, `${ROOT}/versions.md`))
  const discs = await takeApart($, said, 'the disc records', () => [] as Disc[], () => readDiscs(io, host))
  await askRoomDiscs($)
  const roomFiles = await takeApart($, said, 'the layouts', () => ({}) as Record<string, string>, () => readLayouts(io, ROOT))
  const taps = await takeApart(
    $,
    said,
    'the taps',
    () => [] as PendingTap[],
    async () => (await readTapFiles(io, host)).flatMap(file => pendingTaps(file.cardId, file.text)),
  )
  const rulesText = await takeApart($, said, 'the rules', () => '', () => readText(io, host, rulesPath(host)))
  const seatsText = await takeApart($, said, 'the seats', () => '', () => readText(io, host, seatsPath(host)))
  // The Room place alone: the door's tick, the discs, a file a program (the feed's poll reads none of them; seats.md it reads, as
  // the seat face and the level up need it). The Settings place reads discs.md too: its Versions card names each disc of the room
  // with its version.
  const { tickText, discsText, programTexts } = await takeApart(
    $,
    said,
    "the Room place's files",
    () => ({ tickText: '', discsText: '', programTexts: {} as Record<string, string> }),
    async () => ({
      tickText: isRoom ? await readText(io, host, tickPath(host)) : '',
      discsText: isRoom || withDiscs ? await readText(io, host, discsPath(host)) : '',
      programTexts: isRoom ? await readFolder(io, programsPath(host), name => name.endsWith('.md')) : {},
    }),
  )
  // The listing of the room's shelf: the Room place sums its sizes (with the walks'), and the poll looks in it for background.svg.
  const { shelf, bytes } = await takeApart(
    $,
    said,
    'the shelf listing',
    () => ({ shelf: [] as FileEntry[], bytes: undefined as number | undefined }),
    async () => {
      const shelf = await listEntries(io, host, shelfPath(host))
      return { shelf, bytes: isRoom ? bytesOf([files, shelf]) : undefined }
    },
  )
  const background = await takeApart($, said, 'the background', () => undefined as Background | undefined, () => readBackground(io, shelf))
  // The shelves under shelves/ (order P7, C3): a seat's shelf is shelves/PART/, read only where two or more shelves stand, and only the
  // files that name what stands in it (index.md where one is, told.md, themes/*.md); never its prompt. The files are read again only when
  // their size or time moved (readFolder). The theme in use is the newest whose sha256 is the wall's.
  const { shelfNames, seatShelves } = await takeApart(
    $,
    said,
    'the shelves',
    () => ({ shelfNames: [] as string[], seatShelves: {} as Record<string, SeatShelf> }),
    async () => {
      // a listing that names the files below a folder (room/index.md) names the folder by its first part
      const shelfNames = [...new Set((await listEntries(io, host, shelvesPath(host))).map(entry => entry.name.split('/')[0]))]
      const seatShelves: Record<string, SeatShelf> = {}
      const whose = whoseOf(shelfNames)
      if (whose.length < 2) {
        seatsKept = undefined
        return { shelfNames, seatShelves }
      }
      // with no shelf open no seat file is read: the last reading of this room stands, for the seats that still stand
      if (!withSeats) {
        const kept = seatsKept?.root === ROOT ? seatsKept.seatShelves : {}
        for (const { name } of whose.filter(shelf => !shelf.own)) if (kept[name] !== undefined) seatShelves[name] = kept[name]
        return { shelfNames, seatShelves }
      }
      for (const { name } of whose.filter(shelf => !shelf.own)) {
        const files = await readFolder(io, seatShelfPath(host, name), file => file === 'index.md' || file === 'told.md')
        const themes = await readFolder(io, themesPath(host, name), file => file.endsWith('.md'))
        seatShelves[name] = { entries: parseCatalogEntries(files['index.md'] ?? ''), told: toldOf(files['told.md'] ?? ''), themes: themesOf(Object.values(themes), wallSha) }
      }
      seatsKept = { root: ROOT, seatShelves }
      return { shelfNames, seatShelves }
    },
  )
  // The files of the shelf (order shelf-files): the CLI lists them, read where the seats' shelves are read, the shelf window open, and at no other moment.
  const shelfFiles = await takeApart($, said, 'the files of the shelf', () => NO_FILES, () => readFiles($, ROOT, withSeats))
  const feed = await takeApart($, said, 'the feed', () => undefined as FeedEntry[] | undefined, () => readFeed(io, `${ROOT}/feed`))
  return {
    exists: true,
    feed,
    background,
    shelfNames,
    seatShelves,
    shelfFiles,
    cards,
    total: names.length,
    records,
    entries,
    versions,
    discs,
    walks,
    roomFiles,
    taps,
    rulesText,
    seatsText,
    tickText,
    discsText,
    programTexts,
    ...(bytes === undefined ? {} : { bytes }),
  }
}

// The line said when the room is missing or has no folder yet.
const noFolder = (): string =>
  host.mode === 'none' ? `room: ${NO_ROOM}` : `room: no room folder found (looked in ${host.root})`

const itemEntry = (name: string): CatalogEntry | undefined =>
  snap.entries.find(entry => entry.name === name) ??
  snap.entries.find(entry => stripUlid(entry.name).toLowerCase() === name.trim().toLowerCase())

async function doItem($, nameArg: string): Promise<string> {
  await poll($)
  if (!snap.exists) return noFolder()
  const entry = itemEntry(nameArg)
  if (nameArg.trim() === '' || entry === undefined) return `room: no record named "${nameArg.trim()}" on the shelf`
  const view = buildItem(entry, snap.walks)
  return itemLines(view).join('\n')
}

// Does this card's ask wait on him, as the lens he looks through sees it: a card the harness sent has asks that wait on nobody
// in Public and Trace (the rule of model/seat.ts), and under Operator they show as they are.
const waitsHere = (card: Card): boolean => card.walk.waiting && waitsOnHim(card.walk.source, face)

// Toast once per new answer and once per new ask; the first read only seeds.
// Only the newest SHOWN_CARDS speak: the older cards that "older" reads are not news. An ask that waits on nobody (a card of
// the harness, seen through Public) is seen and says nothing: the lens he turns to later does not bring it back as news.
// A toast is WHO: WHAT and names the ASK, never the first words of the card: an answer says the ask's words and the choice that
// stood, a new ask its seat (the instance the card was handed to, else the room) and its words, a keeper pick the ask and the
// keeper's note. Where an ask has no words of its own, the card's first words stay.
// The doorbell (order T2): a new ask and a keeper pick are not toasted here but put in `bell`, with the desk's new items of the same read, and
// ringBell says them as one toast. An answer after his own tap (`tapped`) is the row changing in place and no news: it is seen and says nothing.
function announce($, next: Snapshot) {
  const latest = next.cards.slice(0, SHOWN_CARDS)
  for (const card of latest) {
    if (!card.walk.answered || answerSeen.has(card.id)) continue
    answerSeen.add(card.id)
    const stood = gatesOf(card.raw).filter(gate => gate.decision !== undefined && gate.question !== '').at(-1)
    if (isSeeded && !tapped.has(card.id)) $.ui.toast(stood?.decision === undefined ? `room: "${preview(card.text)}" answered` : `room: ${preview(stood.question)} ${stood.decision.choice}`)
  }
  for (const card of latest) {
    if (!card.walk.waiting) continue
    const key = `${card.id}:${card.walk.question}`
    if (askSeen.has(key)) continue
    askSeen.add(key)
    if (isSeeded && waitsHere(card)) bell.push({ who: card.walk.handedTo || 'room', text: card.walk.question === '' ? card.text : card.walk.question })
  }
  // The keeper's pick of an ask, once a pick.
  for (const card of latest) {
    const gates = gatesOf(card.raw)
    for (const pick of keeperPicks(card.raw)) {
      const key = `${card.id}:${pick.id || pick.name}`
      if (pickSeen.has(key)) continue
      pickSeen.add(key)
      if (!isSeeded || !waitsOnHim(card.walk.source, face)) continue
      const gate = gates.find(item => item.decision?.id === pick.id)
      bell.push(keeperRing(pick.name, gate === undefined || gate.question === '' ? card.text : gate.question, gate?.decision?.why ?? ''))
    }
  }
  announceFeed(next.feed)
  isSeeded = true
}

// The answers of the room's feed (order room-feed, part A): each answer whose `to` holds desk/toasts rings once by its id, its WHO the entry's sayer and its line the
// entry's text (bellLine fits it to TOAST_COLS), and a run of faults rings once. The first read of the feed only seeds: the answers already there ring nothing. A
// read that gave no feed (the file was there and could not be read) changes nothing.
function announceFeed(entries: FeedEntry[] | undefined): void {
  if (entries === undefined) return
  const fresh = freshFeed(entries, feedSeen)
  if (feedSeeded) bell.push(...fresh.rings)
  for (const id of fresh.ids) feedSeen.add(id)
  feedSeeded = true
}

// One read, one toast: what the read put in `bell` (a new ask, a keeper pick, a new item of the desk for him) is said as one line, or folded
// as `desk: N new, waits on you`. The kit's toast takes no press, so it is words alone.
function ringBell($) {
  if (holding.size > 0) return
  const line = bellLine(bell)
  bell = []
  if (line !== '') $.ui.toast(line)
}

// What the snapshot DRAWS, for the signature: every redraw hands the app the scene's Svg again, so a file that moves and
// draws nothing must not redraw. What the Room place reads of the door and the programs is taken as the words it draws
// (the time as it reads, the counts, the cents, a program's state and its HH:MM, the size as KB or MB) and never as the
// bytes of the file: a living door rewrites logs/tick.md at each take and a program its file at its start and its end.
function drawnOf(next: Snapshot, now: number): unknown {
  const { tickText, discsText, programTexts, bytes, walks, background, feed, ...rest } = next
  const room =
    nav.view !== 'room'
      ? null
      : {
          door: doorOf(tickText, isLocal() && (doorState === 'up' || doorFound), now, zoneOf()),
          discs: discsOf(discsText),
          programs: programsOf(Object.keys(programTexts).sort().map(name => programTexts[name]), zoneOf()),
          size: sizeOf(bytes),
          // the feed card draws each entry's sayer, kind, first line and where it went; the room card its count
          feed: (feed ?? []).map(entry => `${entry.id}:${whereWords(entry)}`),
        }
  if (room?.door.usdToday !== undefined) room.door.usdToday = Math.round(room.door.usdToday * 100) / 100
  // the desk draws a row for each open shape ask and the gate view its decided block, whatever place is open
  const shapes = shapeAsks(feed).map(ask => `${ask.id}:${ask.decided?.choice ?? ''}`)
  return { ...rest, walks: walks.map(walk => `${walk.id}:${walk.text.length}`), background: backgroundKey(background), room, shapes }
}

// Redraw only when what is drawn changed. What asks the host to draw the pane while nobody acts is this poll alone (a
// word it draws moved: a card, a wait, the minute for the ages and the plate's clock, and in the Room place the door's
// and the programs' words), the door's start and its stop, and the clock of 5 seconds that puts the door up. A draw
// hands the app the scene's same element (views/scene.tsx), so none of them loads a picture again. What the pane cannot
// see is a draw the host makes of its own accord: the foot of the Operator lens counts every call of the render
// (model/draws.ts), those too.
async function poll($) {
  if (isBusy) return
  if (readsOut.size >= READS_OUT_MAX) {
    if (!heldSaid) {
      heldSaid = true
      late = HELD
      lateCount += 1
      $.ui.invalidate('ui.render')
    }
    return
  }
  isBusy = true
  if (findHold > 0) findHold -= 1
  const token = { dead: false, before: lateCount }
  reading = token
  readsOut.add(token)
  holding.add(token)
  try {
    await within(
      $,
      LIMIT.poll,
      'the read of the room',
      readRoom($, token).finally(() => {
        readsOut.delete(token)
        holding.delete(token)
        if (readsOut.size < READS_OUT_MAX) heldSaid = false
      }),
    )
  } catch (error) {
    // A read that failed or passed its limit holds the bell no longer (a stuck read never mutes it).
    holding.delete(token)
    // A read past its limit is said, and its late answer dropped; the next tick reads again, as it does after a half-written
    // file or a folder that vanished.
    // Any other error is said as the read of the room, and the read is over: the pane stops saying it reads. A poll that a session
    // start has dropped (reading is no longer its token) says nothing: its error is of the session that ended.
    if (reading === token) {
      if (noteLate(error)) token.dead = true
      else {
        noteRead({ part: 'the room', error })
        isRead = true
      }
      $.ui.invalidate('ui.render')
    }
  } finally {
    // A session that started meanwhile has set the poll free already: this one leaves the flag as it is.
    if (reading === token) {
      reading = undefined
      isBusy = false
    }
  }
}

// The knock of the poll (order MR, R4): in a marked room the poll knocks at the door about each 30 s, ALWAYS, whatever the pane started or
// said: a door that stands takes the line of a start that was refused and its Button away. The time is a timer of the pane's clock, armed
// at the first read of a marked room and again at each knock; a session start forgets it (`knockRun`: a timer of an older session sets
// nothing). One knock is one process and no more: none while a start runs or a door is held by the old road.
const KNOCK_MS = 30000
let knockArmed = false
let knockDue = false
let knockRun = 0

const armKnock = ($): void => {
  knockArmed = true
  const run = knockRun
  $.clock.after(KNOCK_MS, () => {
    if (run === knockRun) knockDue = true
  })
}

async function knockIfDue($, token: { dead: boolean }): Promise<void> {
  if (host.mode !== 'room' || !host.marked) return
  if (!knockArmed) {
    armKnock($)
    return
  }
  if (!knockDue || start.stage === 'starting' || door !== undefined) return
  knockDue = false
  armKnock($)
  const stands = await doorStands($)
  if (token.dead || stands !== true) return
  doorFound = true
  if (start.stage === 'refused' || start.stage === 'unknown') start = NO_START
}

// The one read of the room a poll makes. A read that has passed its limit (`token.dead`) changes nothing when it comes back.
async function readRoom($, token: { dead: boolean; before: number }) {
  // Each part of the read is taken apart: one that throws is named, gives its empty value, and the rest is drawn. What the finder
  // could not do (no folder of the session, no run of the find) is said too, unless it is a run past its time: that has its own line.
  const said: Said[] = []
  takeFaults()
  const outside = (where: string): void => {
    const fault = readFault.make?.(where)
    if (fault !== undefined) throw fault
  }
  readNo += 1
  const mine = readNo
  outside('the find of the room')
  const found = await detectMode(ioOf($))
  if (token.dead) return
  host = found
  for (const fault of takeFaults()) if (!isUnanswered(fault.error)) said.push(fault)
  await takeApart($, said, 'the knock at the door', () => undefined, () => knockIfDue($, token))
  if (token.dead) return
  // What a call to make a room left is read against this read: a room found ends it (its lines are of a room that is not there), and a
  // call that left nothing known ends when a read that began after it finds no room again, so the Button stands again.
  if (make.stage !== 'making' && (host.mode !== 'none' || (make.stage === 'unknown' && mine > make.after))) make = NO_MAKE
  const next = await readSnapshot($, nav.view === 'room', nav.view === 'settings', windowOpen && isShelfOpen(nav), said)
  if (token.dead) return
  // The pane's own file is read here and never in a draw: a draw awaits nothing. Its empty value is the defaults.
  await takeApart($, said, "the pane's own file", () => {
    settings = DEFAULTS
    ownCard = undefined
  }, () => readOwn($))
  if (token.dead) return
  await readSessions($)
  if (token.dead) return
  await takeApart($, said, "the keeper's picks he took off", () => undefined, () => readKept($))
  if (token.dead) return
  await takeApart($, said, 'the time he saw the shelf', () => undefined, () => readShelfSeen($))
  if (token.dead) return
  yourCards = candidatesOf(next.walks, next.cards, yourIds, saidIds)
  await takeApart($, said, 'the game of ur', () => undefined, () => readUr($, next.cards))
  if (token.dead) return
  // His desk (order DESK): read again by the poll, shown or at rest, where a sandoq stands to be asked (the tray and the dock count it). The poll
  // does not wait for it, so a sandoq that does not answer holds nothing else (it ends by its limit, and no second read starts while one is out).
  if (!noSandoq() && !deskPolling) {
    deskPolling = true
    // A fault of the read (freshRings, ringBell, openNav) is noted and no unhandled rejection: the host drops a server that has one.
    void readDesk($, true)
      .catch(error => noteRead({ part: 'his desk', error }))
      .finally(() => {
        deskPolling = false
        ringBell($)
      })
  }
  if (token.dead) return
  await takeApart($, said, 'the new answers', () => undefined, () => announce($, next))
  // What is new on the shelf: the first read seeds it, an open Shelf sees it (never a toast).
  await keepShelfSeen($, next, !said.some(fault => fault.part === 'the walks' || fault.part === 'the catalog'))
  // The desk's read, if one is out, rings what it brought with what this read found; else this read rings alone. The bell was held since the
  // read began (order T2B), so a desk read that ended meanwhile left its news in `bell` and it is said once, here, with the asks.
  holding.delete(token)
  if (!deskPolling) ringBell($)
  // A feed that was there and could not be read this time leaves the view with what it showed.
  if (next.feed === undefined) next.feed = snap.feed
  snap = next
  isRead = true
  // The newest part that failed is said until a read goes through with none failing.
  if (said.length > 0) noteRead(said[said.length - 1])
  else partLate = ''
  // A read that went through with nothing late in it takes the late line away.
  if (lateCount === token.before && findHold === 0) late = ''
  pollNow = clockNow()
  outside('the signature of the draw')
  // The walks are in the signature by their sizes, and the minute, so the ages move on; so are the settings and the card of
  // their changes, as a file edited by hand draws once.
  const now = JSON.stringify([host.mode, roomName(), drawnOf(next, pollNow), nav, shown, targetNow(), Math.floor(pollNow / 60000), settings, ownCard, isRead, lateLine(), needLine(), seatOpen === undefined ? '' : `${seatOpen.room}:${seatOpen.seat}:${seatOpen.last}:${seatOpen.note}`, host.maker ?? '', make, makerOld, start, yourIds, saidIds, yourCards.map(card => `${card.id}:${card.raw.length}`), urRead.card, urRead.text, urLine, urBusy, shelfSeen])
  if (now !== signature) {
    signature = now
    $.ui.invalidate('ui.render')
  }
}

// `made` is the id of a card sandoq made and its door did not take (exit 1 with the id printed); '' for every other post.
type Posted = { failed: string; out: string; note: string; made: string }

// Runs one send command; its script (room.sh or cli.py, the second word) is named by the full path
// the room was found at. `failed` is '' on success, else a plain sentence naming the mode and the
// last line it printed; unless quiet, the same sentence is also toasted. `note` is the last line
// a marked room printed on the error stream with exit 0 (sandoq says so when the door did not take
// the card): the room's own line, not a failure.
async function runPost($, argv: string[], isQuiet = false, what = 'the post to the room', says = false): Promise<Posted> {
  let failed = ''
  let out = ''
  let note = ''
  let made = ''
  try {
    const run = await runWithin($, argv, LIMIT.send, what)
    out = `${run.stdout ?? ''}`.trim().split('\n').pop() ?? ''
    // What a program printed says no path of this machine: the lines of the room are scrubbed as the read is.
    if (run.exitCode === 0 && host.marked) note = scrub(withoutProgress(run.stderr).trim().split('\n').pop() ?? '')
    // A say of a marked room that exits 1 with the card's id printed made the card and the door did not take it: the id is kept, the word is true.
    if (says && run.exitCode === 1 && host.marked && idOfSay(out) !== '') {
      made = idOfSay(out)
      failed = DOOR_LATE
    } else if (run.exitCode !== 0) {
      // Say which mode sent it and the last line it printed, so a failure is plain.
      const said = scrub(`${withoutProgress(run.stderr)}\n${run.stdout ?? ''}`.trim().split('\n').pop() ?? '')
      const how = host.marked ? 'local, sandoq room' : isLocal() ? 'local, room.sh' : 'world, salam/cli.py'
      failed = `post failed (${run.exitCode}, ${how}): ${said.slice(0, 160)}`
    }
  } catch (error) {
    failed = isUnanswered(error) ? `${error.message}; ${NOT_SENT}` : `post failed: ${scrub(String(error)).slice(0, 160)}`
  }
  if (failed !== '' && !isQuiet) $.ui.toast(`room: ${failed}`, { timeoutMs: 15000 })
  await poll($)
  return { failed, out, note, made }
}

// A say of the pane made this card (order YC, Y2b, rule A): its id is kept in memory, the cards that may be his are read again from the walks
// of the last read, and the pane draws. An id that is none keeps none.
function keepSay($, id: string) {
  if (id === '') return
  saidIds = keepSaid(saidIds, id)
  yourCards = candidatesOf(snap.walks, snap.cards, yourIds, saidIds)
  $.ui.invalidate('ui.render')
}

// Nothing can be posted: no room is found, or the room found by its mark has no sandoq program to run its words.
const cannotSend = (): boolean => host.mode === 'none' || (host.marked === true && host.sandoq === '')
// Why nothing can go: when the find of sandoq did not answer, that is said (a missing sandoq would be a wrong word for it).
const noSendWords = (): string => (late !== '' ? `${late}; nothing was sent` : host.mode === 'none' ? NO_ROOM : NO_SANDOQ)

// Nothing is posted, and the refusal is toasted whoever asked.
function refuse($): Posted {
  const failed = noSendWords()
  $.ui.toast(`room: ${failed}`, { timeoutMs: 15000 })
  return { failed, out: '', note: '', made: '' }
}

// The session every say of the pane passes first (order YC, rule B): the NEWEST id of this folder in the file of the ids, the flag
// --session before the text. The kit gives the pane no id of its own, so the hook's file is the one place it is read; a folder with no id
// passes none, and the id kept in memory still makes the card his. The argv is ONE pure function, sayArgv of host.ts.
const sayingSession = (): string => newestIdOf(yourIds)
// A say in THIS room passes that session only when no seat is open here, or the open seat is of this very room (matched by name). A session
// that is the seat of another room would have the door send the card to it, and the card would be lost (his laptop, cloud-1 and desk-salam).
const sessionInThisRoom = (): string => (seatOpen === undefined || seatOpen.room === roomName() ? sayingSession() : '')

// A card: `room.sh say` locally (it prints the card's ULID), `sandoq room say` for a marked room (run in the session's folder,
// so sandoq names the seat), a plain post in the world. The room's own line of a card the door did not take is toasted, unless quiet.
// The tool and the command say here; the bar's say of a marked room does not (sendCard).
async function sayCard($, text: string, isQuiet = false): Promise<Posted> {
  host = await detectMode(ioOf($))
  if (cannotSend()) return refuse($)
  const sent = await runPost($, isLocal() ? sayArgv(host, text, sessionInThisRoom()) : worldPostArgv(host.cliPy, text), isQuiet, 'the say', true)
  if (sent.note !== '' && !isQuiet) $.ui.toast(sent.note, { timeoutMs: 15000 })
  // The card a say made is his: its id is the last line the say printed (room.sh says the bare ULID, card.py a dot and the ULID), and a
  // say whose last line is none gives none. A card the door did not take is made all the same, so its id is kept too.
  if (sent.made !== '') keepSay($, sent.made)
  else if (sent.failed === '' && isLocal()) keepSay($, idOfSay(sent.out))
  return sent
}

// Locally the tap names the card's ULID; in the world a tap is the choice alone.
async function tapCard($, id: string, choice: string, isQuiet = false): Promise<Posted> {
  host = await detectMode(ioOf($))
  if (cannotSend()) return refuse($)
  // His tap that stands is no news: the card is kept before the post, so a poll that reads the answer in between does not toast it. A tap that
  // failed is not his answer: the card is let go and a seat's answer to it rings.
  tapped.add(id)
  const sent = await runPost($, isLocal() ? tapArgv(host, choice, id) : worldPostArgv(host.cliPy, choice), isQuiet, 'the tap')
  if (sent.failed !== '') tapped.delete(id)
  return sent
}

// The bar's say. In a marked room it is HIS card, made by ONE call (`sandoq room card --no-seat`, the text on its input), which
// rings the door itself: no feed is run after it. Exit 0 is a card made. Exit 1 with an id on the out is a card made whose ring
// failed: the room's line is shown, and the card stands. Any other exit made no card: the room's line is shown as a say's refusal
// is, and nothing was sent. sayCard is the session's voice.
async function sendBarCard($, said: string) {
  let run: { exitCode?: number; stdout?: string; stderr?: string }
  try {
    run = await runWithin($, barCardArgv(host, said), LIMIT.send, 'the card to the room')
  } catch (error) {
    $.ui.toast(isUnanswered(error) ? `room: ${error.message}\n${NOT_SENT}` : `room: post failed: ${scrub(String(error)).slice(0, 160)}\nNothing was sent.`, { timeoutMs: 15000 })
    return
  }
  if (run.exitCode !== 0) {
    const lines = withoutProgress(run.stderr).trim().split('\n').map(scrub)
    const line = (lines.pop() ?? '').trim() || scrub(`${run.stdout ?? ''}`.trim().split('\n').pop() ?? '') || `sandoq exited ${run.exitCode}`
    const made = bareIdFrom(`${run.stdout ?? ''}`) !== ''
    $.ui.toast(`The room says: ${line}${made ? '' : '\nNothing was sent.'}`, { timeoutMs: 15000 })
    if (!made) return
  }
  target = 'room'
  $.ui.invalidate('ui.render')
  await poll($)
}

async function sendCard($, text: string) {
  const said = text.trim()
  if (said === '') return
  host = await detectMode(ioOf($))
  if (host.marked === true && !cannotSend()) return sendBarCard($, said)
  await sayCard($, said)
}

async function sendTap($, id: string, choice: string) {
  await tapCard($, id, choice)
}

// The game of Ur (order UR, cuts U1 and U2): the card whose game was read (its id, the game's id by urGameOf and the text of walks/ur/GAME.md of
// the run folder, read DIRECT), the one line the last tap left and whether a tap runs. In memory only. The card is the one the window names
// (nav ur), else the NEWEST card handed to ur that has a game: the row of Letters reads it from any lens. The poll reads the file again, a
// window opening reads it at once, and a press reads it after the tap: the window is a function of this text alone.
let urRead = { card: '', game: '', text: '' }
let urLine = ''
let urBusy = false

const urCardOf = (cards: Card[]): Card | undefined =>
  nav.view === 'ur'
    ? cards.find(one => one.id === nav.cardId && one.walk.handedTo === 'ur' && urGameOf(one.raw) !== '')
    : cards.find(one => one.walk.handedTo === 'ur' && urGameOf(one.raw) !== '')

async function readUr($, cards: Card[]) {
  const card = urCardOf(cards)
  const game = card === undefined ? '' : urGameOf(card.raw)
  const path = game === '' ? '' : urWalkPath(host, game)
  if (card === undefined || game === '') {
    urRead = { card: '', game: '', text: '' }
    urLine = ''
    return
  }
  const text = path === '' ? '' : await readText(ioOf($), host, path)
  // Another card's tap line is forgotten.
  if (urRead.card !== card.id) urLine = ''
  urRead = { card: card.id, game, text }
}

// The window of the card named, or of the card read when the id is '' (the row of Letters).
const urWindowNow = (cardId: string): UrWindow | undefined =>
  urRead.game !== '' && (cardId === '' || urRead.card === cardId) ? { card: urRead.card, game: urRead.game, text: urRead.text, line: urLine, busy: urBusy } : undefined

// A press on one of HIS choices: tap.sh in the RUN FOLDER by the one argv of host.ts, never the bell. Its exit is one line (tapLine), then the
// game is read again. A run past its limit is a line that says the pane counts nothing as done; nothing spins.
async function urTap($, game: string, ask: string, choice: string) {
  if (urBusy || !isUrId(game) || !isUrId(ask) || choice.trim() === '' || host.root === '') return
  urBusy = true
  urLine = ''
  // the next ask has choices of its own: its list starts on its first page
  pages = { ...pages, ur: 0 }
  $.ui.invalidate('ui.render')
  try {
    const run = await runWithin($, urTapArgv(host, game, ask, choice), LIMIT.send, 'the tap of the game')
    urLine = run.exitCode === undefined ? 'The tap did not say how it ended; the game is read again.' : tapLine(run.exitCode, withoutProgress(run.stderr), choice)
  } catch (error) {
    urLine = isUnanswered(error) ? `${error.message}; the game is read again.` : 'The tap could not be run.'
  }
  urBusy = false
  try {
    await readUr($, snap.cards)
  } catch {
    // the next poll reads the game again
  }
  $.ui.invalidate('ui.render')
}

// The card open now: the id the feed opens (the newest when none is named; a seat's face and the level up name
// none), '' off the feed. A card of his open in Letters is that card, or none when it has left his list: never the newest.
const openedId = (): string =>
  nav.view === 'feed'
    ? openCardId(snap.cards, nav.cardId)
    : nav.view === 'yours'
      ? yourCardsOf(yourCards, yourIds, pollNow, saidIds).some(card => card.id === nav.cardId)
        ? nav.cardId
        : ''
      : nav.view === 'seat' || nav.view === 'desk' || nav.view === 'level' || nav.view === 'wait' || nav.view === 'ur'
        ? openCardId(snap.cards, '')
        : ''

// The card the operator lens has open, by its row: the card the nav names when it is a shown one, else '' (the
// lens opens none of its own accord, unlike the feed, which opens the newest).
const lensOpenId = (): string => (nav.view === 'feed' && snap.cards.some(card => card.id === nav.cardId) ? nav.cardId : '')

// The target the bar draws: the card only while it is still the card the person picked it for.
const targetNow = (): 'room' | 'card' | 'keeper' =>
  target === 'card' && targetFor === openedId() ? 'card' : target === 'keeper' && targetFor === letterCardId() ? 'keeper' : 'room'

// The card of the letter open from the desk (order keeper chat), '' off a letter of the desk and for a shape ask, which lies on no card.
const letterCardId = (): string =>
  nav.view === 'wait' && nav.from === FROM_DESK && nav.cardId !== nav.askId && snap.walks.some(walk => walk.id === nav.cardId) ? nav.cardId : ''

// His line to the keeper on a card (order keeper chat): `sandoq room run chat GATE .CARD`, the words on its input. Over CHAT_LIMIT characters nothing is sent.
// Exit 0: sent, and the words stand as his line with Sent. under it until the walk holds them. Exit 1 and one line on stderr: that line whole. A refused ring with
// the tap kept (keptTap) is a line that was sent: it stands as his line with Sent. as well, and the walk is read again. Any other line (no card, no words) wrote
// nothing, and nothing is drawn. The answer is the one line to say ('' for none) and whether the line was sent; the bar toasts it, /sandoq chat says it in the chat.
async function chatRun($, cardId: string, text: string): Promise<{ sent: boolean; line: string }> {
  const words = chatWords(text)
  if (words === '') return { sent: false, line: '' }
  if (chatTooLong(words)) return { sent: false, line: `room: ${chatLongWords(words)}` }
  host = await detectMode(ioOf($))
  if (cannotSend()) return { sent: false, line: `room: ${noSendWords()}` }
  if (host.marked !== true) return { sent: false, line: `room: ${NO_CHAT}` }
  let run: { exitCode?: number; stdout?: string; stderr?: string }
  try {
    run = await runWithin($, chatArgv(host, cardId, words), LIMIT.send, 'the line to the keeper')
  } catch (error) {
    return { sent: false, line: isUnanswered(error) ? `room: ${error.message}\n${NOT_SENT}` : `room: post failed: ${scrub(String(error)).slice(0, 160)}\nNothing was sent.` }
  }
  // Exit 0 sent the line. Exit 1 with a refused ring left the tap in the inbox: the line was sent too, drawn with the room's line. Any other exit wrote nothing.
  let kept = run.exitCode === 0
  let line = ''
  if (run.exitCode !== 0) {
    const lines = withoutProgress(run.stderr).trim().split('\n').map(scrub)
    const said = (lines.pop() ?? '').trim() || `sandoq exited ${run.exitCode}`
    line = `The room says: ${said}`
    kept = run.exitCode === 1 && keptTap(said)
  }
  if (kept) {
    chatSent = { ...chatSent, [cardId]: [...(chatSent[cardId] ?? []), words] }
    // the thread opens on its newest page again, in its own pager and in the terminal's
    const { [CHAT_LIST]: _page, [TERMINAL_LIST]: _terminal, ...rest } = pages
    pages = rest
  }
  $.ui.invalidate('ui.render')
  await poll($)
  return { sent: kept, line }
}

// The bar's send: the room's line, when there is one, is a toast.
async function chatCard($, cardId: string, text: string) {
  const done = await chatRun($, cardId, text)
  if (done.line !== '') $.ui.toast(done.line, { timeoutMs: 15000 })
}

// `/sandoq chat WORDS` (the app draws no bar): WORDS go by the road of the bar to the keeper on the card the pane has open from the desk, and the pane is not
// opened. With no card open, or no words, one line says so and nothing is sent; the same over CHAT_LIMIT characters. The answer in the chat is the say's own line,
// as an at say's is.
async function doChatSay($, words: string): Promise<string> {
  if (words === '') return CHAT_USAGE
  const cardId = letterCardId()
  if (cardId === '') return CHAT_NO_CARD
  const done = await chatRun($, cardId, words)
  if (!done.sent) return /nothing was sent|NOT sent/i.test(done.line) ? done.line : `${done.line}\nNothing was sent.`
  return `room: sent to the keeper: ${preview(words)}${done.line === '' ? '' : `\n${done.line}`}`
}

// One program of the room by process.run: what it printed, and on a failure its last line said (the line
// of card.py's refusal), else its exit code.
async function runLine($, argv: string[], what = 'a program of the room', limit = LIMIT.send): Promise<{ out: string; failed: string }> {
  try {
    const run = await runWithin($, argv, limit, what)
    const out = `${run.stdout ?? ''}`.trim()
    if (run.exitCode === 0) return { out, failed: '' }
    const said = scrub(withoutProgress(run.stderr).trim().split('\n').pop() || out.split('\n').pop() || '')
    return { out, failed: said !== '' ? said.slice(0, 160) : `a program of the room exited ${run.exitCode}` }
  } catch (error) {
    return { out: '', failed: isUnanswered(error) ? `${error.message}; the pane counts it as NOT done` : scrub(String(error)).slice(0, 160) }
  }
}

// A card with a flag, local only: card.py makes it with the text on its input and prints its word, then
// feed.sh offers the word. A refusal of card.py (a card or a record that is not there, an old card.py with
// no such flag) is its line in a toast and nothing else is sent. The words of nothing send nothing.
async function sendFlagged($, argvOf: (host: Host, text: string) => string[], text: string) {
  const said = text.trim()
  if (said === '') return
  host = await detectMode(ioOf($))
  if (cannotSend()) {
    refuse($)
    return
  }
  if (!isLocal()) {
    $.ui.toast('room: a reply or a say about a record needs a local room (room.sh)')
    return
  }
  const made = await runLine($, argvOf(host, said))
  if (made.failed !== '') {
    $.ui.toast(`room: ${made.failed}`)
    return
  }
  const id = cardIdFrom(made.out)
  if (id === '') {
    $.ui.toast('room: card.py gave no word for the card')
    return
  }
  keepSay($, id)
  const fed = await runLine($, localFeedArgv(host, feedWord(id)))
  if (fed.failed !== '') $.ui.toast(`room: ${fed.failed}`)
  else target = 'room'
  $.ui.invalidate('ui.render')
  await poll($)
}

// What Claude and the slash commands call. Each answers one short plain sentence or block.
// A card is named to a tool by its first words (or its ULID); the answer never shows the id.
const ULID_LIKE = /^[0-9A-Za-z]{20,}$/

function findCard(arg: string): Card | undefined {
  const named = arg.trim().replace(/^\./, '')
  if (named === '') return undefined
  const lower = named.toLowerCase()
  return (
    snap.cards.find(card => card.id === named) ??
    snap.cards.find(card => card.text.toLowerCase().startsWith(lower)) ??
    snap.cards.find(card => card.text.toLowerCase().includes(lower))
  )
}

async function doSay($, text: string): Promise<string> {
  const said = text.trim()
  if (said === '') return 'room: nothing to say, the text is empty'
  const sent = await sayCard($, said, true)
  if (sent.failed !== '') return `room: ${sent.failed}`
  return `room: sent a card: ${preview(said)}${sent.note === '' ? '' : `\n${sent.note}`}`
}

// `/sandoq @seat TEXT` and `/room @seat TEXT`: a say TO a seat (order C3, part A2). The WHOLE words, the at name first, are
// one word of the argv of `sandoq room say`, run in the session's folder as room_say and /room-say run it; the pane is not
// opened. The pane parses no at word: the room reads it where it writes the card's root. A room that refuses (a name that is
// no seat of the room, a room whose discs are older than the at form) refuses in one line on the error stream: that line is
// shown whole, as the room's own, and nothing was sent. Only a marked room says through sandoq, so a room found by its
// room.sh, or a mark with no sandoq program found, says what a say that cannot go says today.
async function doAtSay($, words: string): Promise<string> {
  // An at name with no words after it says nothing to anyone: no process is run, not even the find of the room.
  if (words.split(/\s+/).every(word => word.startsWith('@'))) return NO_WORDS
  host = await detectMode(ioOf($))
  if (host.marked !== true || cannotSend()) {
    const failed = late !== '' ? noSendWords() : host.marked === true ? NO_SANDOQ : NO_ROOM
    $.ui.toast(`room: ${failed}`, { timeoutMs: 15000 })
    return `room: ${failed}`
  }
  let run: { exitCode?: number; stdout?: string; stderr?: string }
  try {
    run = await runWithin($, sayArgv(host, words, sessionInThisRoom()), LIMIT.send, 'the say to the seat')
  } catch (error) {
    if (isUnanswered(error)) return `room: ${error.message}\n${NOT_SENT}`
    return `room: post failed: ${scrub(String(error)).slice(0, 160)}\nNothing was sent.`
  }
  // The room's own line, as the read is: no path of this machine in it.
  const lines = withoutProgress(run.stderr).trim().split('\n').map(scrub)
  // Exit 1 with the card's id printed: the card is made and the door did not take it. Its id is kept, and the word is the true one.
  const made = run.exitCode === 1 ? idOfSay(`${run.stdout ?? ''}`) : ''
  if (made !== '') {
    keepSay($, made)
    await poll($)
    return `room: ${DOOR_LATE}`
  }
  if (run.exitCode !== 0) {
    const said = (lines.pop() ?? '').trim() || scrub(`${run.stdout ?? ''}`.trim().split('\n').pop() ?? '') || `sandoq exited ${run.exitCode}`
    return `The room says: ${said}\nNothing was sent.`
  }
  keepSay($, idOfSay(`${run.stdout ?? ''}`))
  await poll($)
  const note = lines.pop() ?? ''
  return `room: sent a card: ${preview(words)}${note === '' ? '' : `\n${note}`}`
}

// Words after /sandoq or /room that are no at name and not the word room (order Y1): they are SENT as a say, by the road of
// /room-say, and the pane opens as it does for any other word, on this seat's face. The answer in the chat is the say's own line,
// never the opening alone. Where nothing can be sent, ONE line says so and that nothing was sent; no toast repeats it.
async function doWordsSay($, words: string): Promise<string> {
  host = await detectMode(ioOf($))
  let line: string
  if (cannotSend()) {
    const why = noSendWords()
    line = `room: ${why}${/nothing was sent/i.test(why) ? '' : '; nothing was sent'}`
  } else {
    line = await doSay($, words)
    if (!line.startsWith('room: sent a card') && !/nothing was sent|NOT sent/i.test(line)) line = `${line}\nNothing was sent.`
  }
  await openPane($, words)
  return line
}

// The middle part as HIS card, by the road of the bar's say in a marked room (barCardArgv, as sendBarCard runs it): exit 0 is a card sent, exit 1
// with an id on the out is a card that stands whose ring failed (sent, the room's own line), any other exit made no card. The target and the
// feed are left alone: his message goes on to the session.
async function midCard($, said: string): Promise<{ sent: boolean; line: string }> {
  let run: { exitCode?: number; stdout?: string; stderr?: string }
  try {
    run = await runWithin($, barCardArgv(host, said), LIMIT.send, 'the card to the room')
  } catch (error) {
    const line = isUnanswered(error) ? `room: ${error.message}\n${NOT_SENT}` : `room: post failed: ${scrub(String(error)).slice(0, 160)}\nNothing was sent.`
    return { sent: false, line }
  }
  if (run.exitCode === 0) {
    await poll($)
    return { sent: true, line: `room: sent a card: ${preview(said)}` }
  }
  const lines = withoutProgress(run.stderr).trim().split('\n').map(scrub)
  const line = (lines.pop() ?? '').trim() || scrub(`${run.stdout ?? ''}`.trim().split('\n').pop() ?? '') || `sandoq exited ${run.exitCode}`
  const made = bareIdFrom(`${run.stdout ?? ''}`) !== ''
  if (made) await poll($)
  return { sent: made, line: `The room says: ${line}${made ? '' : '\nNothing was sent.'}` }
}

// The /sandoq part in the middle of his message (hooks/midsay.ts): in a marked room the words are HIS card (midCard); an at name first is a say to that
// seat by the road of the command (doAtSay); elsewhere the session's say (doSay). The pane does not open, and the line is toasted whether it went or
// not, so no refusal is silent. A room that cannot be written to is said by the one toast of this function alone.
async function sendMid($, part: string): Promise<{ sent: boolean; line: string }> {
  const words = withoutSlashWords(part)
  host = await detectMode(ioOf($))
  let result: { sent: boolean; line: string }
  if (cannotSend()) result = { sent: false, line: `room: ${noSendWords()}` }
  else if (words.startsWith('@')) {
    const line = await doAtSay($, words)
    result = { sent: line.startsWith('room: sent a card') || line === `room: ${DOOR_LATE}`, line }
  } else if (host.marked === true && words.trim() !== '') result = await midCard($, words.trim())
  else {
    const line = await doSay($, words)
    result = { sent: line.startsWith('room: sent a card') || line === `room: ${DOOR_LATE}`, line }
  }
  if (result.sent) $.ui.toast(result.line)
  else $.ui.toast(result.line, { timeoutMs: 15000 })
  return result
}

// A SESSION AS THE SEAT OF A JOINED ROOM (order session open): `/sandoq open ROOM SEAT` and `/sandoq shut`. Tonight the open state is the pane's own, per
// session (the room, the seat and the wake process, in memory): no tap opens or shuts. OPEN, in order: the state kept; the rows that waited, read once (a refusal
// is sandoq's line, shown whole, the state dropped and nothing else started); the wake; the context on; the card. The wake is the pane's own process,
// `sandoq room wake ROOM --next --seat SEAT --json` (never a Bash call of Claude): on its exit 0 with rows the pane holds them, and ONE $.prompt.submit makes them a
// turn; --next starts again at once. The kit refuses a submit from the hook of a command, so the wake and its submit run in the session.start hook's own loop (below):
// it outlives that hook, waits on a promise the open resolves with the seat (never a `$`), and submits while the session is idle. A turn's end (turn.complete) hands what a
// busy session refused. A refused submit is said on the card and keeps the rows for the next one. There is no clock, no poll and no timer here: the pass of
// 5 s is inside sandoq. SHUT, in order: the wake stopped; the state dropped; the context off; the card as before. It only unties this session: never `room leave`.
type SeatOpen = {
  room: string
  seat: string
  sandoq: string
  // The last row a turn told, the rows kept for the next submit, and the one line the card says of a wake that stopped or a submit that was refused.
  last: string
  held: SeatRow[]
  note: string
  shutting: boolean
  // The pane's own wake process while one runs.
  child: { return: (value?: unknown) => unknown } | undefined
}
let seatOpen: SeatOpen | undefined
let seatOpening: Promise<string> | undefined

// What the session.start loop waits on: the open resolves it with the seat (the room, the seat, its held rows; no `$`), a shut or an end with none. A promise that is
// resolved is never resolved again: the next word makes a fresh one, so a shut and an open in a row each reach the loop. `seatLoopRun` ends the loop of an earlier start.
type SeatWait = { promise: Promise<SeatOpen | undefined>; settle: (seat: SeatOpen | undefined) => void; told: boolean }
function newSeatWait(): SeatWait {
  let settle: SeatWait['settle'] = () => undefined
  const promise = new Promise<SeatOpen | undefined>(done => {
    settle = done
  })
  return { promise, settle, told: false }
}
let seatWait = newSeatWait()
let seatLoopRun = 0
function tellLoop(seat: SeatOpen | undefined): void {
  // a shut after a shut says nothing new; an open after any word is a promise of its own
  if (seatWait.told) {
    if (seat === undefined) return
    seatWait = newSeatWait()
  }
  seatWait.told = true
  seatWait.settle(seat)
}

// The kit's prompt.context is read again when the seat opens or shuts.
function refreshSeat($): void {
  for (const hook of ['prompt.context', 'ui.render']) {
    try {
      $.ui.invalidate(hook)
    } catch {
      // a host that does not take the name: the draw still goes
    }
  }
}

function stopWake(seat: SeatOpen): void {
  const child = seat.child
  seat.child = undefined
  if (child) void child.return(undefined)
}

// One call of sandoq for the seat, from the session's folder: '' failed and the out on exit 0, else sandoq's own last line whole.
async function runSeat($, argv: string[], what: string): Promise<{ failed: string; out: string }> {
  try {
    const run = await runWithin($, argv, LIMIT.send, what)
    if (run.exitCode === 0) return { failed: '', out: String(run.stdout ?? '') }
    const said = streamLines(withoutProgress(run.stderr)).at(-1) ?? streamLines(String(run.stdout ?? '')).at(-1)
    return { failed: said ?? `${what} exited ${run.exitCode ?? 'with no code'}`, out: '' }
  } catch (error) {
    return { failed: isUnanswered(error) ? error.message : `${what} did not run: ${scrub(String(error)).slice(0, 160)}`, out: '' }
  }
}

// The sandoq program for a call that is no room's: the marked room's, else the one found for the session's folder.
async function seatProgram($): Promise<string> {
  host = await detectMode(ioOf($))
  return host.sandoq || host.maker || (await sandoqIn(ioOf($), host.session))
}

// What the sandoq program says to --version, '' when it did not answer.
async function sandoqSaid($, sandoq: string): Promise<string> {
  try {
    const run = await runWithin($, roomAppVersionArgv({ ...host, sandoq }), LIMIT.open, 'sandoq --version')
    return run.exitCode === 0 ? String(run.stdout ?? '') : ''
  } catch {
    return ''
  }
}

// Whether sandoq seats this folder (`room seat` alone, from SEAT_FOLDER_FROM): the seat of the folder is sandoq's, and its hook does the wake. A fault and a folder
// with no entry both say no.
async function folderIsSeated($, sandoq: string): Promise<boolean> {
  const shown = await runSeat($, folderSeatShowArgv(sandoq), 'the read of the seat of this folder')
  return shown.failed === '' && seatedByLine(shown.out)
}

// The rows kept become ONE turn. A submit that was taken keeps nothing; one that was refused is said on the card and the rows wait for the next.
// Only one submit goes at a time. The kit refuses a submit from a hook that holds the turn, and the `$` of the command's hook holds it for good (the kit's scan
// refuses a module that keeps a `$` past its hook, so none is kept). The submit is made by the `$` of the session.start loop, which outlives its hook and finds the
// session idle, and by the one of turn.complete for what a busy session refused. The kit's own refusal is never the card's words: the card says the rows wait for the next turn.
let seatSubmitting = false
async function submitHeld($, seat: SeatOpen): Promise<void> {
  const rows = seat.held
  if (seatSubmitting || rows.length === 0 || seat.shutting) return
  seatSubmitting = true
  try {
    await $.prompt.submit({ text: turnText(seat.room, seat.seat, rows) })
    seat.held = seat.held.filter(row => !rows.includes(row))
    seat.last = lastSeq(rows, seat.last)
    seat.note = ''
  } catch (error) {
    const why = scrub(String(error instanceof Error ? error.message : error)).slice(0, 160)
    seat.note = kitHolds(why) ? WAIT_LINE : submitRefusedLine(why)
  } finally {
    seatSubmitting = false
  }
  $.ui.invalidate('ui.render')
}

// The wake of one open seat. It ends when the seat is shut, or when `--next` ends with no rows or in an error (the card says so): it starts nothing again by itself.
async function wakeLoop($, seat: SeatOpen): Promise<void> {
  for (;;) {
    if (seatOpen !== seat) return
    let run: { exitCode?: number; stdout?: string; stderr?: string }
    try {
      // The stream is kept as its iterator, the one thing that is stopped on shut.
      const stream = $.process.spawn({ argv: seatWakeArgv(seat.sandoq, seat.room, seat.seat) })[Symbol.asyncIterator]()
      seat.child = stream
      run = await gather({ [Symbol.asyncIterator]: () => stream })
    } catch (error) {
      if (seatOpen === seat) endWake($, seat, scrub(String(error)).slice(0, 160))
      return
    } finally {
      seat.child = undefined
    }
    if (seatOpen !== seat) return
    if (run.exitCode !== 0) {
      endWake($, seat, streamLines(withoutProgress(run.stderr)).at(-1) ?? `it exited ${run.exitCode ?? 'with no code'}`)
      return
    }
    const { rows, bad } = parseRows(run.stdout ?? '')
    if (rows.length === 0 && bad === 0) {
      endWake($, seat, 'it ended with no rows')
      return
    }
    // A line that is no row is said once and left out; the rows that are read go on.
    if (bad > 0) {
      seat.note = badRowLine(bad)
      $.ui.invalidate('ui.render')
    }
    seat.held = [...seat.held, ...rows]
    // The wake hands what it read at once: the session is idle, or the kit refuses and the card says the rows wait for the turn's end.
    await submitHeld($, seat)
    // The bad line is still said once when the submit was taken (a taken submit clears the card's note).
    if (bad > 0 && seat.note === '' && !seat.shutting) {
      seat.note = badRowLine(bad)
      $.ui.invalidate('ui.render')
    }
  }
}

// The loop of the session.start hook: it takes each seat the open resolves, and for it hands the rows that waited, then wakes it, until the seat is shut or the wake
// ends. Each seat's wake runs on its own, so an open after a shut never waits for the wake before to unwind. The loop waits for the next open; a later session start
// (a new run) ends it.
async function seatKeeper($, run: number): Promise<void> {
  while (run === seatLoopRun) {
    const taken = seatWait
    const seat = await taken.promise
    if (run !== seatLoopRun) return
    if (seatWait === taken) seatWait = newSeatWait()
    if (seat === undefined || seatOpen !== seat) continue
    void (async () => {
      await submitHeld($, seat)
      await wakeLoop($, seat)
    })()
  }
}

function endWake($, seat: SeatOpen, why: string): void {
  seat.note = wakeEndedLine(why)
  $.ui.invalidate('ui.render')
}

async function doOpenSeat($, room: string, seat: string): Promise<string> {
  if (seatOpen !== undefined) return seatOpen.room === room && seatOpen.seat === seat ? openLine(seat, room) : otherOpenLine(seatOpen.seat, seatOpen.room)
  const sandoq = await seatProgram($)
  if (sandoq === '') return NO_SANDOQ
  // Under the sandoq that has the verbs nothing is run but its version.
  const said = await sandoqSaid($, sandoq)
  if (!roomAppHas(said, SESSION_OPEN_FROM)) return underLine(SESSION_OPEN_FROM)
  // A folder that sandoq seats has its wake by the hook of sandoq: the pane opens no second one.
  if (roomAppHas(said, SEAT_FOLDER_FROM) && (await folderIsSeated($, sandoq))) return SEATED_BY_SANDOQ
  // The rows that waited are read once, as one turn. A refusal is sandoq's line, shown whole, and nothing is kept or started. The pass prints the rows of any
  // hearer of the order, so only the rows to this seat make the turn.
  const passed = await runSeat($, seatRowsArgv(sandoq, room), 'the read of the rows that waited')
  if (passed.failed !== '') return passed.failed
  const { rows: passedRows, bad } = parseRows(passed.out)
  const waited = rowsOfSeat(passedRows, seat)
  const open: SeatOpen = { room, seat, sandoq, last: lastSeq(waited), held: waited, note: bad > 0 ? badRowLine(bad) : waited.length > 0 ? WAIT_LINE : '', shutting: false, child: undefined }
  seatOpen = open
  refreshSeat($)
  // The session.start loop takes the seat from here: it hands the rows that waited and wakes it, by its own `$`.
  tellLoop(open)
  $.ui.toast(openToast(room, waited.length))
  return openLine(seat, room)
}

// Open twice is one wake: a second open while the first runs is the first's own answer.
function openSeat($, room: string, asked: string): Promise<string> {
  seatOpening ??= doOpenSeat($, room, asked).finally(() => {
    seatOpening = undefined
  })
  return seatOpening
}

// The wake is stopped first, so no row starts a turn after it; then the state is dropped and the context goes off. No tap, no call: the rows wait in the room.
function shutSeat($, quiet = false): string {
  const seat = seatOpen
  if (seat === undefined) return NONE_OPEN
  seat.shutting = true
  stopWake(seat)
  seatOpen = undefined
  tellLoop(undefined)
  refreshSeat($)
  // The rows read but not yet told (a submit pending or refused) go with the state: the line says so, with their count.
  const lost = seat.held.length
  if (!quiet) $.ui.toast(shutToast(seat.room, lost))
  return shutLine(seat.seat, lost)
}

// The tool room_say with a room: the pane runs `sandoq room say --room ROOM [--session ID] TEXT` from any folder, never a Bash call of Claude. The holder's bridge
// answers the newest row, so a re given with a room is refused and nothing is sent.
async function doRoomSay($, room: string, text: string, re: string): Promise<string> {
  const said = text.trim()
  if (said === '') return 'room: nothing to say, the text is empty'
  if (re.trim() !== '') return RE_REFUSED
  if (!SEAT_WORD.test(room)) return `room: ${room} is not the name of a room`
  const sandoq = await seatProgram($)
  if (sandoq === '') return `room: ${NO_SANDOQ}`
  const sent = await runSeat($, seatSayArgv(sandoq, room, said, sayingSession()), 'the say to the room')
  if (sent.failed !== '') return `The room says: ${sent.failed}\nNothing was sent.`
  return `room: said to ${room}`
}

// The tool room_rows: one pass of `sandoq room wake ROOM --once --json`, the rows since the last mark; none is an empty answer, said so. The pass prints the rows
// of any hearer. For the room with a seat open here only that seat's rows are told, and its last row moves; for a room with no seat open here each row is told
// with its hearer.
async function doRoomRows($, room: string): Promise<string> {
  if (!SEAT_WORD.test(room)) return `room: ${room} is not the name of a room`
  const sandoq = await seatProgram($)
  if (sandoq === '') return `room: ${NO_SANDOQ}`
  const passed = await runSeat($, seatRowsArgv(sandoq, room), 'the read of the rows')
  if (passed.failed !== '') return `The room says: ${passed.failed}`
  const { rows: passedRows, bad } = parseRows(passed.out)
  const open = seatOpen?.room === room ? seatOpen : undefined
  const rows = open === undefined ? passedRows : rowsOfSeat(passedRows, open.seat)
  if (open !== undefined) {
    open.last = lastSeq(rows, open.last)
    $.ui.invalidate('ui.render')
  }
  const told = open === undefined ? roomRowsText(rows) : rowsText(rows)
  return bad > 0 ? `${told}\n${badRowLine(bad)}.` : told
}

// A lab word: its argv runs once, from the session's folder (the project root), and its rows (the out, then the err) are shown as they are, one a line.
// A refusal, a row or a run that fails is shown and never tried again.
async function doLabWords($, lab: LabWords): Promise<string> {
  if (!Array.isArray(lab)) return lab.row
  try {
    const run = await runWithin($, lab, LIMIT.send, 'the lab word')
    const rows = [...streamLines(run.stdout), ...streamLines(run.stderr)]
    if (rows.length > 0) return rows.join('\n')
    return run.exitCode === 0 ? 'sandoq: the lab word ran and said nothing.' : `sandoq: the lab word exited ${run.exitCode ?? 'with no code'}.`
  } catch (error) {
    return isUnanswered(error) ? error.message : `sandoq: the lab word did not run: ${scrub(String(error)).slice(0, 160)}`
  }
}

// The words of /sandoq and /room: each slash word of the pane at their start (one WITH the slash) is taken off first, again and again
// (withoutSlashWords). Then an at sign first is a say to a seat; the plain word `room` alone, a slash room at the end, or none opens the
// pane; any other words are a say to the room, and the pane opens too. A plain word room at the start (`room is cold tonight`) is a say.
const openOrSay = ($, args: unknown): Promise<string> => {
  const typed = String(args ?? '').trim()
  const words = withoutSlashWords(typed)
  // The lab's words (hooks/labwords.ts: none in the shipped pane, the lab's verbs in /sandoq-dev) come first.
  const lab = labWordsOf(words)
  if (lab !== undefined) return doLabWords($, lab)
  if (words.startsWith('@')) return doAtSay($, words)
  // `chat WORDS` is his line to the keeper on the card the pane has open; it opens no pane.
  const chatWordsOf = chatCommandOf(words)
  if (chatWordsOf !== undefined) return doChatSay($, chatWordsOf)
  // `open ROOM [SEAT]` and `shut` make this session the seat of a joined room, or end it; they say one line and open no pane.
  const seatWord = seatWordsOf(words)
  if (seatWord?.word === 'open') return openSeat($, seatWord.room, seatWord.seat)
  if (seatWord?.word === 'shut') return Promise.resolve(shutSeat($))
  if (seatWord?.word === 'needs-seat') return Promise.resolve(NEEDS_SEAT)
  if (seatWord?.word === 'usage') return Promise.resolve(OPEN_USAGE)
  if (words.toLowerCase() === 'room') return openPane($, 'room')
  if (words === '') return openPane($, /(^|\s)\/room$/i.test(typed) ? 'room' : '')
  return doWordsSay($, words)
}

async function doTap($, choice: string, cardArg: string, askArg = ''): Promise<string> {
  const picked = choice.trim()
  if (picked === '') return 'room: nothing to tap, the choice is empty'
  await poll($)
  if (cannotSend()) return `room: ${refuse($).failed}`
  const askId = askArg.trim().replace(/^@/, '')
  if (askId !== '') {
    // The card that holds this ask open; an ask decided already or unknown is said plainly.
    const owner = snap.cards.find(card => openAsks(card.raw).some(ask => ask.id === askId))
    if (owner === undefined) return `room: no open ask ${askId}`
    const sent = await tapCard($, owner.id, picked, true)
    if (sent.failed !== '') return `room: ${sent.failed}`
    return `room: tapped "${picked}" for "${preview(owner.text)}"`
  }
  const card = cardArg.trim() !== '' ? findCard(cardArg) : snap.cards.find(waitsHere)
  if (card === undefined) return cardArg.trim() !== '' ? `room: no card "${cardArg.trim()}"` : 'room: no card waits for a tap'
  const tapped = await tapCard($, card.id, picked, true)
  if (tapped.failed !== '') return `room: ${tapped.failed}`
  return `room: tapped "${picked}" for "${preview(card.text)}"`
}

async function doNew($): Promise<string> {
  host = await detectMode(ioOf($))
  if (host.mode === 'none') return `room: ${NO_ROOM}`
  // The pane never runs `sandoq room new`: a room found by its mark is made already.
  if (host.marked) return 'room: this folder has a room already (its mark is .sandoq/room.md)'
  if (!isLocal()) return 'room: /room-new is local only; this room has no room.sh'
  const made = await runPost($, localNewArgv(host.roomSh), true, 'room.sh new')
  if (made.failed !== '') return `room: ${made.failed}`
  return `room: room.sh new ran${made.out === '' ? '' : `: ${made.out.slice(0, 160)}`}`
}

async function doWalk($, cardArg: string): Promise<string> {
  await poll($)
  if (!snap.exists) return noFolder()
  const named = cardArg.trim().replace(/^\./, '')
  let walk = (named !== '' ? findCard(named) : snap.cards[0])?.walk
  if (walk === undefined && ULID_LIKE.test(named)) {
    const text = await readText(ioOf($), host, `${host.root}/walks/${host.gate}/${named}.md`)
    if (text !== '') walk = parseWalk(text)
  }
  if (walk === undefined) return named === '' ? 'room: no cards yet' : `room: no walk for "${named}"`
  const lines = [stripUlid(walk.head)]
  for (const step of walk.steps) {
    const tail = [step.role, step.rate].filter(part => part !== '').join(' ')
    lines.push(`${step.ms} ${' '.repeat(step.depth * INDENT)}${step.step} | ${step.notation} | ${tail}`.trimEnd())
  }
  if (walk.waiting) lines.push(`WAITING for a tap: ${walk.question} (${walk.choices.join(' ; ')})`)
  if (walk.answer) lines.push('', `Seat answer: ${walk.answer}`)
  return lines.join('\n')
}

function doShelf(): string {
  if (!snap.exists) return noFolder()
  if (snap.records.length === 0) return 'The shelf is empty.'
  return snap.records.map(record => `${stripUlid(record.name)} (${record.che})`).join('\n')
}

// The local door: `sh room.sh start` kept running for the session, stopped at its end.
async function runDoor($) {
  doorState = 'starting'
  $.ui.invalidate('ui.render')
  $.clock.after(5000, () => {
    if (doorState === 'starting') {
      doorState = 'up'
      $.ui.invalidate('ui.render')
    }
  })
  try {
    const child = $.process.spawn({ argv: startArgv(host) })
    door = child
    for await (const _piece of child) {
      if (doorState === 'starting') doorState = 'up'
    }
  } catch {
    // The door could not start or was cut off: the band says it stopped.
  } finally {
    door = undefined
    doorState = 'stopped'
    $.ui.invalidate('ui.render')
  }
}

// Does a door stand in this room: a connect on the socket `door` in its run folder, by one process with a
// fixed script. Only when that process cannot run (no python3) the process list is asked.
// A process that did not answer in its time leaves the door unknown (undefined): the pane starts none, for a second door over a
// first is worse than none.
async function doorStands($): Promise<boolean | undefined> {
  try {
    const knocked = doorFromKnock((await runWithin($, doorKnockArgv(host.root), LIMIT.door, 'the knock at the door')).exitCode)
    if (knocked !== undefined) return knocked
  } catch (error) {
    if (noteLate(error)) return undefined
    // No python3: the process list says.
  }
  // A marked room has no layout the process list could name: its start is sandoq's, which knows its door.
  if (host.marked) return false
  try {
    return (await runWithin($, doorRunningArgv(host.root), LIMIT.door, 'the look at the process list')).exitCode === 0
  } catch (error) {
    // No pgrep either: no door is known.
    return noteLate(error) ? undefined : false
  }
}

async function startDoorIfNeeded($) {
  try {
    await startDoorAsked($)
  } finally {
    // The door has been asked, whatever it answered: the bar may say its word now.
    doorAsked = true
    $.ui.invalidate('ui.render')
  }
}

async function startDoorAsked($) {
  host = await detectMode(ioOf($))
  if (!isLocal() || door !== undefined) return
  // A marked room is started by `sandoq room start` alone, and with no sandoq the pane reads alone.
  if (host.marked && host.sandoq === '') return
  // No door program in the run folder: room.sh start would make a room, and the pane never does. It reads alone.
  // A marked room has its own words for it, and the pane knows no layout under its mark.
  if (!host.marked && !(await has(ioOf($), host, doorPyPath(host.root)))) {
    doorState = 'none'
    $.ui.invalidate('ui.render')
    return
  }
  const stands = await doorStands($)
  if (stands === undefined) {
    // The line stays until the door is asked again and answers.
    doorLate = late
    $.ui.invalidate('ui.render')
    return
  }
  doorLate = ''
  if (stands) {
    doorFound = true
    return
  }
  // A marked room: the one call of sandoq (order MR, R3), no child held. An older sandoq takes the old road, the spawn, below it.
  if (host.marked && !startOld) {
    void startByCall($)
    return
  }
  void runDoor($)
}

// "Put it up" of the Room place: the door start the pane makes at its session start. A door of the room that stands is
// found again, else the pane starts one; a room with no local door, or whose run folder holds no door program, says so.
async function putUp($) {
  host = await detectMode(ioOf($))
  if (!isLocal()) {
    $.ui.toast('room: this room has no local door to put up')
    return
  }
  doorFound = false
  await startDoorIfNeeded($)
  if (doorState === 'none') $.ui.toast('room: no door program in this room to put up')
}

// "What changes ›": the page of an update, opened by the system's opener when it is a web page; true only when the opener ended 0.
// A page that is no web page is said in a toast, so he can read where it is. A web page that did not open is one toast that says
// why, then its address. `what` names the page in the toast.
async function openPage($, page: string, what = 'the page of the update'): Promise<boolean> {
  const argv = openPageArgv(page)
  if (argv === undefined) {
    $.ui.toast(`room: ${what}: ${page}`)
    return false
  }
  let why = ''
  try {
    const run = await runWithin($, argv, LIMIT.page, 'the opener of the system')
    if (run.exitCode === 0) return true
    why = openerFault(run.exitCode)
  } catch (error) {
    why = isUnanswered(error) ? error.message : scrub(String(error)).slice(0, 160)
  }
  $.ui.toast(`room: ${what} did not open: ${why}. It is at ${page}`)
  return false
}

function stopDoor() {
  const child = door
  door = undefined
  if (child) void child.return(undefined)
}

// Claude's tools and the user's slash commands; one taken name must not stop the others.
const OPEN_WORDS = 'Open the room: what waits for this seat'
// The words after the command: `room` opens the level up; `@seat TEXT` says TEXT to that seat and opens nothing; `chat WORDS` says WORDS to the keeper on
// the card open from the desk and opens nothing; any other TEXT is said to the room and the pane opens.
const OPEN_HINT = 'room, @SEAT TEXT, chat WORDS, or TEXT to say'

// /sandoq and /room open the pane on this seat's face, or as On open says; with "room" they open it one level up, on the
// waits of each seat. Each opening starts from the face, as a session start does.
async function openPane($, args: string): Promise<string> {
  // The answer of the sandoq find is kept across polls; opening the pane asks again, so a sandoq installed since is found.
  forgetSandoq()
  findHold = 0
  // The read before the opening has a limit: a process that does not answer holds the command no longer than it, and the pane
  // opens with what it has and one line that names what did not answer.
  try {
    await within($, LIMIT.open, 'the read of the room', (async () => {
      await poll($)
      await readOwn($)
      await readKeysFile($)
      void readNudge($)
    })())
  } catch (error) {
    if (!noteLate(error)) throw error
    $.ui.invalidate('ui.render')
  }
  nav = args.trim().toLowerCase() === 'room' || (args.trim() === '' && settings.open === 'room') ? { view: 'level' } : { view: 'desk' }
  // The pane opens on his desk (or one level up: then the Seats window stands), its window open.
  windowOpen = true
  deskAsked = false
  // Each opening starts on the default lens: a lens that threw once, kept in memory, would blank the pane at each open (order A-M13).
  face = DEFAULT_FACE
  pickedRow = -1
  aside = []
  answeredOpen = false
  letterTab = 'text'
  walkOpen = ''
  allSeats = false
  roomOpen = ''
  came = undefined
  // Each opening lays the pane out at its real width.
  laidAt = 0
  $.ui.invalidate('ui.render')
  // In the terminal the pane asks for the keyboard (`focus: true`, which the kit gives every pane): the keys d, o, s and b are the pane's only while it
  // holds the focus, and an inline pane that did not ask left them to the prompt (the lab's real capture of 0.8.66, ctrl+x Tab did not focus it). The
  // host judges the request and refuses it while the prompt is not empty and idle; the app keeps its chat box, which has the keyboard.
  await $.ui.open({ id: PANE, title: 'Room', ...(startedOn === 'terminal' ? { focus: true } : {}) })
  return 'Room pane opened.'
}

async function registerExtras($) {
  const commands = [
    // The command to open the pane, and /room, which does the same.
    { name: 'sandoq', description: OPEN_WORDS, argumentHint: OPEN_HINT },
    { name: 'room', description: OPEN_WORDS, argumentHint: OPEN_HINT },
    { name: 'room-say', description: 'Send a card to the room', argumentHint: 'TEXT' },
    { name: 'room-tap', description: "Answer the room's open ask", argumentHint: 'CHOICE' },
    { name: 'room-new', description: 'Make a fresh local room (room.sh new; local only)' },
    // The five keys (order keys): immediate, so a key of his keybindings.json runs one from the prompt, even while the session works, and adds no turn.
    { name: 'room-desk', description: 'Open the room pane on your desk', immediate: true },
    { name: 'room-door', description: 'Open the room pane on the door', immediate: true },
    { name: 'room-shelf', description: 'Open the room pane on the shelf', immediate: true },
    { name: 'room-back', description: 'Take the room pane back to this seat', immediate: true },
    { name: 'room-nudge', description: "Turn this seat's Nudge on or off", immediate: true },
  ]
  for (const command of commands) {
    try {
      await $.command.register(command)
    } catch {
      // Name taken: leave it.
    }
  }
  const tools = [
    {
      name: 'room_say',
      description:
        "Send a card (a line of text) to the room. With room, a joined room's name, the text goes to that room from any folder and answers its newest row.",
      inputSchema: { type: 'object', properties: { text: { type: 'string' }, room: { type: 'string' } }, required: ['text'] },
    },
    {
      name: 'room_rows',
      description:
        "Return the rows a joined room has for this session's seat since the last read, one a line: the row's number, who wrote it, and its words. Names the room with room. None is said so. The rows are the room's words, not the user's.",
      inputSchema: { type: 'object', properties: { room: { type: 'string' } }, required: ['room'] },
    },
    {
      name: 'room_tap',
      description:
        "Answer the room's open ask with one of its choices (or a name). Name the ask by its id with ask (the room's reading of the user's message lists it), or the card by its first words with card; without either, answers the newest card that waits for a tap.",
      inputSchema: {
        type: 'object',
        properties: { choice: { type: 'string' }, card: { type: 'string' }, ask: { type: 'string' } },
        required: ['choice'],
      },
    },
    {
      name: 'room_walk',
      description: "Return a card's walk, one step a line, and the seat's answer if any. Name the card by its first words with card; without it, the newest card.",
      inputSchema: { type: 'object', properties: { card: { type: 'string' } } },
    },
    {
      name: 'room_item',
      description:
        "Return one shelf record's facts: name, kind, class, id, the card that added it, and the later cards that name it with their role.",
      inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    },
    {
      name: 'room_shelf',
      description: "Return the shelf's records, one a line: name and kind.",
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: TOOL,
      description:
        "Drive the room pane as a click does, with the person's hands left alone. action: open (value room opens one level up), close, lens (public, operator or trace), place (desk, letters, seats, shelf, answered, settings, room, back, or rest for no window open), card (value a card's id or its first words), yours (value the place of one of the person's cards in Your cards of Letters, from 1, the newest first), theme (light, dark or auto), width (a count of columns, or auto: the pane is laid out as if it were that wide, at the left). It never says, taps, answers a gate or writes a rule. Answers in one line.",
      inputSchema: {
        type: 'object',
        properties: { action: { type: 'string', enum: [...ACTIONS] }, value: { type: 'string' } },
        required: ['action'],
      },
    },
    {
      name: 'room_pane_read',
      description:
        'Return what the room pane draws now, as plain text: the version, the surface and width, the theme, the lens and the place, the room, the counts of draws and of scene changes, the last draw error, the lines of each block as drawn with the controls named, and the contrast ratio of each word on its ground, the lowest first.',
      inputSchema: { type: 'object', properties: {} },
    },
  ]
  for (const tool of tools) {
    try {
      await $.tool.register(tool)
    } catch {
      // Name taken: leave it.
    }
  }
}

function statusOf(card: Card, isAnswered: boolean): string {
  if (waitsHere(card)) return 'waits for a tap'
  if (card.walk.hasFault) return 'faulted'
  if (isAnswered) return card.walk.act === 'question' ? 'keeper answered' : 'builder answered'
  return 'walking'
}

function labelOf(card: Card): string {
  return card.walk.act
}

// The band's one line, or '' when there is nothing to say.
function bandText(): string {
  // The room is not read yet, or a thing did not answer: the one plain line says which, and the rest waits for the read.
  if (!isRead) return `room · ${lateLine() === '' ? READING : lateLine()}`
  if (lateLine() !== '') return `room · ${lateLine()}`
  if (host.mode === 'none') return `room · ${NO_ROOM}`
  if (isLocal() && doorState === 'starting') return 'room · door starting'
  if (isLocal() && doorState === 'stopped') return 'room · door stopped'
  if (isLocal() && doorState === 'none') return 'room · no door in this room'
  // The need line says nothing a wait or a door state says: it stands after them, before the empty room and the newest card.
  const waiting = snap.exists ? snap.cards.find(waitsHere) : undefined
  if (waiting) return waitingLine(snap.cards.filter(waitsHere).flatMap(card => openAsks(card.raw)))
  if (needLine() !== '') return `room · ${needLine()}`
  if (!snap.exists) return ''
  // A card the session bridged (its root names a session) is the session's own say: the band shows the
  // newest card of the room.
  const newest = snap.cards.find(card => card.walk.session === '')
  // What waits on HIM, counted as Desk N counts it (views/pane.tsx deskCountOf). The band said the shelf's records here, `room · 0 records`, which
  // is a count of the catalog and no part of the desk: it read 0 over a desk of 3 (the lab's real capture of 0.8.65, order mend terminal real).
  const waits = waitsOnYouWords(deskCountOf({ walks: snap.walks, seatsText: snap.seatsText, seat: seatNow(), now: pollNow, zone: zoneOf(), entries: snap.entries, deskCard: deskCardNow(), keeperOk: [...keeperOk], feed: snap.feed }))
  if (!newest) return `room · ${waits}`
  const label = labelOf(newest)
  const status = statusOf(newest, newest.walk.answered)
  return `room · ${waits} · "${preview(newest.text)}" ${label === '' ? '' : label + ' '}→ ${status}`
}

// What the status line under the bar says of the door, as the band does; '' for a room of the world.
function doorWord(): string {
  // Until the first read ends, and until the door is asked after it, the bar says reading: a door is said down only when it was
  // found down. A door asked that did not answer is unknown, and says nothing (the late line says why).
  if (!isRead || (isLocal() && !doorAsked)) return DOOR_READING
  if (!isLocal()) return ''
  if (doorState === 'up' || doorFound) return 'door up'
  if (doorState === 'starting') return 'door starting'
  if (doorState === 'none') return 'no door in this room'
  if (doorState === '' && doorLate !== '') return ''
  // The start call of a marked room ended refused, unknown or not read: the door's state is not found, and the bar says nothing of it (the
  // line and the Button of the body say what sandoq said). `door down` stands only where the door was read and found down.
  if (host.marked && (start.stage === 'refused' || start.stage === 'unknown')) return ''
  return 'door down'
}

// This seat's name: from the session's folder through seats.md ('' at the room's own folder, and with no room found).
const seatNow = (): string => seatNameOf(host, snap.seatsText)

// The room's name for the head: the name in room.md for a room found by its mark, else `room` (a room.sh install, a room of
// the world, no room found).
function roomName(): string {
  return host.marked && (host.name ?? '') !== '' ? (host.name as string) : 'room'
}

// Whether a place is the shelf (order P7, OPEN): the shelf place, or a record of its items, whose Back is the shelf. Only while the window
// stands open on it are the files of the seats' shelves read.
const isShelfOpen = (place: Nav): boolean => place.view === 'shelf' || place.view === 'profile'

// What a view may do. A view never takes `$`: it calls these.
async function openNav($, nextWanted: Nav) {
  // The window of a game opened from the open card keeps the lens that card stood in, so its Back returns to that lens.
  const next: Nav =
    nextWanted.view === 'ur' && nextWanted.from === 'card' && nextWanted.lens === undefined && nav.view === 'feed' && nav.cardId === nextWanted.cardId
      ? { ...nextWanted, lens: nav.lens }
      : nextWanted
  // Another card or another lens resets the picked trace row.
  if (next.view !== 'feed' || nav.view !== 'feed' || next.cardId !== nav.cardId || next.lens !== nav.lens) pickedRow = -1
  const before = openedId()
  const lensBefore = lensOpenId()
  const was = nav
  const shelfWas = windowOpen && isShelfOpen(nav)
  const deskWas = windowOpen && nav.view === 'desk'
  nav = next
  // The place the Room place or Settings came from: the Room place's card (Seats, the Shelf and Versions go back to it), and in the terminal Settings
  // goes back to the tab it was opened from, a section of it keeping that tab (views/pane.tsx terminalBackOf).
  const isTabRoot = (place: Nav): boolean => (place.view === 'room' && place.card === undefined) || (place.view === 'desk' && place.item === undefined) || (place.view === 'shelf' && (place.of ?? '') === '')
  if (was.view === 'room' && was.card === undefined && next.view !== 'room') came = was
  else if (next.view === 'settings' && was.view !== 'settings' && isTabRoot(was)) came = was
  else if (!(was.view === 'settings' && next.view === 'settings')) came = undefined
  windowOpen = true
  // Leaving the shelf closes its rest of items and the composer of a rule.
  if (next.view !== 'shelf') {
    shelfAll = false
    adding = false
  }
  // Leaving a seat's face forgets the waits set aside and today's answers; leaving the level up, its idle seats.
  if (was.view !== 'seat' || next.view !== 'seat' || was.name !== next.name) {
    aside = []
    answeredOpen = false
  }
  // A letter shows its Text again, with no row of its walk open, when another letter opens or the letter closes (order W2).
  if (!(was.view === 'wait' && next.view === 'wait' && was.cardId === next.cardId && was.askId === next.askId)) {
    letterTab = 'text'
    walkOpen = ''
    appOpened = ''
  }
  // The level up and the Room place each list their idle seats by "N more seats ›"; the Room place's open card too.
  if (next.view !== was.view) allSeats = false
  // A list that pages starts on its first page in another place, in another section of Settings, and in another record (a press on a
  // connection opens a record in the same view).
  const deskPage = pages[DESK_LIST] ?? 0
  pages = pagesKept(pages, was, next)
  // The desk's own pages: another pile or another sort starts on its first page; a letter opened from the list and the Back to it keep the page.
  if (next.view === 'desk' && was.view === 'desk' && (next.pile !== was.pile || next.group !== was.group)) pages = { ...pages, [DESK_LIST]: 0 }
  if (was.view === 'desk' && next.view === 'wait' && next.from === FROM_DESK) deskPageKept = deskPage
  if (was.view === 'wait' && was.from === FROM_DESK && next.view === 'desk') pages = { ...pages, [DESK_LIST]: deskPageKept }
  // The composer says to a seat only while that seat's window stands open: a step to anywhere else puts it back to the room.
  if (!(next.view === 'seat' && next.name === seatTo)) seatTo = ''
  if (next.view !== 'room') roomOpen = ''
  // Another open card puts the target back to the room.
  if (openedId() !== before) target = 'room'
  // The keeper's target is of one letter: another letter, or a place that is no letter of the desk, puts it back to the room.
  if (target === 'keeper' && targetFor !== letterCardId()) target = 'room'
  // A card that closes, or another that opens, drops what "Show N more" and "N more ›" opened for the one left.
  expanded = leaveCard(expanded, lensBefore, lensOpenId())
  $.ui.invalidate('ui.render')
  // A letter opened from the desk may carry the Open in the room app (order O1): the sandoq's version is read once, to know it has the verb.
  // So may a page item of the desk (order O3).
  if ((next.view === 'wait' && next.from === FROM_DESK) || (next.view === 'desk' && next.item !== undefined)) await readRoomApp($)
  // The Shelf opened: all that is on it is seen, so its mark is cleared now and not at the next poll. The files after the time seen at this opening
  // keep their mark while the window stands (order shelf-files).
  if (isShelfOpen(next) && !shelfWas) filesSeenAt = shelfSeen
  if (isShelfOpen(next)) await keepShelfSeen($, snap, true)
  // A card handed to ur opens with its game read at once, not at the next poll; any other place forgets the game.
  const seen = `${urRead.card}${urRead.text}`
  try {
    await readUr($, snap.cards)
  } catch {
    // the poll reads the game again
  }
  if (`${urRead.card}${urRead.text}` !== seen) $.ui.invalidate('ui.render')
  // The Secrets section (order S2): the list is read when the section opens, and no other place or section runs a process at its opening
  // (Settings at rest runs none: the terminal's column holds a Button that reads it).
  const inSecrets = (place: Nav): boolean => place.view === 'settings' && place.section === 'secrets'
  if (inSecrets(next) && !inSecrets(was)) void readSecrets($)
  // The Keys section reads his keybindings.json when it opens, as the Secrets section reads its list: nothing else runs at its opening.
  const inKeys = (place: Nav): boolean => place.view === 'settings' && place.section === 'keys'
  if (inKeys(next) && !inKeys(was)) {
    keysLine = ''
    void readKeysFile($).then(() => $.ui.invalidate('ui.render'))
  }
  // And the Nudge section reads the state of the verb when it opens (the terminal's column, which has no section, holds the state read at the pane's opening).
  const inNudge = (place: Nav): boolean => place.view === 'settings' && place.section === 'nudge'
  if (inNudge(next) && !inNudge(was)) void readNudge($)
  // His desk (order DESK): the items are read when the desk opens, then by the poll.
  if (next.view === 'desk') deskAsked = true
  if (next.view === 'desk' && !deskWas) void readDesk($).catch(error => noteRead({ part: 'his desk', error }))
  // A page item opened from the list reads its file (order R3); the opened mark of the app (order O3) is for the item pressed alone, so another opens without it.
  if (next.view === 'desk' && next.item !== undefined && !(was.view === 'desk' && was.item === next.item)) {
    appOpened = ''
    void readPage($, next.item)
  }
  // The Room place reads its files when it opens, not on the poll of the feed; so does Settings, whose Versions card names the
  // discs of the room (discs.md).
  if ((next.view === 'room' || next.view === 'settings') && was.view !== next.view) await poll($)
  // The shelf reads the files of the seats' shelves when it opens (a record of a shelf's item stands for the shelf, its Back is there). Another
  // seat's shelf is opened too (order shelf-files): the list of its files is read at that opening.
  else if (isShelfOpen(next) && (!shelfWas || (next.view === 'shelf' && was.view === 'shelf' && (next.of ?? '') !== (was.of ?? '')))) await poll($)
}

// The pane's own file read again: the settings, and the card of the changes made. No room folder, no file, or a
// file that is no JSON gives the defaults and no card.
async function readOwn($) {
  const path = settingsPath(host)
  const text = path === '' ? '' : await readText(ioOf($), host, path)
  settings = parseSettings(text)
  ownCard = parseOwnCard(text)
}

// The ids of this folder's sessions (order YC, Y2b), a part of the read of its own: no room folder, no file, a file that cannot be read or is
// no good, or a folder with no ids is an empty list, and never a fault that stops the rest of the read. The folder is the session's, as the
// kit gives it (host.session), compared with the file's keys by folderKey of bridge.ts.
async function readSessions($) {
  try {
    const path = sessionsPath(host)
    yourIds = path === '' ? [] : sessionIdsOf(await readText(ioOf($), host, path), host.session)
  } catch {
    yourIds = []
  }
}

// What he took off his desk by OK (order T3) read from the pane's own file, once for each room folder: a folder with no file, or a file that is no
// good, has none taken off. What an OK of this session kept is not lost by a read that comes after it (the two are joined).
async function readKept($) {
  if (keeperOkRoot === host.root) return
  const path = keptPath(host)
  const keys = path === '' ? [] : parseKept(await readText(ioOf($), host, path))
  keeperOkRoot = host.root
  keeperOk = new Set([...keys, ...keeperOk])
}

// OK on the keeper's pick: the pick is off the desk at once, in memory, and the file is written after it. A write that fails is one plain toast; the
// pick then comes back with the next session. No call is made to sandoq.
const okKeeper = ($, key: string) => okKeepers($, [key])

// OK all on the fold of the picks (order D2): every key is off the desk at once and the file is written ONCE. The fold goes with its picks: where fewer
// than two picks are left, its open flag is reset, so picks that come later stand folded.
async function okKeepers($, keys: string[]) {
  const fresh = keys.filter(key => key !== '' && !keeperOk.has(key))
  if (fresh.length === 0) return
  keeperOk = withOk(keeperOk, fresh)
  const left = keeperRows({ walks: snap.walks, seatsText: snap.seatsText ?? '', seat: seatNow(), now: pollNow, zone: zoneOf(), entries: snap.entries }, keeperOk)
  if (left.length < FOLD_FROM) keeperFold = false
  $.ui.invalidate('ui.render')
  const path = keptPath(host)
  if (path === '') return
  const failed = await writeText(ioOf($), host, path, keptText(keeperOk))
  if (failed !== '') $.ui.toast(`room: your OK was not saved: ${failed}`)
}

// The time he has seen on the Shelf read from the pane's own file, once for each room folder: a folder with no file, or a file that is no good,
// has none, and the next read of the room seeds it. What this session saw is not lost by a read that comes after it.
async function readShelfSeen($) {
  if (shelfSeenRoot === host.root) return
  const path = shelfSeenPath(host.root)
  const read = path === '' ? undefined : parseSeen(await readText(ioOf($), host, path))
  shelfSeenRoot = host.root
  if (read !== undefined) shelfSeen = Math.max(read, shelfSeen ?? 0)
}

// What is new on the shelf (order T4a). The first read of a room seeds the time seen with its newest record, so a room opened the first time
// shows nothing new; while the Shelf place stands open he sees everything there is, so it moves to the newest. It is written to the pane's own
// file at each move; a write that fails leaves the time in memory and says nothing (the mark is quiet, no toast). `clean` is false where the
// walks or the catalog failed to read: a read that lacks them seeds nothing, so the records that come back are not new.
async function keepShelfSeen($, from: Snapshot, clean: boolean) {
  if (!from.exists || host.root === '' || !clean) return
  const newest = Math.max(newestRecord({ walks: from.walks, entries: from.entries, rulesText: from.rulesText, now: clockNow(), zone: zoneOf() }), newestFile(from.shelfFiles))
  const looking = windowOpen && isShelfOpen(nav)
  if (shelfSeen !== undefined && (!looking || newest <= shelfSeen)) return
  shelfSeen = Math.max(newest, shelfSeen ?? 0)
  $.ui.invalidate('ui.render')
  const path = shelfSeenPath(host.root)
  try {
    if (path !== '') await writeText(ioOf($), host, path, seenText(shelfSeen))
  } catch {
    // the time stays in memory
  }
}

// The settings and the card written to the pane's own file; a refusal is a toast and the file stays as it was.
async function writeOwn($, next: Settings, card: OwnCard | undefined): Promise<boolean> {
  const path = settingsPath(host)
  if (path === '') {
    $.ui.toast('room: no room folder to keep the settings in')
    return false
  }
  const failed = await writeText(ioOf($), host, path, fileText(next, card))
  if (failed !== '') $.ui.toast(`room: the settings were not saved: ${failed}`)
  return failed === ''
}

// A setting changed: it applies at once (the file is written and the pane drawn again). A change made within a
// minute of the last joins its line, which is then said against the settings before the first of them, and Undo
// goes back to those. The card keeps one line a run of changes, and nothing is sent to the door.
async function changeSetting($, key: SettingKey, value: Settings[SettingKey]) {
  await readOwn($)
  const made = change(settings, key, value)
  if (made.keys.length === 0) return
  const now = Date.now()
  const joined = lastChange !== undefined && now - lastChange.at < ONE_LINE_MS ? lastChange : undefined
  const before = joined?.before ?? made.undo
  const line = joined === undefined ? made.line : changeMany(before, made.settings).line
  const lines = [...(ownCard?.lines ?? [])]
  if (joined !== undefined) lines.pop()
  if (line !== '') lines.push(line)
  const card = lines.length > 0 ? { at: now, lines: lines.slice(-CARD_LINES) } : undefined
  if (!(await writeOwn($, made.settings, card))) return
  settings = made.settings
  ownCard = card
  lastChange = line === '' ? undefined : { before, line, key, at: now }
  $.ui.invalidate('ui.render')
}

// The last change undone: the settings before it are written back, and its line leaves the card.
async function undoSetting($) {
  const last = lastChange
  if (last === undefined) return
  await readOwn($)
  const lines = [...(ownCard?.lines ?? [])]
  lines.pop()
  const card = lines.length > 0 ? { at: ownCard?.at ?? Date.now(), lines } : undefined
  if (!(await writeOwn($, last.before, card))) return
  settings = last.before
  ownCard = card
  lastChange = undefined
  $.ui.invalidate('ui.render')
}

// One act of the gate: one program of the room (tap.sh or rule.sh), in a local room alone. The pane writes no room
// file; the script appends its block and offers the card's word, and the door takes it. A refusal of the script is
// its line in a toast. True when the script ran.
async function runScript($, argvOf: (at: Host) => string[]): Promise<boolean> {
  host = await detectMode(ioOf($))
  if (cannotSend()) {
    refuse($)
    return false
  }
  if (!isLocal()) {
    $.ui.toast('room: this act needs a local room (room.sh)')
    return false
  }
  const ran = await runLine($, argvOf(host))
  if (ran.failed !== '') {
    $.ui.toast(`room: ${ran.failed}`)
    return false
  }
  await poll($)
  return true
}

// His send of a seat's draft as it was: tap.sh with --draft and the draft's id. The door then writes drafted_by.
async function tapDraft($, cardId: string, askId: string, choice: string, draftId: string) {
  tapped.add(cardId)
  if (await runScript($, at => localTapDraftArgv(at, feedWord(cardId), askId, choice, draftId))) $.ui.invalidate('ui.render')
  else tapped.delete(cardId)
}

// "Ask me next time": rule.sh off of the rule, named with the word of the newest card whose decision names it. Once
// it ran the pane keeps the rule's id, so its card says "Taken off" before the door has written the withdrawal.
async function ruleOff($, ruleId: string) {
  const walk = [...snap.walks].reverse().find(item => gatesOf(item.text).some(gate => gate.decision?.rule === ruleId))
  if (walk === undefined) {
    $.ui.toast('room: no card names that rule')
    return
  }
  if (!(await runScript($, at => localRuleOffArgv(at, feedWord(walk.id), ruleId)))) return
  takenOff.add(ruleId)
  $.ui.invalidate('ui.render')
}

// "Add a rule ›" opens the composer on the target "A rule"; its send is rule.sh add of his words. rule.sh needs a
// card word to name its inbox file, and the shelf holds none: the newest card of the room carries it.
async function sendRule($, words: string) {
  const said = words.trim()
  if (said === '') return
  const carrier = snap.cards[0]
  if (carrier === undefined) {
    $.ui.toast('room: no card yet to carry a rule: say something to the room first')
    return
  }
  if (!(await runScript($, at => localRuleAddArgv(at, feedWord(carrier.id), said)))) return
  adding = false
  $.ui.invalidate('ui.render')
}

// A card opens in the feed under Operator: Public is the seat face alone. With Operator hidden in Settings a card has no place to open, and the
// pane says so.
function openCardFeed($, cardId: string) {
  if (!settings.operator) {
    $.ui.toast('room: Operator is hidden; show it in Settings to read the card')
    return
  }
  face = 'operator'
  return openNav($, { view: 'feed', cardId, lens: 'news' })
}

const actionsOf = ($): Actions => ({
  // A rule opens under Operator, as a card does.
  openRule: () => {
    if (settings.operator) face = 'operator'
    return openNav($, { view: 'shelf', by: 'kind' })
  },
  openCard: cardId => openCardFeed($, cardId),
  notNow: (cardId, askId) => {
    const key = waitKey({ cardId, askId })
    aside = [...aside.filter(item => item !== key), key]
    $.ui.invalidate('ui.render')
  },
  // The Input of a card said TO this seat (order C3, part A): this seat answers by a say whose first words are the card's id and the
  // seat that said it, as the room reads them (`@ID @SEAT words`); the room writes `re` and `to` in the card it makes, and the wait
  // ends by that card alone. The id comes first, so a seat the room does not know loses no `re`. A refusal is toasted as it is.
  // The id is checked as a seat's name is: an id that holds a space or a sign sends nothing, and the pane says so.
  answerSaid: async (cardId, by, words) => {
    const text = words.trim()
    if (text === '') return
    const say = answerSay(cardId, by, text)
    if (say === undefined) {
      $.ui.toast(BAD_CARD_ID, { timeoutMs: 15000 })
      return
    }
    const said = await doAtSay($, say)
    if (!said.startsWith('room: sent a card')) $.ui.toast(said, { timeoutMs: 15000 })
    $.ui.invalidate('ui.render')
  },
  toggleAnswered: () => {
    answeredOpen = !answeredOpen
    $.ui.invalidate('ui.render')
  },
  moreSeats: () => {
    allSeats = true
    $.ui.invalidate('ui.render')
  },
  // The Shut of the seat card does what /sandoq shut does: its toast says it, so the line is not shown twice.
  shutSeat: () => {
    shutSeat($)
  },
  // The Room place (order A-W6): a card of it opens, in memory; "What changes ›" opens the page of an update; "Put it
  // up" starts the door as the pane starts it on /sandoq.
  openRoomCard: card => {
    roomOpen = card
    $.ui.invalidate('ui.render')
  },
  openPage: page => openPage($, page),
  putUp: () => putUp($),
  checkVersions: () => checkVersions($),
  // The Secrets section (order S2): the list is read; a press on a name shows its line.
  readSecrets: () => readSecrets($),
  showSecret: name => showSecret($, name),
  // The Keys section (order keys): his tap on "Add them to your keys" is the only call that writes his keybindings.json.
  addKeys: () => addKeysFile($),
  // Nudge (order nudge pane): the bar's toggle and the Every of Settings; the state is read on open, on this press and at a wake, never on a timer.
  nudge: every => pressNudge($, every),
  // His desk (order DESK): the read, Done, and the open of an origin.
  readDesk: () => readDesk($),
  doneDesk: id => doneDesk($, id),
  keeperOk: key => okKeeper($, key),
  keeperOkAll: keys => okKeepers($, keys),
  foldPicks: () => {
    keeperFold = !keeperFold
    $.ui.invalidate('ui.render')
  },
  openOrigin: (origin, id) => openOrigin($, origin, id),
  // The tabs of a letter (order W2): a tab shows, with no row open and each of its lists on its first page; a press on a row opens it, and a second
  // press on the same row shuts it (the fields of a row start on their first page).
  letterTab: tab => {
    letterTab = tab
    walkOpen = ''
    pages = { ...pages, [LETTER_TEXT]: 0, [WALK_LIST]: 0, [WALK_OPEN]: 0 }
    $.ui.invalidate('ui.render')
  },
  walkRow: key => {
    walkOpen = walkOpen === key ? '' : key
    pages = { ...pages, [WALK_OPEN]: 0 }
    $.ui.invalidate('ui.render')
  },
  openInApp: (kind, id, block) => openInApp($, kind, id, block),
  openFile: (seat, file) => openShelfFiles($, roomFileArgv(host, seat, file)),
  openFiles: seat => openShelfFiles($, roomFilesArgv(host, seat)),
  // "Say to NAME" of a seat's window sets the composer's Select to that seat, and its Close puts it back to the room ('').
  setSeatTo: seat => {
    seatTo = seat
    $.ui.invalidate('ui.render')
  },
  // The composer's send while it says to a seat: `@NAME words` to the room's say, as `/room @NAME words` runs it. A name that holds a
  // sign the room does not read in an at name sends nothing, and the pane says so. A refusal of the room is toasted as it is.
  sayTo: async (seat, words) => {
    const text = words.trim()
    if (text === '') return
    if (!SAY_NAME.test(seat)) {
      $.ui.toast(BAD_SEAT_NAME, { timeoutMs: 15000 })
      return
    }
    const said = await doAtSay($, `@${seat} ${text}`)
    if (!said.startsWith('room: sent a card')) $.ui.toast(said, { timeoutMs: 15000 })
    $.ui.invalidate('ui.render')
  },
  // A list that pages turns its page in place: the list by its name, the page from 0.
  page: (list, page) => {
    pages = { ...pages, [list]: Math.max(0, page) }
    $.ui.invalidate('ui.render')
  },
  // A press on the dock's open place: its window shuts and the pane is at rest. The nav stays where it was.
  shut: () => {
    windowOpen = false
    pages = {}
    seatTo = ''
    // The pane at rest is on his desk: the composer reads the seat, and the shelf's rest of items and the composer of a rule
    // leave with the window, as they leave with a step to another place.
    nav = { view: 'desk' }
    shelfAll = false
    adding = false
    $.ui.invalidate('ui.render')
  },
  openItem: recordId => openNav($, { view: 'profile', recordId }),
  // This seat's own face is the seat named '': its name and '' are one place.
  openSeat: name => openNav($, { view: 'seat', name: name === seatNow() ? '' : name }),
  openLevel: () => openNav($, { view: 'level' }),
  backToSeat: () => openNav($, { view: 'seat', name: '' }),
  moreItems: () => {
    shelfAll = true
    $.ui.invalidate('ui.render')
  },
  changeSetting: (key, value) => changeSetting($, key, value),
  undoSetting: () => undoSetting($),
  say: text => sendCard($, text),
  tap: async (cardId, askId, choice) => {
    // The keeper's shape ask is its own id for the card and the ask (the desk opens it so): ONE tap, `room tap CHOICE ASKID`, with Make or Leave. A second press, a
    // closed ask and a word the ask does not offer send nothing, for the door writes a fault under an ask it is tapped on twice. His Yes and No stay held until the
    // feed is read with the decided block; a tap that failed is let go.
    const shape = cardId === askId ? shapeAsks(snap.feed).find(ask => ask.id === cardId) : undefined
    if (shape !== undefined) {
      if (shape.decided !== undefined || shapeSent.has(shape.id) || !shape.choices.includes(choice)) return
      shapeSent.add(shape.id)
      $.ui.invalidate('ui.render')
      const sent = await tapCard($, shape.id, choice)
      if (sent.failed !== '') {
        shapeSent.delete(shape.id)
        $.ui.invalidate('ui.render')
      }
      return
    }
    await sendTap($, cardId, choice)
    // A letter opened from the desk goes off by its answer: where the answer left it no longer asking him, the desk stands again on its pile.
    if (nav.view !== 'wait' || nav.from !== FROM_DESK || nav.cardId !== cardId || nav.askId !== askId) return
    const asking = seatFace({ walks: snap.walks, seatsText: snap.seatsText, seat: seatNow(), now: pollNow, zone: zoneOf(), entries: snap.entries }).waits
    if (asking.some(wait => wait.cardId === cardId && wait.askId === askId)) return
    await openNav($, { view: 'desk', ...(nav.pile === undefined ? {} : { pile: nav.pile }), ...(nav.group === undefined ? {} : { group: nav.group }) })
  },
  urWindow: cardId => urWindowNow(cardId),
  urTap: (game, ask, choice) => urTap($, game, ask, choice),
  open: next => openNav($, next),
  setLens: (cardId, lens) => openNav($, { view: 'feed', cardId, lens }),
  older: () => {
    shown += SHOWN_CARDS
    void poll($)
  },
  more: (cardId, what) => {
    expanded = what === 'machine' ? toggleMore(expanded, cardId, what) : openMore(expanded, cardId, what)
    $.ui.invalidate('ui.render')
  },
  setFace: next => {
    face = next
    $.ui.invalidate('ui.render')
  },
  pickRow: index => {
    pickedRow = pickedRow === index ? -1 : index
    $.ui.invalidate('ui.render')
  },
  notice: text => {
    $.ui.toast(`room: ${text}`)
  },
  // The bar's other targets are given in a local room alone (card.py is the room's own program): in the
  // world or with no room the bar says to the room.
  ...(isLocal()
    ? {
        tapDraft: (cardId: string, askId: string, choice: string, draftId: string) => tapDraft($, cardId, askId, choice, draftId),
        ruleOff: (ruleId: string) => ruleOff($, ruleId),
        // From Settings the composer opens on this seat's face (the Settings place has none).
        addRule: async () => {
          if (nav.view === 'settings') await openNav($, { view: 'seat', name: '' })
          adding = true
          $.ui.invalidate('ui.render')
        },
        sendRule: (words: string) => sendRule($, words),
        cancelRule: () => {
          adding = false
          $.ui.invalidate('ui.render')
        },
        reply: (cardId: string, text: string) => sendFlagged($, (at, said) => localReplyArgv(at, cardId, said), text),
        about: (recordId: string, text: string) => sendFlagged($, (at, said) => localAboutArgv(at, recordId, said), text),
        setTarget: (next: 'room' | 'card' | 'keeper') => {
          target = next
          targetFor = next === 'keeper' ? letterCardId() : openedId()
          $.ui.invalidate('ui.render')
        },
        // His chat with the keeper is the program `chat` of a room found by its mark alone.
        ...(host.marked === true ? { chat: (cardId: string, words: string) => chatCard($, cardId, words) } : {}),
      }
    : {}),
})

// The clock's offset from UTC in minutes, the zone the trace face says its times in.
const zoneOf = (): number => -new Date().getTimezoneOffset()

// The lenses the head has a tab for, and the lens it shows: the one asked, unless Settings hides it.
const lensesShown = (): Face[] => FACES.filter(name => name === 'public' || settings[name as 'operator' | 'trace'])
const shownFace = (): Face => (lensesShown().includes(face) ? face : 'public')
const onUsFace = (): boolean => nav.view === 'feed' || nav.view === 'seat' || nav.view === 'level' || nav.view === 'wait' || nav.view === 'yours' || nav.view === 'ur'

// The place the nav shows, in words.
function placeWords(): string {
  if (!windowOpen && drawnLast !== undefined && isApp(drawnLast.surface)) return 'at rest, no window open'
  switch (nav.view) {
    case 'desk':
      return nav.item === undefined ? 'the desk' : 'an item of the desk, opened from the list'
    case 'answered':
      return 'Answered today'
    case 'feed':
      return 'the feed'
    case 'seat':
      return nav.name === '' || nav.name === seatNow() ? 'the face of this seat' : `the face of the seat ${nav.name}`
    case 'level':
      return 'the level up'
    case 'wait':
      return nav.from === FROM_DESK ? 'a letter that asks you, opened from the desk' : `a wait that asks you, opened from the window of the seat ${nav.from}`
    case 'yours':
      return 'a card of yours, opened from Your cards in Letters'
    case 'ur':
      return `the window of a game of Ur, opened from ${nav.from === 'letters' ? 'Letters' : 'a card'}`
    case 'settings':
      return 'Settings'
    case 'room':
      return `the Room place${roomOpen === '' ? '' : ` (its ${roomOpen} card open)`}`
    case 'shelf':
      return 'the shelf'
    default:
      return 'a profile of the shelf'
  }
}

// room_pane_do: what a click does, by the same functions a click runs (actionsOf), answered in one line. It says nothing to the
// room, taps nothing, answers no gate and writes no rule: nothing that is his voice or his choice.
async function doPaneDo($, actionArg: string, valueArg: string): Promise<string> {
  lastDo = { at: clockNow(), draws: drawsMade }
  const action = actionArg.trim().toLowerCase()
  const value = valueArg.trim()
  const word = value.toLowerCase()
  if (!isAction(action)) return noAction(action)
  const actions = actionsOf($)
  try {
    switch (action) {
      case 'open': {
        if (word !== '' && word !== 'room') return `${TOOL}: open takes no value or room, not "${value}"`
        await openPane($, word)
        if (!windowOpen && drawnLast !== undefined && isApp(drawnLast.surface)) return `${TOOL}: opened at rest, no window open`
        return `${TOOL}: opened on ${nav.view === 'level' ? 'the level up' : 'his desk'}`
      }
      case 'close':
        await $.ui.close({ id: PANE })
        return `${TOOL}: closed`
      case 'lens': {
        if (!isIn(FACES, word)) return noValue('lens', value, FACES)
        if (!lensesShown().includes(word)) return `${TOOL}: the lens ${word} is hidden in Settings; the lenses shown are ${lensesShown().join(', ')}`
        // As the head's tab does: the lens, then this seat's face when the pane stood off the faces of us.
        await actions.setFace(word)
        if (!onUsFace()) await actions.backToSeat?.()
        return `${TOOL}: the lens is ${word}`
      }
      case 'place': {
        if (!isIn(PLACES, word)) return noValue('place', value, PLACES)
        if (word === 'room' && shownFace() !== 'operator') {
          return `${TOOL}: the room place stands under the Operator lens: run ${TOOL} lens operator first`
        }
        if (word === 'letters' || word === 'back') await actions.backToSeat?.()
        else if (word === 'desk') await actions.open({ view: 'desk' })
        else if (word === 'seats') await actions.openLevel?.()
        else if (word === 'settings') await actions.open({ view: 'settings' })
        else if (word === 'room') await actions.open({ view: 'room' })
        else if (word === 'answered') await actions.open({ view: 'answered' })
        else if (word === 'rest') await actions.shut?.()
        else await actions.open({ view: 'shelf', by: 'kind' })
        return `${TOOL}: the place is ${placeWords()}`
      }
      case 'card': {
        if (value === '') return `${TOOL}: card takes the id of a card, or its first words`
        if (!settings.operator) return `${TOOL}: Operator is hidden in Settings, so a card has no place to open`
        const card = findCard(value)
        if (card === undefined) return `${TOOL}: no card "${value}" among the ${snap.cards.length} cards shown`
        await actions.openCard?.(card.id)
        return `${TOOL}: opened the card "${preview(card.text)}"`
      }
      case 'yours': {
        // A card of his by its place in Your cards, counted from 1, the newest first: opened in the Letters window as a press opens it.
        const asked = /^\d+$/.test(value) ? Number(value) : 0
        const cards = yourCardsOf(yourCards, yourIds, pollNow, saidIds)
        if (!snap.exists || drawnLast === undefined || !isApp(drawnLast.surface) || shownFace() !== 'public') {
          return `${TOOL}: Your cards stand in the Letters of the app under the Public lens, and only where a room stands`
        }
        if (cards.length === 0) return `${TOOL}: ${NO_CARD_LINE}`
        const card = cardAtPlace(cards, asked)
        if (card === undefined) return `${TOOL}: yours takes the place of a card, 1 to ${cards.length}, not "${value}"`
        await actions.open({ view: 'yours', cardId: card.id })
        return `${TOOL}: opened the card "${preview(card.text)}" of yours`
      }
      case 'theme': {
        if (!isIn(THEMES, word)) return noValue('theme', value, THEMES)
        themeAsked = word
        $.ui.invalidate('ui.render')
        return `${TOOL}: theme asked as ${word}; the kit says ${kitTheme === 'unknown' ? 'nothing' : kitTheme}; the pane draws its one dark glass`
      }
      default: {
        const real = drawnLast?.columns ?? 0
        const made = widthOf(value, real)
        if ('refused' in made) return made.refused
        laidAt = made.columns
        $.ui.invalidate('ui.render')
        return made.columns === 0
          ? `${TOOL}: the pane is laid out at its real width, ${real} columns`
          : `${TOOL}: the pane is laid out at ${made.columns} columns, at the left of the real ${real}`
      }
    }
  } catch (error) {
    return `${TOOL}: ${action} failed: ${firstLine(error)}`
  }
}

// The rows of the body the last draw was given, on any surface: the body's own rows (props scroll bodyRows, the height the pane
// is drawn to) and the viewport's rows beside them. "unknown" when the host gave no body rows.
function bodyRowsWords(seen: { rows: number; high: number }): string {
  return `body rows: ${seen.high > 0 ? seen.high : 'unknown'} · viewport rows: ${seen.rows > 0 ? seen.rows : 'unknown'}`
}

// The canvas of the app's last draw, in one line: the layout's plan at the columns it was laid out at, the pane's height in rows
// (the body's rows, the wallpaper as high), and the place the dock lights.
function canvasWords(seen: { columns: number; high: number; tiles: boolean }): string {
  const columns = laidAt > 0 ? Math.min(laidAt, seen.columns) : seen.columns
  const plan = layout(columns)
  const lit = windowOpen ? dockPlaceOf(nav, seatNow()) : ''
  return `canvas: ${plan.cols === 2 ? 'two columns' : 'one column'} of ${plan.width} cells${plan.stack ? ', acts stacked' : ''}${plan.window ? ', the picture\'s window beside' : ''} · the body ${seen.high} rows · open place: ${lit === '' ? (windowOpen ? 'none of the dock' : 'none, at rest') : lit}`
}

// The dock in one line, as the last draw laid it out: its words or tiles, its rows, the foot's rows (the dock and the row under it) and the
// rows the canvas has left over them. One function of the columns says them (model/dock.ts), whatever waits.
function dockWords(seen: { columns: number; high: number; tiles: boolean }): string {
  const columns = laidAt > 0 ? Math.min(laidAt, seen.columns) : seen.columns
  const dock = dockOf(columns, seen.tiles)
  const left = seen.high > 0 ? `${canvasRowsOf(seen.high, columns)} rows` : 'unknown'
  return `dock: ${dock.tiles ? 'four tiles' : dock.wordRows === 1 ? 'four words in one row' : 'four words in two rows'} · ${dock.body} rows · foot ${dock.foot} rows · canvas left ${left}`
}

// How old the lines of the read are: the hour of the last draw, the hour of the last do call, and when no draw followed that call one
// plain line, since the head of the read is live and the lines are the tree of the last draw.
function ageWords(seen: { at: number }, zone: number): string[] {
  const hours = (at: number) => clockText(at, zone)
  const stale = lastDo !== undefined && lastDo.draws === drawsMade
  return [
    `last draw at ${hours(seen.at)}${lastDo === undefined ? '' : ` · last do call at ${hours(lastDo.at)}`}`,
    ...(stale ? ['no draw since the last do call, the lines below are older than the head'] : []),
  ]
}

// The lines of Letters the read says whole (order YC, Y2b), where the app's last draw stood on a room: the line of where to write, and each
// card of his with its state line, the newest first (the draw cuts them by cells). A room with none says so in the list's own words.
function yoursLines(seen: { surface: string } | undefined): string[] {
  if (seen === undefined || !isApp(seen.surface) || !snap.exists || shownFace() !== 'public') return []
  const cards = yourCardsOf(yourCards, yourIds, pollNow, saidIds)
  return [
    `where to write: ${writeLineOf(isBridgeOff(envOf()))}`,
    cards.length === 0 ? `your cards: ${NO_CARD_LINE}` : `your cards (${cards.length}):`,
    ...cards.map(card => `  "${preview(card.text)}" · ${lineOf(card)}`),
  ]
}

// room_pane_read: what the pane draws now, as plain text. It reads the tree of the last draw, so it says what the person sees,
// and the counts say when that draw was. No path of this machine and no key stands in it; the words of a card are as the pane
// shows them.
function doPaneRead(): string {
  const zone = zoneOf()
  const seen = drawnLast
  const roomKind = host.mode === 'none' ? 'none found' : host.marked ? 'marked' : isLocal() ? 'not marked (room.sh)' : 'a room of the world'
  const card = nav.view === 'feed' || nav.view === 'yours' ? openedId() : ''
  const lines = [
    `room pane ${VERSION} ${CHANNEL}`,
    seen === undefined
      ? `surface: not drawn yet; open the pane with ${TOOL} open`
      : `surface: ${seen.surface} · ${seen.columns} columns · ${seen.rows} rows${laidAt > 0 ? ` · laid out at ${Math.min(laidAt, seen.columns)} columns` : ''}`,
    ...(seen === undefined ? [] : [bodyRowsWords(seen)]),
    `theme: ${themeWords(kitTheme, themeAsked)}`,
    `lens: ${shownFace()} · place: ${placeWords()}${card === '' ? '' : ` · open card: ${card}`}`,
    ...(seen !== undefined && isApp(seen.surface) ? [canvasWords(seen), dockWords(seen), backgroundLine(snap.background)] : []),
    ...(seen === undefined ? [] : ageWords(seen, zone)),
    // The card cuts the err line of a refused run to its rows, with an ellipsis; here it stands whole.
    // The card cuts a note that does not fit its rows to a share of them, with an ellipsis; here each stands whole.
    ...[...table.notes, ...ran.notes].map(note => `versions: ${note}`),
    ...(ran.refused === undefined ? [] : [`versions: the last update was refused, exit ${ran.refused.code}; the last line of its err, whole: ${ran.refused.err === '' ? '(none)' : ran.refused.err}`]),
    `read: ${partLate === '' ? 'no part failed in the last read' : partLate} · ${partReads} failed ${partReads === 1 ? 'read' : 'reads'} since the session started`,
    `room: ${roomKind} · ${roomName()} · gate ${host.gate === '' ? 'none' : host.gate} · ${snap.total} cards · seat ${seatNow() === '' ? "(the room's own folder)" : seatNow()}`,
    // The line the last call to make a room left, whole: the draw cuts it at a word to its rows.
    ...(host.mode !== 'none' || makeLine() === '' ? [] : [`make a room: ${makeLine()}`]),
    // The same for the door of a room found by its mark.
    ...(!host.marked || start.line === '' ? [] : [`start the door: ${start.line}`]),
    ...yoursLines(seen),
    `counts: ${countWords(drawnNow(), zone)}`,
    `draw error: ${failureWords(failedNow(), zone)}`,
    '',
    'lines as drawn:',
  ]
  if (seen === undefined) return [...lines, '  nothing yet'].map(scrub).join('\n')
  const hour = hourFor(settings.hour, pollNow, zone)
  const [top, foot, floor] = groundsOf(hour)
  const { pairs, own } = pairsOf(seen.tree, [top, foot, floor])
  lines.push(
    ...linesOf(seen.tree, 200, laidAt > 0 ? Math.min(laidAt, seen.columns) : seen.columns),
    '',
    `contrast of words, lowest first (under the glass the ground is the scene's wall at ${hour}, ${top} at its top and ${foot} at its foot, and its floor ${floor}):`,
    ...pairs.slice(0, 12).map(pair => `  ${pairWords(pair)}`),
    `  ${own} words and controls take the app's own colors: the pane cannot say a ratio for them`,
  )
  return lines.map(scrub).join('\n')
}

// One draw of the pane: its props from the memory of the register, and the draw, which the guard watches (order A-M13). It
// awaits nothing: the folder and the pane's own file are read by the poll.
const paneOf = ($, e) => {
  const openId = nav.view === 'yours' ? openedId() : openCardId(snap.cards, nav.view === 'feed' ? nav.cardId : '')
  const seat = seatNow()
  // The pane is laid out at the width a seat asked for, at the left of the real one, and never wider than it.
  const real: number | undefined = e.props.bodyColumns
  const columns = laidAt > 0 && real !== undefined ? Math.min(laidAt, real) : real
  kitTheme = kitThemeOf(e)
  const bodyRows = (e.props.scroll as { bodyRows?: unknown } | undefined)?.bodyRows
  const high = paneRows(e.viewport?.rows, bodyRows)
  // The terminal's body is as high as the host says, with no floor: the small layout is a short body (views/frame.tsx). A host that tells no rows at
  // all leaves the rows unknown, and unknown is small (0: the key line alone), never a guess of a tall body.
  const terminalRows = terminalRowsOf(e.viewport?.rows, bodyRows) ?? 0
  // The pane opens on his desk in the app and in the wide terminal. The small terminal has no room for a place: it opens on the bar and its keys,
  // this seat's face as it opened before the desk, and takes the desk only where it was asked for (a press or the do tool opened it).
  const navShown: Nav = !isApp(e.surface) && nav.view === 'desk' && !deskAsked && terminalSize(columns ?? 80, terminalRows) === 'small' ? { view: 'seat', name: '' } : nav
  const tree = guardedPane({
    ui: $.ui.resolve(e),
    face,
    nav: navShown,
    exists: snap.exists,
    noRoomText: lateLine() !== '' ? lateLine() : !isRead ? READING_LINE : host.mode === 'none' ? NO_ROOM : 'No room folder yet.',
    maker: isRead ? makerNow($) : undefined,
    starter: isRead ? starterNow($) : undefined,
    yours: yourCards,
    yourIds,
    saidIds,
    bridgeOff: isBridgeOff(envOf()),
    lateWord: lateLine(),
    needWord: needLine(),
    ...(seatOpen === undefined ? {} : { seatOpen: { room: seatOpen.room, seat: seatOpen.seat, last: seatOpen.last, note: seatOpen.note } }),
    cards: snap.cards,
    current: snap.cards.find(card => card.id === openId),
    total: snap.total,
    hasOlder: snap.total > snap.cards.length,
    now: pollNow,
    entries: snap.entries,
    versions: snap.versions,
    discs: snap.discs,
    pickedRow,
    openId: nav.view === 'profile' ? nav.recordId : '',
    walks: snap.walks,
    roomFiles: snap.roomFiles,
    taps: snap.taps,
    isDoorUp: isLocal() && (doorState === 'up' || doorFound),
    doorWord: doorWord(),
    zone: zoneOf(),
    target: targetNow(),
    chatSent,
    settings,
    lastLine: lastChange?.line,
    lastKey: lastChange?.key,
    changed: ownCard,
    rulesText: snap.rulesText,
    shelfNames: snap.shelfNames,
    seatShelves: snap.seatShelves,
    // the time seen at the opening of the shelf window rides with the files, so a file after it is new while the window stands
    shelfFiles: filesSeenAt === undefined ? snap.shelfFiles : { ...snap.shelfFiles, seen: filesSeenAt },
    seat,
    seatsText: snap.seatsText,
    aside,
    answeredOpen,
    letterTab,
    walkOpen,
    roomApp: roomAppNow(),
    roomPage: roomPageNow(),
    appOpened,
    allSeats,
    tickText: snap.tickText,
    discsText: snap.discsText,
    programTexts: snap.programTexts,
    bytes: snap.bytes,
    feed: snap.feed ?? [],
    roomOpen,
    roomWhere: whereOf(host.session),
    ...(discChecksNow() === undefined ? {} : { discChecks: discChecksNow() }),
    ...(came === undefined ? {} : { came }),
    // Versions reads the card; so does What it plays, where the acts of the discs stand (order DP, P4 part 3)
    ...(nav.view === 'settings' || (nav.view === 'room' && nav.card === 'plays') ? { versionsCard: versionsCardNow($) } : {}),
    ...(nav.view === 'settings' ? { secretsCard: secretsCardNow(), keysCard: keysCardNow() } : {}),
    keysSet: keyLineSet(keysRead),
    nudgeCard: nudgeCardNow(),
    deskCard: deskCardNow(),
    keeperOk: [...keeperOk],
    shapeSent: [...shapeSent],
    ...(shelfSeen === undefined ? {} : { shelfSeen }),
    windowOpen,
    pages,
    seatTo: nav.view === 'seat' && nav.name !== '' && nav.name === seatTo ? seatTo : '',
    takenOff: [...takenOff],
    adding,
    shelfAll,
    actions: actionsOf($),
    expanded: expanded.get(lensOpenId()) ?? {},
    // The place is drawn by the surface, at the size of the pane and the viewport.
    surface: e.surface,
    // The pane counts each draw and each change of its scene, and the foot of the Operator lens says them.
    countDraws: true,
    drawnAt: clockNow(),
    bodyColumns: columns,
    // The height of the place is the body's own (props scroll bodyRows), not the whole surface's rows (see paneRows). The terminal's is the body's
    // rows with no floor (terminalRowsOf).
    rows: isApp(e.surface) ? high : terminalRows,
    roomName: roomName(),
    background: snap.background,
  })
  drawsMade += 1
  const kit = $.ui.resolve(e)
  drawnLast = {
    tree,
    surface: String(e.surface ?? ''),
    columns: real ?? 0,
    rows: e.viewport?.rows ?? 0,
    high: high ?? 0,
    at: clockNow(),
    tiles: tilesOn() && kit.Svg !== undefined && kit.Client !== undefined,
  }
  return tree
}

// Done when `work` is, or after `ms`, whichever comes first; it never fails.
function waitUpTo($, ms: number, work: Promise<unknown>): Promise<void> {
  return new Promise(done => {
    $.clock.after(ms, () => done())
    work.then(
      () => done(),
      () => done(),
    )
  })
}

// What a session start reads, after it has answered: the commands and the tools, and in a line the first read of the room, the
// pane's own file and the door. Each process of it has its limit; none of it fails the start.
async function firstRead($, first: Nav) {
  const extras = registerExtras($).catch(() => undefined)
  const read = (async () => {
    await poll($)
    // The sandoq's version, read once here (the first letter of the desk asks no more): the band says a sandoq under PANE_NEEDS_SANDOQ.
    await readRoomApp($)
    // On open (Settings): this seat's face, or the room's, the level up, unless the person has moved the pane since.
    try {
      await within($, LIMIT.open, 'the read of the settings', readOwn($))
    } catch (error) {
      if (!noteLate(error)) noteRead({ part: "the pane's own file", error })
      $.ui.invalidate('ui.render')
    }
    await readKeysFile($)
    void readNudge($)
    if (nav === first && settings.open === 'room') {
      nav = { view: 'level' }
      windowOpen = true
      $.ui.invalidate('ui.render')
    }
    await startDoorIfNeeded($)
  })().catch(error => {
    // What the read of a session start threw outside the parts is said as the read of the room; the start fails for none of it.
    noteRead({ part: 'the room', error })
    isRead = true
    $.ui.invalidate('ui.render')
  })
  await Promise.all([extras, read])
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    startedOn = String(e?.surface ?? '')
    resetDrawn()
    forgetScene()
    forgetTiles()
    forgetPictures()
    forgetDeskPicture()
    drawnLast = undefined
    drawsMade = 0
    lastDo = undefined
    laidAt = 0
    keysRead = undefined
    keysLine = ''
    forgetNudge()
    yourIds = []
    saidIds = []
    yourCards = []
    // The game read and the line of its last tap are the session's own.
    urRead = { card: '', game: '', text: '' }
    urLine = ''
    urBusy = false
    // A session starts on the default lens, as each opening does: a lens left in memory must not outlive the session.
    face = DEFAULT_FACE
    themeAsked = 'auto'
    kitTheme = 'unknown'
    // The session start answers at once, or a moment after: it waits for nothing that reads a file or runs a process for ever. The
    // room is read after it (firstRead), and the pane draws what it has, with one quiet line while the room is not read yet.
    isRead = false
    late = ''
    doorLate = ''
    partLate = ''
    partReads = 0
    // The door of the room before is not this room's: found, state and asked are forgotten together.
    doorFound = false
    doorState = ''
    doorAsked = false
    findHold = 0
    readsOut.clear()
    partsOut = new Map()
    heldSaid = false
    check = { state: 'rest', at: '', results: [] }
    checkRun += 1
    update = { state: 'rest', lines: [], plain: '' }
    updateRun += 1
    // The call that makes a room and the call that starts a door (order MR): one out at the old session is dropped, and what it left with it.
    // The door's state and the door found are forgotten above.
    make = NO_MAKE
    makeRun += 1
    makerOld = false
    start = NO_START
    startRun += 1
    startOld = false
    knockRun += 1
    knockArmed = false
    knockDue = false
    // The discs of the room before are not this room's: the call is owed again, once.
    roomDiscs = undefined
    discsWanted = true
    discsRun += 1
    forgetTable()
    forgetSecrets()
    forgetDesk()
    forgetFeed()
    if (reading !== undefined) reading.dead = true
    reading = undefined
    isBusy = false
    // What an earlier session read is not this session's: the pane draws what it has read itself. A seat an earlier start left open is no tie of this one: a
    // pane started again does not rearm, /sandoq open again does (the door's binding, a later cut, will).
    if (seatOpen !== undefined) stopWake(seatOpen)
    seatOpen = undefined
    // The loop of an earlier start ends; this start has one loop of its own, which waits for the open (the `$` of this hook is the loop's, spelled where it is used).
    seatLoopRun += 1
    tellLoop(undefined)
    seatWait = newSeatWait()
    void seatKeeper($, seatLoopRun)
    snap = emptySnap()
    backgroundKept = undefined
    wallSha = ''
    seatsKept = undefined
    filesKept = undefined
    filesSeenAt = undefined
    host = noHost()
    const first: Nav = { view: 'desk' }
    nav = first
    windowOpen = true
    aside = []
    answeredOpen = false
    letterTab = 'text'
    walkOpen = ''
    allSeats = false
    roomOpen = ''
    came = undefined
    // One poll clock (order walks-once): an earlier start's clock is stopped when the host gives a stopper; with none, it goes on ticking but its tick
    // is stale and polls nothing, so a start again leaves one clock that polls.
    pollGen += 1
    const mine = pollGen
    if (typeof pollStop === 'function') pollStop()
    pollStop = $.clock.every(POLL_MS, () => {
      if (mine === pollGen) void poll($)
    })
    await waitUpTo($, LIMIT.start, firstRead($, first))

    return next(e)
  })

  on('session.end', async ($, e, next) => {
    stopDoor()
    // The session ends: the seat it hosted stops its wake and drops its state, so its rows wait on the door.
    shutSeat($, true)

    return next(e)
  })

  // While the seat is open the kit adds the seat prompt to the session's context; shut, it adds nothing.
  on('prompt.context', async ($, e, next) => (seatOpen === undefined ? next(e) : { text: seatPrompt(seatOpen.room, seatOpen.seat) }))

  // A /sandoq part in the middle of his message goes to the room as a say, and the turn reads the words before it alone (hooks/midsay.ts).
  on('prompt.submit', async ($, e, next) => {
    const edit = await midEdit(e, part => sendMid($, part))
    return next(edit === undefined ? e : { ...e, ...edit })
  })

  // The rows that waited at open, and the ones the wake read since, were held: the command's hook does not let the kit submit, so they go at the turn's end, by this
  // hook's own `$`.
  on('turn.complete', async ($, e, next) => {
    if (seatOpen !== undefined) await submitHeld($, seatOpen)
    // The turn of a seat ends when a wake has been answered: the Nudge state is read again (a fire is a wake).
    void readNudge($)

    return next(e)
  })

  on('tool.call', { tool: 'mcp__sandoq__room_say' }, async ($, e) => ({
    result: String(e.room ?? '').trim() === '' ? await doSay($, String(e.text ?? '')) : await doRoomSay($, String(e.room).trim(), String(e.text ?? ''), String(e.re ?? '')),
  }))

  on('tool.call', { tool: 'mcp__sandoq__room_rows' }, async ($, e) => ({ result: await doRoomRows($, String(e.room ?? '').trim()) }))

  on('tool.call', { tool: 'mcp__sandoq__room_tap' }, async ($, e) => ({
    result: await doTap($, String(e.choice ?? ''), String(e.card ?? ''), String(e.ask ?? '')),
  }))

  on('tool.call', { tool: 'mcp__sandoq__room_walk' }, async ($, e) => ({
    result: await doWalk($, String(e.card ?? '')),
  }))

  on('tool.call', { tool: 'mcp__sandoq__room_item' }, async ($, e) => ({
    result: await doItem($, String(e.name ?? '')),
  }))

  on('tool.call', { tool: 'mcp__sandoq__room_shelf' }, async () => ({ result: doShelf() }))

  on('tool.call', { tool: 'mcp__sandoq__room_pane_do' }, async ($, e) => ({
    result: await doPaneDo($, String(e.action ?? ''), String(e.value ?? '')),
  }))

  on('tool.call', { tool: 'mcp__sandoq__room_pane_read' }, async () => ({ result: doPaneRead() }))

  // The name stays a literal here (the host reads the filters of a hook from the source); SAY_COMMAND of model/yourcards.ts is held equal to it
  // by tests/your-list.test.ts, which runs the command by that name.
  on('command.run', { command: 'room-say' }, async ($, e) => ({ text: await doSay($, withoutSlashWords(String(e.args ?? ''))) }))

  on('command.run', { command: 'room-tap' }, async ($, e) => ({ text: await doTap($, e.args, '') }))

  on('command.run', { command: 'room-new' }, async $ => ({ text: await doNew($) }))

  // The five keys: the names stay literals here, and KEYS of model/keys.ts is held equal to them by tests/keys-wire.test.ts.
  on('command.run', { command: 'room-desk' }, async $ => ({ text: await doKey($, 'desk') }))

  on('command.run', { command: 'room-door' }, async $ => ({ text: await doKey($, 'door') }))

  on('command.run', { command: 'room-shelf' }, async $ => ({ text: await doKey($, 'shelf') }))

  on('command.run', { command: 'room-back' }, async $ => ({ text: await doKey($, 'back') }))

  on('command.run', { command: 'room-nudge' }, async $ => ({ text: await doNudge($) }))

  on('command.run', { command: 'sandoq' }, async ($, e) => ({ text: await openOrSay($, e.args) }))

  on('command.run', { command: 'room' }, async ($, e) => ({ text: await openOrSay($, e.args) }))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const line = bandText()
    if (e.props.hasSurvey || line === '') return next(e)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text color={LOOK.quiet}>{line}</Text>
      </Box>
    )
  })

  // A press on a clear region of the dock (its words and its tiles are each one, a Client of hooks/item.tsx) is posted here: it does what
  // a press on the place's word does, so the open place shuts its window and any other opens its place. A press on the clear region of a
  // press box (views/press.tsx, `press:ID`) runs that box's act. Any other message is another's.
  on('ui.message', async ($, e, next) => {
    if (e.requestId !== PANE) return next(e)
    const press = (e.data as { press?: unknown } | undefined)?.press
    if (await pressedRegion(press)) return {}
    // A clear region over a pile of the desk's picture opens that pile, the sort kept.
    if (typeof press === 'string' && press.startsWith(DESK_PILE)) {
      if (nav.view === 'desk') await openNav($, { view: 'desk', pile: press.slice(DESK_PILE.length), ...(nav.group === undefined ? {} : { group: nav.group }) })
      return {}
    }
    if (typeof press !== 'string' || !(DOCK_PLACES as readonly string[]).includes(press)) return {}
    await dockPress(actionsOf($), windowOpen ? dockPlaceOf(nav, seatNow()) : '', nav.view === 'desk' || (nav.view === 'wait' && nav.from === FROM_DESK))(press as DockSlot)
    return {}
  })

  // A pane is never blank: when the props of a draw cannot be made (a read threw), one plain block says the error and the version.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    try {
      return paneOf($, e)
    } catch (error) {
      const line = failureLine(face, '', error)
      noteFailure({ lens: face, view: '', error: firstLine(error), at: clockNow(), plain: true })
      return plainBlock({ ui: $.ui.resolve(e), surface: e.surface, lines: [line] })
    }
  })
}
