// The room's own background (order BG, still B1): `background.svg` in the room's shelf folder is an SVG the room's writer made, and the
// pane draws it as the wallpaper only when it is a document it may draw. This file says which: pure, no host, and no parser, only plain
// text tests WITHOUT CASE (`SCRIPT` and `ONCLICK` refuse as `script` and `onclick` do).
//
// A file is drawn when it is at most 200000 bytes, its root is `<svg` with a `viewBox`, and it holds no script, no picture and no link
// out: no `<script`, `<foreignObject`, `on...=` handler, `<image`, `<!DOCTYPE`, `<!ENTITY`, `<iframe`, `<embed`, `<object` or `@import`;
// every `href` (`xlink:href` too) is followed by `=`, a quote and a `#`, and every `url(` by a `#` after an optional space and an
// optional quote, so a link stays inside the document ("#a", "url(#g)"). The six elements refuse with a namespace prefix too (`<x:script`);
// the other prefixed elements (`sodipodi:`, `rdf:`, `cc:` of an Inkscape file) are good. The pane cannot read a color from a document it did not make.
// A file of another shape than the pane leaves bars of the app's ground; a writer sets `preserveAspectRatio="xMidYMid slice"`.

import type { Hour } from './scene.ts'

// The most bytes of a file the pane draws.
export const BACKGROUND_MOST = 200000

// The bytes of a text as UTF-8 writes them, counted from its letters: the app may have no TextEncoder. A letter is one byte to U+007F,
// two to U+07FF, three to U+FFFF (a lone half of a pair too, as the encoder writes it as U+FFFD) and four above.
export function bytesOfText(text: string): number {
  let count = 0
  for (const letter of text) {
    const point = letter.codePointAt(0) ?? 0
    count += point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4
  }
  return count
}

// The text to draw, or the reason it is not drawn (one short plain word group, for the Settings line and the read tool).
export type Background = { drawn: true; text: string } | { drawn: false; reason: string }

const TOO_LARGE = 'too large'
const NOT_SVG = 'not an SVG'
const NO_VIEWBOX = 'no viewBox'
const SCRIPT = 'holds a script'
const LINK = 'holds a link'
const PICTURE = 'holds a picture'

