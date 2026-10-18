// The pane's own settings (order B-P7, B-S3): what sits on the wall, the hour it shows, the lenses shown, what the
// feed shows and where the pane opens. A small JSON file the pane keeps for itself; it holds no rule and no picture
// (his rules are rules.md of the room shelf). Pure: no host, no view. A bad or missing key gives its default (a file
// of 0.5.0 without the new keys reads as the defaults), and nothing here throws. A change applies at once and comes
// back with its undo (the settings before) and its line (the plain words of the change).
import type { Hour } from './scene.ts'

export type Corner = 'off' | 'top left' | 'top right' | 'bottom left' | 'bottom right'

export type Settings = {
  // The corner of the plate that holds the date, and the one that holds the clock.
  date: Corner
  clock: Corner
  // The hour the scene shows: from the clock, or held at one of the four.
  hour: 'clock' | Hour
  // The scene on the wall; off, the cards stand alone.
  scene: boolean
  // The lenses of the us face: shown, or hidden. Public always stays.
  operator: boolean
  trace: boolean
  // What the Operator feed shows: only the cards where a gate or an input form first shows, or every card.
  shows: 'gates' | 'every'
  // What the pane opens on: his desk (`seat`, as a file written before the desk says it), or the room's (one level up).
  open: 'seat' | 'room'
}

export type SettingKey = keyof Settings

// A choice of a Select: the value it holds and the words it shows.
export type Choice = { value: string; label: string }

// A section of the place: its id, its title and its dim line. The feed and its lenses stand first (its id is `lenses`, the key
// of its card since B-P7); the keeper's rules are no section of settings: they are his rules.md, drawn by the view.
export type Section = { id: 'scene' | 'lenses'; title: string; line: string }

// THE ONE TABLE (order DP, P3 part A): a row a setting, the same fields as a disc's settings block (way 2, W1): its key, its name,
// its choices (a list, or the word `text` for a free word), its default and its note, then the section it sits in and its place
// there. A `flag` setting is true or false in the file and holds two words, the one for true and the one for false. Every other table
// of this file (KEYS, DEFAULTS, the valid values, CHOICES, GROUPS, groupOf) is built from these rows; way 2 swaps the source alone.
export type Row = {
  key: SettingKey
  name: string
  choices: Choice[] | 'text'
  default: Settings[SettingKey]
  // The dim words under the row; none draws no line (no row has a note yet).
  note: string
  section: Section['id']
  // The row's place in its section, from 1.
  place: number
  flag?: { on: string; off: string }
}

const CORNER_CHOICES: Choice[] = [
  { value: 'off', label: 'Off' },
  { value: 'top left', label: 'Top left' },
  { value: 'top right', label: 'Top right' },
  { value: 'bottom left', label: 'Bottom left' },
  { value: 'bottom right', label: 'Bottom right' },
]

// The rows, in the order the file keeps its keys.
export const ROWS: Row[] = [
  { key: 'date', name: 'Date', choices: CORNER_CHOICES, default: 'off', note: '', section: 'scene', place: 1 },
  { key: 'clock', name: 'Clock', choices: CORNER_CHOICES, default: 'off', note: '', section: 'scene', place: 2 },
  {
    key: 'hour',
    name: 'The hour',
    choices: [
      { value: 'clock', label: 'From the clock' },
      { value: 'morning', label: 'Held at morning' },
      { value: 'noon', label: 'Held at noon' },
      { value: 'sunset', label: 'Held at sunset' },
      { value: 'night', label: 'Held at night' },
    ],
    default: 'clock',
    note: '',
    section: 'scene',
    place: 3,
  },
  {
    key: 'scene',
    name: 'Scene',
    choices: [
      { value: 'on', label: 'On' },
      { value: 'off', label: 'Off' },
    ],
    default: true,
    note: '',
    section: 'scene',
    place: 4,
    flag: { on: 'on', off: 'off' },
  },
  {
    key: 'operator',
    name: 'Operator',
    choices: [
      { value: 'shown', label: 'Shown' },
      { value: 'hidden', label: 'Hidden' },
    ],
    default: true,
    note: '',
    section: 'lenses',
    place: 3,
    flag: { on: 'shown', off: 'hidden' },
  },
  {
    key: 'trace',
    name: 'Trace',
    // Trace's choices stand with Hidden first.
    choices: [
      { value: 'hidden', label: 'Hidden' },
      { value: 'shown', label: 'Shown' },
    ],
    default: false,
    note: '',
    section: 'lenses',
    place: 4,
    flag: { on: 'shown', off: 'hidden' },
  },
  {
    key: 'shows',
    name: 'Shows',
    choices: [
      { value: 'gates', label: 'Gates and questions' },
      { value: 'every', label: 'Every card' },
    ],
    default: 'gates',
    note: '',
    section: 'lenses',
    place: 1,
  },
  {
    key: 'open',
    name: 'On open',
    choices: [
      // The value stays `seat`, as a person's file may hold it: it opens the desk (order DESK, D2).
      { value: 'seat', label: 'The desk' },
      { value: 'room', label: 'The room' },
    ],
    default: 'seat',
    note: '',
    section: 'lenses',
    place: 2,
  },
]

