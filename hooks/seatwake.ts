// The seat's wake with no pane host (a cloud session). With no pane host the kit module does not load, but a command hook and a markdown command do. Two roads, one file:
//   `node seatwake.ts do WORDS SESSION`    the inline line of the commands seat-open.md and seat-shut.md: `open ROOM SEAT` writes the open state of that session,
//                                          `shut` drops it and ends its wake. It prints ONE line (the pane's open and shut words) and exits 0.
//                                          WORDS is `-` when the words of the user are on the input (seat-open.md: a quoted heredoc, so no shell reads them).
//   `node seatwake.ts wake`                an asyncRewake command hook on Stop and SessionStart, the hook's JSON on its input. No state for the session_id: exit 0
//                                          at once, in silence (every session with the plugin runs it). A wake of this session that lives (a lock its process holds):
//                                          exit 0, in silence. Else it runs `sandoq room wake ROOM --next --seat SEAT --json` itself and, on rows, prints the turn on
//                                          the err and exits 2, which wakes the idle session. A refusal (no sandoq, one under SESSION_OPEN_FROM, a wake that ended
//                                          with no rows) is ONE line on the err and exit 2, said once: the state keeps it as `told` and the state stays.
//                                          With no state, the variable SANDOQ_SEAT (`ROOM SEAT`, a cloud environment's own) opens the seat: no slash command is needed.
//                                          SESSION.env keeps the value read, so it opens once (a shut stays shut) and a bad value is said once, in one line, exit 2.
//   `node seatwake.ts end`               a command hook on SessionEnd, the hook's JSON on its input: it ends the wake of that session_id and drops its state, in silence.
// The state and the lock are files of the plugin's data folder, one pair a session: SESSION.json and SESSION.lock, which holds the pid of the wake. A lock whose
// process is dead (or is no seatwake) is taken over. In the desktop app the pane writes no such state, so the hook finds none and never wakes twice. Whatever goes
// wrong in the hook, the exit is 0 and nothing is printed, and the session is never blocked.
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { findSandoq } from './bridge.ts'
import { SESSION_OPEN_FROM, roomAppHas, sandoqVersionArgv, seatWakeArgv } from './host.ts'
import {
  CLOUD_BAD_ENV,
  CLOUD_NEEDS_SEAT,
  CLOUD_NO_SANDOQ,
  CLOUD_NO_SESSION,
  CLOUD_SEAT_ENV,
  CLOUD_USAGE,
  NONE_OPEN,
  SEAT_WORD,
  cloudOpenLine,
  cloudStateOf,
  cloudStateText,
  cloudTurnText,
  envSeatOf,
  parseRows,
  rowsOfSeat,
  seatWordsOf,
  shutLine,
  underLine,
  wakeEndedLine,
  wakeIsLive,
} from './model/sessionseat.ts'
import type { CloudState } from './model/sessionseat.ts'

const VERSION_MS = 5000
const LINE_LIMIT = 200
const WORDS_LIMIT = 200

type Done = { code: number; err: string }
const quiet: Done = { code: 0, err: '' }

const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

const isDir = (path: string): boolean => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

const read = (path: string): string => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return ''
  }
}

const drop = (path: string): void => {
  try {
    unlinkSync(path)
  } catch {
    // it is not there
  }
}

// The plugin's data folder (CLAUDE_PLUGIN_DATA, which the host gives to a hook), else the folder it names under the person's home; the seats' files are in `seats`.
const seatsFolder = (): string =>
  join(process.env.CLAUDE_PLUGIN_DATA || join(process.env.HOME ?? '', '.claude', 'plugins', 'data', 'sandoq'), 'seats')
const statePath = (session: string): string => join(seatsFolder(), `${session}.json`)
const lockPath = (session: string): string => join(seatsFolder(), `${session}.lock`)
const envPath = (session: string): string => join(seatsFolder(), `${session}.env`)

const stateOf = (session: string): CloudState | undefined => cloudStateOf(read(statePath(session)))
function putState(session: string, state: CloudState): boolean {
  try {
    mkdirSync(seatsFolder(), { recursive: true })
    writeFileSync(statePath(session), cloudStateText(state))
    return true
  } catch {
    return false
  }
}

