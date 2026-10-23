// The pane's side of the host: where the room is, what is read of its folder, and the argv of a post.
// The functions that read take an `Io`, the four reads of the host's `$`; register.tsx makes it from
// `$` (the host follows `$` only inside the file that holds the `on(...)` hooks, never across an
// import). No view calls them.
import {
  DEFAULT_GATE,
  MARK_FILE,
  MARK_PROGRAMS,
  ROOM_SH,
  SANDOQ_CURRENT,
  SANDOQ_NAME,
  SANDOQ_OPTION,
  SESSIONS_FILE,
  findRoomFrom,
  foldersFrom,
  foldersUp,
  isMarked,
  isSessionId,
  relativeTo,
  roomCandidates,
  roomFolderOf,
  workFolderOf,
} from './bridge.ts'
import type { Env, Room } from './bridge.ts'
import { pagePathOf } from './model/page.ts'
import { NUDGE_EVERY } from './model/nudge.ts'
import { mayMakeRoomIn, roomNameOf } from './model/roomstart.ts'
import { seatName } from './model/seat.ts'
import { settingsText } from './model/settings.ts'
import type { Settings } from './model/settings.ts'
import { parseRecord } from './model/shelf.ts'
import type { Disc } from './model/shelf.ts'
import { SEAT_NAME, fileNameFit } from './model/shelffiles.ts'
import { urWalkFile } from './model/ur.ts'

// The plugin's version: the same text as .claude-plugin/plugin.json (a test fails when they differ).
export const VERSION = '0.8.79'
// The channel the pane runs in: `prod` in the released pane; .kairos/devpane/refresh.sh makes it `dev` in the dev copy. The status line says it.
export const CHANNEL = 'prod'
// The plugin option that names the sandoq program (its settings, empty by default), as the hooks read it.
export const SANDOQ_OPTION_NAME = 'sandoq'

// WORLD mode: the folder under the session's folder, or an ancestor's, that holds the world's run folder.
export const WORLD_ROOT = '.kairos/runtime/room/salam/kernel/run-room'
export const WORLD_CLI = 'salam/cli.py'
// Said by the pane, the band and a refused say or tap when no room is found.
export const NO_ROOM = 'no room here: run sandoq room new in this folder'
// Said by a refused say or tap of a room found by its mark when no sandoq program is found in the four places.
export const NO_SANDOQ = `sandoq is not found: set the option ${SANDOQ_OPTION_NAME} in the settings of sandoq`

export const POLL_MS = 2000

const GATE_NAME = /^[A-Za-z0-9_-]+$/

// A post names its script (room.sh, or cli.py of the world) by the full path it was found at.
export const worldPostArgv = (cliPy: string, text: string): string[] => [
  'python3', cliPy, 'post', '--by', 'lab', '--to', 'room', text,
]
export const localSayArgv = (roomSh: string, text: string): string[] => ['sh', roomSh, 'say', text]
export const localTapArgv = (roomSh: string, choice: string, id = ''): string[] =>
  id === '' ? ['sh', roomSh, 'tap', choice] : ['sh', roomSh, 'tap', choice, id]
export const localNewArgv = (roomSh: string): string[] => ['sh', roomSh, 'new']
export const localStartArgv = (roomSh: string): string[] => ['sh', roomSh, 'start']

// A session's id as sandoq takes it after the flag --session: the shape of isSessionId of bridge.ts (letters, digits, dashes and underscores,
// never a dash first, for sandoq would read it as a flag). An id of another shape, or none, is no id: the flag is then not passed and sandoq
// takes the session of the newest card of the seat.
export const sessionIdOf = (given: unknown): string => (typeof given === 'string' && isSessionId(given) ? given : '')

// A room found by its mark says and taps through sandoq; a room found by room.sh says and taps through its room.sh as
// before. The pane never runs `sandoq room new`. A tap runs in the room's folder. A say runs in the SESSION's folder, for
// sandoq reads the seat from the folder it runs in (the longest line of seats.md), so the pane holds no seat word: the text is
// one word of the argv, and the flag --session and the id stand before it only when the id is of the room's shape. This is the
// session's voice (the tool and the command); the bar's say of a marked room makes his card by barCardArgv.
export const sayArgv = (host: Host, text: string, session = ''): string[] =>
  host.marked
    ? inRunArgv(host, [host.sandoq ?? '', 'room', 'say', ...(sessionIdOf(session) === '' ? [] : ['--session', session]), text], undefined, host.session)
    : localSayArgv(host.roomSh, text)
export const tapArgv = (host: Host, choice: string, id = ''): string[] =>
  host.marked ? inRunArgv(host, [host.sandoq ?? '', 'room', 'tap', choice, ...(id === '' ? [] : [id])]) : localTapArgv(host.roomSh, choice, id)
export const startArgv = (host: Host): string[] =>
  host.marked ? inRunArgv(host, [host.sandoq ?? '', 'room', 'start']) : localStartArgv(host.roomSh)

// The commands of the Versions card of Settings (sandoq 0.3.0, the json form: one object a line, read by model/steps.ts). The noun and
// the verb of each stand ONCE here, by name. The pane never runs `sandoq disc update`: that brings the machine's disc, not this
// room's, so a disc of this room is updated by `room update` alone.
export const CHECK_WORD = '--check'
export const JSON_WORD = '--json'
export const RESTART_WORD = '--restart'
const UPDATE = 'update'
const PANE_NOUN = 'pane'
const ROOM_NOUN = 'room'
// The checks: each argv holds the word `--check`, so none runs an update. The first asks sandoq itself, from the folder the pane
// runs in; the second asks the room, from the room's own folder as a tap runs, and with `--restart` so that it says what a press of
// Update would do to the door (an object of noun door, would-restart, or the refusal door-stands).
export const updateCheckArgv = (host: Host): string[] => [host.sandoq ?? '', UPDATE, CHECK_WORD, JSON_WORD]
export const roomUpdateCheckArgv = (host: Host): string[] =>
  inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, UPDATE, CHECK_WORD, RESTART_WORD, JSON_WORD])
