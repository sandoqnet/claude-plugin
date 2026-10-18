import { VERSION } from '../host'
import { countOf } from '../model/blocks'
import { drawnWords } from '../model/draws'
import type { Drawn } from '../model/draws'
import { feedOf, lensOn } from '../model/feed'
import { pickLayout } from '../model/layouts'
import { SHOWN_EVENTS, eventsOf } from '../model/motion'
import { chipsOf, factsLine, pieceTable } from '../model/operator'
import { readingOf } from '../model/reading'
import { SHOWN_CARDS, whatRuns } from '../model/shelf'
import { cardRow, headLine, machineLines, panelHead, tabsOf } from '../model/tree'
import type { ChipKind, Tone } from '../model/tree'
import { draftLines, isListening, opCard, operatorWarnings, readingBoxes, sayLine } from '../model/walk'
import { LOOK } from './look'
import { SPACE } from './space'
import { slotView } from './slot'
import { THEME, cardProps, fitted, innerOf } from './theme'
import type { Plan } from './theme'
import { eventsView, inkOf, textProps, traceView, treeView } from './trace'
import type { Ink } from './trace'
import type { Actions, BannerProps, Card, ChipsProps, Expanded, HeadProps, Lens, OperatorProps, PieceTableProps, TabsProps, Ui } from './types'

// What a chip of the walk panel says by its color: failed the fault color, held the warning color, live the
// accent, done and waits machine text.
const chipColor = (kind: ChipKind): string =>
  kind === 'fault' ? LOOK.fault : kind === 'held' ? LOOK.warn : kind === 'live' ? LOOK.accent : LOOK.quiet

// The head of the walk panel, in the quiet color but the chip: the card's id, "ended HH:MM:SS", the chip
// (a small round box on the open card, a word on the others), "wall 5.58s · 12 events · 9 blocks". A card
// that is not open is this line alone, and a button that opens it.
export function walkHeadView({ ui, card, zone, isOpen, actions }: HeadProps) {
  const { Box, Text, Button } = ui
  const head = panelHead(card, zone)
  const color = chipColor(head.chip.kind)
  return (
    <Box key={`head-${card.id}`} flexDirection="row" columnGap={1} flexWrap="wrap">
      <Text color={LOOK.quiet}>{head.id}</Text>
      {isOpen && head.ended !== '' && <Text color={LOOK.quiet}>{`ended ${head.ended}`}</Text>}
      {isOpen ? (
        <Box
          key={`chip-${card.id}`}
          borderStyle="round"
          borderColor={head.chip.kind === 'quiet' ? LOOK.frame.borderColor : color}
          paddingX={1}
        >
          <Text color={color}>{head.chip.text}</Text>
        </Box>
      ) : (
        <Text key={`chip-${card.id}`} color={color}>
          {head.chip.text}
        </Text>
      )}
      <Text color={LOOK.quiet}>{headLine(head)}</Text>
      {!isOpen && (
        <Button
          key={`card-${card.id}`}
          label="open"
          onPress={() => {
            void actions.open({ view: 'feed', cardId: card.id, lens: 'walk' })
          }}
        />
      )}
    </Box>
  )
}

// The tabs of the walk panel on one line, the shown one the primary Button, the others dim.
export function tabsView({ ui, card, lens, entries, roomFiles, actions }: TabsProps) {
  const { Box, Button } = ui
  return (
    <Box key={`tabs-${card.id}`} flexDirection="row" columnGap={1}>
      {tabsOf(card, entries, roomFiles).map(tab => (
        <Button
          key={`tab-${tab.label}`}
          label={tab.count === undefined ? tab.label : `${tab.label} ${tab.count}`}
          variant={lens === tab.lens ? 'primary' : 'secondary'}
          dimColor={lens !== tab.lens}
          onPress={() => {
            void actions.setLens(card.id, tab.lens)
          }}
        />
      ))}
    </Box>
  )
}

