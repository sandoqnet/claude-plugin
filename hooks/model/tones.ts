// The colors of the words that lie on the wallpaper with no control of the app among them (order D1, fact 2): the floating top bar
// and the like. The app cannot be asked its theme, so a part of words alone takes its colors from the picture, as a phone makes its
// theme: a deep tone of the sky's hue for the ground, then each word stepped toward white until it holds its floor against that
// ground as seen over every place of the picture it may lie on. The floors: 7 for the text, 4.5 for a word, 3 for an edge. Pure: no host, and the same hour gives the same colors.
import { PALETTES, groundsOf } from './scene'
import type { Hour } from './scene'

// The seeds the colors start from, the sky of the hour at its top and its foot, the sun and the first hills (the palettes of scene.ts).
const seedOf = (hour: Hour): { sky: [string, string]; sun: string; hill: string } => ({ sky: PALETTES[hour].sky, sun: PALETTES[hour].sun.color, hill: PALETTES[hour].hills[0] })

export const FLOORS = { text: 7, dim: 4.5, accent: 4.5, ok: 4.5, warn: 4.5, line: 3 }
// How much of the made ground covers the picture under it.
export const GLASS_ALPHA = 0.9
const STEP = 0.07
const TRIES = 40

const channels = (hex: string): number[] => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
const hexOf = (rgb: number[]): string => `#${rgb.map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`
const mix = (top: string, under: string, alpha: number): string => hexOf(channels(top).map((t, i) => alpha * t + (1 - alpha) * channels(under)[i]))
const lum = (hex: string): number => {
  const [r, g, b] = channels(hex).map(c => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const ratioOf = (a: string, b: string): number => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
// A color's hue in turns and its saturation, and a color from a hue, a saturation and a lightness.
const hueOf = (hex: string): [number, number] => {
  const [r, g, b] = channels(hex).map(c => c / 255)
  const hi = Math.max(r, g, b)
  const lo = Math.min(r, g, b)
  const span = hi - lo
  if (span === 0) return [0, 0]
  const light = (hi + lo) / 2
  const hue = hi === r ? ((g - b) / span + 6) % 6 : hi === g ? (b - r) / span + 2 : (r - g) / span + 4
  return [hue / 6, span / (1 - Math.abs(2 * light - 1))]
}
const toneOf = (hue: number, saturation: number, light: number): string => {
  const chroma = (1 - Math.abs(2 * light - 1)) * saturation
  const part = (n: number) => {
    const k = (n + hue * 12) % 12
    return light - (chroma / 2) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return hexOf([part(0) * 255, part(8) * 255, part(4) * 255])
}

export type Tones = { solid: string; ground: string; text: string; dim: string; line: string; accent: string; ok: string; warn: string; edge: string }

// The colors made from the wallpaper at an hour. `solid` is the deep ground; `ground` the same with its alpha, as glass over the
// wall and the floor. Each word's lowest ratio over the solid ground and over the glass as seen on each place of the wall and the
// floor holds its floor (see tests/tones.test.ts).
export function tonesOf(hour: Hour): Tones {
  const seed = seedOf(hour)
  const [hue, raw] = hueOf(hour === 'night' ? seed.sky[1] : seed.sky[0])
  const saturation = Math.max(0.35, Math.min(0.6, raw))
  const solid = toneOf(hue, saturation, 0.19)
  const seen = [solid, ...groundsOf(hour).map(under => mix(solid, under, GLASS_ALPHA))]
  const low = (color: string): number => Math.min(...seen.map(one => ratioOf(color, one)))
  const fit = (start: string, floor: number): string => {
    let color = start
    for (let i = 0; i < TRIES && low(color) < floor; i++) color = mix('#ffffff', color, STEP)
    return color
  }
  // The edge: the lightness whose luminance is nearest 0.18, where white and near black both part from it by 3.
  let edge = toneOf(hue, saturation, 0.45)
  for (let light = 0.3; light <= 0.62; light += 0.02) {
    if (Math.abs(lum(toneOf(hue, saturation, light)) - 0.18) < Math.abs(lum(edge) - 0.18)) edge = toneOf(hue, saturation, light)
  }
  return {
    solid,
    ground: solid + Math.round(GLASS_ALPHA * 255).toString(16),
    text: fit(toneOf(hue, 0.3, 0.95), FLOORS.text),
    dim: fit(toneOf(hue, 0.25, 0.76), FLOORS.dim),
    line: fit(toneOf(hue, saturation, 0.5), FLOORS.line),
    accent: fit(seed.sun, FLOORS.accent),
    ok: fit(toneOf(hueOf(seed.hill)[0], 0.5, 0.66), FLOORS.ok),
    warn: fit('#f2b65a', FLOORS.warn),
    edge,
  }
}

// The lowest ratio of a made color over the ground as seen in every place it may lie on, for the read tool and the tests.
export function lowestOf(hour: Hour, color: string): number {
  const solid = tonesOf(hour).solid
  return Math.min(ratioOf(color, solid), ...groundsOf(hour).map(under => ratioOf(color, mix(solid, under, GLASS_ALPHA))))
}
