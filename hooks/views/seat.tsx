import { stripUlid } from '../model/blocks'
import { reasonText } from '../model/gate'
import type { AskWhy } from '../model/gate'
import { THIS_SEAT } from '../model/seat'
import { OPEN_HERE, SEAT_SHUT_KEY, SHUT_BUTTON, wakesLine } from '../model/sessionseat'
import { namesOf, sizeOf, wrapRows } from './cells'
import { isApp } from './glass'
import { LOOK } from './look'
import { pageLines } from './pager'
import { SPACE } from './space'
import { THEME, actsProps, cardProps, fitted, innerOf, picksProps } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

// One wait of a seat: an open ask of the room that waits on him, as the seat face draws it. The pane's model maps
// the room to this; the view reads nothing else.
export type SeatWait = {
  cardId: string
  askId: string
  title: string
  body: string
  // The seat that asks ('' for a card of his own: the line is left out) and why the card waits.
  from: string
  why: string
  age: string
  // A gate has picks; a form has the Input and, when a seat drafted one, the draft.
  kind: 'gate' | 'form'
  choices: string[]
  // The pick the room leans to: the one primary act of a gate.
  lean: string
  draft?: { words: string; by: string }
  // Why the keeper asked a name: its from, quote and the means of each choice, from the ask's fence. None draws no line of it.
  reason?: AskWhy
}

// A wait he answered in the last few minutes, folded to one line: "● ACT: TITLE", or "● ACT: DETAIL" where the decision has a second
// term (Update: alpha, beta), cut by the cells of the line.
export type SeatFold = { act: string; title: string; detail?: string }

export type SeatActions = {
  // "Read the step ›": the card opens, under Operator.
  open: (cardId: string) => void | Promise<void>
  tap: (cardId: string, askId: string, choice: string) => void | Promise<void>
  // The words he sent: the draft as it stood or changed.
  send: (cardId: string, askId: string, words: string) => void | Promise<void>
  notNow: (cardId: string, askId: string) => void | Promise<void>
  // "Answered today N ›".
  openAnswered: () => void | Promise<void>
}

export type SeatProps = {
  ui: Ui
  // The host's surface: an app draws the card on the theme's ground (views/theme.ts), anything else LOOK's keys.
  surface?: string
  seat: string
  isHere: boolean
  // Every wait of this seat, the oldest first: the first is the one card shown.
  waits: SeatWait[]
  // The waits on the other seats of us.
  others: number
  answered: number
  folds: SeatFold[]
  actions: SeatActions
  // The layout of the column the card stands in (its width, and whether the acts stack) and the pane's columns, which set the
  // card's side padding. With none a card is as wide as its place and the acts lie in a row.
  plan?: Plan
  columns?: number
  // Whether the lean pick holds the hotkey 1 (order D1, fact 5): the pane gives it only while Letters is the open place, since the
  // dock's Letters holds that key in every other place. With none the lean holds it.
  leanKey?: boolean
  // Which part of the card is drawn: the whole of it (the default), or its head (the first row and the title) or the rest of it (the body, the
  // ask and the picks) as two cards, where tabs stand between them (order W2).
  part?: 'whole' | 'head' | 'rest'
  // The rows the rest of the card may take (order P1: nothing scrolls) and the page of its words: the body pages inside the card, the ask and
  // the picks stay where they are. With none the body is drawn whole.
  text?: { room: number; page: number; onPage: (page: number) => void }
  // His chat with the keeper on this card (views/chat.tsx): its elements stand in the rest of the card, between the words and the ask. None draws no thread.
  thread?: any[]
  // This session is the open seat of a joined room (order session open): two dim and bright lines above the card, the seat with "open here" in the accent
  // and a Shut, then what it wakes on and the last row, and the line of a wake that stopped or a submit that was refused when there is one. With none, no line.
  open?: { seat: string; last: string; note: string; onShut: () => void }
}

export const NOT_NOW = 'Not now'
// What the pane's own Button reads where the ask offers Not now itself: it still sets the wait aside, no decision, and says so.
export const ASK_LATER = 'Ask me later'

