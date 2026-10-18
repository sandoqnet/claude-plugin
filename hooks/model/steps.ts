// THE STEPS of the json form (sandoq 0.3.0, order V3): `sandoq update --check --json` and `sandoq room update --json` print one
// object a line, each a step: noun, name, state, here, there, why, ok, line, after. This file only reads them; it runs nothing and
// holds no sentence of sandoq's: the word of a state comes from the state alone, and `why` or `line` stands whole under the entry.
export type Step = {
  noun: string
  name: string
  state: string
  here: string
  there: string
  why: string
  ok: boolean
  line: string
  after: string
}

// What one run printed: its steps in order, and each other line kept plain (a usage error, a line a child said).
export type Read = { steps: Step[]; plain: string[] }

const text = (given: unknown): string => (typeof given === 'string' ? given : '')

// One line is a step when it is one json object with a string `state`; any other line is kept plain. Unknown keys are ignored and a
// missing key is the empty string.
export function readSteps(out: string): Read {
  const steps: Step[] = []
  const plain: string[] = []
  for (const raw of out.split('\n')) {
    const line = raw.trim()
    if (line === '') continue
    let given: unknown
    try {
      given = line.startsWith('{') ? JSON.parse(line) : undefined
    } catch {
      given = undefined
    }
    const object = given as Record<string, unknown> | undefined
    if (typeof object !== 'object' || object === null || Array.isArray(object) || typeof object.state !== 'string') {
      plain.push(line)
      continue
    }
    steps.push({
      noun: text(object.noun),
      name: text(object.name),
      state: object.state,
      here: text(object.here),
      there: text(object.there),
      why: text(object.why),
      ok: object.ok === true,
      line: text(object.line),
      after: text(object.after),
    })
  }
  return { steps, plain }
}

// The lines form of an out, for a card that draws lines and not a table (the terminal's): each step is its own `line`, the bytes the
// lines form of sandoq prints for it, and any other line stands as it was.
export const stepLines = (out: string): string[] =>
  out.split('\n').flatMap(raw => {
    const read = readSteps(raw)
    return read.steps.length > 0 ? [read.steps[0]!.line] : read.plain
  })

// The groups of a state. Only the states the README says as a wait, a stop, a quiet or a current one are grouped; every other state is
// `other`, read by its own words (held and held-home mean a door stands and are their own words).
//  wait: a step that would change something when pressed (would-update, would-install, would-swap).
//  refused: a step that did not go, ok false in sandoq (refused, not-updated, not-swapped, not-stopped, not-started), the check that
//    could not read (not-checked), the terminal door that is refused untouched (door-stands) and, of the pane in sandoq 0.4.0, the
//    plugin that the settings turn off (not-loaded) and the missing claude command (no-claude).
//  current: nothing to do (up-to-date, bundled).
//  quiet: the bytes are a release's and nothing waits (would-note, noted, kept): the word current, no line, no Button. A disc on hold
//    (on-hold, ok true) sorts here too, so it is counted with the current ones and is no fault and no refusal; its word and its note
//    are its own (wordOf, noteOf).
//  unknown: the check cannot read it (unknown).
export type Group = 'wait' | 'refused' | 'unknown' | 'current' | 'quiet' | 'other'
const WAITS = ['would-update', 'would-install', 'would-swap']
const REFUSALS = ['refused', 'not-updated', 'not-swapped', 'not-stopped', 'not-started', 'not-checked', 'door-stands', 'not-loaded', 'no-claude']
// These sort with the refusals but nothing was refused: the check could not read, the settings turn the pane off, no claude was
// found. Their word is in the default ink, not the error key, and the `why` stands under the entry.
const NOT_A_FAULT = ['not-checked', 'not-loaded', 'no-claude']
const CURRENT = ['up-to-date', 'bundled']
export const ON_HOLD = 'on-hold'
const QUIET = ['would-note', 'noted', 'kept', ON_HOLD]

export const groupOf = (state: string): Group =>
  WAITS.includes(state)
    ? 'wait'
    : REFUSALS.includes(state)
      ? 'refused'
      : CURRENT.includes(state)
        ? 'current'
        : QUIET.includes(state)
          ? 'quiet'
          : state === 'unknown'
            ? 'unknown'
            : 'other'

// The word of a state, from the state alone: any state not named is its own words, dashes as spaces (`not updated`, `held`).
export const wordOf = (state: string): string => {
  const group = groupOf(state)
  if (state === ON_HOLD) return 'on hold'
  return group === 'wait' ? 'update waits' : group === 'current' || group === 'quiet' ? 'current' : group === 'unknown' ? 'not known' : state.replace(/-/g, ' ')
}

export const isNotAFault = (state: string): boolean => NOT_A_FAULT.includes(state)

