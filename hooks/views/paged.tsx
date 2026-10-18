// The body of a place that is longer than the canvas (order D1, A2 S4): NOTHING SCROLLS, so what does not fit is paged by the pager of
// views/pager.tsx, in place, with "N more ›", "‹ Earlier" and "page 2 of 3". A place that pages itself (the Seats place, a seat's
// window, Answered) fits its rows already and is left as it is. The others hand their blocks here: several blocks page by block; ONE
// block that is a card of several parts (the shelf, the Room place) pages by the parts inside it. A part that is taller than the canvas
// alone stands alone on its page (a card with its controls cannot split), and its pager stands over it, since under it the links would
// lie under the dock. The rows come from views/cells.ts, an estimate of the kit's flex in cells. App surfaces only; the terminal draws its column as before.
import { pageAt, pagesOf } from '../model/pages'
import type { Page } from '../model/pages'
import { kidsOf, namesOf, propsOf, sizeOf, wrapRows } from './cells'
import { pagerLinesOf, pagerView } from './pager'
import { SPACE } from './space'
import { THEME, cardProps, innerOf, isPressBox } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

// The rows a card takes round its parts: its border and its padding above and below.
export const CARD_ROWS = 4

export type PagedProps = {
  ui: Ui
  plan: Plan
  columns: number
  // The rows the canvas leaves for the body (canvasRowsOf, less the row of Back or Close and its gap).
  rows: number
  // The pages the pane keeps, by the name of the list, and the act that turns one. `scope` is put before the names of the lists, so the
  // list at the left of two columns and the row at the right keep their pages apart.
  pages?: Record<string, number>
  scope?: string
  onPage: (list: string, page: number) => void
}

// The element again with other children: its props kept, its key too, whether the kit keeps the key in the props or beside them.
export function withKids(ui: Ui, node: any, children: any[]) {
  const { Box } = ui
  const { children: _children, key: _key, ...rest } = propsOf(node)
  return (
    <Box key={node.key ?? propsOf(node).key} {...rest}>
      {children}
    </Box>
  )
}

// The element again with other props over its own, its children kept (or given).
function withProps(ui: Ui, node: any, patch: Record<string, unknown>, children: any[] = kidsOf(node)) {
  const { Box } = ui
  const { children: _children, key: _key, ...rest } = propsOf(node)
  return (
    <Box key={node.key ?? propsOf(node).key} {...rest} {...patch}>
      {children}
    </Box>
  )
}

// The answer rows of a wait card (views/seat.tsx): the row of the link "Read the step" and the picks, or the form of a draft. Its
// head row is the first part of the card.
const ANSWER_ROWS = /^seat-(acts|form)-/
const HEAD_ROW = /^seat-head-/
const keyOf = (node: any): string => String(node?.key ?? propsOf(node).key ?? '')

// The rows of a node in a width, kept by the node: the cut of a card measures the same part in several passes (its own rows, the units, the
// two ways), and a node is built once for a draw and never changes. A page as it is drawn is a new node, so it is measured by sizeOf.
const HEIGHTS = new WeakMap<object, Map<number, number>>()
function heightOf(node: any, width: number, names: ReturnType<typeof namesOf>): number {
  if (typeof node !== 'object' || node === null) return sizeOf(node, width, names).h
  const known = HEIGHTS.get(node) ?? new Map<number, number>()
  HEIGHTS.set(node, known)
  const kept = known.get(width)
  if (kept !== undefined) return kept
  const h = sizeOf(node, width, names).h
  known.set(width, h)
  return h
}

// A wait that stands alone on a page and does not fit the canvas with the pager under it (order G2): first drawn tight, the blank rows
// of the card (the gap between its parts, the padding above and below) gone; if it is still taller, its answer rows go over the text,
// right under the card's head, as the pager stands first on such a page. `over` is whether the answers are over. None for a block that
// is no wait card.
function tightWait(ui: Ui, names: ReturnType<typeof namesOf>, plan: Plan, card: any, room: number): { card: any; over: boolean } | undefined {
  if (names(card.type) !== 'Box') return undefined
  const parts = kidsOf(card)
  const answers = parts.findIndex(part => ANSWER_ROWS.test(keyOf(part)))
  if (answers < 0) return undefined
  const tight = withProps(ui, card, { gap: 0, paddingY: 0 })
  if (sizeOf(tight, plan.width, names).h <= room) return { card: tight, over: false }
  const head = parts.length > 0 && HEAD_ROW.test(keyOf(parts[0])) ? [parts[0]] : []
  const rest = parts.filter((part, at) => at !== answers && !head.includes(part))
  return { card: withProps(ui, card, { gap: 0, paddingY: 0 }, [...head, parts[answers], ...rest]), over: true }
}

// A pager on a card of its own, the width of the column, when the list is more than one page; none for one page. `compact` leaves the words of
// the page out: the pager over a wait that stands alone, whose answers must stand within the canvas, is then one row where the three parts
// would wrap (order YC, Y2b: with the line and Your cards round it a tall wait stands in the middle of the pages, with both links).
function pagerCard(props: PagedProps, list: string, page: Page, compact = false, tight = false) {
  const { Box } = props.ui
  if (page.pages <= 1) return []
  return [
    <Box key={`${list}-pager-card`} {...cardProps(props.plan.width, props.columns)} {...(tight ? { paddingY: 0 } : {})}>
      {pagerView({ ui: props.ui, list, page, inner: innerOf(props.plan.width, props.columns), onPage: n => props.onPage(list, n), words: !compact })}
    </Box>,
  ]
}

