// THE DESK (order DESK, D2): the first place of the dock, where the pane opens. What
// waits on him lies on one desk: the open letters (asks of the room), then his items oldest first, then under one head the items that wait on a seat.
// The desk top is a picture, one pile a kind (or a folder a seat) with his count on it and a ring round the open pile; under the picture the names
// of the piles are plain Buttons, the open one with a rule under it, so a state is never colour alone. A press on a row opens it: a letter with its
// picks, a link in his browser, any other item with its words and OPEN ORIGIN. Nothing scrolls (order P1): the list pages by the pane's one rule, and the
// picture then the foot give way before the list does. The terminal draws the names as Buttons alone, no picture. Pure draw: the register gives the data
// and the acts, and no view runs a process.
import { DESK_PILE, ORIGIN_FROM, ORIGIN_MARK, ORIGIN_WORD, hasDone, hisCount, isHis, opensOrigin, pileAt, pilesOf, rowBy, rowKey, rowKind, rowOrigin } from '../model/desk.ts'
import type { DeskCard, DeskItem, DeskRow, Group, Pile } from '../model/desk.ts'
import { FOLD_KEY, foldOf, foldWords, rowWords } from '../model/keeperrow.ts'
import type { KeeperFold } from '../model/keeperrow.ts'
import { PAGE_NOT_SHOWN } from '../model/page'
import { pageAt } from '../model/pages'
import type { Page } from '../model/pages'
import { ageWords } from '../model/profile'
import { deskArt } from './deskart'
import { pageView } from './page'
import { CARD_ROWS } from './paged'
import { pressBox, pressHigh, pressLinesOf, pressPagerRows, pressPagerView, pressStackRows, pressWidth } from './press'
import { CELL, SPACE } from './space'
import { LOOK } from './look'
import { PRESS, THEME, besideOf, cardProps, cellsOf, fitted, innerOf } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

// The rows of the picture of the desk top: 4 rows of 20.3 px hold a pile of 34 px with its ring and its badge.
export const DESK_ROWS = 4
// The rows of the names under the picture: the Buttons and the rule under the open one.
const NAMES_ROWS = 2
// The list of the desk pages under this name (the page the register keeps, and the keys of the pager's boxes).
export const DESK_LIST = 'desk'
// From these columns a row says its age in its first line, with the arrow; under them the age goes to the dim line.
const WIDE_FROM = 60
export const NOTHING_WAITS = 'Nothing waits on you.'
export const NOTHING_MORE = 'A seat that needs you puts its item on your desk.'
export const READING_DESK = 'Reading your desk.'
export const NO_OPEN_WORD = 'The pane cannot open this origin.'

const KIND_WORD: Record<string, string> = { letter: 'a letter', sign: 'to sign', decision: 'to decide', test: 'to test', reading: 'to read' }

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
  // The rows the canvas leaves for the card (less the strip); none is a host that does not say them, and the list is not cut to a height nobody told.
  canvasRows: number | undefined
  page: number
  // The row open at the right of the list (from 128 columns): it keeps its open look.
  open?: string
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

const wordsOf = (row: DeskRow): string => (row.row === 'ask' ? row.wait.title : row.row === 'pick' ? rowWords(row.pick) : row.item.words)
const ageOf = (row: DeskRow, now: number): string => (row.row === 'ask' ? row.wait.age : row.row === 'pick' ? ageWords(row.pick.atMs, now) : ageWords(row.item.atMs, now))
const forOf = (row: DeskRow): string => (row.row === 'item' ? row.item.for : 'you')