// The banner under the header: each warning line of the shown cards, bold, in the warning color. No
// button: the key is set outside the pane. Returns the elements to sit among the children of the pane.
export function bannerView({ ui, cards, app = false }: BannerProps & { app?: boolean }) {
  const { Text } = ui
  return operatorWarnings(cards.map(card => opCard(card.id, card.raw))).map((line, i) => (
    <Text key={`warn-${i}`} bold color={inkOf(app).warn}>
      {line}
    </Text>
  ))
}

// What a chip says by its color: a held card the warning color, a fault the fault color; every other
// chip (the act, a late call) is machine text, the quiet color.
export function chipLook(chip: string, app = false): { color: string } {
  const ink = inkOf(app)
  if (chip === 'held') return { color: ink.warn }
  if (chip.startsWith('fault')) return { color: ink.fault }
  return { color: ink.quiet }
}

const isSignal = (chip: string): boolean => chip === 'held' || chip.startsWith('fault')

// The layout kinds that tell no more than the act or the held chip beside them.
const BARE_KINDS = ['card', 'held']

// Under a card's answer, one machine line: the word of a held card or of each fault first, in its color,
// then in the quiet color the kind of its layout, a late call and the facts line, "sending · decided by
// one match · route seat · rules v1 · Haiku 7,342 in · $0.0208 · 13.4 s". The kind says the act, so the act
// chip stands only when the layout is the plain card's (or a held card's: its word is the signal). A
// card with no decision has no line. Each key carries the card id, for the pane draws a card a feed.
// Returns the elements to sit among the children of the card.
export function chipsView({ ui, card, versions, entries = [], roomFiles = {}, app = false }: ChipsProps & { app?: boolean }) {
  const { Box, Text } = ui
  const ink = inkOf(app)
  const chips = chipsOf(card.raw)
  const facts = factsLine(card.raw, versions)
  if (chips.length === 0 && facts === '') return []
  const kind = pickLayout(readingOf(card.raw, entries), roomFiles).layout.kind
  const hasKind = !BARE_KINDS.includes(kind)
  const plain = chips.filter(chip => !isSignal(chip) && (chip === 'late call' || !hasKind))
  const quiet = [hasKind ? kind : '', ...plain, facts].filter(part => part !== '').join(' · ')
  return [
    <Box key={`chips-${card.id}`} flexDirection="row" columnGap={1}>
      {chips.filter(isSignal).map((chip, i) => (
        <Text key={`chip-${card.id}-${i}`} {...chipLook(chip, app)}>
          {chip}
        </Text>
      ))}
      {quiet !== '' && (
        <Text key={`facts-${card.id}`} color={ink.quiet}>
          {quiet}
        </Text>
      )}
    </Box>,
  ]
}

// The widest first column of the piece table: the longest role, and no more than this.
const ROLE_WIDTH = 14

// A row of the table is "ROLE · the rest": the role stands in a first column of a fixed width, the rest
// in the second.
const splitRow = (row: string): [string, string] => {
  const at = row.indexOf(' · ')
  return at < 0 ? [row, ''] : [row.slice(0, at), row.slice(at + 3)]
}

// Under the open card's machine line: the layout named once, then one Box a piece and the answer, two
// columns, all in the quiet color. Returns the elements to sit among the children of the card.
export function pieceTableView({ ui, card, entries, roomFiles, app = false }: PieceTableProps & { app?: boolean }) {
  const { Box, Text } = ui
  const ink = inkOf(app)
  const table = pieceTable(card.raw, entries, roomFiles)
  const rows = table.rows.map(splitRow)
  const width = Math.min(ROLE_WIDTH, Math.max(0, ...rows.map(([role]) => role.length)))
  return [
    <Text key={`pieces-layout-${card.id}`} color={ink.quiet}>
      {table.layout}
    </Text>,
    rows.map(([role, rest], i) => (
      <Box key={`piece-row-${card.id}-${i}`} flexDirection="row" columnGap={1}>
        <Box width={width}>
          <Text color={ink.quiet}>{role}</Text>
        </Box>
        <Text color={ink.quiet}>{rest}</Text>
      </Box>
    )),
  ]
}

