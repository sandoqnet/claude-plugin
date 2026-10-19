// THE SHAPE ASK, opened from the desk (plan terminal-pane, step 3): the keeper proposes to make a shape (a todo) of an entry of his, and the card is the
// gate view of that ask: who proposes and the age, the title as the press says it (`Make a todo: TITLE`), his words, the why, and two presses, Yes
// (Make) and No (Leave), the one the ask leans to primary. A line under them says which choice each sends. The ask is one tap: after it the presses are
// gone and a line says it was sent, until the feed is read with the decided block, which a line then says, with no press. In the terminal Yes holds the
// hotkey `y` and No `n`; the app holds none. Pure draw: the register gives the data and the tap.
import { ageWords } from '../model/profile'
import { shapeWords } from '../model/roomfeed'
import type { ShapeAsk } from '../model/roomfeed'
import { LOOK } from './look'
import { THEME, cardProps, picksProps } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

export const YES = 'Yes'
export const NO = 'No'
// The word each press sends: the two choices of the ask.
export const MAKE = 'Make'
export const LEAVE = 'Leave'
export const SHAPE_YES_KEY = 'y'
export const SHAPE_NO_KEY = 'n'
export const SHAPE_SENT = 'Sent. The door has not written the answer yet.'
export const SHAPE_CHOICES = `${YES} sends ${MAKE}. ${NO} sends ${LEAVE}.`

// Which press is the primary one: the choice the ask leans to (Make where it says none).
export const leansToNo = (ask: ShapeAsk): boolean => ask.lean === LEAVE

export type ShapeViewProps = {
  ui: Ui
  plan: Plan
  columns: number
  app: boolean
  ask: ShapeAsk
  now: number
  // The tap of this ask was sent and the decided block is not read yet: no press.
  sent: boolean
  actions: { tap: (choice: string) => void | Promise<void> }
}

export function shapeView({ ui, plan, columns, app, ask, now, sent, actions }: ShapeViewProps) {
  const { Box, Text, Button } = ui
  const dim = app ? THEME.dim : LOOK.quiet
  const quiet = (key: string, words: string, color: string = dim) => (
    <Text key={key} color={color} wrap="wrap">
      {words}
    </Text>
  )
  const closed = ask.decided
  const lean = leansToNo(ask)
  const words = ask.words === '' ? [] : ask.words.split('\n')
  const picks = (
    <Box key="shape-picks" {...(app ? picksProps : { flexDirection: 'row', flexWrap: 'wrap', columnGap: 2 })}>
      <Button key="shape-yes" label={YES} variant={lean ? 'secondary' : 'primary'} {...(app ? {} : { hotkey: SHAPE_YES_KEY })} onPress={() => void actions.tap(MAKE)} />
      <Button key="shape-no" label={NO} variant={lean ? 'primary' : 'secondary'} {...(app ? {} : { hotkey: SHAPE_NO_KEY })} onPress={() => void actions.tap(LEAVE)} />
    </Box>
  )
  const parts = [
    quiet('shape-who', [`${ask.by === '' ? 'it' : ask.by} proposes`, 'for you', ageWords(ask.atMs, now)].filter(part => part !== '').join(' · ')),
    <Text key="shape-title" bold wrap="wrap">
      {shapeWords(ask)}
    </Text>,
    ...words.map((line, at) => (
      <Text key={`shape-words-${at}`} wrap="wrap">
        {line === '' ? ' ' : line}
      </Text>
    )),
    ...(ask.why === '' ? [] : [quiet('shape-why', ask.why)]),
    ...(closed !== undefined
      ? [quiet('shape-decided', ['Decided', closed.choice, closed.by].filter(part => part !== '').join(' · ')), ...(closed.made === '' ? [] : [quiet('shape-made', 'The todo is made.')])]
      : sent
        ? [quiet('shape-sent', SHAPE_SENT)]
        : [picks, quiet('shape-choices', SHAPE_CHOICES)]),
  ]
  return app ? [<Box key="shape-card" {...cardProps(plan.width, columns)}>{parts}</Box>] : [<Box key="shape-card" flexDirection="column" {...LOOK.frame}>{parts}</Box>]
}
