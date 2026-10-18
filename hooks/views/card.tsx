import { lensOn } from '../model/feed'
import { gatesOf } from '../model/gate'
import { actLine } from '../model/operator'
import { panelChip } from '../model/tree'
import { draftLines, isListening, openAsks, readingBoxes, sayLine } from '../model/walk'
import { FROM_SESSION, answerOf, closedBody, titleRoom, whoPieces, wordsBodyOf, wrappedAt } from './card-rows'
import { gateView } from './gate'
import type { GateExtras } from './gate'
import { isApp } from './glass'
import { LOOK } from './look'
import { chipsView, pieceTableView, tabsView, walkHeadView } from './operator'
import { handedLine, slotView } from './slot'
import { taskDetailView, taskLabel, taskPieces, taskRowView } from './task'
import { THEME, cardProps, fitted, innerOf } from './theme'
import type { Plan } from './theme'
import { eventsView, traceView, treeView } from './trace'
import { turnView } from './turn'
import type { CardProps } from './types'

// The card's props and, for an app's open card, what its gate needs beyond them (order B-P23): the gate's own
// actions, the text of rules.md, the rules taken off. The pane wires them; with none the picks tap by the
// card's `actions.tap` and the gate draws no "Send as drafted", no "Ask me next time" and no press on a rule. The card of an
// app also takes the layout of its column (order D1): `plan` (its width) and the pane's `columns` (its side padding); with none
// it is as wide as its place.
// `leanKey` is whether a gate's lean pick holds the hotkey 1 (the pane's switch of the app's hotkeys); with none it holds it.
export type GateCardProps = CardProps & { gate?: GateExtras; plan?: Plan; columns?: number; leanKey?: boolean }

// A voice card has no words until the final transcript of its audio object stands.
const LISTENING = 'the room is listening'

// The author line of a card the harness sent (order B-S7): the session's, never his name. It stands in card-rows.ts, which counts it.
export { FROM_SESSION }

// A dashed rule, a line of ┄ in the quiet color. The host refuses a Box with one border edge ("borderTop is
// not allowed") and the kit has no width to read, so the rule is a fixed 56 columns: whole at 60 columns and
// wider, cut with "…" in a pane narrower still. The header draws two, a card one.
export const RULE = '┄'.repeat(56)

export function ruleView(ui: { Text: any }, key: string) {
  const { Text } = ui
  return (
    <Text key={key} color={LOOK.quiet} wrap="truncate-end">
      {RULE}
    </Text>
  )
}

// The frame of a box of the card: the accent on the open card, the plain frame of the look on the others.
const boxLook = (isOpen: boolean) => (isOpen ? LOOK.open : LOOK.section)

// "1d ago", or "now".
const agoOf = (age: string): string => (age === '' || age === 'now' ? age : `${age} ago`)

