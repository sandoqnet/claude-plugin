// The egress layouts: pure, no `$`, no view, no import from the pane's other modules. A layout is one
// flat cha block: its notation line `////NAME/{ egress::FORM::layout }//`, a yaml fence (kind, when,
// example) and a sentence of fixed words and pieces {NAME}. It draws a card's slot, or a block.

export type Source = 'room' | 'disc' | 'pane'

// The reading of one card, as the layouts take it: the act, the frames in the card's order, the root
// frame (the frame of the first verb that is not embedded in another, '' when none) and the phrases of
// its verbs with the record each one found.
export type Phrase = {
  role: string
  frame: string
  words: string
  record?: { id: string; name: string; chi: string; che: string }
  isNew: boolean
  by: string
}
export type Reading = { act: string; frames: string[]; root: string; phrases: Phrase[] }

// A block as a layout draws it: its terms, its taxonomy CHI::CHE::CHO, the keys of its fence and its body.
export type BlockInput = { terms: string[]; taxonomy: string; fence: Record<string, unknown>; body: string }

// `frame`, `act` and `kind` name what the layout draws; a layout of the form default has no `when`.
export type Form = 'frame' | 'act' | 'kind' | 'default'
export type When = { form: Form; name: string }
export type Part = { type: 'text'; words: string } | { type: 'role'; role: string }
// `block` is the layout's first term, its name; `ches` maps a role to its che (the syntax disc's role
// blocks), for a piece that no role names.
export type Layout = { kind: string; when: When; parts: Part[]; source: Source; block: string; ches?: Record<string, string> }

// One word names why a layout was skipped: the six of the vectors, and `when` (a when that is missing, bad
// or of another form than the block's) and `form` (no layout block in the file, or the old form).
export type FaultWord = 'unclosed' | 'stray' | 'nested' | 'name' | 'body' | 'kind' | 'when' | 'form'
export type Problem = { word: FaultWord; error: string }

// One file of a layer that could not be read; the pick goes on without it. `name` is the file, with the
// disc's name before it for a disc's file; `word` is empty for a fault that no layout caused.
export type Fault = { name: string; source: Source; error: string; word: FaultWord | '' }
export type Picked = { layout: Layout; name: string; block: string; isFallback: boolean; faults: Fault[] }

// A layer is the files of one place: the room's own or a disc's. `label` is the disc's name.
export type Layer = { source: Source; label: string; files: Record<string, string> }

type Base = { source: Source }
export type TextPiece = Base & { type: 'text'; words: string }
export type RecordPiece = Base & {
  type: 'person' | 'document'
  role: string
  words: string
  id: string
  name: string
  isNew: boolean
  by: string
}
export type ThingPiece = Base & {
  type: 'thing'
  role: string
  words: string
  id: string
  name: string
  chi: string
  isNew: boolean
  by: string
}
export type SaidPiece = Base & { type: 'said'; role: string; words: string }
export type GapPiece = Base & { type: 'gap'; role: string }
export type Piece = TextPiece | RecordPiece | ThingPiece | SaidPiece | GapPiece

// The pieces of a block carry a key of its fence (or name, id, body) where a card's carry a role.
export type BlockPiece = TextPiece | (Base & { type: 'said'; key: string; words: string }) | (Base & { type: 'gap'; key: string })

// Drawn when no layer holds a default layout, so a card always has a slot. It is the only layout the pane
// holds, and its source is the pane.
const FALLBACK: Layout = {
  kind: 'card',
  when: { form: 'default', name: '' },
  parts: [{ type: 'text', words: 'The room read this card.' }],
  source: 'pane',
  block: '',
}

const ROLE_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/
const WHEN = /^(frame|act|kind)\s+(\S+)$/i
const KIND_NAME = /^[^:\s]+::[^:\s]+::[^:\s]+$/
const FORMS = ['frame', 'act', 'kind', 'default']
// The notation line of a layout block, and any notation line (the end of a body). A line may open with
// a backslash, as the later blocks of a shelf file do.
const LAYOUT_HEADER = /^\\?\/{2,}(.*)\/\{\s*egress::([^:}\s]+)::layout\s*\}\/{2,}\s*$/
const ANY_HEADER = /^\\?\/{2,}.*\{\s*[^:}\s]+::[^:}\s]+::[^}\s]+\s*\}\/{2,}\s*$/
const AT_ULID = /^@[0-9A-Za-z]{20,}$/

const squash = (text: string): string => text.replace(/\s+/g, ' ').trim()
const lower = (text: unknown): string => String(text ?? '').toLowerCase()

