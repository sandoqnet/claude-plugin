// The page of a desk item (order R3): an item whose origin is `page:PATH` shows that md file in the pane, read from the room's folder. This is the
// check of PATH and the words of what the read left; the read itself is the register's, through the host's. Pure, with no `$`. Run by `node` too: no
// enums, `import type` for types, `.ts` in imports.

// What the read of a page left, for the item named by `item`: the state of the read, the path as read, the file's text, and the one line
// of why there is no text (a refused path, a missing file, a read that failed), '' while there is a text.
// `media` (order O4) is set for a page that is an image, a video or a sound: the pane read nothing of it, and `line` says its kind.
export type PageRead = { item: string; state: 'reading' | 'done'; path: string; text: string; line: string; media?: 'image' | 'video' | 'sound' }

// The origin of a desk item that names a page, in the words sandoq puts it (`page:PATH`): the path is read from what stands after the colon, whatever
// it is, so a path that leaves the room's folder is refused here and is no "other" origin to the reader.
const PAGE_ORIGIN = /^page:(.*)$/

export const PAGE_NONE = 'This page names no file.'
export const PAGE_ABSOLUTE = "A page is read from the room's folder: this path is absolute, so it is not opened."
export const PAGE_UP = "A page is read from the room's folder: this path steps above it, so it is not opened."
export const PAGE_NO_FOLDER = "The pane found no folder of the room, so it cannot read this page."
export const PAGE_READING = 'Reading the page.'
export const pageMissing = (path: string): string => `There is no file ${path} in the room's folder.`
export const pageEmpty = (path: string): string => `The file ${path} is empty.`
export const pageFailed = (path: string): string => `The pane could not read ${path}.`

// A path: `path` to read under the room's folder (its `.` steps and doubled slashes taken out), or `refused` with the one line that says why.
export type PagePath = { path: string; refused?: undefined } | { path?: undefined; refused: string }

// The path an origin names, or none when the origin is no `page:`. An absolute path (a lead slash or backslash, a drive, a home mark) and a `..` step
// are refused whole: the pane reads nothing outside the room's folder.
export function pagePathOf(origin: string): PagePath | undefined {
  const found = PAGE_ORIGIN.exec(origin)
  if (found === null) return undefined
  const raw = found[1].trim()
  if (raw === '') return { refused: PAGE_NONE }
  if (/^[/\\]/.test(raw) || /^[A-Za-z]:/.test(raw) || raw.startsWith('~')) return { refused: PAGE_ABSOLUTE }
  const steps = raw.split(/[/\\]+/)
  if (steps.includes('..')) return { refused: PAGE_UP }
  const kept = steps.filter(step => step !== '' && step !== '.')
  return kept.length === 0 ? { refused: PAGE_NONE } : { path: kept.join('/') }
}

// What the read of a page left when it has no text: the one line of why. `path` is the one the origin names, as written.
export const pageLine = (item: string, origin: string, line: string): PageRead => ({ item, state: 'done', path: (PAGE_ORIGIN.exec(origin)?.[1] ?? '').trim(), text: '', line })

// ---- the kind of a page by its path (order O4): the pane reads only a text page, and only under PAGE_MOST bytes. An image, a video or a sound is
// never read (a video may be 2 GB): its item says its kind in one line. svg, html, htm and pdf are `other`: the pane does not show them. Any other
// path is text. The extension is read in any case.

export type PageKind = 'text' | 'image' | 'video' | 'sound' | 'other'

const KIND_OF_EXTENSION: Record<string, PageKind> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  mp4: 'video',
  webm: 'video',
  mp3: 'sound',
  ogg: 'sound',
  wav: 'sound',
  svg: 'other',
  html: 'other',
  htm: 'other',
  pdf: 'other',
}

export function pageKindOf(path: string): PageKind {
  const name = path.trim().split(/[/\\]/).pop() ?? ''
  const dot = name.lastIndexOf('.')
  return dot > 0 ? (KIND_OF_EXTENSION[name.slice(dot + 1).toLowerCase()] ?? 'text') : 'text'
}

// The most of a text page the pane reads, in bytes (1 MB); a file over it is not read.
export const PAGE_MOST = 1048576

