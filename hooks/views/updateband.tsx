// THE UPDATE BAND (order PF1, Ardalan's Pane flows): a band at the top of the card, in any place, that says an update waits, runs, went in
// or did not. It is drawn from a Band of model/updateflow.ts and holds no process: its acts are the register's. Ready: the versions alone
// (no release notes are read, so no lines of what is new), "What changes ›" when the offer has one page, Not now and Update. Updating:
// the steps sandoq printed so far, each done, the newest `progress:` line, and no Cancel (the pane cannot stop a running update); no bar,
// for sandoq gives no fraction to fill it by. Done: "in" and OK. Failed: sandoq's own line, Settings ›, Not now and Try again.
import type { Band } from '../model/updateflow'
import { isApp } from './glass'
import { LOOK } from './look'
import { SPACE } from './space'
import { THEME, cardProps, fitted } from './theme'
import type { Ui } from './types'

export type BandActs = {
  update: () => void
  notNow: () => void
  ok: () => void
  tryAgain: () => void
  openPage: (page: string) => void | Promise<void>
  settings: () => void
  // The Update of a skipped sign on the Versions card, by its place in the list of what was skipped.
  updateSkipped: (at: number) => void
}

// In the app the band is as wide as the card of its place (inner is the cells inside it), in every stage, so it does not change width as a run moves.
// The band holds the last three steps of a run and cuts each line to one row, and sandoq's own line to three, so it is never taller than a few rows.
export type BandProps = { ui: Ui; surface?: string; band: Band; inner: number; acts: BandActs }

const STEPS_SHOWN = 3
const LINE_ROWS = 3

const DONE_MARK = '✓'
const FAULT_MARK = '✗'
const NEWEST_MARK = '●'

export function bandView({ ui, surface, band, inner, acts }: BandProps) {
  const { Box, Text, Button } = ui
  const app = isApp(surface)
  const tone = band.stage === 'done' ? (app ? THEME.ok : LOOK.ok) : band.stage === 'failed' ? (app ? THEME.fault : LOOK.fault) : app ? THEME.warn : LOOK.warn
  const dim = app ? THEME.dim : LOOK.quiet
  const wrap = app ? { wrap: 'wrap' } : {}
  const frame = app
    ? { borderStyle: 'round', borderColor: tone, backgroundColor: THEME.ground, paddingX: SPACE.control, width: inner + 2 + 2 * SPACE.control }
    : { borderStyle: 'round', borderColor: tone, paddingX: 1 }
  const link = (label: string, press: () => void | Promise<void>, key: string) =>
    app ? <Button key={key} plain label={fitted(label, inner)} onPress={() => void press()} /> : <Button key={key} label={label} onPress={() => void press()} />
  const page = band.page === '' ? undefined : link(band.stage === 'done' ? 'What changed ›' : 'What changes ›', () => acts.openPage(band.page), 'band-page')
  const settings = band.stage === 'failed' ? link('Settings ›', acts.settings, 'band-settings') : undefined
  const left = page ?? settings
  const picks =
    band.stage === 'ready' ? (
      <Box key="band-picks" flexDirection="row" columnGap={SPACE.control}>
        <Button key="band-not-now" variant="secondary" label="Not now" onPress={acts.notNow} />
        {band.update && <Button key="band-update" variant="primary" label="Update" onPress={acts.update} />}
      </Box>
    ) : band.stage === 'done' ? (
      <Box key="band-picks" flexDirection="row" columnGap={SPACE.control}>
        <Button key="band-ok" variant="primary" label="OK" onPress={acts.ok} />
      </Box>
    ) : band.stage === 'failed' ? (
      <Box key="band-picks" flexDirection="row" columnGap={SPACE.control}>
        <Button key="band-not-now" variant="secondary" label="Not now" onPress={acts.notNow} />
        <Button key="band-again" variant="primary" label="Try again" onPress={acts.tryAgain} />
      </Box>
    ) : null
  return (
    <Box key="update-band" flexDirection="column" {...frame}>
      <Box key="band-line" flexDirection="row" flexWrap="wrap" columnGap={1}>
        <Text bold>{band.title}</Text>
        <Text color={tone} {...wrap}>{band.words}</Text>
      </Box>
      {band.steps.slice(-STEPS_SHOWN).map((step, at) => (
        <Text key={`band-step-${at}`} color={step.ok ? undefined : tone} wrap="truncate-end">{`${step.ok ? DONE_MARK : FAULT_MARK} ${step.line}`}</Text>
      ))}
      {band.newest !== '' && <Text key="band-newest" bold wrap="truncate-end">{`${NEWEST_MARK} ${band.newest}`}</Text>}
      {band.note !== '' && <Text key="band-note" color={dim} {...wrap}>{band.stage === 'failed' ? fitted(band.note, LINE_ROWS * inner) : band.note}</Text>}
      {picks !== null && (
        <Box key="band-acts" flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent={left !== undefined ? 'space-between' : 'flex-end'} columnGap={SPACE.group}>
          {left}
          {picks}
        </Box>
      )}
    </Box>
  )
}

export const SKIPPED_NOTE = 'Not now keeps the version on the list and the dot on Settings until it is in. Nothing asks again on its own.'

export type SkippedProps = { ui: Ui; surface?: string; width: number; columns: number; skipped: { label: string; runs: boolean }[]; acts: Pick<BandActs, 'updateSkipped'>; compact?: boolean }

// The updates Not now set aside, on the Versions card (order PF1): each as its words and `skipped`, with Update where the pane has a press for it,
// then the one dim line that says what Not now keeps (the compact list of a short pane leaves out the line and the air). None skipped, none drawn.
export function skippedView({ ui, surface, width, columns, skipped, acts, compact = false }: SkippedProps) {
  if (skipped.length === 0) return []
  const { Box, Text, Button } = ui
  const app = isApp(surface)
  const dim = app ? THEME.dim : LOOK.quiet
  const rows = skipped.map((one, at) => (
    <Box key={`skipped-${at}`} flexDirection="row" justifyContent="space-between" alignItems="center" columnGap={SPACE.control}>
      <Text>{`${one.label} skipped`}</Text>
      {one.runs && <Button key={`skipped-update-${at}`} label="Update" onPress={() => acts.updateSkipped(at)} />}
    </Box>
  ))
  return [
    app ? (
      <Box key="skipped-card" {...cardProps(width, columns)} {...(compact ? { paddingY: 0, gap: 0 } : {})}>
        {rows}
        {!compact && <Text color={dim} wrap="wrap">{SKIPPED_NOTE}</Text>}
      </Box>
    ) : (
      <Box key="skipped-card" flexDirection="column" {...LOOK.section}>
        {rows}
        {!compact && <Text color={dim} wrap="wrap">{SKIPPED_NOTE}</Text>}
      </Box>
    ),
  ]
}
