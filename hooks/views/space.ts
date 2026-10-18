// The app's spacing, in cells, in ONE place: no gap and no padding of the app branch is a bare number. A cell is 8.4
// px across and 19 down; the design system's scale is 4, 8, 16, 24 and 32 px (docs/design/system), so across 1 cell is the
// 8 px step, 2 cells the 16, 3 the 24 and 4 the 32, and down 1 row is the 16 px step (19 px) and 2 rows the 32 (38 px).
// Inside a block the steps are the smaller ones; between two blocks one step more. This file imports nothing, so a view
// and the pane may both read it with no cycle.
export const SPACE = {
  // across
  near: 1, // 8 px: a dot and its words, a word and the next on a line
  control: 2, // 16 px: two controls on a row (never touching), the side padding of a block
  group: 4, // 32 px: one group of controls from the next on a row
  // the side padding of a window's body and of the floating bar's ends (24 px), a step over `control`
  inset: 3,
  // down
  line: 1, // 16 px: a block's title and its body, the padding above and below a block, the head's two rows
  block: 2, // 32 px: one block from the next
}

// A cell of the app, in pixels: 8.4 across and about 20.3 down (one measure in the app, 69 cells drew 580 px and
// 29 rows 590 px; the eye confirms). ONE named pair, held where the scene is sized (model/scene.ts, which imports only the dock's rows of
// model/dock.ts, a file that imports nothing, so the views read it from here with no cycle): the wallpaper is sized by it, so it meets the pane's foot.
export { CELL } from '../model/scene'

// The layout of the canvas by the pane's columns C (one function): the width of one column of cards, how many columns
// the canvas holds, whether the picture's own window stands beside (from 80), and whether the acts of a card stack (under 48).
//   under 48     one column of C less 4 (least 36; clamped to C less 2 under 40), the acts stack
//   48 to 79     one column of C less 4, most 72
//   80 to 127    one column of C less 30 (the picture's window stands beside it), most 72
//   128 and up   two columns, each half of C less 34, most 56
export const BREAK_STACK = 48
export const BREAK_WINDOW = 80
export const BREAK_TWO = 128
const COLUMN_MOST = 72
const COLUMN_TWO_MOST = 56
const COLUMN_LEAST = 36
const BREAK_CLAMP = 40
const EDGE = 2
const GAP = 4
const WINDOW = 22

export type Plan = { cols: 1 | 2; width: number; window: boolean; stack: boolean }

export function layout(columns: number): Plan {
  if (columns >= BREAK_TWO) return { cols: 2, width: Math.min(COLUMN_TWO_MOST, Math.floor((columns - (EDGE + GAP + GAP + WINDOW + EDGE)) / 2)), window: true, stack: false }
  if (columns >= BREAK_WINDOW) return { cols: 1, width: Math.max(COLUMN_LEAST, Math.min(COLUMN_MOST, columns - (EDGE + GAP + WINDOW + EDGE))), window: true, stack: false }
  const one = Math.max(COLUMN_LEAST, Math.min(COLUMN_MOST, columns - 2 * EDGE))
  return { cols: 1, width: columns < BREAK_CLAMP ? Math.min(one, columns - EDGE) : one, window: false, stack: columns < BREAK_STACK }
}

// The width of the whole canvas: one column, or the two columns of a plan with the gap between them (the layout's own GAP, the step
// `group` of SPACE). A list stands in the first column and its open row in the second; never a third.
export const canvasWidthOf = (plan: Plan): number => (plan.cols === 2 ? 2 * plan.width + SPACE.group : plan.width)

// The width, in cells, of the column the cards stand in: in the app the place's layer, 56 or the body less the scene's
// margin when narrower. The pane tells the views that draw a card in it as a prop `width`.
export const LAYER_MAX = 56
export const layerWidth = (bodyColumns: number): number => Math.min(LAYER_MAX, bodyColumns - 4)
