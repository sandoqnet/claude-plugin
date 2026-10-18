import { eventRows, timeCells, wordsOfEvent } from '../model/motion'
import { guidesOf, pieceLines, treeRows } from '../model/tree'
import { INDENT, traceBlockLines, traceRowText, traceRows } from '../model/walk'
import { LOOK } from './look'
import { THEME, cardProps, cellsOf, fitted, innerOf } from './theme'
import type { Plan } from './theme'
import type { EventsProps, MotionProps, TraceProps, TreeProps } from './types'

// The colors of the lenses: in the place (the app) the keys of views/theme.ts, which follow the app's theme, in the terminal
// LOOK's keys. `text` is the one voice that has no key: the host's own text color, so nothing is set.
export type Ink = { text: string | undefined; quiet: string; accent: string; warn: string; fault: string }

export const inkOf = (app: boolean): Ink =>
  app
    ? { text: undefined, quiet: THEME.dim, accent: THEME.accent, warn: THEME.warn, fault: THEME.fault }
    : { text: undefined, quiet: LOOK.quiet, accent: LOOK.accent, warn: LOOK.warn, fault: LOOK.fault }

// The layout of the card a lens stands in (order D1): the column's width and the pane's columns, as the other views take them.
// With none the cells are not counted and a label is not cut.
export type LensLayout = { plan?: Plan; columns?: number }

// Under this many cells a row of the motion list is two lines: the time and the count, then the event.
const COMPACT_UNDER = 56

// The props of a Text in the text color, none in the terminal.
export const textProps = (ink: Ink): { color?: string } => (ink.text === undefined ? {} : { color: ink.text })

// The columns of an event row in the place: the time cell (HH:MM:SS.mmm), the event, who, the count.
const TIME_WIDTH = 12
const WHO_WIDTH = 10
const FIRST_WIDTH = 14
const COUNT_WIDTH = 3

// The world in motion, the events tab of every shown card in one list: one row an event, the time, the
// event (its first word a Button that opens the card's walk panel, the rest quiet), the card's first words
// in the place of the seat, and at the right the count of blocks under the event's block; oldest first so
// the newest is at the bottom. Each key carries the card id and the index of the row in its card.
// In the place (the desktop app, which draws a Button by its label alone) a row is four fixed columns: the time, the event,
// the card's first words and the count. The event is a plain Button whose label is the event's words, cut at its end to its
// column (a Button does not wrap); a press opens the card in the operator lens on its events. In a card narrower than
// COMPACT_UNDER cells the row is two lines: the time and the count, then the event over the whole width. The terminal host
// takes a string label and no hover, so its row stays a Box of Text with the first word a Button, in theme keys.
export function motionView({ ui, rows, zone, actions, app = false, plan, columns, bare = false }: MotionProps & { app?: boolean; bare?: boolean } & LensLayout) {
  const { Box, Text, Button } = ui
  const ink = inkOf(app)
  // The cells of the card's content: the card is the lens's, with its border and padding.
  const inner = innerOf(plan?.width, columns)
  if (rows.length === 0) return <Text color={ink.quiet}>nothing in motion yet</Text>
  const times = timeCells(
    rows.map(row => row.ms),
    zone,
  )
  const open = (row: { cardId: string }) => {
    void actions.open({ view: 'feed', cardId: row.cardId, lens: 'events' })
    void actions.setFace('operator')
  }
  if (app) {
    const compact = inner < COMPACT_UNDER
    // The cells the event column keeps: the card's content less the three other columns and the gaps between the four.
    const eventRoom = compact ? inner : inner - TIME_WIDTH - FIRST_WIDTH - COUNT_WIDTH - 3
    const list = rows.map((row, i) => {
      const key = `${row.cardId}-${row.index}`
      const event = (
        <Box key={`motion-event-${key}`} flexGrow={1} flexShrink={1}>
          <Button key={`motion-${key}`} label={fitted(row.text, eventRoom)} plain onPress={() => open(row)} />
        </Box>
      )
      if (compact) {
        return (
          <Box key={`motion-row-${key}`} flexDirection="column">
            <Box key={`motion-head-${key}`} flexDirection="row" justifyContent="space-between" columnGap={1}>
              <Text key={`motion-time-${key}`} color={ink.quiet}>
                {times[i]}
              </Text>
              <Text key={`motion-count-${key}`} color={ink.quiet}>
                {String(row.count)}
              </Text>
            </Box>
            {event}
          </Box>
        )
      }
      return (
        <Box key={`motion-row-${key}`} flexDirection="row" columnGap={1}>
          <Box key={`motion-time-${key}`} width={TIME_WIDTH}>
            <Text color={ink.quiet}>{times[i]}</Text>
          </Box>
          {event}
          <Box key={`motion-first-${key}`} width={FIRST_WIDTH}>
            <Text color={ink.quiet} wrap="truncate-end">
              {row.first}
            </Text>
          </Box>
          <Box key={`motion-count-${key}`} width={COUNT_WIDTH}>
            <Text color={ink.quiet}>{String(row.count).padStart(COUNT_WIDTH - 1)}</Text>
          </Box>
        </Box>
      )
    })
    // `bare`: the rows alone, for the lens card that holds them itself, so the pane pages the card by its rows
    return bare ? list : <Box flexDirection="column">{list}</Box>
  }
  return (
    <Box flexDirection="column" marginBottom={1}>
      {rows.map((row, i) => {
        const { word, rest } = wordsOfEvent(row.text)
        return (
          <Box key={`motion-row-${row.cardId}-${row.index}`} flexDirection="row" justifyContent="space-between">
            <Box flexDirection="row" columnGap={1}>
              <Text color={ink.quiet}>{times[i]}</Text>
              <Button key={`motion-${row.cardId}-${row.index}`} label={word} onPress={() => open(row)} />
              <Text key={`motion-rest-${row.cardId}-${row.index}`} color={ink.quiet} wrap="truncate-end">
                {`${rest} ${row.first}`.trim()}
              </Text>
            </Box>
            <Text color={ink.quiet}>{row.count}</Text>
          </Box>
        )
      })}
    </Box>
  )
}