// The update of the pane: sandoq pane update, from the folder the pane runs in, on the press of the Update of the pane's line alone.
// It changes nothing of the room and stops no door.
export const updatePaneArgv = (host: Host): string[] => [host.sandoq ?? '', PANE_NOUN, UPDATE, JSON_WORD]
// The Secrets section of Settings (order S2): `sandoq secret list` says each name, its discs and where it is kept. The pane runs no other call
// of the noun: a value is set in a terminal or in the sandoq control panel.
const SECRET_NOUN = 'secret'
export const secretListArgv = (host: Host): string[] => [host.sandoq ?? '', SECRET_NOUN, 'list']
// His desk (order DESK, D1): `sandoq room desk list --json --all` says each item, open and done, one json object a line; `desk done ID` takes one
// off (sandoq's `--by` is `you` when not given, and a refusal is one line). Both run in the room's own folder, as the other calls of a room do.
// The pane runs no `desk put`: a seat puts an item on the desk. An older sandoq has no `room desk`, and says usage.
const DESK_VERB = 'desk'
export const deskListArgv = (host: Host): string[] => inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, DESK_VERB, 'list', JSON_WORD, '--all'])
export const deskDoneArgv = (host: Host, id: string): string[] => inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, DESK_VERB, 'done', id])
// The room app: `sandoq room open NAME letter ID` finds or starts the one server of the panel and opens his browser at the letter; the pane
// holds no port, no token and no opener for it. NAME is the marked room's name and ID the card's id, each of the plain word shape (letters, digits,
// dot, dash, underscore, no dash first, so neither is read as a flag), else there is no argv. It runs in the room's own folder, as the other calls
// of a room do, and has ROOM_APP_LIMIT ms (a first start of the server). ROOM_APP_FROM is the first sandoq that has the verb (the room app
// ships in sandoq 0.4.18); the pane reads `sandoq --version` once and shows the press from that version on.
export const ROOM_APP_FROM = '0.4.18'
// The newest sandoq whose verb or file format the pane uses; a cut that needs a newer one moves it. Under it the band says one line (paneNeedsLine),
// from the same `sandoq --version` read as the room app's press, which the pane makes once at its start too.
export const PANE_NEEDS_SANDOQ = '0.4.19'
export const ROOM_APP_LIMIT = 10000
const OPEN_VERB = 'open'
export type RoomKind = 'letter' | 'walk' | 'page'
// The page verb rides a later sandoq than the letter and the walk: it ships in sandoq 0.4.19 (the page press is shown from it).
// The same verb opens an image, a video or a sound in the same release, so the same constant gates them.
export const ROOM_PAGE_FROM = '0.4.19'
// The path a page item may open in the app: the path of its origin as the pane reads it (pagePathOf of model/page.ts: not absolute, no `..`
// step, `.` steps and doubled slashes taken out), and then each part not empty and not starting with a dash (so it is read as no flag), and no part
// starting with a dot but `.sandoq` as the FIRST part. The clean path, or none.
export function roomPagePath(path: string): string | undefined {
  const named = pagePathOf(`page:${path}`)
  if (named?.path === undefined) return undefined
  const parts = named.path.split('/')
  const fit = parts.every((part, at) => part !== '' && !part.startsWith('-') && (!part.startsWith('.') || (at === 0 && part === '.sandoq')))
  return fit ? named.path : undefined
}
// A walk may name the block to mark: `sandoq room open NAME walk ID BLOCK`, BLOCK of the plain word shape as the others; a letter has none.
// A page has its path for the id, checked by roomPagePath; the path is ONE argv word after the script, as each word of inRunArgv is, and
// never part of the script's text.
export const roomOpenArgv = (host: Host, kind: RoomKind, id: string, block?: string): string[] | undefined => {
  const name = host.name ?? ''
  if (host.marked !== true || (host.sandoq ?? '') === '' || !DISC_NAME.test(name)) return undefined
  if (kind === 'page') {
    const path = block === undefined ? roomPagePath(id) : undefined
    return path === undefined ? undefined : inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, OPEN_VERB, name, kind, path])
  }
  if (!DISC_NAME.test(id)) return undefined
  if (block === undefined) return inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, OPEN_VERB, name, kind, id])
  if (kind !== 'walk' || !DISC_NAME.test(block)) return undefined
  return inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, OPEN_VERB, name, kind, id, block])
}
// FILES ON THE SHELF (order shelf-files): the first sandoq that lists a shelf's files (`shelf list`) and opens them in the room app (`room open NAME
// files [SEAT]` and `room open NAME file SEAT FILE`). The pane reads and presses from that version on; under it the Files part is one dim line and
// nothing is run. The two lists run in the room's own folder, as the other calls of a room do; a seat is of the plain word shape, a file a path of a
// shelf (model/shelffiles.ts), each ONE argv word, else there is no argv.
export const SHELF_FILES_FROM = '0.4.22'
const SHELF_NOUN = 'shelf'
const FILES_KIND = 'files'
const FILE_KIND = 'file'
export const shelfSeatsArgv = (host: Host): string[] => inRunArgv(host, [host.sandoq ?? '', SHELF_NOUN, 'list', JSON_WORD])
export const shelfListArgv = (host: Host, seat: string): string[] | undefined =>
  SEAT_NAME.test(seat) ? inRunArgv(host, [host.sandoq ?? '', SHELF_NOUN, 'list', seat, JSON_WORD]) : undefined
// All the seats' files (no seat), or one seat's, in the room app; one file of a seat.
export const roomFilesArgv = (host: Host, seat?: string): string[] | undefined => {
  const name = host.name ?? ''
  if (host.marked !== true || (host.sandoq ?? '') === '' || !DISC_NAME.test(name)) return undefined
  if (seat === undefined) return inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, OPEN_VERB, name, FILES_KIND])
  return SEAT_NAME.test(seat) ? inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, OPEN_VERB, name, FILES_KIND, seat]) : undefined
}
export const roomFileArgv = (host: Host, seat: string, file: string): string[] | undefined => {
  const name = host.name ?? ''
  if (host.marked !== true || (host.sandoq ?? '') === '' || !DISC_NAME.test(name) || !SEAT_NAME.test(seat) || !fileNameFit(file)) return undefined
  return inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, OPEN_VERB, name, FILE_KIND, seat, file])
}
// NUDGE (order nudge pane): the verb that wakes a seat at an interval, in the world (`salam/cli.py nudge`) and in a marked room (`sandoq room nudge ROOM`,
// from the sandoq release that has it). Both take `--seat SEAT` and print one json object (`--json`, NudgeRead of model/nudge.ts); the change is the
// interval alone (`--every D`, D one of NUDGE_EVERY), `off` (`--off`), or none: the state is only read. The seat is of the plain word shape and the
// room's name of DISC_NAME, each ONE argv word that is read as no flag, else there is no argv. A room runs in its own folder, as the other calls do.
export type NudgeChange = string | undefined
const nudgeFlags = (change: NudgeChange): string[] | undefined =>
  change === undefined ? [] : change === 'off' ? ['--off'] : NUDGE_EVERY.includes(change) ? ['--every', change] : undefined
