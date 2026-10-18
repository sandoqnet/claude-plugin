// What the pane draws, as plain text for a seat to read (order A-M12): the lines of a tree in reading order, block by block,
// with each control named (button, field, list), and each pair of word color and ground with its contrast ratio. Pure: it reads
// the elements the kit made, which are objects with a `type` (the kit's name), `props` and `children`, and never throws on a
// shape it does not know.
import { clockText } from '../model/motion'
import { scrub } from '../model/draws'
import type { Drawn, Failed } from '../model/draws'
import { over, parseHex, ratio } from './glass'

type Node = { type?: unknown; props?: Record<string, any>; children?: unknown }

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null && !Array.isArray(value)

// The kit's name of an element: its type when that is a word, else the name of its function.
function kindOf(node: Node): string {
  const type = node.type
  if (typeof type === 'string') return type
  if (typeof type === 'function') return String((type as { displayName?: string }).displayName ?? type.name ?? '')
  return ''
}

const propsOf = (node: Node): Record<string, any> => (isNode(node.props) ? node.props : {})
const kidsOf = (node: Node): unknown[] =>
  [node.children !== undefined ? node.children : propsOf(node).children].flat(Infinity).filter(kid => kid !== undefined && kid !== null && kid !== false)

// The words a node holds, with no control named: a Text's own words.
function wordsOf(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(wordsOf).join('')
  return isNode(node) ? kidsOf(node).map(wordsOf).join('') : ''
}

// A path of this machine in a drawn line is never said: its last name stands, after the dots (model/draws.ts).
export { scrub }

const cut = (words: string, at: number): string => (words.length > at ? `${words.slice(0, at - 1)}…` : words)

// A Text the pane cuts at its column: wrap is truncate-end (also plain truncate), truncate-start or truncate-middle.
const cutsOf = (node: unknown): string => {
  const wrap = isNode(node) && kindOf(node) === 'Text' ? propsOf(node).wrap : undefined
  return typeof wrap === 'string' && wrap.startsWith('truncate') ? wrap : ''
}

// The words a Text that cuts shows in `room` cells, cut as the pane cuts it.
function cutAs(wrap: string, words: string, room: number): string {
  if (room <= 0 || words.length <= room) return words
  if (room === 1) return '…'
  if (wrap === 'truncate-start') return `…${words.slice(words.length - room + 1)}`
  if (wrap === 'truncate-middle') return `${words.slice(0, Math.ceil((room - 1) / 2))}…${words.slice(words.length - Math.floor((room - 1) / 2))}`
  return `${words.slice(0, room - 1)}…`
}

// The cells a box leaves its children inside `room` (0 when none is known): a numeric width caps it; the padding and the border
// take their cells.
function roomOf(props: Record<string, any>, room: number): number {
  const num = (value: unknown): number => (typeof value === 'number' && value > 0 ? value : 0)
  let left = room
  if (num(props.width) > 0) left = left > 0 ? Math.min(left, num(props.width)) : num(props.width)
  if (left <= 0) return 0
  const sides = num(props.paddingX) * 2 || num(props.paddingLeft) + num(props.paddingRight) || num(props.padding) * 2
  return Math.max(1, left - sides - (props.borderStyle !== undefined ? 2 : 0))
}

// The pieces of one line, as the pane lays them in `room` cells: a piece that never cuts keeps its words, and the Texts that cut
// share what is left, each taking its own words when they are shorter than its share.
function pieces(kids: unknown[], room: number): string[] {
  const out = kids.map(kid => (cutsOf(kid) === '' ? describe(kid, room) : ''))
  const cutting = kids.map((kid, at) => at).filter(at => cutsOf(kids[at]) !== '')
  const whole = new Map(cutting.map(at => [at, describe(kids[at], 0)]))
  const used = out.filter(piece => piece !== '').length + cutting.filter(at => whole.get(at) !== '').length
  let left = room - out.reduce((sum, piece) => sum + piece.length, 0) - Math.max(0, used - 1)
  const order = [...cutting].sort((a, b) => (whole.get(a) as string).length - (whole.get(b) as string).length)
  order.forEach((at, index) => {
    const words = whole.get(at) as string
    const share = room <= 0 ? 0 : Math.max(1, Math.floor(left / (order.length - index)))
    out[at] = cutAs(cutsOf(kids[at]), words, share)
    left -= out[at].length
  })
  return out.filter(piece => piece !== '')
}