// The trace lens as the place draws it: the motion rows in one card on the theme's ground (views/theme.ts).
export function traceLensView(props: MotionProps & LensLayout) {
  const { Box } = props.ui
  return [
    // the rows are the card's own parts, one to a part and no gap between (as the one column they were), so the pane pages the card by them
    <Box key="trace-lens" {...cardProps(props.plan?.width, props.columns)} gap={0}>
      {motionView({ ...props, app: true, bare: true })}
    </Box>,
  ]
}

// The events tab of the walk panel: one row an event of the card, the time (whole, then ".mmm" while the
// second stands), the event (its first word in the text color, the rest quiet), "● SEAT" quiet and the count
// at the right, quiet. In the place the row has four columns (the time, the event with its first word bold,
// the seat, the count) in the theme's keys, and `limit` rows at most. With `width`, the cells of the row, the event column has
// its own width (the row less the three fixed columns and the three gaps), so its Texts cut at their end inside it in any layout.
// Under COMPACT_UNDER cells, as the rows of the motion list, the row has no seat column: the event keeps the cells it leaves.
export function eventsView({ ui, card, zone, app = false, limit, width }: EventsProps & { app?: boolean; limit?: number; width?: number }) {
  const { Box, Text } = ui
  const ink = inkOf(app)
  const rows = eventRows(card, zone).slice(0, limit)
  if (app) {
    const counted = width !== undefined && Number.isFinite(width)
    const compact = counted && width < COMPACT_UNDER
    const room = !counted ? undefined : Math.max(1, width - TIME_WIDTH - COUNT_WIDTH - (compact ? 2 : WHO_WIDTH + 3))
    return rows.map((row, i) => (
      <Box key={`event-${card.id}-${i}`} flexDirection="row" columnGap={1}>
        <Box width={TIME_WIDTH}>
          <Text color={ink.quiet}>{row.time}</Text>
        </Box>
        <Box {...(room === undefined ? { flexGrow: 1 } : { width: room })} flexDirection="row">
          <Text bold color={ink.text}>
            {row.word}
          </Text>
          <Text color={ink.quiet} wrap="truncate-end">
            {row.rest}
          </Text>
        </Box>
        {!compact && (
          <Box width={WHO_WIDTH}>
            <Text color={ink.quiet}>{row.seat}</Text>
          </Box>
        )}
        <Box width={COUNT_WIDTH}>
          <Text color={ink.quiet}>{String(row.count).padStart(COUNT_WIDTH - 1)}</Text>
        </Box>
      </Box>
    ))
  }
  return rows.map((row, i) => (
    <Box key={`event-${card.id}-${i}`} flexDirection="row" justifyContent="space-between">
      <Box flexDirection="row" columnGap={1}>
        <Text color={ink.quiet}>{row.time}</Text>
        <Box flexDirection="row">
          <Text>{row.word}</Text>
          <Text color={ink.quiet}>{row.rest}</Text>
        </Box>
      </Box>
      <Box flexDirection="row" columnGap={1}>
        <Text color={ink.quiet}>{`● ${row.seat}`}</Text>
        <Text color={ink.quiet}>{`${row.count}`}</Text>
      </Box>
    </Box>
  ))
}