export const worldNudgeArgv = (cliPy: string, seat: string, change?: NudgeChange): string[] | undefined => {
  const flags = nudgeFlags(change)
  return cliPy === '' || flags === undefined || !SEAT_NAME.test(seat) ? undefined : ['python3', cliPy, 'nudge', '--seat', seat, ...flags, JSON_WORD]
}
export const roomNudgeArgv = (host: Host, seat: string, change?: NudgeChange): string[] | undefined => {
  const name = host.name ?? ''
  const flags = nudgeFlags(change)
  if (host.marked !== true || (host.sandoq ?? '') === '' || !DISC_NAME.test(name) || flags === undefined || !SEAT_NAME.test(seat)) return undefined
  return inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, 'nudge', name, '--seat', seat, ...flags, JSON_WORD])
}
export const sandoqVersionArgv = (sandoq: string): string[] => [sandoq, '--version']
export const roomAppVersionArgv = (host: Host): string[] => sandoqVersionArgv(host.sandoq ?? '')

// A Claude session as the seat of a joined room (/sandoq open ROOM SEAT and /sandoq shut). SESSION_OPEN_FROM is the first sandoq that has the verbs below
// (session cut 1 of the room's sandoq); under it /sandoq open says one line and runs nothing but the version. Tonight the open state is the pane's own,
// per session: no tap opens or shuts, and the door's binding comes in a later cut. Each argv of the seat stands ONCE here and runs from the session's
// folder, whatever room it is in, with the sandoq program given (found as the others are).
export const SESSION_OPEN_FROM = '0.4.22'
// THE SEAT WITH NO PANE: from sandoq SEAT_FOLDER_FROM the program keeps the seat of a folder and does the wake (`room seat`, `room seat off`, `room wake --hook`);
// the plugin keeps no state of its own. A sandoq under it: the hook is silent and the commands say one line.
export const SEAT_FOLDER_FROM = '0.4.28'
// `room seat ROOM [SEAT]` sits this folder as SEAT of the joined room (SEAT left out: the seat of the room's member file); `room seat off` drops it; `room seat`
// alone says it. They run from the session's folder, which is the folder sandoq keys the state by.
export const folderSeatArgv = (sandoq: string, room: string, seat = ''): string[] => [sandoq, ROOM_NOUN, 'seat', room, ...(seat === '' ? [] : [seat])]
export const folderSeatOffArgv = (sandoq: string): string[] => [sandoq, ROOM_NOUN, 'seat', 'off']
export const folderSeatShowArgv = (sandoq: string): string[] => [sandoq, ROOM_NOUN, 'seat']
// The hook: the hook's JSON on its input; no entry for the folder is silence, rows are the turn on the err with exit 2. From WAKE_HOOK_FROM the runtime answers
// `room wake` itself, in every folder; under it the hook runs nothing (the seat verbs above stand from SEAT_FOLDER_FROM).
export const WAKE_HOOK_FROM = '0.4.29'
export const folderWakeHookArgv = (sandoq: string): string[] => [sandoq, ROOM_NOUN, 'wake', '--hook']
// The hook's exit. A wake is exit 2 with the rows on the err; a sandoq whose room wake does not know --hook answers its usage line with exit 2, and that is no wake.
// So 2 only when the code is 2 and no line of the err opens with the usage line; any other case (usage, exit 1, a signal, no code, exit 0) is 0.
export const wakeExitOf = (code: number | null, err: string): number =>
  code === 2 && !err.split('\n').some(line => line.trim().startsWith('usage: sandoq')) ? 2 : 0
// THE HEAR HOOK: `room hear --hook` says the person's words (UserPromptSubmit) and the seat's answer (Stop) to the room; sandoq reads hook_event_name in the host's JSON,
// so the one verb serves both. The prompt side stands from HEAR_HOOK_FROM, the Stop side from HEAR_STOP_FROM (a Stop to 0.4.44 is exit 0 and silent). The plugin reads no
// prompt: the wake turn, a slash command, an empty prompt and a private one (two dashes first) are sandoq's to skip.
export const HEAR_HOOK_FROM = '0.4.44'
export const HEAR_STOP_FROM = '0.4.45'
export const folderHearHookArgv = (sandoq: string): string[] => [sandoq, ROOM_NOUN, 'hear', '--hook']
// The version a word after `hear` needs; any other word has none and the hook runs nothing.
export const hearFromOf = (word: string | undefined): string | undefined => (word === 'prompt' ? HEAR_HOOK_FROM : word === 'stop' ? HEAR_STOP_FROM : undefined)
// What of sandoq's out goes back: the whole out of a run that ended with code 0, else nothing. The hook's own exit is 0 whatever sandoq did, since an exit 2 on
// UserPromptSubmit blocks his prompt; an out that is not one json line of a fault would be read as context, so it never goes back from a run that did not end well.
export const hearOutOf = (code: number | null, out: string): string => (code === 0 ? out : '')
const SEAT_SESSION_FLAG = '--session'
// The wake: `room wake ROOM --next --seat SEAT --json` passes until a pass holds a row of SEAT, prints that pass's rows of SEAT, one json object a line
// ({r, seat, seq, line}), and exits 0. It is the pane's own process (spawned, never a Bash call of Claude) and has no limit: it ends with rows, or when
// shut stops it.
export const seatWakeArgv = (sandoq: string, room: string, seat: string): string[] => [sandoq, ROOM_NOUN, 'wake', room, '--next', '--seat', seat, JSON_WORD]
// One pass, no wait: every new row of the order as json, the same lines (room_rows, and the rows that waited at open). It shares the mark of the wake.
export const seatRowsArgv = (sandoq: string, room: string): string[] => [sandoq, ROOM_NOUN, 'wake', room, '--once', JSON_WORD]
// The seat's answer: `room say --room ROOM [--session ID] TEXT`, from any folder. The text is one word of the argv. It has no --re: the holder's bridge answers
// the newest row.
export const seatSayArgv = (sandoq: string, room: string, text: string, session = ''): string[] =>
  [sandoq, ROOM_NOUN, 'say', '--room', room, ...(sessionIdOf(session) === '' ? [] : [SEAT_SESSION_FLAG, session]), text]
