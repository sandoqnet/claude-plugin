// The dock of the app's place (order D2, still F1): ONE function says its rows and its cells from the columns, and each thing that
// hangs on the dock's top (the wallpaper's floor, the canvas's foot, the read tool's lines) reads it. Pure: no host.
//
// The dock floats a row above the pane's foot: its body is the border and the cells, and the foot is the body and that row. From 70
// columns the four places are picture tiles, a cell 6 across and 3 rows high (a body of 5 rows). Under 70, or where no picture can be
// drawn, they are four words: in one row where the four slots and the gaps fit what the body leaves, else two rows of two. A word's
// cell is 3 rows high in one row of words (the word on the middle row, the rule under it) and 2 in two rows, so the body is 5 rows
// and 6, the foot 6 and 7. Desk and Seats are counted as wide as their name and a count of two digits (`Desk 9+`) whether a
// count shows or not, so THE FOOT NEVER CHANGES HEIGHT WITH A WAIT. The Shelf's mark of what is new on it (order T4a) says `Shelf 2 new` in
// the words only where the dock has the columns spare for it with the same rows; elsewhere the word is `Shelf` and the tile's picture and
// tip say it. It is never a count of the tray or a badge.

// The four places, in the dock's order (order DESK, D2: the first is the Desk, where the pane opens). Answered and Letters have none of their own:
// they stand under the desk's list and in its Letters pile.
export const DOCK_PLACES = ['desk', 'seats', 'shelf', 'settings'] as const
export type DockSlot = (typeof DOCK_PLACES)[number]

// The names of the places in the dock's words.
export const DOCK_NAMES: Record<DockSlot, string> = { desk: 'Desk', seats: 'Seats', shelf: 'Shelf', settings: 'Settings' }

// The word of a place with its count: the count above 9 says 9+, none at zero. The Shelf counts what is new on it (order T4a), `Shelf 2 new`,
// and only where the dock said it has the room (`shelfNew` of dockOf): else it is `Shelf` alone.
export const dockWord = (place: DockSlot, count: number, shelfNew = false): string => {
  const shown = count > 9 ? '9+' : count
  if (place === 'shelf') return shelfNew && count > 0 ? `${DOCK_NAMES.shelf} ${shown} new` : DOCK_NAMES.shelf
  return `${DOCK_NAMES[place]}${count > 0 ? ` ${shown}` : ''}`
}

// A cell of air after each word's slot: the app draws the dock's border inside the box and pads it (views/frame.tsx BAR notes), and a name drawn
// as wide as its cell was seen cut (`Sh…` at 57 columns, pane 0.8.19). A word is never cut for a cell it fills: it has this cell to spare.
const WORD_SLACK = 1

// A word's slot, in cells: its name, and for the two places that count a cell of air and two digits, whether a count shows or not, and the
// cell to spare.
const slotOf = (place: DockSlot): number => (place === 'desk' || place === 'seats' ? `${DOCK_NAMES[place]} 9+`.length : DOCK_NAMES[place].length) + WORD_SLACK

// The pane's edge each side (views/frame.tsx EDGE), the dock's border, its padding each side (views/space.ts SPACE.control and SPACE.near)
// and the gaps between cells; a test holds them equal to the views' own.
const EDGE = 2
const BORDER = 2
const WORD_PADDING = 2
const TILE_PADDING = 1
const WORD_GAP = 2
const TILE_GAP = 3
export const TILE_CELL = 6
export const TILE_ROWS = 3
export const TILES_FROM = 70
// The rows of a word's cell: 3 in one row of words (61 px), 2 in two rows (41 px), so the stacked body stays 6 rows.
const WORD_ROWS_ONE = 3
const WORD_ROWS_TWO = 2

// The cells the Shelf's word takes for ` 9+ new` (order T4a): kept only into columns the dock has spare, never at the cost of a row or of
// a name of the four.
const SHELF_NEW_MORE = ' 9+ new'.length