export const PAGE_KIND_LINE = { image: 'An image.', video: 'A video.', sound: 'A sound.' }
export const PAGE_NOT_SHOWN = 'The pane does not show it.'
export const PAGE_OTHER = 'The pane does not show this file.'
export const PAGE_TOO_BIG = 'This page is over 1 MB.'

// What the pane leaves of a page that is an image, a video or a sound: no text, the line of its kind.
export const pageMedia = (item: string, origin: string, media: 'image' | 'video' | 'sound'): PageRead => ({ ...pageLine(item, origin, PAGE_KIND_LINE[media]), media })

// ---- the blocks of a page (order P2): NOTHING SCROLLS, so the md file is drawn as several Markdown blocks and the pane's one rule pages the card of the
// item by them. A block is a heading with the paragraph under it, a paragraph, a whole list, a quote, a table or a code fence; a block taller than the
// card's rows is cut at its lines into more blocks.

const FENCE = /^\s{0,3}(```+|~~~+)/
const HEADING = /^\s{0,3}#{1,6}(\s|$)/
const ITEM = /^\s*([-*+]|\d+[.)])\s/
const QUOTE = /^\s{0,3}>/
const TABLE = /^\s*\|/
const blank = (line: string): boolean => line.trim() === ''
// Whether a line closes the fence that `opener` (its run of marks) opened: the same mark, as many or more, and nothing else on the line.
const closes = (line: string, opener: string): boolean => {
  const text = line.trim()
  return text.length >= opener.length && text.split('').every(mark => mark === opener[0])
}
// A line that starts a block of its own, so a paragraph ends before it.
const starts = (line: string): boolean => FENCE.test(line) || HEADING.test(line) || ITEM.test(line) || QUOTE.test(line) || TABLE.test(line)

// The rows a source line takes in a width, as views/cells.ts counts a line of a Markdown text: an empty line is one row, any other its words wrapped
// at the width (a word wider than the width stands on a row of its own).
export function lineRows(line: string, width: number): number {
  const text = line.trim()
  if (text === '') return 1
  let rows = 1
  let used = 0
  for (const word of text.split(/\s+/)) {
    if (used === 0) used = word.length
    else if (used + 1 + word.length <= width) used += 1 + word.length
    else {
      rows += 1
      used = word.length
    }
  }
  return rows
}

// The rows of a block or of a whole text in a width.
export const textRows = (text: string, width: number): number => text.split('\n').reduce((sum, line) => sum + lineRows(line, width), 0)

// The blocks of a md text, in order, each the source lines as written (the lines of a block joined by a newline, no empty line at either end).
// A heading stands with the paragraph under it; a list holds its items, their indented lines and the empty lines between them; a fence runs to
// its closing line (or to the end of the text).
export function blocksOf(text: string): string[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  let at = 0
  while (at < lines.length) {
    if (blank(lines[at])) {
      at += 1
      continue
    }
    const from = at
    const line = lines[at]
    const fence = FENCE.exec(line)
    if (fence !== null) {
      at += 1
      while (at < lines.length && !closes(lines[at], fence[1])) at += 1
      at = Math.min(at + 1, lines.length)
    } else if (HEADING.test(line)) {
      at += 1
      let after = at
      while (after < lines.length && blank(lines[after])) after += 1
      if (after < lines.length && !starts(lines[after])) {
        at = after
        while (at < lines.length && !blank(lines[at]) && !starts(lines[at])) at += 1
      }
    } else if (ITEM.test(line)) {
      at += 1
      while (at < lines.length) {
        let next = at
        while (next < lines.length && blank(lines[next])) next += 1
        if (next >= lines.length || !(ITEM.test(lines[next]) || (/^\s{2,}\S/.test(lines[next]) && !FENCE.test(lines[next])))) break
        at = next + 1
      }
    } else if (QUOTE.test(line) || TABLE.test(line)) {
      const same = QUOTE.test(line) ? QUOTE : TABLE
      while (at < lines.length && same.test(lines[at])) at += 1
    } else {
      at += 1
      while (at < lines.length && !blank(lines[at]) && !starts(lines[at])) at += 1
    }
    out.push(lines.slice(from, at).join('\n'))
  }
  return out
}

// A source line taller than `rows` cut by its words into lines of at most `rows` rows each; a quote keeps its mark on every line.
function chunksOf(line: string, rows: number, width: number): string[] {
  const lead = /^\s*(>\s*)+/.exec(line)?.[0].trim() ?? ''
  const words = line.trim().split(/\s+/)
  const out: string[] = []
  let chunk = ''
  for (const word of words) {
    const next = chunk === '' ? word : `${chunk} ${word}`
    if (chunk === '' || lineRows(next, width) <= rows) chunk = next
    else {
      out.push(chunk)
      chunk = lead === '' ? word : `${lead} ${word}`
    }
  }
  if (chunk !== '') out.push(chunk)
  return out
}

// A block taller than `rows` cut at its lines into pieces of at most `rows` rows each (a block that fits is the one piece). A line stays whole unless
// it alone is taller than `rows`: then it is cut by its words. A fence is closed and opened again at each cut, so each piece is a fence; a heading is
// never left at the end of a piece without the line under it. A piece is never less than one row.
export function cutBlock(block: string, rows: number, width: number): string[] {
  const room = Math.max(1, Math.floor(rows))
  if (textRows(block, width) <= room) return [block]
  const lines = block.split('\n')
  const fence = FENCE.exec(lines[0])
  const closed = fence !== null && lines.length > 1 && closes(lines[lines.length - 1], fence[1])
  const open = fence === null ? '' : lines[0]
  const close = fence === null ? '' : closed ? lines[lines.length - 1] : fence[1]
  const inner = fence === null ? lines : lines.slice(1, closed ? -1 : undefined)
  // a fence piece holds its two fence lines, so its code has two rows less (at least one)
  const space = fence === null ? room : Math.max(1, room - 2)
  const units = inner.flatMap(line => (lineRows(line, width) > space ? chunksOf(line, space, width) : [line]))
  const pieces: string[][] = []
  let piece: string[] = []
  let used = 0
  const push = () => {
    while (piece.length > 0 && blank(piece[piece.length - 1])) piece.pop()
    if (piece.length > 0) pieces.push(piece)
    piece = []
    used = 0
  }
  const queue = [...units]
  while (queue.length > 0) {
    let unit = queue.shift() as string
    let rowsOfUnit = lineRows(unit, width)
    // a piece that holds only a heading takes the first words of the line under it, as many as it has room for, so the heading is not alone
    if (used + rowsOfUnit > space && space > used && fence === null && rowsOfUnit > 1 && piece.length > 0 && piece.every(line => blank(line) || HEADING.test(line))) {
      const [first] = chunksOf(unit, space - used, width)
      const rest = unit.trim().split(/\s+/).join(' ').slice(first.length).trim()
      if (rest !== '') queue.unshift(...(lineRows(rest, width) > space ? chunksOf(rest, space, width) : [rest]))
      unit = first
      rowsOfUnit = lineRows(unit, width)
    }
    if (used + rowsOfUnit > space && piece.length > 0) {
      // a heading at the end of the piece (the empty lines after it dropped) goes on with the next piece
      while (piece.length > 1 && blank(piece[piece.length - 1])) piece.pop()
      const last = piece[piece.length - 1]
      const heading = fence === null && piece.length > 1 && HEADING.test(last) && lineRows(last, width) + rowsOfUnit <= space ? (piece.pop() as string) : undefined
      push()
      if (heading !== undefined) {
        piece = [heading]
        used = lineRows(heading, width)
      }
    }
    if (piece.length === 0 && blank(unit)) continue
    piece.push(unit)
    used += rowsOfUnit
  }
  push()
  return pieces.map(one => (fence === null ? one.join('\n') : [open, ...one, close].join('\n')))
}

// The parts of a page as the card draws them: its blocks, each cut to at most `rows` rows where `rows` is given. The rows are those of a Markdown line
// in `width` columns (views/cells.ts).
export const pageParts = (text: string, rows: number | undefined, width: number): string[] =>
  blocksOf(text).flatMap(block => (rows === undefined ? [block] : cutBlock(block, rows, width)))