// One node as one inline piece of a line: a Text its words, a control its name and its label, a picture its alt. `room` is the
// cells the pane gives the line (0 when not known): a Text that the pane cuts at its column is cut so here.
function describe(node: unknown, room = 0): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim()
  if (Array.isArray(node)) return pieces(node, room).join(' ')
  if (!isNode(node)) return ''
  const props = propsOf(node)
  switch (kindOf(node)) {
    case 'Text':
      return cutsOf(node) === '' ? wordsOf(node).trim() : cutAs(cutsOf(node), wordsOf(node).trim(), room)
    case 'Button': {
      const label = typeof props.label === 'string' && props.label !== '' ? props.label : wordsOf(node).trim()
      return `[button ${label}]`
    }
    case 'Input': {
      const hint = [props.label, props.placeholder].filter(word => typeof word === 'string' && word !== '').join(': ')
      return `[field ${hint}${typeof props.value === 'string' && props.value !== '' ? ` = ${cut(props.value, 40)}` : ''}]`
    }
    case 'Select': {
      const options = Array.isArray(props.options) ? props.options.map((one: any) => String(one?.label ?? one?.value ?? one)) : []
      return `[list ${String(props.value ?? '')}${options.length > 0 ? ` of ${options.slice(0, 5).join(', ')}` : ''}]`
    }
    case 'Markdown':
      return typeof props.text === 'string' ? props.text.trim() : ''
    case 'Svg':
      return `(picture ${String(props.alt ?? '')})`
    default:
      return pieces(kidsOf(node), roomOf(props, room)).join(' ')
  }
}

type Walk = { out: string[]; blocks: number; last: number }

// A line said under its block's heading; the lines that lie on the scene with no block stand under "on the scene".
function say(walk: Walk, block: number, text: string): void {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '')
  if (lines.length === 0) return
  if (walk.last !== block || walk.out.length === 0) {
    walk.out.push(block === 0 ? 'on the scene' : `block ${block}`)
    walk.last = block
  }
  for (const line of lines) walk.out.push(`  ${scrub(line)}`)
}

const hasGround = (props: Record<string, any>): boolean => typeof props.backgroundColor === 'string' && parseHex(props.backgroundColor) !== undefined

function lines(node: unknown, block: number, walk: Walk, room: number): void {
  if (Array.isArray(node)) return node.forEach(one => lines(one, block, walk, room))
  if (typeof node === 'string' || typeof node === 'number') return say(walk, block, String(node))
  if (!isNode(node)) return
  const kind = kindOf(node)
  if (kind !== 'Box' && kind !== '') return say(walk, block, describe(node, room))
  const props = propsOf(node)
  // A Box with a ground or a border opens a block, unless one is open already: the blocks are the head, a card, the bar.
  let at = block
  if (block === 0 && (hasGround(props) || props.borderStyle !== undefined)) at = ++walk.blocks
  if (props.flexDirection === 'row') return say(walk, at, describe(node, room))
  const inside = roomOf(props, room)
  for (const kid of kidsOf(node)) lines(kid, at, walk, inside)
}

// The lines of a tree as a seat reads them, block by block, in reading order. At most `limit` rows, then one that says how many
// more. `columns` is the width the pane was drawn at (0 when not known): a Text the pane cuts at its column is cut so here, and
// the read gives what is drawn. A Text that wraps is given whole.
export function linesOf(tree: unknown, limit = 200, columns = 0): string[] {
  const walk: Walk = { out: [], blocks: 0, last: -1 }
  lines(tree, 0, walk, columns)
  return walk.out.length > limit ? [...walk.out.slice(0, limit), `(${walk.out.length - limit} more lines)`] : walk.out
}