// The sandoq program that has the seat's verbs, or the one line that says it has not: none found, or a version under SESSION_OPEN_FROM.
function sandoqOrLine(): { sandoq: string } | { line: string } {
  const sandoq = findSandoq(process.env, isFile)
  if (sandoq === undefined) return { line: CLOUD_NO_SANDOQ }
  const [program, ...args] = sandoqVersionArgv(sandoq)
  const said = spawnSync(program, args, { encoding: 'utf8', timeout: VERSION_MS })
  return said.status === 0 && roomAppHas(`${said.stdout ?? ''}`, SESSION_OPEN_FROM) ? { sandoq } : { line: underLine(SESSION_OPEN_FROM) }
}

// Whether a pid is a live wake of this plugin: the process is there, and where there is a /proc, its command names seatwake (wakeIsLive). A pid with no folder
// there is dead, whatever kill 0 said.
function liveWake(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) return false
  try {
    process.kill(pid, 0)
  } catch (fault) {
    if ((fault as NodeJS.ErrnoException).code !== 'EPERM') return false
  }
  return wakeIsLive(isDir('/proc/self'), read(`/proc/${pid}/cmdline`))
}

// The lock of a session: written whole, and only when none is there; one that a dead process left is taken over, once.
function takeLock(session: string): boolean {
  try {
    mkdirSync(seatsFolder(), { recursive: true })
  } catch {
    return false
  }
  for (let tries = 0; tries < 2; tries += 1) {
    try {
      writeFileSync(lockPath(session), String(process.pid), { flag: 'wx' })
      return true
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== 'EEXIST') return false
      if (liveWake(Number(read(lockPath(session))))) return false
      drop(lockPath(session))
    }
  }
  return false
}
const dropOwnLock = (session: string): void => {
  if (Number(read(lockPath(session))) === process.pid) drop(lockPath(session))
}

// Ends the wake that holds the lock of a session, if one lives.
function stopWake(session: string): void {
  const pid = Number(read(lockPath(session)))
  if (!liveWake(pid)) return
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    // it ended on its own
  }
}

// ---- the inline line of the skill: `open ROOM SEAT` and `shut`
const SESSION_FROM_ENV = ['CLAUDE_CODE_SESSION_ID', 'CLAUDE_SESSION_ID']
function sessionFrom(given: string): string {
  if (SEAT_WORD.test(given)) return given
  for (const name of SESSION_FROM_ENV) {
    const held = process.env[name] ?? ''
    if (SEAT_WORD.test(held)) return held
  }
  return ''
}

function seatLine(words: string, given: string): string {
  const session = sessionFrom(given)
  if (session === '') return CLOUD_NO_SESSION
  const parsed = seatWordsOf(words)
  if (parsed === undefined || parsed.word === 'usage') return CLOUD_USAGE
  if (parsed.word === 'needs-seat') return CLOUD_NEEDS_SEAT
  if (parsed.word === 'shut') {
    const state = stateOf(session)
    stopWake(session)
    drop(statePath(session))
    return state === undefined ? NONE_OPEN : shutLine(state.seat)
  }
  const found = sandoqOrLine()
  if ('line' in found) return found.line
  stopWake(session)
  return putState(session, { room: parsed.room, seat: parsed.seat, told: '' }) ? cloudOpenLine(parsed.seat, parsed.room) : CLOUD_NO_SESSION
}

// ---- the hook
function parseHook(raw: string): { session: string; cwd: string } | undefined {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (typeof value !== 'object' || value === null) return undefined
  const { session_id: session, cwd } = value as Record<string, unknown>
  if (typeof session !== 'string' || !SEAT_WORD.test(session)) return undefined
  return { session, cwd: typeof cwd === 'string' && cwd !== '' ? cwd : process.cwd() }
}

// One refusal line, said once: the same line as the state holds is silence.
function refusal(session: string, state: CloudState, line: string): Done {
  if (state.told === line) return quiet
  putState(session, { ...state, told: line })
  return { code: 2, err: `${line}\n` }
}