// The blocks tab and the trace lens: the walk's blocks in order, one row a block, in a time lane; a press
// shows the block as written, in the quiet color.
export function traceView({ ui, card, pickedRow, actions, app = false, plan, columns }: TraceProps & { app?: boolean } & LensLayout) {
  const { Box, Text, Button } = ui
  const ink = inkOf(app)
  const rows = traceRows(card.raw)
  const picked = rows[pickedRow]
  // The cells of a row of the open card: the lens card's content less the open card's border and padding. In the place the
  // label is cut by cells to what its note leaves it; the terminal draws the label as it was.
  const inner = innerOf(plan?.width, columns) - 4
  return (
    <Box flexDirection="column">
      {rows.map((row, i) => (
        <Box key={`trace-${i}`} flexDirection="row" columnGap={1}>
          <Button
            key={`trace-row-${i}`}
            label={app ? fitted(traceRowText(row), Math.max(2, row.note === '' ? inner : inner - cellsOf(row.note) - 1)) : traceRowText(row)}
            dimColor={pickedRow !== i}
            onPress={() => {
              void actions.pickRow(i)
            }}
          />
          {row.note !== '' && <Text color={ink.quiet}>{row.note}</Text>}
        </Box>
      ))}
      {picked && <Text> </Text>}
      {picked &&
        traceBlockLines(picked).map((line, i) => (
          <Text key={`block-${i}`} color={ink.quiet}>
            {line}
          </Text>
        ))}
    </Box>
  )
}

// The block tree of the walk lens and the overview tab, one line a block, as the node's walk: a thin bar at
// each indent, the glyph (a Button: a press shows the block as written under its line), the chi bold, then
// "::che::cho (N,K) (C)" quiet and cut at the end of the line, never wrapped. What `under` holds hangs under
// its block, one indent in: the text box under the root, under the route the pieces of the sentence, one line
// each with their form, then the egress box, a reading under its object. With no route yet the egress stands
// at the foot.
export function treeView({ ui, card, entries, roomFiles, pickedRow, under, actions, app = false }: TreeProps & { app?: boolean }) {
  const { Box, Text, Button } = ui
  const ink = inkOf(app)
  const rows = treeRows(card.raw)
  const hangs = (key: string, depth: number, parts: any[]) =>
    parts.length === 0 ? [] : [
      <Box key={key} flexDirection="column" paddingLeft={depth * INDENT}>
        {parts}
      </Box>,
    ]
  const out: any[] = []
  for (const row of rows) {
    const at = `${card.id}-${row.index}`
    out.push(
      <Box key={`tree-${at}`} flexDirection="row" columnGap={1}>
        {row.depth > 0 && <Text color={ink.quiet}>{guidesOf(row.depth)}</Text>}
        <Button
          key={`block-${at}`}
          label="▾ ◆"
          variant={pickedRow === row.index ? 'primary' : 'secondary'}
          onPress={() => {
            void actions.pickRow(row.index)
          }}
        />
        <Box width={cellsOf(row.chi)}>
          <Text bold {...textProps(ink)}>
            {row.chi}
          </Text>
        </Box>
        <Text color={ink.quiet} wrap="truncate-end">
          {[`${row.tail}`, row.form, row.count].filter(part => part !== '').join(' ')}
        </Text>
      </Box>,
    )
    if (pickedRow === row.index) {
      out.push(
        ...[row.header, '```yaml', ...row.fenceLines, '```'].map((line, i) => (
          <Text key={`as-written-${at}-${i}`} color={ink.quiet}>
            {`${guidesOf(row.depth + 1)} ${line}`}
          </Text>
        )),
      )
    }
    if (row.anchor === 'root') out.push(...hangs(`under-root-${card.id}`, row.depth + 1, under.root))
    if (row.anchor === 'object') out.push(...hangs(`under-object-${at}`, row.depth + 1, under.objects[row.id] ?? []))
    if (row.anchor === 'route') {
      const pieces = pieceLines(card.raw, entries, roomFiles).map((piece, i) => (
        <Box key={`piece-line-${at}-${i}`} flexDirection="row" columnGap={1}>
          <Text color={ink.quiet}>{`${guidesOf(row.depth + 1)} ${piece.glyph} ${piece.role}`}</Text>
          <Text {...textProps(ink)}>{piece.name}</Text>
          {piece.form !== '' && <Text color={ink.quiet}>{piece.form}</Text>}
        </Box>
      ))
      out.push(...pieces)
      out.push(...hangs(`under-route-${card.id}`, row.depth + 1, under.route))
    }
  }
  if (!rows.some(row => row.anchor === 'route')) out.push(...hangs(`under-route-${card.id}`, 0, under.route))
  return out
}
