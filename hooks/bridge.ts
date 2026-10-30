// The bridge's pure parts: where the room is, the words the session is given, the hooks' input.
// Run by `node` (types are stripped), so: no enums, `import type` for types, `.ts` in imports.
import { blockWords, parseBlocks } from './model/blocks.ts'
import type { Block } from './model/blocks.ts'
import { scrub } from './model/draws.ts'
import { choicesText, harnessTag, openAsks } from './model/walk.ts'

// ---- the plugin's settings. The host hands each option to a hook as CLAUDE_PLUGIN_OPTION_<KEY>.
export const OFF_WORDS = ['off', 'no', 'false', '0']
export const DEFAULT_GATE = 'builder'
export const WAIT_MS = 10_000
export const WAIT_STEP_MS = 200
// The bound of one call of feedin that may ask Jev (his words and a row): feedin's own call to Jev is bound at 30 seconds, and a feedin cut before
// it answers loses the answer and the card. The submit hook is given this and the wait for the reading, with room over (hooks.json).
export const FEED_MS = 35_000
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
// the hook once it has found one). `dir` is the room's own folder for a mark, where room.sh stands for the old road. `his` is
// true when the mark's fence holds `his: on` (MARK_HIS).
export type Room = { dir: string; programs: string; run: string; gate: string; path: string; name?: string; play?: string; sandoq?: string; his?: true }

// A room found by a mark, not by room.sh.
export const isMarked = (room: Room): boolean => room.name !== undefined

// His rule: his typed lines are never on the bus unless the room asks for them. A marked room gets his words, kind his, only when
// its mark's fence holds the key `his` with the value `on`; with no key the submit hook feeds none and gives no context line. The
// old road of room.sh feeds as before.
export const MARK_HIS = 'his'
export const MARK_HIS_ON = 'on'
export const feedsHis = (room: Room): boolean => !isMarked(room) || room.his === true

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
// (34,3), its words the room's name, its taxonomy sandoq::room::mark, its fence `play` and `gate`, and `his` when the room takes his
// words); the run folder is `.sandoq` itself (order CF2).
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
  const room: Room = { dir: folder, programs: '', run: inDir(folder, MARK_DIR), gate: picked, path: '', name, play }
  return mark.fence[MARK_HIS] === MARK_HIS_ON ? { ...room, his: true } : room
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

// The room's own folder: where room.sh stands, or, for the live room's room.sh, the folder that holds `.kairos`.
export const roomFolderOf = (room: Room): string => room.dir.replace(/\/+$/, '').replace(/\/\.kairos\/runtime\/room$/, '') || '/'

// ---- the argv the hooks run. A room found by room.sh runs its programs in the run folder, as it always did. A marked
// room runs each as `sandoq room run PROGRAM WORDS...` with the room's folder as the working folder: sandoq takes the
// room from the nearest mark, runs the program in the run folder under the room's PATH, and passes the input through.
// The words are the same as today's. The hook knows no layout under the mark for a run. The program word is the bare
// name: sandoq refuses a dot in it and takes the file of that name, else with sh, else with py. (card and feed are the
// pane's own egress, host.ts; the bridge hooks run feedin and answer.)
export const MARK_PROGRAMS = { card: 'card', feed: 'feed', answer: 'answer', feedin: 'feedin' }
const viaSandoq = (room: Room, program: string, words: string[]): string[] => [room.sandoq ?? SANDOQ_NAME, 'room', 'run', program, ...words]

// The folder a hook runs a program in: the room's own folder for a mark, the run folder for room.sh.
export const workFolderOf = (room: Room): string => (isMarked(room) ? room.dir : room.run)

// A program of the room as the hook runs it: its argv and its stdin, whether it exited 0, what it printed on its out and its err,
// and its exit code.
export type Ran = { ok: boolean; out: string; err?: string; status?: number | null }

// ---- the feed road (order room feed, part B). The room's feedin program takes everything the bridge sees and puts it on the
// room's FEED; the room's door decides whether an entry makes a card. `feedin GATE --kind row|his|answer|memory [--folder DIR]
// [--session ID] [--sayer S --seq N]`, the text on its input. The seat is the seats file's line naming DIR. --sayer and --seq go
// together and only with kind row. Out: the card's word (a dot and the ULID) when the door made a card, else nothing, exit 0 both
// ways. A door fault or no key: no card, the entry waits on the feed, exit 1 and one line on the err. A usage fault: exit 2.
export type FeedKind = 'row' | 'his' | 'answer' | 'memory'
export type FeedRow = { sayer: string; seq: string }

