// THE UPDATE FLOW (order PF1, Ardalan's Pane flows): what waits to be updated, said once, in any place. Pure: no host, no view. The signs
// are read from two sources the pane already has: the open ask of an offer on the walks (the room's `sandoq::disc::ask`), and the steps of
// the last check (`sandoq update --check` and `sandoq room update --check`, read on the press of Check now). Every version in a sign is a
// version one of them gave; with none read there is no sign and no number. The pane reads nothing here and runs nothing: the register keeps
// the memory (what was skipped, what ran, how it ended) and this file puts it in words.
import { isPane, waits } from './steps.ts'
import type { Step } from './steps.ts'
import type { Update } from './roomplace.ts'

// A thing that waits to be updated. `runs` says the pane has a press for it: the pane and a disc of the room (the Versions table's own) and sandoq itself
// (`sandoq update --verified --json`, his word Q282); the register says no to the last where the sandoq here is under the version that takes `--verified`.
export type Sign = { noun: 'pane' | 'disc' | 'sandoq'; name: string; version: string; page: string; runs: boolean }

export const signKey = (sign: Sign): string => `${sign.noun}:${sign.name}@${sign.version}`

// What an update of the session took in is kept as `name@version`, or `name@` for a press that read no version (it took in what was latest).
export const settledKey = (sign: Sign): string => `${sign.name}@${sign.version}`
export const isSettled = (settled: string[], sign: Sign): boolean => settled.includes(settledKey(sign)) || settled.includes(`${sign.name}@`)

// The signs, ask first (it has the page), then the check's waits; a thing named twice stays once. A disc the ask names that is the version
// the room plays already, or one that an update of this session took in (`settled`), is no sign: the ask stays open on the walks, for
// the pane taps nothing on Update (the door would write it for the next start, which could take an older sha than the one now in).
export function signsOf({ ask, installed, steps, settled }: { ask?: Update; installed: { name: string; version: string }[]; steps: Step[]; settled: string[] }): Sign[] {
  const signs: Sign[] = []
  const add = (sign: Sign): void => {
    if (!signs.some(one => one.noun === sign.noun && one.name === sign.name)) signs.push(sign)
  }
  if (ask !== undefined) {
    const discs = ask.discs ?? [{ name: ask.name, from: ask.from, version: ask.version, page: ask.page }]
    for (const disc of discs) {
      const sign: Sign = { noun: 'disc', name: disc.name, version: disc.version, page: disc.page, runs: true }
      if (installed.some(one => one.name === disc.name && one.version === disc.version) || isSettled(settled, sign)) continue
      add(sign)
    }
  }
  for (const step of steps) {
    // a wait with no version said is no sign: no number is made up
    if (!waits(step) || step.there === '') continue
    if (isPane(step)) {
      const sign: Sign = { noun: 'pane', name: 'pane', version: step.there, page: '', runs: true }
      if (!isSettled(settled, sign)) add(sign)
    } else if (step.noun === 'disc' && step.name !== '') {
      const sign: Sign = { noun: 'disc', name: step.name, version: step.there, page: '', runs: true }
      if (!isSettled(settled, sign)) add(sign)
    } else if (step.noun === 'sandoq') add({ noun: 'sandoq', name: 'sandoq', version: step.there, page: '', runs: true })
  }
  return signs
}

