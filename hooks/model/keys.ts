// THE KEYS of the small terminal (order keys, pane 0.8.73): ctrl+x then d, o, s, b or n, each bound in the Chat block of his keybindings.json to a
// command of the pane (command:NAME runs the slash command as if he typed it, from the prompt). Pure: the text of his file in, the state of the five
// keys and the new text out. The pane writes the file only on his tap (hooks/register.tsx), and this file never gives a text that changes a key he
// bound to another thing: such a key is a clash, named and left as it is.

export type KeyPlace = 'desk' | 'door' | 'shelf' | 'back' | 'nudge'
export type KeyRow = { key: string; command: string; place: KeyPlace }

// The five keys as one table: the chord, the command it runs and the place it opens.
export const KEYS: readonly KeyRow[] = [
  { key: 'ctrl+x d', command: 'room-desk', place: 'desk' },
  { key: 'ctrl+x o', command: 'room-door', place: 'door' },
  { key: 'ctrl+x s', command: 'room-shelf', place: 'shelf' },
  { key: 'ctrl+x b', command: 'room-back', place: 'back' },
  { key: 'ctrl+x n', command: 'room-nudge', place: 'nudge' },
]
// The keys the key line shows after its prefix; the prefix stands once, dim, when all of them are set.
export const LINE_PLACES: readonly KeyPlace[] = ['desk', 'door', 'shelf', 'back']
export const KEY_PREFIX = '^x +'

const valueOf = (row: KeyRow): string => `command:${row.command}`
const normal = (key: string): string => key.trim().toLowerCase().replace(/\s+/g, ' ')

// What his file says of the five keys. `file`: none (no file, or an empty one), ok, or broken (a file that is no JSON of the shape of
// keybindings.json, or that could not be read: nothing is written to it). `set` are the keys already bound to their own command, `missing` the
// keys no Chat block binds, `clash` the keys bound to another thing, with that thing's words.
export type KeysRead = {
  file: 'none' | 'ok' | 'broken'
  set: KeyRow[]
  missing: KeyRow[]
  clash: { row: KeyRow; bound: string }[]
}

const CHAT = 'Chat'
const BOUND_MOST = 60

export function readKeys(text: string | undefined): KeysRead {
  if (text === undefined || text.trim() === '') return { file: 'none', set: [], missing: [...KEYS], clash: [] }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { file: 'broken', set: [], missing: [], clash: [] }
  }
  const blocks = (parsed as { bindings?: unknown } | null)?.bindings
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(blocks)) return { file: 'broken', set: [], missing: [], clash: [] }
  const bound = new Map<string, unknown>()
  for (const block of blocks) {
    const one = block as { context?: unknown; bindings?: unknown } | null
    if (one === null || typeof one !== 'object' || one.context !== CHAT) continue
    if (one.bindings === null || typeof one.bindings !== 'object' || Array.isArray(one.bindings)) continue
    for (const [key, value] of Object.entries(one.bindings)) if (!bound.has(normal(key))) bound.set(normal(key), value)
  }
  const set: KeyRow[] = []
  const missing: KeyRow[] = []
  const clash: { row: KeyRow; bound: string }[] = []
  for (const row of KEYS) {
    if (!bound.has(row.key)) missing.push(row)
    else if (bound.get(row.key) === valueOf(row)) set.push(row)
    else {
      const other = bound.get(row.key)
      clash.push({ row, bound: (typeof other === 'string' ? other : other === null ? 'nothing' : JSON.stringify(other)).slice(0, BOUND_MOST) })
    }
  }
  return { file: 'ok', set, missing, clash }
}

// The card of the Keys section, as the register hands it: what the last read of his file gave (none before a read), and the one line of what the last
// tap did ('' for none).
export type KeysCard = { read: KeysRead | undefined; line: string }

// The word of the state: all five set, some set, or not set. A file that cannot be read has none.
export function keysState(read: KeysRead | undefined): string {
  if (read === undefined || read.file === 'broken') return ''
  return read.set.length === KEYS.length ? 'set' : read.set.length > 0 ? 'part set' : 'not set'
}

// The key line shows its prefix when the keys of its places are all set.
export const keyLineSet = (read: KeysRead | undefined): boolean => read !== undefined && read.file !== 'broken' && LINE_PLACES.every(place => read.set.some(row => row.place === place))

// A tiny reader of the positions of a text that JSON.parse took: the objects and arrays with the span of each member, so a line is added where
// it belongs and every other character stays as it was.
type Node = { kind: 'object' | 'array' | 'string' | 'other'; start: number; end: number; value?: string; members: { key: string; keyStart: number; val: Node }[]; items: Node[] }

