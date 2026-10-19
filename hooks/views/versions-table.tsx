import { UPDATE, runningWords } from '../model/discacts'
import { ON_HOLD, RESTART_CLAUDE, groupOf, isNotAFault, isPane, isPaneRestart, labelOf, noteOf, oldPluginLines, orderedSteps, paneNoticeLines, paneStepOf, panePress, paneVersions, restartLines, wordOf } from '../model/steps'
import type { Door, Step } from '../model/steps'
import { SPACE } from './space'
import { THEME, cellsOf } from './theme'
import type { Ui } from './types'

// THE VERSIONS TABLE of the app (order V3). The card is a table
// on the room's json form: wide from a card of 70 cells, stacked below it. Theme keys alone: the default ink, `inactive`, `warning`
// (bold, a wait) and `error` (a refusal); no hex. No word of it comes from the exit code of a command: each word is a state's.
// THE DISCS ARE NOT HERE (order DP, P4 part 3): the table draws the pane's line and the other steps of the machine (the sandoq, the player),
// each disc stands once, in What it plays (views/roomcard.tsx), with the acts of model/discacts.ts. The steps still hold the discs, and so
// do `door`, `long`, `running`, `refused`, `said` and `onUpdate`: What it plays reads them from the same card.
export type VersionsTable = {
  // The steps as read: after a check those of the two checks; at rest the pane and the discs of the room, with no state.
  steps: Step[]
  // The pane's version LOADED (the constant); `here` of the pane's step is the one INSTALLED.
  loaded: string
  // The door the check read: none, a door of the unit with a swap owed, or a door that stands in a terminal.
  door: Door
  // A press that may pass ten minutes: its line says so (What it plays says it).
  long: boolean
  // The rows the canvas leaves the card (canvasRowsOf of views/frame.tsx, the frame's one count, filled by the register), and the page
  // the card was left at: it pages by its entries, never a scroll. With NO rows (the host gave none) the card takes no limit and is
  // not paged, as the cards of the pane are not.
  rows?: number
  page: number
  // What runs: the name said in the line (`the pane`, `each disc`, a disc's name) and whether the door goes down meanwhile.
  running?: { what: string; restart: boolean }
  // A refused run: its exit code and the last line of its err, scrubbed.
  refused?: { code: number; err: string }
  // What a run said: ONE plain line by `after` and the lines of sandoq, folded until he asks. `pane` is the pane's step of the run
  // when it waits for a new session (state restart): its entry says it as a call to action, which the check after the run does not give back.
  said?: { plain: string; lines: string[]; pane?: Step }
  unfolded: boolean
  // The page the unfolded lines are at: they page by lines with a pager of their own when they do not fit the rows.
  linesPage?: number
  onLinesPage?: (page: number) => void
  // The door did not come up after a run: `Start the door` stands.
  doorNotUp: boolean
  // The plain lines of a check or a run that did not answer.
  notes: string[]
  // A press on a disc's Button runs its update by the disc's name; with no name it is `Update all`. The pane's Button runs the pane's.
  onUpdate: (name: string) => void
  onUpdatePane: () => void
  onStartDoor: () => void
  onUnfold: () => void
  onPage: (page: number) => void
}

export type TableProps = {
  ui: Ui
  // The width of the card, in cells: the plan's.
  width: number
  // The card's edge. Until order D2's color gives the plan an edge tone this is the theme's line key; the prop is the seam.
  edge: string
  // Why no command can run (no sandoq found), '' when one can: the table stands at rest, with this one dim line in the place of Check
  // now, and no Button of an update.
  cannot?: string
  // The hour of the last check, '' when none was made in this session.
  checked: string
  busy: 'rest' | 'checking' | 'updating'
  table: VersionsTable
  onCheck: () => void
  // The one link to What it plays, where the discs stand (order DP, P4): a plain Button in the foot, beside Check now. With none no link stands.
  onPlays?: () => void
}

// The columns of the wide table, in cells.
const NAME = 10
const VERSION = 13
const STATE = 12
const ACT = 8
const WIDE = NAME + 2 * VERSION + STATE + ACT + 4 * SPACE.control

export const isWide = (width: number): boolean => width - 2 - 2 * SPACE.control >= WIDE

