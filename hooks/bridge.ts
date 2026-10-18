// The bridge's pure parts: where the room is, the words the session is given, the hooks' input.
// Run by `node` (types are stripped), so: no enums, `import type` for types, `.ts` in imports.
import { blockWords, parseBlocks } from './model/blocks.ts'
import type { Block } from './model/blocks.ts'
import { scrub } from './model/draws.ts'
import { seatList, seatName } from './model/seat.ts'
import { choicesText, harnessTag, openAsks } from './model/walk.ts'

// ---- the plugin's settings. The host hands each option to a hook as CLAUDE_PLUGIN_OPTION_<KEY>.
export const OFF_WORDS = ['off', 'no', 'false', '0']
export const DEFAULT_GATE = 'builder'
export const WAIT_MS = 10_000
export const WAIT_STEP_MS = 200
// A session's id: letters, digits, dashes and underscores, and never a dash first (sandoq would read it as a flag after `--session`). ONE
// shape for the hook that writes the ids, the pane that reads them and the pane's say.
const SESSION_ID = /^[A-Za-z0-9_][A-Za-z0-9_-]*$/
const GATE_NAME = /^[A-Za-z0-9_-]+$/

export type Env = Record<string, string | undefined>

// The bridge is on unless its word says off.
export const isBridgeOff = (env: Env): boolean =>
  OFF_WORDS.includes((env.CLAUDE_PLUGIN_OPTION_BRIDGE ?? env.ROOM_BRIDGE ?? '').trim().toLowerCase())

export const isSessionId = (id: string): boolean => SESSION_ID.test(id)

// ---- where the room is, one finder for the pane and the hooks. The session's folder and each
// ancestor up to six (seven folders at most, stopping at /) are looked in, nearest first: in each,
// room.sh (a local room, its run folder `run` beside it), then .kairos/runtime/room/room.sh (the live
// room of a checkout). Either way room.sh's own lines say the programs, the run folder, the gate and the PATH
// the door runs under, so the hook runs the programs as the room does.
export const ROOM_SH = 'room.sh'
export const LIVE_ROOM_SH = '.kairos/runtime/room/room.sh'
export const ANCESTORS = 6

// A room found by its mark also has its `name` and its `play`; `sandoq` is the program that runs its words (set by
// the hook once it has found one). `dir` is the room's own folder for a mark, where room.sh stands for the old road.
export type Room = { dir: string; programs: string; run: string; gate: string; path: string; name?: string; play?: string; sandoq?: string }

// A room found by a mark, not by room.sh.
export const isMarked = (room: Room): boolean => room.name !== undefined

const parentDir = (dir: string): string => dir.replace(/\/[^/]*$/, '') || '/'
const inDir = (dir: string, name: string): string => (dir === '/' ? `/${name}` : `${dir}/${name}`)

// The session's folder and each ancestor up to six, nearest first.
export function foldersFrom(cwd: string): string[] {
  const out: string[] = []
  let at = cwd.replace(/\/+$/, '') || '/'
  for (let i = 0; i <= ANCESTORS; i++) {
    out.push(at)
    if (at === '/') break
    at = parentDir(at)
  }
  return out
}

const segmentsOf = (path: string): string[] => path.split('/').filter(part => part !== '')

// A full path as the session's folder names it: `../` for each level up, then the rest down. The
// pane's own file reads take this form (the form that worked in 0.1.10), never a full path:
// room.sh, ../../../room.sh, `..` for an ancestor, `.` for the folder itself. The argv of a post keep
// the full path.
export function relativeTo(cwd: string, full: string): string {
  const from = segmentsOf(cwd)
  const to = segmentsOf(full)
  let shared = 0
  while (shared < from.length && shared < to.length && from[shared] === to[shared]) shared++
  const parts = [...from.slice(shared).map(() => '..'), ...to.slice(shared)]
  return parts.length === 0 ? '.' : parts.join('/')
}

