import type { Busy } from '../model/discacts'
import { RESTART_CLAUDE, isPaneRestart, restartLines } from '../model/steps'
import type { Step } from '../model/steps'
import { isApp } from './glass'
import { LOOK } from './look'
import { LAYER_MAX, SPACE } from './space'
import type { Plan } from './space'
import { THEME, cardProps } from './theme'
import type { Ui } from './types'
import { versionsTable } from './versions-table'
import type { VersionsTable } from './versions-table'

const TITLE = 'Versions'
// Said under the lines when the sandoq here prints no json form (exit 2, or no object on the out): its lines stand as they were. It
// names no command: an older sandoq may not have the verb.
export const OLDER_SANDOQ = 'sandoq here is older than this pane needs. Install sandoq 0.3.0 or later.'
const NOTE = 'What this pane and this room run.'
const NOTE_APP = 'What this pane runs.'
const CHECKING = 'Checking…'
const UPDATE = 'Update the pane'
const UPDATING = 'Updating the pane'

// What one check said: a head from the exit code alone ('' when none), the lines of its process whole, and one plain line when it
// did not answer, was refused or was not taken.
export type CheckResult = { name: string; head: string; lines: string[]; plain: string }

// What the update of the pane said: the lines of its process whole, and one plain line when it ended, was refused or did not answer.
// `pane` is the pane's step of the run when it printed one: a step in the state restart is drawn as a call to action, from its fields
// (model/steps.ts restartLines), and its own line is not among `lines`.
export type UpdateResult = { state: 'rest' | 'updating' | 'done'; lines: string[]; plain: string; pane?: Step }

// The card of Versions in Settings. At rest it says at once, with no process, the pane's version and each disc of the room with its
// version. "Check now" runs the two checks (the register's: sandoq update and sandoq room update, each with the word --check, so
// neither updates anything); while they run the card says Checking, after them it shows what sandoq said and the hour of the check.
export type VersionsCard = {
  pane: string
  discs: { name: string; version: string }[]
  state: 'rest' | 'checking' | 'done'
  // The hour of the last check ('' when none was made in this session) and what each check said.
  at: string
  results: CheckResult[]
  // Why the check cannot go, as one plain line ('' when it can).
  cannot: string
  // The update of the pane, on the pane's own line: "Update the pane" runs sandoq pane update on the press alone. With none given
  // no Button of it stands.
  update?: UpdateResult
  onUpdate?: () => void
  // The table of the app (order V3), on the json form of sandoq 0.3.0: with it the app draws the table and not the lines. Without it,
  // or when `older` is set (the sandoq here printed no json form), the app draws the lines as they were, and the older line.
  table?: VersionsTable
  older?: boolean
}

// What runs: a check, an update of the pane or of the discs, or nothing (the one word the table and What it plays both read).
export const busyOf = (card: VersionsCard): Busy => (card.state === 'checking' ? 'checking' : card.update?.state === 'updating' ? 'updating' : 'rest')

export type VersionsProps = {
  ui: Ui
  surface?: string
  // The card's edge in the app's table: the plan's made edge tone when order D2 gives one; with none, the theme's line key.
  edge?: string
  // The width of the layer the card stands in, in cells; with none a card is as wide as it was. The plan's width wins over it, and
  // the pane's columns set the card's side padding (the theme card of views/theme.ts).
  width?: number
  plan?: Plan
  columns?: number
  card: VersionsCard
  onCheck: () => void
  // The link of the app to What it plays, where the discs stand once (order DP, P4): the app's Versions holds no disc row.
  onPlays?: () => void
}