// At the foot of the operator feed, in the quiet color: the pane version and the discs unpacked in the
// run folder.
export function operatorView({ ui, discs }: OperatorProps) {
  const { Box, Text } = ui
  return (
    <Box flexDirection="column" {...LOOK.section} marginBottom={1}>
      <Text color={LOOK.quiet}>What runs</Text>
      {whatRuns(VERSION, discs).map((line, i) => (
        <Text key={`runs-${i}`} color={LOOK.quiet}>
          {line}
        </Text>
      ))}
    </Box>
  )
}

// ---- the operator lens in the place (the app): one Box on solid glass, so the tables read over the scene.

export type OperatorLensProps = {
  ui: Ui
  // The shown cards, and the card the person opened ('' for none).
  cards: Card[]
  openId: string
  lens: Lens
  // The door is down: the banner stands above the rows.
  doorDown: boolean
  // The place (the app, the default) or the terminal: a row draws as rich Button children and hover in the app,
  // as Text columns and a string-label Button in the terminal.
  app?: boolean
  // The host's surface, handed to the slot of the Overview so it draws on glass in an app.
  surface?: string
  total: number
  hasOlder: boolean
  // How many shown cards the setting Gates and questions leaves out of the feed; none or 0 draws no line.
  hidden?: number
  now: number
  entries: any[]
  versions: string
  walks: any[]
  roomFiles: Record<string, string>
  zone: number
  pickedRow: number
  discs: { name: string; sha: string }[]
  // What "Show N more" and "N more ›" have opened for the open card ('' for none).
  expanded: Expanded
  // What the pane counts of itself (model/draws.ts): the foot says "draws N · scene N" beside the version; none says nothing.
  drawn?: Drawn
  // The press of the foot's row `Plays`: the room's list of discs. With none the row says its count alone.
  onPlays?: () => void
  actions: Actions
  // The layout of the column the lens stands in (order D1) and the pane's columns: the lens draws to the plan's width, its side
  // padding set by the columns, and cuts a row's words to the cells its row leaves. With none it is as wide as its place.
  plan?: Plan
  columns?: number
}

// The color of a row's tone, in the ink of the surface.
const toneOf = (ink: Ink, tone: Tone): string => (tone === 'dim' ? ink.quiet : ink[tone])
// The fixed columns of a row: the state ("waits ›" is the longest) and the wall time.
const STATE_WIDTH = 8
const WALL_WIDTH = 6
// The label column of the open card's machine lines ("Read as" is the longest).
const LABEL_WIDTH = 9

// The banner of a door that is down, a round border in the warning key.
function doorDownView(ui: Ui) {
  const { Box, Text } = ui
  return (
    <Box key="door-down" flexDirection="column" borderStyle="round" borderColor={THEME.warn} paddingX={1}>
      <Text bold color={THEME.warn}>
        The door is down.
      </Text>
      <Text color={THEME.dim}>Cards wait at the door until it is up again.</Text>
    </Box>
  )
}

// A box of the card's words under the root of the tree, in the theme's keys.
function glassBox(ui: Ui, label: string, words: string, key: string, isQuiet = false) {
  const { Box, Text } = ui
  return (
    <Box key={key} flexDirection="column" borderStyle="round" borderColor={THEME.line} paddingX={1}>
      <Text color={THEME.dim}>{label}</Text>
      <Text {...(isQuiet ? { color: THEME.dim } : {})}>{words}</Text>
    </Box>
  )
}

