// The size of a tree of the kit in cells (order D1, A2 S4): how many rows and how wide a Box, a Text or a control takes when it is laid out
// as the pane asks it, so a place knows whether it fits the canvas and pages when it does not. NOTHING SCROLLS, and the host does not
// tell the pane the rows a card takes, so the pane counts them here: a column stacks its children by its gap, a row sets them side by
// side by its column gap and wraps them when it is told to, a border and the padding take a cell a side, a Text wraps at its words, a
// Button is its label alone on one row in the app (the terminal's is below). It is an estimate of the kit's flex in cells, not the app's own drawing:
// the eye in the app is the last proof. It imports no view and no host module but the sizes of the press box in views/theme.ts; a kit's parts are
// named by the `ui` it is given (the app's own components, or the strings of the test kit).
import { CELL } from './space'
import { PRESS, isPressBox } from './theme'

export type Size = { w: number; h: number }

// The names of the parts of a kit, by the kit's own: `Box`, `Text`, `Button`, `Select`, `Input`, `Svg`, `Markdown`. The app's parts are components the
// kit gives; a kit whose parts have run already (the test kit's) leaves the element with the part's name as its type. `terminal` says the kit is the
// terminal's (asTerminal), whose Buttons are counted as the host draws them.
export type Names = ((type: unknown) => string) & { terminal?: boolean }

const PARTS = ['Box', 'Text', 'Button', 'Select', 'Input', 'Svg', 'Markdown']

export function namesOf(ui: object): Names {
  const kit = ui as Record<string, unknown>
  const names: Names = type => PARTS.find(name => kit[name] === type) ?? (typeof type === 'string' ? (PARTS.find(name => name === type) ?? '') : '')
  names.terminal = kit.terminal === true
  return names
}

// THE BUTTON AS THE TERMINAL'S HOST DRAWS IT, counted in this one place: "[ label ]", the label and FOUR cells (the two brackets and a space inside
// each); a plain Button is its label alone, and one that holds a key has the keycap before it, "d: desk" (the key, a colon and a space). The app's
// Button is its own drawing and counts the label and two (sizeOf below). The pane marks the kit it draws the terminal with by asTerminal.
export const BUTTON_CELLS = 4
const KEYCAP_CELLS = 2
export const buttonCells = (label: string, plain = false, hotkey?: string): number =>
  label.length + (plain ? 0 : BUTTON_CELLS) + (typeof hotkey === 'string' && hotkey !== '' ? hotkey.length + KEYCAP_CELLS : 0)
export const asTerminal = <T extends object>(ui: T): T & { terminal: true } => ({ ...ui, terminal: true })

const isElement = (node: any): boolean => typeof node === 'object' && node !== null && 'type' in node

// The props and the children of an element, as the kit has them: the children are on the element or in its props.
export const propsOf = (node: any): any => node.props ?? {}
export const kidsOf = (node: any): any[] => {
  const children = node.children !== undefined ? node.children : propsOf(node).children
  return (Array.isArray(children) ? children.flat(Infinity) : [children]).filter(child => child !== false && child !== null && child !== undefined && child !== true)
}

const num = (value: unknown, fallback = 0): number => (typeof value === 'number' ? value : fallback)

const wordsOf = (node: any): string =>
  typeof node === 'string' || typeof node === 'number' ? String(node) : isElement(node) ? kidsOf(node).map(wordsOf).join('') : ''

// A text wrapped at its words to a width: its rows. A word wider than the width stands on a row of its own. A place that cuts a text by its
// rows (views/paged.tsx) takes them from here, so the rows it cuts are the rows the estimate counts.
export function wrapRows(words: string, max: number): string[] {
  const rows: string[] = []
  let line = ''
  for (const word of words.split(/\s+/).filter(part => part !== '')) {
    const next = line === '' ? word : `${line} ${word}`
    if (next.length <= max || line === '') line = next
    else {
      rows.push(line)
      line = word
    }
  }
  if (line !== '' || rows.length === 0) rows.push(line)
  return rows
}

// The rows of a text and the widest of them.
function textSize(words: string, max: number): Size {
  const rows = wrapRows(words, max)
  return { w: Math.max(...rows.map(row => row.length)), h: rows.length }
}

const stackSize = (sizes: Size[], gap: number): Size => {
  let h = 0
  for (const size of sizes) {
    if (h > 0) h += gap
    h += size.h
  }
  return { w: Math.max(0, ...sizes.map(size => size.w)), h }
}

