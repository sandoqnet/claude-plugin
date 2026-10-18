// The picture of the desk top (order DESK, D2): a wood ground dithered by a 2 px checker, a
// pile drawn in each cell, the open pile with a ring, and on each a badge with his count (an amber disc, the count in dark ink: the name stands under
// the picture as a Button, so the badge is never the only word). A clear desk is the bare wood with a lamp, a cup and a plant: a desk at rest, never
// an empty strip. Pure: no host. The register draws it as an Svg and keeps the element for its source (the pane's one rule for a picture).
import { hisCount } from '../model/desk.ts'
import type { Pile, PileArt } from '../model/desk.ts'

const WOOD = ['#6b4a33', '#5d402c']
const GRAIN = '#4f3625'
const PAPER = '#efe6d2'
const PAPER_SHADE = '#d8ccb2'
const INK = '#3a3026'
const BADGE = '#f2b65a'
const RING = '#ece6d8'
const FOLDERS = ['#c9a86a', '#9fb5a0', '#b7a0c4', '#c79a8a', '#a7b8cf']
// a pile is drawn in a box of BOX_W by BOX_H px
const BOX_W = 44
const BOX_H = 34

const paper = (x: number, y: number, w: number, h: number, turn = 0): string =>
  `<g transform="rotate(${turn} ${x + w / 2} ${y + h / 2})"><rect x="${x + 2}" y="${y + 2}" width="${w}" height="${h}" rx="1.5" fill="#00000040"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${PAPER}" stroke="${PAPER_SHADE}"/></g>`

// Each pile in its box, the top left at 0, 0.
function pileArt(art: PileArt, tint: number): string {
  switch (art) {
    case 'all':
      return [
        `<path d="M2 14 h40 l-3 20 h-34 z" fill="#8a6a4a" stroke="#00000055"/>`,
        paper(8, 2, 28, 20, -8),
        paper(10, 4, 28, 20, 5),
        paper(7, 7, 30, 18, -2),
        `<path d="M2 20 h40 l-3 14 h-34 z" fill="#9a7a58" stroke="#00000055"/>`,
      ].join('')
    case 'letter':
      return [
        paper(4, 2, 36, 24, -6),
        `<g transform="rotate(-6 22 14)"><polyline points="4,2 22,16 40,2" fill="none" stroke="${INK}" stroke-width="1.4"/></g>`,
        paper(6, 8, 36, 24, 4),
        `<g transform="rotate(4 24 20)"><polyline points="6,8 24,22 42,8" fill="none" stroke="${INK}" stroke-width="1.4"/></g>`,
      ].join('')
    case 'sign':
      return [
        paper(8, 0, 26, 34, -3),
        `<g transform="rotate(-3 21 17)" stroke="${INK}" stroke-width="1.2">`,
        ...[6, 10, 14, 18].map(dy => `<line x1="12" y1="${dy}" x2="30" y2="${dy}" stroke-opacity=".55"/>`),
        `<path d="M12 28 q3 -5 5 0 t5 0 t5 -1" fill="none"/><line x1="11" y1="30" x2="31" y2="30"/></g>`,
        `<g transform="rotate(38 36 18)"><rect x="34" y="2" width="4" height="30" rx="1.5" fill="${INK}"/><rect x="34" y="2" width="4" height="5" fill="${BADGE}"/></g>`,
      ].join('')
    case 'decision':
      return [
        paper(4, 4, 22, 28, -10),
        paper(18, 2, 22, 28, 8),
        `<circle cx="15" cy="18" r="4" fill="none" stroke="${INK}" stroke-width="1.4"/>`,
        `<rect x="25" y="12" width="8" height="8" fill="none" stroke="${INK}" stroke-width="1.4" transform="rotate(8 29 16)"/>`,
      ].join('')
    case 'test':
      return [
        `<rect x="11" y="2" width="24" height="32" rx="2" fill="#8a6a4a" stroke="#00000055"/>`,
        `<rect x="13" y="6" width="20" height="26" fill="${PAPER}"/>`,
        `<rect x="18" y="0" width="10" height="5" rx="1.5" fill="#b9b2a4" stroke="${INK}" stroke-width=".8"/>`,
        ...[12, 18, 24].map(dy => `<rect x="16" y="${dy - 3}" width="4" height="4" fill="none" stroke="${INK}" stroke-width="1"/><line x1="22" y1="${dy - 1}" x2="30" y2="${dy - 1}" stroke="${INK}" stroke-opacity=".55"/>`),
        `<polyline points="16,10 18,12 21,8" fill="none" stroke="${INK}" stroke-width="1.4"/>`,
      ].join('')
    case 'reading':
      return [
        `<path d="M4 8 q9 -4 18 0 v24 q-9 -4 -18 0 z" fill="${PAPER}" stroke="${PAPER_SHADE}"/>`,
        `<path d="M40 8 q-9 -4 -18 0 v24 q9 -4 18 0 z" fill="${PAPER}" stroke="${PAPER_SHADE}"/>`,
        `<line x1="22" y1="8" x2="22" y2="32" stroke="${INK}" stroke-width="1"/>`,
        ...[13, 17, 21, 25].map(dy => `<line x1="8" y1="${dy}" x2="19" y2="${dy}" stroke="${INK}" stroke-opacity=".5"/><line x1="25" y1="${dy}" x2="36" y2="${dy}" stroke="${INK}" stroke-opacity=".5"/>`),
      ].join('')
    case 'seat': {
      const color = FOLDERS[tint % FOLDERS.length]
      return [paper(8, 4, 28, 22, -4), `<path d="M4 10 h12 l3 3 h21 v19 h-36 z" fill="${color}" stroke="#00000055"/>`, `<line x1="4" y1="16" x2="40" y2="16" stroke="#00000030"/>`].join('')
    }
  }
}