// What a script is: an element that runs code or holds a page of another kind, or an event handler attribute (a word `on` and letters,
// then `=`, after a space, a quote or a slash, so `onclick=` and `ONLOAD =` refuse and `font=` does not).
const SCRIPTS = ['<script', '<foreignobject']
const HANDLER = /[\s"'/]on[a-z]+\s*=/
// What stands for a picture or a document of another origin or kind.
const PICTURES = ['<image']
const LINKS = ['<!doctype', '<!entity', '<iframe', '<embed', '<object', '@import']
// The same six elements with a namespace prefix (`<x:script`, `<svg:image`): a prefix is no way round. Only these six names refuse after a
// colon, so the `sodipodi:`, `rdf:` and `cc:` elements of an Inkscape file stay good.
const PREFIXED = (names: string): RegExp => new RegExp(`<[a-z_][\\w.-]*:(?:${names})`)
const PREFIXED_SCRIPTS = PREFIXED('script|foreignobject')
const PREFIXED_PICTURES = PREFIXED('image')
const PREFIXED_LINKS = PREFIXED('iframe|embed|object')

// The text from the root on: a byte order mark, space, the `<?xml ... ?>` line, comments and a doctype (with its `[ ... ]` subset)
// before it are stepped over. A doctype is stepped over only to find the root; it is refused further down.
function rootOf(text: string): string {
  let rest = text.replace(/^﻿/, '')
  for (;;) {
    rest = rest.trimStart()
    let end = -1
    let skip = 0
    if (rest.startsWith('<?')) {
      end = rest.indexOf('?>')
      skip = 2
    } else if (rest.startsWith('<!--')) {
      end = rest.indexOf('-->')
      skip = 3
    } else if (/^<!doctype/i.test(rest)) {
      end = rest.indexOf('>')
      const open = rest.indexOf('[')
      if (open >= 0 && open < end) end = rest.indexOf(']', open) < 0 ? -1 : rest.indexOf('>', rest.indexOf(']', open))
      skip = 1
    } else return rest
    if (end < 0) return ''
    rest = rest.slice(end + skip)
  }
}

// Whether every occurrence of `word` in `lower` is followed by what `after` matches (the rest of the text, from the word's end).
const allFollowed = (lower: string, word: string, after: RegExp): boolean => {
  for (let at = lower.indexOf(word); at >= 0; at = lower.indexOf(word, at + word.length)) {
    if (!after.test(lower.slice(at + word.length))) return false
  }
  return true
}

// The one dim line of Settings (the section On the scene) and of the read tool: which background the pane draws. `none` is a room with no
// file; a reason is a file the pane leaves alone.
export const backgroundLine = (background: Background | undefined): string =>
  background === undefined
    ? "Background: the pane's own. No background.svg in this room."
    : background.drawn
      ? "Background: the room's own."
      : `Background: the pane's own. background.svg is not drawn: ${background.reason}.`

// Whether the room's own drawing is the wall: the scene is on and the file is drawn. Then the hour changes nothing of the wall.
export const isOwnWall = (scene: boolean, background: Background | undefined): boolean => scene && background?.drawn === true
// What the hour row of Settings says there, in place of its choices, and the one hour whose colors the bar and the dock keep there (the
// night's: deep and calm, whatever the hour of the clock).
export const HOUR_OWN_LINE = "The room's own drawing is the wall; the hour does not change it."
export const CALM_HOUR: Hour = 'night'

// A reading kept with the room it was read in and the size and the change time of the file it was read from.
export type KeptBackground = { root: string; size?: number; mtimeMs?: number; background: Background }

// The kept reading when it still stands for the file of this poll: the same room, the same size and the same change time, and the
// listing gave at least one of them (with neither the file cannot be said unchanged). Another room forgets the kept text.
export function keptFor(kept: KeptBackground | undefined, root: string, entry: { size?: number; mtimeMs?: number }): Background | undefined {
  if (kept === undefined || kept.root !== root) return undefined
  const isKnown = entry.size !== undefined || entry.mtimeMs !== undefined
  return isKnown && kept.size === entry.size && kept.mtimeMs === entry.mtimeMs ? kept.background : undefined
}

// What a background DRAWS, as a short key for the register's signature: none for no file, the reason for a file left alone, and for a
// drawn text its length and a hash of it, so a text that changed draws again and a poll that read the same text draws nothing.
export function backgroundKey(background: Background | undefined): string {
  if (background === undefined) return ''
  if (!background.drawn) return background.reason
  let hash = 5381
  for (let at = 0; at < background.text.length; at++) hash = (hash * 33 + background.text.charCodeAt(at)) | 0
  return `${background.text.length}:${hash}`
}

// The background to draw from the file's text and its size in bytes.
export function backgroundOf(text: string, bytes: number): Background {
  if (bytes > BACKGROUND_MOST) return { drawn: false, reason: TOO_LARGE }
  const root = rootOf(text)
  // the root is `<svg` and then a space, a slash or the end of the tag, so `<svgfoo` and `<svg-x` are no svg
  if (!/^<svg(?=[\s/>])/i.test(root)) return { drawn: false, reason: NOT_SVG }
  const tag = root.slice(0, Math.max(root.indexOf('>'), 0) + 1)
  if (!/\sviewbox\s*=/i.test(tag)) return { drawn: false, reason: NO_VIEWBOX }
  const lower = text.toLowerCase()
  if (SCRIPTS.some(word => lower.includes(word)) || PREFIXED_SCRIPTS.test(lower) || HANDLER.test(lower)) return { drawn: false, reason: SCRIPT }
  if (PICTURES.some(word => lower.includes(word)) || PREFIXED_PICTURES.test(lower)) return { drawn: false, reason: PICTURE }
  // a link stays inside the document: `href="#a"` and `url(#g)` are good, any other `href` or `url(` is not
  if (LINKS.some(word => lower.includes(word)) || PREFIXED_LINKS.test(lower) || !allFollowed(lower, 'href', /^=["']#/) || !allFollowed(lower, 'url(', /^ ?["']?#/)) {
    return { drawn: false, reason: LINK }
  }
  return { drawn: true, text }
}
