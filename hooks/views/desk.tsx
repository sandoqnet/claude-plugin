// THE DESK (order DESK, D2): the first place of the dock, where the pane opens. What
// waits on him lies on one desk: the open letters (asks of the room), then his items oldest first, then under one head the items that wait on a seat.
// The desk top is a picture, one pile a kind (or a folder a seat) with his count on it and a ring round the open pile; under the picture the names
// of the piles are plain Buttons, the open one with a rule under it, so a state is never colour alone. A press on a row opens it: a letter with its
// picks, a link in his browser, any other item with its words and OPEN ORIGIN. Nothing scrolls (order P1): the list pages by the pane's one rule, and the
// picture then the foot give way before the list does. The terminal draws the names as Buttons alone, no picture. Pure draw: the register gives the data
// and the acts, and no view runs a process.
import { DESK_PILE, ORIGIN_FROM, ORIGIN_MARK, ORIGIN_WORD, hasDone, hisCount, isHis, mailSender, opensOrigin, pileAt, pilesOf, rowBy, rowKey, rowKind, rowOrigin } from '../model/desk.ts'
import type { DeskCard, DeskItem, DeskRow, Group, Pile } from '../model/desk.ts'
import { FOLD_KEY, foldOf, foldWords, rowWords } from '../model/keeperrow.ts'
import type { KeeperFold } from '../model/keeperrow.ts'
import { PAGE_NOT_SHOWN } from '../model/page'
import { pageAt, pageWords } from '../model/pages'
import type { Page } from '../model/pages'
import { ageWords, ulidMs } from '../model/profile'
import { shapeWords } from '../model/roomfeed'
import { BUTTON_CELLS, buttonCells } from './cells'
import { deskArt } from './deskart'
import { MAIL_MARK, subjectOf } from './mail'
import { pageView } from './page'
import { EARLIER, moreWords } from './pager'
import { CARD_ROWS } from './paged'
import { pressBox, pressHigh, pressLinesOf, pressPagerRows, pressPagerView, pressStackRows, pressWidth } from './press'
import { LEAVE, MAKE, NO, SHAPE_NO_KEY, SHAPE_YES_KEY, YES, leansToNo } from './shape'
import { CELL, SPACE } from './space'
import { terminalPagerRows } from './termpage'
import { LOOK } from './look'
import { PRESS, THEME, besideOf, cardProps, cellsOf, fitted, innerOf } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

// The rows of the picture of the desk top: 4 rows of 20.3 px hold a pile of 34 px with its ring and its badge.
export const DESK_ROWS = 4
// The rows of the names under the picture: the Buttons and the rule under the open one.
const NAMES_ROWS = 2
// The rows the terminal's card takes round its parts: its frame has an edge a side and no padding above or below.
const TERMINAL_EDGE = 2
// The list of the desk pages under this name (the page the register keeps, and the keys of the pager's boxes).
export const DESK_LIST = 'desk'
// From these columns a row says its age in its first line, with the arrow; under them the age goes to the dim line.
const WIDE_FROM = 60
export const NOTHING_WAITS = 'Nothing waits on you.'
export const NOTHING_MORE = 'A seat that needs you puts its item on your desk.'
export const READING_DESK = 'Reading your desk.'
export const NO_OPEN_WORD = 'The pane cannot open this origin.'
// What stands in place of a shape ask's Yes and No from the tap until the feed is read with the decided block: one tap an ask.
export const SHAPE_HELD = 'sent'
// The least cells the app gives the title of a shape ask beside its Yes and No; under them the two stand in a line under the title.
const SHAPE_TITLE_LEAST = 20

const KIND_WORD: Record<string, string> = { mail: 'mail', letter: 'a letter', sign: 'to sign', decision: 'to decide', test: 'to test', reading: 'to read' }

// A picture is made once for its source and kept, so a draw for another cause hands the app the same element (no flicker).
const keptDesk = new Map<string, { Svg: any; element: any }>()
export const forgetDeskPicture = (): void => keptDesk.clear()

export type DeskActs = {
  openPile: (key: string) => void
  // A press on a row opens it; on the keeper's pick that is Change (the ask's choices). OK takes the pick off the desk, by its key (order T3).
  openRow: (row: DeskRow) => void
  keeperOk: (key: string) => void
  // Two or more picks stand as one row (order D2): OK all takes them all off in one write, and a press on the row opens them in place or folds them.
  keeperOkAll: (keys: string[]) => void
  foldPicks: () => void
  // Yes (Make) or No (Leave) on the keeper's shape ask, by its id: one tap an ask.
  shape: (id: string, choice: string) => void
  done: (id: string) => void
  page: (page: number) => void
  openAnswered: () => void
  openLetters: () => void
}

// The row of a fold in the list, with whether its picks stand open under it.
type FoldRow = { row: 'fold'; fold: KeeperFold; open: boolean }
type Entry = DeskRow | FoldRow