// A desk at rest: a lamp at the left, a cup and a plant at the right, the middle bare.
function restArt(width: number, height: number): string {
  const y = height - 8
  const right = width - 70
  return [
    `<g opacity=".95"><ellipse cx="38" cy="${y}" rx="16" ry="3" fill="#00000040"/><rect x="34" y="${y - 6}" width="8" height="6" fill="#3a3026"/><line x1="38" y1="${y - 6}" x2="52" y2="${y - 34}" stroke="#3a3026" stroke-width="3"/><line x1="52" y1="${y - 34}" x2="34" y2="${y - 50}" stroke="#3a3026" stroke-width="3"/><path d="M22 ${y - 46} l20 -14 l8 10 z" fill="#c9a86a" stroke="#00000055"/></g>`,
    `<g><ellipse cx="${right}" cy="${y}" rx="12" ry="3" fill="#00000040"/><rect x="${right - 9}" y="${y - 18}" width="18" height="18" rx="3" fill="${PAPER}" stroke="${PAPER_SHADE}"/><path d="M${right + 9} ${y - 14} q8 2 0 9" fill="none" stroke="${PAPER_SHADE}" stroke-width="2.5"/></g>`,
    `<g><ellipse cx="${right + 40}" cy="${y}" rx="12" ry="3" fill="#00000040"/><path d="M${right + 31} ${y - 14} h18 l-3 14 h-12 z" fill="#b5674a"/><path d="M${right + 40} ${y - 14} q-12 -10 -8 -24 q6 8 8 24 q2 -18 12 -22 q2 12 -12 22" fill="#7fa06a" stroke="#4f6a42" stroke-width=".8"/></g>`,
  ].join('')
}

// The picture `width` by `height` px, the piles in cells `cell` px wide from `offset` px; `open` the key of the lit pile. A pile's badge is his
// count (the rows of the pile that wait on him), 9+ over nine, none at zero.
export function deskArt(piles: Pile[], open: string, width: number, height: number, cell: number, offset = 0): string {
  const grain = Array.from({ length: Math.ceil(height / 9) }, (_, at) => `<line x1="0" y1="${at * 9 + 4}" x2="${width}" y2="${at * 9 + 6}" stroke="${GRAIN}" stroke-opacity=".35"/>`).join('')
  // a cell under the box and its ring draws the pile smaller, so piles never touch
  const scale = Math.min(1, (cell - 4) / (BOX_W + 12))
  const parts = piles.map((pile, at) => {
    const w = BOX_W * scale
    const x = offset + at * cell + (cell - w) / 2
    const y = (height - BOX_H * scale) / 2
    const ring = pile.key === open ? `<rect x="${(x - 6 * scale).toFixed(1)}" y="${(y - 5 * scale).toFixed(1)}" width="${(56 * scale).toFixed(1)}" height="${(44 * scale).toFixed(1)}" rx="6" fill="none" stroke="${RING}" stroke-width="2"/>` : ''
    const count = hisCount(pile.rows)
    const badge =
      count === 0
        ? ''
        : `<circle cx="${(x + w).toFixed(1)}" cy="${(y + 2).toFixed(1)}" r="7" fill="${BADGE}" stroke="#2a1d14" stroke-width="1"/><text x="${(x + w).toFixed(1)}" y="${(y + 5.5).toFixed(1)}" font-family="sans-serif" font-size="10" font-weight="700" text-anchor="middle" fill="#2a1d14">${count > 9 ? '9+' : count}</text>`
    return `${ring}<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})">${pileArt(pile.art, pile.tint)}</g>${badge}`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><pattern id="d" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${WOOD[0]}"/><rect width="2" height="2" fill="${WOOD[1]}"/><rect x="2" y="2" width="2" height="2" fill="${WOOD[1]}"/></pattern></defs><rect width="${width}" height="${height}" rx="8" fill="url(#d)"/>${grain}<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="8" fill="none" stroke="#00000055" stroke-width="2"/>${piles.length === 0 ? restArt(width, height) : parts.join('')}</svg>`
}
