// The board of the Royal Game of Ur as one picture (order UR, cut U3): twenty squares in three rows of eight, drawn as the source of an Svg for the
// app. Pure: it imports the pair that sizes the scene, the shape of a board and the type of the tones, and nothing else. Run by `node` too: `.ts` in imports.
//
// The rows: THEIRS on top, the SHARED row of eight in the middle, HIS at the bottom. A side's path (programs/ur/seat.md) is 1 to 4 on its own row
// from its column 3 to its column 0, 5 to 12 along the shared row from column 0 to column 7, 13 and 14 on its own row at columns 7 and 6; the
// columns 4 and 5 of its own row are no squares. The rosettes of a path stand at 4, 8 and 14, five on the board (a side's 4th square and its last,
// the shared row's 4th). Square 0 waits and 15 is off: they are no squares, only counts beside the board.
//
// THE PLATE: the pane cannot read the theme of the app, so the picture is drawn on a ground of its own, and its words stand on that ground. The
// colors are the hour's tones the room already uses (model/tones.ts, handed down as the bar and the dock take them), made by plateOf: the plate is
// the deep made ground, the squares and the shared row a step toward the text tone, the rosettes the accent, his pieces the text tone, theirs the
// ok tone. Each holds 4.5 or more against the ground it stands on at each of the four hours (tests/ur-tones.test.ts).
//
// THE MOTION (order MOTION): given the move of the newest board (motionOf of model/ur.ts), the piece that moved goes once from its old square to its
// new one in half a second, a CSS animation in the style of the Svg's own source; a piece that went off or was taken goes toward the counts and
// fades. No move, a pass and a win draw the board with no animation in it.
import { CELL } from './scene.ts'
import type { Tones } from './tones.ts'
import type { Board, Motion } from './ur.ts'

export const BOARD_COLUMNS = 8
export const BOARD_ROWS = 3
export const ROSETTES = [4, 8, 14]
export const SHARED = { from: 5, to: 12 }

// The colors of the picture. `edge` is the thin ring round a piece and a dot, on the deep side of the ground.
export type Plate = { ground: string; square: string; shared: string; rosette: string; you: string; them: string; edge: string; ink: string }

const channels = (hex: string): number[] => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
// A color `part` of the way from `from` to `to`, as a six-digit hex.
const blend = (from: string, to: string, part: number): string => {
  const [a, b] = [channels(from), channels(to)]
  return `#${a.map((c, i) => Math.round(c + (b[i] - c) * part).toString(16).padStart(2, '0')).join('')}`
}

// The plate of an hour's tones.
export const plateOf = (tones: Tones): Plate => ({
  ground: tones.solid,
  square: blend(tones.solid, tones.text, 0.08),
  shared: blend(tones.solid, tones.text, 0.14),
  rosette: tones.accent,
  you: tones.text,
  them: tones.ok,
  edge: blend(tones.solid, '#000000', 0.5),
  ink: tones.text,
})

// The pixels of the picture: the margin round the board, the most and the least a square is across, and the widths of the board and of the counts
// beside it in squares. A picture whose square would be under the least is none (the window draws the text rows).
const MARGIN = 4
const SQUARE_MOST = 34
const SQUARE_LEAST = 14
const COUNTS_WIDE = 3
// The size of the words beside the board, in pixels: a third of a square, never under FONT_LEAST (the counts stay readable at the smallest square)
const FONT_LEAST = 10
const FONT_MOST = 13
// How long the piece of a move takes to go from its old square to its new one, in seconds (order MOTION).
const MOTION_SECONDS = 0.5

export type Picture = { source: string; width: number; height: number }
export type Square = { row: number; col: number }

// The square of a step of a side's path, or none for 0, 15 and a number that is no step. `you` is the bottom row, any other side the top.
export function squareOf(side: 'you' | 'them', step: number): Square | undefined {
  const own = side === 'you' ? BOARD_ROWS - 1 : 0
  if (!Number.isInteger(step) || step < 1 || step > 14) return undefined
  if (step <= 4) return { row: own, col: 4 - step }
  if (step <= SHARED.to) return { row: 1, col: step - SHARED.from }
  return { row: own, col: 20 - step }
}