// One row a card in three fixed columns: his words (cut at the end of the column), the state in the color of its
// tone and the wall time. The open row has a round border in the accent, with the inner pad of the others (paddingX
// 1); the others the same cells in blank.
// In the app (the desktop app draws a Button by its label alone, and never a Box in a Button) the words are one plain
// Button whose label is the words, cut with an ellipsis to the cells the row leaves it (a label is no Text that truncates);
// the state and the wall time are Text in their fixed columns beside it, which never shrink (flexShrink 0), so the state
// stays whole at the right of the pane at any width. In the terminal the host takes one string
// label and no hover, so the columns are a Box of Text in theme keys and the press is a plain Button beside
// them, "Open ›" or "Close".
function rowView(props: OperatorLensProps, card: Card, isOpen: boolean) {
  const { ui, actions } = props
  const { Box, Text, Button } = ui
  const app = props.app !== false
  const ink = inkOf(app)
  const row = cardRow(card)
  // The cells the words keep: the card's content, less the row's padding and border, the two fixed columns and the gaps.
  const room = innerOf(props.plan?.width, props.columns) - 2 * (isOpen ? 2 : 1) - STATE_WIDTH - WALL_WIDTH - 2
  const edge = isOpen ? { borderStyle: 'round', borderColor: ink.accent, paddingX: 1 } : { paddingX: 1 }
  const press = () => {
    if (row.state === 'waits ›') {
      void actions.open({ view: 'feed', cardId: card.id, lens: 'news' })
      void actions.setFace('public')
    } else if (isOpen) {
      void actions.open({ view: 'feed', cardId: '', lens: 'walk' })
    } else {
      void actions.open({ view: 'feed', cardId: card.id, lens: 'walk' })
    }
  }
  const columns = (
    <Box flexDirection="row" columnGap={1} flexGrow={1}>
      <Box flexGrow={1}>
        <Text {...textProps(ink)} wrap="truncate-end">
          {row.words}
        </Text>
      </Box>
      <Box width={STATE_WIDTH}>
        <Text color={toneOf(ink, row.tone)}>{row.state}</Text>
      </Box>
      <Box width={WALL_WIDTH}>
        <Text color={ink.quiet}>{row.wall.padStart(WALL_WIDTH)}</Text>
      </Box>
    </Box>
  )
  if (app) {
    return (
      <Box key={`op-box-${card.id}`} flexDirection="row" columnGap={1} {...edge}>
        <Box key={`op-words-${card.id}`} flexGrow={1} flexShrink={1} minWidth={0}>
          <Button key={`op-row-${card.id}`} label={fitted(row.words, room)} plain onPress={press} />
        </Box>
        <Box key={`op-state-${card.id}`} width={STATE_WIDTH} flexShrink={0}>
          <Text color={toneOf(ink, row.tone)}>{row.state}</Text>
        </Box>
        <Box key={`op-wall-${card.id}`} width={WALL_WIDTH} flexShrink={0}>
          <Text color={ink.quiet}>{row.wall.padStart(WALL_WIDTH)}</Text>
        </Box>
      </Box>
    )
  }
  return (
    <Box key={`op-box-${card.id}`} flexDirection="row" columnGap={1} {...edge}>
      {columns}
      <Button key={`op-row-${card.id}`} label={isOpen ? 'Close' : 'Open ›'} plain onPress={press} />
    </Box>
  )
}