// The rows a pager card takes under a page of blocks: the gap above it, its card and the pager's own rows, wrapped where they wrap in
// the card's width, for a list of `count` blocks.
export const pagerCardRows = (plan: Plan, columns: number, count: number): number => SPACE.block + CARD_ROWS + pagerLinesOf(innerOf(plan.width, columns), count)

// A block that is no wait and does not fit with its compact pager under it, on a canvas that is short (the door line and a line of the read
// over it, at 29 rows): the pager card drawn tight, its padding above and below gone, its links over the block, and no gap between them,
// both in one column; the block drawn tight too (its gap and padding gone) where that is what it takes. None where even that is more
// than the canvas leaves, and the page is then drawn as it was, with its links over the block.
function squeezedPage(props: PagedProps, list: string, page: Page, block: any, count: number): any[] | undefined {
  const { ui, plan, columns, rows } = props
  const { Box } = ui
  const names = namesOf(ui as any)
  const pagerRows = 2 + pagerLinesOf(innerOf(plan.width, columns), count, false)
  const drawn = names(block.type) === 'Box' ? [block, withProps(ui, block, { gap: 0, paddingY: 0 })] : [block]
  const one = drawn.find(part => sizeOf(part, plan.width, names).h + pagerRows <= rows)
  if (one === undefined) return undefined
  return [
    <Box key={`${list}-squeezed`} flexDirection="column">
      {pagerCard(props, list, page, true, true)}
      {one}
    </Box>,
  ]
}

// The rows of the pager card drawn tight (its padding gone) and compact (the two links), over a page: its border and its links. The words
// of the page count too where they are not left out; `count` is the list's pages at the most, since the digits of the words can wrap.
const tightPagerRows = (props: PagedProps, count: number): number => 2 + pagerLinesOf(innerOf(props.plan.width, props.columns), count, false)

// The pages a card makes when it is cut by its units into pages of `room` rows each (a page is the card again, with the units that stand on
// it, as pagedCard cuts it, but with no pager in it). None where the card's words do not split (no part of it is a column of three rows or
// more), where it is one page, or where a page is still taller than `room` (a part that cannot split and is taller than a page).
function shellsOf(props: PagedProps, card: any, room: number): any[] | undefined {
  const { ui, plan } = props
  const names = namesOf(ui as any)
  const parts = kidsOf(card)
  const own = propsOf(card)
  const inner = innerOfPart(own, plan.width)
  const gap = gapOf(own)
  const whole = parts.map(part => sizeOf(part, inner, names).h)
  const chrome = sizeOf(card, plan.width, names).h - whole.reduce((sum, h, at) => sum + h + (at > 0 ? gap : 0), 0)
  // the words must split: a part that is a plain column of three rows or more (the title and the lines of the root, the rows of its text), as
  // unitsOf cuts it, or a part that is cut inside (the open card, the answers of a gate)
  if (!parts.some(part => holdsShell(part) || linedKids(ui, part, innerOfPart(propsOf(part), inner), names).length >= 3)) return undefined
  const units = unitsOf(ui, parts, inner, room - chrome, names, gap)
  // units cut from the open card or a gate are cut by measuring each page as it is drawn, its border round them
  const slices = units.some(unit => unit.chain !== undefined)
    ? cutBy(units.length, (from, to) => sizeOf(withKids(ui, card, nodesOf(ui, units.slice(from, to))), plan.width, names).h <= room, at => units[at].glue === true)
    : pagesOf(units.map(unit => unit.h), room - chrome, at => units[at].inside ?? gap, 0)
  if (slices.length < 2) return undefined
  const shells = slices.map(([from, to]) => withKids(ui, card, nodesOf(ui, units.slice(from, to))))
  return shells.every(shell => sizeOf(shell, plan.width, names).h <= room) ? shells : undefined
}

// The pages of a wait that cannot stand on a page of its own, not even drawn tight with the tight pager over it (a root of many lines, a row
// each: order OC2): the wait pages INSIDE by those lines, the question first, the row "Waits for you" with the answers on the last, and each
// page stands alone with the pager over it, one pager for the body (the pages of the wait are pages of the body). The card is drawn as it is
// first, then tight, as a wait is. None for a block that is no wait, for a wait that stands (it is drawn as it is, or by tightWait), and
// for a wait whose words do not split: that wait is then drawn as tightWait draws it.
function splitWait(props: PagedProps, card: any, count: number): any[] | undefined {
  const { ui, plan, rows } = props
  const names = namesOf(ui as any)
  if (names(card.type) !== 'Box') return undefined
  const parts = kidsOf(card)
  if (parts.length < 2 || !parts.some(part => ANSWER_ROWS.test(keyOf(part)))) return undefined
  const pagerRows = tightPagerRows(props, count + MOST_SHELLS)
  const tight = withProps(ui, card, { gap: 0, paddingY: 0 })
  if (sizeOf(tight, plan.width, names).h + pagerRows <= rows) return undefined
  for (const drawn of [card, tight]) {
    const shells = shellsOf(props, drawn, rows - pagerRows)
    if (shells !== undefined) return shells
  }
  return undefined
}