// The sentence into fixed words and pieces; a brace that is not closed, a closing brace with no opening
// one, a brace in a brace and a bad name are each named by their place.
function parseSentence(sentence: string): Part[] | Problem {
  const parts: Part[] = []
  let words = ''
  let at = 0
  while (at < sentence.length) {
    const char = sentence[at]
    if (char === '}') return { word: 'stray', error: `stray closing brace at ${at + 1}` }
    if (char !== '{') {
      words += char
      at += 1
      continue
    }
    const next = sentence.slice(at + 1).search(/[{}]/)
    if (next < 0) return { word: 'unclosed', error: `unclosed brace at ${at + 1}` }
    if (sentence[at + 1 + next] === '{') return { word: 'nested', error: `brace inside a brace at ${at + 1}` }
    const role = sentence.slice(at + 1, at + 1 + next).trim()
    if (!ROLE_NAME.test(role)) return { word: 'name', error: `bad role name "${role}" at ${at + 1}` }
    if (words !== '') parts.push({ type: 'text', words })
    words = ''
    parts.push({ type: 'role', role })
    at += next + 2
  }
  if (words !== '') parts.push({ type: 'text', words })

  return parts
}

const quoted = (value: string): string => {
  const text = value.trim()
  const first = text[0]

  return text.length >= 2 && (first === '"' || first === "'") && text.endsWith(first) ? text.slice(1, -1) : text
}

// The when of a layout of FORM, or the problem that names why it is none.
function parseWhen(form: string, text: string | undefined): When | Problem {
  if (form === 'default') {
    return text === undefined ? { form: 'default', name: '' } : { word: 'when', error: `a default layout has no when, and this one says "${text}"` }
  }
  if (text === undefined) return { word: 'when', error: 'no when in the fence' }
  const found = WHEN.exec(text.trim())
  if (!found) return { word: 'when', error: `when "${text}" is not "frame NAME", "act NAME" or "kind CHI::CHE::CHO"` }
  if (lower(found[1]) !== form) return { word: 'when', error: `when "${text}" is of the form ${lower(found[1])}, and the block says ${form}` }
  if (form === 'kind' && !KIND_NAME.test(found[2])) return { word: 'when', error: `when "${text}" does not name CHI::CHE::CHO` }

  return { form: form as Form, name: found[2] }
}