// A row of children: each at its own width, in lines when it wraps, one line as high as its highest.
function rowSize(props: any, children: any[], inner: number, names: Names): Size {
  const colGap = num(props.columnGap ?? props.gap)
  const lineGap = num(props.rowGap ?? props.gap)
  const sizes = children.map(child => sizeOf(child, inner, names))
  const lines: Size[][] = []
  let line: Size[] = []
  let used = 0
  for (const size of sizes) {
    const want = size.w + (line.length > 0 ? colGap : 0)
    if (props.flexWrap === 'wrap' && line.length > 0 && used + want > inner) {
      lines.push(line)
      line = []
      used = 0
    }
    line.push(size)
    used += size.w + (line.length > 1 ? colGap : 0)
  }
  if (line.length > 0) lines.push(line)
  return stackSize(
    lines.map(members => ({ w: members.reduce((sum, size) => sum + size.w, 0) + colGap * (members.length - 1), h: Math.max(1, ...members.map(size => size.h)) })),
    lineGap,
  )
}

// The rows of a Markdown text: a line of the source wrapped at its words, an empty line one row. The kit's blocks (a heading, a list, a code
// fence) may take more, so this is the least; a place that must not clip adds its own slack.
function markdownSize(text: string, max: number): Size {
  const rows = text.split('\n').map(line => (line.trim() === '' ? { w: 0, h: 1 } : textSize(line.trim(), max)))
  return { w: Math.max(0, ...rows.map(row => row.w)), h: rows.reduce((sum, row) => sum + row.h, 0) }
}

// The cells of a node laid out in at most `max` columns.
export function sizeOf(node: any, max: number, names: Names): Size {
  if (typeof node === 'string' || typeof node === 'number') return textSize(String(node), max)
  if (!isElement(node)) return { w: 0, h: 0 }
  const props = propsOf(node)
  const kind = names(node.type)
  if (kind === 'Text') {
    const words = wordsOf(node)
    // a Text that truncates (wrap truncate, truncate-end...) is ONE row, however long its words, and as wide as its words or the room
    if (typeof props.wrap === 'string' && props.wrap.startsWith('truncate')) return { w: Math.min(words.length, max), h: 1 }
    return textSize(words, max)
  }
  if (kind === 'Button') {
    const label = String(props.label ?? wordsOf(node))
    if (names.terminal === true) return { w: buttonCells(label, props.plain === true, props.hotkey), h: 1 }
    return { w: props.plain ? label.length : label.length + 2, h: 1 }
  }
  if (kind === 'Markdown') return typeof props.text === 'string' ? markdownSize(props.text, max) : { w: 0, h: 0 }
  if (kind === 'Select') return { w: `[${props.value ?? ''} ▾]`.length, h: 1 }
  if (kind === 'Input') return { w: max, h: 1 }
  // a picture is its pixels over the cell of the app (the pair that sizes the scene); a size that is no number is none, as before
  if (kind === 'Svg') return Number.isFinite(props.width) && Number.isFinite(props.height) ? { w: Math.ceil(props.width / CELL.width), h: Math.ceil(props.height / CELL.height) } : { w: 0, h: 0 }
  if (kind !== 'Box') return { w: 0, h: 0 }
  const border = props.borderStyle ? 1 : 0
  const padX = num(props.paddingX ?? props.padding)
  const padY = num(props.paddingY ?? props.padding)
  const outer = typeof props.width === 'number' ? props.width : max
  const inner = outer - 2 * border - 2 * padX
  const children = kidsOf(node)
  const body =
    props.flexDirection === 'row'
      ? rowSize(props, children, inner, names)
      : stackSize(
          children.map(child => sizeOf(child, inner, names)),
          num(props.rowGap ?? props.gap),
        )
  // the edge of a card is a row a side; the edge of a press box (order DP) adds one row in all; a `height` is the least rows of a box that is no
  // press box (the kit keeps it: a row of the room cards set to 2 rows, a cell of the dock to 3), so a box that is taller keeps its own
  const high = body.h + 2 * padY + (isPressBox(node) ? PRESS.edgeRows : 2 * border)
  return { w: typeof props.width === 'number' ? props.width : body.w + 2 * border + 2 * padX, h: isPressBox(node) ? high : Math.max(high, num(props.height)) }
}