// The pages a wait may make inside the body, at the most, for the digits of the pager's words.
const MOST_SHELLS = 12

// The same for the card of the Operator lens where it stands with other blocks (the card "Settings changed" over it) and its open card is taller
// than a page: the lens pages INSIDE by the parts of the open card, each page alone with the pager over it. None for another block, or for a lens
// card that stands.
function splitLens(props: PagedProps, card: any, count: number): any[] | undefined {
  const { ui, plan, rows } = props
  if (keyOf(card) !== LENS_CARD) return undefined
  const pagerRows = tightPagerRows(props, count + MOST_SHELLS)
  if (sizeOf(card, plan.width, namesOf(ui as any)).h + pagerRows <= rows) return undefined
  return shellsOf(props, card, rows - pagerRows)
}

// A page of the wait that pages inside: the pager card, tight, over the page, and no gap between them.
function shellPage(props: PagedProps, list: string, page: Page, shell: any, count: number): any[] {
  const { Box } = props.ui
  const compact = pagerLinesOf(innerOf(props.plan.width, props.columns), count) > 1
  return [
    <Box key={`${list}-shell`} flexDirection="column">
      {pagerCard(props, list, page, compact, true)}
      {shell}
    </Box>,
  ]
}

// The blocks of the body that stand on the page asked. Under the canvas's rows: the body as it is.
export function pagedBody(props: PagedProps, body: any[]): any[] {
  const { ui, plan, rows, pages = {}, scope = '' } = props
  const { Box } = ui
  const names = namesOf(ui as any)
  const whole = body.flat(Infinity).filter(block => block !== null && block !== undefined && block !== false)
  if (whole.length === 0) return body
  const wholeHeights = whole.map(block => sizeOf(block, plan.width, names).h)
  const total = wholeHeights.reduce((sum, h, at) => sum + h + (at > 0 ? SPACE.block : 0), 0)
  if (total <= rows) return body
  // a wait that cannot stand on a page of its own pages inside by its lines: its pages are blocks of the body, each alone on a page
  const shells = new Set<any>()
  const blocks =
    whole.length > 1
      ? whole.flatMap(block => {
          const inside = splitWait(props, block, whole.length) ?? splitLens(props, block, whole.length)
          inside?.forEach(shell => shells.add(shell))
          return inside ?? [block]
        })
      : whole
  const heights = blocks.map((block, at) => (shells.has(block) ? rows : wholeHeights[whole.indexOf(block)]))
  if (blocks.length > 1) {
    const pagerRows = pagerCardRows(plan, props.columns, blocks.length)
    const page = pageAt(heights, rows, pages[`${scope}body`] ?? 0, SPACE.block, pagerRows)
    const shown = blocks.slice(page.from, page.to)
    const pager = pagerCard(props, `${scope}body`, page)
    if (shown.length === 1 && shells.has(shown[0])) return shellPage(props, `${scope}body`, page, shown[0], blocks.length)
    // a page of ONE block that does not fit with its pager under it stands over the dock: its links go first, where a press reaches them
    const alone = shown.length === 1 && heights[page.from] + pagerRows > rows
    if (!alone) return [...shown, ...pager]
    // a wait is drawn tight first, then with its answers over its text: the answer rows stand within the canvas, where a press reaches them
    const tight = tightWait(ui, names, plan, shown[0], rows - pagerRows)
    if (tight?.over === true && sizeOf(tight.card, plan.width, names).h + tightPagerRows(props, blocks.length) <= rows) {
      // the tight card with the tight pager over it, and no gap between them, stands within the canvas: that is the page
      return [
        <Box key={`${scope}body-squeezed`} flexDirection="column">
          {pagerCard(props, `${scope}body`, page, true, true)}
          {tight.card}
        </Box>,
      ]
    }
    if (tight === undefined) {
      // a block that is no wait (the card that says nothing waits, between the line of where to write and Your cards): where the pager's three
      // parts wrap to two rows and that is all that keeps the page over the canvas, the pager is compact (the two links) and stands under it
      const compactRows = SPACE.block + CARD_ROWS + pagerLinesOf(innerOf(plan.width, props.columns), blocks.length, false)
      if (heights[page.from] + compactRows <= rows) return [...shown, ...pagerCard(props, `${scope}body`, page, true)]
      return squeezedPage(props, `${scope}body`, page, shown[0], blocks.length) ?? [...pager, ...shown]
    }
    return tight.over ? [...pagerCard(props, `${scope}body`, page, true), tight.card] : [tight.card, ...pager]
  }
  return [pagedCard(props, blocks[0], heights[0])]
}