// The dim line of one of his rows: the mark and the word of its origin, who put it (or its kind where the piles are the seats), the age where the
// first line has none, and `for you` (or that its page opened in his browser).
export function dimOf(row: DeskRow, group: Group, wide: boolean, now: number, opened: boolean): string {
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
  const clear = rows.length === 0
  const reading = clear && card.state !== 'done' && card.cannot === '' && !card.older
  const board = card.opened

  // ---- the rows of the list, with the cells and the lines each takes
  const shapeOf = (row: Entry): Shape => {
    if (row.row === 'fold') return { first: foldWords(row.fold), tail: '', dim: [], boxW: Math.max(inner - foldW, PRESS.least) }
    const boxW = row.row === 'pick' ? Math.max(inner - picksW - beside, PRESS.least) : hasDone(row) ? inner - doneW - beside : inner
    const cells = boxW - PRESS.across
    if (!isHis(row)) return { first: `${ORIGIN_MARK[rowOrigin(row)]} ${wordsOf(row)}`, tail: '', dim: [], boxW }
    const tail = wide ? ageOf(row, now) : ''
    // A pick has one dim line, the keeper's note cut to the width; no note, no line.
    if (row.row === 'pick') return { first: wordsOf(row), tail, dim: row.pick.note === '' ? [] : [fitted(row.pick.note, cells)], boxW }
    const opened = row.row === 'item' && board === row.item.id
    return { first: wordsOf(row), tail, dim: wrapped(dimOf(row, group, wide, now, opened), cells), boxW }
  }
  const lineOf = (row: Entry): string => (row.row === 'item' ? (card.lines[row.item.id] ?? '') : '')
  const heightOf = (row: Entry): number => {
    const shape = shapeOf(row)
    const said = lineOf(row)
    return pressHigh(1 + shape.dim.length) + (said === '' ? 0 : wrapped(said, inner).length)
  }

  // ---- the rows of the card besides its list, by what the canvas leaves: the picture goes first, then the foot's boxes become one line
  const footWidths = [pressWidth(`Answered today ${props.answered}`), cellsOf(`Done today ${props.done}`), ...(lit?.key === 'letter' ? [pressWidth('Letters')] : [])]
  const footBoxes = pressStackRows(pressLinesOf(footWidths, inner, beside))
  const pagerRows = pressPagerRows(inner, columns)
  const heads = firstSeat >= 0 ? 1 : 0
  // The card's rows besides its list: its edge and padding, the top (the picture, then the names), the head of the pile, the foot, and a row between each part.
  const fixedOf = (chrome: Chrome): number => {
    const top = (chrome.picture ? DESK_ROWS : 0) + (clear ? 0 : NAMES_ROWS)
    const parts = [top, 1 + (clear ? 0 : PRESS.between), chrome.footLine || !app ? 1 : footBoxes].filter(rows => rows > 0)
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
  const page: Page = pageAt(heights, budget, props.page, PRESS.between, pagerRows)
  const onPage = shown.slice(page.from, page.to)
  const seatHeadAt = (at: number): boolean => {
    const row = page.from + at
    return firstSeat >= 0 && !hisEntry(shown[row]) && (row === firstSeat || at === 0)
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
    piles.length === 0
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
  const terminalRow = (row: Entry) => {
    if (row.row === 'fold') {
      return (
        <Box key={`slot-${FOLD_KEY}`} flexDirection="row" columnGap={1}>
          <Button key={FOLD_KEY} label={`${foldWords(row.fold)}${row.open ? ' (open)' : ''}`} onPress={actions.foldPicks} />
          <Button key="ok-all" label="OK all" onPress={() => actions.keeperOkAll(row.fold.keys)} />
        </Box>
      )
    }
    const key = rowKey(row)
    const shape = shapeOf(row)
    const said = lineOf(row)
    const id = row.row === 'item' ? row.item.id : ''
    return (
      <Box key={`slot-${key}`} flexDirection="column">
        <Box key={`row-${key}`} flexDirection="row" columnGap={1}>
          <Button key={key} label={`${shape.first}${shape.tail === '' ? '' : ` ${shape.tail}`}${isHis(row) ? '' : ` · for ${forOf(row)}`}`} onPress={() => actions.openRow(row)} />
          {hasDone(row) && <Button key={`done-${id}`} label="Done" onPress={() => actions.done(id)} />}
          {row.row === 'pick' && <Button key={`change-${key}`} label="Change" onPress={() => actions.openRow(row)} />}
          {row.row === 'pick' && <Button key={`ok-${key}`} label="OK" onPress={() => actions.keeperOk(row.pick.key)} />}
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
    return (
      <Box key={`slot-${key}`} flexDirection="column">
        <Box key={`row-${key}`} flexDirection="row" alignItems="flex-start" columnGap={beside}>
          {box}
          {hasDone(row) && pressBox({ ui, id: `done-${id}`, label: 'Done', onPress: () => actions.done(id) })}
          {row.row === 'pick' && pressBox({ ui, id: `change-${key}`, label: 'Change', onPress: () => actions.openRow(row) })}
          {row.row === 'pick' && pressBox({ ui, id: `ok-${key}`, label: 'OK', onPress: () => actions.keeperOk(row.pick.key) })}
        </Box>
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
  const list =
    lit === undefined ? null : (
      <Box key="desk-pile" flexDirection="column" gap={PRESS.between}>
        {headOf(lit)}
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
        {pressPagerView({ ui, list: DESK_LIST, page, inner, columns, onPage: actions.page })}
      </Box>
    )

  // ---- the foot: Answered today (a place), Done today (a count: no place lists the items done yet), and under the Letters pile the way to the place
  const foot =
    chrome.footLine || !app ? (
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