// Whether an ask offers a choice of the same words as the pane's own Button that sets a wait aside (the words as they read, no ULID,
// no case, no space round them): then the pane's own Button reads ASK_LATER, and the ask's choice stands in its own place among the picks.
export const asksNotNow = (choices: string[]): boolean => choices.some(choice => stripUlid(choice).trim().toLowerCase() === NOT_NOW.toLowerCase())

// The name of the page of a letter's words, in the pane's memory of pages (order P1).
export const LETTER_TEXT = 'letter-text'
export const READ_STEP = 'Read the step'
export const FORM_PLACEHOLDER = 'Write your answer'
export const NOTHING_WAITS = 'Nothing waits on any seat.'
export const DRAFT_LINE = 'drafted a name: send it, or change it first.'

// What every view of the seat face shares: the colors and the box of a card, on the theme's ground and in the theme's keys
// in an app (order D1: the app paints a control by its own theme, so the ground follows it) and in LOOK's keys elsewhere,
// and the link, a plain Button of its label alone, with an arrow after its words.
function kit(ui: Ui, surface?: string, columns?: number) {
  const { Box, Button } = ui
  const app = isApp(surface)
  const dim = app ? THEME.dim : LOOK.quiet
  const accent = app ? THEME.accent : LOOK.accent
  const warn = app ? THEME.warn : LOOK.warn
  const ok = app ? THEME.ok : LOOK.ok
  // The words of a card of the app have no color: the theme's own text.
  const ink = {}
  const wrap = app ? { wrap: 'wrap' } : {}
  // A card of the app takes the width of its column when it is given one; with none, and in the terminal, as it was.
  const card = (key: string, children: any[], width?: number) => (
    <Box key={key} {...(app ? cardProps(width, columns) : { flexDirection: 'column', gap: SPACE.line, ...LOOK.section })}>
      {children}
    </Box>
  )
  // The link, a plain Button with an arrow after its words. In the app it is its label alone, and the label that does not fit
  // the card's cells (`inner`) is the short one, else cut.
  const link = (key: string, words: string, onPress: () => void, inner = Number.POSITIVE_INFINITY, short?: string) =>
    app ? (
      <Button key={key} plain label={fitted(`${words} ›`, inner, short === undefined ? undefined : `${short} ›`)} onPress={onPress} />
    ) : (
      <Button key={key} label={`${words} ›`} onPress={onPress} />
    )
  return { app, dim, accent, warn, ok, ink, wrap, card, link }
}

