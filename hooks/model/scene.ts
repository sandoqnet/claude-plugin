// The scene of the place: a room at an hour, drawn as one Svg that covers the whole pane while the bar, the dock and the windows
// stand over it (order D1). One source built from the cells of the pane, four palettes, by the hour of the clock. The things of the room are in it: the window with the letter on its sill while an ask
// waits for the person, the door (open while the room's door is up, closed and the window dark when it is down), the shelf of
// books. The picture is still: no animation and not interactive (order A-M13). Pure: no host.

// (the one import carries its extension, as the model files that node loads do: space.ts reads CELL from here under node)
import { dockFootOf } from './dock.ts'

export type Hour = 'morning' | 'noon' | 'sunset' | 'night'

export const HOURS: Hour[] = ['morning', 'noon', 'sunset', 'night']

// The hour of the day from the clock: morning 5 to 11, noon 11 to 17, sunset 17 to 20, night otherwise.
// `now` is ms since the epoch, `zone` the clock's offset from UTC in minutes.
export function hourOf(now: number, zone = 0): Hour {
  const minutes = Math.floor(now / 60000) + zone
  const hour = Math.floor((((minutes % 1440) + 1440) % 1440) / 60)
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'noon'
  if (hour >= 17 && hour < 20) return 'sunset'
  return 'night'
}

// The hour the scene shows: the one the settings hold, or the clock's.
export const hourFor = (held: Hour | 'clock', now: number, zone = 0): Hour => (held === 'clock' ? hourOf(now, zone) : held)

// A cell of the app, in pixels: 8.4 across and 20.3 down, one measure in the desktop app (the eye confirms). ONE pair: the
// wallpaper is sized by it, and so is each place a thing of the picture stands at. The 19 this file held was short, so a picture
// sized by it was shorter than its Box and the app centered it, apart from the regions over it. views/space.ts re-exports it.
export const CELL = { width: 8.4, height: 20.3 }

// The pixels of the picture for a pane of `columns` by `rows` cells: the whole pane, so it meets the pane's foot.
export function sceneSize(columns: number, rows: number): { width: number; height: number } {
  return { width: Math.round(columns * CELL.width), height: Math.round(rows * CELL.height) }
}

// The least a body's own rows may be for the pane to take its height from them.
const LEAST_BODY_ROWS = 11
// The rows the surface keeps for its own head and foot, when the render gives the body's rows no better.
const SURFACE_ROWS = 6
// The least the pane is high, in rows.
const LEAST_ROWS = 24

// The height of the pane in an app, in rows: the body's own rows less one, from the props of the render (`scroll.bodyRows`); when
// that is absent or under 11, the surface's rows less 6, then less one. Never under 24, so a place no taller than the body never
// scrolls. None when the host gives neither. The wallpaper is this high (sceneSize), so it meets the pane's foot.
export function paneRows(surfaceRows: unknown, bodyRows: unknown): number | undefined {
  const count = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined)
  const body = count(bodyRows)
  const surface = count(surfaceRows)
  const base = body !== undefined && body >= LEAST_BODY_ROWS ? body : surface === undefined ? undefined : surface - SURFACE_ROWS
  return base === undefined ? undefined : Math.max(LEAST_ROWS, base - 1)
}

type Pixels = { width: number; height: number }

// A pane that jitters by one column or one row is the same picture: a size within one cell of the kept size IS the kept size,
// so the app is never handed a new picture for it (the picture is a cell short or a cell long at most, never cut). A size that
// is farther off, or none kept, stands.
export function settleSize(kept: Pixels | undefined, next: Pixels): Pixels {
  if (kept === undefined) return next
  const isNear = Math.abs(next.width - kept.width) <= Math.ceil(CELL.width) && Math.abs(next.height - kept.height) <= Math.ceil(CELL.height)
  return isNear ? { width: kept.width, height: kept.height } : next
}

type Palette = {
  wall: [string, string]
  sky: [string, string]
  // The sun or the moon: its color (its glow is the same color), its place in the window, its size, its glow's size.
  sun: { color: string; x: number; y: number; r: number; glow: number }
  floor: string
  // The light of the window on the floor, as rgb and an alpha.
  beam: [number, number, number, number]
  frame: string
  hills: [string, string]
  // What stands in the sky besides the sun: two clouds, or the stars.
  skyArt: 'clouds' | 'stars' | ''
}

