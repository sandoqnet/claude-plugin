// THE ACTS OF THE DISCS (order DP, P4 part 3): where a disc is updated, and the words of each act. Until part 3 the table of Versions held
// them; the discs stand once now, in What it plays, and the pane's own line alone stays in Versions. The act is the register's one
// (table.onUpdate of VersionsTable: a disc's name, or none for `Update all`, which it runs as `sandoq room update`, its restart of the door
// too); this file only says which Button stands, from the steps the last check read. Pure: it imports the steps' words and nothing else.
import { waits } from './steps'
import type { Door, Step } from './steps'

export const UPDATE = 'Update'
export const UPDATE_RESTART = 'Update, restart door'
export const UPDATE_ALL = 'Update all'
export const UPDATE_ALL_RESTART = 'Update all, restart door'
export const DOOR_STANDS = 'A door runs in a terminal. Stop it there, then update.'
export const LONG = 'This can take long.'

// What runs: a check, an update, or nothing.
export type Busy = 'rest' | 'checking' | 'updating'

// WHILE ONE COMMAND RUNS: one line, and no Update or Check Button. The second sentence only with the restart flag.
export const runningWords = (running: { what: string; restart: boolean } | undefined): string =>
  running === undefined ? '' : `Updating ${running.what}.${running.restart ? ' The door is down meanwhile.' : ''}`

export type DiscActs = {
  // The label of the Button of each disc that waits, by the disc's name; a disc with none is not here.
  each: Record<string, string>
  // The label of `Update all`; none where fewer than two discs wait, or no Button may stand.
  all?: string
  // A door that runs in a terminal while a disc waits: no Button stands and one line says what to do.
  stands: boolean
  // A press may pass ten minutes (the door of the unit restarts) and a Button stands: its line says so.
  long: boolean
}

// The acts of the discs, from the steps of the last check. While a command runs, or where no command can (`cannot` says why), or under a
// door that stands in a terminal, no disc has a Button.
export function discActsOf({ steps, door, busy, cannot = '', long = false }: { steps: Step[]; door: Door; busy: Busy; cannot?: string; long?: boolean }): DiscActs {
  const waiting = steps.filter(step => step.noun === 'disc' && step.name !== '' && waits(step))
  const blocked = cannot !== ''
  const offered = busy === 'rest' && !blocked && door !== 'door-stands' && waiting.length > 0
  const label = door === 'would-restart' ? UPDATE_RESTART : UPDATE
  const each: Record<string, string> = {}
  if (offered) for (const step of waiting) each[step.name] = label
  return {
    each,
    ...(offered && waiting.length >= 2 ? { all: door === 'would-restart' ? UPDATE_ALL_RESTART : UPDATE_ALL } : {}),
    stands: !blocked && door === 'door-stands' && waiting.length > 0,
    long: long && offered,
  }
}