// A unit of a page: the nodes that stand together (a head with its first row), the rows they take, and the part they were cut from when
// that part was taller than a page. A unit cut from a part has the rows between it and the unit before it in that part (`inside`: the
// part's own gap, which is less than the card's), and may have `lead`: nodes of the card that stand over the part's rows on its page.
// A unit cut from a card inside a part (order OC, the open card of the Operator lens) has `chain`: the nodes it stands in, from the outer to
// the inner, which a page draws again round the units that stand on it (the open card's border on each page). A unit with `glue` stands on
// the page of the unit after it (the row "Waits for you" with the first of its answers).
type Unit = { nodes: any[]; h: number; group?: any; lead?: any[]; inside?: number; chain?: any[]; glue?: boolean }

// The open card of the Operator lens (views/operator.tsx, the key op-card-ID) is a card of a head, the machine lines, the tabs and a body of
// rows, taller than the canvas with a long walk: it pages INSIDE, by those parts, as a wait does, so no page of it passes the canvas. The
// lens card that holds it is the key below.
const OPEN_CARD = /^op-card-/
const LENS_CARD = 'operator-lens'
const isElement = (node: any): boolean => typeof node === 'object' && node !== null && 'type' in node
const isOpenCard = (node: any): boolean => isElement(node) && OPEN_CARD.test(keyOf(node))
const holdsOpenCard = (node: any): boolean => isOpenCard(node) || (isElement(node) && kidsOf(node).some(isOpenCard))
// The answers of a wait (the link "Read the step" and the picks, views/seat.tsx): a gate of twelve picks is taller than a page, and pages by its
// picks as the open card pages by its rows (order P6, S2).
const GATE = /^seat-acts-/
const isGate = (node: any): boolean => isElement(node) && GATE.test(keyOf(node))
const holdsShell = (node: any): boolean => holdsOpenCard(node) || isGate(node)

// The units of a part that is the open card or the answers of a wait, or the plain column that holds the open card with the row of its card
// over it: the card cut by its own parts (its body by rows, its picks one by one), each unit with the nodes it stands in. None for any other part.
function shellUnits(ui: Ui, part: any, inner: number, room: number, names: ReturnType<typeof namesOf>): Unit[] | undefined {
  if (!isElement(part) || names(part.type) !== 'Box' || !holdsShell(part)) return undefined
  const own = propsOf(part)
  const kids = kidsOf(part)
  const gap = gapOf(own)
  if (isOpenCard(part) || isGate(part)) {
    const within = innerOfPart(own, inner)
    const heights = kids.map(kid => heightOf(kid, within, names))
    const chrome = heightOf(part, inner, names) - heights.reduce((sum, h, at) => sum + h + (at > 0 ? gap : 0), 0)
    return deepUnits(ui, kids, within, room - chrome, names, gap).map(unit => ({ ...unit, chain: [part, ...(unit.chain ?? [])] }))
  }
  const within = innerOfPart(own, inner)
  return kids
    .flatMap(kid => {
      const h = heightOf(kid, within, names)
      const cut = (isOpenCard(kid) && h > room ? shellUnits(ui, kid, within, room, names) : undefined) ?? [{ nodes: [kid], h }]
      return cut.map(unit => ({ ...unit, chain: [part, ...(unit.chain ?? [])] }))
    })
    .map((unit, at) => (at > 0 && unit.inside === undefined ? { ...unit, inside: gap } : unit))
}

// The units of the parts of a card that is cut inside another: a part that does not fit `room` and is a plain column of two parts or more is
// cut by its own parts, as deep as it goes, each unit with the columns it stands in (its chain); a column with a border that does not fit (the
// block of the words of the open card) is cut by its lines the same way, its label with its first line, its border drawn again round each page;
// any other part is one unit, taller than a page when it is, and stands alone on one. `inside` is the rows between a unit and the one before it.
function deepUnits(ui: Ui, parts: any[], inner: number, room: number, names: ReturnType<typeof namesOf>, gap: number): Unit[] {
  const out: Unit[] = []
  for (const part of parts) {
    const h = heightOf(part, inner, names)
    const own = propsOf(part)
    const isBox = isElement(part) && names(part.type) === 'Box'
    // a column with a border (the block of the open card: its label and its words) is cut by its lines when it is taller than the page, the
    // border drawn again round each page
    const boxed = isBox && own.borderStyle !== undefined && own.flexDirection !== 'row' && !isOpenCard(part)
    const kids = boxed ? linedKids(ui, part, innerOfPart(own, inner), names, true) : isBox ? kidsOf(part) : []
    // a row that wraps (the picks of a wait) is cut by its children, a line of them as many as its width holds; a row that does not wrap is one unit
    const wraps = own.flexDirection === 'row' && own.flexWrap === 'wrap'
    // a column of one Box holds what is cut, as the column "under" the root of the tree holds the block of the words
    const holds = kids.length === 1 && isElement(kids[0]) && names(kids[0].type) === 'Box'
    if (h <= room || isOpenCard(part) || (kids.length < 2 && !holds) || (own.flexDirection === 'row' && !wraps) || (own.borderStyle && !boxed)) {
      out.push({ nodes: [part], h })
      continue
    }
    const within = innerOfPart(own, inner)
    const chrome = h - kids.reduce((sum, kid, at) => sum + heightOf(kid, within, names) + (at > 0 ? gapOf(own) : 0), 0)
    const cut = deepUnits(ui, kids, within, room - (boxed ? chrome : 0), names, gapOf(own)).map(unit => ({ ...unit, chain: [part, ...(unit.chain ?? [])] }))
    // the label of a block stands with its first line
    if (boxed && cut.length > 2 && cut[0].chain?.length === 1 && cut[1].chain?.length === 1) {
      cut.splice(0, 2, { ...cut[0], nodes: [...cut[0].nodes, ...cut[1].nodes], h: cut[0].h + gapOf(own) + cut[1].h })
    }
    out.push(...cut)
  }
  return out.map((unit, at) => (at > 0 && unit.inside === undefined ? { ...unit, inside: gap } : unit))
}