// The rows that are not entries. Wide: the place's head 2, the card's edge 2 and padding 2, title, gap, header, gap, foot = 11;
// stacked: the same without the header = 10. THE COMPACT CARD (no padding rows, no gaps between blocks, no header): the head 2, the
// edge 2, the title 1, the foot 1 = 6. The pager costs a row and a gap, and in the compact card a row.
const FIXED_WIDE = 11
const FIXED_STACKED = 10
const FIXED_COMPACT = 6
const PAGER_FULL = 2
const PAGER_COMPACT = 1

const eachRows = (width: number): number => (isWide(width) ? 1 : 2)
// THE FLOORS, in body rows: the full card from 14 (wide 11 + 1 entry + 2 the pager; stacked 10 + 2 + 2); under 14 the compact card,
// from 8 wide (6 + 1 + 1) and 9 stacked (6 + 2 + 1); under that no card fits and one dim line stands.
export const FULL_FLOOR = 14
export const compactFloor = (width: number): number => FIXED_COMPACT + eachRows(width) + PAGER_COMPACT
export const isCompact = (rows: number): boolean => rows < FULL_FLOOR
export const tooShort = (width: number, rows: number): boolean => rows < compactFloor(width)
export const TOO_SHORT = 'Versions needs a taller pane.'
// How many entries one page holds when each takes its own rows: the rows left, divided by the rows of one entry (one when wide, two when stacked).
export const perPage = (width: number, rows: number, count: number): number => {
  const each = eachRows(width)
  const compact = isCompact(rows)
  const left = rows - (compact ? FIXED_COMPACT : isWide(width) ? FIXED_WIDE : FIXED_STACKED)
  const whole = Math.floor(left / each)
  return Math.max(1, count <= whole ? whole : Math.floor((left - (compact ? PAGER_COMPACT : PAGER_FULL)) / each))
}

// The rows of a text that wraps in `cells`, counted by cells (a long word may take one more).
export const wrapRows = (text: string, cells: number): number => Math.max(1, Math.ceil(cellsOf(text) / Math.max(1, cells)))

// The rows of a text wrapped at its words in `cells`, as the estimate of views/cells.ts lays it (a word wider than the row stands alone).
export function wordRows(text: string, cells: number): number {
  let rows = 0
  let line = ''
  for (const word of text.split(/\s+/).filter(part => part !== '')) {
    const next = line === '' ? word : `${line} ${word}`
    if (next.length <= cells || line === '') line = next
    else {
      rows += 1
      line = word
    }
  }
  return Math.max(1, rows + (line === '' ? 0 : 1))
}

// The text cut at a word, with an ellipsis, to take at most `cap` rows in `cells`; whole when it already does (and with no limit).
export function cutRows(text: string, cells: number, cap: number): string {
  if (wordRows(text, cells) <= Math.max(1, cap)) return text
  const words = text.split(/\s+/).filter(part => part !== '')
  let kept = words.length
  while (kept > 1 && wordRows(`${words.slice(0, kept).join(' ')}…`, cells) > Math.max(1, cap)) kept -= 1
  return `${words.slice(0, kept).join(' ')}…`
}

// The pages: entries by their own costs (a note, a Button that wraps), packed in order into the rows left; with all of them in one
// page there is no pager, else the pager's rows come out of the same. A page holds one entry at least.
export function pagesOf(costs: number[], left: number, pager: number): number[][] {
  const all = costs.map((_, i) => i)
  if (costs.reduce((sum, cost) => sum + cost, 0) <= left) return [all]
  const pages: number[][] = []
  let used = 0
  for (const i of all) {
    if (pages.length === 0 || used + costs[i] > left - pager) {
      pages.push([])
      used = 0
    }
    pages[pages.length - 1].push(i)
    used += costs[i]
  }
  return pages
}

const PLAYS_LINK = 'What it plays ›'