// Whether a sandoq that said `sandoq X.Y.Z` has the verb: its three numbers are not under those of `from`. Words with no three numbers say no.
export function roomAppHas(said: string, from: string = ROOM_APP_FROM): boolean {
  const have = /(\d+)\.(\d+)\.(\d+)/.exec(said)
  const need = /(\d+)\.(\d+)\.(\d+)/.exec(from)
  if (have === null || need === null) return false
  for (let at = 1; at <= 3; at += 1) if (Number(have[at]) !== Number(need[at])) return Number(have[at]) > Number(need[at])
  return true
}
// The band's line for a sandoq under PANE_NEEDS_SANDOQ: it said `sandoq X.Y.Z` with three numbers, and they are under those of the need. Words with
// no three numbers (no read, a failed read) say nothing, and so does a sandoq at the need or above.
export function paneNeedsLine(said: string): string {
  if (!/\d+\.\d+\.\d+/.test(said) || roomAppHas(said, PANE_NEEDS_SANDOQ)) return ''
  return `This pane needs sandoq ${PANE_NEEDS_SANDOQ} or later: run sandoq update.`
}
// Why the verb did not open the app, in one line: a sandoq without the verb answers exit 2 and the usage line of the noun, whose verbs hold no
// `open`; else the first line of its error, else its code.
export function roomOpenWhy(code: number | undefined, err: string): string {
  const first = err.split('\n').map(line => line.trim()).find(line => line !== '') ?? ''
  const usage = /^usage: sandoq room ((?:[a-z]+\|)*[a-z]+)$/.exec(first)
  if (code === 2 && usage !== null && !usage[1].split('|').includes(OPEN_VERB)) return 'this sandoq has no room app yet'
  return first !== '' ? first : `sandoq room open exited ${code ?? 'with no code'}`
}
// The update of a disc of this room, or of each (no name): `room update`, from the room's own folder; with the restart flag, before
// the name, when the check held the door of the unit with a swap owed (would-restart). It stops the door meanwhile.
export const roomUpdateArgv = (host: Host, name = '', restart = false): string[] =>
  inRunArgv(host, [host.sandoq ?? '', ROOM_NOUN, UPDATE, JSON_WORD, ...(restart ? [RESTART_WORD] : []), ...(name === '' ? [] : [name])])
// A disc's name as the pane puts it in an argv: it never opens with a dash, so it cannot be read as a flag.
export const DISC_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/

// The limit of each command of the card, in ms, said ONCE here. A check asks the network, 150 s; each update (the pane's, a disc's
// or each disc's) fetches and installs, 1800 s, sandoq's own bound of a player install, for a limit under it would cut a run sandoq
// still holds; with the restart flag 1200 s more for each disc that waits (sandoq's bound is 1200 s a disc; ours stands above it).
// Every update goes by spawn (register.tsx), for the app cuts a process run at 30 s.
export type Command = 'check' | 'pane' | 'room'
const UPDATE_LIMIT = 1800000
export const limitOf = (command: Command, waiting = 0, restart = false): number =>
  command === 'check' ? 150000 : command === 'pane' ? UPDATE_LIMIT : UPDATE_LIMIT + (restart ? waiting * 1200000 : 0)
// A press that may pass its plain limit (the restart wait is on top of it) says so on the line of its Button.
export const mayTakeLong = (limitMs: number): boolean => limitMs > UPDATE_LIMIT

// The two calls that make a room and start its door (order MR): each prints one json object. `room new` runs IN THE SESSION'S FOLDER, by
// name in the argv as the other calls of a room carry theirs (never the work folder or the run folder: where no room stands the default
// folder of a run is not surely the session's, and a `room new` from another folder makes a room there), with the NAME FIRST and always a
// name (an older sandoq takes the flag for the name when none comes first, and makes that room), so the name goes through roomNameOf and
// is never empty. The program is the one found for a folder with no room (`host.maker`). `room start --unit` runs as the other calls of a
// room do. An older sandoq answers both with usage, exit 2 and no object, and does nothing.
export const roomNewArgv = (host: Host, name: string): string[] =>
  inRunArgv(host, [host.maker ?? '', 'room', 'new', roomNameOf(name), '--json'], undefined, host.session)
export const roomStartArgv = (host: Host): string[] => inRunArgv(host, [host.sandoq ?? '', 'room', 'start', '--unit', '--json'])

// A room can start a door only when its run folder holds the door's program: room.sh start makes the run
// folder when door.py is not there, and the pane never makes a room.
export const DOOR_PY = 'unpacked/room-seat/door.py'
export const doorPyPath = (root: string): string => `${root.replace(/\/+$/, '')}/${DOOR_PY}`

// Is THIS room's door standing: a door answers a connect on the socket `door` in the run folder (`salam
// door` binds it by that bare name and itself asks it by a connect at its start). The path of the room is
// no part of the question: a session that reaches the room through a link names another path than room.sh
// does, and the same folder answers either way. One process, a fixed script that holds no word of any
// path: the socket's path is its argument, and the script goes to the folder and connects by the bare name,
// as the door does, since a socket's path may be no longer than about 108 bytes and a room's often is. It
// exits 0 on a connect, 1 on a refusal or no file: a socket file with no listener is a door that fell, not a door.
// A door busy with says may have its queue full: the connect then says it would wait, which a door alone says,
// so that too is a door.
export const DOOR_SOCKET = 'door'
const KNOCK = [
  'import os, socket, sys',
  'folder, name = os.path.split(sys.argv[1])',
  'door = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)',
  'door.settimeout(2)',
  'try:',
  '    os.chdir(folder)',
  '    door.connect(name)',
  'except BlockingIOError:',
  '    pass',
  'except OSError:',
  '    sys.exit(1)',
].join('\n')
export const doorKnockArgv = (root: string): string[] => [
  'python3',
  '-I',
  '-c',
  KNOCK,
  `${root.replace(/\/+$/, '')}/${DOOR_SOCKET}`,
]
// What the knock's exit says: true for a door that answered, false for none, and undefined when the
// process could not do its work (no python3 or any other exit): the caller then asks the process list.
export const doorFromKnock = (exitCode: unknown): boolean | undefined => (exitCode === 0 ? true : exitCode === 1 ? false : undefined)

// The fallback, only when the knock cannot run: is a door running whose command line names this room.
// pgrep reads the pattern as an extended regex over the command lines. room.sh
// start runs `exec salam door --verbose --wake held "$run/unpacked/room-seat/door.py" ...`, so the line of
// this room's door holds its run folder's full path as a word of its own. A door of another run folder (the
// world's disc door, another room) holds another path and is not found. Each regex character of the path is
// escaped, so a dot or a plus in a folder's name is read as itself. A room reached through a link may name
// another path than the line holds: the knock is the check, this is the second.
const escapeEre = (text: string): string => text.replace(/[\\^$.|?*+()[\]{}]/g, '\\$&')
export const doorPattern = (root: string): string => `salam[- ]door.* ${escapeEre(`${root.replace(/\/+$/, '')}/unpacked/`)}`
export const doorRunningArgv = (root: string): string[] => ['pgrep', '-f', doorPattern(root)]