const namesOf = (names: string[]): string =>
  names.length <= 3 ? (names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`) : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`

// The words of one sign or of several: `room-seat 2026.10.14 is ready.`, `2 updates are ready: pane, room-seat.`.
export const readyOf = (signs: Sign[]): string =>
  signs.length === 1 ? `${signs[0]!.name} ${signs[0]!.version} is ready.` : `${signs.length} updates are ready: ${namesOf(signs.map(sign => sign.name))}.`

// The words of one sign: its name and its version, the name alone when no version was read (a press of a card that made no check).
export const wordOf = (sign: Sign): string => (sign.version === '' ? sign.name : `${sign.name} ${sign.version}`)

// What the band says it is `in` or `did not go in`, from the signs the press was made for.
export const labelOf = (signs: Sign[]): string => (signs.length === 1 ? wordOf(signs[0]!) : namesOf(signs.map(sign => sign.name)))

// How a press ended, in the register's memory until OK or Try again: `done` (exit 0), `failed` (a code that is not 0, with sandoq's own
// line), `unknown` (no code: the pane does not know whether it went in).
export type Outcome = { kind: 'done' | 'failed' | 'unknown'; signs: Sign[]; line: string; after: string }

// A step read as the run printed it: sandoq's own sentence (`line`), done or not.
export type Done = { line: string; ok: boolean }

export type Stage = 'ready' | 'updating' | 'done' | 'failed'

// The band at the top of the card, as the views draw it. `steps` are the lines of the run read so far (each is a step sandoq printed, so
// each is done), `newest` is the last of its `progress:` lines, and no bar stands: sandoq gives no fraction.
export type Band = {
  stage: Stage
  title: string
  words: string
  steps: Done[]
  newest: string
  note: string
  page: string
  update: boolean
}

export const UPDATING_NOTE = 'The pane cannot stop a running update: no Cancel.'

export type FlowIn = {
  signs: Sign[]
  skipped: Sign[]
  running: { signs: Sign[]; steps: Done[]; newest: string } | undefined
  outcome: Outcome | undefined
}

export type Flow = {
  band?: Band
  // The sign in the bar: `1 update`, `2 updates`, `updating`, or none.
  word: string
  // The dot on Settings in the dock: an update waits (skipped ones too), one runs, or the last one failed.
  dot: boolean
  // What Not now set aside: its words (`room-seat 2026.10.14`) and whether the pane has a press for it. The Versions card keeps them on its list.
  skipped: { label: string; runs: boolean }[]
}

const countWord = (count: number): string => (count === 1 ? '1 update' : `${count} updates`)

export function flowOf({ signs, skipped, running, outcome }: FlowIn): Flow {
  const flow = flowAt({ signs, skipped, running, outcome })
  return { ...flow, skipped: skipped.map(sign => ({ label: wordOf(sign), runs: sign.runs })) }
}

function flowAt({ signs, skipped, running, outcome }: FlowIn): Omit<Flow, 'skipped'> {
  const set = skipped.map(signKey)
  const pending = signs.filter(sign => !set.includes(signKey(sign)))
  const page = (list: Sign[]): string => {
    const pages = [...new Set(list.map(sign => sign.page).filter(one => one !== ''))]
    return list.every(sign => sign.page !== '') && pages.length === 1 ? pages[0]! : ''
  }
  if (running !== undefined) {
    return {
      band: { stage: 'updating', title: 'Updating', words: `· ${labelOf(running.signs)}`, steps: running.steps, newest: running.newest, note: UPDATING_NOTE, page: '', update: false },
      word: 'updating',
      dot: true,
    }
  }
  if (outcome !== undefined) {
    const failed = outcome.kind !== 'done'
    const band: Band =
      outcome.kind === 'done'
        ? { stage: 'done', title: 'Done', words: `· ${labelOf(outcome.signs)} is in.`, steps: [], newest: '', note: outcome.after, page: page(outcome.signs), update: false }
        : outcome.kind === 'failed'
          ? { stage: 'failed', title: 'Not updated', words: `· ${labelOf(outcome.signs)} did not go in.`, steps: [], newest: '', note: outcome.line, page: '', update: true }
          : { stage: 'failed', title: 'Not known', words: `· the pane does not know whether ${labelOf(outcome.signs)} went in.`, steps: [], newest: '', note: outcome.line, page: '', update: true }
    return { band, word: failed && pending.length > 0 ? countWord(pending.length) : '', dot: failed || pending.length > 0 || skipped.length > 0 }
  }
  if (pending.length > 0) {
    return {
      band: { stage: 'ready', title: 'Waits for you', words: `· ${readyOf(pending)}`, steps: [], newest: '', note: '', page: page(pending), update: pending.some(sign => sign.runs) },
      word: countWord(pending.length),
      dot: true,
    }
  }
  return { word: '', dot: signs.length > 0 || skipped.length > 0 }
}