// All twenty squares of the board, row by row, each with whether it is a rosette and whether it is on the shared row.
export function squaresOf(): (Square & { rosette: boolean; shared: boolean })[] {
  const out: (Square & { rosette: boolean; shared: boolean })[] = []
  for (const side of ['them', 'you'] as const) {
    for (let step = 1; step <= 14; step++) {
      if (step >= SHARED.from && step <= SHARED.to) continue
      const at = squareOf(side, step)!
      out.push({ ...at, rosette: ROSETTES.includes(step), shared: false })
    }
  }
  for (let step = SHARED.from; step <= SHARED.to; step++) out.push({ ...squareOf('you', step)!, rosette: ROSETTES.includes(step), shared: true })
  return out.sort((a, b) => a.row - b.row || a.col - b.col)
}

const count = (squares: number[], at: number): number => squares.filter(square => square === at).length

// The side of a square in pixels for a picture `inner` cells wide, at the most `most`; none when it would be under the least.
export function squareAcross(inner: number, most = SQUARE_MOST): number | undefined {
  const wide = Math.floor(inner * CELL.width)
  const across = Math.min(most, Math.floor((wide - 3 * MARGIN) / (BOARD_COLUMNS + COUNTS_WIDE)))
  return across >= SQUARE_LEAST ? across : undefined
}

// The rows of the app's canvas a picture takes: its height over the row of the app.
export const pictureRows = (picture: Picture): number => Math.ceil(picture.height / CELL.height)