// The host's process.run takes an argv and nothing else: no folder, no PATH and no input. A program of the
// room runs in its run folder, under the PATH room.sh says, so it runs under `sh -c`: the folder, the PATH,
// the text for the input and the command are positional parameters, never part of the script's own text,
// so no word of a card is read as shell. The script is the same for all, with the input line only when
// there is a text.
const IN_RUN = 'cd "$1" && PATH="${2:+$2:}$PATH" && export PATH && shift 2'
const WITH_INPUT = 'text=$1 && shift && printf "%s\\n" "$text" | "$@"'
export const inRunArgv = (host: Host, command: string[], input?: string, folder: string = host.work ?? host.root): string[] =>
  input === undefined
    ? ['sh', '-c', `${IN_RUN} && exec "$@"`, 'sh', folder, host.path, ...command]
    : ['sh', '-c', `${IN_RUN} && ${WITH_INPUT}`, 'sh', folder, host.path, input, ...command]

// A program of the room: for a room found by room.sh the file in its programs folder (`.py` by python3, `.sh` by sh); for
// a marked room `sandoq room run PROGRAM WORDS...` by the BARE name, which knows the layout under the mark, so the pane knows none.
const TAP_PROGRAM = 'tap'
const RULE_PROGRAM = 'rule'
const programArgv = (host: Host, program: string, ext: 'py' | 'sh', words: string[]): string[] =>
  host.marked
    ? [host.sandoq ?? '', 'room', 'run', program, ...words]
    : [ext === 'py' ? 'python3' : 'sh', `${host.programs}/${program}.${ext}`, ...words]

// A card that replies to a card (`--re .ULID`) or says about a record (`--about @ULID`): card.py in the
// run folder with the text on its input; it prints the card's word.
// The pane adds the dot and the @ to the bare id.
export const localReplyArgv = (host: Host, cardId: string, text: string): string[] =>
  inRunArgv(host, programArgv(host, MARK_PROGRAMS.card, 'py', [host.gate, '--re', `.${cardId}`]), text)
export const localAboutArgv = (host: Host, recordId: string, text: string): string[] =>
  inRunArgv(host, programArgv(host, MARK_PROGRAMS.card, 'py', [host.gate, '--about', `@${recordId}`]), text)
// The bar's say of a marked room is HIS voice, not the session's: `sandoq room card --no-seat` makes his card in ONE call, the text
// on its input, and rings the door itself (no feed run, no seat word, no session flag). `sandoq room say` is the session's voice
// and would make the text an answer under a seat's open wake. A room found by room.sh keeps card.py with the gate alone.
export const barCardArgv = (host: Host, text: string): string[] =>
  host.marked ? inRunArgv(host, [host.sandoq ?? '', 'room', 'card', '--no-seat'], text) : inRunArgv(host, programArgv(host, MARK_PROGRAMS.card, 'py', [host.gate]), text)
// His line to the keeper on a desk card (order keeper chat): `sandoq room run chat GATE .CARD`, his words on the input. GATE is the instance and .CARD the
// card's word with its dot (the pane adds it to the bare id). Only a marked room has the program by its bare name, so any other room has no argv: [].
export const chatArgv = (host: Host, cardId: string, text: string): string[] =>
  host.marked ? inRunArgv(host, [host.sandoq ?? '', 'room', 'run', 'chat', host.gate, `.${cardId.replace(/^\./, '')}`], text) : []
// feed.sh offers the card's word to the room and rings.
export const localFeedArgv = (host: Host, word: string): string[] =>
  inRunArgv(host, programArgv(host, MARK_PROGRAMS.feed, 'sh', ['-r', host.gate, word]))

// The gate's acts, each one program of the room in its run folder (tap.sh, rule.sh beside feed.sh), with the card's
// word (its dot first, as feedWord makes it). The pane writes no room file: the script appends its block to
// taps/GATE and offers the word again, and the door does the rest.
// His send of a seat's draft as it was: tap.sh GATE WORD ASK CHOICE --draft DRAFT.
export const localTapDraftArgv = (host: Host, word: string, askId: string, choice: string, draftId: string): string[] =>
  inRunArgv(host, programArgv(host, TAP_PROGRAM, 'sh', [host.gate, word, askId, choice, '--draft', draftId]))
// "Ask me next time": rule.sh GATE WORD off RULEID.
export const localRuleOffArgv = (host: Host, word: string, ruleId: string): string[] =>
  inRunArgv(host, programArgv(host, RULE_PROGRAM, 'sh', [host.gate, word, 'off', ruleId]))
// A rule of his words: rule.sh GATE WORD add "WORDS". The WORD only names the inbox file of the block.
export const localRuleAddArgv = (host: Host, word: string, words: string): string[] =>
  inRunArgv(host, programArgv(host, RULE_PROGRAM, 'sh', [host.gate, word, 'add', words]))
// A tap of his move in a game of Ur (order UR, cut UT): the room's tap.sh of the unpacked room-seat disc, with the instance ur, the game's
// ULID WITH its leading dot, the ask and the choice, run in the RUN FOLDER (never the session's or the work folder). It is no `room tap` and
// no bell: tap.sh writes taps/ur/GAME.md, then feed.sh -r has ring.py wake roll by its offer and ask seats, and its exit says which.
export const UR_TAP = 'unpacked/room-seat/tap.sh'
export const UR_INSTANCE = 'ur'
export const urTapArgv = (host: Host, game: string, ask: string, choice: string): string[] =>
  inRunArgv(host, ['sh', UR_TAP, UR_INSTANCE, game.startsWith('.') ? game : `.${game}`, ask, choice], undefined, host.root)
// The game's walk file, read DIRECT: walks/ur/GAME.md of the run folder; '' for no run folder or a game id of another shape.
export const urWalkPath = (host: Host, game: string): string => (host.root === '' || urWalkFile(game) === '' ? '' : `${host.root.replace(/\/+$/, '')}/${urWalkFile(game)}`)
// His rules: rules.md of the room shelf, beside index.md.
export const rulesPath = (host: Host): string => `${host.root}/shelves/room/rules.md`
// Who sits in the room: seats.md of the room shelf. This seat's name is read from the session's folder through it.
export const seatsPath = (host: Host): string => `${host.root}/shelves/room/seats.md`
// This seat's name: none at the room's own folder (the room's seat, whatever the folder is called: the player's `current` is a
// link to a version folder, whose own name is nobody's), else the seat whose line in seats.md names the session's folder, else
// the folder's own last name. The room's own folder is the one the finder found the room in, counted up from the session's
// folder (host.depth), never compared as a spelling: a session reached through a link names its folder another way.
export const seatNameOf = (host: Host, seatsText: string): string =>
  host.session === '' || host.depth === 0 ? '' : seatName(host.session, seatsText)