// The four palettes were set by eye in the desktop app. Do not tune a color here without looking at the scene in the app.
export const PALETTES: Record<Hour, Palette> = {
  morning: {
    wall: ['#efdcc6', '#e3c9ad'],
    sky: ['#f4ad94', '#fcdcb8'],
    sun: { color: '#ffd36b', x: 66, y: 212, r: 30, glow: 78 },
    floor: '#c39a74',
    beam: [255, 226, 166, 0.42],
    frame: '#fbf6ef',
    hills: ['#8fc271', '#6ea85c'],
    skyArt: 'clouds',
  },
  noon: {
    wall: ['#f2e4cd', '#e8d5b8'],
    sky: ['#5aa8ec', '#acd6f7'],
    sun: { color: '#ffd84d', x: 144, y: 70, r: 28, glow: 72 },
    floor: '#c9a27e',
    beam: [255, 236, 170, 0.48],
    frame: '#fbf7f1',
    hills: ['#7fbe69', '#5f9f52'],
    skyArt: 'clouds',
  },
  sunset: {
    wall: ['#e3c1ae', '#d3a994'],
    sky: ['#6c5ba6', '#f39a6b'],
    sun: { color: '#ff8f5a', x: 76, y: 248, r: 34, glow: 88 },
    floor: '#a97a5f',
    beam: [255, 170, 120, 0.36],
    frame: '#f4e7de',
    hills: ['#5f8b52', '#466f3f'],
    skyArt: '',
  },
  night: {
    wall: ['#4b4661', '#3c3850'],
    sky: ['#0c1536', '#1e2b5e'],
    sun: { color: '#e6e3f2', x: 138, y: 82, r: 22, glow: 57 },
    floor: '#3b3140',
    beam: [170, 180, 240, 0.16],
    frame: '#b9b4c6',
    hills: ['#26422f', '#1c3326'],
    skyArt: 'stars',
  },
}

// The color of the wall at the top of the picture at an hour: the ground a word that lies on the scene with no block under it
// is read against.
export const groundOf = (hour: Hour): string => PALETTES[hour].wall[0]

// Each color of the scene a word may lie on at an hour: the wall at its top and at its foot, and the floor. The picture is laid
// to cover the pane, so the pane cannot say which of them is under a word: a word is read against each.
export const groundsOf = (hour: Hour): string[] => [PALETTES[hour].wall[0], PALETTES[hour].wall[1], PALETTES[hour].floor]

// What is inside the window, drawn in the window's own pixels (180 wide, 314 high, the sill's foot at 314).
const CLOUDS = '<g fill="#ffffff" opacity=".9"><ellipse cx="56" cy="82" rx="34" ry="12"/><ellipse cx="64" cy="74" rx="20" ry="14"/></g>'
const STARS = [
  [26, 12],
  [79, 49],
  [132, 86],
  [57, 123],
  [110, 160],
  [35, 41],
  [88, 78],
  [141, 115],
  [66, 152],
  [119, 33],
  [44, 70],
  [97, 107],
  [150, 144],
  [75, 25],
]
  .map(([x, y]) => `<circle cx="${x + 4}" cy="${y + 6}" r="1.3" fill="#dfe4ff"/>`)
  .join('')

// A thing of the picture stands at whole cells, so the picture and the regions of a later still agree: its left and top in cells,
// its width and height in cells.
type Spot = { left: number; top: number; w: number; h: number }
export type Spots = { floorTop: number; window?: { left: number }; letter?: Spot; door?: Spot; shelf?: Spot }

// The floor's line stands this many rows over the dock's top (the foot's rows are model/dock.ts, ONE function of the columns).
const FLOOR_OVER = 2
// The window's width in cells, the margin of the pane's edge, and the rows from the top that the bar and the first window keep.
const WINDOW_COLUMNS = 22
const EDGE = 2
const TOP_ROWS = 5
// The window's top, in pixels: its sill's top then lies on the top of row 21, where the letter's two rows end.
const SILL_ROW = 21
const WINDOW_PX = { across: 180, high: 300 }

// Where the things of the room stand, from the pane's size alone. The door stands on the floor at the left, the shelf hangs
// between the door and the window, the window stands at the right where `windowStands` (the canvas layout's, from 80 columns) and
// the pane is high enough. The letter lies on the sill, or on the shelf where the pane has no window. A thing with no room
// under the bar is left out.
export function spotsOf(columns: number, rows: number, windowStands: boolean): Spots {
  const floorTop = rows - dockFootOf(columns) - FLOOR_OVER
  const spots: Spots = { floorTop }
  const least = TOP_ROWS + 13
  if (windowStands && rows >= 30) spots.window = { left: columns - EDGE - WINDOW_COLUMNS }
  if (floorTop - 13 >= least) spots.door = { left: EDGE + 1, top: floorTop - 13, w: 11, h: 13 }
  if (floorTop - 10 >= least && columns >= 40) spots.shelf = { left: 18, top: floorTop - 10, w: 20, h: 4 }
  if (spots.window !== undefined) spots.letter = { left: spots.window.left + 4, top: SILL_ROW - 2, w: 6, h: 2 }
  else if (spots.shelf !== undefined) spots.letter = { left: spots.shelf.left + 14, top: spots.shelf.top + 1, w: 6, h: 2 }
  return spots
}