// The slices of `count` units cut greedily: a page takes the next unit while `fits` says the page, measured as it is drawn, stays within the
// canvas; a unit that does not fit alone stands alone. A unit that is glued to the next does not end a page that has another before it: the page
// ends a unit sooner.
function cutBy(count: number, fits: (from: number, to: number) => boolean, glued: (at: number) => boolean = () => false): [number, number][] {
  const out: [number, number][] = []
  for (let from = 0; from < count; ) {
    let to = from + 1
    while (to < count && fits(from, to + 1)) to += 1
    while (to < count && to - from > 1 && glued(to - 1)) to -= 1
    out.push([from, to])
    from = to
  }
  return out
}

// The same slices cut by the rows each unit adds to its page, each unit measured once (order OC TIME): a page is the card with the units that
// stand on it and the pager of the worst page, and a unit adds its own rows, the gap to the unit before it (the gap of the node they stand
// in together, the card's own for a unit that starts a node of the page) and the border and padding of each node it opens. The unit's
// nodes are its chain, then its group. A slice is the greedy slice of cutBy where `fits` says the page as drawn: the sum only counts, and
// every slice is then proved by the same measure of the page as drawn (it stands, and the next unit does not fit it), so a sum that is
// not exact is never drawn; None then, and the page is cut by cutBy. None too where the units hold a lead, or the pager is no rows.
function sumCut(ui: Ui, names: ReturnType<typeof namesOf>, plan: Plan, drawn: any, units: Unit[], worst: any[], rows: number, fits: (from: number, to: number) => boolean): [number, number][] | undefined {
  if (worst.length === 0 || units.some(unit => unit.lead !== undefined || unit.glue === true)) return undefined
  const base = sizeOf(withKids(ui, drawn, worst), plan.width, names).h
  const cardGap = gapOf(propsOf(drawn))
  const chromes = new Map<any, number>()
  const chromeOf = (shell: any): number => {
    if (!chromes.has(shell)) chromes.set(shell, sizeOf(withKids(ui, shell, []), plan.width, names).h)
    return chromes.get(shell) as number
  }
  const pathOf = (unit: Unit): any[] => [...(unit.chain ?? []), ...(unit.group !== undefined ? [unit.group] : [])]
  // the rows a unit adds to a page whose last unit stands in the nodes `before`
  const added = (unit: Unit, path: any[], before: any[]): number => {
    let shared = 0
    while (shared < path.length && shared < before.length && path[shared] === before[shared]) shared += 1
    return (shared === 0 ? cardGap : gapOf(propsOf(path[shared - 1]))) + path.slice(shared).reduce((sum, shell) => sum + chromeOf(shell), 0) + unit.h
  }
  const out: [number, number][] = []
  let from = 0
  let high = base
  let before: any[] = []
  units.forEach((unit, at) => {
    const path = pathOf(unit)
    if (at > from && high + added(unit, path, before) <= rows) {
      high += added(unit, path, before)
    } else {
      if (at > from) out.push([from, at])
      from = at
      high = base + added(unit, path, [])
    }
    before = path
  })
  out.push([from, units.length])
  const proved = out.every(([start, end]) => (end - start === 1 || fits(start, end)) && (end === units.length || !fits(start, end + 1)))
  return proved ? out : undefined
}

// The head row of a wait stands with the first of its words, and the row "Waits for you" with the answers under it, so a page never holds
// the head or the pager alone, and the answers stand on the page of their own words or on the last.
const KEPT_WITH_NEXT = /^seat-(head|ask)-/

function joinedUnits(units: Unit[], gap: number): Unit[] {
  const out: Unit[] = []
  for (let at = 0; at < units.length; at++) {
    const unit = units[at]
    const next = units[at + 1]
    if (next === undefined || unit.group !== undefined || !KEPT_WITH_NEXT.test(keyOf(unit.nodes[0]))) {
      out.push(unit)
      continue
    }
    // the answers cut by their own parts keep the nodes they stand in: the row stands before them, glued to the first
    if (next.chain !== undefined) {
      out.push({ ...unit, glue: true })
      continue
    }
    at += 1
    const h = unit.h + gap + next.h
    out.push(next.group === undefined ? { nodes: [...unit.nodes, ...next.nodes], h } : { ...next, lead: [...unit.nodes, ...(next.lead ?? [])], h })
  }
  return out
}