// Runs the wake. A signal to this hook ends the wake and resolves quiet, as does a wake that cannot start.
function runWake(session: string, state: CloudState, sandoq: string, cwd: string): Promise<Done> {
  return new Promise(resolve => {
    const [program, ...args] = seatWakeArgv(sandoq, state.room, state.seat)
    const child = spawn(program, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    let stopped = false
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => (out += chunk))
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => (err += chunk))
    child.on('error', () => resolve(quiet))
    child.on('close', code => {
      if (stopped || typeof code !== 'number') return resolve(quiet)
      const now = stateOf(session)
      if (now === undefined) return resolve(quiet) // the seat was shut while the wake waited: nobody to tell
      if (code !== 0) {
        const last = err.trim().split('\n').pop() ?? ''
        return resolve(refusal(session, now, wakeEndedLine((last === '' ? `exit ${code}` : last).slice(0, LINE_LIMIT))))
      }
      const rows = rowsOfSeat(parseRows(out).rows, now.seat)
      if (rows.length === 0) return resolve(quiet)
      if (now.told !== '') putState(session, { ...now, told: '' })
      resolve({ code: 2, err: `${cloudTurnText(now.room, now.seat, rows)}\n` })
    })
    for (const signal of ['SIGTERM', 'SIGHUP', 'SIGINT'] as const) {
      process.on(signal, () => {
        stopped = true
        child.kill('SIGTERM')
      })
    }
  })
}

// The seat a cloud environment names (SANDOQ_SEAT, `ROOM SEAT`) for a session that holds no state. The variable is read once per session and value: the file
// SESSION.env keeps the value, so a good one opens the seat once (a shut stays shut), and a bad one is said once. None, or a value read before: undefined.
function seatFromEnv(session: string): { state: CloudState } | { line: string } | undefined {
  const given = firstLine(process.env[CLOUD_SEAT_ENV] ?? '').trim()
  if (given === '') return undefined
  try {
    mkdirSync(seatsFolder(), { recursive: true })
    try {
      writeFileSync(envPath(session), `${given}\n`, { flag: 'wx' })
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== 'EEXIST' || read(envPath(session)) === `${given}\n`) return undefined
      writeFileSync(envPath(session), `${given}\n`)
    }
  } catch {
    return undefined // it cannot be remembered, so it is not read: a seat must not open again at every Stop
  }
  const named = envSeatOf(given)
  if (named === undefined) return { line: CLOUD_BAD_ENV }
  const state: CloudState = { ...named, told: '' }
  return putState(session, state) ? { state } : undefined
}

async function wake(raw: string): Promise<Done> {
  const input = parseHook(raw)
  if (input === undefined) return quiet
  let state = stateOf(input.session)
  if (state === undefined) {
    const named = seatFromEnv(input.session)
    if (named === undefined) return quiet
    if ('line' in named) return { code: 2, err: `${named.line}\n` }
    state = named.state
  }
  if (!takeLock(input.session)) return quiet
  try {
    const found = sandoqOrLine()
    if ('line' in found) return refusal(input.session, state, found.line)
    return await runWake(input.session, state, found.sandoq, input.cwd)
  } finally {
    dropOwnLock(input.session)
  }
}

// A command hook on SessionEnd: the seat of the session ends with it, as /sandoq:seat-shut would end it, with nothing printed. A host that stops hard may skip it.
async function end(raw: string): Promise<Done> {
  const input = parseHook(raw)
  if (input === undefined) return quiet
  stopWake(input.session)
  drop(statePath(input.session))
  drop(envPath(input.session))
  return quiet
}

// The words of a command come on the input, never in the shell line: the first line only, cut at WORDS_LIMIT.
const firstLine = (text: string): string => (text.split('\n')[0] ?? '').slice(0, WORDS_LIMIT)

async function stdinText(): Promise<string> {
  return new Promise<string>(resolve => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(data))
  })
}

async function main(): Promise<Done> {
  if (process.argv[2] === 'do') {
    const words = process.argv[3] === '-' ? firstLine(await stdinText()) : (process.argv[3] ?? '')
    process.stdout.write(`${seatLine(words, process.argv[4] ?? '')}\n`)
    return quiet
  }
  if (process.argv[2] === 'wake') return wake(await stdinText())
  return process.argv[2] === 'end' ? end(await stdinText()) : quiet
}

main().then(
  ({ code, err }) => (err === '' ? process.exit(code) : process.stderr.write(err, () => process.exit(code))),
  () => process.exit(0),
)
