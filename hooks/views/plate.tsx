import { clockText, dateText, heldText } from '../model/settings'
import type { Corner, Settings } from '../model/settings'
import { GLASS, isApp } from './glass'
import { layerWidth } from './space'
import type { Ui } from './types'

export type PlateProps = {
  ui: Ui
  // The host's surface: the plate is drawn in an app alone.
  surface?: string
  settings: Settings
  // The time the plate says, in ms, and the offset of the clock from UTC, in minutes.
  now: number
  zone: number
  // The size of the pane in cells; the pane's own defaults when none.
  bodyColumns?: number
  rows?: number
}

// The card column of the place: layerWidth of space.ts wide, two cells from the left.
const COLUMN_LEFT = 2
// The border and the padding of the plate: a cell of border and two of padding at each side.
const FRAME = 6
// The rows the pane keeps for its edge, and the least the scene is high (see sceneSize).
const EDGE = 2
const LEAST = 24

// The corner of the plate: the clock's, and the date's when the clock is off; off when both are.
const cornerOf = (settings: Settings): Corner => (settings.clock !== 'off' ? settings.clock : settings.date)

// The plate (order B-P7): one small glass Box on the wall that says the time and the date, drawn in an app over
// the scene. It is the pane's own and holds no card. It sits at the corner the clock sets (the date's when the
// clock is off), in cells from the pane's columns and rows, clear of the card column at the left: a left
// corner starts right after the column, a right corner ends two cells from the right. Its lines are right
// aligned: the time big and bold (HH:MM, 24 hours) when the clock is on, the date dim ("Monday 12 Oct") when
// the date is on, and "held at noon" dim while the hour is held. Returns none when the date and the clock are
// both off, in the terminal (no absolute Box), and in a pane too narrow to hold it clear of the cards. This
// host (the CLI) cannot draw the app branch.
export function plateView({ ui, surface, settings, now, zone, bodyColumns = 80, rows = 30 }: PlateProps) {
  const { Box, Text } = ui
  const corner = cornerOf(settings)
  if (!isApp(surface) || corner === 'off') return undefined
  const time = settings.clock !== 'off' ? clockText(now, zone) : ''
  const date = settings.date !== 'off' ? dateText(now, zone) : ''
  const held = heldText(settings)
  const lines = [time, date, held].filter(line => line !== '')
  if (lines.length === 0) return undefined

  const width = Math.max(...lines.map(line => line.length)) + FRAME
  const height = lines.length + 2
  const clear = COLUMN_LEFT + layerWidth(bodyColumns) + 1
  const right = bodyColumns - width - 2
  if (right < clear) return undefined
  const left = corner === 'top right' || corner === 'bottom right' ? right : clear
  const usable = Math.max(LEAST, rows - EDGE)
  const top = corner === 'top left' || corner === 'top right' ? 1 : Math.max(1, usable - height - 1)

  return (
    <Box
      key="plate"
      position="absolute"
      top={top}
      left={left}
      width={width}
      flexDirection="column"
      alignItems="flex-end"
      borderStyle="round"
      borderColor={GLASS.line}
      backgroundColor={GLASS.ground}
      paddingX={2}
    >
      {time !== '' && (
        <Text key="plate-time" bold color={GLASS.text}>
          {time}
        </Text>
      )}
      {date !== '' && (
        <Text key="plate-date" color={GLASS.dim}>
          {date}
        </Text>
      )}
      {held !== '' && (
        <Text key="plate-held" color={GLASS.dim}>
          {held}
        </Text>
      )}
    </Box>
  )
}