// The Versions card, as an element to sit among the cards of the Settings place. In the app it is the theme card: the theme's
// keys for its words, and a line (the pane's, a disc's) that is too long for the card wraps its words under the name.
export function versionsView({ ui, surface, edge = THEME.line, width: given, plan, columns, card, onCheck, onPlays }: VersionsProps) {
  const { Box, Text, Button } = ui
  const app = isApp(surface)
  const width = plan?.width ?? given
  if (app && card.table !== undefined && card.older !== true) {
    return versionsTable({
      ui,
      width: width ?? LAYER_MAX,
      edge,
      cannot: card.cannot,
      checked: card.at,
      busy: busyOf(card),
      table: card.table,
      onCheck,
      ...(onPlays === undefined ? {} : { onPlays }),
    })
  }
  const dim = app ? THEME.dim : LOOK.quiet
  const strong = undefined
  const wraps = app ? ({ flexWrap: 'wrap', rowGap: SPACE.line } as const) : {}

  // The names column is the default ink, as the versions are: a name is what he reads the line by, so it is never the dim key.
  const row = (key: string, name: string, version: string) => (
    <Box key={key} flexDirection="row" justifyContent="space-between" columnGap={app ? SPACE.control : 2} {...wraps}>
      <Text color={strong}>{name}</Text>
      <Text color={strong}>{version}</Text>
    </Box>
  )
  // The pane's own line: its version, and after it the one act that updates it (a Button, its label alone), or while it runs the words.
  const update = card.update
  const updating = update?.state === 'updating'
  const offered = update !== undefined && card.onUpdate !== undefined && card.cannot === '' && !updating
  const paneRow = (
    <Box key="versions-pane" flexDirection="row" justifyContent="space-between" columnGap={app ? SPACE.control : 2} {...wraps}>
      <Text color={strong}>Pane</Text>
      <Box key="versions-pane-version" flexDirection="row" columnGap={app ? SPACE.control : 2} {...wraps}>
        <Text color={strong}>{card.pane}</Text>
        {updating && (
          <Text key="versions-updating" color={dim}>
            {UPDATING}
          </Text>
        )}
        {offered && (app ? <Button key="versions-update" plain label={UPDATE} onPress={card.onUpdate} /> : <Button key="versions-update" label={UPDATE} onPress={card.onUpdate} />)}
      </Box>
    </Box>
  )
  // The app's lines form holds the pane alone: the discs stand once, in What it plays. The terminal keeps its rows.
  const rows = [paneRow, ...(app ? [] : card.discs.map((disc, i) => row(`versions-disc-${i}`, disc.name, disc.version === '' ? 'none' : disc.version)))]

  // What the update said, under the rows: where the pane waits for a new session, the call to action drawn from its fields (the line
  // in the default ink, the move note under it dim); then the other lines of sandoq whole, then its one plain line (which is left out
  // where the call to action says it).
  const doing = update?.pane !== undefined && isPaneRestart(update.pane) ? restartLines(update.pane) : []
  const updated =
    update?.state === 'done' ? (
      <Box key="versions-updated" flexDirection="column">
        {doing.map((line, i) => (
          <Text key={`update-do-${i}`} color={i === 0 ? strong : dim} wrap="wrap">
            {line}
          </Text>
        ))}
        {update.lines.map((line, i) => (
          <Text key={`update-line-${i}`} color={dim} wrap="wrap">
            {line}
          </Text>
        ))}
        {update.plain !== '' && !(doing.length > 0 && update.plain === RESTART_CLAUDE) && (
          <Text key="update-plain" color={strong} wrap="wrap">
            {update.plain}
          </Text>
        )}
      </Box>
    ) : null

  const check =
    card.state === 'checking' ? (
      <Text key="versions-checking" color={dim}>
        {CHECKING}
      </Text>
    ) : card.cannot !== '' ? (
      <Text key="versions-cannot" color={dim}>
        {card.cannot}
      </Text>
    ) : (
      // A Button of its label alone, in the app and in the terminal: the app draws it by its own theme (order D1, fact 1).
      <Button key="versions-check" label="Check now" onPress={onCheck} />
    )

  const olderLine =
    card.older === true ? (
      <Text key="versions-older" color={dim} wrap="wrap">
        {OLDER_SANDOQ}
      </Text>
    ) : null

  const said =
    card.state === 'done'
      ? [
          <Text key="versions-at" color={dim}>
            {`Checked at ${card.at}`}
          </Text>,
          ...card.results.map(result => (
            <Box key={`versions-result-${result.name}`} flexDirection="column">
              <Text bold color={strong}>
                {result.name}
              </Text>
              {result.head !== '' && (
                <Text key="head" color={strong} wrap="wrap">
                  {result.head}
                </Text>
              )}
              {result.plain !== '' && (
                <Text key="plain" color={dim} wrap="wrap">
                  {result.plain}
                </Text>
              )}
              {result.lines.map((line, i) => (
                <Text key={`line-${i}`} color={dim} wrap="wrap">
                  {line}
                </Text>
              ))}
            </Box>
          )),
        ]
      : []

  if (app) {
    return [
      <Box key="settings-versions" {...cardProps(width, columns)}>
        <Box key="head-versions" flexDirection="column">
          <Text bold>{TITLE}</Text>
          <Text color={THEME.dim} wrap="wrap">
            {NOTE_APP}
          </Text>
        </Box>
        <Box key="rows-versions" flexDirection="column">
          {rows}
        </Box>
        {updated}
        {check}
        {onPlays !== undefined && <Button key="versions-plays" plain label="What it plays ›" onPress={onPlays} />}
        {olderLine}
        {said}
      </Box>,
    ]
  }
  return [
    <Box key="settings-versions" flexDirection="column" {...LOOK.section}>
      <Text bold>{TITLE}</Text>
      <Text color={LOOK.quiet}>{NOTE}</Text>
      {rows}
      {updated}
      {check}
      {olderLine}
      {said}
    </Box>,
  ]
}