// The sections, in the order the place draws them.
export const SECTIONS: Section[] = [
  { id: 'lenses', title: 'The feed and its lenses', line: 'Public stays. A hidden lens leaves the header too.' },
  { id: 'scene', title: 'On the scene', line: 'What sits on the wall, and the hour it shows.' },
]

// The choices of a row as the Select holds them: a `text` row has none (a free word).
export const choicesOf = (row: Row): Choice[] => (row.choices === 'text' ? [] : row.choices)

// Whether a value from the file is one the row holds: a flag a boolean, a `text` row any word, else one of its choices.
export const validOf =
  (row: Row) =>
  (value: unknown): boolean => {
    if (row.flag !== undefined) return typeof value === 'boolean'
    if (row.choices === 'text') return typeof value === 'string'
    return row.choices.some(choice => choice.value === value)
  }

const rowOf = (key: SettingKey): Row => ROWS.find(row => row.key === key) as Row

export const KEYS: SettingKey[] = ROWS.map(row => row.key)

export const CORNERS: Corner[] = CORNER_CHOICES.map(choice => choice.value as Corner)

export const DEFAULTS: Settings = Object.fromEntries(ROWS.map(row => [row.key, row.default])) as Settings

const VALID = Object.fromEntries(ROWS.map(row => [row.key, validOf(row)])) as Record<SettingKey, (value: unknown) => boolean>

// The settings in a file's text: JSON. Each bad or missing key takes its default; a text that is no object,
// or no JSON at all, gives the defaults.
export function parseSettings(text: string | undefined): Settings {
  let raw: unknown
  try {
    raw = JSON.parse(text as string)
  } catch {
    return { ...DEFAULTS }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ...DEFAULTS }
  const found = raw as Record<string, unknown>
  const settings: Record<string, unknown> = { ...DEFAULTS }
  for (const key of KEYS) if (VALID[key](found[key])) settings[key] = found[key]
  return settings as Settings
}

// The file's text for the settings: JSON, the keys in their order, a line end last.
export function settingsText(settings: Settings): string {
  const body: Record<string, unknown> = {}
  for (const key of KEYS) body[key] = VALID[key](settings[key]) ? settings[key] : DEFAULTS[key]
  return `${JSON.stringify(body, null, 2)}\n`
}

export const CHOICES = Object.fromEntries(ROWS.map(row => [row.key, choicesOf(row)])) as Record<SettingKey, Choice[]>

// The place's groups: a title, its dim line, and a row for each setting (its name), the rows in their place.
export type Group = Section & { rows: { key: SettingKey; label: string }[] }

export const GROUPS: Group[] = SECTIONS.map(section => ({
  ...section,
  rows: ROWS.filter(row => row.section === section.id)
    .sort((a, b) => a.place - b.place)
    .map(row => ({ key: row.key, label: row.name })),
}))

// The group a setting sits in.
export const groupOf = (key: SettingKey): Group['id'] => rowOf(key).section

// The value of a setting as the word its Select holds, and the word back to the value (none for a word that
// is no choice of that setting).
export function wordOf(settings: Settings, key: SettingKey): string {
  const value = settings[key]
  if (typeof value === 'string') return value
  const flag = rowOf(key).flag
  return flag === undefined ? String(value) : value ? flag.on : flag.off
}