// The layouts of one file in file order, and the problem of each block that is bad. The old form (front
// matter) is no longer read: it is one problem. Prose around the blocks is a note. Never throws.
export function parseLayouts(text: string, source: Source): { layouts: Layout[]; problems: Problem[] } {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n')
  const layouts: Layout[] = []
  const problems: Problem[] = []
  if (lines.find(line => line.trim() !== '')?.trim() === '---') {
    problems.push({ word: 'form', error: 'front matter is not read: a layout is a cha block' })
    return { layouts, problems }
  }
  let at = 0
  while (at < lines.length) {
    const header = LAYOUT_HEADER.exec(lines[at])
    at += 1
    if (!header) continue
    const form = lower(header[2])
    const block = header[1].split('/')[0].trim()
    const fence: Record<string, string> = {}
    if (/^```/.test(lines[at] ?? '')) {
      at += 1
      while (at < lines.length && !/^```\s*$/.test(lines[at])) {
        const key = /^\s*([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/.exec(lines[at])
        if (key) fence[lower(key[1])] = quoted(key[2])
        at += 1
      }
      at += 1
    }
    const body: string[] = []
    while (at < lines.length && lines[at].trim() !== '' && !ANY_HEADER.test(lines[at])) {
      body.push(lines[at])
      at += 1
    }
    const bad = (problem: Problem) => problems.push(problem)
    if (!FORMS.includes(form)) {
      bad({ word: 'form', error: `egress::${header[2]}::layout is not frame, act, kind or default` })
      continue
    }
    if (block === '') {
      bad({ word: 'form', error: 'the layout has no name' })
      continue
    }
    if (!fence.kind) {
      bad({ word: 'kind', error: 'no kind in the fence' })
      continue
    }
    const when = parseWhen(form, fence.when)
    if ('word' in when) {
      bad(when)
      continue
    }
    const sentence = squash(body.join(' '))
    if (sentence === '') {
      bad({ word: 'body', error: 'no sentence' })
      continue
    }
    const parts = parseSentence(sentence)
    if (!Array.isArray(parts)) {
      bad(parts)
      continue
    }
    layouts.push({ kind: fence.kind, when, parts, source, block })
  }
  if (layouts.length === 0 && problems.length === 0) problems.push({ word: 'form', error: 'no layout block in the file' })

  return { layouts, problems }
}

const keyOf = (when: When): string => (when.form === 'default' ? 'default' : `${when.form}:${lower(when.name)}`)

type Indexed = Map<string, { layout: Layout; name: string }>

// A layer's layouts by what they draw: the first by file name, then the first in the file, wins a when.
// A bad block is a fault, named by its file.
function indexLayer(layer: Layer, faults: Fault[]): Indexed {
  const found: Indexed = new Map()
  for (const file of Object.keys(layer.files ?? {}).sort()) {
    const name = layer.label === '' ? file : `${layer.label}/${file}`
    const { layouts, problems } = parseLayouts(layer.files[file], layer.source)
    for (const problem of problems) faults.push({ name, source: layer.source, error: problem.error, word: problem.word })
    for (const layout of layouts) if (!found.has(keyOf(layout.when))) found.set(keyOf(layout.when), { layout, name })
  }

  return found
}

// What the pane reads of a run folder, as one record: the room's own files by bare name, then each disc's
// by its path under unpacked/ (`DISC/egress/FILE.md` a layout file, `DISC/shelf/class.md` the class file
// whose role blocks give the ches), the discs in the order they are to be looked at. The pane carries no
// layer of its own.
export function layersOf(files: Record<string, string>): Layer[] {
  const room: Record<string, string> = {}
  const discs = new Map<string, Record<string, string>>()
  for (const [path, text] of Object.entries(files ?? {})) {
    const at = path.indexOf('/')
    if (at < 0) {
      room[path] = text
      continue
    }
    const disc = path.slice(0, at)
    const rest = path.slice(at + 1)
    if (!rest.startsWith('egress/')) continue
    discs.set(disc, { ...(discs.get(disc) ?? {}), [rest.slice('egress/'.length)]: text })
  }

  return [
    { source: 'room', label: '', files: room },
    ...[...discs].map(([label, layer]): Layer => ({ source: 'disc', label, files: layer })),
  ]
}

// The names of the discs the room lays under its own, from its class.md: the block `discs` of the form
// class::list::rule holds them in a fence key `names`, the earlier laid first.
export function discNamesOf(classText: string): string[] {
  const lines = String(classText ?? '').split('\n')
  const at = lines.findIndex(line => /^\\?\/{2,}\s*discs\s*\/\{\s*class::list::rule\s*\}\/{2,}\s*$/.test(line))
  if (at < 0) return []
  for (let i = at + 1; i < lines.length && !ANY_HEADER.test(lines[i]); i += 1) {
    const found = /^\s*names\s*:\s*\[(.*)\]\s*$/.exec(lines[i])
    if (found) return [...found[1].matchAll(/"([^"]+)"|'([^']+)'/g)].map(match => match[1] ?? match[2])
  }

  return []
}

// The names of the discs of the room as `sandoq room discs` says them (order RD1): its out is ONE line, one json object with the key
// `discs`, a list of disc names in the order the door lays them, and its exit code is 0. The names, or nothing (undefined) for any other
// shape: an exit code that is not 0 (2 is an older sandoq, 1 a room not born or with an older room-seat disc), an out that is no json,
// no object, or a `discs` that is not a list of words (a word is a name that opens with a letter or a digit and holds no slash, so it
// can stand in a path). An empty list is an answer: the room has no disc besides its own.
const CALL_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/
export function roomDiscNamesOf(out: string, exitCode: number | undefined): string[] | undefined {
  if (exitCode !== 0) return undefined
  let read: unknown
  try {
    read = JSON.parse(String(out ?? '').trim())
  } catch {
    return undefined
  }
  if (typeof read !== 'object' || read === null || Array.isArray(read)) return undefined
  const discs = (read as { discs?: unknown }).discs
  if (!Array.isArray(discs) || !discs.every(name => typeof name === 'string' && CALL_NAME.test(name))) return undefined

  return [...discs]
}

// The role blocks of the class files in the record of layersOf: `NAME/{ role::CHE::rule }` says that the
// role NAME is of the che CHE. The first block of a name wins, the discs in the order they are looked at.
export function chesOf(files: Record<string, string>): Record<string, string> {
  const ches: Record<string, string> = {}
  for (const [path, text] of Object.entries(files ?? {})) {
    if (!path.endsWith('/shelf/class.md')) continue
    for (const line of String(text).split('\n')) {
      const found = /^\\?\/{2,}\s*([^/{\s][^/{]*?)\s*\/\{\s*role::([^:}\s]+)::rule\s*\}\/{2,}\s*$/.exec(line)
      if (found && !(lower(found[1]) in ches)) ches[lower(found[1])] = lower(found[2])
    }
  }

  return ches
}

// The layout that draws a card, from the layers: the specificity is the outer order, the layer the inner.
// A match of the root frame, then of the act, then the default; at each step the layers in turn. An
// embedded frame never picks the sentence: it is drawn only inside its root. A bad block is skipped and
// named in the faults. The layout comes with the ches, for the pieces that no role names.
export function pickIn(reading: Reading, layers: Layer[], ches: Record<string, string> = {}): Picked {
  const faults: Fault[] = []
  const indexed = layers.map(layer => indexLayer(layer, faults))
  const wanted = [
    ...(reading?.root ? [`frame:${lower(reading.root)}`] : []),
    `act:${lower(reading?.act)}`,
    'default',
  ]
  for (const name of wanted) {
    for (const layer of indexed) {
      const hit = layer.get(name)
      if (hit) return { layout: { ...hit.layout, ches }, name: hit.name, block: hit.layout.block, isFallback: false, faults }
    }
  }
  faults.push({ name: 'default', source: 'pane', error: 'no default layout', word: '' })

  return { layout: { ...FALLBACK, ches }, name: 'default', block: '', isFallback: true, faults }
}

// The same for the files the pane reads: the room's own and the discs' (see layersOf). With none that
// draws the card, the fixed fallback and its fault.
export function pickLayout(reading: Reading, files: Record<string, string>): Picked {
  return pickIn(reading, layersOf(files), chesOf(files))
}

// The pieces of a layout in sentence order. A piece takes the first phrase whose role is its name, else
// the first whose role's che is its name. A layout of a frame takes its phrases from that frame alone; an
// act or default layout from any frame. A piece's role is as the layout writes it.
export function fill(layout: Layout, reading: Reading, ches?: Record<string, string>): Piece[] {
  const all = reading?.phrases ?? []
  const frame = lower(layout.when.name)
  const phrases = layout.when.form === 'frame' ? all.filter(one => lower(one.frame) === frame) : all
  const cheOf: Record<string, string> = {}
  for (const [role, che] of Object.entries(ches ?? layout.ches ?? {})) cheOf[lower(role)] = lower(che)

  return layout.parts.map((part): Piece => {
    const source = layout.source
    if (part.type === 'text') return { type: 'text', words: part.words, source }
    const name = lower(part.role)
    const phrase = phrases.find(one => lower(one.role) === name) ?? phrases.find(one => cheOf[lower(one.role)] === name)
    if (!phrase) return { type: 'gap', role: part.role, source }
    const record = phrase.record
    if (!record) return { type: 'said', role: part.role, words: phrase.words, source }
    const same = {
      role: part.role,
      words: phrase.words,
      id: record.id,
      name: record.name,
      isNew: phrase.isNew,
      by: phrase.by,
      source,
    }
    if (record.chi === 'person') return { type: 'person', ...same }
    if (record.chi === 'document') return { type: 'document', ...same }

    return { type: 'thing', ...same, chi: record.chi }
  })
}

export type PickedBlock = { layout: Layout; name: string; block: string; faults: Fault[] }

// The kind layout that draws a block, from the layers: its own CHI::CHE::CHO, then the che's chi from
// `chis` (che to chi) with the same che and cho, then CHI::*::CHO. None when no layout draws it: the
// block is drawn as the renderer draws it without one.
export function pickBlockLayout(block: BlockInput, layers: Layer[], chis: Record<string, string> = {}): PickedBlock | undefined {
  const [chi, che, cho] = String(block?.taxonomy ?? '').split('::')
  if (!chi || !che || !cho) return undefined
  const chiOf = Object.entries(chis ?? {}).find(([name]) => lower(name) === lower(che))?.[1]
  const wanted = [
    `kind:${lower(`${chi}::${che}::${cho}`)}`,
    ...(chiOf === undefined ? [] : [`kind:${lower(`${chiOf}::${che}::${cho}`)}`]),
    `kind:${lower(`${chi}::*::${cho}`)}`,
  ]
  const faults: Fault[] = []
  const indexed = layers.map(layer => indexLayer(layer, faults))
  for (const name of wanted) {
    for (const layer of indexed) {
      const hit = layer.get(name)
      if (hit) return { layout: hit.layout, name: hit.name, block: hit.layout.block, faults }
    }
  }

  return undefined
}

// The pieces of a layout filled from a block. {name} is its first term, {id} its second when that is an
// at-sign ULID, {body} its body, any other name a key of its fence; a list is its items joined by a comma
// and a space, and a key the block lacks is a gap.
export function fillBlock(layout: Layout, block: BlockInput): BlockPiece[] {
  const fence: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(block?.fence ?? {})) fence[lower(key)] = value
  const terms = block?.terms ?? []
  const wordsOf = (key: string): string | undefined => {
    if (key === 'name') return terms[0] ?? undefined
    if (key === 'id') return AT_ULID.test(terms[1] ?? '') ? terms[1] : undefined
    if (key === 'body') return block?.body ?? undefined
    const value = fence[key]
    if (value === undefined || value === null) return undefined

    return Array.isArray(value) ? value.map(String).join(', ') : String(value)
  }

  return layout.parts.map((part): BlockPiece => {
    const source = layout.source
    if (part.type === 'text') return { type: 'text', words: part.words, source }
    const words = wordsOf(lower(part.role))

    return words === undefined ? { type: 'gap', key: part.role, source } : { type: 'said', key: part.role, words, source }
  })
}
