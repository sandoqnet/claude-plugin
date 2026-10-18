// The words of the two tools by which a seat drives its pane and reads it (order A-M12): the actions, their values, the refusals
// in one line each, the width, and the theme. Pure: no host. The register does what a click does; this file only says it.

export const ACTIONS = ['open', 'close', 'lens', 'place', 'card', 'yours', 'theme', 'width'] as const
export type Action = (typeof ACTIONS)[number]

// The places of the dock (order D1) by their names, `desk` (his desk, where the pane opens; order DESK), `letters` (this seat's face, which stands
// under the desk), `room` (the Room place, under Operator), `back` (a step back to this seat's letters) and `rest` (no window open).
export const PLACES = ['desk', 'letters', 'seats', 'shelf', 'answered', 'settings', 'room', 'back', 'rest'] as const
export type Place = (typeof PLACES)[number]

export const THEMES = ['light', 'dark', 'auto'] as const
export type ThemeAsk = (typeof THEMES)[number]

// The least width the pane can be laid out at: under it the column and the head have no room.
export const MIN_COLUMNS = 20

export const TOOL = 'room_pane_do'

const listed = (words: readonly string[]): string => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} or ${words.at(-1)}`)

// A refusal: one line, with the right words.
export const noAction = (word: string): string =>
  `${TOOL}: ${word === '' ? 'no action given' : `no action "${word}"`}; the actions are ${ACTIONS.join(', ')}`
export const noValue = (action: Action, word: string, right: readonly string[]): string =>
  `${TOOL}: ${action} takes ${listed(right)}${word === '' ? ', none was given' : `, not "${word}"`}`

export const isAction = (word: string): word is Action => (ACTIONS as readonly string[]).includes(word)
export const isIn = <T extends string>(list: readonly T[], word: string): word is T => (list as readonly string[]).includes(word)

// The width: a count of columns or `auto` (0). A count over the real width, under the least, or none is refused in one line.
export function widthOf(word: string, real: number): { columns: number } | { refused: string } {
  const said = word.trim().toLowerCase()
  if (said === 'auto') return { columns: 0 }
  if (real <= 0) return { refused: `${TOOL}: width needs a pane that is drawn: open it first` }
  if (!/^\d+$/.test(said)) return { refused: `${TOOL}: width takes a count of columns (${MIN_COLUMNS} to ${real}) or auto, ${said === '' ? 'none was given' : `not "${word.trim()}"`}` }
  const columns = Number(said)
  if (columns > real) return { refused: `${TOOL}: width ${columns} is over the width of the pane, ${real} columns` }
  if (columns < MIN_COLUMNS) return { refused: `${TOOL}: width ${columns} is under the least, ${MIN_COLUMNS} columns` }
  return { columns }
}

// What the kit says of the person's theme: `light` or `dark` when a field of the render says so, else `unknown`. The render this
// host gives carries none (its fields are plugin, component, requestId, surface, viewport and props, and `$.ui` has no theme call),
// so this reads `unknown` there.
export type KitTheme = 'light' | 'dark' | 'unknown'
export function kitThemeOf(render: any): KitTheme {
  for (const word of [render?.theme, render?.props?.theme, render?.colorScheme, render?.props?.colorScheme]) {
    if (word === 'light' || word === 'dark') return word
  }
  return 'unknown'
}

// The theme line of the read: the theme and where it comes from. The pane draws one dark glass for now, whatever is asked.
export function themeWords(kit: KitTheme, asked: ThemeAsk): string {
  const glass = 'the pane draws its one dark glass'
  if (asked !== 'auto') return `${asked} (asked with ${TOOL}; ${glass}; the kit says ${kit === 'unknown' ? 'nothing' : kit})`
  return kit === 'unknown' ? `unknown (the kit says nothing; ${glass})` : `${kit} (from the kit; ${glass})`
}