const gapOf = (props: any): number => (typeof props.rowGap === 'number' ? props.rowGap : typeof props.gap === 'number' ? props.gap : 0)
const innerOfPart = (props: any, outer: number): number =>
  (typeof props.width === 'number' ? props.width : outer) - 2 * (props.borderStyle ? 1 : 0) - 2 * (typeof props.paddingX === 'number' ? props.paddingX : 0)

const textOf = (node: any): string => (typeof node === 'string' || typeof node === 'number' ? String(node) : isElement(node) ? kidsOf(node).map(textOf).join('') : '')

// The kids of a part that is a plain column (no border, not a row): each Text of more than one row, where the column has no gap between its kids,
// is a Text a row (the rows the estimate counts, wrapRows of views/cells.ts), so a text of 120 cells is cut by its lines as the lines of a
// root are; the kids as they are where the column has a gap, which a text's own rows have none of. None for any other part: a column with a
// border (a card of its own) is one too only where `bordered` says it, for the block of the open card (deepUnits).
function linedKids(ui: Ui, part: any, within: number, names: ReturnType<typeof namesOf>, bordered = false): any[] {
  if (!isElement(part) || names(part.type) !== 'Box' || (propsOf(part).borderStyle && !bordered) || propsOf(part).flexDirection === 'row') return []
  const { Text } = ui
  const kids = kidsOf(part)
  if (gapOf(propsOf(part)) !== 0) return kids
  return kids.flatMap(kid => {
    const rows = isElement(kid) && names(kid.type) === 'Text' ? wrapRows(textOf(kid), within) : []
    if (rows.length < 2) return [kid]
    const { children: _children, key: _key, ...rest } = propsOf(kid)
    return rows.map((row, at) => (
      <Text key={`${keyOf(kid)}-line-${at}`} {...rest}>
        {row}
      </Text>
    ))
  })
}

// The units of a card's parts. A part that fits `room` is one unit. A plain column of three rows or more (a section: its title, then
// its rows) that does not fit is cut by its rows, its title kept with its first row; a part that cannot split (a card of its own, a
// gate with its answers) is one unit, taller than the page when it is, and stands alone on one.
function unitsOf(ui: Ui, parts: any[], inner: number, room: number, names: ReturnType<typeof namesOf>, cardGap: number): Unit[] {
  const out: Unit[] = []
  // the rows of the part before this one that stands with it on a page (the head row of a wait, the row "Waits for you") and the gap after it:
  // a part stands within a page only where it fits with them, else it is cut
  let held = 0
  for (const part of parts) {
    const h = heightOf(part, inner, names)
    const own = propsOf(part)
    const within = innerOfPart(own, inner)
    const space = room - held
    held = KEPT_WITH_NEXT.test(keyOf(part)) ? h + cardGap : 0
    const rows = h > space ? linedKids(ui, part, within, names) : []
    const shelled = h > space ? shellUnits(ui, part, inner, space, names) : undefined
    if (shelled !== undefined) {
      out.push(...shelled)
      continue
    }
    if (h <= space || rows.length < 3) {
      out.push({ nodes: [part], h })
      continue
    }
    const gap = gapOf(own)
    const heights = rows.map(row => heightOf(row, within, names))
    out.push({ nodes: [rows[0], rows[1]], h: heights[0] + gap + heights[1], group: part })
    for (let at = 2; at < rows.length; at++) out.push({ nodes: [rows[at]], h: heights[at], group: part, inside: gap })
  }
  return joinedUnits(out, cardGap)
}

// The nodes of the units on a page: the units cut from one part, side by side, stand in that part again.
function nodesOf(ui: Ui, units: Unit[], depth = 0): any[] {
  const out: any[] = []
  for (let at = 0; at < units.length; at++) {
    // the units cut from one card stand in that card again, as many deep as their chain says
    const shell = units[at].chain?.[depth]
    if (shell !== undefined) {
      const inside: Unit[] = []
      while (at < units.length && units[at].chain?.[depth] === shell) inside.push(units[at++])
      at -= 1
      out.push(withKids(ui, shell, nodesOf(ui, inside, depth + 1)))
      continue
    }
    const group = units[at].group
    if (group === undefined) {
      out.push(...units[at].nodes)
      continue
    }
    const members: Unit[] = []
    while (at < units.length && units[at].group === group && units[at].chain?.[depth] === undefined) members.push(units[at++])
    at -= 1
    out.push(...(members[0].lead ?? []))
    out.push(withKids(ui, group, members.flatMap(unit => unit.nodes)))
  }
  return out
}

// The card of an opened item of the desk (views/desk.tsx, key desk-item): drawn tight (its gap and its padding gone) when that makes it fewer pages,
// so its first page holds its head and more of its parts at the pane's least rows (order P1b), as the open card of the Operator lens does.
const TIGHT_CARD = /^desk-item$/