// What the Room place reads besides seats.md (order CF2): the door's tick.md under logs/, sandoq.py's discs.md at the top of the run
// folder, and the folder cache/programs/, one file a program.
export const tickPath = (host: Host): string => `${host.root}/logs/tick.md`
export const discsPath = (host: Host): string => `${host.root}/discs.md`
export const programsPath = (host: Host): string => `${host.root}/cache/programs`
export const shelfPath = (host: Host): string => `${host.root}/shelves/room`
// The folder of every shelf, the room's and each seat's (shelves/PART/), and a seat's own folder and its themes (the artist's alone).
export const shelvesPath = (host: Host): string => `${host.root}/shelves`
export const seatShelfPath = (host: Host, part: string): string => `${shelvesPath(host)}/${part}`
export const themesPath = (host: Host, part: string): string => `${seatShelfPath(host, part)}/themes`
// The room's own background (order BG): background.svg of the room shelf, beside index.md. The one place the name is written.
export const BACKGROUND_FILE = 'background.svg'
export const backgroundPath = (host: Host): string => `${shelfPath(host)}/${BACKGROUND_FILE}`

// The size on disk of what the room has grown, the walks and the shelf: the sum of the sizes the listings gave. None
// when there is no file, or when a listing gives no size for a file (the pane then says no size).
export function bytesOf(listings: FileEntry[][]): number | undefined {
  const entries = listings.flat()
  if (entries.length === 0 || entries.some(entry => entry.size === undefined)) return undefined
  return entries.reduce((sum, entry) => sum + (entry.size ?? 0), 0)
}

// The page of an update opened by the system's own opener, for a web page alone (http or https, no space): a page of any other kind
// is none. The hooks have no platform to read, so one sh script picks the opener: `open` on a Mac, `xdg-open` on any other system.
// The page is the argument word of the script, never inside its text, and the opener's output goes to the null device, so a
// browser it leaves running holds no pipe of the run. The script ends 127 where its opener is not there.
const OPENER_SCRIPT = 'case "$(uname -s)" in Darwin) exec open "$1" >/dev/null 2>&1 </dev/null ;; *) exec xdg-open "$1" >/dev/null 2>&1 </dev/null ;; esac'
export function openPageArgv(page: string): string[] | undefined {
  return /^https?:\/\/\S+$/i.test(page) ? ['sh', '-c', OPENER_SCRIPT, 'sh', page] : undefined
}

// What an end of the opener says, for the one toast of a page that did not open: 127 is no opener on the system, 3 is the tool xdg-open
// needs not there, any other code is the opener's own.
export function openerFault(exitCode: number | undefined): string {
  if (exitCode === undefined) return 'the opener of the system ended with no code'
  if (exitCode === 127 || exitCode === 3) return 'this system has no opener for a link (xdg-open or open)'
  return `the opener of the system exited ${exitCode}`
}

// The four reads the finder needs: the session's folder, and exists, read and list of a path. The one write is the
// pane's own settings file (see writeText); a host that has none leaves it out.
export type Io = {
  cwd: () => Promise<unknown>
  exists: (path: string) => Promise<unknown>
  read: (path: string) => Promise<unknown>
  list: (path: string) => Promise<{ name: string; size?: number; mtimeMs?: number }[]>
  write?: (path: string, text: string) => Promise<unknown>
  // One process run by an argv, for the one question the file reads cannot answer (where sandoq is); a host that has none leaves it out.
  run?: (argv: string[]) => Promise<{ exitCode?: unknown; stdout?: unknown }>
  // The environment the pane reads for the plugin option that names sandoq; the process's own when none.
  env?: () => Env
}

// One file of a folder as the listing gives it: its name, and its size and time when the host says them.
export type FileEntry = { name: string; size?: number; mtimeMs?: number }

// Where the room is, read again at each poll from the session's folder and up to six above:
// 'room' (a room.sh, the room as discs: LOCAL), 'world' (the world's run folder), 'none' (nothing
// found: nothing is posted), '' before the first read. A post names its script by the full path found.
export type Mode = '' | 'room' | 'world' | 'none'
export type Host = {
  mode: Mode
  // The session's folder: every read names its path relative to it.
  session: string
  roomSh: string
  cliPy: string
  // The room's run folder and the gate whose walks the pane shows.
  root: string
  gate: string
  // Where the room's programs are (card.py, feed.sh) and the PATH room.sh says, in room mode.
  programs: string
  path: string
  // A room found by its mark alone (the fields stay unset for room.sh and the world): its name, the folder its words run
  // in, and the sandoq program that runs them ('' when none is found).
  marked?: boolean
  name?: string
  work?: string
  sandoq?: string
  // Where no room is found (mode none) and a room may be made in the session's folder (mayMakeRoomIn): the sandoq program that makes it,
  // found as the marked room's is. Unset or '' when the folder may not hold a room or no sandoq is found.
  maker?: string
  // How many folders above the session's the room's own folder is (0 at the room's own folder); unset with no room found
  // by room.sh or its mark.
  depth?: number
}

export const noHost = (): Host => ({
  mode: '',
  session: '',
  roomSh: '',
  cliPy: '',
  root: '',
  gate: DEFAULT_GATE,
  programs: '',
  path: '',
})

// The pane keeps every path as a full path, and each read takes it relative to the session's
// folder (as 0.1.10 did): the host's answer to a full path is not known.
export async function readText(io: Io, host: Host, path: string): Promise<string> {
  try {
    return (await io.read(relativeTo(host.session, path))) as string
  } catch {
    return ''
  }
}

// A write of the pane's own file, its path relative to the session's folder as a read is. '' when it was written,
// else the plain line of why not.
export async function writeText(io: Io, host: Host, path: string, text: string): Promise<string> {
  if (io.write === undefined) return 'this host cannot write a file'
  try {
    await io.write(relativeTo(host.session, path), text)
    return ''
  } catch (error) {
    return String(error).slice(0, 160)
  }
}