export const isPane = (step: Step): boolean => step.noun === 'pane'
export const waits = (step: Step): boolean => groupOf(step.state) === 'wait'
// The one press of the pane's own line: where the pane waits (would-install, would-update in sandoq 0.4.0) and where the check cannot
// read it (unknown, in 0.3.0). The other states of the pane (installed, restart, not-loaded, no-claude) have no Button.
export const panePress = (step: Step): boolean => isPane(step) && (waits(step) || step.state === 'unknown')

// The name of a line: the step's name, else Pane for the pane, else its noun.
export const labelOf = (step: Step): string => (step.name !== '' ? step.name : isPane(step) ? 'Pane' : step.noun.charAt(0).toUpperCase() + step.noun.slice(1))

// The only change a sentence of sandoq's takes on the card: the home folder at the start of a path is a tilde (`/home/kai/x` is
// `~/x`). The rest of the path and each command stand as written, to be run by hand (the `not-updated` why of the pane holds
// two commands with a folder path, to 300 cells). A path just after a quote stands as written: a quoted tilde does not expand when he
// runs the command by hand.
const HOME = /(^|[^\p{L}\p{M}\p{N}_.@+~/"'-])\/(?:(?:home|Users)\/[^/\s"'`]+|root(?![\p{L}\p{M}\p{N}_.-]))/gu
export const homeAsTilde = (text: string): string => text.replace(HOME, '$1~')

// The words of a disc on hold under its row, from `here` (the version held) and `there` alone: nothing when `there` is empty (nothing
// newer stands: the row says on hold, and the version is its own), else the newer version, or for the room-seat disc the two words
// `the player's`, which are said as they come: `on hold at 2026.10.12.00, 2026.10.14.00 is newer.` / `..., the player's is newer.`
export const heldNote = (step: Step): string =>
  step.there === '' ? '' : `${step.here === '' || step.here === 'none' ? 'on hold' : `on hold at ${step.here}`}, ${step.there} is newer.`

// The pane with no claude command on the path (sandoq 0.4.x): ok true, nothing was refused, and its `why` is a bare name (the repository of the pane's marketplace). The words of the
// step are its `line`, which says the in-app steps (add the marketplace, install the plugin, restart the app). A record of an older sandoq
// says ok false: it is read as it was, by its `why`.
export const isNoClaude = (step: Step): boolean => step.state === 'no-claude' && step.ok

// The words under an entry: `why`, else the step's `line` for a state the card does not name. A wait, a refusal, a current line and an
// unknown one with no `why` say nothing more; a quiet state (would-note, noted, kept) says nothing at all, whatever it holds, but a disc
// on hold says what is newer (heldNote), and a pane with no claude says its line (isNoClaude). The words stand whole.
export const noteOf = (step: Step): string => {
  if (step.state === ON_HOLD) return heldNote(step)
  if (isNoClaude(step) && step.line !== '') return homeAsTilde(step.line)
  const group = groupOf(step.state)
  return homeAsTilde(group === 'quiet' ? '' : step.why !== '' ? step.why : group === 'other' ? step.line : '')
}

// A step that is a part of the table. The door's steps (noun door, and the door-stands refusal of the whole command), the lines a
// child said, the old plugin of the pane (oldPluginLines) and the notices of its step (paneNoticeLines) are no entries: the door is
// read by doorOfCheck.
export const isEntry = (step: Step): boolean =>
  step.noun !== 'door' && step.state !== 'door-stands' && step.state !== 'said' && step.state !== OLD_PLUGIN && !NOTICES.includes(step.state)

// The pane's step of the table, the entry (the old plugin is a step of noun pane as well, and no entry).
export const paneStepOf = (steps: Step[]): Step | undefined => steps.find(step => isPane(step) && isEntry(step))

// THE OLD PLUGIN of the pane (`old-plugin`, sandoq 0.4.0) is NO entry: its hook takes the prompt and the pane never opens, and the
// words are one dim line under the table, from its `why`, else its `line`; with neither, no line. It stays read for a sandoq that
// came before the one that says removed-old, and no other change is made to it.
const OLD_PLUGIN = 'old-plugin'
export const oldPluginLines = (steps: Step[]): string[] =>
  steps
    .filter(step => step.state === OLD_PLUGIN)
    .map(step => homeAsTilde(step.why !== '' ? step.why : step.line))
    .filter(line => line !== '')

// THE NOTICES of the pane step of the runtime that knows the marketplace sandoq: removed-old (ok: the old pane, the plugin of a folder of this machine, is gone),
// would-remove-old (the check: it would go) and left (a room-local of another source stands and is left; its `why` says what stands).
// Each is NO entry, so the pane keeps its one line: one dim line under the table, the step's own `line` whole, else its `why`; no
// Button. They group as `other`: no press of the pane does anything for them, and nothing was refused. The move itself, would-move
// (the check: the pane would move to sandoqnet/claude-plugin at the pin's tag), is the pane's own entry: its word, its `line` under it, no Button.
const NOTICES = ['removed-old', 'would-remove-old', 'left']
export const paneNoticeLines = (steps: Step[]): string[] =>
  steps
    .filter(step => NOTICES.includes(step.state))
    .map(step => homeAsTilde(step.line !== '' ? step.line : step.why))
    .filter(line => line !== '')

// What needs him comes first: the pane, then each wait, each refusal (not-checked with them), each not known, then what is current
// (a quiet state with it) and each other state.
const RANK: Record<Group, number> = { wait: 1, refused: 2, unknown: 3, current: 4, quiet: 4, other: 4 }
const rankOf = (step: Step): number => (isPane(step) ? 0 : RANK[groupOf(step.state)])
export const orderedSteps = (steps: Step[]): Step[] => steps.filter(isEntry).sort((a, b) => rankOf(a) - rankOf(b))

// The two checks make one table. `sandoq update --check` says the machine's discs too; the room's discs are the room update's, so
// the first check gives its sandoq, player and pane steps and the second all of its own.
export const checkedSteps = (machine: Read, room: Read): Step[] => [...machine.steps.filter(step => step.noun !== 'disc'), ...room.steps]

// The door, from the objects of a check: a terminal door stands (door-stands), a door of the unit with a swap owed (a step of noun
// door, would-restart), or none. (Not model/roomplace's doorOf, which reads the door's tick.)
export type Door = 'none' | 'would-restart' | 'door-stands'
export const doorOfCheck = (steps: Step[]): Door =>
  steps.some(step => step.state === 'door-stands') ? 'door-stands' : steps.some(step => step.noun === 'door' && step.state === 'would-restart') ? 'would-restart' : 'none'

// The error out of a run, less its progress lines (order PR1): sandoq 0.4.1 writes on the error out of an update lines that say how far
// it is, each beginning with the word progress, a colon and a space, in lower case. They are no reason, no note and no toast, and the
// last line of the error out is the reason of a refusal, so the pane takes them out wherever it reads that stream. Any other line,
// one that says Progress in capitals or holds the word elsewhere in it, stays.
export const withoutProgress = (text: string | undefined): string =>
  (text ?? '')
    .split('\n')
    .filter(line => !/^\s*progress: /.test(line))
    .join('\n')

// The `after` words of the README.
export const AFTER = { none: 'none', restartClaude: 'restart-claude', restartRoom: 'restart-room', stopDoor: 'stop-door', startDoor: 'start-door' }

// A pane update is loaded by a NEW SESSION: no restart of the app. (The `after` word of sandoq stays `restart-claude`.)
export const RESTART_CLAUDE = 'Open a new session to load it.'
export const DOOR_STARTED = 'The door was started again.'
export const DOOR_NOT_UP = 'The door did not come up.'
export const DOOR_KEPT = 'The update stopped midway. The door runs on the discs that stand.'

// The door did not come up after a run: the card offers `Start the door`.
export const doorNotUp = (steps: Step[]): boolean => steps.some(step => step.state === 'not-started' || step.after === AFTER.startDoor)

// ONE plain line after a RUN, by `after` (and the states that say the same by their own word): the worst first, never two that say
// the same. '' when nothing is left to him. It takes the objects of a RUN alone: the `after` key of a CHECK's object never reaches it
// (a check changes nothing, so nothing is left to him), and a step in a state that only a check says is read as no run's.
export function afterLine(run: Step[]): string {
  const steps = run.filter(step => !['wait', 'current', 'quiet', 'unknown'].includes(groupOf(step.state)) && step.state !== 'would-restart')
  if (doorNotUp(steps)) return DOOR_NOT_UP
  if (steps.some(step => step.state === 'started-kept')) return DOOR_KEPT
  if (steps.some(step => step.after === AFTER.restartClaude)) return RESTART_CLAUDE
  if (steps.some(step => step.after === AFTER.restartRoom || step.state === 'started')) return DOOR_STARTED
  return ''
}

// The pane's two versions: `here` of the pane's step is the version INSTALLED, the pane's constant is the version LOADED. The entry's
// here column holds the LOADED version alone (`text`); when they differ the dim line under the entry (`note`) says both, in one
// sentence that wraps: `0.8.1 installed, 0.8.0 loaded. Open a new session.` (short, so it takes two rows at the stacked card's width)
// `here` is `none` or empty when the plugin file is not read: then the loaded version stands alone and there is no note.
export const OPEN_NEW_SESSION = 'Open a new session.'
export function paneVersions(step: Step | undefined, loaded: string): { text: string; note: string } {
  const installed = step === undefined || step.here === 'none' ? '' : step.here
  if (installed === '' || installed === loaded) return { text: loaded, note: '' }
  return { text: loaded, note: `${installed} installed, ${loaded} loaded. ${OPEN_NEW_SESSION}` }
}