// The board as a picture `inner` cells wide (the width is never past it), the squares at the most `most` across. Pieces stand on the squares of
// each side's path; the waiting and the off of each side are counted beside the board on that side's own row.
export function boardPicture(board: Board, inner: number, plate: Plate, most = SQUARE_MOST, lean = false, motion?: Motion): Picture | undefined {
  const s = squareAcross(inner, most)
  if (s === undefined) return undefined
  const width = Math.floor(inner * CELL.width)
  // the words beside the board: a block of three lines for each side (two when `lean`, with no line for the name: the dot's color says it), as
  // high as the lines are, so the picture is as high as two blocks when the board is lower than that; the board stands in the middle of the height
  const fontSize = Math.max(FONT_LEAST, Math.min(FONT_MOST, Math.round(s * 0.38)))
  const block = Math.round(fontSize * (lean ? 2.7 : 3.7))
  const inside = Math.max(BOARD_ROWS * s, 2 * block + MARGIN)
  const height = inside + 2 * MARGIN
  const lift = Math.floor((inside - BOARD_ROWS * s) / 2)
  const x = (col: number): number => MARGIN + col * s
  const y = (row: number): number => MARGIN + lift + row * s
  // the counts' dot of a side is where a piece comes from when it enters and goes to when it is off or taken; a square is where a step stands
  const left = x(BOARD_COLUMNS) + MARGIN
  const topOf = (side: 'you' | 'them'): number => (side === 'you' ? height - MARGIN - block : MARGIN)
  const anchor = (side: 'you' | 'them', step: number): { x: number; y: number } => {
    const at = squareOf(side, step)
    return at === undefined ? { x: left + fontSize * 0.45, y: topOf(side) + fontSize * 0.55 } : { x: x(at.col) + s / 2, y: y(at.row) + s / 2 }
  }
  const shift = (side: 'you' | 'them', from: number, to: number): string => {
    const [a, b] = [anchor(side, from), anchor(side, to)]
    return `translate(${(b.x - a.x).toFixed(1)}px,${(b.y - a.y).toFixed(1)}px)`
  }
  const parts: string[] = [`<rect width="${width}" height="${height}" rx="6" fill="${plate.ground}"/>`]
  for (const square of squaresOf()) {
    parts.push(`<rect x="${x(square.col) + 1}" y="${y(square.row) + 1}" width="${s - 2}" height="${s - 2}" rx="3" fill="${square.shared ? plate.shared : plate.square}"/>`)
    if (square.rosette) {
      const cx = x(square.col) + s / 2
      const cy = y(square.row) + s / 2
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${(s * 0.3).toFixed(1)}" fill="none" stroke="${plate.rosette}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${(s * 0.09).toFixed(1)}" fill="${plate.rosette}"/>`)
    }
  }
  // The motion of the newest move (order MOTION), as the source says it: the piece that moved comes once from its old square (or the dot of its
  // counts, when it entered) to its new one, and a piece that went off the board or was taken is drawn once more where it stood, goes toward the dot
  // of its counts and fades out; it stands at no opacity, so a viewer with no animation sees the board as it is. The ghost has its stroke before
  // its fill, so it is no piece of the board to a count of pieces. A viewer set to reduced motion sees none.
  const radius = (s * 0.32).toFixed(1)
  const sides = ['them', 'you'] as const
  let came = ''
  let gone = ''
  if (motion !== undefined) {
    const other = motion.side === 'you' ? 'them' : 'you'
    const ghost = (side: 'you' | 'them', from: number, to: number) => {
      const at = anchor(side, from)
      gone = `@keyframes ur-gone{from{opacity:1;transform:translate(0px,0px)}to{opacity:0;transform:${shift(side, from, to)}}}`
      parts.push(`<circle cx="${at.x}" cy="${at.y}" r="${radius}" stroke="${plate.edge}" stroke-width="2" fill="${plate[side]}" opacity="0" class="ur-gone" style="animation:ur-gone ${MOTION_SECONDS}s ease-in"/>`)
    }
    if (motion.to >= 1 && motion.to <= 14) came = `@keyframes ur-came{from{transform:${shift(motion.side, motion.to, motion.from)}}to{transform:translate(0px,0px)}}`
    else if (motion.to === 15 && motion.from >= 1 && motion.from <= 14) ghost(motion.side, motion.from, 15)
    if (motion.taken !== undefined) ghost(other, motion.taken, 0)
  }
  for (const side of sides) {
    const squares = board[side]
    const color = plate[side]
    let moving = came !== '' && motion?.side === side
    for (const step of squares) {
      const at = squareOf(side, step)
      if (at === undefined) continue
      const arrives = moving && step === motion?.to
      if (arrives) moving = false
      parts.push(`<circle cx="${x(at.col) + s / 2}" cy="${y(at.row) + s / 2}" r="${radius}" fill="${color}" stroke="${plate.edge}" stroke-width="2"${arrives ? ` class="ur-came" style="animation:ur-came ${MOTION_SECONDS}s ease-out"` : ''}/>`)
    }
    // the counts beside the board, on the side's own row: a dot of its color, then its waiting and its off, a line each
    const top = topOf(side)
    const word = `font-family="system-ui,sans-serif" font-size="${fontSize}" fill="${plate.ink}"`
    const dot = `<circle cx="${(left + fontSize * 0.45).toFixed(1)}" cy="${(top + fontSize * 0.55).toFixed(1)}" r="${(fontSize * 0.45).toFixed(1)}" fill="${color}" stroke="${plate.edge}" stroke-width="1"/>`
    const waiting = (at: number, word2: string) => `<text x="${left}" y="${(top + at).toFixed(1)}" ${word}>${word2}</text>`
    if (lean) parts.push(dot, `<text x="${left + fontSize}" y="${(top + fontSize * 0.9).toFixed(1)}" ${word}>wait ${count(squares, 0)}</text>`, waiting(fontSize * 2.2, `off ${count(squares, 15)}`))
    else parts.push(dot, `<text x="${left + fontSize}" y="${(top + fontSize * 0.9).toFixed(1)}" ${word} font-weight="700">${side === 'you' ? 'You' : 'Them'}</text>`, waiting(fontSize * 2.3, `wait ${count(squares, 0)}`), waiting(fontSize * 3.6, `off ${count(squares, 15)}`))
  }
  const style = came === '' && gone === '' ? '' : `<style>${came}${gone}@media (prefers-reduced-motion:reduce){.ur-came,.ur-gone{animation:none!important}}</style>`
  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${style}${parts.join('')}</svg>`,
    width,
    height,
  }
}