// The pane's own file at the top of the run folder, which is .sandoq itself (order CF2): the settings, and the pane's own cards.
export const SETTINGS_FILE = 'pane.json'
export const settingsPath = (host: Host): string => (host.root === '' ? '' : `${host.root.replace(/\/+$/, '')}/${SETTINGS_FILE}`)
// The file of what he took off his desk by OK, beside it (order T3): the pane writes it, the pane reads it (model/keeperrow.ts).
export const KEPT_FILE = 'pane-desk.json'
export const keptPath = (host: Host): string => (host.root === '' ? '' : `${host.root.replace(/\/+$/, '')}/${KEPT_FILE}`)
// The file of the session ids of each folder, beside it: the hook writes it, the pane reads it (model/yourcards.ts).
export const sessionsPath = (host: Host): string => (host.root === '' ? '' : `${host.root.replace(/\/+$/, '')}/${SESSIONS_FILE}`)

// The one "Settings changed" card the pane keeps: when the last change was made, and the line of each change (see
// changedCard). It sits in the settings file under `cards`, which parseSettings leaves alone.
export type OwnCard = { at: number; lines: string[] }
const OWN_KIND = 'settings-changed'

export function parseOwnCard(text: string): OwnCard | undefined {
  try {
    const cards = (JSON.parse(text) as { cards?: unknown }).cards
    if (!Array.isArray(cards)) return undefined
    const found = cards.find(card => card?.kind === OWN_KIND)
    const lines = Array.isArray(found?.lines) ? found.lines.filter((line: unknown) => typeof line === 'string' && line !== '') : []
    return lines.length > 0 && typeof found.at === 'number' ? { at: found.at, lines } : undefined
  } catch {
    return undefined
  }
}

// The text of the file: the settings as settingsText writes them, and the own card after them when there is one.
export function fileText(settings: Settings, card: OwnCard | undefined): string {
  const text = settingsText(settings)
  if (card === undefined) return text
  return `${JSON.stringify({ ...JSON.parse(text), cards: [{ kind: OWN_KIND, at: card.at, lines: card.lines }] }, null, 2)}\n`
}

export async function listNames(io: Io, host: Host, path: string): Promise<string[]> {
  try {
    return (await io.list(relativeTo(host.session, path))).map(entry => entry.name)
  } catch {
    return []
  }
}

export async function listEntries(io: Io, host: Host, path: string): Promise<FileEntry[]> {
  try {
    return (await io.list(relativeTo(host.session, path))).map(entry => ({
      name: entry.name,
      size: entry.size,
      mtimeMs: entry.mtimeMs,
    }))
  } catch {
    return []
  }
}

// A cache of the texts of one folder's files. A file is read again only when it is new or its size or
// time changed; a listing that gives neither always reads the files named in `live`.
export type FileCache = Map<string, { size?: number; mtimeMs?: number; text: string }>

export async function readCached(
  io: Io,
  host: Host,
  dir: string,
  entries: FileEntry[],
  cache: FileCache,
  live: Set<string> = new Set(),
): Promise<void> {
  const names = new Set(entries.map(entry => entry.name))
  for (const name of [...cache.keys()]) if (!names.has(name)) cache.delete(name)
  for (const entry of entries) {
    const kept = cache.get(entry.name)
    const isKnown = entry.size !== undefined || entry.mtimeMs !== undefined
    const isSame = kept !== undefined && kept.size === entry.size && kept.mtimeMs === entry.mtimeMs
    if (isSame && (isKnown || !live.has(entry.name))) continue
    const text = await readText(io, host, `${dir}/${entry.name}`)
    // A read that failed (no text for a file that has a size) is not kept: the next poll reads it again.
    if (text === '' && (entry.size ?? 1) > 0) cache.delete(entry.name)
    else cache.set(entry.name, { size: entry.size, mtimeMs: entry.mtimeMs, text })
  }
}

// The taps that wait in taps/GATE: a file `ULID.md` is the taps of that card the door has not taken. The
// door takes a file by a rename to `ULID.md.ULID`, so a taken file does not end in `.md` and is not read.
const TAP_FILE = /^[0-9A-Za-z]{20,}\.md$/
export async function readTapFiles(io: Io, host: Host): Promise<{ cardId: string; text: string }[]> {
  const dir = `${host.root}/taps/${host.gate}`
  const files: { cardId: string; text: string }[] = []
  for (const name of await listNames(io, host, dir)) {
    if (!TAP_FILE.test(name)) continue
    files.push({ cardId: name.replace(/\.md$/, ''), text: await readText(io, host, `${dir}/${name}`) })
  }
  return files
}

export async function has(io: Io, host: Host, path: string): Promise<boolean> {
  try {
    return Boolean(await io.exists(relativeTo(host.session, path)))
  } catch {
    return false
  }
}

// The plugin's gate setting, when the host hands it to the pane as it does to a hook.
export const gateSetting = (): string => {
  const env = (globalThis as any).process?.env ?? {}
  return String(env.CLAUDE_PLUGIN_OPTION_GATE ?? env.ROOM_GATE ?? '').trim()
}

// What the finder could not do for a cause that is no missing file: the session's folder not given. It still gives the plain answer it
// gave (no folder); the error is kept here for the read of the room to say, and taken once. The find of sandoq that could not run is
// kept and said by sandoqFault below, in one plain line with no word of the machine, so it is noted here no more. A missing file is the normal answer of the reads below and is no fault. The last five stand.
export type Fault = { part: string; error: unknown }
let faults: Fault[] = []
const noteFault = (part: string, error: unknown): void => {
  faults = [...faults, { part, error }].slice(-5)
}
export const takeFaults = (): Fault[] => {
  const kept = faults
  faults = []
  return kept
}

export async function sessionFolder(io: Io): Promise<string> {
  try {
    const cwd = await io.cwd()
    return typeof cwd === 'string' ? cwd : ''
  } catch (error) {
    noteFault("the session's folder", error)
    return ''
  }
}

// The room of a session's folder by the hooks' own finder, findRoomFrom, which reads and asks synchronously: each folder
// from the session's up to the root is read here first, nearest first (what stands there, and the text of it), then the
// finder is run over what was read, and asked again after each run folder it names has been looked for. The first folder
// that gives a room ends it, so the folders above a room are never read. The run folder of a MARK must stand, as the hooks
// have it. A room.sh is a room with no run folder yet too, as it was before the mark: its start makes the folder.
export async function findRoom(io: Io, cwd: string, gate: string): Promise<Room | undefined> {
  const at: Host = { ...noHost(), session: cwd }
  const texts = new Map<string, string>()
  const stands = new Map<string, boolean>()
  const markRuns = new Set(
    roomCandidates(cwd)
      .filter(one => one.kind === 'mark')
      .map(one => one.path.slice(0, -(MARK_FILE.length + 1))),
  )
  for (const folder of foldersUp(cwd)) {
    for (const candidate of roomCandidates(cwd).filter(one => one.folder === folder)) {
      if (await has(io, at, candidate.path)) texts.set(candidate.path, await readText(io, at, candidate.path))
    }
    for (;;) {
      const unknown: string[] = []
      const room = findRoomFrom(
        cwd,
        {
          read: path => texts.get(path),
          exists: path => {
            if (!markRuns.has(path)) return true
            const known = stands.get(path)
            if (known === undefined) unknown.push(path)
            return known ?? false
          },
        },
        gate,
      )
      if (unknown.length === 0) {
        if (room !== undefined) return room
        break
      }
      for (const path of unknown) stands.set(path, await has(io, at, path))
    }
  }
  return undefined
}

