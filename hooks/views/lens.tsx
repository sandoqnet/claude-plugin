import { isApp } from './glass'
import type { Plan } from './space'
import { THEME, cardProps, picksProps } from './theme'
import type { Face, Ui } from './types'

const TITLE = 'Lens'
const NOTE = 'Public shows what waits on you. Operator shows the whole room.'

export type LensProps = {
  ui: Ui
  surface?: string
  // The width of the column the card stands in, in cells; with none a card is as wide as it was. The plan's width wins over it, and
  // the pane's columns set the card's side padding.
  width?: number
  plan?: Plan
  columns?: number
  // The lenses the settings leave shown (Public always) and the one that is shown.
  lenses: Face[]
  face: Face
  // Under Operator the Room place has its way in, here: nothing else of the frame holds it.
  roomShown: boolean
  actions: { setFace: (face: Face) => void | Promise<void>; openRoom: () => void | Promise<void> }
}

const cap = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

// The lens pick of Settings (order D1: with the head gone from the app's place, the lens is picked here, and the tray shows its
// word while it is not the plain one). One Button for each lens the settings leave shown, the shown one the app's own, a press
// sets it and the pane stays in Settings. Under Operator the card also holds "Room", the way into the Room place. Every Button is
// its label alone. In the terminal the head's tabs keep the pick, so the card is the app's.
export function lensView({ ui, surface, width: given, plan, columns, lenses, face, roomShown, actions }: LensProps) {
  const { Box, Text, Button } = ui
  if (!isApp(surface)) return []
  return [
    <Box key="settings-lens" {...cardProps(plan?.width ?? given, columns)}>
      <Box key="head-lens" flexDirection="column">
        <Text bold>{TITLE}</Text>
        <Text color={THEME.dim} wrap="wrap">
          {NOTE}
        </Text>
      </Box>
      <Box key="lens-picks" {...picksProps}>
        {lenses.map(name =>
          name === face ? (
            <Button key={`face-${name}`} label={cap(name)} onPress={() => void actions.setFace(name)} />
          ) : (
            <Button key={`face-${name}`} variant="secondary" label={cap(name)} onPress={() => void actions.setFace(name)} />
          ),
        )}
        {roomShown && <Button key="room" variant="secondary" label="Room" onPress={() => void actions.openRoom()} />}
      </Box>
    </Box>,
  ]
}
