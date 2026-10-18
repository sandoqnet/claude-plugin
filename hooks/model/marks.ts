// The marks of the dock's four tiles (order D2, still F1): a plate of 34 px centered in a cell of
// 6 across and 3 rows, in a picture with a clear ground. The plates are held to 3.0 against the white and the black ground and under
// their glyph (Desk, Seats and Shelf are deepened; Settings keeps its first colors). The lit tile has a ring of 2 px in the edge tone
// round its plate, drawn inside the picture so nothing is cut. A badge sits at the plate's top right corner: Desk, the rows that wait on
// HIM, in the amber of a wait with its numeral and its ring; Seats, the seats that wait, NOT amber: a deep disc of the made ground with
// its numeral in the text tone. Over 9 it says 9+, and none stands at zero. The Shelf has no numeral: a small dot in the dim tone at the
// corner while a record is new on it (order T4a). Pure: no host.
import { TILE_CELL, TILE_ROWS } from './dock'
import type { DockSlot } from './dock'
import { CELL } from './scene'

const ICON = 40
const PLATE = 34

const MARKS: Record<DockSlot, (x: number, y: number) => string> = {
  // The desk: a sheet of paper with its lines on a green blotter, and a pen across the corner.
  desk: (x, y) =>
    `<rect x="${x}" y="${y}" width="${ICON}" height="${ICON}" rx="10" fill="#4f7a6a"/>` +
    `<rect x="${x + 9}" y="${y + 8}" width="19" height="24" rx="2" fill="#fffaf0"/><path d="M${x + 13} ${y + 15} h11 M${x + 13} ${y + 20} h11 M${x + 13} ${y + 25} h7" stroke="#4f7a6a" stroke-width="1.5" stroke-linecap="round" fill="none"/>` +
    `<path d="M${x + 32} ${y + 9} L ${x + 22} ${y + 31}" stroke="#f2b65a" stroke-width="3.2" stroke-linecap="round"/>`,
  seats: (x, y) =>
    `<rect x="${x}" y="${y}" width="${ICON}" height="${ICON}" rx="10" fill="#437ac4"/>` +
    `<rect x="${x + 6}" y="${y + 11}" width="2.6" height="20" rx="1.3" fill="#cfe2fb"/><rect x="${x + 6}" y="${y + 21}" width="8" height="2.6" rx="1.3" fill="#cfe2fb"/><rect x="${x + 11.6}" y="${y + 22}" width="2.4" height="9" rx="1.2" fill="#cfe2fb"/>` +
    `<rect x="${x + 31.4}" y="${y + 11}" width="2.6" height="20" rx="1.3" fill="#cfe2fb"/><rect x="${x + 26}" y="${y + 21}" width="8" height="2.6" rx="1.3" fill="#cfe2fb"/><rect x="${x + 26}" y="${y + 22}" width="2.4" height="9" rx="1.2" fill="#cfe2fb"/>` +
    `<ellipse cx="${x + 20}" cy="${y + 17.5}" rx="9.5" ry="3.4" fill="#ffffff"/><rect x="${x + 18.8}" y="${y + 18}" width="2.4" height="12" fill="#ffffff"/><ellipse cx="${x + 20}" cy="${y + 30.5}" rx="5" ry="1.6" fill="#ffffff"/>`,
  shelf: (x, y) =>
    `<rect x="${x}" y="${y}" width="${ICON}" height="${ICON}" rx="10" fill="#875d3c"/>` +
    `<rect x="${x + 8}" y="${y + 12}" width="4.5" height="16" rx="1" fill="#8fd08a"/><rect x="${x + 13.5}" y="${y + 9}" width="4.5" height="19" rx="1" fill="#f7b79f"/><rect x="${x + 19}" y="${y + 14}" width="5.5" height="14" rx="1" fill="#ffd978"/><rect x="${x + 25.5}" y="${y + 11}" width="4.5" height="17" rx="1" fill="#a9d2f7"/>` +
    `<rect x="${x + 6}" y="${y + 28}" width="28" height="3.5" rx="1.2" fill="#fff3e0"/>`,
  settings: (x, y) =>
    `<rect x="${x}" y="${y}" width="${ICON}" height="${ICON}" rx="10" fill="#858b96"/>` +
    [
      [12, 16],
      [20, 25],
      [28, 13],
    ]
      .map(([dy, knob]) => `<path d="M${x + 9} ${y + dy} L ${x + 31} ${y + dy}" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/><circle cx="${x + knob}" cy="${y + dy}" r="3.3" fill="#ffffff" stroke="#858b96" stroke-width="1.4"/>`)
      .join(''),
}

export type Picture = { source: string; width: number; height: number }
export type TileTones = { solid: string; text: string; edge: string; dim?: string }

// The picture of a tile: its cell in pixels, the plate centered, the ring while it is lit, and the badge for a count.
export function tileOf(place: DockSlot, count: number, lit: boolean, tones: TileTones): Picture {
  const width = Math.round(TILE_CELL * CELL.width)
  const height = Math.round(TILE_ROWS * CELL.height)
  const x = (width - PLATE) / 2
  const y = Math.floor((height - PLATE) / 2)
  const cx = (x + PLATE + 1).toFixed(1)
  const cy = (y + 4).toFixed(1)
  const base = (y + 7.8).toFixed(1)
  const word = 'font-family="system-ui,sans-serif" font-size="11" font-weight="700" text-anchor="middle"'
  const shown = count > 9 ? '9+' : String(count)
  // The Shelf's mark (order T4a): a small dot in the dim tone on the plate's corner, no numeral, no amber: its count is in the tip.
  const dot = `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${tones.dim ?? tones.text}" stroke="${tones.solid}" stroke-width="1.5"/>`
  const badge =
    count <= 0 || place === 'settings'
      ? ''
      : place === 'shelf'
        ? dot
        : place === 'desk'
          ? `<circle cx="${cx}" cy="${cy}" r="7" fill="#f2b65a" stroke="#955800" stroke-width="1.5"/><text x="${cx}" y="${base}" ${word} fill="#1a1a19">${shown}</text>`
          : `<circle cx="${cx}" cy="${cy}" r="7" fill="${tones.solid}" stroke="${tones.text}" stroke-width="1.5"/><text x="${cx}" y="${base}" ${word} fill="${tones.text}">${shown}</text>`
  const ringTop = Math.max(1, y - 3)
  const ring = lit ? `<rect x="${x - 3}" y="${ringTop}" width="${PLATE + 6}" height="${Math.min(PLATE + 6, height - 2)}" rx="12" fill="none" stroke="${tones.edge}" stroke-width="2"/>` : ''
  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${ring}<g transform="translate(${x},${y}) scale(${(PLATE / ICON).toFixed(3)})">${MARKS[place](0, 0)}</g>${badge}</svg>`,
    width,
    height,
  }
}

// The line over a tile under the pointer: the place, its count in words (the Shelf's is what is new on it), and `open` when it is the lit one.
export function tileTip(place: DockSlot, count: number, lit: boolean): string {
  const words =
    place === 'desk'
      ? count > 0
        ? `Desk: ${count} waiting for you`
        : 'Desk: nothing waits for you'
      : place === 'seats'
        ? count > 0
          ? `Seats: ${count} waiting`
          : 'Seats: none wait'
        : place === 'shelf'
          ? count > 0
            ? `Shelf: ${count} new`
            : 'The shelf'
          : 'Settings'
  return lit ? `${words} · open` : words
}