// A card of several parts, paged by its units: the units that fit its rows, and the pager inside the card, under them.
function pagedCard(props: PagedProps, card: any, height: number) {
  const { ui, plan } = props
  const names = namesOf(ui as any)
  if (names(card.type) !== 'Box') return card
  const asIs = cutCard(props, card, height)
  if (!TIGHT_CARD.test(keyOf(card)) || asIs === undefined) return asIs?.node ?? card
  const tight = withProps(ui, card, { gap: 0, paddingY: 0 })
  const tighter = cutCard(props, tight, sizeOf(tight, plan.width, names).h)
  return tighter !== undefined && tighter.pages < asIs.pages ? tighter.node : asIs.node
}

// The card cut as it is drawn: the node of the page asked and the pages the card makes (none for a card of one part).
function cutCard(props: PagedProps, card: any, height: number): { node: any; pages: number } | undefined {
  const { ui, plan, rows, pages = {}, scope = '' } = props
  const names = namesOf(ui as any)
  const parts = kidsOf(card)
  if (parts.length < 2) return undefined
  const own = propsOf(card)
  const inner = innerOfPart(own, plan.width)
  const gap = gapOf(own)
  const whole = parts.map(part => heightOf(part, inner, names))
  const chrome = height - whole.reduce((sum, h, at) => sum + h + (at > 0 ? gap : 0), 0)
  const room = rows - chrome
  // a unit that fits the page's rows with the pager under it is one unit; the pager is the card's last part: the gap above and its rows
  const units = unitsOf(ui, parts, inner, room - gap - pagerLinesOf(inner, parts.length), names, gap)
  const list = `${scope}card`
  if (units.some(unit => unit.chain !== undefined)) return { node: pagedInCard(props, card, units.length), pages: Number.POSITIVE_INFINITY }
  const page = pageAt(units.map(unit => unit.h), room, pages[list] ?? 0, at => units[at].inside ?? gap, gap + pagerLinesOf(inner, units.length))
  const taken = units.slice(page.from, page.to)
  const shown = nodesOf(ui, taken)
  const pager = page.pages <= 1 ? [] : pagerView({ ui, list, page, inner, onPage: n => props.onPage(list, n) })
  // a page of ONE unit that does not fit with its pager under it stands over the dock: the links are the card's first row
  const alone = taken.length === 1 && taken[0].h + gap + pagerLinesOf(inner, units.length) > room
  return { node: withKids(ui, card, alone ? [...pager, ...shown] : [...shown, ...pager]), pages: page.pages }
}

// A card whose units are cut from a card inside it (the open card of the Operator lens): the border of that card comes to each page, so a page
// is measured as it is drawn, with the pager of the worst page (both links, the widest numbers) under it. The card is drawn as it is, then
// tight (its gap and padding gone); the way whose every page stands within the canvas with the fewer pages is the one (as it is at a tie).
function pagedInCard(props: PagedProps, card: any, first: number) {
  const { ui, plan, rows, pages = {}, scope = '' } = props
  const names = namesOf(ui as any)
  const list = `${scope}card`
  const way = (drawn: any) => {
    const own = propsOf(drawn)
    const inner = innerOfPart(own, plan.width)
    const gap = gapOf(own)
    // the words of the page stand between the links where the three fit one row; else the links alone (the compact pager of a wait)
    const wordsFor = (count: number): boolean => pagerLinesOf(inner, count) <= 1
    const worstOf = (count: number) => pagerView({ ui, list, page: { from: 0, to: 0, page: 1, pages: count, after: 1 }, inner, onPage: () => undefined, words: wordsFor(count) })
    const bare = sizeOf(withKids(ui, drawn, worstOf(first)), plan.width, names).h
    const units = unitsOf(ui, kidsOf(drawn), inner, rows - bare - gap, names, gap)
    const worst = worstOf(units.length)
    const stands = (from: number, to: number): boolean => sizeOf(withKids(ui, drawn, [...nodesOf(ui, units.slice(from, to)), ...worst]), plan.width, names).h <= rows
    const slices = sumCut(ui, names, plan, drawn, units, worst, rows, stands) ?? cutBy(units.length, stands, at => units[at].glue === true)
    return { drawn, units, inner, stands, slices, words: wordsFor(units.length), ok: slices.every(([from, to]) => stands(from, to)) }
  }
  const ways = [way(card), way(withProps(ui, card, { gap: 0, paddingY: 0 }))]
  const best = ways.filter(one => one.ok).sort((a, b) => a.slices.length - b.slices.length)[0] ?? ways[1]
  const wanted = Math.min(Math.max(0, Math.floor(pages[list] ?? 0)), best.slices.length - 1)
  const [from, to] = best.slices[wanted]
  const page = { from, to, page: wanted, pages: best.slices.length, after: best.units.length - to }
  const shown = nodesOf(ui, best.units.slice(from, to))
  const pager = page.pages <= 1 ? [] : pagerView({ ui, list, page, inner: best.inner, onPage: n => props.onPage(list, n), words: best.words })
  // a page of ONE unit that does not stand with its pager under it: the links are the card's first row
  const alone = to - from === 1 && !best.stands(from, to)
  return withKids(ui, best.drawn, alone ? [...pager, ...shown] : [...shown, ...pager])
}