// The open card under its row: its title (a Text beside Close, which shrinks and cuts at its end in the cells Close leaves) and "Close", the machine lines (folded behind the Button "Machine lines ›", shut by default; open it reads "Machine lines"), the sub-lenses as Buttons in a fixed
// order (the shown one the default Button), then the shown sub-lens.
function openCardView(props: OperatorLensProps, card: Card) {
  const { ui, lens, entries, versions, walks, roomFiles, zone, pickedRow, surface, expanded, actions } = props
  const { Box, Text, Button } = ui
  const row = cardRow(card)
  // A card said to seats (order C3): one dim line under the title, `to NAME, NAME` and `answers` with the first words.
  const said = sayLine(card.walk, walks)
  const shown = lensOn(lens, 'operator')
  const readings = readingBoxes(card.raw)
  const readingViews = (objectId: string) =>
    readings.flatMap((box, i) => (box.objectId === objectId ? [glassBox(ui, box.label.toUpperCase(), box.text, `reading-${i}-${card.id}`)] : []))
  const events = eventsOf(card).length
  const limited = actions.more !== undefined && expanded.events !== true && events > SHOWN_EVENTS
  // The machine lines are folded behind one Button, shut until it is pressed; with no `more` there is no Button and they stand open.
  const machineOpen = actions.more === undefined || expanded.machine === true
  const body = (): any[] => {
    if (shown === 'events') {
      return [
        ...eventsView({ ui, card, zone, app: true, limit: limited ? SHOWN_EVENTS : undefined, width: innerOf(props.plan?.width, props.columns) - 4 }),
        ...(limited
          ? [
              <Box key="more-events-row" flexDirection="row">
                <Button
                  key="more-events"
                  label={`Show ${events - SHOWN_EVENTS} more`}
                  plain
                  dimColor
                  onPress={() => {
                    void actions.more?.(card.id, 'events')
                  }}
                />
              </Box>,
            ]
          : []),
      ]
    }
    if (shown === 'trace') return [traceView({ ui, card, pickedRow, actions, app: true, plan: props.plan, columns: props.columns })]
    if (shown === 'egress') return pieceTableView({ ui, card, entries, roomFiles, app: true })
    return treeView({
      ui,
      face: 'operator',
      card,
      isOpen: true,
      entries,
      roomFiles,
      pickedRow,
      app: true,
      under: {
        root: [
          glassBox(ui, 'TEXT', row.words, `text-${card.id}`, isListening(card.raw)),
          ...draftLines(card.raw).map((line, i) => (
            <Text key={`draft-${card.id}-${i}`} color={THEME.dim}>
              {line}
            </Text>
          )),
          ...chipsView({ ui, card, versions, entries, roomFiles, app: true }),
        ],
        route: slotView({ ui, face: 'operator', card, entries, walks, roomFiles, brief: false, isOpen: true, lens: 'walk', surface, actions }),
        objects: Object.fromEntries(readings.map(box => [box.objectId, readingViews(box.objectId)])),
      },
      actions,
    })
  }
  return (
    <Box key={`op-card-${card.id}`} flexDirection="column" gap={1} borderStyle="round" borderColor={THEME.accent} paddingX={1}>
      <Box flexDirection="row" columnGap={1} justifyContent="space-between">
        <Text bold wrap="truncate-end">
          {row.words}
        </Text>
        <Button
          key={`close-${card.id}`}
          label="Close"
          plain
          dimColor
          onPress={() => {
            void actions.open({ view: 'feed', cardId: '', lens: 'walk' })
          }}
        />
      </Box>
      {said !== '' && (
        <Text key={`said-${card.id}`} color={THEME.dim}>
          {said}
        </Text>
      )}
      {actions.more !== undefined && (
        <Box key={`fold-row-${card.id}`} flexDirection="row">
          <Button
            key={`fold-machine-${card.id}`}
            label={machineOpen ? 'Machine lines' : 'Machine lines ›'}
            plain
            dimColor={!machineOpen}
            onPress={() => {
              void actions.more?.(card.id, 'machine')
            }}
          />
        </Box>
      )}
      {machineOpen && (
        <Box flexDirection="column">
          {machineLines(card, versions, zone).map(line => (
            <Box key={`machine-${line.label}-${card.id}`} flexDirection="row">
              <Box width={LABEL_WIDTH}>
                <Text color={THEME.dim}>{line.label}</Text>
              </Box>
              <Text wrap="truncate-middle">{line.value}</Text>
            </Box>
          ))}
        </Box>
      )}
      <Box flexDirection="row" flexWrap="wrap" columnGap={SPACE.control} rowGap={SPACE.line}>
        {tabsOf(card, entries, roomFiles).map(tab => {
          const label = `${tab.label.charAt(0).toUpperCase()}${tab.label.slice(1)}${tab.count === undefined ? '' : ` ${tab.count}`}`
          const press = () => {
            void actions.setLens(card.id, tab.lens)
          }
          return tab.lens === shown ? (
            <Button key={`tab-${tab.label}`} label={label} onPress={press} />
          ) : (
            <Button key={`tab-${tab.label}`} label={label} plain dimColor onPress={press} />
          )
        })}
      </Box>
      <Box flexDirection="column">{body()}</Box>
    </Box>
  )
}

