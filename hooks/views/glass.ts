// The place's colors in hex, since the scene and the glass are hex and the
// pane cannot read the person's theme. The terminal draws with LOOK's theme keys instead.
export const GLASS = {
  ground: '#16161cdb',
  solid: '#16161c',
  line: '#bdb5a2',
  text: '#ece6d8',
  dim: '#bdb5a2',
  accent: '#a9bdfb',
  ok: '#7fd08f',
  warn: '#f2b65a',
  fault: '#ff8a80',
  rule: '#d9d2c3',
} as const

// The surfaces that draw an Svg, an absolute Box and hover; the terminal draws none of them.
export const isApp = (surface?: string): boolean =>
  surface === 'desktop' || surface === 'vscode' || surface === 'mobile'

type Rgb = [number, number, number]

// A hex color of 3, 6 or 8 digits (#rgb, #rrggbb, #rrggbbaa): its channels and its alpha, 0 to 1; none for any other word.
export function parseHex(color: string): { rgb: Rgb; alpha: number } | undefined {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color.trim())
  if (match === null) return undefined
  const digits = match[1].length === 3 ? [...match[1]].map(digit => digit + digit).join('') : match[1]
  const at = (i: number): number => parseInt(digits.slice(i * 2, i * 2 + 2), 16)
  return { rgb: [at(0), at(1), at(2)], alpha: digits.length === 8 ? at(3) / 255 : 1 }
}

const hexOf = (rgb: Rgb): string => `#${rgb.map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('')}`

// A color laid over an opaque ground, as the eye sees it: the alpha of the top counted, the result opaque.
export function over(top: string, ground: string): string {
  const upper = parseHex(top)
  const lower = parseHex(ground)
  if (upper === undefined || lower === undefined) return ground
  return hexOf(upper.rgb.map((channel, i) => channel * upper.alpha + lower.rgb[i] * (1 - upper.alpha)) as Rgb)
}

// The relative luminance of WCAG 2: each channel linear, then 0.2126, 0.7152 and 0.0722.
function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(channel => {
    const level = channel / 255
    return level <= 0.03928 ? level / 12.92 : ((level + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// The contrast ratio of two colors (WCAG 2): 1 for the same color, 21 for black on white, the same either way round. A color
// with an alpha is counted as opaque (lay it over its ground first, see `over`); a word that is no hex gives NaN.
export function ratio(a: string, b: string): number {
  const first = parseHex(a)
  const second = parseHex(b)
  if (first === undefined || second === undefined) return Number.NaN
  const [high, low] = [luminance(first.rgb), luminance(second.rgb)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}
