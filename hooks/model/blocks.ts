// The walk file format, block by block. Pure, with no `$`, so tests call it directly. Run by `node`
// too (the hooks import it): no enums, `import type` for types, `.ts` in imports.
//
// A walk is a cha document: a header line `///words/{ chi::che::cho }///` and a ```yaml fence of keys
// (id, ms, parent, ...) per block, nested by `parent`. Change this file when the format changes.

export const CARD_PREVIEW = 40

export type Block = {
  words: string
  chi: string
  che: string
  cho: string
  fence: Record<string, unknown>
  body: string
  // The block as written: its header line, its fence lines, and the slashes that open and close the header.
  header: string
  fenceLines: string[]
  lead: number
  close: number
}

const HEADER = /^(\/{2,})(.*)\/\{\s*([^:}\s]+)::([^:}\s]+)::([^}\s]+)\s*\}(\/{2,})\s*$/

// A ULID token with the space before it: the reader never sees it. `@cha:ULID` goes too.
export const stripUlid = (text: string): string => text.replace(/\s*@(?:cha:)?[0-9A-Za-z]{20,}/g, '')

export function preview(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > CARD_PREVIEW ? `${flat.slice(0, CARD_PREVIEW).trimEnd()} …` : flat
}

export const fmtMs = (ms: number): string => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`)

// A fence value is a JSON scalar or array in practice; anything else stays the raw text.
function fenceValue(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

// A body line the door wrote with one extra leading backslash is read back without it.
const unescapeLine = (line: string): string => (line.startsWith('\\') ? line.slice(1) : line)

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  let inFence = false
  let hasFence = false
  let current: Block | undefined
  for (const line of text.split('\n')) {
    if (inFence) {
      if (line.startsWith('```')) {
        inFence = false
        continue
      }
      if (current) current.fenceLines.push(line)
      const hit = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
      if (hit && current) current.fence[hit[1]] = fenceValue(hit[2].trim())
      continue
    }
    const head = line.match(HEADER)
    if (head) {
      current = {
        words: head[2],
        chi: head[3],
        che: head[4],
        cho: head[5],
        fence: {},
        body: '',
        header: line,
        fenceLines: [],
        lead: head[1].length,
        close: head[6].length,
      }
      hasFence = false
      blocks.push(current)
    } else if (line.startsWith('```') && current && !hasFence) {
      inFence = true
      hasFence = true
    } else if (current) {
      current.body += `${current.body === '' ? '' : '\n'}${unescapeLine(line)}`
    }
  }
  for (const block of blocks) block.body = block.body.trim()
  return blocks
}

export const fenceText = (block: Block, key: string): string => {
  const value = block.fence[key]
  return value === undefined ? '' : String(value)
}
export const idOf = (block: Block): string => fenceText(block, 'id')
export const parentOf = (block: Block): string => fenceText(block, 'parent')

// A block id as a decision's words hold it first: `@ULID/Ardalan`.
export const ID_FIRST = /^[\s/]*@([0-9A-Za-z]{20,})/

// `@ULID/Ardalan` -> Ardalan, `poster/@ULID/` -> poster, `Ardalan/@cha:ROOT` -> Ardalan
export const blockWords = (words: string): string =>
  stripUlid(words)
    .replace(/\/{2,}/g, '/')
    .replace(/^[\s/]+|[\s/]+$/g, '')

// A count and its noun: "1 fault", "2 faults", "0 faults".
export const countOf = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`

// Names as one line, as the Room place and the fold of a decision say them: up to three whole, past three the first three and the
// rest counted: "alpha, beta", "person, lexicon, syntax and 10 more".
export const namesWords = (names: string[]): string => {
  const first = names.slice(0, 3)
  const more = names.length - first.length
  return more > 0 ? `${first.join(', ')} and ${more} more` : first.join(', ')
}

// Each block's depth under its parent, in file order.
export function depthsOf(blocks: Block[]): number[] {
  const depthById = new Map<string, number>()
  return blocks.map(block => {
    const parent = parentOf(block)
    const depth = parent !== '' && depthById.has(parent) ? (depthById.get(parent) ?? 0) + 1 : 0
    depthById.set(idOf(block), depth)
    return depth
  })
}