// The foot of the lens (order DP, P4): the pane's version, with what the pane counts of itself (model/draws.ts) when it was asked to
// ("draws N · scene N"), and the one row `Plays` with the room's N discs, a plain Button that opens the room's list (What it plays)
// with Back to the seat. The discs and their hashes stand there once, never copied here.
function footView({ ui, discs, drawn, onPlays }: OperatorLensProps) {
  const { Box, Text, Button } = ui
  return (
    <Box key="runs" flexDirection="column">
      <Text color={THEME.dim} wrap="truncate-end">
        {drawn === undefined ? `pane ${VERSION}` : `pane ${VERSION} · ${drawnWords(drawn)}`}
      </Text>
      <Box key="plays" flexDirection="row" columnGap={1}>
        <Box width={LABEL_WIDTH}>
          <Text color={THEME.dim}>Plays</Text>
        </Box>
        {discs.length === 0 || onPlays === undefined ? (
          <Text color={THEME.dim}>{discs.length === 0 ? 'none yet' : countOf(discs.length, 'disc')}</Text>
        ) : (
          <Button key="plays-open" label={`${countOf(discs.length, 'disc')} ›`} plain onPress={onPlays} />
        )}
      </Box>
    </Box>
  )
}

// The words of the older Button: how many cards the next press reads. The cards of the room, less those the feed shows and
// less those the setting hides, are the cards not read yet; a count with none left says "Show older".
export function olderWords(total: number, shown: number, hidden = 0): string {
  const unread = Math.min(SHOWN_CARDS, total - shown - hidden)
  return unread > 0 ? `Show ${unread} older` : 'Show older'
}

// The operator lens as the place draws it: the one card of views/theme.ts, the banner of a door that is down (and the warnings
// of the shown cards), a "Show N older" Button, one row a card with the open card under its row, and the
// pane line and the row `Plays` at the foot. Returns the one Box. Under the banner a quiet line says how many cards the setting leaves
// out, with a plain Button that shows every card; with the action absent the line stands alone.
export function operatorLensView(props: OperatorLensProps) {
  const { ui, cards, openId, doorDown, now, total, hasOlder, hidden = 0, actions } = props
  const { Box, Button, Text } = ui
  const items = feedOf(cards, openId, now)
  const open = cards.some(card => card.id === openId) ? openId : ''
  return [
    <Box key="operator-lens" {...cardProps(props.plan?.width, props.columns)}>
      {doorDown && doorDownView(ui)}
      {bannerView({ ui, cards, app: true })}
      {hidden > 0 && (
        <Box key="hidden" flexDirection="column">
          <Text key="hidden-line" color={THEME.dim}>
            {hidden === 1 ? '1 card with no question is not shown' : `${hidden} cards with no question are not shown`}
          </Text>
          {actions.changeSetting !== undefined && (
            <Box key="hidden-row" flexDirection="row">
              <Button
                key="show-every"
                label="Show every card"
                variant="secondary"
                onPress={() => {
                  void actions.changeSetting?.('shows', 'every')
                }}
              />
            </Box>
          )}
        </Box>
      )}
      {hasOlder && (
        <Box flexDirection="row">
          <Button
            key="older"
            label={olderWords(total, cards.length, hidden)}
            variant="secondary"
            onPress={() => {
              void actions.older()
            }}
          />
        </Box>
      )}
      <Box flexDirection="column">
        {items.flatMap(item => [rowView(props, item.card, item.card.id === open), ...(item.card.id === open ? [openCardView(props, item.card)] : [])])}
      </Box>
      {footView(props)}
    </Box>,
  ]
}