export type DeskViewProps = {
  ui: Ui
  plan: Plan
  columns: number
  // The app draws the picture and the boxes; the terminal the names as Buttons alone.
  app: boolean
  // Every row of the desk in the order of deskRows (model/desk.ts), his before the seats'.
  rows: DeskRow[]
  group: Group
  pile: string | undefined
  now: number
  card: DeskCard
  // What he answered and what he took off the desk today.
  answered: number
  done: number
  // The shape asks (their ids) he tapped and whose decided block is not read yet: their Yes and No are held.
  sent?: string[]
  // The rows the canvas leaves for the card (less the strip); none is a host that does not say them, and the list is not cut to a height nobody told.
  canvasRows: number | undefined
  page: number
  // The row open at the right of the list (from 128 columns): it keeps its open look.
  open?: string
  // The small terminal (views/frame.tsx terminalSize): the card drops its piles row, its head and its foot, and pages its rows tight, so one item and
  // the pager stand in the fewest rows the pane can have. The app and the wide terminal draw the whole card.
  small?: boolean
  actions: DeskActs
}

// Words cut into lines of `cells` at a space where one is, by the cells each letter takes.
export function wrapped(words: string, cells: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of words.split(' ')) {
    const next = line === '' ? word : `${line} ${word}`
    if (cellsOf(next) <= cells) line = next
    else {
      if (line !== '') lines.push(line)
      line = cellsOf(word) <= cells ? word : fitted(word, cells)
    }
  }
  if (line !== '') lines.push(line)
  return lines
}

// The first line of a mail's row (order G2 M2): `✉ SUBJECT`, or the words of the feed row where the mail has no subject.
const mailWords = (row: Extract<DeskRow, { row: 'mail' }>): string => (row.card.mail === undefined ? MAIL_MARK : subjectOf(row.card.mail))
const wordsOf = (row: DeskRow): string =>
  row.row === 'ask' ? row.wait.title : row.row === 'shape' ? shapeWords(row.shape) : row.row === 'pick' ? rowWords(row.pick) : row.row === 'mail' ? mailWords(row) : row.item.words
const ageOf = (row: DeskRow, now: number): string =>
  row.row === 'ask'
    ? row.wait.age
    : row.row === 'shape'
      ? ageWords(row.shape.atMs, now)
      : row.row === 'pick'
        ? ageWords(row.pick.atMs, now)
        : row.row === 'mail'
          ? ageWords(ulidMs(row.card.id), now)
          : ageWords(row.item.atMs, now)
const senderName = (row: Extract<DeskRow, { row: 'mail' }>): string => mailSender(row)
const forOf = (row: DeskRow): string => (row.row === 'item' ? row.item.for : 'you')

// The dim line of one of his rows: the mark and the word of its origin, who put it (or its kind where the piles are the seats), the age where the
// first line has none, and `for you` (or that its page opened in his browser).
// A mail's second line (order G2 M2): `mail · from NAME · outside`, and `mail · NAME · outside` where the pane is narrow (under MAIL_FROM_AT columns). It holds no age:
// the age stands at the right of the first line, whatever the width.
export const MAIL_FROM_AT = 54
// The line is ONE line: where the pane has too few cells for it the sender's name is cut (with an ellipsis), never the words `mail` or `outside`.
export function mailDimOf(name: string, short: boolean, cells: number): string {
  const at = (who: string): string => ['mail', `${short ? '' : 'from '}${who}`, 'outside'].filter(part => part !== '' && part !== 'from ').join(' · ')
  const whole = at(name)
  if (cellsOf(whole) <= cells || name === '') return whole
  const bare = cellsOf(at('x')) - 1
  return at(fitted(name, Math.max(1, cells - bare)))
}

export function dimOf(row: DeskRow, group: Group, wide: boolean, now: number, opened: boolean, short = false, cells = Number.POSITIVE_INFINITY): string {
  if (row.row === 'mail') return mailDimOf(row.card.mail === undefined ? '' : senderName(row), short, cells)
  // The keeper's shape ask: the why, then who proposes it, the age where the first line has none.
  if (row.row === 'shape') return [row.shape.why, row.shape.by === '' ? '' : `by ${row.shape.by}`, ...(wide ? [] : [ageOf(row, now)])].filter(part => part !== '').join(' · ')
  const origin = rowOrigin(row)
  const by = rowBy(row)
  return [
    `${ORIGIN_MARK[origin]} ${ORIGIN_WORD[origin]}`,
    group === 'seat' ? (KIND_WORD[rowKind(row)] ?? rowKind(row)) : by === '' ? '' : `from ${by}`,
    ...(wide ? [] : [ageOf(row, now)]),
    opened ? 'opened in your browser' : 'for you',
  ]
    .filter(part => part !== '')
    .join(' · ')
}

// A row as the draw takes it: the first line, the age beside it (where the card is wide), the dim lines and the width of its box.
type Shape = { first: string; tail: string; dim: string[]; boxW: number }

// What the card keeps besides its list, by the rows the canvas leaves: the picture of the top, and the foot as boxes or as one line.
type Chrome = { picture: boolean; footLine: boolean }