export function feedinArgv(room: Room, kind: FeedKind, folder: string, session: string, row?: FeedRow): string[] {
  const words = ['--kind', kind, ...(folder === '' ? [] : ['--folder', folder]), ...(session === '' ? [] : ['--session', session]), ...(row ? ['--sayer', row.sayer, '--seq', row.seq] : [])]
  return isMarked(room) ? viaSandoq(room, MARK_PROGRAMS.feedin, [room.gate, ...words]) : ['python3', `${room.programs}/feedin.py`, room.gate, ...words]
}

// What `sandoq room card` prints on its out: the card's id, bare, no dot, on one line. A line of another shape is no id.
// (The pane's own say reads it, register.tsx.)
export function bareIdFrom(output: string): string {
  const word = output.trim().split('\n').at(-1)?.trim() ?? ''
  return /^[0-9A-Za-z]{20,}$/.test(word) ? word : ''
}

// The status of a run: its exit code; a run that did not start (a timeout, no such program) has none.
const statusOf = (made: Ran): number | null => (made.status !== undefined ? made.status : made.ok ? 0 : null)

// A his prompt whose entry made no card. Exit 0 and no word: the door took the entry and made none, so no context. Exit 1 with feedin's own
// err line (the last line of the err begins `feedin:`): the entry waits on the feed, ONE line, these words and that line with no path of this
// machine in it. Any other refusal (a usage fault, an exit 1 of a disc with no feedin, a run that did not start): refusedContext.
export const FEED_WAITS = "This message waits on the room's feed:"
export const FEEDIN_ERR = 'feedin:'
export const REFUSED_CONTEXT = 'The room did not take this message.'
export function refusedContext(made: Ran): string {
  const line = scrub((made.err ?? '').trim().split('\n').at(-1)?.trim() ?? '').slice(0, 200)
  return line === '' ? REFUSED_CONTEXT : `${REFUSED_CONTEXT} ${line}`
}
export function noCardContext(made: Ran): string {
  const status = statusOf(made)
  if (status === 0) return ''
  const last = (made.err ?? '').trim().split('\n').at(-1)?.trim() ?? ''
  if (status !== 1 || !last.startsWith(FEEDIN_ERR)) return refusedContext(made)
  return `${FEED_WAITS} ${scrub(last).slice(0, 200)}`
}

export const answerArgv = (room: Room, session: string): string[] =>
  isMarked(room) ? viaSandoq(room, MARK_PROGRAMS.answer, [room.gate, session]) : ['python3', `${room.programs}/answer.py`, room.gate, session]
export const walkPath = (room: Room, id: string): string => `${room.run}/walks/${room.gate}/${id}.md`

// feedin (and card.py) print the card's word, a dot and its ULID, on one line.
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

// ---- a wake's turn (order room feed, B1). The turn of sessionseat.ts turnText opens `Room ROOM, N rows for SEAT.`, then the lines that say how
// to answer, then each row as its number, two spaces and its line. Such a prompt is the room's rows and not his words: each row is fed alone,
// kind row; the head and the answering lines are never fed. A line that is no row and stands after a row goes on that row (a row's line may be
// more than one line). The sayer is the word before the line's first colon when it is letters, digits, dashes and underscores alone (the names
// feedin takes after --sayer, else it exits 2) and no dash first (a flag word after a flag); a line with none has the sayer `none`, and goes
// with its number all the same.
export const NO_SAYER = 'none'
const SAYER_WORD = SESSION_ID
export type TurnRow = { seq: string; line: string; sayer: string }
const TURN_HEAD = /^Room [A-Za-z0-9][A-Za-z0-9_.-]*, \d+ rows? for [A-Za-z0-9][A-Za-z0-9_.-]*\./
const TURN_ROW = /^(\d+) {2}(\S.*)$/

// The rows of a wake's turn, oldest first; undefined for a prompt that is no turn.
export function turnRowsOf(prompt: string): TurnRow[] | undefined {
  const [head = '', ...rest] = prompt.trimStart().split('\n')
  if (!TURN_HEAD.test(head)) return undefined
  const rows: { seq: string; line: string }[] = []
  for (const text of rest) {
    const found = text.match(TURN_ROW)
    if (found) rows.push({ seq: found[1], line: found[2] })
    else if (rows.length > 0) rows[rows.length - 1].line += `\n${text}`
  }
  return rows.map(({ seq, line }) => {
    const whole = line.trimEnd()
    const word = whole.slice(0, Math.max(whole.indexOf(':'), 0))
    return { seq, line: whole, sayer: SAYER_WORD.test(word) ? word : NO_SAYER }
  })
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

// ---- the memory hook (order MH): after a Write, Edit or MultiEdit of a file of Claude's memory folder it feeds ONE entry, kind memory, its text
// `memory: FILE`, FILE the file's name alone. The rule of the folder is the importer's (`found_in` of the claude disc's import.py): the home's
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

// The text of the entry, on the input of feedin (kind memory).
export const memoryText = (file: string): string => `${MEMORY_WORD} ${file}`

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