export function versionsTable({ ui, width, edge, cannot = '', checked, busy, table, onCheck, onPlays }: TableProps) {
  const { Box, Text, Button } = ui
  // No rows given is no limit: no floor, no compact card and one page.
  const rows = table.rows ?? Number.POSITIVE_INFINITY
  // With no sandoq found nothing can be run: the table stands at rest and its line says why, in the place of Check now.
  const blocked = cannot !== ''
  // Under the compact floor no card fits the body: one dim line, so the place never scrolls.
  if (tooShort(width, rows)) {
    return [
      <Text key="settings-versions" color={THEME.dim} wrap="wrap">
        {TOO_SHORT}
      </Text>,
    ]
  }
  const wide = isWide(width)
  const inner = width - 2 - 2 * SPACE.control
  // The discs stand once, in What it plays: the table holds the other steps of the check.
  const sorted = orderedSteps(table.steps).filter(step => step.noun !== 'disc')

  // The one act of a line: on the pane's own line where the pane waits (would-install, would-update) or the check cannot read it
  // (unknown). A Button only where a press does something; the update of a disc is What it plays's.
  const actOf = (step: Step): { label: string; press: () => void } | undefined => {
    // While a command runs no Update and no Check Button is offered, and there is no Cancel: the pane cannot send a signal.
    if (busy !== 'rest' || blocked) return undefined
    return isPane(step) && panePress(step) ? { label: UPDATE, press: table.onUpdatePane } : undefined
  }
  // A label that does not fit the Button's column of the wide table stands under the line, at the right.
  const under = (act: { label: string } | undefined): boolean => act !== undefined && wide && cellsOf(act.label) > ACT

  // The words under an entry: for the pane its two versions (the here column holds the loaded one alone), then what the record says.
  // The pane after its update says what to do (model/steps.ts restartLines) and not the line of sandoq: from its own step in the state
  // restart, or from the pane's step of the run that just ended (the check after it does not give that state back). Any other state is as before.
  const callOf = (step: Step): Step | undefined => (isPaneRestart(step) ? step : isPane(step) ? table.said?.pane : undefined)
  const notesOf = (step: Step): string[] => {
    const call = callOf(step)
    return call !== undefined ? restartLines(call) : [...(isPane(step) ? [paneVersions(step, table.loaded).note] : []), noteOf(step)].filter(note => note !== '')
  }
  const hereOf = (step: Step): string => (isPane(step) ? paneVersions(step, table.loaded).text : step.here)
  const thereOf = (step: Step): string => (step.there === '' ? '—' : step.there)
  // The stacked row's second line says `here → there` where the disc moves; a disc on hold does not move, so its note says what is newer.
  const underOf = (step: Step): string => (step.state !== ON_HOLD && step.there !== '' && step.there !== step.here ? `${hereOf(step)} → ${step.there}` : hereOf(step))
  // Amber for a wait, red for a refusal, nothing else coloured: one voice a table, each beside its word. A state not checked, not loaded
  // or with no claude sorts with the refusals but nothing was refused, so its word is in the default ink.
  const stateTone = (step: Step): string | undefined =>
    isNotAFault(step.state) ? undefined : groupOf(step.state) === 'wait' ? THEME.warn : groupOf(step.state) === 'refused' ? THEME.fault : THEME.dim
  // Each key stands once in the tree: an entry's parts are keyed by the entry's label.
  const stateWord = (step: Step) =>
    step.state === '' ? null : (
      <Text key={`${labelOf(step)}-word`} color={stateTone(step)} {...(groupOf(step.state) === 'wait' ? { bold: true } : {})}>
        {wordOf(step.state)}
      </Text>
    )

  const entry = (step: Step) => {
    const id = labelOf(step)
    const act = actOf(step)
    const button = act !== undefined && <Button key={`versions-update-${id}`} plain label={act.label} onPress={act.press} />
    // The call to action of a pane that waits for a new session is the default ink (the first of its lines); the move note under it is dim.
    const notes = notesOf(step).map((note, i) => (
      <Text key={`${id}-note-${i}`} color={callOf(step) !== undefined && i === 0 ? undefined : THEME.dim} wrap="wrap">
        {note}
      </Text>
    ))
    if (wide) {
      return (
        <Box key={`versions-${id}`} flexDirection="column">
          <Box key={`${id}-line`} flexDirection="row" columnGap={SPACE.control}>
            <Box key={`${id}-name`} width={NAME}>
              <Text wrap="wrap">{id}</Text>
            </Box>
            <Box key={`${id}-here`} width={VERSION}>
              <Text wrap="wrap">{hereOf(step)}</Text>
            </Box>
            <Box key={`${id}-there`} width={VERSION}>
              <Text color={THEME.dim} wrap="wrap">
                {thereOf(step)}
              </Text>
            </Box>
            <Box key={`${id}-state`} width={STATE}>
              {stateWord(step)}
            </Box>
            <Box key={`${id}-act`} width={ACT} flexDirection="row" justifyContent="flex-end">
              {!under(act) && button}
            </Box>
          </Box>
          {under(act) && (
            <Box key={`${id}-act-under`} flexDirection="row" justifyContent="flex-end">
              {button}
            </Box>
          )}
          {notes}
        </Box>
      )
    }
    return (
      <Box key={`versions-${id}`} flexDirection="column">
        <Box key={`${id}-top`} flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
          <Text>{id}</Text>
          {stateWord(step)}
        </Box>
        <Box key={`${id}-under`} flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap={SPACE.control}>
          <Text color={THEME.dim}>{underOf(step)}</Text>
          {button}
        </Box>
        {notes}
      </Box>
    )
  }

  // The header stands in the wide form of the full card alone.
  const header = (compact: boolean) =>
    wide &&
    !compact && (
      <Box key="versions-header" flexDirection="row" columnGap={SPACE.control}>
        {[
          ['Name', NAME],
          ['Here', VERSION],
          ['There', VERSION],
          ['State', STATE],
        ].map(([label, cells]) => (
          <Box key={`h-${label}`} width={cells as number}>
            <Text color={THEME.dim}>{label}</Text>
          </Box>
        ))}
      </Box>
    )

  // What each entry costs in rows, so the pages hold what the body holds: its cells wrap in their columns, a Button that does not fit
  // goes to a row of its own, and each note wraps in the card's inside.
  const costOf = (step: Step): number => {
    const act = actOf(step)
    // A note wraps at its words, which may take a row more than its cells say (the pane's own two versions line is long).
    const notes = notesOf(step).reduce((sum, note) => sum + Math.max(wrapRows(note, inner), wordRows(note, inner)), 0)
    if (wide) {
      const cells = Math.max(wrapRows(labelOf(step), NAME), wrapRows(hereOf(step), VERSION), wrapRows(thereOf(step), VERSION), step.state === '' ? 1 : wrapRows(wordOf(step.state), STATE))
      return cells + (under(act) ? 1 : 0) + notes
    }
    const sideBy = hereOf(step) === '' ? 0 : cellsOf(underOf(step))
    return 2 + (act !== undefined && sideBy + SPACE.control + cellsOf(act.label) > inner ? 1 : 0) + notes
  }

  // WHILE ONE COMMAND RUNS: one line, and no Update or Check Button.
  const runningLine = runningWords(table.running)
  const footCells = cellsOf('Check now') + (onPlays === undefined ? 0 : SPACE.control + cellsOf(PLAYS_LINK))
  const footRows = busy === 'updating' ? wrapRows(runningLine, inner) : blocked ? wrapRows(cannot, inner) : footCells > inner ? 2 : 1
  const foot =
    busy === 'checking' ? (
      <Text key="versions-checking" color={THEME.dim}>
        Checking…
      </Text>
    ) : busy === 'updating' ? (
      <Text key="versions-updating" color={THEME.dim} wrap="wrap">
        {runningLine}
      </Text>
    ) : blocked ? (
      <Text key="versions-cannot" color={THEME.dim} wrap="wrap">
        {cannot}
      </Text>
    ) : (
      <Box key="versions-foot" flexDirection="row" flexWrap="wrap" columnGap={SPACE.control}>
        <Button key="versions-check" label="Check now" onPress={onCheck} />
        {onPlays !== undefined && <Button key="versions-plays" plain label={PLAYS_LINK} onPress={onPlays} />}
      </Box>
    )

  // AFTER A RUN: a refused run says its true exit code in one line, in the error key and bold, and the last line of its err dim under
  // it, wrapped; a run's plain line is said once (the pane's own line under its entry already says it when the two versions differ),
  // and what sandoq said is folded behind `Show N lines`, then `Hide the lines`.
  const refused = table.refused
  const said = table.said
  const paneStep = paneStepOf(table.steps)
  const paneNote = paneVersions(paneStep, table.loaded).note
  // The run's Open a new session line is not said again where the pane's entry says it (its two versions, or its call to action).
  const plain = said === undefined || said.plain === '' || (said.plain === RESTART_CLAUDE && (paneNote !== '' || isPaneRestart(paneStep) || said.pane !== undefined)) ? '' : said.plain
  const lines = said?.lines ?? []

  // The blocks under the table, each with its own rows: they come out of the rows the entries have, and each takes a gap row but in
  // the compact card.
  const blocks: { node: unknown; rows: number }[] = []
  const add = (node: unknown, own: number) => blocks.push({ node, rows: own })
  // What the compact card keeps for blocks: its rows less the fixed ones, one entry, the entries' pager and a foot of two rows.
  const spare = rows - FIXED_COMPACT - eachRows(width) - PAGER_COMPACT - (footRows - 1)
  const startRows = table.doorNotUp && busy === 'rest' && !blocked ? 1 : 0
  // The lines of an unfolded run page by lines with a pager of their own, as the entries do: a line and the pager are the least they
  // take. The button and the plain line stand on every page.
  const unfolded = table.unfolded && lines.length > 0
  const foldedRows = (plain === '' ? 0 : wrapRows(plain, inner)) + (lines.length > 0 ? 1 : 0)
  // The notes (what did not answer) are blocks that cannot page: where they do not all fit in the rows the compact card has left, each
  // is cut at a word with an ellipsis to its share, one row at the least (the read tool says them whole). Where they fit they stand whole.
  const olds = [...oldPluginLines(table.steps), ...paneNoticeLines(table.steps)]
  let noteRoom = spare - olds.reduce((sum, line) => sum + wrapRows(line, inner), 0) - foldedRows - (unfolded ? 2 : 0) - startRows
  for (const [i, line] of table.notes.entries()) {
    const text = cutRows(line, inner, Math.floor(noteRoom / (table.notes.length - i)))
    const own = text === line ? wrapRows(line, inner) : wordRows(text, inner)
    noteRoom -= own
    add(
      <Text key={`versions-note-${i}`} color={THEME.dim} wrap="wrap">
        {text}
      </Text>,
      own,
    )
  }
  // The old plugin of the pane and the notices of its step are no entry: one dim line each under the table.
  for (const [i, line] of olds.entries()) {
    add(
      <Text key={`versions-old-plugin-${i}`} color={THEME.dim} wrap="wrap">
        {line}
      </Text>,
      wrapRows(line, inner),
    )
  }
  if (refused !== undefined) {
    const head = `Update refused, exit ${refused.code}.`
    // A block cannot page: the err line is cut at a word, with an ellipsis, to the rows the compact card has left once its entry, its
    // pager, the other blocks and the head are paid. Where it fits it stands whole.
    const taken = blocks.reduce((sum, block) => sum + block.rows, 0) + foldedRows + (unfolded ? 2 : 0) + startRows
    const err = cutRows(refused.err, inner, spare - wrapRows(head, inner) - taken)
    add(
      <Box key="versions-refused" flexDirection="column">
        <Text color={THEME.fault} bold wrap="wrap">
          {head}
        </Text>
        {err !== '' && (
          <Text color={THEME.dim} wrap="wrap">
            {err}
          </Text>
        )}
      </Box>,
      wrapRows(head, inner) + (err === '' ? 0 : wordRows(err, inner)),
    )
  }
  // The rows the unfolded lines may take: what is free once the other blocks are paid, less the entries' share (all of them, or half of
  // what is free when they are many); the pager of the lines comes out of it when the lines do not all fit.
  const free = spare + eachRows(width) - blocks.reduce((sum, block) => sum + block.rows, 0) - foldedRows - startRows
  const entryShare = Math.max(eachRows(width), Math.min(sorted.map(costOf).reduce((sum, cost) => sum + cost, 0), Math.floor(free / 2)))
  const linePages = unfolded ? pagesOf(lines.map(line => wordRows(line, inner)), free - entryShare, 1) : [[]]
  const linesAt = Math.min(Math.max(table.linesPage ?? 0, 0), linePages.length - 1)
  const shownLines = unfolded ? linePages[linesAt].map(i => lines[i]) : []
  const linesFirst = linePages[linesAt][0] ?? 0
  const linesPager = linePages.length > 1 && (
    <Box key="versions-lines-pager" flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
      <Text color={THEME.dim}>{`${linesFirst + 1} to ${linesFirst + shownLines.length} of ${lines.length}`}</Text>
      <Box key="lines-pager-keys" flexDirection="row" columnGap={SPACE.control}>
        {linesAt > 0 && <Button key="lines-previous" plain label="Previous" onPress={() => table.onLinesPage?.(linesAt - 1)} />}
        {linesAt < linePages.length - 1 && <Button key="lines-next" plain label="Next" onPress={() => table.onLinesPage?.(linesAt + 1)} />}
      </Box>
    </Box>
  )
  const sayRows = foldedRows + shownLines.reduce((sum, line) => sum + wordRows(line, inner), 0) + (linePages.length > 1 ? 1 : 0)
  if (sayRows > 0) {
    add(
      <Box key="versions-said" flexDirection="column">
        {plain !== '' && <Text wrap="wrap">{plain}</Text>}
        {lines.length > 0 && <Button key="versions-lines" plain label={table.unfolded ? 'Hide the lines' : `Show ${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`} onPress={table.onUnfold} />}
        {shownLines.map((line, i) => (
          <Text key={`said-${linesFirst + i}`} color={THEME.dim} wrap="wrap">
            {line}
          </Text>
        ))}
        {linesPager}
      </Box>,
      sayRows,
    )
  }
  if (table.doorNotUp && busy === 'rest' && !blocked) add(<Button key="versions-start" plain label="Start the door" onPress={table.onStartDoor} />, 1)

  // What the rows can pay for: the entries (one at least a page, with the pager's rows when they do not all fit) and the blocks of what a
  // run said. The full card first, then the compact one (the lines and Buttons about the discs are What it plays's now).
  const costs = sorted.map(costOf)
  const blocksOwn = blocks.map(block => block.rows)
  const fitsCard = (compactCard: boolean): boolean => {
    const left = rows - (compactCard ? FIXED_COMPACT : wide ? FIXED_WIDE : FIXED_STACKED) - blocksOwn.reduce((sum, rowsOf) => sum + rowsOf + (compactCard ? 0 : SPACE.line), 0) - (footRows - 1)
    return left >= Math.min(costs.reduce((sum, cost) => sum + cost, 0), Math.max(1, ...costs) + (compactCard ? PAGER_COMPACT : PAGER_FULL))
  }
  const compact = [isCompact(rows), true].find(fitsCard) ?? true
  const gap = compact ? 0 : SPACE.line
  const pagerRows = compact ? PAGER_COMPACT : PAGER_FULL
  const fixed = compact ? FIXED_COMPACT : wide ? FIXED_WIDE : FIXED_STACKED
  const extra = blocks.reduce((sum, block) => sum + block.rows + gap, 0) + (footRows - 1)

  // The entries, paged by their own rows in what the body leaves.
  const left = Math.max(1, rows - fixed - extra)
  const pages = pagesOf(costs, left, pagerRows)
  const at = Math.min(Math.max(table.page, 0), pages.length - 1)
  const shown = pages[at].map(i => sorted[i])
  const first = pages[at][0] ?? 0
  const pager = pages.length > 1 && (
    <Box key="versions-pager" flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
      <Text color={THEME.dim}>{`${first + 1} to ${first + shown.length} of ${sorted.length}`}</Text>
      <Box key="pager-keys" flexDirection="row" columnGap={SPACE.control}>
        {at > 0 && <Button key="pager-previous" plain label="Previous" onPress={() => table.onPage(at - 1)} />}
        {at < pages.length - 1 && <Button key="pager-next" plain label="Next" onPress={() => table.onPage(at + 1)} />}
      </Box>
    </Box>
  )

  return [
    <Box
      key="settings-versions"
      width={width}
      flexDirection="column"
      borderStyle="round"
      borderColor={edge}
      backgroundColor={THEME.ground}
      paddingX={SPACE.control}
      paddingY={compact ? 0 : SPACE.line}
      gap={gap}
    >
      <Box key="versions-title" flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
        <Text bold>Versions</Text>
        <Text color={THEME.dim}>{checked === '' ? 'not checked' : `Checked ${checked}`}</Text>
      </Box>
      <Box key="versions-table" flexDirection="column">
        {header(compact)}
        {shown.map(entry)}
      </Box>
      {pager}
      {blocks.map(block => block.node)}
      {foot}
    </Box>,
  ]
}
