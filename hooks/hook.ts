// The bridge's three hooks, run by `node hook.ts submit` (UserPromptSubmit), `node hook.ts stop`
// (Stop) and `node hook.ts memory` (PostToolUse of Write, Edit and MultiEdit). Whatever goes wrong, the exit is 0 and
// nothing is printed: the room never blocks the user's prompt or his turn's end. Thin by design: the pure
// parts are in bridge.ts, tested there.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'

import {
  FEED_MS,
  WAIT_MS,
  WAIT_STEP_MS,
  answerArgv,
  asksOf,
  cardIdFrom,
  feedinArgv,
  feedsHis,
  findRoomFrom,
  findSandoq,
  isBridgeOff,
  isMarked,
  isReadWalk,
  memoryText,
  noCardContext,
  parseMemory,
  parseStop,
  parseSubmit,
  readingContext,
  sessionOf,
  sessionsAfter,
  sessionsPathOf,
  submitOutput,
  turnRowsOf,
  walkPath,
  workFolderOf,
} from './bridge.ts'
import type { Ask, FeedKind, FeedRow, Ran, Room } from './bridge.ts'
import { newestIds } from './model/shelf.ts'
import { turnStartIn } from './model/sessionseat.ts'

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

function run(room: Room, argv: string[], input: string, timeout = PROCESS_MS): Ran {
  const env = { ...process.env, PATH: `${room.path === '' ? '' : `${room.path}:`}${process.env.PATH ?? ''}` }
  const done = spawnSync(argv[0], argv.slice(1), { cwd: workFolderOf(room), env, input, encoding: 'utf8', timeout })
  return { ok: done.status === 0, out: `${done.stdout ?? ''}`, err: `${done.stderr ?? ''}`, status: done.status }
}

// One entry on the room's feed: the program feedin of the room in its work folder, the text on its input, the session's folder and id
// named by its flags (the program names the seat by the folder). Never a second try, never another road.
function feed(room: Room, kind: FeedKind, text: string, cwd: string, session: string, row?: FeedRow, timeout = PROCESS_MS): Ran {
  return run(room, feedinArgv(room, kind, cwd, session, row), text, timeout)
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

// The child that feeds a turn: this script again, the word `rows`, the hook's own input on its input. It outlives this hook (detached, no
// stdio of its own) and its work is no fault of the hook's.
function startRows(raw: string): Promise<void> {
  return new Promise(resolve => {
    try {
      const child = spawn(process.execPath, [...process.execArgv, process.argv[1], 'rows'], { detached: true, stdio: ['pipe', 'ignore', 'ignore'], env: process.env })
      child.on('error', () => resolve())
      child.stdin.on('error', () => resolve())
      child.stdin.end(raw, () => {
        child.unref()
        resolve()
      })
    } catch {
      resolve()
    }
  })
}

// The child's work: each row of the turn, oldest first, fed alone as kind row with its sayer and number (the sayer `none` when the line has
// no plain one). A row that fails is no reason to drop the rows after it. A row gets FEED_MS, over the 30 seconds of feedin's call to Jev: a feedin
// cut sooner would lose the answer and the card after the entry was written.
function rows(raw: string): void {
  const input = parseSubmit(raw)
  if (!input || isBridgeOff(process.env)) return
  const cwd = input.cwd || process.cwd()
  const room = findRoom(cwd)
  const turn = turnRowsOf(splitTurn(input.prompt).turn)
  if (!room || turn === undefined) return
  for (const row of turn) feed(room, 'row', row.line, cwd, input.session, { sayer: row.sayer, seq: row.seq }, FEED_MS)
}

// The pane's turn in a prompt, and his words before it. A prompt that opens with a head is all turn; else the head of the pane's own turn, whole, at the start
// of a later line cuts the prompt (a host that queues what a turn waits on hands one prompt, his words first): his before it, the room's rows from it.
function splitTurn(prompt: string): { his: string; turn: string } {
  if (turnRowsOf(prompt) !== undefined) return { his: '', turn: prompt }
  const at = turnStartIn(prompt)
  return at < 0 ? { his: prompt, turn: '' } : { his: prompt.slice(0, at).trim(), turn: prompt.slice(at) }
}

// His words: ONE entry, kind his, the words the whole input. The door may make a card of it, and then its word is on the out and its reading
// is waited for as ever. With no word the session gets no context, or ONE line: the entry waits on the feed (exit 1), or the room did not take it.
function hisWords(room: Room, cwd: string, session: string, words: string): string {
  const made = feed(room, 'his', words, cwd, session, undefined, FEED_MS)
  const id = cardIdFrom(made.out)
  if (id === '') return submitOutput(noCardContext(made))
  let walk = ''
  for (let waited = 0; waited <= WAIT_MS; waited += WAIT_STEP_MS) {
    walk = read(walkPath(room, id))
    if (isReadWalk(walk)) break
    sleep(WAIT_STEP_MS)
  }
  return submitOutput(readingContext(words, walk, sessionAsks(room, session)))
}

function submit(raw: string): string | Promise<string> {
  const input = parseSubmit(raw)
  if (!input || isBridgeOff(process.env)) return ''
  const room = findRoom(input.cwd || process.cwd())
  if (!room) return ''
  const cwd = input.cwd || process.cwd()
  noteSession(room, cwd, input.session)
  // A wake's turn is the room's rows, not his words, and every row must land: ONE detached child, `node hook.ts rows`, gets the turn on its
  // input and feeds each row in order with no budget; this hook returns at once, with no wait and no context. Words of his before the turn are his,
  // fed only when the room takes them (feedsHis): else they are not fed and the session gets no context.
  const { his, turn } = splitTurn(input.prompt)
  const takesHis = feedsHis(room)
  if (turn === '') return takesHis ? hisWords(room, cwd, input.session, input.prompt) : ''
  const started = startRows(raw).then(() => '')
  return his === '' || !takesHis ? started : started.then(() => hisWords(room, cwd, input.session, his))
}

function stop(raw: string): void {
  const input = parseStop(raw)
  if (!input || isBridgeOff(process.env)) return
  const room = findRoom(input.cwd || process.cwd())
  if (!room) return
  // answer.py alone, as ever: it waits its own bound for the turn's route, writes the answer entry on the feed itself, and returns at once when
  // the session's newest entry has no card. The bridge feeds nothing at Stop.
  run(room, answerArgv(room, input.session), input.answer, WAIT_MS + PROCESS_MS)
}

// After a Write, Edit or MultiEdit of a file of Claude's memory folder: ONE entry, kind memory, its text `memory: FILE`, fed as the submit hook feeds
// his words. The path is text here: nothing in this function opens, stat's or reads the file.
function memory(raw: string): void {
  const input = parseMemory(raw, process.env.HOME ?? '')
  if (!input || isBridgeOff(process.env)) return
  const cwd = input.cwd || process.cwd()
  const room = findRoom(cwd)
  if (room) feed(room, 'memory', memoryText(input.file), cwd, input.session)
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
    const out = await submit(raw)
    if (out !== '') process.stdout.write(out)
  } else if (process.argv[2] === 'rows') {
    rows(raw)
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