// The places to look for room.sh, nearest first.
export const roomShCandidates = (cwd: string): string[] => [
  ...new Set(foldersFrom(cwd).flatMap(folder => [inDir(folder, ROOM_SH), inDir(folder, LIVE_ROOM_SH)])),
]

const unquote = (word: string): string => word.replace(/^["']|["']$/g, '')

// room.sh as sandoq writes it: `PATH="…:$PATH"` and `exec python3 ".../room.py" "RUN" GATE say.sh`.
export function parseRoomSh(text: string, shPath: string, gateSetting = ''): Room {
  const dir = parentDir(shPath)
  // The tar's room.sh puts its own folder first as `PATH="$here:$PATH"`: a value that still holds a
  // shell variable is read as that folder, never as literal text.
  const said = text.match(/^PATH="([^"\n]*)"/m)?.[1].replace(/:?\$PATH$/, '') ?? ''
  const path = said.includes('$') ? dir : said
  const exec = text.match(/^exec\s+\S+\s+("[^"\n]*room\.py"|\S*room\.py)\s+("[^"\n]*"|\S+)(?:\s+(\S+))?/m)
  const roomPy = exec ? unquote(exec[1]) : ''
  const run = exec ? unquote(exec[2]) : `${dir}/run`
  // The tar's programs are the disc's, unpacked in its run folder.
  const programs = roomPy !== '' ? parentDir(roomPy) : `${run}/unpacked/room-seat`
  const gateSeen = exec?.[3] ?? ''
  const gate = GATE_NAME.test(gateSetting) ? gateSetting : GATE_NAME.test(gateSeen) ? gateSeen : DEFAULT_GATE
  return { dir, programs, run, gate, path }
}

// ---- a room found by its mark. The mark is a folder `.sandoq` in the room's folder: `room.md` (one flat block at
// (34,3), its words the room's name, its taxonomy sandoq::room::mark, its fence `play` and `gate`); the run folder is `.sandoq` itself (order CF2).
// The finder goes up to the root, nearest folder first; in each folder the mark, then room.sh, then the live room.sh. A
// `.sandoq` with no room.md, or a room.md that is no mark block, is no room (the `.sandoq` of a worktree is a shelf).
export const MARK_DIR = '.sandoq'
export const MARK_FILE = 'room.md'
const MARK_LEAD = 34
const MARK_CLOSE = 3

// The session's folder and each folder above it up to the root, nearest first.
export function foldersUp(cwd: string): string[] {
  const out: string[] = []
  let at = cwd.replace(/\/+$/, '') || '/'
  for (;;) {
    out.push(at)
    const up = parentDir(at)
    if (at === '/' || up === at) return out
    at = up
  }
}

export type Candidate = { kind: 'mark' | 'room.sh'; path: string; folder: string }

// The files that can name the room, nearest folder first, the mark before room.sh before the live room.sh.
export const roomCandidates = (cwd: string): Candidate[] =>
  foldersUp(cwd).flatMap((folder): Candidate[] => [
    { kind: 'mark', path: inDir(inDir(folder, MARK_DIR), MARK_FILE), folder },
    { kind: 'room.sh', path: inDir(folder, ROOM_SH), folder },
    { kind: 'room.sh', path: inDir(folder, LIVE_ROOM_SH), folder },
  ])

// The room a room.md names, or nothing when it reads as no mark. The gate setting of the plugin wins over the mark's gate.
export function parseMark(text: string, folder: string, gateSetting = ''): Room | undefined {
  const mark = parseBlocks(text).find(
    block => block.chi === 'sandoq' && block.che === 'room' && block.cho === 'mark' && block.lead === MARK_LEAD && block.close === MARK_CLOSE,
  )
  if (!mark) return undefined
  const name = mark.words.trim()
  const { play, gate } = mark.fence
  if (name === '' || typeof play !== 'string' || play === '' || typeof gate !== 'string' || !GATE_NAME.test(gate)) return undefined
  const picked = GATE_NAME.test(gateSetting) ? gateSetting : gate
  return { dir: folder, programs: '', run: inDir(folder, MARK_DIR), gate: picked, path: '', name, play }
}

// What the finder reads: a file's text (nothing when it is not there) and whether a folder stands.
export type RoomIo = { read: (path: string) => string | undefined; exists: (path: string) => boolean }

// The room of a session's folder: the first candidate that reads as a room and whose run folder stands.
export function findRoomFrom(cwd: string, io: RoomIo, gateSetting = ''): Room | undefined {
  for (const candidate of roomCandidates(cwd)) {
    const text = io.read(candidate.path)
    if (text === undefined) continue
    const room = candidate.kind === 'mark' ? parseMark(text, candidate.folder, gateSetting) : parseRoomSh(text, candidate.path, gateSetting)
    if (room && io.exists(room.run)) return room
  }
  return undefined
}

// ---- the sandoq program, which runs the words of a marked room (`sandoq room run PROGRAM WORDS...`). Where it is, in
// these four places, the first that is a file, nothing else: the plugin option when it is set; `sandoq` on the PATH;
// `current/sandoq` under SANDOQ_HOME when that variable is set; `current/sandoq` under the folder `sandoq` of the person's
// home folder. No version folder is walked and no home is worked out beyond these: once the hook holds a sandoq it asks
// that program by the room words. The pane's host uses this same list.
export const SANDOQ_OPTION = 'CLAUDE_PLUGIN_OPTION_SANDOQ'
export const SANDOQ_NAME = 'sandoq'
export const SANDOQ_CURRENT = 'current/sandoq'

const trimmed = (dir: string): string => dir.replace(/\/+$/, '') || '/'

export function sandoqCandidates(env: Env): string[] {
  const option = env[SANDOQ_OPTION] ?? ''
  const sandoqHome = env.SANDOQ_HOME ?? ''
  const home = env.HOME ?? ''
  return [
    ...(option === '' ? [] : [option]),
    ...(env.PATH ?? '')
      .split(':')
      .filter(dir => dir !== '')
      .map(dir => inDir(trimmed(dir), SANDOQ_NAME)),
    ...(sandoqHome === '' ? [] : [inDir(trimmed(sandoqHome), SANDOQ_CURRENT)]),
    ...(home === '' ? [] : [inDir(inDir(trimmed(home), SANDOQ_NAME), SANDOQ_CURRENT)]),
  ]
}

// The first place of the four that is a file, as `isFile` says; nothing when none is.
export const findSandoq = (env: Env, isFile: (path: string) => boolean): string | undefined => sandoqCandidates(env).find(isFile)

// ---- the seat a hook speaks for: the session's folder named as the pane names it, through seats.md of the room shelf.
export const SEATS_PATH = 'shelves/room/seats.md'
export const seatsPathOf = (room: Room): string => `${room.run.replace(/\/+$/, '')}/${SEATS_PATH}`

// The room's own folder: where room.sh stands, or, for the live room's room.sh, the folder that holds `.kairos`.
export const roomFolderOf = (room: Room): string => room.dir.replace(/\/+$/, '').replace(/\/\.kairos\/runtime\/room$/, '') || '/'

// Whether a line of seats.md names this folder: the line's folder, relative to the room, is the folder or its end.
// seatName of model/seat.ts picks the line; this only tells that one is there, over the same seatList reading.
// It repeats the folder match of seatName: the two change together.
const folderHasLine = (folder: string, seatsText: string): boolean =>
  seatList(seatsText).some(seat => {
    const rel = seat.folder.replace(/^(\.\/)+/, '').replace(/^\/+|\/+$/g, '')
    return rel !== '' && rel !== '.' && (folder === rel || folder.endsWith(`/${rel}`))
  })

// This seat's name for card.py --seat: the name of the line of seats.md that names the session's folder, and nothing
// else (order B-C1): '' at the room's own folder (the room's seat), and '' for a folder with no line, so its card is
// the person's. A folder under the room is read relative to it, a folder outside it as it is. The pane's own naming of
// what it draws (seatName, which falls back to the folder's last name) is not this rule.
export function seatOfFolder(room: Room, cwd: string, seatsText: string): string {
  const folder = cwd.replace(/\/+$/, '') || '/'
  const base = roomFolderOf(room)
  if (folder === base) return ''
  const inside = base === '/' ? folder.slice(1) : folder.startsWith(`${base}/`) ? folder.slice(base.length + 1) : ''
  const path = inside === '' ? folder : inside
  return folderHasLine(path, seatsText) ? seatName(path, seatsText) : ''
}

// ---- the argv the hooks run. A room found by room.sh runs its programs in the run folder, as it always did. A marked
// room runs each as `sandoq room run PROGRAM WORDS...` with the room's folder as the working folder: sandoq takes the
// room from the nearest mark, runs the program in the run folder under the room's PATH, and passes the input through.
// The words are the same as today's. The hook knows no layout under the mark for a run. The program word is the bare
// name: sandoq refuses a dot in it and takes the file of that name, else with sh, else with py.
export const MARK_PROGRAMS = { card: 'card', feed: 'feed', answer: 'answer' }
const viaSandoq = (room: Room, program: string, words: string[]): string[] => [room.sandoq ?? SANDOQ_NAME, 'room', 'run', program, ...words]

// The folder a hook runs a program in: the room's own folder for a mark, the run folder for room.sh.
export const workFolderOf = (room: Room): string => (isMarked(room) ? room.dir : room.run)

// The card of a prompt. A marked room has one verb for his words: `sandoq room card`, then the flag --session and the id when the
// session has one, the text the whole input. It takes the seat from the folder it runs in, so the hook names none: the seat word
// is not read for a marked room. card.py of a room found by room.sh takes --seat only when this seat has a name.
export const cardArgv = (room: Room, session: string, seat = ''): string[] =>
  isMarked(room)
    ? [room.sandoq ?? SANDOQ_NAME, 'room', 'card', ...(session === '' ? [] : ['--session', session])]
    : ['python3', `${room.programs}/card.py`, room.gate, '--session', session, ...(seat === '' ? [] : ['--seat', seat])]
// A program of the room as the hook runs it: its argv and its stdin, whether it exited 0, what it printed on its out and its err,
// and its exit code (the err and the code are for the verb of a marked room).
export type Ran = { ok: boolean; out: string; err?: string; status?: number | null }
export type Runner = (argv: string[], input: string) => Ran

// The card of a prompt. An older room's card.py has no --seat and refuses the flag, and a refused run makes no card,
// so a run with a seat that is not ok is run once more without it. A marked room's verb is run once, never twice.
export function makeCard(room: Room, session: string, seat: string, prompt: string, runner: Runner): Ran {
  const made = runner(cardArgv(room, session, seat), prompt)
  return made.ok || seat === '' || isMarked(room) ? made : runner(cardArgv(room, session), prompt)
}

// What `sandoq room card` prints on its out: the card's id, bare, no dot, on one line. A line of another shape is no id.
export function bareIdFrom(output: string): string {
  const word = output.trim().split('\n').at(-1)?.trim() ?? ''
  return /^[0-9A-Za-z]{20,}$/.test(word) ? word : ''
}

// What it says on its err when no door answers: nothing is sent and no card is made (exit 1, no id).
export const NO_DOOR_LINE = 'no door answers'
export const DOOR_DOWN_CONTEXT = "The room's door is down, this message made no card."
// The one line of context the hook gives the session when the verb made no card because the door is down, else ''.
export function doorDownContext(made: Ran): string {
  if (made.status !== 1 || bareIdFrom(made.out) !== '') return ''
  const line = (made.err ?? '').trim().split('\n').at(-1) ?? ''
  return line.includes(NO_DOOR_LINE) ? DOOR_DOWN_CONTEXT : ''
}

// Any other refusal that made no card (an older sandoq with no such verb, a usage error, a run that did not start): the session
// gets ONE line, these words and the last line of the err with no path of this machine in it. With no err the words stand alone.
export const REFUSED_CONTEXT = 'The room did not take this message.'
export function refusedContext(made: Ran): string {
  const line = scrub((made.err ?? '').trim().split('\n').at(-1)?.trim() ?? '').slice(0, 200)
  return line === '' ? REFUSED_CONTEXT : `${REFUSED_CONTEXT} ${line}`
}

export const feedArgv = (room: Room, word: string): string[] =>
  isMarked(room) ? viaSandoq(room, MARK_PROGRAMS.feed, ['-r', room.gate, word]) : ['sh', `${room.programs}/feed.sh`, '-r', room.gate, word]
export const answerArgv = (room: Room, session: string): string[] =>
  isMarked(room) ? viaSandoq(room, MARK_PROGRAMS.answer, [room.gate, session]) : ['python3', `${room.programs}/answer.py`, room.gate, session]
export const walkPath = (room: Room, id: string): string => `${room.run}/walks/${room.gate}/${id}.md`

// card.py prints the card's word, a dot and its ULID, on one line.
export function cardIdFrom(output: string): string {
  const word = output.trim().split('\n').at(-1)?.trim() ?? ''
  return /^\.[0-9A-Za-z]{20,}$/.test(word) ? word.slice(1) : ''
}

export const feedWord = (id: string): string => `.${id}`

// ---- the hooks' input.
export type SubmitInput = { session: string; prompt: string; cwd: string }

// A prompt that is the user's words to the room. A slash command is not, and neither is a message of the harness: a
// prompt whose first thing is an opening tag whose name holds a hyphen (agent-message, system-reminder, bash-input,
// local-command-stdout and the ones not yet seen). They make no card. One exception, kept as it was (order B-M5):
// task-notification still makes its card, the room has no other road for it yet, and the pane draws it From the session.
export const CARD_TAG = 'task-notification'
export function isCardPrompt(prompt: string): boolean {
  const text = prompt.trim()
  const tag = harnessTag(text)
  return text !== '' && !text.startsWith('/') && (tag === '' || tag === CARD_TAG)
}

export function parseSubmit(raw: string): SubmitInput | undefined {
  try {
    const data = JSON.parse(raw)
    const session = String(data.session_id ?? '')
    const prompt = String(data.prompt ?? '')
    if (!isSessionId(session) || !isCardPrompt(prompt)) return undefined
    return { session, prompt, cwd: String(data.cwd ?? '') }
  } catch {
    return undefined
  }
}

export type StopInput = { session: string; answer: string; cwd: string }

// The last answer of the turn, whole; an empty one is no input. The transcript is never read.
export function parseStop(raw: string): StopInput | undefined {
  try {
    const data = JSON.parse(raw)
    const session = String(data.session_id ?? '')
    const answer = typeof data.last_assistant_message === 'string' ? data.last_assistant_message : ''
    if (!isSessionId(session) || answer.trim() === '') return undefined
    return { session, answer, cwd: String(data.cwd ?? '') }
  } catch {
    return undefined
  }
}

// ---- the memory hook (order MH): after a Write, Edit or MultiEdit of a file of Claude's memory folder it makes ONE card, `sandoq room say --session ID
// memory: FILE`, FILE the file's name alone. The rule of the folder is the importer's (`found_in` of the claude disc's import.py): the home's
// `.claude/projects/PROJECT/memory/FILE`, the file directly in it, FILE of letters, digits and . _ - ending in .md, never MEMORY.md, the
// index. The importer FINDS the project (the one with a session of the room's folder); the hook only reads the path's shape, any PROJECT,
// and the gate says one line for a file of a project that is not the room's. The path is text: the file is never opened, stat'ed or read.
export const MEMORY_WORD = 'memory:'
export const MEMORY_INDEX = 'MEMORY.md'
const MEMORY_FILE = /^[A-Za-z0-9_.-]+\.md$/
const MEMORY_TOOLS = ['Write', 'Edit', 'MultiEdit']

// The file's name when the path is a memory file of the home's Claude folder, else ''.
export function memoryFileOf(path: string, home: string): string {
  const top = home.replace(/\/+$/, '')
  if (top === '' || !path.startsWith(`${top}/.claude/projects/`)) return ''
  const parts = path.slice(top.length + '/.claude/projects/'.length).split('/')
  const [project, folder, file] = parts
  if (parts.length !== 3 || project === '' || project === '.' || project === '..' || folder !== 'memory') return ''
  // a name that opens with a dash would reach sandoq as a flag word: the gate's regex allows it, the hook does not send it
  return MEMORY_FILE.test(file) && !file.startsWith('-') && file !== MEMORY_INDEX ? file : ''
}

export type MemoryInput = { session: string; file: string; cwd: string }

// The hook's input after a tool: the session and the file's name; no session of the shape, another tool or a file that is no memory file is no input.
export function parseMemory(raw: string, home: string): MemoryInput | undefined {
  try {
    const data = JSON.parse(raw)
    const session = String(data.session_id ?? '')
    const path = data.tool_input?.file_path
    if (!isSessionId(session) || typeof path !== 'string') return undefined
    if (data.tool_name !== undefined && !MEMORY_TOOLS.includes(data.tool_name)) return undefined
    const file = memoryFileOf(path, home)
    return file === '' ? undefined : { session, file, cwd: String(data.cwd ?? '') }
  } catch {
    return undefined
  }
}

// The call: one argv list, no shell, for a marked room with a sandoq found; [] for any other room or none (the old room.sh has no `room say`).
export const memoryArgv = (room: Room | undefined, session: string, file: string): string[] =>
  room && isMarked(room) && room.sandoq !== undefined ? [room.sandoq, 'room', 'say', '--session', session, MEMORY_WORD, file] : []

// ---- the session ids of a folder (order YS, a contract with the pane's Your cards). The submit hook writes, at each message and
// before the card is made, `room-pane-sessions.json` at the top of the run folder, beside the pane's pane.json: `{"folders": {FOLDER: [ID,
// ...]}}`. FOLDER is folderKey of the session's folder, the ids are newest first, at most SESSION_IDS_MOST a folder, each once,
// each of letters, digits, dash and underscore alone, never a dash first (another shape is not written); at most SESSION_FOLDERS_MOST folders, the
// one written longest ago dropped. The pane reads the file at its poll and takes the ids of its own session folder; a card is HIS
// when its root's session is one of them. A file that is not there or does not read as this begins a new one, never a fault.
// KNOWN: two sessions that write at once may lose an id; two sessions open in one folder are one seat.
export const SESSIONS_FILE = 'room-pane-sessions.json'
export const SESSION_IDS_MOST = 8
export const SESSION_FOLDERS_MOST = 32
export const sessionsPathOf = (room: Room): string => `${room.run.replace(/\/+$/, '')}/${SESSIONS_FILE}`

// The key of a session's folder: the folder as an absolute path with no last slash, no link followed and no case changed ('/' stays).
// ONE function for the hook that writes the file and the pane that reads it, so a last slash or two never makes another folder.
export const folderKey = (folder: string): string => folder.replace(/\/+$/, '') || (folder.startsWith('/') ? '/' : '')

// The ids of a folder as the file holds them: the strings of the right shape, each once, in the order they stand.
const idsOf = (value: unknown): string[] => {
  const ids: string[] = []
  if (Array.isArray(value)) for (const id of value) if (typeof id === 'string' && isSessionId(id) && !ids.includes(id)) ids.push(id)
  return ids
}

// The folders of a file's text, each with its ids, oldest written first; none for a text that is no such file.
const foldersOf = (text: string | undefined): [string, string[]][] => {
  try {
    const folders = JSON.parse(text ?? '')?.folders
    if (folders === null || typeof folders !== 'object' || Array.isArray(folders)) return []
    return Object.entries(folders)
      .map(([key, value]): [string, string[]] => [key, idsOf(value)])
      .filter(([key, ids]) => key !== '' && ids.length > 0)
  } catch {
    return []
  }
}

// The text of the file after a message of `session` said in `folder`: the session first among its folder's ids, the folder last
// among the folders. '' when there is nothing to write: a session id of another shape, or a folder that is no absolute path.
export function sessionsAfter(text: string | undefined, folder: string, session: string): string {
  const key = folderKey(folder)
  if (!isSessionId(session) || !key.startsWith('/')) return ''
  const old = foldersOf(text)
  const ids = [session, ...(old.find(([name]) => name === key)?.[1] ?? []).filter(id => id !== session)].slice(0, SESSION_IDS_MOST)
  const kept = [...old.filter(([name]) => name !== key), [key, ids] as [string, string[]]].slice(-SESSION_FOLDERS_MOST)
  return `${JSON.stringify({ folders: Object.fromEntries(kept) })}\n`
}

// ---- the room's reading, in plain words.
const first = (text: string, limit = 40): string => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > limit ? `${flat.slice(0, limit).trimEnd()} …` : flat
}