export function deskView(props: DeskViewProps) {
  const { ui, plan, columns, app, rows, group, now, card, actions } = props
  const { Box, Text, Button, Svg, Client } = ui
  const piles = pilesOf(rows, group)
  const lit: Pile | undefined = pileAt(piles, props.pile)
  const inner = innerOf(plan.width, columns)
  const beside = besideOf(columns)
  const wide = columns >= WIDE_FROM
  // Two or more picks of the pile stand as one row, at the place of the first; open, its picks stand under it (order D2). The pile's count is as it was.
  const listed = lit?.rows ?? []
  const fold = foldOf(listed.flatMap(row => (row.row === 'pick' ? [row.pick] : [])))
  const foldOpen = fold !== undefined && card.fold === true
  let foldDrawn = false
  const shown: Entry[] =
    fold === undefined
      ? listed
      : listed.flatMap((row): Entry[] => {
          if (row.row !== 'pick') return [row]
          const head: Entry[] = foldDrawn ? [] : [{ row: 'fold', fold, open: foldOpen }]
          foldDrawn = true
          return foldOpen ? [...head, row] : head
        })
  const hisEntry = (entry: Entry): boolean => entry.row === 'fold' || isHis(entry)
  const keyOf = (entry: Entry): string => (entry.row === 'fold' ? FOLD_KEY : rowKey(entry))
  const firstSeat = shown.findIndex(row => !hisEntry(row))
  const doneW = pressWidth('Done')
  // The keeper's pick takes two presses beside it: Change and OK (order T3); the fold takes OK all.
  const picksW = pressWidth('Change') + pressWidth('OK') + beside
  const foldW = pressWidth('OK all') + beside
  // The keeper's shape ask takes two presses beside it, Yes and No, or the one word `sent` from the tap until the feed is read with the decided block.
  const sent = new Set(props.sent ?? [])
  // The lean one of the two carries the lean dot in its label (`● Yes`), so Yes is counted with it: the widest the two can be.
  const shapeW = (id: string): number => (sent.has(id) ? cellsOf(SHAPE_HELD) : pressWidth(`${PRESS.leanMark} ${YES}`) + pressWidth(NO) + beside)
  // In the app, Yes and No that leave the title under SHAPE_TITLE_LEAST cells stand in a line under its box.
  const stacks = (row: Entry): boolean => app && row.row === 'shape' && inner - shapeW(row.shape.id) - beside < SHAPE_TITLE_LEAST
  const clear = rows.length === 0
  const reading = clear && card.state !== 'done' && card.cannot === '' && !card.older
  const board = card.opened
  const small = props.small === true && !app
  // The cells inside the terminal's frame (its edge and its padding a side) and the rows between two rows of its list: none in the small one.
  const frameInner = Math.max(1, (columns ?? inner) - 4)
  const between = app || !small ? PRESS.between : 0

  // ---- the rows of the list, with the cells and the lines each takes
  const shapeOf = (row: Entry): Shape => {
    if (row.row === 'fold') return { first: foldWords(row.fold), tail: '', dim: [], boxW: Math.max(inner - foldW, PRESS.least) }
    const boxW =
      row.row === 'pick'
        ? Math.max(inner - picksW - beside, PRESS.least)
        : row.row === 'shape'
          ? stacks(row)
            ? inner
            : Math.max(inner - shapeW(row.shape.id) - beside, PRESS.least)
          : hasDone(row)
            ? inner - doneW - beside
            : inner
    const cells = boxW - PRESS.across
    if (!isHis(row)) return { first: `${ORIGIN_MARK[rowOrigin(row)]} ${wordsOf(row)}`, tail: '', dim: [], boxW }
    // a mail's age stands at the right of its first line at every width
    const tail = wide || row.row === 'mail' ? ageOf(row, now) : ''
    // A pick has one dim line, the keeper's note cut to the width; no note, no line.
    if (row.row === 'pick') return { first: wordsOf(row), tail, dim: row.pick.note === '' ? [] : [fitted(row.pick.note, app ? cells : frameInner)], boxW }
    const opened = row.row === 'item' && board === row.item.id
    // The terminal's dim line is ONE line of the frame's width, cut where it is longer: a line never wraps, so an item is its two rows.
    const short = columns < MAIL_FROM_AT
    // a mail's subject is cut to what its age and the arrow leave (the box would drop the age before it cut a long subject): `✉ Which day works fo…  2m ›`
    const first = row.row === 'mail' && app ? fitted(wordsOf(row), Math.max(1, cells - cellsOf(tail) - PRESS.apart - cellsOf('›') - PRESS.apart)) : wordsOf(row)
    return { first, tail, dim: app ? wrapped(dimOf(row, group, wide, now, opened, short, cells), cells) : [fitted(dimOf(row, group, wide, now, opened, short, frameInner), frameInner)], boxW }
  }
  const lineOf = (row: Entry): string => (row.row === 'item' ? (card.lines[row.item.id] ?? '') : '')
  const heightOf = (row: Entry): number => {
    const shape = shapeOf(row)
    const said = lineOf(row)
    // the terminal's row is the title and its dim lines, with no edge
    return (app ? pressHigh(1 + shape.dim.length) : 1 + shape.dim.length) + (stacks(row) ? PRESS.high : 0) + (said === '' ? 0 : wrapped(said, inner).length)
  }

  // ---- the rows of the card besides its list, by what the canvas leaves: the picture goes first, then the foot's boxes become one line
  const footWidths = [pressWidth(`Answered today ${props.answered}`), cellsOf(`Done today ${props.done}`), ...(lit?.key === 'letter' ? [pressWidth('Letters')] : [])]
  const footBoxes = pressStackRows(pressLinesOf(footWidths, inner, beside))
  // The terminal draws the card as a frame with an edge and no padding above or below, its names and its foot as Buttons in rows that wrap in the
  // frame, and a link row for the pager: the rows are counted for that, not for the boxes of the app. A Button is counted as the host draws it,
  // "[ label ]" (BUTTON_CELLS, views/cells.ts).
  const nameRows = pressLinesOf(piles.map(pile => cellsOf(`${pile.name} ${hisCount(pile.rows)}`) + BUTTON_CELLS), frameInner, 1)
  const termFootRows = pressLinesOf([cellsOf(`Answered today ${props.answered} ›`) + BUTTON_CELLS, cellsOf(`Done today ${props.done}`), ...(lit?.key === 'letter' ? [cellsOf('Letters ›') + BUTTON_CELLS] : [])], frameInner, 1)
  const pagerRows = app ? pressPagerRows(inner, columns) : terminalPagerRows(frameInner, shown.length) + between
  // The line that heads the seats' rows is the app's and the wide terminal's; the small terminal draws the rows alone.
  const heads = firstSeat >= 0 && !small ? 1 : 0
  // The card's rows besides its list: its edge and padding, the top (the picture, then the names), the head of the pile, the foot, and a row between each part.
  const fixedOf = (chrome: Chrome): number => {
    if (small) return TERMINAL_EDGE
    if (!app) return TERMINAL_EDGE + (clear ? 0 : nameRows) + 1 + (clear ? 0 : PRESS.between) + termFootRows
    const top = (chrome.picture ? DESK_ROWS : 0) + (clear ? 0 : NAMES_ROWS)
    const parts = [top, 1 + (clear ? 0 : PRESS.between), chrome.footLine ? 1 : footBoxes].filter(rows => rows > 0)
    return CARD_ROWS + parts.reduce((sum, rows) => sum + rows, 0) + (parts.length - 1) * SPACE.line
  }
  const heights = shown.map(heightOf)
  // The least a list needs to be worth drawing: one row of two lines and the pager under it.
  const least = pressHigh(2) + pagerRows
  const roomFor = (chrome: Chrome): number => (props.canvasRows === undefined ? Number.POSITIVE_INFINITY : props.canvasRows - fixedOf(chrome))
  const pictured = app && Svg !== undefined
  // The picture goes first where the canvas is short, then the foot's boxes become one line; a clear desk keeps its picture where its two lines and the foot stand with it.
  const clearRoom = (chrome: Chrome): number => (props.canvasRows === undefined ? Number.POSITIVE_INFINITY : props.canvasRows - fixedOf(chrome) - 1)
  const chrome: Chrome = clear
    ? { picture: pictured && clearRoom({ picture: true, footLine: false }) >= 0, footLine: false }
    : pictured && roomFor({ picture: true, footLine: false }) >= least
      ? { picture: true, footLine: false }
      : roomFor({ picture: false, footLine: false }) >= least
        ? { picture: false, footLine: false }
        : { picture: false, footLine: true }
  const budget = roomFor(chrome) - heads
  const page: Page = pageAt(heights, budget, props.page, between, pagerRows)
  const onPage = shown.slice(page.from, page.to)
  const seatHeadAt = (at: number): boolean => {
    const row = page.from + at
    return firstSeat >= 0 && !small && !hisEntry(shown[row]) && (row === firstSeat || at === 0)
  }

  // ---- the top: the picture, its regions and the names
  const n = Math.max(1, piles.length)
  const cellCells = Math.max(4, Math.min(12, Math.floor(inner / n)))
  const leftCells = Math.max(0, Math.floor((inner - cellCells * piles.length) / 2))
  const artW = Math.round(inner * CELL.width)
  const artH = Math.round(DESK_ROWS * CELL.height)
  const pictureOf = () => {
    if (Svg === undefined) return null
    const source = deskArt(piles, lit?.key ?? '', artW, artH, cellCells * CELL.width, leftCells * CELL.width)
    const alt = `The desk: ${piles.map(pile => `${pile.name} ${hisCount(pile.rows)}`).join(', ') || 'clear, a lamp, a cup and a plant'}`
    const held = keptDesk.get(source)
    if (held !== undefined && held.Svg === Svg) return held.element
    const element = <Svg key={`desk-art-${keptDesk.size}`} source={source} alt={alt} width={artW} height={artH} />
    if (keptDesk.size >= 16) keptDesk.delete(keptDesk.keys().next().value as string)
    keptDesk.set(source, { Svg, element })
    return element
  }
  const names =
    piles.length === 0 || small
      ? null
      : app
        ? (
            <Box key="desk-names" flexDirection="row" marginLeft={leftCells}>
              {piles.map(pile => {
                const open = pile.key === lit?.key
                const label = fitted(pile.name, cellCells - 1)
                return (
                  <Box key={`name-${pile.key}`} width={cellCells} flexDirection="column" alignItems="center">
                    <Button key={`pile-${pile.key}`} plain label={label} {...(open ? {} : { dimColor: true })} onPress={() => actions.openPile(pile.key)} />
                    <Text key={`rule-${pile.key}`}>{open ? '─'.repeat(cellsOf(label)) : ' '}</Text>
                  </Box>
                )
              })}
            </Box>
          )
        : (
            <Box key="desk-names" flexDirection="row" flexWrap="wrap" columnGap={1}>
              {piles.map(pile => (
                <Button key={`pile-${pile.key}`} label={`${pile.name} ${hisCount(pile.rows)}`} variant={pile.key === lit?.key ? 'primary' : 'secondary'} onPress={() => actions.openPile(pile.key)} />
              ))}
            </Box>
          )
  const top = app ? (
    <Box key="desk-top" flexDirection="column" width={inner}>
      {chrome.picture && (
        <Box key="desk-art" position="relative" width={inner} height={DESK_ROWS}>
          {pictureOf()}
          {Client !== undefined &&
            piles.map((pile, at) => (
              <Box key={`pile-${pile.key}-over`} position="absolute" top={0} left={leftCells + at * cellCells} width={cellCells}>
                <Client key={`pile-${pile.key}-region`} module="../item.tsx" props={{ w: cellCells, h: DESK_ROWS, tip: '', tipAbove: false, tipShift: 0, press: `${DESK_PILE}${pile.key}` }} />
              </Box>
            ))}
        </Box>
      )}
      {names}
    </Box>
  ) : (
    names
  )

  // ---- the rows
  // The terminal draws a row as a Button of its words and, for an item that is his, a Done beside it, the dim line under.
  // The keeper's shape ask in the terminal: the title is the press (cut to what the frame leaves it), Yes and No beside it, the age at the right in the wide
  // card, the dim line under it (the why, then by whom). Each Button is counted as the host draws it, `[ label ]` (BUTTON_CELLS). The first ask of the page that is
  // not sent holds the keys `y` and `n`; the second would hold the same, so it holds none. From the tap to the decided block the word `sent` stands for them.
  const keyedShape = app ? undefined : onPage.find(row => row.row === 'shape' && !sent.has(row.shape.id))
  const shapeTerminalRow = (row: Extract<Entry, { row: 'shape' }>) => {
    const key = rowKey(row)
    const ask = row.shape
    const held = sent.has(ask.id)
    const shape = shapeOf(row)
    const keyed = keyedShape === row
    const toNo = leansToNo(ask)
    const acts = 1 + (held ? cellsOf(SHAPE_HELD) : buttonCells(YES, false, keyed ? SHAPE_YES_KEY : undefined) + 1 + buttonCells(NO, false, keyed ? SHAPE_NO_KEY : undefined))
    const title = fitted(shape.first, Math.max(1, frameInner - BUTTON_CELLS - acts - (shape.tail === '' ? 0 : cellsOf(shape.tail) + 1)))
    return (
      <Box key={`slot-${key}`} flexDirection="column">
        <Box key={`row-${key}`} flexDirection="row" justifyContent="space-between" columnGap={1}>
          <Box key={`acts-${key}`} flexDirection="row" columnGap={1}>
            <Button key={key} label={title} onPress={() => actions.openRow(row)} />
            {held && (
              <Text key={`held-${key}`} color={LOOK.quiet}>
                {SHAPE_HELD}
              </Text>
            )}
            {!held && <Button key={`yes-${key}`} label={YES} variant={toNo ? 'secondary' : 'primary'} {...(keyed ? { hotkey: SHAPE_YES_KEY } : {})} onPress={() => actions.shape(ask.id, MAKE)} />}
            {!held && <Button key={`no-${key}`} label={NO} variant={toNo ? 'primary' : 'secondary'} {...(keyed ? { hotkey: SHAPE_NO_KEY } : {})} onPress={() => actions.shape(ask.id, LEAVE)} />}
          </Box>
          {shape.tail !== '' && (
            <Text key={`age-${key}`} color={LOOK.quiet}>
              {shape.tail}
            </Text>
          )}
        </Box>
        {shape.dim.map((line, at) => (
          <Text key={`dim-${key}-${at}`} color={LOOK.quiet}>
            {line}
          </Text>
        ))}
      </Box>
    )
  }
  const terminalRow = (row: Entry) => {
    if (row.row === 'fold') {
      const words = `${foldWords(row.fold)}${row.open ? ' (open)' : ''}`
      return (
        <Box key={`slot-${FOLD_KEY}`} flexDirection="row" columnGap={1}>
          <Button key={FOLD_KEY} label={fitted(words, Math.max(1, frameInner - BUTTON_CELLS - 1 - buttonCells('OK all')))} onPress={actions.foldPicks} />
          <Button key="ok-all" label="OK all" onPress={() => actions.keeperOkAll(row.fold.keys)} />
        </Box>
      )
    }
    if (row.row === 'shape') return shapeTerminalRow(row)
    const key = rowKey(row)
    const shape = shapeOf(row)
    const said = lineOf(row)
    const id = row.row === 'item' ? row.item.id : ''
    // The title is the press, its Done or Change and OK beside it; the age stands at the right of the row, dim, and the dim line under it says the
    // kind, from and for. A line never wraps: the title is cut to what the frame leaves it (every Button is counted as the host draws it, "[ label ]"
    // with BUTTON_CELLS, and a space between two), so a row is two lines.
    const acts = (hasDone(row) ? 1 + buttonCells('Done') : 0) + (row.row === 'pick' ? 1 + buttonCells('Change') + 1 + buttonCells('OK') : 0)
    const title = fitted(`${shape.first}${isHis(row) ? '' : ` · for ${forOf(row)}`}`, Math.max(1, frameInner - BUTTON_CELLS - acts - (shape.tail === '' ? 0 : cellsOf(shape.tail) + 1)))
    return (
      <Box key={`slot-${key}`} flexDirection="column">
        <Box key={`row-${key}`} flexDirection="row" justifyContent="space-between" columnGap={1}>
          <Box key={`acts-${key}`} flexDirection="row" columnGap={1}>
            <Button key={key} label={title} onPress={() => actions.openRow(row)} />
            {hasDone(row) && <Button key={`done-${id}`} label="Done" onPress={() => actions.done(id)} />}
            {row.row === 'pick' && <Button key={`change-${key}`} label="Change" onPress={() => actions.openRow(row)} />}
            {row.row === 'pick' && <Button key={`ok-${key}`} label="OK" onPress={() => actions.keeperOk(row.pick.key)} />}
          </Box>
          {shape.tail !== '' && (
            <Text key={`age-${key}`} color={LOOK.quiet}>
              {shape.tail}
            </Text>
          )}
        </Box>
        {shape.dim.map((line, at) => (
          <Text key={`dim-${key}-${at}`} color={LOOK.quiet}>
            {line}
          </Text>
        ))}
        {said !== '' && (
          <Text key={`said-${key}`} color={LOOK.warn} wrap="wrap">
            {said}
          </Text>
        )}
      </Box>
    )
  }
  const rowView = (row: Entry) => {
    if (!app) return terminalRow(row)
    if (row.row === 'fold') {
      return (
        <Box key={`slot-${FOLD_KEY}`} flexDirection="row" alignItems="flex-start" columnGap={beside}>
          {pressBox({ ui, id: FOLD_KEY, label: foldWords(row.fold), width: shapeOf(row).boxW, arrow: true, open: row.open, word: 'open', onPress: actions.foldPicks })}
          {pressBox({ ui, id: 'ok-all', label: 'OK all', onPress: () => actions.keeperOkAll(row.fold.keys) })}
        </Box>
      )
    }
    const key = rowKey(row)
    const shape = shapeOf(row)
    // A row is open while it stands open at the right of the list (from 128 columns), or its page was opened in his browser.
    const asked = props.open === key
    const browser = row.row === 'item' && board === row.item.id
    const said = lineOf(row)
    const id = row.row === 'item' ? row.item.id : ''
    const box = !isHis(row)
      ? pressBox({ ui, id: key, label: shape.first, width: shape.boxW, value: `for ${forOf(row)}`, open: asked || browser, word: browser && !asked ? 'opened' : 'open', onPress: () => actions.openRow(row) })
      : pressBox({
          ui,
          id: key,
          label: shape.first,
          width: shape.boxW,
          value: shape.tail,
          arrow: true,
          open: asked || browser,
          word: browser && !asked ? 'opened' : 'open',
          more: shape.dim,
          onPress: () => actions.openRow(row),
        })
    // The keeper's shape ask: Yes (Make, the lean one bold) and No (Leave) beside the title, or in a line under it where the card is too narrow for both; the
    // word `sent` stands for them from the tap until the decided block is read.
    const ask = row.row === 'shape' ? row.shape : undefined
    const answers =
      ask === undefined
        ? []
        : sent.has(ask.id)
          ? [
              <Text key={`held-${key}`} color={THEME.dim}>
                {SHAPE_HELD}
              </Text>,
            ]
          : [
              pressBox({ ui, id: `yes-${key}`, label: YES, lean: !leansToNo(ask), onPress: () => actions.shape(ask.id, MAKE) }),
              pressBox({ ui, id: `no-${key}`, label: NO, lean: leansToNo(ask), onPress: () => actions.shape(ask.id, LEAVE) }),
            ]
    return (
      <Box key={`slot-${key}`} flexDirection="column">
        <Box key={`row-${key}`} flexDirection="row" alignItems="flex-start" columnGap={beside}>
          {box}
          {hasDone(row) && pressBox({ ui, id: `done-${id}`, label: 'Done', onPress: () => actions.done(id) })}
          {row.row === 'pick' && pressBox({ ui, id: `change-${key}`, label: 'Change', onPress: () => actions.openRow(row) })}
          {row.row === 'pick' && pressBox({ ui, id: `ok-${key}`, label: 'OK', onPress: () => actions.keeperOk(row.pick.key) })}
          {!stacks(row) && answers}
        </Box>
        {stacks(row) && (
          <Box key={`answers-${key}`} flexDirection="row" alignItems="flex-start" columnGap={beside}>
            {answers}
          </Box>
        )}
        {said !== '' && (
          <Text key={`said-${key}`} color={app ? THEME.warn : LOOK.warn} wrap="wrap">
            {said}
          </Text>
        )}
      </Box>
    )
  }

  // ---- the pile's head, the list under it, the pager
  const dim = app ? THEME.dim : LOOK.quiet
  const forSeats = lit === undefined ? 0 : lit.rows.length - hisCount(lit.rows)
  const headOf = (pile: Pile) => (
    <Box key="pile-head" flexDirection="row" columnGap={SPACE.near}>
      <Text key="pile-name" bold>
        {pile.head}
      </Text>
      <Text key="pile-count" color={dim}>
        {`· ${hisCount(pile.rows)} for you${forSeats > 0 ? `, ${forSeats} for seats` : ''}`}
      </Text>
    </Box>
  )
  // The terminal's pager: one row of plain links, `‹ Earlier` at the left, the page's words quiet, `N more ›` at the right, with no box and no region.
  const terminalPager = (shown: Page) =>
    shown.pages <= 1 ? null : (
      <Box key={`${DESK_LIST}-pager`} flexDirection="row" flexWrap="wrap" columnGap={2}>
        {shown.page > 0 && <Button key={`${DESK_LIST}-earlier`} label={EARLIER} onPress={() => actions.page(shown.page - 1)} />}
        <Text key={`${DESK_LIST}-page`} color={LOOK.quiet}>
          {pageWords(shown)}
        </Text>
        {shown.after > 0 && <Button key={`${DESK_LIST}-more`} label={moreWords(shown.after)} onPress={() => actions.page(shown.page + 1)} />}
      </Box>
    )
  const list =
    lit === undefined ? null : (
      <Box key="desk-pile" flexDirection="column" gap={between}>
        {!small && headOf(lit)}
        {onPage.map((row, at) => (
          <Box key={`on-${keyOf(row)}`} flexDirection="column">
            {seatHeadAt(at) && (
              <Text key={`seats-head-${at}`} color={dim}>
                {`Waiting on seats · ${shown.length - firstSeat}`}
              </Text>
            )}
            {rowView(row)}
          </Box>
        ))}
        {app ? pressPagerView({ ui, list: DESK_LIST, page, inner, columns, onPage: actions.page }) : terminalPager(page)}
      </Box>
    )

  // ---- the foot: Answered today (a place), Done today (a count: no place lists the items done yet), and under the Letters pile the way to the place
  const foot =
    small ? null : chrome.footLine || !app ? (
      !app ? (
        <Box key="desk-foot" flexDirection="row" flexWrap="wrap" columnGap={1}>
          <Button key="to-answered" label={`Answered today ${props.answered} ›`} onPress={actions.openAnswered} />
          <Text key="to-done" color={dim}>
            {`Done today ${props.done}`}
          </Text>
          {lit?.key === 'letter' && <Button key="to-letters" label="Letters ›" onPress={actions.openLetters} />}
        </Box>
      ) : (
        <Text key="desk-foot" color={dim} wrap="truncate-end">
          {`Answered today ${props.answered} · Done today ${props.done}`}
        </Text>
      )
    ) : (
    <Box key="desk-foot" flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={beside} rowGap={PRESS.between}>
      {pressBox({ ui, id: 'to-answered', label: `Answered today ${props.answered}`, arrow: true, onPress: actions.openAnswered })}
      <Text key="to-done" color={dim}>
        {`Done today ${props.done}`}
      </Text>
      {lit?.key === 'letter' && pressBox({ ui, id: 'to-letters', label: 'Letters', arrow: true, onPress: actions.openLetters })}
    </Box>
  )

  const clearBody = [
    top,
    <Text key="desk-none" bold>
      {reading ? READING_DESK : NOTHING_WAITS}
    </Text>,
    ...(reading ? [] : [<Text key="desk-none-more" color={dim} wrap="wrap">{NOTHING_MORE}</Text>]),
    foot,
  ]
  const lines = [
    ...(card.cannot === '' ? [] : [card.cannot]),
    ...(card.line === '' ? [] : [card.line]),
  ]
  const said = lines.map((line, at) => (
    <Text key={`desk-line-${at}`} color={app ? THEME.warn : LOOK.warn} wrap="wrap">
      {line}
    </Text>
  ))
  const body = app
    ? [
        <Box key="desk-card" {...cardProps(plan.width, columns)}>
          {clear ? clearBody : [top, list, foot]}
          {said}
        </Box>,
      ]
    : [
        <Box key="desk-card" flexDirection="column" {...LOOK.frame}>
          {clear ? clearBody : [top, list, foot]}
          {said}
        </Box>,
      ]
  return body
}