// THE FIT (order FIT, step two): NOTHING SCROLLS, and a page is never drawn past the canvas. ONE rule on the common frame, for
// every place, whether it pages by pagedBody or by itself: the page as it is drawn is measured; where it passes the canvas its fixed parts give
// way, the dim lines of a column first, then the head of a card, then the air between the parts, then the edge of the card; where it still
// passes, the page is one line, "This place needs N rows; the pane has M.", and the strip's Back stays (the canvas draws it). A place that fits
// whole stands whole, at any rows. N is the pane's rows and the rows the page passes with its parts given way, read here at the draw. No table.
// The canvas of a pane under FIT_LEAST rows is laid out for FIT_LEAST (pane.tsx, LEAST_ROWS), so the rows it leaves are that much over the truth.
export const FIT_LEAST = 24

export type FitProps = {
  ui: Ui
  plan: Plan
  columns: number
  // The rows the canvas leaves for the body (the rows pagedBody is given), and the pane's own rows.
  rows: number
  paneRows: number
}

const CONTROLS = ['Button', 'Select', 'Input']
const holdsControl = (names: ReturnType<typeof namesOf>, node: any): boolean =>
  isElement(node) && (CONTROLS.includes(names(node.type)) || kidsOf(node).some(kid => holdsControl(names, kid)))

// A fixed part that gives way: a Text of words alone in the theme's dim key, or (for the head) the first part of a card when it holds no control.
const isDimLine = (names: ReturnType<typeof namesOf>, node: any): boolean => isElement(node) && names(node.type) === 'Text' && propsOf(node).color === THEME.dim && !holdsControl(names, node)
// The words of a letter (views/seat.tsx, the key seat-text-) are the first part of the card that holds the ask and the picks, but they are no head: they stay.
const LETTER_WORDS = /^seat-text-/
const isHead = (names: ReturnType<typeof namesOf>, node: any): boolean => isElement(node) && !holdsControl(names, node) && !isPressBox(node) && !LETTER_WORDS.test(keyOf(node))
// A block of the page made of cards with no edge of its own (pane.tsx: the head of a letter and its tabs, in one column so that the air between them gives
// way with the other air): its cards are blocks of the page too, and give their edge (order P1b).
const CARD_BLOCK = /^letter-head$/

// The node again with its fixed parts given way, to `level`: 1 the dim lines of its columns, 2 the head of each card too, 3 the air of a column
// too (the gap between its parts, the padding above and below a card), 4 the edge of each card of the page (its two border rows; the card
// keeps its ground; the letter's head block, which has no edge of its own, hands its place to the cards in it). A column keeps at least one part; a row, a press box and a part that is no Box are as they are. The same node where
// nothing gave way, so a kept key stays. `top` is a block of the page itself.
function giveWay(ui: Ui, names: ReturnType<typeof namesOf>, node: any, level: number, top = true): any {
  if (!isElement(node) || names(node.type) !== 'Box' || isPressBox(node)) return node
  const own = propsOf(node)
  const kids = kidsOf(node)
  const column = own.flexDirection !== 'row'
  const through = top && column && own.borderStyle === undefined && CARD_BLOCK.test(keyOf(node))
  let next = kids.map(kid => giveWay(ui, names, kid, level, through))
  if (column) {
    const card = own.borderStyle !== undefined
    const kept = next.filter((kid, at) => !isDimLine(names, kid) && !(level >= 2 && card && at === 0 && next.length > 1 && isHead(names, kid)))
    if (kept.length > 0 && kept.length < next.length) next = kept
  }
  const patch: Record<string, unknown> = {}
  if (level >= 3 && column) {
    for (const key of ['gap', 'rowGap', 'paddingY']) if (typeof own[key] === 'number' && own[key] > 0 && (key !== 'paddingY' || own.borderStyle !== undefined)) patch[key] = 0
  }
  if (level >= 4 && top && column && own.borderStyle !== undefined) patch.borderStyle = undefined
  const same = next.length === kids.length && next.every((kid, at) => kid === kids[at])
  if (Object.keys(patch).length > 0) return withProps(ui, node, patch, next)
  return same ? node : withKids(ui, node, next)
}

export function fitBody(props: FitProps, body: any[]): any[] {
  const { ui, plan, paneRows } = props
  const { Box, Text } = ui
  const names = namesOf(ui as any)
  const whole = body.flat(Infinity).filter(block => block !== null && block !== undefined && block !== false)
  if (whole.length === 0) return body
  const rows = props.rows - Math.max(0, FIT_LEAST - paneRows)
  const high = (blocks: any[]): number => blocks.reduce((sum, block, at) => sum + sizeOf(block, plan.width, names).h + (at > 0 ? SPACE.block : 0), 0)
  const ways = [whole, ...[1, 2, 3, 4].map(level => whole.map(block => giveWay(ui, names, block, level)))]
  const stands = ways.findIndex(way => high(way) <= rows)
  if (stands === 0) return body
  if (stands > 0) return ways[stands]
  return [
    <Box key="fit-line" alignSelf="flex-start" paddingX={SPACE.control} backgroundColor={THEME.ground}>
      <Text key="fit-words" color={THEME.dim} wrap="wrap">
        {`This place needs ${paneRows + high(ways[ways.length - 1]) - rows} rows; the pane has ${paneRows}.`}
      </Text>
    </Box>,
  ]
}