export type Pair = { color: string; ground: string; ratio: number; sample: string; count: number }

// Each pair of a word's hex color and the ground it lies on, one entry for each pair of colors, lowest ratio first. The ground
// is the nearest Box that has one, laid over the ground below it, and the scene's `ground` under all: one color, or each of the
// colors the scene has where a word may lie (the wall's two ends and the floor), a word counted against each. `own` counts the
// words the app colors by its own theme (no color given, or a theme key): they have no ratio the pane can say.
export function pairsOf(tree: unknown, ground: string | string[]): { pairs: Pair[]; own: number } {
  const found = new Map<string, Pair>()
  // The words of each pair in the pass of one scene color: a word on a block that hides each scene color is one word of one pair,
  // so the count of a pair is its greatest count of a pass.
  let pass = new Map<string, number>()
  let own = 0
  let counted = true
  const visit = (node: unknown, under: string): void => {
    if (Array.isArray(node)) return node.forEach(one => visit(one, under))
    if (!isNode(node)) return
    const props = propsOf(node)
    const kind = kindOf(node)
    const here = kind !== 'Text' && hasGround(props) ? over(props.backgroundColor, under) : under
    if (kind === 'Text') {
      const sample = wordsOf(node).trim()
      if (sample === '') return
      const color = typeof props.color === 'string' ? parseHex(props.color) : undefined
      if (color === undefined) {
        if (counted) own += 1
        return
      }
      const below = hasGround(props) ? over(props.backgroundColor, under) : under
      const seen = over(props.color, below)
      const key = `${seen}|${below}`
      if (!found.has(key)) found.set(key, { color: seen, ground: below, ratio: ratio(seen, below), sample: cut(sample, 24), count: 0 })
      pass.set(key, (pass.get(key) ?? 0) + 1)
      return
    }
    if (kind === 'Button' && typeof props.label === 'string' && kidsOf(node).every(kid => typeof kid === 'string')) {
      if (counted) own += 1
      return
    }
    if (kind === 'Input' || kind === 'Select' || kind === 'Markdown') {
      if (counted) own += 1
      return
    }
    for (const kid of kidsOf(node)) visit(kid, here)
  }
  const grounds = [...new Set([ground].flat())]
  grounds.forEach((under, at) => {
    counted = at === 0
    pass = new Map()
    visit(tree, under)
    for (const [key, count] of pass) found.get(key)!.count = Math.max(found.get(key)!.count, count)
  })
  return { pairs: [...found.values()].sort((a, b) => a.ratio - b.ratio), own }
}

// The least a word needs (WCAG 2, normal text).
export const WORD_RATIO = 4.5

export function pairWords(pair: Pair): string {
  const flag = pair.ratio < WORD_RATIO ? '  LOW' : ''
  return `${pair.ratio.toFixed(2)} to 1  ${pair.color} on ${pair.ground}  ${pair.count} ${pair.count === 1 ? 'word' : 'words'}${flag}  e.g. "${scrub(pair.sample)}"`
}

const timeWords = (at: number, zone: number): string => (at === 0 ? 'never' : clockText(at, zone))

// "draws 12 (last 10:00:30) · scene 3 (size 840x532, last 10:00:00)".
export function countWords(counts: Drawn, zone: number): string {
  const scene = counts.cause === '' ? '' : `${counts.cause} ${counts.size}, `
  return `draws ${counts.draws} (last ${timeWords(counts.drawAt, zone)}) · scene ${counts.scene} (${scene}last ${timeWords(counts.sceneAt, zone)})`
}

// The last draw that threw, or none.
export function failureWords(failed: Failed | undefined, zone: number): string {
  if (failed === undefined) return 'none'
  const where = `${failed.lens}${failed.view === '' ? '' : ` (${failed.view})`}`
  const times = failed.count === 1 ? 'once' : `${failed.count} times`
  return `${where} failed ${times}, last at ${timeWords(failed.at, zone)}: ${failed.error}; ${failed.plain ? 'the plain block stands' : 'Public was drawn instead'}`
}