// The seat face (frames 1 to 3 of PaneSeat2). Each wait he answered a few minutes ago is a line above: "● ACT: TITLE"
// in a small box of its own, the dot in the ok color (Undo is held). With no wait, one card: "Nothing waits on SEAT"
// bold and "this seat" dim at the right when it is this seat, "N wait on other seats of us, one step up." dim (the
// path's `us` opens that level) and "Answered today N ›" a plain Button, each left out at 0. With a wait, the one card of the
// first (order D1): in the app a first row, "FROM · a question for you" with FROM in the accent
// (left out when no seat asks) and the age dim at the right, then the title bold and the body as one block of words (the
// title wraps); in the terminal the title and its age come first. Then "Waits for you" bold and "· WHY" in the warn color. A gate
// then has "Read the step ›" at the left and, at the right (stacked under the plan's stack), Not now secondary, the lean pick
// primary with the hotkey 1 and the other picks secondary; where the ask offers "Not now" itself (asksNotNow) the pane's own Button
// reads "Ask me later" (it still sets the wait aside) and the ask's pick stands among the picks. The card's words are drawn line by line: a line a Text, each wrapped by its own cells,
// so the card counts the rows the app draws and pages by lines. Every Button of the app is its label alone. A form has, with a
// seat's draft, "The DRAFTER drafted a name: send it, or change it first." (the drafter bold), the Input holding the
// draft with "send" the one primary act, and Not now secondary under it; with no draft the Input is empty and the
// line is left out. Every key carries the card and the ask. In the terminal the same lines are a column in LOOK's theme
// keys with string labels, no hover and no hex. The CLI host cannot draw the app branch. Returns the elements to sit
// among the children of the pane.
export function seatView({ ui, surface, seat, isHere, waits, others, answered, folds, actions, plan, columns, leanKey = true, part = 'whole', text: paging, thread = [], open }: SeatProps) {
  const { Box, Text, Button, Input } = ui
  const { app, dim, accent, warn, ok, ink, wrap, card, link } = kit(ui, surface, columns)
  const width = plan?.width
  // The open seat's two lines, with no frame of their own so they take two rows of the canvas (three where a line says a wake stopped).
  const openViews =
    open === undefined || part === 'rest'
      ? []
      : [
          <Box key="seat-open" flexDirection="column">
            <Box key="seat-open-head" flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
              <Box key="seat-open-name" flexDirection="row" columnGap={SPACE.near}>
                <Text bold {...ink}>
                  {open.seat}
                </Text>
                <Text color={accent}>{OPEN_HERE}</Text>
              </Box>
              <Button key={SEAT_SHUT_KEY} label={SHUT_BUTTON} variant="secondary" onPress={open.onShut} />
            </Box>
            <Text key="seat-open-wakes" color={dim}>
              {wakesLine(open.seat, open.last)}
            </Text>
            {open.note !== '' && (
              <Text key="seat-open-note" color={warn} {...wrap}>
                {open.note}
              </Text>
            )}
          </Box>,
        ]
  // A head row of the app wraps when its parts do not fit the card: the second part goes under the first, at the right.
  const wrapRow = app ? ({ flexWrap: 'wrap', rowGap: SPACE.line } as const) : {}

  // The cells of the words of a fold line in the app: the card's width less its border, its side padding, the dot and the gap after it.
  const foldCells = width === undefined ? Number.POSITIVE_INFINITY : width - 2 - 2 * SPACE.control - 1 - SPACE.near
  const foldViews = folds.map((fold, i) => (
    <Box
      key={`seat-fold-${i}`}
      flexDirection="row"
      columnGap={SPACE.near}
      {...(app
        ? { borderStyle: 'round', borderColor: THEME.line, backgroundColor: THEME.ground, paddingX: SPACE.control, ...(width === undefined ? {} : { width }) }
        : LOOK.frame)}
    >
      <Text color={ok}>●</Text>
      {fold.detail === undefined ? (
        <Text color={dim}>{`${fold.act}: ${fold.title}`}</Text>
      ) : (
        <Text color={dim} wrap="truncate-end">
          {app ? fitted(`${fold.act}: ${fold.detail}`, foldCells) : `${fold.act}: ${fold.detail}`}
        </Text>
      )}
    </Box>
  ))

  const wait = waits[0]
  if (wait === undefined) {
    if (part === 'rest') return []
    return [
      ...openViews,
      ...foldViews,
      card('seat-quiet', [
        <Box key="seat-quiet-head" flexDirection="row" justifyContent="space-between" columnGap={SPACE.control} {...wrapRow}>
          <Text bold {...ink}>{`Nothing waits on ${seat}`}</Text>
          {isHere && seat !== THIS_SEAT && <Text color={dim}>this seat</Text>}
        </Box>,
        others > 0 && (
          <Text key="seat-others" color={dim}>
            {`${others} ${others === 1 ? 'waits' : 'wait'} on other seats of us, one step up.`}
          </Text>
        ),
        answered > 0 &&
          link(
            'seat-answered',
            `Answered today ${answered}`,
            () => {
              void actions.openAnswered()
            },
            innerOf(width, columns),
          ),
      ], width),
    ]
  }

  const at = `${wait.cardId}-${wait.askId}`
  // Every Button is its label alone: the app paints it by its own theme, and a child is not drawn.
  const notNow = (
    <Button
      key={`seat-notnow-${at}`}
      label={asksNotNow(wait.choices) ? ASK_LATER : NOT_NOW}
      variant="secondary"
      onPress={() => {
        void actions.notNow(wait.cardId, wait.askId)
      }}
    />
  )
  const pick = (choice: string, i: number) => {
    const words = stripUlid(choice)
    const lean = choice === wait.lean
    const key = `seat-pick-${at}-${i}`
    const onPress = () => {
      void actions.tap(wait.cardId, wait.askId, choice)
    }
    return <Button key={key} label={words} variant={lean ? 'primary' : 'secondary'} {...(lean && leanKey ? { hotkey: '1' } : {})} onPress={onPress} />
  }
  // The lean pick comes first among the picks, then the others in their order.
  const picks = wait.choices.map((choice, i) => ({ choice, i })).sort((a, b) => Number(b.choice === wait.lean) - Number(a.choice === wait.lean))

  const draft = wait.draft
  const form = (
    <Box key={`seat-form-${at}`} flexDirection="column" gap={SPACE.line}>
      {draft !== undefined && (
        <Box key={`seat-draft-${at}`} flexDirection="row" flexWrap="wrap" columnGap={SPACE.near}>
          <Text color={dim}>The</Text>
          <Text bold {...ink}>
            {draft.by}
          </Text>
          <Text color={dim}>{DRAFT_LINE}</Text>
        </Box>
      )}
      <Input
        key={`seat-input-${at}`}
        label="Answer"
        placeholder={FORM_PLACEHOLDER}
        value={draft === undefined ? '' : draft.words}
        submitLabel="send"
        onSubmit={(value: string) => {
          const words = value.trim()
          if (words === '') return
          void actions.send(wait.cardId, wait.askId, words)
        }}
      />
      <Box key={`seat-form-foot-${at}`} flexDirection="row" justifyContent="flex-end">
        {notNow}
      </Box>
    </Box>
  )
  // In the app the link is at the left and the picks at the right, or stacked under the plan's stack; the terminal's row is as it was.
  const gate = (
    <Box
      key={`seat-acts-${at}`}
      {...(app ? actsProps(plan?.stack) : { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', columnGap: SPACE.control })}
    >
      {link(`seat-read-${at}`, READ_STEP, () => {
        void actions.open(wait.cardId)
      })}
      <Box key={`seat-picks-${at}`} {...(app ? picksProps : { flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACE.near })}>
        {notNow}
        {picks.map(({ choice, i }) => pick(choice, i))}
      </Box>
    </Box>
  )

  // The first row of a wait in the app: who asks in the accent and what it is dim, the age at the right.
  // The terminal's first row is the title and its age.
  const asks =
    wait.from !== '' ? (
      <Box key={`seat-from-${at}`} flexDirection="row" columnGap={SPACE.near} {...(app ? { flexWrap: 'wrap' } : {})}>
        <Text color={accent}>{wait.from}</Text>
        <Text color={dim}>· a question for you</Text>
      </Box>
    ) : undefined
  const age =
    wait.age !== '' ? (
      <Box key={`seat-age-${at}`} flexShrink={0}>
        <Text color={dim}>{wait.age}</Text>
      </Box>
    ) : undefined
  const title = (
    <Text bold {...ink} wrap="wrap">
      {wait.title}
    </Text>
  )
  // The words of the card, a Text a line: a new line is a row of its own (an empty line is a row), never a space in one run of words.
  const lines = wait.body === '' ? [] : wait.body.split('\n')
  const body = lines.map((line, i) => (
    <Text key={`seat-body-${at}-${i}`} {...ink} {...wrap}>
      {line === '' ? ' ' : line}
    </Text>
  ))
  // Whole: the title and the body are one block of words, with no row between them. Split (a letter with tabs under its head, order W2):
  // the head is the first row and the title, the rest starts with the body.
  const whole = part === 'whole'
  const head = app
    ? [
        (asks !== undefined || age !== undefined) && (
          <Box key={`seat-head-${at}`} flexDirection="row" justifyContent="space-between" columnGap={SPACE.control} {...wrapRow}>
            {asks ?? <Box key={`seat-from-${at}`} />}
            {age}
          </Box>
        ),
        <Box key={`seat-words-${at}`} flexDirection="column">
          {title}
          {whole && body}
        </Box>,
      ]
    : [
        <Box key={`seat-head-${at}`} flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
          <Box key={`seat-title-${at}`} flexShrink={1}>
            {title}
          </Box>
          {age}
        </Box>,
        asks,
        whole && body,
      ]
  // Why the keeper asked a name (order room-feed, part A): who said the words, the line that holds the name, and what each choice does, each a line in the dim
  // color from the ask's fence (model/gate.ts reasonText); none where the fence holds no quote.
  const reasons = wait.reason === undefined ? [] : reasonText(wait.reason)
  const ask = [
    <Box key={`seat-ask-${at}`} flexDirection="row" flexWrap="wrap" columnGap={SPACE.near}>
      <Text bold {...ink}>
        Waits for you
      </Text>
      {wait.why !== '' && <Text color={warn}>{`· ${wait.why}`}</Text>}
    </Box>,
    ...(reasons.length === 0
      ? []
      : [
          <Box key={`seat-reason-${at}`} flexDirection="column">
            {reasons.map((line, i) => (
              <Text key={`seat-reason-${at}-${i}`} color={dim} {...wrap}>
                {line}
              </Text>
            ))}
          </Box>,
        ]),
    wait.kind === 'form' ? form : gate,
  ]

  if (part === 'head') return [...openViews, ...foldViews, card(`seat-letter-head-${at}`, head, width)]
  if (part === 'rest') {
    const textBox = (kids: any[]) =>
      lines.length > 0 && (
        <Box key={`seat-text-${at}`} flexDirection="column">
          {kids}
        </Box>
      )
    // His chat with the keeper stands between the words and the ask (order keeper chat): it is measured with the ask, which the words give way to.
    const under = [...thread, ...ask]
    const stands = [textBox(body), ...under]
    if (!app || paging === undefined || width === undefined || lines.length === 0) return [card(`seat-wait-${at}`, stands, width)]
    // The body pages inside the card where the card passes the rows it has: the rows the card takes without the words, and what a block of words
    // adds to it (the gap), are measured as the pane measures, then the words are cut by the cells of the card into rows and paged.
    const names = namesOf(ui as any)
    const base = sizeOf(card('x', under, width), width, names).h
    const gapRows = sizeOf(card('x', [textBox([<Text key="x">x</Text>]), ...under], width), width, names).h - base - 1
    const cells = innerOf(width, columns)
    const rowsOf = lines.flatMap(line => wrapRows(line, cells)).map(row => (row === '' ? ' ' : row))
    const room = paging.room - base - gapRows
    if (rowsOf.length <= room) return [card(`seat-wait-${at}`, stands, width)]
    const shown = pageLines({ ui, list: LETTER_TEXT, lines: rowsOf, room, gap: SPACE.line, wanted: paging.page, inner: cells, onPage: paging.onPage })
    const words = shown.shown.map((row, i) => (
      <Text key={`seat-body-${at}-${shown.page.from + i}`} {...ink} {...wrap}>
        {row}
      </Text>
    ))
    return [
      card(
        `seat-wait-${at}`,
        [
          <Box key={`seat-text-${at}`} flexDirection="column" gap={SPACE.line}>
            <Box key={`seat-lines-${at}`} flexDirection="column">
              {words}
            </Box>
            {shown.pager}
          </Box>,
          ...under,
        ],
        width,
      ),
    ]
  }
  return [...openViews, ...foldViews, card(`seat-wait-${at}`, [...head, ...ask], width)]
}

export type LevelRow = {
  name: string
  // "a desk", "a seat".
  kind: string
  isHere: boolean
  count: number
  // The title of the first wait of the seat.
  first: string
}

export type LevelActions = {
  openSeat: (name: string) => void | Promise<void>
  moreSeats: () => void | Promise<void>
  openRoom: () => void | Promise<void>
}

export type LevelProps = {
  ui: Ui
  surface?: string
  // The width of the layer the card stands in, in cells (the pane's layerWidth): the card of an app takes it. With none,
  // and in the terminal, the card is as wide as it was.
  width?: number
  // The layout of the column and the pane's columns (see SeatProps); the plan's width wins over `width`.
  plan?: Plan
  columns?: number
  // The waits in all, on how many seats of the seats the room knows.
  total: number
  seatsWithWait: number
  seatsKnown: number
  // A row for each seat with a wait, and the names of the seats with none.
  rows: LevelRow[]
  idle: string[]
  allSeats: boolean
  isOperator: boolean
  actions: LevelActions
}

// One level up (frame 4 of PaneSeat2): one card on the theme's ground. "Waits on each seat" bold and "T, on S seats of N; the first
// of each." dim (with no wait at all, "Nothing waits on any seat."). A row for each seat with a wait: the name a plain Button in the accent with an arrow that opens
// that seat's face (this seat is bold with no Button, then "· here" and "you, this session" dim), the kind dim, "N
// waiting" bold at the right, and under it the first wait's title dim on one line. Then "M more seats, nothing waits
// ›", a plain Button that opens them (`allSeats`: the names of the idle seats one row each, dim, and no Button), left
// out at 0. "Who sits, what it plays, the door ›" is a plain Button only under Operator. In the terminal the same
// lines are a column in LOOK's theme keys with string labels, no hover and no hex. The CLI host cannot draw the app
// branch. Returns the elements to sit among the children of the pane.
export function levelView({ ui, surface, width: given, plan, columns, total, seatsWithWait, seatsKnown, rows, idle, allSeats, isOperator, actions }: LevelProps) {
  const { Box, Text } = ui
  const { app, dim, ink, card, link } = kit(ui, surface, columns)
  const width = plan?.width ?? given
  const inner = innerOf(width, columns)
  // In an app the seat's row wraps inside the card: the name, the kind and "you, this session" are a line that wraps,
  // the count keeps its width and drops under them when the row is narrow. The terminal's row is as it was.
  const wrapRow = app ? ({ flexWrap: 'wrap', flexShrink: 1 } as const) : {}

  const rowViews = rows.map(row => (
    <Box key={`level-seat-${row.name}`} flexDirection="column">
      <Box key={`level-seat-head-${row.name}`} flexDirection="row" {...wrapRow} justifyContent="space-between" columnGap={SPACE.control}>
        <Box key={`level-seat-left-${row.name}`} flexDirection="row" {...wrapRow} columnGap={SPACE.near}>
          {row.isHere ? (
            <Text bold {...ink}>
              {row.name}
            </Text>
          ) : (
            link(
              `level-open-${row.name}`,
              row.name,
              () => {
                void actions.openSeat(row.name)
              },
              inner,
            )
          )}
          {row.isHere ? <Text color={dim}>· here</Text> : row.kind !== '' && <Text color={dim}>{row.kind}</Text>}
          {row.isHere && <Text color={dim}>you, this session</Text>}
        </Box>
        {app ? (
          <Box key={`level-seat-count-${row.name}`} flexShrink={0}>
            <Text bold {...ink}>{`${row.count} waiting`}</Text>
          </Box>
        ) : (
          <Text bold {...ink}>{`${row.count} waiting`}</Text>
        )}
      </Box>
      {row.first !== '' && (
        <Text color={dim} wrap="truncate-end">
          {row.first}
        </Text>
      )}
    </Box>
  ))
  const idleViews = allSeats
    ? idle.map(name => (
        <Text key={`level-idle-${name}`} color={dim}>
          {name}
        </Text>
      ))
    : []

  return [
    card('level', [
      <Box key="level-head" flexDirection="column">
        <Text bold {...ink}>
          Waits on each seat
        </Text>
        <Text color={dim}>
          {total === 0 ? NOTHING_WAITS : `${total}, on ${seatsWithWait} ${seatsWithWait === 1 ? 'seat' : 'seats'} of ${seatsKnown}; the first of each.`}
        </Text>
      </Box>,
      <Box key="level-rows" flexDirection="column" gap={SPACE.line}>
        {rowViews}
      </Box>,
      idle.length > 0 &&
        (allSeats ? (
          <Box key="level-idle" flexDirection="column">
            {idleViews}
          </Box>
        ) : (
          link(
            'level-more',
            `${idle.length} more ${idle.length === 1 ? 'seat' : 'seats'}, nothing waits`,
            () => {
              void actions.moreSeats()
            },
            inner,
            `${idle.length} more ${idle.length === 1 ? 'seat' : 'seats'}`,
          )
        )),
      isOperator &&
        link(
          'level-room',
          'Who sits, what it plays, the door',
          () => {
            void actions.openRoom()
          },
          inner,
          'Who sits',
        ),
    ], width),
  ]
}