// One card of the feed, as the node's message: the machine's voice in the quiet color (its id and age, its
// act line, its readings' labels), his words and the room's answer in the text color, and no frame round the
// card: the boxes are the frames, round, in the accent on the open card and the plain frame on the others.
// The top line is the card's id at the left and its age at the right (and "● live" in the accent while the
// room still walks it), a dashed rule under it, the TEXT box with his words, a quiet act line and the egress
// box (the slot; it is asked for its brief on a card that is not open). A card that is not open
// has the header (and a button that opens it), the rule, the TEXT box and the brief egress box.
// The open card is read in a lens: news (its readings, its act line, the asked line, the turn, the egress),
// walk (the block tree, the text box under the root, a reading under its object, the egress under the route),
// trace (its blocks as written, then the egress box); the lens switch is the egress box's, at its foot
// (the slot gets brief, isOpen and lens). On the operator face
// the open card is the walk panel instead: its head (id, ended, a chip, wall, events, blocks), the tabs
// overview (the block tree and the machine line), events, blocks and egress (the layout and its table), and
// a card that is not open is the head line alone with its words.
// A card with no words says "the room is listening" until its voice's final transcript stands, then that
// is its words; each reading of an object is a box of its own under the words.
// In an app (`surface`) the card of the us face, in its Public lens, is the card on glass instead
// (glassCardView below); the open card read in the walk or trace lens and the operator lens keep the
// drawing above.
export function cardView(props: GateCardProps) {
  const { ui, face, card, age, asked, isOpen, entries, versions, walks, roomFiles, now, pickedRow, zone = 0, actions } = props
  const { Box, Text, Button } = ui
  const isOperator = face === 'operator'
  const lens = lensOn(props.lens, face)
  const at = card.id
  if (isApp(props.surface) && !isOperator && (!isOpen || lens === 'news')) return glassCardView(props)

  const boxView = (label: string, words: string, key: string, isQuiet = false) => (
    <Box key={`${key}-${at}`} flexDirection="column" {...boxLook(isOpen)}>
      <Text color={LOOK.quiet}>{label}</Text>
      <Text {...(isQuiet ? { color: LOOK.quiet } : {})}>{words}</Text>
    </Box>
  )
  // A card the harness sent: its one line, the block whole (tags out) dim under Operator when open, and the author
  // line. A task notification is the one line of its egress layout `task` (the name and the status) in place of the
  // words. Its asks wait on nobody in Public: the door's question about a word of a harness message is not his to answer.
  const harness = card.walk.source === 'harness'
  const task = card.walk.task
  const turns = () => (harness && !isOperator ? [] : turnView({ ui, face, card, asks: openAsks(card.raw), entries, walks, now, actions }))
  const wordsView = () =>
    isListening(card.raw)
      ? boxView('TEXT', LISTENING, 'text', true)
      : task
        ? taskRowView({ ui, task, roomFiles, at, isGlass: false })
        : harness && isOpen && isOperator
          ? boxView('TEXT', card.walk.words, 'text', true)
          : boxView('TEXT', card.text, 'text')
  const fromView = () =>
    harness && (
      <Text key={`author-${at}`} color={LOOK.quiet}>
        {FROM_SESSION}
      </Text>
    )
  // A card said to seats (order C3): one quiet line under its words, `to NAME, NAME` and `answers` with the first words of the
  // card answered; none for a card with neither. It is a list of one or none, so a row of children can spread it.
  const saidViews = (): any[] => {
    const line = sayLine(card.walk, walks)
    return line === '' ? [] : [<Text key={`said-${at}`} color={LOOK.quiet}>{line}</Text>]
  }
  // Under Operator alone, an open task shows its ids and its output file, dim.
  const detailView = () => (task ? taskDetailView({ ui, task, at }) : [])
  const readings = readingBoxes(card.raw)
  const readingViews = (objectId?: string) =>
    readings.flatMap((box, i) => (objectId === undefined || box.objectId === objectId ? [boxView(box.label.toUpperCase(), box.text, `reading-${i}`)] : []))
  const slot = () => slotView({ ui, face, card, entries, walks, roomFiles, brief: !isOpen, isOpen, lens, actions })

  // The operator face: the walk panel of the open card, the head line and the words of the others.
  if (isOperator) {
    if (!isOpen) {
      return (
        <Box flexDirection="column" marginBottom={1}>
          {walkHeadView({ ui, card, zone, isOpen, actions })}
          {fromView()}
          {isListening(card.raw) ? (
            <Text key={`words-${at}`} color={LOOK.quiet}>
              {LISTENING}
            </Text>
          ) : task ? (
            wordsView()
          ) : (
            <Text key={`words-${at}`}>{card.text}</Text>
          )}
          {saidViews()}
        </Box>
      )
    }
    return (
      <Box flexDirection="column" marginBottom={1}>
        {walkHeadView({ ui, card, zone, isOpen, actions })}
        {fromView()}
        {detailView()}
        {tabsView({ ui, card, lens, entries, roomFiles, actions })}
        {lens === 'walk' && turns()}
        {lens === 'walk' &&
          treeView({
            ui,
            face,
            card,
            isOpen,
            entries,
            roomFiles,
            pickedRow,
            under: {
              root: [
                wordsView(),
                ...saidViews(),
                ...draftLines(card.raw).map((line, i) => (
                  <Text key={`draft-${at}-${i}`} color={LOOK.quiet}>
                    {line}
                  </Text>
                )),
                ...chipsView({ ui, card, versions, entries, roomFiles }),
              ],
              route: slot(),
              objects: Object.fromEntries(readings.map(box => [box.objectId, readingViews(box.objectId)])),
            },
            actions,
          })}
        {lens === 'events' && eventsView({ ui, card, zone })}
        {lens === 'trace' && traceView({ ui, card, pickedRow, actions })}
        {lens === 'egress' && pieceTableView({ ui, card, entries, roomFiles })}
      </Box>
    )
  }

  const chip = panelChip(card)
  const act = isOpen ? actLine(card.raw) : ''
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="row" justifyContent="space-between">
        <Text color={LOOK.quiet}>{card.id}</Text>
        <Box flexDirection="row" columnGap={1}>
          {chip.kind === 'live' && (
            <Text key={`state-${at}`} color={LOOK.accent}>
              {chip.text}
            </Text>
          )}
          <Text color={LOOK.quiet}>{agoOf(age)}</Text>
          {!isOpen && (
            <Button
              key={`card-${at}`}
              label="open"
              onPress={() => {
                void actions.open({ view: 'feed', cardId: card.id, lens: 'news' })
              }}
            />
          )}
        </Box>
      </Box>
      {ruleView(ui, `rule-${at}`)}
      {fromView()}
      {!isOpen && wordsView()}
      {!isOpen && saidViews()}
      {!isOpen && slot()}
      {isOpen && lens === 'news' && wordsView()}
      {isOpen && lens === 'news' && saidViews()}
      {isOpen && lens === 'news' && readingViews()}
      {isOpen && lens === 'news' && act !== '' && (
        <Text key={`act-${at}`} color={LOOK.quiet}>
          {act}
        </Text>
      )}
      {isOpen && lens === 'news' && asked !== '' && <Text color={LOOK.quiet}>{asked}</Text>}
      {isOpen && lens === 'news' && turns()}
      {isOpen && lens === 'news' && slot()}
      {isOpen &&
        lens === 'walk' &&
        treeView({
          ui,
          face,
          card,
          isOpen,
          entries,
          roomFiles,
          pickedRow,
          under: {
            root: [wordsView(), ...saidViews()],
            route: slot(),
            objects: Object.fromEntries(readings.map(box => [box.objectId, readingViews(box.objectId)])),
          },
          actions,
        })}
      {isOpen && lens === 'trace' && wordsView()}
      {isOpen && lens === 'trace' && saidViews()}
      {isOpen && lens === 'trace' && traceView({ ui, card, pickedRow, actions })}
      {isOpen && lens === 'trace' && slot()}
    </Box>
  )
}