// The picture's own inputs: its size in pixels (from sceneSize) and whether the window stands. The cells are read back from the
// pixels, so a size the pane settled within one cell is the picture it had.
type SceneInputs = { hour: Hour; waiting: boolean; doorUp: boolean; width: number; height: number; windowStands?: boolean }

const mix = (top: string, under: string, alpha: number): string => {
  const channels = (hex: string): number[] => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  const a = channels(top)
  const b = channels(under)
  return `#${a.map((t, i) => Math.round(alpha * t + (1 - alpha) * b[i]).toString(16).padStart(2, '0')).join('')}`
}

// The SVG source of the scene at a size in pixels. `waiting` lays the letter on the sill; `doorUp` false darkens the window,
// closes the door and leaves the beams out.
export function sceneOf({ hour, waiting, doorUp, width, height, windowStands = true }: SceneInputs): string {
  const palette = PALETTES[hour]
  const columns = Math.round(width / CELL.width)
  const rows = Math.round(height / CELL.height)
  const spots = spotsOf(columns, rows, windowStands)
  const floorY = Math.round(spots.floorTop * CELL.height)
  const [r, g, b, a] = palette.beam
  const light = (alpha: number): string => `rgba(${r},${g},${b},${alpha.toFixed(2)})`
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.wall[0]}"/><stop offset="1" stop-color="${palette.wall[1]}"/></linearGradient>`,
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.sky[0]}"/><stop offset="1" stop-color="${palette.sky[1]}"/></linearGradient>`,
    `<radialGradient id="glow"><stop offset="0" stop-color="${palette.sun.color}" stop-opacity=".55"/><stop offset="1" stop-color="${palette.sun.color}" stop-opacity="0"/></radialGradient>`,
    `<clipPath id="panes"><rect x="26" y="12" width="128" height="276"/></clipPath></defs>`,
    `<rect width="${width}" height="${height}" fill="url(#wall)"/>`,
    `<rect x="0" y="${floorY}" width="${width}" height="${height - floorY}" fill="${palette.floor}"/>`,
    `<rect x="0" y="${floorY}" width="${width}" height="6" fill="rgba(0,0,0,.12)"/>`,
  ]
  if (spots.window !== undefined) {
    const x = Math.round(spots.window.left * CELL.width + (WINDOW_COLUMNS * CELL.width - WINDOW_PX.across) / 2)
    const y = Math.round(SILL_ROW * CELL.height - WINDOW_PX.high)
    const { color, x: sx, y: sy, r: sr, glow } = palette.sun
    const art = palette.skyArt === 'clouds' ? CLOUDS : palette.skyArt === 'stars' ? STARS : ''
    if (doorUp) parts.push(`<polygon points="${x + 20},${y + 314} ${x + 160},${y + 314} ${x + 180},${height} ${x - 72},${height}" fill="${light(a)}"/>`)
    parts.push(
      `<g transform="translate(${x},${y})"><rect x="14" y="0" width="152" height="300" rx="4" fill="${palette.frame}"/>`,
      `<g clip-path="url(#panes)"><rect x="26" y="12" width="128" height="276" fill="url(#sky)"/>`,
      `<circle cx="${sx}" cy="${sy}" r="${glow}" fill="url(#glow)"/><circle cx="${sx}" cy="${sy}" r="${sr}" fill="${color}"/>${art}`,
      `<path d="M26 218 Q 96 168 154 208 L 154 288 L 26 288 Z" fill="${palette.hills[0]}"/>`,
      `<path d="M26 248 Q 77 226 154 252 L 154 288 L 26 288 Z" fill="${palette.hills[1]}"/></g>`,
      `<rect x="85" y="12" width="10" height="276" fill="${palette.frame}"/><rect x="26" y="145" width="128" height="10" fill="${palette.frame}"/>`,
      `<rect x="0" y="300" width="180" height="14" rx="3" fill="${palette.frame}"/>`,
      doorUp ? '' : `<rect x="14" y="0" width="152" height="300" rx="4" fill="#0a0a14" opacity=".5"/>`,
      `</g>`,
    )
  }
  if (spots.door !== undefined) {
    // The door: the frame, the day through the opening, the leaf ajar, light on the floor while the room's door is up; the
    // leaf shut with no light while it is down.
    const x = spots.door.left * CELL.width
    const y = spots.door.top * CELL.height
    const wide = spots.door.w * CELL.width
    const tall = spots.door.h * CELL.height
    const leaf = doorUp ? x + 7 + (wide - 14) * 0.6 : x + wide - 7
    const shade = (alpha: number): string => mix('#000000', palette.frame, alpha)
    if (doorUp) parts.push(`<polygon points="${leaf},${y + tall} ${x + wide - 7},${y + tall} ${x + wide + 70},${height} ${x + 30},${height}" fill="${light(a * 0.7)}"/>`)
    parts.push(
      `<rect x="${x}" y="${y}" width="${wide}" height="${tall}" rx="4" fill="${palette.frame}"/>`,
      doorUp ? `<rect x="${x + 7}" y="${y + 7}" width="${wide - 14}" height="${tall - 7}" fill="url(#sky)"/>` : '',
      `<polygon points="${x + 7},${y + 7} ${leaf},${y + (doorUp ? 20 : 7)} ${leaf},${y + tall} ${x + 7},${y + tall}" fill="${shade(0.14)}"/>`,
      `<polygon points="${x + 13},${y + 22} ${leaf - 6},${y + (doorUp ? 32 : 22)} ${leaf - 6},${y + tall * 0.46} ${x + 13},${y + tall * 0.44}" fill="${shade(0.2)}"/>`,
      `<polygon points="${x + 13},${y + tall * 0.5} ${leaf - 6},${y + tall * 0.52} ${leaf - 6},${y + tall - 12} ${x + 13},${y + tall - 10}" fill="${shade(0.2)}"/>`,
      `<circle cx="${leaf - 9}" cy="${y + tall * 0.52}" r="3.5" fill="#b8a888"/>`,
    )
  }
  if (spots.shelf !== undefined) {
    // The shelf: a plank on two brackets, a row of books in the picture's own colors, the last one leaning.
    const x = spots.shelf.left * CELL.width
    const y = spots.shelf.top * CELL.height
    const wide = spots.shelf.w * CELL.width
    const plank = y + 3 * CELL.height
    // The last book is a red of its own, near the seal's but not it: the letter's seal is the one #c8553d of the picture.
    const books: [number, number, string][] = [
      [12, 46, palette.hills[0]],
      [10, 52, palette.sky[0]],
      [14, 40, palette.sun.color],
      [9, 50, palette.hills[1]],
      [13, 44, palette.sky[1]],
      [11, 36, '#b9503b'],
    ]
    let at = x + 10
    for (const [across, up, color] of books) {
      parts.push(`<rect x="${at}" y="${plank - up}" width="${across}" height="${up}" rx="1.5" fill="${mix(color, palette.frame, 0.82)}"/>`)
      at += across + 2
    }
    parts.push(
      `<rect x="${at + 8}" y="${plank - 42}" width="10" height="42" rx="1.5" fill="${mix(palette.sky[0], palette.frame, 0.6)}" transform="rotate(-16 ${at + 8} ${plank})"/>`,
      `<rect x="${x}" y="${plank}" width="${wide}" height="8" rx="2" fill="${palette.frame}"/>`,
      `<rect x="${x + 16}" y="${plank + 8}" width="6" height="11" fill="${palette.frame}"/><rect x="${x + wide - 22}" y="${plank + 8}" width="6" height="11" fill="${palette.frame}"/>`,
    )
  }
  if (waiting && spots.letter !== undefined) {
    // The letter with its seal, at the foot of its two rows.
    const x = spots.letter.left * CELL.width + (spots.letter.w * CELL.width - 36) / 2
    const y = (spots.letter.top + spots.letter.h) * CELL.height - 22
    parts.push(
      `<g><rect x="${x}" y="${y}" width="36" height="22" rx="2" fill="#fbf3e4" stroke="#b8a888"/><path d="M${x} ${y} L ${x + 18} ${y + 12} L ${x + 36} ${y}" fill="none" stroke="#b8a888"/><circle cx="${x + 18}" cy="${y + 12}" r="3.5" fill="#c8553d"/></g>`,
    )
  }
  parts.push('</svg>')
  return parts.filter(part => part !== '').join('')
}

// The scene is made once for its inputs and kept: a redraw of the pane for any other cause (a minute, a card) hands the
// app the very same text, never a new one.
let kept: { key: string; source: string } | undefined
export function sceneKept(inputs: SceneInputs): string {
  const key = `${inputs.hour}|${inputs.waiting}|${inputs.doorUp}|${inputs.width}|${inputs.height}|${inputs.windowStands ?? true}`
  if (kept?.key !== key) kept = { key, source: sceneOf(inputs) }
  return kept.source
}

// What the picture shows, in plain words, for the alt of the Svg.
export function sceneAlt(hour: Hour, waiting: boolean, doorUp: boolean): string {
  const light = doorUp ? 'a beam of light on the floor' : 'a dark window and no beam'
  return `A room with a window at ${hour}, ${light}${waiting ? ', and a letter on the sill' : ''}.`
}
