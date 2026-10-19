// NUDGE on the pane (order nudge pane, pane 0.8.74): a seat, on, is woken at an interval; the schedule lives on the disc (the serve's cron plugin), so the
// pane holds no timer and no clock. Pure: the json of the verb in, the words the bar and Settings say out. The pane calls the verb (hooks/host.ts has its
// argv) and reads its state with its other reads: on open, a press and a wake, never on a timer.
import { clockOf } from './shelffiles.ts'

// The intervals the verb takes, and the one it is turned on at first (the Settings interval, when none was picked).
export const NUDGE_EVERY: readonly string[] = ['30m', '1h', '2h', '4h', '8h']
export const NUDGE_FIRST = '1h'

// The words of the feature by language: a language we add adds one row. Until the pane has a language setting, Settings heads the section with both.
export const NUDGE_WORDS: Readonly<Record<string, string>> = { en: 'Nudge', fa: 'هل بده' }
export const NUDGE_WORD = NUDGE_WORDS.en
export const NUDGE_HEAD = `${NUDGE_WORDS.en} · ${NUDGE_WORDS.fa}`
export const NUDGE_OLDER = 'Nudge needs a newer sandoq'

// What the verb prints with --json, one object, the same in the world and in a room. The two times are '' when the verb gave none.
export type NudgeRead = { seat: string; on: boolean; every: string; fires: number; last: string; next: string }

const EVERY_FORM = /^\d+[smhd]$/

// The state from the verb's output: one json object of the shape above, else none (a line that is not it, a field of another kind).
export function parseNudge(out: string): NudgeRead | undefined {
  let one: unknown
  try {
    one = JSON.parse(out.trim())
  } catch {
    return undefined
  }
  if (one === null || typeof one !== 'object' || Array.isArray(one)) return undefined
  const { seat, on, every, fires, last, next } = one as Record<string, unknown>
  const timeOrNone = (value: unknown): string | undefined => (value === null || value === undefined ? '' : typeof value === 'string' ? value : typeof value === 'number' ? String(value) : undefined)
  const lastText = timeOrNone(last)
  const nextText = timeOrNone(next)
  if (typeof seat !== 'string' || typeof on !== 'boolean' || lastText === undefined || nextText === undefined) return undefined
  if (every !== null && every !== undefined && (typeof every !== 'string' || !EVERY_FORM.test(every))) return undefined
  if (typeof fires !== 'number' || !Number.isFinite(fires) || fires < 0) return undefined
  return { seat, on, every: typeof every === 'string' ? every : '', fires: Math.floor(fires), last: lastText, next: nextText }
}

// A time of the verb as a clock, HH:MM in the pane's zone (minutes from UTC): an ISO time with its zone, or epoch seconds or milliseconds; any other
// text is shown as the verb gave it (its clock, cut), for the pane does not guess a form it does not know.
export function nudgeTime(text: string, zone = 0): string {
  const given = text.trim()
  if (given === '') return ''
  if (/^\d{9,13}$/.test(given)) return clockOf(given.length > 10 ? Number(given) : Number(given) * 1000, zone)
  if (/^\d{4}-\d\d-\d\dT[\d:.]+(Z|[+-]\d\d:?\d\d)$/.test(given)) {
    const ms = Date.parse(given)
    if (!Number.isNaN(ms)) return clockOf(ms, zone)
  }
  const clock = /\b(\d{1,2}:\d\d)\b/.exec(given)
  return clock === null ? given.slice(0, 16) : clock[1]
}

// The card of the Nudge, as the register hands it to the bar and to Settings. `seat` is the seat Nudge wakes ('' for a pane with no seat: no toggle),
// `can` whether a road to the verb stands (a room found with its sandoq, or the world's cli), `read` what the last read of the verb gave (none before
// a read: a read that fails leaves the last state), `picked` the interval of Settings (the one a press of the toggle turns it on at), `line` the verb's
// own line of a refusal ('' for none), `older` whether the sandoq has no `room nudge`, and `busy` whether a call is out.
export type NudgeCard = { seat: string; can: boolean; read: NudgeRead | undefined; picked: string; line: string; older: boolean; busy: boolean }

// The toggle is drawn for a pane with a seat and a road to the verb.
export const nudgeShown = (card: NudgeCard | undefined): card is NudgeCard => card !== undefined && card.seat !== '' && card.can

// The word of the state in Settings: on, off, or none before a read.
export const nudgeState = (card: NudgeCard | undefined): string => (card === undefined || card.read === undefined ? '' : card.read.on ? 'on' : 'off')

// The label of the bar's toggle, without the key: off "Nudge off", on "● Nudge 1h"; a sandoq without the verb says so.
export const nudgeLabel = (card: NudgeCard): string => (card.older ? NUDGE_OLDER : card.read?.on === true ? `● ${NUDGE_WORD} ${card.read.every}` : `${NUDGE_WORD} off`)

// The interval that is lit in Settings: the one it runs at while on, else the one picked for the next turn on.
export const nudgeLit = (card: NudgeCard): string => (card.read?.on === true && NUDGE_EVERY.includes(card.read.every) ? card.read.every : card.picked)

// "fired N times, last TIME" (none yet: "not fired yet").
export function nudgeFired(read: NudgeRead, zone = 0): string {
  const last = nudgeTime(read.last, zone)
  if (read.fires === 0) return last === '' ? 'not fired yet' : `not fired yet, last ${last}`
  return `fired ${read.fires} ${read.fires === 1 ? 'time' : 'times'}${last === '' ? '' : `, last ${last}`}`
}

// The refusal of the verb in one line: the last non-empty line of its error, else its code. A sandoq without `room nudge` answers exit 2 and the usage line
// of the noun, whose verbs hold no `nudge`: that is the older sandoq, not a refusal of the verb. The words of the usage line are split on bars whatever
// they hold (the verbs have hyphens, as seat-add), and the list of verbs is never named here.
export function nudgeWhy(code: number | undefined, err: string): { line: string; older: boolean } {
  const lines = err.split('\n').map(line => line.trim()).filter(line => line !== '')
  const usage = lines.map(line => /^usage: sandoq room (\S+)/.exec(line)).find(found => found !== null)
  if (code === 2 && usage !== undefined && usage !== null && !usage[1].split('|').includes('nudge')) return { line: NUDGE_OLDER, older: true }
  return { line: lines[lines.length - 1] ?? `nudge exited ${code ?? 'with no code'}`, older: false }
}