function spansOf(text: string): Node {
  let at = 0
  const skip = (): void => {
    while (at < text.length && /\s/.test(text[at])) at += 1
  }
  const string = (): Node => {
    const start = at
    at += 1
    while (text[at] !== '"') at += text[at] === '\\' ? 2 : 1
    at += 1
    return { kind: 'string', start, end: at, value: JSON.parse(text.slice(start, at)) as string, members: [], items: [] }
  }
  const value = (): Node => {
    skip()
    const start = at
    if (text[at] === '"') return string()
    if (text[at] === '{') {
      const node: Node = { kind: 'object', start, end: 0, members: [], items: [] }
      at += 1
      for (;;) {
        skip()
        if (text[at] === '}') break
        const key = string()
        skip()
        at += 1
        node.members.push({ key: key.value ?? '', keyStart: key.start, val: value() })
        skip()
        if (text[at] === ',') at += 1
      }
      at += 1
      node.end = at
      return node
    }
    if (text[at] === '[') {
      const node: Node = { kind: 'array', start, end: 0, members: [], items: [] }
      at += 1
      for (;;) {
        skip()
        if (text[at] === ']') break
        node.items.push(value())
        skip()
        if (text[at] === ',') at += 1
      }
      at += 1
      node.end = at
      return node
    }
    while (at < text.length && !/[\s,\]}]/.test(text[at])) at += 1
    return { kind: 'other', start, end: at, members: [], items: [] }
  }
  return value()
}

const lineIndent = (text: string, at: number): string => /^[ \t]*/.exec(text.slice(text.lastIndexOf('\n', at - 1) + 1))?.[0] ?? ''
const lineOf = (row: KeyRow): string => `${JSON.stringify(row.key)}: ${JSON.stringify(valueOf(row))}`

// The text with the missing lines added to the Chat block, and the rows added. Only the missing keys are written: a set key is left, a clash is never
// written over, and every other character of the file stays. A file with no Chat block gets one block at the end of its list; no file gets a whole one.
// undefined when the file is broken, or when the text this made would not read back as the five keys all bound or clashing (nothing is then written).
export function addKeys(text: string | undefined): { text: string; added: KeyRow[] } | undefined {
  const read = readKeys(text)
  if (read.file === 'broken') return undefined
  const added = read.missing
  if (added.length === 0) return { text: text ?? '', added }
  const made = read.file === 'none' ? fresh(added) : inserted(text ?? '', added)
  if (made === undefined) return undefined
  const back = readKeys(made)
  const same = back.file === 'ok' && back.missing.length === 0 && back.set.length === read.set.length + added.length && back.clash.length === read.clash.length
  return same ? { text: made, added } : undefined
}

function fresh(rows: KeyRow[]): string {
  const lines = rows.map(row => `        ${lineOf(row)}`).join(',\n')
  return `{\n  "bindings": [\n    {\n      "context": "${CHAT}",\n      "bindings": {\n${lines}\n      }\n    }\n  ]\n}\n`
}

function inserted(text: string, rows: KeyRow[]): string | undefined {
  const root = spansOf(text)
  const list = root.members.find(member => member.key === 'bindings')?.val
  if (list === undefined || list.kind !== 'array') return undefined
  const chat = list.items.find(
    item => item.kind === 'object' && item.members.some(m => m.key === 'context' && m.val.value === CHAT) && item.members.some(m => m.key === 'bindings' && m.val.kind === 'object'),
  )
  const target = chat?.members.find(member => member.key === 'bindings')?.val
  if (target !== undefined) return into(text, target, rows)
  return block(text, list, rows)
}

// The lines added to an object of bindings: after its last member (the comma and the line, in the member's own indent), or inside an empty one.
function into(text: string, object: Node, rows: KeyRow[]): string {
  const last = object.members.at(-1)
  const multi = last !== undefined ? text.slice(object.start, last.keyStart).includes('\n') : text.slice(object.start, object.end).includes('\n')
  if (last !== undefined) {
    const join = multi ? `,\n${lineIndent(text, last.keyStart)}` : ', '
    return `${text.slice(0, last.val.end)}${join}${rows.map(lineOf).join(join)}${text.slice(last.val.end)}`
  }
  if (!multi) return `${text.slice(0, object.start)}{ ${rows.map(lineOf).join(', ')} }${text.slice(object.end)}`
  const close = lineIndent(text, object.end - 1)
  const indent = `${close}  `
  return `${text.slice(0, object.start)}{\n${rows.map(row => `${indent}${lineOf(row)}`).join(',\n')}\n${close}}${text.slice(object.end)}`
}

// A whole Chat block added at the end of the list of blocks.
function block(text: string, list: Node, rows: KeyRow[]): string {
  const last = list.items.at(-1)
  const multi = last !== undefined ? text.slice(list.start, last.start).includes('\n') : text.slice(list.start, list.end).includes('\n')
  const indent = last !== undefined ? lineIndent(text, last.start) : `${lineIndent(text, list.start)}  `
  const inner = `${indent}  `
  const made = `{\n${inner}"context": "${CHAT}",\n${inner}"bindings": {\n${rows.map(row => `${inner}  ${lineOf(row)}`).join(',\n')}\n${inner}}\n${indent}}`
  if (last !== undefined) return `${text.slice(0, last.end)},${multi ? `\n${indent}` : ' '}${made}${text.slice(last.end)}`
  const close = lineIndent(text, list.end - 1)
  return `${text.slice(0, list.start)}[\n${indent}${made}\n${close}]${text.slice(list.end)}`
}