export function valueOfWord(key: SettingKey, word: string): Settings[SettingKey] | undefined {
  const row = rowOf(key)
  if (row.choices === 'text') return word as Settings[SettingKey]
  if (!CHOICES[key].some(choice => choice.value === word)) return undefined
  return row.flag === undefined ? (word as Settings[SettingKey]) : word === row.flag.on
}

// The plain words of one setting changed to a value: "Date on, bottom right", "The hour held at noon".
function clause(key: SettingKey, value: Settings[SettingKey]): string {
  if (key === 'date' || key === 'clock') {
    const name = key === 'date' ? 'Date' : 'Clock'
    return value === 'off' ? `${name} off` : `${name} on, ${value}`
  }
  if (key === 'hour') return value === 'clock' ? 'The hour from the clock' : `The hour held at ${value}`
  if (key === 'scene') return value ? 'Scene on' : 'Scene off'
  if (key === 'shows') return value === 'gates' ? 'The feed shows gates and questions' : 'The feed shows every card'
  if (key === 'open') return value === 'seat' ? 'The pane opens on your desk' : 'The pane opens on the room'
  return `${key === 'operator' ? 'Operator' : 'Trace'} ${value ? 'shown' : 'hidden'}`
}

export type Change = {
  settings: Settings
  // The settings before the change.
  undo: Settings
  // The plain words of the change: "Date and clock on, bottom right."; none when nothing changed.
  line: string
  // The keys that changed, in the file's order.
  keys: SettingKey[]
}

// Several settings changed at once: the date and the clock set to one value read as one clause. A value that
// is not valid for its key, or is the value it has, changes nothing.
export function changeMany(settings: Settings, patch: Partial<Settings>): Change {
  const next: Record<string, unknown> = { ...settings }
  const keys: SettingKey[] = []
  for (const key of KEYS) {
    const value = patch[key]
    if (value === undefined || !VALID[key](value) || value === settings[key]) continue
    next[key] = value
    keys.push(key)
  }
  const both = keys.includes('date') && keys.includes('clock') && next.date === next.clock
  const parts: string[] = []
  if (both) parts.push(next.date === 'off' ? 'Date and clock off' : `Date and clock on, ${next.date}`)
  for (const key of keys) {
    if (both && (key === 'date' || key === 'clock')) continue
    parts.push(clause(key, next[key] as Settings[SettingKey]))
  }
  return { settings: next as Settings, undo: { ...settings }, line: parts.length === 0 ? '' : `${parts.join('; ')}.`, keys }
}

// One setting changed to a value.
export function change<K extends SettingKey>(settings: Settings, key: K, value: Settings[K]): Change {
  return changeMany(settings, { [key]: value })
}

// The one "Settings changed" card the feed holds: its title, what changed in one sentence, and who did it.
// The lines are the lines of the changes (see Change.line); none gives no card.
export function changedCard(lines: string[]): { title: string; text: string; by: string } | undefined {
  const parts = lines.map(line => line.trim().replace(/\.$/, '')).filter(line => line !== '')
  if (parts.length === 0) return undefined
  const text = parts.map((part, i) => (i === 0 ? part : `${part.charAt(0).toLowerCase()}${part.slice(1)}`)).join('; ')
  return { title: 'Settings changed', text: `${text}.`, by: 'by you, in Settings' }
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// The clock's words: the time, 24 hours ("18:40"), and the date ("Monday 12 Oct"). `now` is ms since the epoch,
// `zone` the clock's offset from UTC in minutes.
// A `now` that is no number gives no words.
export function clockText(now: number, zone = 0): string {
  const at = new Date(now + zone * 60000)
  if (Number.isNaN(at.getTime())) return ''
  return `${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')}`
}

export function dateText(now: number, zone = 0): string {
  const at = new Date(now + zone * 60000)
  if (Number.isNaN(at.getTime())) return ''
  return `${DAYS[at.getUTCDay()]} ${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]}`
}

// "held at noon" while the hour is held, else none.
export const heldText = (settings: Settings): string => (settings.hour === 'clock' ? '' : `held at ${settings.hour}`)
