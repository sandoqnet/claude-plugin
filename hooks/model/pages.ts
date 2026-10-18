// The pages of a list that is longer than the canvas (order D1, still A2): NOTHING SCROLLS, so a list shows the items that fit the
// rows it has, then one link `N more ›` that turns the page in place, with `‹ Earlier` back, and the words "page 2 of 3". Pure: it
// reads the rows each item takes (the height of a card by `cardRows` of the card views, or a count of lines) and the rows the canvas
// leaves, and says which items stand on the page asked. It imports nothing, and no view or host module.

// The rows the pager takes under a page that is not the only one: the `line` above it and its links, which are one row, or two when
// the card is narrow and the row wraps (the count is the worst case, so a page never runs over its column).
export const PAGER_ROWS = 3

export type Page = {
  // The items shown: from the first (included) to the end (excluded) of the list.
  from: number
  to: number
  // The page shown and how many pages the list makes, counted from 0 and from 1.
  page: number
  pages: number
  // The items on the pages after this one: the N of `N more ›`.
  after: number
}

// The pages of a list by the rows of each item, packed in order: an item goes on the page while the rows of the page, the `gap` rows
// between two items and the pager's own rows (when the list is more than one page) stay within `budget`; an item that is taller
// than a page stands alone on one. A list that fits whole is one page with no pager. `budget` counts the rows the items may take, and
// `pagerRows` the rows the pager takes when the list is more than one page: a place that knows its card's width counts them wrapped.
// `gap` is one number, or a function of the item that gives the rows between it and the item before it (the lines of one block of
// words lie closer than the parts of the card round it).
export type Gap = number | ((at: number) => number)
export function pagesOf(heights: number[], budget: number, gap: Gap = 0, pagerRows = PAGER_ROWS): [number, number][] {
  const gapAt = (at: number): number => (typeof gap === 'number' ? gap : gap(at))
  const fit = (room: number): [number, number][] => {
    const out: [number, number][] = []
    let from = 0
    while (from < heights.length) {
      let used = 0
      let to = from
      while (to < heights.length) {
        const next = used + (to > from ? gapAt(to) : 0) + heights[to]
        if (to > from && next > room) break
        used = next
        to += 1
      }
      out.push([from, to])
      from = to
    }
    return out
  }
  const whole = fit(Math.max(1, budget))
  // One page holds everything: no pager takes rows. More than one: pack again with the pager's rows kept free.
  return whole.length <= 1 ? whole : fit(Math.max(1, budget - pagerRows))
}

// The page asked of a list (counted from 0), held to the pages the list makes: a page past the last is the last, one before the
// first is the first. An empty list is one page of nothing.
export function pageAt(heights: number[], budget: number, wanted = 0, gap: Gap = 0, pagerRows = PAGER_ROWS): Page {
  const slices = pagesOf(heights, budget, gap, pagerRows)
  if (slices.length === 0) return { from: 0, to: 0, page: 0, pages: 1, after: 0 }
  const page = Math.min(Math.max(0, Math.floor(Number.isFinite(wanted) ? wanted : 0)), slices.length - 1)
  const [from, to] = slices[page]
  return { from, to, page, pages: slices.length, after: heights.length - to }
}

// The page of a list that shows a FIXED number of items a page (the quiet seats, six), whatever the rows: the page asked (from 0),
// held to the pages the list makes. A list of `size` items or fewer is one page.
export function pageBy(count: number, size: number, wanted = 0): Page {
  const each = Math.max(1, Math.floor(size))
  const pages = Math.max(1, Math.ceil(count / each))
  const page = Math.min(Math.max(0, Math.floor(Number.isFinite(wanted) ? wanted : 0)), pages - 1)
  const from = Math.min(count, page * each)
  const to = Math.min(count, from + each)
  return { from, to, page, pages, after: count - to }
}

// The pages a step from one place to the next keeps: none when the place is another, when the section of Settings is another, or when the
// record is another (a press on a connection opens a record in the same view, which starts on its first page); else the pages as they were.
// A step between the list in Letters and one of his open cards keeps the list's page, so Back returns to the list on the same page; the open
// card's own page (OPEN_PAGE) starts again on its first page where the card is another.
export const OPEN_PAGE = 'yours-open'
const SHELF_LIST = /^shelf(-|$)/
const inLetters = (view: string): boolean => view === 'seat' || view === 'yours'
export const ROOM_LIST = 'roomcard'
type Step = { view: string; section?: string; recordId?: string; cardId?: string; card?: string; of?: string }
const onRoomCard = (step: Step): boolean => step.view === 'room' && step.card === undefined
const besideRoomCard = (step: Step): boolean =>
  step.view === 'level' || (step.view === 'shelf' && step.of === undefined) || (step.view === 'settings' && step.section === 'versions') || (step.view === 'room' && step.card !== undefined)
export function pagesKept(pages: Record<string, number>, was: Step, next: Step): Record<string, number> {
  if (next.view === 'yours' || was.view === 'yours') {
    if (!inLetters(next.view) || !inLetters(was.view)) return {}
    if ((next.view === 'yours' && was.view === 'yours' && next.cardId === was.cardId) || !(OPEN_PAGE in pages)) return pages
    const { [OPEN_PAGE]: _gone, ...rest } = pages
    return rest
  }
  const another =
    next.view !== was.view ||
    (next.view === 'settings' && next.section !== was.section) ||
    (next.view === 'room' && next.card !== was.card) ||
    (next.view === 'profile' && next.recordId !== was.recordId) ||
    (next.view === 'shelf' && was.view === 'shelf' && next.of !== was.of)
  if (!another) return pages
  // The shelf's own pages (its lists are named `shelf`, `shelf-people`, ...) outlast a step into a record and back, so Back returns to the
  // page of the shelf the record was opened from; the record's pages start again, and any other step forgets them all, a step from one
  // shelf to another (a seat's) too, and a step between the shelf of a seat and a record of another one's.
  const aroundShelf =
    (was.of ?? '') === (next.of ?? '') && ((was.view === 'shelf' && next.view === 'profile') || (was.view === 'profile' && (next.view === 'shelf' || next.view === 'profile')))
  if (aroundShelf) return Object.fromEntries(Object.entries(pages).filter(([list]) => SHELF_LIST.test(list)))
  // The room card's own page outlasts a step to Seats, the Shelf, Versions, the Door or What it plays and back, so Back lands on the page it
  // left; the list of a card of the room (`door`, `plays`) starts again on its first page.
  return ROOM_LIST in pages && ((onRoomCard(was) && besideRoomCard(next)) || (besideRoomCard(was) && onRoomCard(next))) ? { [ROOM_LIST]: pages[ROOM_LIST] } : {}
}

// The words of a page: "page 2 of 3", and none for a list of one page.
export const pageWords = (page: Page): string => (page.pages <= 1 ? '' : `page ${page.page + 1} of ${page.pages}`)