// The card of an app, for a card of the feed: the one card of views/theme.ts, its border the accent while it is open.
const cardBox = (props: GateCardProps, isOpen: boolean) => ({
  ...cardProps(props.plan?.width, props.columns),
  ...(isOpen ? { borderColor: THEME.accent } : {}),
  hover: { borderColor: THEME.accent },
})

// The card of the feed in an app, for a part of the us face (the face of the program us, the feed of cards), drawn
// in its Public lens. One keyed Box on the theme's ground whose border goes to the accent under the pointer, its
// words in the theme's keys (views/theme.ts) and every Button its label alone: the app draws a Button by its label and
// does not draw a child. At rest: the title (his words), as the one plain Button that opens the card and is cut at its
// end to the cells the age leaves, the age dim beside it, the seat that wrote it, the answer cut at BODY_ROWS rows of the card's
// width (a card said to seats with no answer shows its own words there, when its title could not hold them), and, when the
// card waits on him, its gate (gateView, as open; the one waits line when the walk holds no open ask), and the
// answered line of each gate that closed ("● answered by the keeper · your rule: WORDS ›", Ask me next time).
// Open: the card takes the column's place, the border is the accent, a plain link Back on top (no window over the column),
// the title row, a meta row, the gate that waits (gateView: the question, the picks, a seat's draft, his Input) or
// else the layout's sentence (slotView in an app), the answer whole as wrapped Text (Markdown takes no color, so no
// Markdown is drawn here), the rows
// of each gate that closed (Asked, Decided, Door, Rule: gateView) and a row for each reading. A card the room
// handed to a program says "Handed to ur." in one dim line (the closed card here, the open card in its slot), and
// its answer is named by the instance: "ur · game", accent and dim, above the answer.
function glassCardView(props: GateCardProps) {
  const { ui, face, card, age, isOpen, entries, walks, roomFiles, actions } = props
  const { Box, Text, Button } = ui
  const at = card.id
  const walk = card.walk
  const inner = innerOf(props.plan?.width, props.columns)
  // A task notification is the one line of its egress layout `task`, the name and the status, in the title's place.
  const taskPiecesOf = walk.task && taskPieces({ ui, task: walk.task, roomFiles, at, isGlass: true })
  // A card the harness sent says so, dim: it is the session's and never his words, and its asks wait on nobody here
  // (order B-M5): no gate, no "Waits for you", and its whole text is the operator face's alone.
  const harness = walk.source === 'harness'
  const waitsOnHim = walk.waiting && !harness
  const gates = harness ? [] : gatesOf(card.raw)
  const drawGate = (gate: (typeof gates)[number], rest = false) =>
    gateView({
      ui,
      surface: props.surface,
      cardId: at,
      gate,
      actions: { tap: actions.tap, ...props.gate?.actions },
      rulesText: props.gate?.rulesText,
      takenOff: gate.decision?.rule !== undefined && (props.gate?.takenOff ?? []).includes(gate.decision.rule),
      rest,
      ...(props.leanKey === undefined ? {} : { leanKey: props.leanKey }),
    })
  // The gate that waits, the first of the card; none when the walk waits but holds no open ask.
  const waiting = gates.filter(gate => gate.decision === undefined).slice(0, 1)
  const chip = panelChip(card)
  const answer = answerOf(walk)
  const title = isListening(card.raw) ? LISTENING : card.text
  const readings = readingBoxes(card.raw)

  const live = chip.kind === 'live' && (
    <Text key={`state-${at}`} color={THEME.accent}>
      {chip.text}
    </Text>
  )
  // The rows below are drawn from the cells cardRows counts them by (card-rows.ts): the author and the answerer are one row cut to
  // the inner width, the handed and said lines are the rows of wrapCells joined by new lines.
  const whoRow = (key: string, name: string) => {
    const piece = whoPieces(name, walk.act, inner)
    return (
      <Box key={`${key}-${at}`} flexDirection="row" columnGap={1}>
        <Text color={THEME.accent}>{piece.name}</Text>
        {piece.act !== '' && <Text color={THEME.dim}>{piece.act}</Text>}
      </Box>
    )
  }
  const author = harness ? (
    <Text key={`author-${at}`} color={THEME.dim}>
      {fitted(FROM_SESSION, inner)}
    </Text>
  ) : (
    walk.session !== '' && whoRow('author', walk.session)
  )
  // A card handed to a program (order B-P8): the closed card says so in one dim line (the open card's slot does),
  // and an answer names the instance that wrote it, as the author row names a session: "ur · game".
  const handed = walk.handedTo !== '' && (
    <Text key={`handed-${at}`} color={THEME.dim}>
      {wrappedAt(handedLine(walk.handedTo), inner)}
    </Text>
  )
  // A card said to seats (order C3): `to NAME, NAME` and `answers` with the first words of the card answered, dim, in its wrapped rows.
  const sayText = sayLine(walk, walks)
  const said = sayText !== '' && (
    <Text key={`said-${at}`} color={THEME.dim}>
      {wrappedAt(sayText, inner)}
    </Text>
  )
  const answerer = walk.handedTo !== '' && !waitsOnHim && answer !== '' && whoRow('answerer', walk.handedTo)
  const waits = waitsOnHim && (
    <Box key={`waits-${at}`} flexDirection="row" flexWrap="wrap" columnGap={1}>
      <Text bold color={THEME.warn}>
        Waits for you
      </Text>
      <Text color={THEME.warn}>{`· ${walk.question}`}</Text>
    </Box>
  )

  // The words of a card said to seats that has no answer, when its title could not hold them: its body, in the open card whole.
  const liveWord = chip.kind === 'live' ? chip.text : ''
  const sayerWords = (room: number) => (answer === '' ? wordsBodyOf(card, room) : '')

  if (!isOpen) {
    // The body is cut at BODY_ROWS rows of the card's inner width (card-rows.ts); the rest is in the open card.
    const shown = closedBody(card, age, inner)
    const body = answer === '' ? 'body' : 'answer'
    // The title is the label of the Button that opens the card: a task notification says its one line there, and the label is
    // cut at its end to the cells that the age and the live word leave.
    const words = walk.task ? taskLabel({ task: walk.task, roomFiles }) : title
    const room = titleRoom(inner, age, liveWord)
    return (
      <Box key={at} {...cardBox(props, false)}>
        <Box key={`head-${at}`} flexDirection="row" alignItems="center" columnGap={1}>
          <Button
            key={`card-${at}`}
            plain
            label={fitted(words, room)}
            onPress={() => {
              void actions.open({ view: 'feed', cardId: card.id, lens: 'news' })
            }}
          />
          <Text key={`age-${at}`} color={THEME.dim}>
            {age}
          </Text>
          <Box key={`grow-${at}`} flexGrow={1} />
          {live}
        </Box>
        {author}
        {said}
        {handed}
        {answerer}
        {!waitsOnHim && shown.length > 0 && (
          <Text key={`${body}-${at}`} wrap="wrap">
            {shown.join('\n')}
          </Text>
        )}
        {waitsOnHim && waiting.length > 0 ? waiting.map(gate => drawGate(gate)) : waits}
        {gates.filter(gate => gate.decision !== undefined).map(gate => drawGate(gate, true))}
      </Box>
    )
  }

  const count = `${readings.length} reading${readings.length === 1 ? '' : 's'}`
  const ago = age === '' || age === 'now' ? age : `${age} ago`
  const meta = [ago, readings.length > 0 ? count : ''].filter(part => part !== '').join(' · ')
  // The open card takes the column's place, so a plain link Back is the first thing in it: the column comes back under it.
  const openWords = sayerWords(titleRoom(inner, '', liveWord))
  return (
    <Box key={at} {...cardBox(props, true)}>
      <Box key={`back-row-${at}`} flexDirection="row">
        <Button
          key={`back-${at}`}
          plain
          label="‹ Back"
          onPress={() => {
            void actions.open({ view: 'feed', cardId: '', lens: 'news' })
          }}
        />
      </Box>
      <Box key={`head-${at}`} flexDirection="row" alignItems="center" columnGap={1}>
        {taskPiecesOf || (
          <Text bold wrap="truncate-end">
            {title}
          </Text>
        )}
        <Box key={`grow-${at}`} flexGrow={1} />
        {live}
      </Box>
      {meta !== '' && (
        <Text key={`meta-${at}`} color={THEME.dim}>
          {meta}
        </Text>
      )}
      {author}
      {said}
      {waitsOnHim
        ? waiting.map(gate => drawGate(gate))
        : slotView({ ui, face, card, entries, walks, roomFiles, isOpen, surface: props.surface, actions })}
      {answerer}
      {!waitsOnHim && answer !== '' && (
        <Text key={`answer-${at}`} wrap="wrap">
          {answer}
        </Text>
      )}
      {!waitsOnHim && openWords !== '' && (
        <Text key={`body-${at}`} wrap="wrap">
          {openWords}
        </Text>
      )}
      {gates.filter(gate => gate.decision !== undefined).map(gate => drawGate(gate))}
      {readings.map((box, i) => (
        <Box key={`reading-${at}-${i}`} flexDirection="row" columnGap={1}>
          <Box width={12}>
            <Text color={THEME.dim}>{box.label}</Text>
          </Box>
          <Text wrap="wrap">{box.text}</Text>
        </Box>
      ))}
    </Box>
  )
}