export type Dock = {
  tiles: boolean
  // Whether the Shelf's word says ` N new` (the mark is there and the dock had the room): the tiles say it in their picture, never here.
  shelfNew: boolean
  // The body's rows (the border and the cells) and the foot's (the body and the row under it).
  body: number
  foot: number
  // The width of the dock and its left, in cells.
  width: number
  left: number
  // The words: in one row or two, the rows of a word's cell, and the width of each cell (four slots in one row, two columns in two).
  wordRows: 1 | 2
  wordH: number
  cells: number[]
  gap: number
}

// The dock at these columns; `tiles` says whether the pane draws the tiles (a surface with a picture, the switch on). From 70 columns
// alone: under it the words stand whatever `tiles` says.
export function dockOf(columns: number, tiles: boolean, shelfNew = false): Dock {
  if (tiles && columns >= TILES_FROM) {
    const width = BORDER + 2 * TILE_PADDING + DOCK_PLACES.length * TILE_CELL + (DOCK_PLACES.length - 1) * TILE_GAP
    return { tiles: true, shelfNew: false, body: BORDER + TILE_ROWS, foot: BORDER + TILE_ROWS + 1, width, left: Math.floor((columns - width) / 2), wordRows: 1, wordH: TILE_ROWS, cells: DOCK_PLACES.map(() => TILE_CELL), gap: TILE_GAP }
  }
  const plain = wordsOf(columns, 0)
  if (!shelfNew) return plain.dock
  // The Shelf's slot grows by its mark only where the same rows stand and the whole dock is inside the pane's edges: the four names are
  // whole from the least width first, and the foot never changes with the mark.
  const wide = wordsOf(columns, SHELF_NEW_MORE)
  return wide.whole && wide.dock.wordRows === plain.dock.wordRows ? { ...wide.dock, shelfNew: true } : plain.dock
}

// The four words with the Shelf's slot `more` cells wider; `whole` says the cells stand inside the pane as they are (a row of words that
// fits, or two columns that do not need the pane's width cut).
function wordsOf(columns: number, more: number): { dock: Dock; whole: boolean } {
  const slots = DOCK_PLACES.map(place => slotOf(place) + (place === 'shelf' ? more : 0))
  const inner = columns - 2 * EDGE - BORDER - 2 * WORD_PADDING
  const row = slots.reduce((sum, n) => sum + n, 0) + WORD_GAP * (slots.length - 1)
  if (row <= inner) {
    const width = row + BORDER + 2 * WORD_PADDING
    return { whole: true, dock: { tiles: false, shelfNew: false, body: BORDER + WORD_ROWS_ONE, foot: BORDER + WORD_ROWS_ONE + 1, width, left: Math.floor((columns - width) / 2), wordRows: 1, wordH: WORD_ROWS_ONE, cells: slots, gap: WORD_GAP } }
  }
  const across = [Math.max(slots[0], slots[2]), Math.max(slots[1], slots[3])]
  const wanted = across[0] + WORD_GAP + across[1] + BORDER + 2 * WORD_PADDING
  const width = Math.min(columns - 2 * EDGE, wanted)
  return {
    whole: wanted <= columns - 2 * EDGE,
    dock: {
      tiles: false,
      shelfNew: false,
      body: BORDER + 2 * WORD_ROWS_TWO,
      foot: BORDER + 2 * WORD_ROWS_TWO + 1,
      width,
      left: Math.floor((columns - width) / 2),
      wordRows: 2,
      wordH: WORD_ROWS_TWO,
      cells: [across[0], across[1], across[0], across[1]],
      gap: WORD_GAP,
    },
  }
}

// The foot's rows at these columns: what the wallpaper's floor and the canvas's foot keep over the pane's foot. The same with the tiles
// and with the words, so it needs no switch.
export const dockFootOf = (columns: number): number => dockOf(columns, false).foot
