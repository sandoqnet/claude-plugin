// THE ROOM FLOW (order PF2, Ardalan's Pane flows), drawn: the name step, the confirm step and the making step of a room made from the pane, in the place of the Button that
// stood alone, and the landing band of the room made. It holds no process: its presses are the register's (`Maker`, `Landing` of types.ts), and its words are model/roomflow.ts's.
import { BORN_DISC, BORN_OK, CONFIRM_BACK, CONFIRM_FOOT, CONFIRM_GO, MAKING_FOOT, NAME_CANCEL, NAME_HINT, NAME_INTRO, NAME_LABEL, NAME_NEXT, NAME_TITLE, START_HERE, WILL, bornDoor, bornTitle, confirmIntro, confirmTitle, joinsLine, makeSteps, offeredName } from '../model/roomflow'
import { MAKING, linesAtWord } from '../model/roomstart'
import { isApp } from './glass'
import { LOOK } from './look'
import { SPACE } from './space'
import { THEME, cardProps, innerOf } from './theme'
import type { Landing, Maker, Ui } from './types'

export type MakerFlowProps = { ui: Ui; surface?: string; maker: Maker; width: number; columns: number }

// The steps before and while the call: one card in the app (the width of the card of its place), a plain block in the terminal.
export function makerFlowView({ ui, surface, maker, width, columns }: MakerFlowProps) {
  const { Box, Text, Button, Input } = ui
  const app = isApp(surface)
  const dim = app ? THEME.dim : LOOK.quiet
  const warn = app ? THEME.warn : LOOK.warn
  // (its parts stand close, with no row of air between: the steps take few rows, and nothing scrolls)
  const frame = app ? { ...cardProps(width, columns), gap: 0, paddingY: 0 } : { flexDirection: 'column', ...LOOK.section }
  // A line that holds a name or a folder is cut at a word to a few rows within the card (a name has no space to break at), as the dim line of the Button is.
  const room = Math.max(10, app ? innerOf(width, columns) : columns)
  const lines = (key: string, words: string, rows: number, props: Record<string, unknown> = {}) =>
    linesAtWord(words, room, rows).map((line, at) => (
      <Text key={`${key}-${at}`} {...props}>
        {line}
      </Text>
    ))
  const link = (label: string, press: () => void, key: string) => (app ? <Button key={key} plain label={label} onPress={press} /> : <Button key={key} label={label} onPress={press} />)
  if (maker.step === 'name') {
    return [
      <Box key="make-flow" {...frame}>
        <Text key="make-title" bold>
          {NAME_TITLE}
        </Text>
        {lines('make-intro', NAME_INTRO, 3, { color: dim })}
        <Input key="make-name" label={NAME_LABEL} placeholder={maker.name} value={offeredName(maker.typed, maker.name)} submitLabel={NAME_NEXT} onInput={maker.onDraft} onSubmit={maker.onNext} />
        {maker.fault !== '' && lines('make-fault', maker.fault, 4, { color: warn })}
        {lines('make-hint', NAME_HINT, 3, { color: dim })}
        {lines('make-where', `lives in ${maker.where}`, 2, { color: dim })}
        {lines('make-joins', joinsLine, 2, { color: dim })}
        {link(NAME_CANCEL, maker.onCancel, 'make-cancel')}
      </Box>,
    ]
  }
  if (maker.step === 'confirm') {
    return [
      <Box key="make-flow" {...frame}>
        {lines('make-title', confirmTitle(maker.typed), 1, { bold: true })}
        {lines('make-intro', confirmIntro(maker.where), 2, { color: dim })}
        {WILL.map((words, at) => lines(`make-will-${at}`, `• ${words}`, 1))}
        {lines('make-foot', CONFIRM_FOOT, 2, { color: dim })}
        <Box key="make-acts" flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" columnGap={SPACE.control}>
          {link(CONFIRM_BACK, maker.onBack, 'make-back')}
          <Button key="make-go" variant="primary" label={CONFIRM_GO} onPress={maker.onGo} />
        </Box>
      </Box>,
    ]
  }
  return [
    <Box key="make-flow" {...frame}>
      <Text key="make-title" bold>
        {MAKING}
      </Text>
      {makeSteps({ ended: maker.ended, door: maker.door }, maker.where).map((step, at) => lines(`make-step-${at}`, `${step.mark} ${step.words}`, 2, { bold: step.mark === '●', ...(step.mark === '○' ? { color: dim } : {}) }))}
      {lines('make-foot', MAKING_FOOT, 3, { color: dim })}
    </Box>,
  ]
}

export type LandingProps = { ui: Ui; surface?: string; landing: Landing; inner: number; onDisc: () => void }

// The landing band: `NAME is born`, what the call said of the door, `Start here` with the one press the pane has (the plays of the room) and OK. In the app it is as wide as the card of
// its place, as the update band is.
export function landingView({ ui, surface, landing, inner, onDisc }: LandingProps) {
  const { Box, Text, Button } = ui
  const app = isApp(surface)
  const tone = app ? THEME.ok : LOOK.ok
  const dim = app ? THEME.dim : LOOK.quiet
  const frame = app
    ? { borderStyle: 'round', borderColor: tone, backgroundColor: THEME.ground, paddingX: SPACE.control, width: inner + 2 + 2 * SPACE.control }
    : { borderStyle: 'round', borderColor: tone, paddingX: 1 }
  const wrap = app ? { wrap: 'wrap' } : {}
  return (
    <Box key="born-band" flexDirection="column" {...frame}>
      {linesAtWord(bornTitle(landing.name), Math.max(10, inner), 2).map((line, at) => (
        <Text key={`born-title-${at}`} bold color={tone}>
          {line}
        </Text>
      ))}
      <Text key="born-door" color={dim} {...wrap}>
        {bornDoor(landing.door)}
      </Text>
      <Text key="born-here" color={dim} {...wrap}>
        {START_HERE}
      </Text>
      <Box key="born-acts" flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" columnGap={SPACE.group}>
        {app ? <Button key="born-disc" plain label={BORN_DISC} onPress={onDisc} /> : <Button key="born-disc" label={BORN_DISC} onPress={onDisc} />}
        <Button key="born-ok" variant="primary" label={BORN_OK} onPress={landing.onOk} />
      </Box>
    </Box>
  )
}