// ---- the item opened, a step from the desk (or beside it from 128 columns)

export type DeskItemProps = {
  ui: Ui
  plan: Plan
  columns: number
  app: boolean
  item: DeskItem
  now: number
  card: DeskCard
  // The rows the card may take (order P2): the page is cut into blocks within them; none, no cut.
  rows?: number
  // The room app for a page item (order O3): given where the room's sandoq has the page verb and the path of the origin passes the rule, the clean
  // path and whether it was said opened; the press then stands in place of the origin line. With none, the item is as it was.
  inApp?: { path: string; opened: boolean }
  actions: { done: (id: string) => void; openOrigin: (origin: string, id: string) => void; openInApp?: (path: string) => void | Promise<void> }
}

export const OPEN_PAGE_APP = 'Open in the room app'
export const OPENED_PAGE_APP = 'Opened in the room app'

// The title of a card of an item by where it lies: the word of its origin.
export const itemTitleOf = (item: DeskItem): string => ({ card: 'Card', record: 'Record', https: 'Link', page: 'Page', other: 'Note' })[item.opens.kind]

export function deskItemView({ ui, plan, columns, app, item, now, card, rows, inApp, actions }: DeskItemProps) {
  const { Box, Text, Button } = ui
  const inner = innerOf(plan.width, columns)
  const dim = app ? THEME.dim : LOOK.quiet
  const kind = item.opens.kind
  const said = card.lines[item.id] ?? ''
  const opened = card.opened === item.id
  // The page of a page item (order R3): drawn under its Done, once the register has read it for this item.
  const page = card.page?.item === item.id ? card.page : undefined
  const whom = item.for === 'you' ? 'for you' : `for ${item.for}`
  const quiet = (key: string, words: string, color: string = dim) => (
    <Text key={key} color={color} wrap="wrap">
      {words}
    </Text>
  )
  const parts = [
    quiet('item-who', [`${item.by === '' ? 'it' : item.by} put it`, whom, ageWords(item.atMs, now)].filter(part => part !== '').join(' · ')),
    <Text key="item-words" bold wrap="wrap">
      {item.words}
    </Text>,
    // The origin: a card, a record or a page opens by one press; a page of the run or any other origin is drawn as its words, no arrow, and a line says the pane cannot open it.
    // Where the room app has the page (order O3) the page item has one press in place of that line: the mark, "Open in the room app", the path, the arrow.
    ...(kind === 'page' && inApp !== undefined && actions.openInApp !== undefined
      ? [
          app ? (
            pressBox({ ui, id: 'open-origin', label: `${ORIGIN_MARK.page} ${inApp.opened ? OPENED_PAGE_APP : OPEN_PAGE_APP}`, value: inApp.path, arrow: true, width: inner, onPress: () => actions.openInApp?.(inApp.path) })
          ) : (
            <Button key="open-origin" label={`${ORIGIN_MARK.page} ${inApp.opened ? OPENED_PAGE_APP : OPEN_PAGE_APP}: ${inApp.path} ›`} onPress={() => actions.openInApp?.(inApp.path)} />
          ),
        ]
      : opensOrigin(kind)
      ? [
          app ? (
            pressBox({ ui, id: 'open-origin', label: `${ORIGIN_MARK[kind]} Open origin`, value: ORIGIN_FROM[kind], arrow: true, width: inner, onPress: () => actions.openOrigin(item.origin, item.id) })
          ) : (
            <Button key="open-origin" label={`${ORIGIN_MARK[kind]} Open origin: ${ORIGIN_FROM[kind]} ›`} onPress={() => actions.openOrigin(item.origin, item.id)} />
          ),
        ]
      : [quiet('item-origin', `${ORIGIN_MARK[kind]} ${ORIGIN_WORD[kind]}: ${item.opens.value}`, app ? THEME.ink : LOOK.quiet), ...(page === undefined ? [quiet('item-origin-no', NO_OPEN_WORD)] : [])]),
    ...(opened ? [quiet('origin-said', 'The page opened in your browser.')] : []),
    ...(item.canDone
      ? [
          app ? pressBox({ ui, id: 'item-done', label: 'Done', onPress: () => actions.done(item.id) }) : <Button key="item-done" label="Done" onPress={() => actions.done(item.id)} />,
          quiet('item-after', 'Done takes it off your desk.'),
        ]
      : item.done
        ? [quiet('item-after', 'It is done.')]
        : [quiet('item-after', `It waits on ${item.for}. Done is theirs.`)]),
    ...(said === '' ? [] : [quiet('item-said', said, app ? THEME.warn : LOOK.warn)]),
    // An image, a video or a sound (order O4) is no page of blocks: one quiet line says its kind, and where the room app does not open it (no press above) that the pane does not show it.
    ...(page === undefined ? [] : page.media !== undefined ? [quiet(`page-${page.item}-media`, inApp === undefined || actions.openInApp === undefined ? `${page.line} ${PAGE_NOT_SHOWN}` : page.line)] : pageView({ ui, app, page, rows, width: inner })),
  ]
  return app ? [<Box key="desk-item" {...cardProps(plan.width, columns)}>{parts}</Box>] : [<Box key="desk-item" flexDirection="column" {...LOOK.frame}>{parts}</Box>]
}