// The sandoq program that runs the words of a marked room, found by ONE process run, as the knock is one: the host's file
// reads may refuse a path outside the session's tree and its environment may be out of the pane's reach, but a shell reads its
// own PATH, SANDOQ_HOME and HOME. The script tries the four places of sandoqCandidates (bridge.ts) in their order, each by
// `test -f`: the plugin option, passed as the one word the script gets; each folder of the PATH; `current/sandoq` under
// SANDOQ_HOME when it is set; `current/sandoq` under the folder `sandoq` of HOME. It prints the first and exits 0, and exits 1
// with none. A test holds this order against sandoqCandidates, so the two never part.
export const SANDOQ_FIND = [
  'if [ -n "$1" ] && [ -f "$1" ]; then printf "%s\\n" "$1"; exit 0; fi',
  'set -f',
  'IFS=:',
  'for dir in $PATH; do',
  `  if [ -n "$dir" ] && [ -f "\${dir%/}/${SANDOQ_NAME}" ]; then printf "%s\\n" "\${dir%/}/${SANDOQ_NAME}"; exit 0; fi`,
  'done',
  `if [ -n "$SANDOQ_HOME" ] && [ -f "\${SANDOQ_HOME%/}/${SANDOQ_CURRENT}" ]; then printf "%s\\n" "\${SANDOQ_HOME%/}/${SANDOQ_CURRENT}"; exit 0; fi`,
  `if [ -n "$HOME" ] && [ -f "\${HOME%/}/${SANDOQ_NAME}/${SANDOQ_CURRENT}" ]; then printf "%s\\n" "\${HOME%/}/${SANDOQ_NAME}/${SANDOQ_CURRENT}"; exit 0; fi`,
  'exit 1',
].join('\n')
export const sandoqFindArgv = (option: string): string[] => ['sh', '-c', SANDOQ_FIND, 'sh', option]

// The result is kept until the room found changes (its folder, or the option's value): a poll of two seconds asks no process.
// A find that did not answer in its time says nothing here and is asked again at a later poll (the pane holds it for a while). A find
// that ERRORED (an exit that is neither 0 nor 1, or a process that could not run) is kept as the others are, with no path, and SAYS it:
// `sandoqFault` is its plain line, and it is not asked again until the folder or the option changes or the pane forgets it at an opening.
let sandoqKept: { key: string; path: string; fault: string } | undefined
export const forgetSandoq = (): void => {
  sandoqKept = undefined
}
export const sandoqFault = (): string => sandoqKept?.fault ?? ''

export const sandoqOf = (io: Io, room: Room): Promise<string> => sandoqIn(io, room.dir)

// The same find for a folder that holds no room: the result is kept by the folder, as it is by a room's.
export async function sandoqIn(io: Io, dir: string): Promise<string> {
  const env = io.env?.() ?? (globalThis as any).process?.env ?? {}
  const option = String(env[SANDOQ_OPTION] ?? '').trim()
  const key = `${dir}\n${option}`
  if (sandoqKept?.key === key) return sandoqKept.path
  if (io.run === undefined) return ''
  try {
    const run = await io.run(sandoqFindArgv(option))
    if (run.exitCode !== 0 && run.exitCode !== 1) {
      sandoqKept = { key, path: '', fault: `the find of sandoq failed${typeof run.exitCode === 'number' ? ` with exit ${run.exitCode}` : ''}` }
      return ''
    }
    const path = run.exitCode === 0 ? String(run.stdout ?? '').trim().split('\n')[0] : ''
    sandoqKept = { key, path, fault: '' }
    return path
  } catch (error) {
    if ((error as { unanswered?: boolean } | undefined)?.unanswered !== true) sandoqKept = { key, path: '', fault: 'the find of sandoq did not run' }
    return ''
  }
}

// The same finder as the hooks': the nearest folder up to the root that holds a mark (a marked room, read from its run
// folder under .sandoq), else room.sh, else the live room.sh is the room; else the world's run folder in the session's
// folder or an ancestor up to six, with its cli.py from that same folder.
export async function detectMode(io: Io): Promise<Host> {
  const host = noHost()
  host.mode = 'none'
  const cwd = await sessionFolder(io)
  host.session = cwd
  if (cwd === '') return host
  const found = await findRoom(io, cwd, gateSetting())
  if (found !== undefined) {
    host.mode = 'room'
    host.root = found.run
    host.gate = found.gate
    host.programs = found.programs
    host.path = found.path
    const above = foldersUp(cwd).indexOf(roomFolderOf(found))
    if (above >= 0) host.depth = above
    if (isMarked(found)) {
      host.marked = true
      host.name = found.name
      host.work = workFolderOf(found)
      host.sandoq = await sandoqOf(io, found)
    } else {
      host.roomSh = `${found.dir.replace(/\/+$/, '')}/${ROOM_SH}`
    }
    return host
  }
  for (const folder of foldersFrom(cwd)) {
    const base = folder === '/' ? '' : folder
    if (!(await has(io, host, `${base}/${WORLD_ROOT}`))) continue
    host.mode = 'world'
    host.cliPy = `${base}/${WORLD_CLI}`
    host.root = `${base}/${WORLD_ROOT}`
    host.gate = GATE_NAME.test(gateSetting()) ? gateSetting() : DEFAULT_GATE
    return host
  }
  // No mark, no room.sh and no world above: where a room may be made from the pane, the sandoq that makes it is looked for.
  if (mayMakeRoomIn(cwd, io.env?.() ?? (globalThis as any).process?.env ?? {})) {
    const maker = await sandoqIn(io, cwd)
    if (maker !== '') host.maker = maker
  }
  return host
}

// Each disc unpacked in the run folder, by its record.
export async function readDiscs(io: Io, host: Host): Promise<Disc[]> {
  const discs: Disc[] = []
  for (const name of await listNames(io, host, `${host.root}/unpacked`)) {
    if (name.endsWith('.record')) discs.push(parseRecord(name, await readText(io, host, `${host.root}/unpacked/${name}`)))
  }
  return discs
}
