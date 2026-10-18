import { statusKind, taskDetail, taskLine } from '../model/task'
import type { Task } from '../model/task'
import { LOOK } from './look'
import { THEME } from './theme'

// The colors of a task's one line: the theme's keys in an app (order D1; the plain text takes no color of its own), the
// host's theme keys in the terminal.
const PALETTES = {
  glass: { text: undefined, ok: THEME.ok, fault: THEME.fault, dim: THEME.dim },
  look: { text: undefined, ok: LOOK.ok, fault: LOOK.fault, dim: LOOK.quiet },
}

type TaskViewProps = {
  ui: { Box: any; Text: any }
  task: Task
  roomFiles?: Record<string, string>
  at: string
  isGlass: boolean
}

// The pieces of a task's line as Text, from the egress layout `task` (the room's file, a disc's, else the pane's): the
// name bold in the text color, the status in the color of its kind (ok for completed, fault for failed, dim for any
// other), the fixed words of the layout in the text color and any other piece dim. A key the task lacks is `[key]`, dim.
export function taskPieces({ ui, task, roomFiles, at, isGlass }: TaskViewProps) {
  const { Text } = ui
  const palette = isGlass ? PALETTES.glass : PALETTES.look
  const color = (value: string | undefined) => (value === undefined ? {} : { color: value })
  return taskLine(task, roomFiles).pieces.flatMap((piece, i) => {
    const key = `task-${at}-${i}`
    if (piece.type === 'text') {
      const words = piece.words.trim()
      return words === '' ? [] : [<Text key={key} {...color(palette.text)}>{words}</Text>]
    }
    if (piece.type === 'gap') return [<Text key={key} {...color(palette.dim)}>{`[${piece.key}]`}</Text>]
    const name = piece.key.toLowerCase()
    if (name === 'name') {
      return [
        <Text key={key} bold {...color(palette.text)}>
          {piece.words}
        </Text>,
      ]
    }
    return [
      <Text key={key} {...color(name === 'status' ? palette[statusKind(piece.words)] : palette.dim)}>
        {piece.words}
      </Text>,
    ]
  })
}

// The words of a task's one line as one string, for the label of a Button of the app (a label is no Text of colors).
export function taskLabel({ task, roomFiles }: { task: Task; roomFiles?: Record<string, string> }): string {
  return taskLine(task, roomFiles)
    .pieces.map(piece => (piece.type === 'gap' ? `[${piece.key}]` : piece.type === 'text' ? piece.words.trim() : piece.words))
    .filter(words => words !== '')
    .join(' ')
    .replace(/ ([.,;:!?])/g, '$1')
}

// The one line a task notification is: its pieces in a row.
export function taskRowView(props: TaskViewProps) {
  const { Box } = props.ui
  return (
    <Box key={`task-${props.at}`} flexDirection="row" columnGap={1}>
      {taskPieces(props)}
    </Box>
  )
}

// Under Operator alone: the ids and the output file of the task, one dim line each.
export function taskDetailView({ ui, task, at }: { ui: { Text: any }; task: Task; at: string }) {
  const { Text } = ui
  return taskDetail(task).map((line, i) => (
    <Text key={`task-detail-${at}-${i}`} color={LOOK.quiet}>
      {line}
    </Text>
  ))
}