const KIND_WORD: Record<string, string> = { person: 'a person', document: 'a document', project: 'a project' }

// The records found, each with its role: the route's own list when it stands, else the mentions.
function foundOf(blocks: Block[]): string[] {
  const route = blocks.find(block => block.cho === 'route')
  const listed = route?.fence.found
  if (Array.isArray(listed)) return listed.map(String)
  return blocks
    .filter(block => block.cho === 'mention' && block.chi !== 'verb')
    .map(block => {
      const name = blockWords(block.words).split('/')[0].trim()
      const role = String(block.fence.role ?? '')
      const kind = KIND_WORD[block.chi] ?? `a ${block.chi}`
      return `${name}, ${kind}${role === '' ? '' : `, ${role} of the message`}`
    })
}

const actOf = (blocks: Block[]): string => {
  const route = blocks.find(block => block.cho === 'route')
  const act = blocks.find(block => block.cho === 'decided' && block.chi === 'intent')
  return String(route?.fence.act ?? '') || String(act?.fence.pick ?? '') || (act && act.che !== 'held' ? act.che : '')
}

export type Ask = { id: string; question: string; choices: string[] }

// The context a UserPromptSubmit hook hands the session. `walkText` is the new card's walk as the
// hook last read it; `asks` every open ask of the session's cards, this one's included.
export function readingContext(prompt: string, walkText: string, asks: Ask[]): string {
  const blocks = parseBlocks(walkText)
  const routed = blocks.some(block => block.cho === 'route')
  const lines: string[] = []
  if (!routed && asks.length === 0 && !blocks.some(block => block.cho === 'decided')) {
    lines.push(`The room has not read this message yet ("${first(prompt)}"). Answer without it.`)
    return lines.join('\n')
  }
  const act = actOf(blocks)
  lines.push(`The room read the user's message ("${first(prompt)}")${act === '' ? '' : ` as: ${act}`}.`)
  const found = foundOf(blocks)
  lines.push(found.length === 0 ? 'Records found: none.' : `Records found: ${found.join('; ')}.`)
  if (asks.length > 0) {
    lines.push('The room has open asks and waits for the user to answer them:')
    for (const ask of asks) lines.push(`- ${ask.question} (ask ${ask.id}; choices: ${choicesText(ask.choices)})`)
    lines.push(
      "These asks are the user's to answer, never yours: do not choose for them. Ask the user each question with its choices, and use the room_tap tool (choice one of its choices, ask its id) only with the choice the user gave in their own words.",
    )
  }
  return lines.join('\n')
}

// Every open ask of a text, as the context names them.
export const asksOf = (walkText: string): Ask[] => openAsks(walkText)

// The hook's reply: the context under hookSpecificOutput, or nothing at all when there is none.
export function submitOutput(context: string): string {
  return context === '' ? '' : JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: context } })
}

// A walk is read when it routed or holds an ask: what the submit hook waits for.
export function isReadWalk(walkText: string): boolean {
  const blocks = parseBlocks(walkText)
  return blocks.some(block => block.cho === 'route' || block.cho === 'ask')
}

// The session a walk's root names, '' for a card of the pane.
export function sessionOf(walkText: string): string {
  const source = parseBlocks(walkText).find(block => block.cho === 'source')
  return source ? String(source.fence.session ?? '') : ''
}
