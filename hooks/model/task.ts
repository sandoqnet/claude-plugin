// A task notification as the pane draws it (order B-S7 amend): the harness wraps a background task's end in
// a <task-notification> block, and the pane draws it from an egress layout named `task`, never as the raw block. Pure,
// no `$`, no view. Run by `node` too (walk.ts imports it): no enums, `import type`, `.ts` in imports.
import { fillBlock, layersOf, pickBlockLayout } from './layouts.ts'
import type { BlockInput, BlockPiece, Layer } from './layouts.ts'

// What the harness puts in the block: the task's id, the tool call that started it, its status, the file its output
// went to and a summary line. The pane takes the name from the summary, and the rest as the layout's keys.
export type Task = { name: string; status: string; ids: [string, string][]; output: string }

// The taxonomy a task is drawn as: the kind a room's or a disc's layout file names in its `when`.
export const TASK_KIND = 'harness::task::notification'

// The layout the pane holds until a room or a program carries its own `task` layout in its egress/ folder, in this
// very form (a cha block: the notation line, a fence, one sentence). A program hands the pane a file whose block says
// `when: "kind harness::task::notification"` and a sentence of these pieces: {name}, {status}, {task-id},
// {tool-use-id}, {output-file}; the room's own file wins over a disc's, and a disc's over this.
export const TASK_LAYOUT = [
  '//////////////////////////////////task/{ egress::kind::layout }//',
  '```yaml',
  'kind: "task"',
  `when: "kind ${TASK_KIND}"`,
  '```',
  '{name} {status}',
].join('\n')

const openTag = (tag: string): RegExp => new RegExp(`<${tag}(?:\\s[^<>]*)?>([\\s\\S]*?)</${tag}>`)
const oneLine = (text: string): string => text.split(/\s+/).filter(word => word !== '').join(' ')

// The text of the first tag of that name, on one line, '' when there is none.
function tagText(text: string, tag: string): string {
  const found = openTag(tag).exec(text)?.[1]
  return found === undefined ? '' : oneLine(found)
}

// The task's name: the summary without its ending, the status word and what follows it ("Background command "claude
// plugin test" completed (exit code 0)" is the task "Background command "claude plugin test""). A summary that does
// not say the status is the name whole.
function nameOf(summary: string, status: string): string {
  if (status === '') return summary
  const ending = new RegExp(`\\s+${status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^"]*$`, 'i')
  const cut = summary.replace(ending, '').trim()
  return cut === '' ? summary : cut
}

const IDS: [string, string][] = [
  ['task', 'task-id'],
  ['tool call', 'tool-use-id'],
]

// The parts of a task notification, or none for any other text: it opens, trimmed, with the tag.
export function taskOf(text: string): Task | undefined {
  if (!/^<task-notification(?=[\s>])/.test(text.trim())) return undefined
  const status = tagText(text, 'status')
  const summary = tagText(text, 'summary')
  const ids = IDS.flatMap(([label, tag]): [string, string][] => (tagText(text, tag) === '' ? [] : [[label, tagText(text, tag)]]))
  return { name: nameOf(summary, status), status, ids, output: tagText(text, 'output-file') }
}

// The task as a block of the taxonomy: its name is the first term, the rest keys of its fence, so a layout's pieces
// are {name} and the keys as the harness names them.
export function taskBlock(task: Task): BlockInput {
  const fence: Record<string, unknown> = { status: task.status, 'output-file': task.output }
  for (const [label, tag] of IDS) fence[tag] = task.ids.find(([name]) => name === label)?.[1] ?? ''
  for (const key of Object.keys(fence)) if (fence[key] === '') delete fence[key]
  return { terms: task.name === '' ? [] : [task.name], taxonomy: TASK_KIND, fence, body: '' }
}

const PANE_LAYER: Layer = { source: 'pane', label: '', files: { 'task.md': TASK_LAYOUT } }

// The pieces of the one line a task is, from the layout the layers give: the room's own, then each disc's, then the
// pane's. `name` is the file that gave it, as the operator face names a layout.
export function taskLine(task: Task, roomFiles: Record<string, string> = {}): { pieces: BlockPiece[]; name: string } {
  const block = taskBlock(task)
  const picked = pickBlockLayout(block, [...layersOf(roomFiles), PANE_LAYER])
  // The pane's own layer draws every task, so a pick is always there; the name alone is the guard.
  if (picked === undefined) return { pieces: [{ type: 'said', key: 'name', words: task.name, source: 'pane' }], name: '' }
  return { pieces: fillBlock(picked.layout, block), name: picked.name }
}

// How a status is drawn: ok for completed, fault for failed, dim for any other.
export type StatusKind = 'ok' | 'fault' | 'dim'
export const statusKind = (status: string): StatusKind => {
  const word = status.trim().toLowerCase()
  return word === 'completed' ? 'ok' : word === 'failed' ? 'fault' : 'dim'
}

// What the operator face shows of a task under its line, dim: the ids and the output file, one line each.
export const taskDetail = (task: Task): string[] => [...task.ids.map(([label, id]) => `${label} ${id}`), ...(task.output === '' ? [] : [`output ${task.output}`])]
