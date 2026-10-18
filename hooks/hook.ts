// The bridge's three hooks, run by `node hook.ts submit` (UserPromptSubmit), `node hook.ts stop`
// (Stop) and `node hook.ts memory` (PostToolUse of Write, Edit and MultiEdit). Whatever goes wrong, the exit is 0 and
// nothing is printed: the room never blocks the user's prompt or his turn's end. Thin by design: the pure
// parts are in bridge.ts, tested there.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'

import {
  WAIT_MS,
  WAIT_STEP_MS,
  answerArgv,
  asksOf,
  bareIdFrom,
  cardIdFrom,
  doorDownContext,
  feedArgv,
  feedWord,
  findRoomFrom,
  findSandoq,
  isBridgeOff,
  isMarked,
  isReadWalk,
  makeCard,
  memoryArgv,
  parseMemory,
  parseStop,
  parseSubmit,
  readingContext,
  refusedContext,
  seatOfFolder,
  seatsPathOf,
  sessionOf,
  sessionsAfter,
  sessionsPathOf,
  submitOutput,
  walkPath,
  workFolderOf,
} from './bridge.ts'
import type { Ask, Ran, Room } from './bridge.ts'
import { newestIds } from './model/shelf.ts'

const PROCESS_MS = 8000

const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile()
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

// The room of the session's folder: its mark, or room.sh as before. A marked room runs its words through sandoq: with no
// sandoq to be found there is no room for the hooks, and they send nothing.
function findRoom(cwd: string): Room | undefined {
  const room = findRoomFrom(
    cwd,
    { read: path => (existsSync(path) ? read(path) : undefined), exists: existsSync },
    process.env.CLAUDE_PLUGIN_OPTION_GATE ?? process.env.ROOM_GATE ?? '',
  )
  if (!room || !isMarked(room)) return room
  const sandoq = findSandoq(process.env, isFile)
  return sandoq === undefined ? undefined : { ...room, sandoq }
}

function run(room: Room, argv: string[], input: string, cwd = workFolderOf(room)): Ran {
  const env = { ...process.env, PATH: `${room.path === '' ? '' : `${room.path}:`}${process.env.PATH ?? ''}` }
  const done = spawnSync(argv[0], argv.slice(1), { cwd, env, input, encoding: 'utf8', timeout: PROCESS_MS })
  return { ok: done.status === 0, out: `${done.stdout ?? ''}`, err: `${done.stderr ?? ''}`, status: done.status }
}

const sleep = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

// Every open ask of the session's cards (the newest few), this turn's included.
function sessionAsks(room: Room, session: string): Ask[] {
  const dir = `${room.run}/walks/${room.gate}`
  let names: string[] = []
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  return newestIds(names).flatMap(id => {
    const text = read(`${dir}/${id}.md`)
    return sessionOf(text) === session ? asksOf(text) : []
  })
}

// The session ids of this folder (order YS), written whole by a rename so a reader never sees half a file, at each message and before
// the card is made. A file that is not there or is bad begins a new one; a write that fails is no fault and the card is made all the same.
function noteSession(room: Room, cwd: string, session: string): void {
  const path = sessionsPathOf(room)
  const text = sessionsAfter(existsSync(path) ? read(path) : undefined, cwd, session)
  if (text === '') return
  const temp = `${path}.${process.pid}.tmp`
  try {
    writeFileSync(temp, text)
    renameSync(temp, path)
  } catch {
    try {
      unlinkSync(temp)
    } catch {
      // nothing was written, or the temporary file is gone already
    }
  }
}

function submit(raw: string): string {
  const input = parseSubmit(raw)
  if (!input || isBridgeOff(process.env)) return ''
  const room = findRoom(input.cwd || process.cwd())
  if (!room) return ''
  const cwd = input.cwd || process.cwd()
  noteSession(room, cwd, input.session)
  let id: string
  if (isMarked(room)) {
    // A marked room: ONE call, `sandoq room card`, run in the session's folder (sandoq names the seat by it), the prompt on its
    // input. It rings the door itself, so no feed is run and the hook names no seat. An id with exit 1 is a card made whose ring
    // failed: its reading is waited for as ever. With no id the session gets one line of context: the door is down, or any other
    // refusal (the words The room did not take this message, then the last line of the err, scrubbed of a path).
    const made = makeCard(room, input.session, '', input.prompt, (argv, text) => run(room, argv, text, cwd))
    id = bareIdFrom(made.out)
    if (id === '') return submitOutput(doorDownContext(made) || refusedContext(made))
  } else {
    const seat = seatOfFolder(room, cwd, read(seatsPathOf(room)))
    const made = makeCard(room, input.session, seat, input.prompt, (argv, text) => run(room, argv, text))
    id = made.ok ? cardIdFrom(made.out) : ''
    if (id === '') return ''
    run(room, feedArgv(room, feedWord(id)), '')
  }
  let walk = ''
  for (let waited = 0; waited <= WAIT_MS; waited += WAIT_STEP_MS) {
    walk = read(walkPath(room, id))
    if (isReadWalk(walk)) break
    sleep(WAIT_STEP_MS)
  }
  return submitOutput(readingContext(input.prompt, walk, sessionAsks(room, input.session)))
}

function stop(raw: string): void {
  const input = parseStop(raw)
  if (!input || isBridgeOff(process.env)) return
  const room = findRoom(input.cwd || process.cwd())
  if (!room) return
  // answer.py waits its own bound for the turn's route, so the hook's time is its.
  const env = { ...process.env, PATH: `${room.path === '' ? '' : `${room.path}:`}${process.env.PATH ?? ''}` }
  const argv = answerArgv(room, input.session)
  spawnSync(argv[0], argv.slice(1), { cwd: workFolderOf(room), env, input: input.answer, encoding: 'utf8', timeout: WAIT_MS + PROCESS_MS })
}

// After a Write, Edit or MultiEdit of a file of Claude's memory folder: ONE `sandoq room say --session ID memory: FILE`, run in the session's folder as
// the submit hook runs its card. The path is text here: nothing in this function opens, stat's or reads the file.
function memory(raw: string): void {
  const input = parseMemory(raw, process.env.HOME ?? '')
  if (!input || isBridgeOff(process.env)) return
  const cwd = input.cwd || process.cwd()
  const room = findRoom(cwd)
  const argv = memoryArgv(room, input.session, input.file)
  if (room && argv.length > 0) run(room, argv, '', cwd)
}

async function main(): Promise<void> {
  const raw = await new Promise<string>(resolve => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(data))
  })
  if (process.argv[2] === 'submit') {
    const out = submit(raw)
    if (out !== '') process.stdout.write(out)
  } else if (process.argv[2] === 'stop') {
    stop(raw)
  } else if (process.argv[2] === 'memory') {
    memory(raw)
  }
}

main().then(
  () => process.exit(0),
  () => process.exit(0),
)
