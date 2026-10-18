// The two calls of sandoq that make a room and start its door (order MR, R1): `sandoq room new NAME --json` and `sandoq room start
// --unit --json`. Each prints ONE json object on its out, with the keys `ok`, `verb`, `name`, `folder`, `state` and `line`. Pure: it reads
// what a call said and names a room from a folder; it runs nothing and imports no view or host module.
import { scrub } from './draws.ts'

// The four states sandoq says, and no other: `made` and `started` and `door-stands` go with exit 0, `refused` with exit 1.
export const START_STATES = ['made', 'started', 'door-stands', 'refused'] as const
export type StartState = (typeof START_STATES)[number]

// Why an out is not read (the pane then says nothing of what sandoq said, and never guesses): exit 2 is a usage fault with no object, the
// sign of an older sandoq; `code` is an exit that is neither 0, 1 nor 2 (or none); `no-object` is an out that holds no object; `state` is
// an object with no state of the four; `disagrees` is a state that does not go with the exit code.
export type NotRead = 'usage' | 'code' | 'no-object' | 'state' | 'disagrees'

// What a call said, read: `ok` is whether the room was made, the door started or already standing (the state and the code say it; the key
// `ok` of the object is not read), and `line` is sandoq's own plain line, scrubbed as each other line of sandoq is, in one row of words and
// WHOLE: it has no length bound, and the draw cuts it, not this.
export type RoomStart = { read: true; ok: boolean; state: StartState; line: string } | { read: false; reason: NotRead }

const isState = (value: unknown): value is StartState => typeof value === 'string' && (START_STATES as readonly string[]).includes(value)

