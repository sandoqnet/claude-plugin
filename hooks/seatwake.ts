// The seat with no pane host (a local or cloud session with the plugin and no pane). With no pane host the kit module does not load, but a command hook and a
// markdown command do. From sandoq 0.4.28 the program keeps the seat of a folder and does the wake; this file keeps nothing of its own. Two roads, one file:
//   `node seatwake.ts do WORDS`   the inline line of the commands seat-open.md and seat-shut.md: `open ROOM [SEAT]` runs `sandoq room seat ROOM [SEAT]`, `shut` runs
//                                 `sandoq room seat off`. It prints ONE line (sandoq's own, or the one that says why nothing ran) and exits 0. WORDS is `-` when the
//                                 words of the user are on the input (a quoted heredoc, so no shell reads them); they reach the program as argv words only.
//   `node seatwake.ts wake`       an asyncRewake command hook on Stop and SessionStart: a pass-through to `sandoq room wake --hook`. The hook's JSON on its input
//                                 goes to sandoq as it came; a real wake (exit 2, the rows on the err) comes back whole and wakes the idle session. A usage error or any
//                                 exit that is not a wake is silent, exit 0. No sandoq, or one under WAKE_HOOK_FROM: exit 0 at once, in silence. No state, no lock, no turn text.
// A folder with no entry in sandoq is silence, so in the desktop app, where the pane's own seat writes no entry, the hook never wakes twice.
import { spawn, spawnSync } from 'node:child_process'
import type { SpawnSyncReturns } from 'node:child_process'
import { statSync } from 'node:fs'

import { findSandoq } from './bridge.ts'
import { SEAT_FOLDER_FROM, folderSeatArgv, folderSeatOffArgv, folderWakeHookArgv, roomAppHas, sandoqVersionArgv, wakeExitOf, WAKE_HOOK_FROM } from './host.ts'
import { SEAT_COMMAND_USAGE, SEAT_NO_SANDOQ, commandWordsOf, seatNeedsLine } from './model/sessionseat.ts'

const VERSION_MS = 5000
const SEAT_MS = 15000
const LINE_LIMIT = 200
const WORDS_LIMIT = 200

const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

// Whether the program says a version from FROM on.
function hasVersion(sandoq: string, from: string): boolean {
  const [program, ...args] = sandoqVersionArgv(sandoq)
  const said = spawnSync(program, args, { encoding: 'utf8', timeout: VERSION_MS })
  return said.status === 0 && roomAppHas(`${said.stdout ?? ''}`, from)
}

// ---- the inline line of the commands: `open ROOM [SEAT]` and `shut`
const lines = (text: string | null | undefined): string[] => `${text ?? ''}`.split('\n').map(line => line.trim()).filter(line => line !== '')

// The one line of a run of the seat verb: its out on exit 0, else the last line of its err; never more than one line.
function sandoqLine(ran: SpawnSyncReturns<string>): string {
  const out = lines(ran.stdout)[0]
  const err = lines(ran.stderr).at(-1)
  const said = ran.status === 0 ? (out ?? err) : (err ?? out)
  return (said ?? (ran.status === 0 ? 'sandoq said nothing.' : `sandoq exited ${ran.status ?? 'with no code'}.`)).slice(0, LINE_LIMIT)
}

function seatLine(words: string): string {
  const parsed = commandWordsOf(words)
  if (parsed.word === 'usage') return SEAT_COMMAND_USAGE
  const sandoq = findSandoq(process.env, isFile)
  if (sandoq === undefined) return SEAT_NO_SANDOQ
  if (!hasVersion(sandoq, SEAT_FOLDER_FROM)) return seatNeedsLine(SEAT_FOLDER_FROM)
  const [program, ...args] = parsed.word === 'shut' ? folderSeatOffArgv(sandoq) : folderSeatArgv(sandoq, parsed.room, parsed.seat)
  return sandoqLine(spawnSync(program, args, { encoding: 'utf8', timeout: SEAT_MS }))
}

// ---- the hook: a pass-through. The input is the hook's own, handed to sandoq; the err is gathered and goes back whole only for a real wake; its out is left out, since a hook's out is read as json.
function wake(): Promise<number> {
  const sandoq = findSandoq(process.env, isFile)
  if (sandoq === undefined || !hasVersion(sandoq, WAKE_HOOK_FROM)) return Promise.resolve(0)
  return new Promise(resolve => {
    const [program, ...args] = folderWakeHookArgv(sandoq)
    const child = spawn(program, args, { stdio: ['inherit', 'ignore', 'pipe'] })
    let err = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', chunk => (err += chunk))
    child.on('error', () => resolve(0))
    child.on('close', code => {
      const exit = wakeExitOf(code, err)
      if (exit === 2) process.stderr.write(err)
      resolve(exit)
    })
    // A signal to this hook ends the wake, and the hook ends quiet.
    for (const signal of ['SIGTERM', 'SIGHUP', 'SIGINT'] as const) process.on(signal, () => child.kill('SIGTERM'))
  })
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

async function main(): Promise<number> {
  if (process.argv[2] === 'do') {
    const words = process.argv[3] === '-' ? firstLine(await stdinText()) : (process.argv[3] ?? '')
    process.stdout.write(`${seatLine(words)}\n`)
    return 0
  }
  return process.argv[2] === 'wake' ? wake() : 0
}

main().then(
  code => process.exit(code),
  () => process.exit(0),
)