// One text as a json object (not an array, not a number), or none.
const objectOf = (text: string): Record<string, unknown> | undefined => {
  if (text === '') return undefined
  try {
    const value: unknown = JSON.parse(text)
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

// The object of an out: the WHOLE out read as one object first (an object may span lines), then its LAST line (lines of another kind may
// stand before it).
const outObject = (out: string): Record<string, unknown> | undefined => {
  const whole = objectOf(out.trim())
  if (whole !== undefined) return whole
  const lines = out.split('\n').map(line => line.trim()).filter(line => line !== '')
  return objectOf(lines.at(-1) ?? '')
}

export const roomStartOf = (out: string, exitCode: number | undefined): RoomStart => {
  if (exitCode === 2) return { read: false, reason: 'usage' }
  if (exitCode !== 0 && exitCode !== 1) return { read: false, reason: 'code' }
  const object = outObject(out)
  if (object === undefined) return { read: false, reason: 'no-object' }
  const state = object.state
  if (!isState(state)) return { read: false, reason: 'state' }
  const ok = state !== 'refused'
  if (ok !== (exitCode === 0)) return { read: false, reason: 'disagrees' }
  const said = typeof object.line === 'string' ? scrub(object.line.replace(/\s+/g, ' ').trim()) : ''
  return { read: true, ok, state, line: said }
}

// The words of the Button that makes a room (order MR, R2) and of each line it leaves. The dim line under the Button names where, by
// the last two parts of the session's folder alone, never the path above them.
export const MAKE_BUTTON = 'Make a room here'
export const MAKING = 'Making the room…'
export const ROOM_TOO_OLD = 'This sandoq is too old to make a room from the pane. Run sandoq room new in this folder.'
export const ROOM_UNKNOWN = 'Nothing is known of the room; look in the folder.'
export const ROOM_NOT_READ = `sandoq room new did not answer as the pane expects. ${ROOM_UNKNOWN}`
export const ROOM_REFUSED = 'sandoq room new refused to make the room.'
export const makeWords = (name: string, where: string): string => `It makes the room ${name} in ${where}.`

// The same for the door of a room that stands (order MR, R3): `room start --unit --json`, the Button that makes the same call again where it
// did not go well, and the lines it leaves, as for the room with `the door` for `the room`.
export const START_BUTTON = 'Start the door'
export const STARTING = 'Starting the door…'
export const DOOR_UNKNOWN = 'Nothing is known of the door; look in the folder.'
export const DOOR_NOT_READ = `sandoq room start did not answer as the pane expects. ${DOOR_UNKNOWN}`
export const DOOR_REFUSED = 'sandoq room start refused to start the door.'

type PathEnv = Record<string, string | undefined>

const partsOf = (path: string): string[] => path.split('/').filter(part => part !== '' && part !== '.')
const isUnder = (parts: string[], base: string[]): boolean => base.length <= parts.length && base.every((part, at) => parts[at] === part)

// The temp folders of a system, besides the ones the environment names (a macOS session's own lives under /var/folders).
const SYSTEM_TEMP = ['/tmp', '/var/tmp', '/private/tmp', '/private/var/tmp', '/var/folders', '/private/var/folders']

// Where a room may be made from the pane (order MR, R2): the pane cannot tell the app's scratch folder, so it refuses the places that no
// one means a room for, by the path and the environment alone: no folder, a folder that is no full path, the root, the person's home
// itself or a folder with fewer than two parts under it (Documents, Desktop), and a temp folder or any folder in it. The rest, a plain
// project folder, is a yes; he judges it by the line that names where. Under the home, the places of the system and of the apps are a no
// too: a first part that is Library or AppData, or that begins with a dot (.claude, .config, .cache). Pure: the environment is the one the
// pane reads for sandoq.
const HOME_SYSTEM_PARTS = ['library', 'appdata']
export const mayMakeRoomIn = (folder: string, env: PathEnv): boolean => {
  if (!folder.startsWith('/')) return false
  const parts = partsOf(folder)
  if (parts.length === 0) return false
  const temps = [...SYSTEM_TEMP, ...['TMPDIR', 'TMP', 'TEMP'].map(key => env[key] ?? '')].filter(path => path.startsWith('/')).map(partsOf)
  if (temps.some(temp => temp.length > 0 && isUnder(parts, temp))) return false
  const home = (env.HOME ?? '').startsWith('/') ? partsOf(env.HOME ?? '') : []
  if (home.length > 0 && isUnder(parts, home)) {
    if (parts.length - home.length < 2) return false
    const first = parts[home.length]
    if (first.startsWith('.') || HOME_SYSTEM_PARTS.includes(first.toLowerCase())) return false
  }
  return true
}

// Where the room is made, for the line under the Button: the last two parts of the folder (one when it has one), never the path above.
export const whereOf = (folder: string): string => partsOf(folder.replace(/\\/g, '/')).slice(-2).join('/')

// The words as at most `rows` lines of at most `width` cells, cut at a word: when they do not fit the last line ends in an ellipsis. A
// word longer than a line is cut at the line's width. The words stand whole in the read tool; this is the draw's cut.
export const linesAtWord = (words: string, width: number, rows: number): string[] => {
  if (rows < 1) return []
  const room = Math.max(2, width)
  const all: string[] = []
  let line = ''
  for (const word of words.split(/\s+/).filter(one => one !== '')) {
    let rest = word
    while (rest.length > room) {
      if (line !== '') all.push(line)
      line = ''
      all.push(rest.slice(0, room))
      rest = rest.slice(room)
    }
    if (line === '') line = rest
    else if (line.length + 1 + rest.length <= room) line = `${line} ${rest}`
    else {
      all.push(line)
      line = rest
    }
  }
  if (line !== '') all.push(line)
  if (all.length <= rows) return all
  const shown = all.slice(0, rows)
  let last = shown[rows - 1]
  while (last.length + 1 > room && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '))
  shown[rows - 1] = last.length + 1 > room ? `${last.slice(0, room - 1)}…` : `${last}…`
  return shown
}

// The name of a room made in a folder: the last part of the folder, made a good name. `room new` takes letters, digits, `-` and `_`
// alone, so another character becomes `-`; a name that starts with `-` would be read by sandoq as a flag, so those dashes go; and an empty
// name becomes `room`. Never empty, never a flag, and the same name again when it is given a name (a name has no slash).
export const ROOM_NAME_FALLBACK = 'room'
export const roomNameOf = (folder: string): string => {
  const last = folder.split(/[/\\]/).filter(part => part !== '').at(-1) ?? ''
  const name = last.replace(/[^A-Za-z0-9_-]/g, '-').replace(/^-+/, '')
  return name === '' ? ROOM_NAME_FALLBACK : name
}
