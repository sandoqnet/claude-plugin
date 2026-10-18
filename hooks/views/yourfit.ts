// How many of his cards fit (order YC, Y2a): ONE pure function of the pane's rows and columns, by the frame's canvasRowsOf, so the body never
// passes the canvas. `above` is what already stands in the body over the list (the strip, the line of where to write, the waits and the
// head `Your cards`), and `gap` the rows the draw puts between two cards. The cards that do not fit stand behind the app's own pager.
import { pageAt } from '../model/pages'
import type { Page } from '../model/pages'
import { CARD_ROWS } from '../model/yourcards'
import { canvasRowsOf } from './frame'

// The rows the list may take: the canvas less what stands above it, never under one row.
export const listRowsOf = (rows: number, columns: number, above: number): number => Math.max(1, canvasRowsOf(rows, columns) - Math.max(0, above))

// The page asked of the list of `total` cards (counted from 0): the newest that fit, at least 1 where a card stands; with more than one page
// the pager's own rows are kept free (pagesOf).
export const yourPageOf = (total: number, rows: number, columns: number, above: number, wanted = 0, gap = 0): Page =>
  pageAt(Array.from({ length: Math.max(0, total) }, () => CARD_ROWS), listRowsOf(rows, columns, above), wanted, gap)

// The same with the rows the pager takes told (the compact pager is one row, not the three of the worst case).
export const yourPageWith = (total: number, rows: number, columns: number, above: number, wanted: number, pagerRows: number): Page =>
  pageAt(Array.from({ length: Math.max(0, total) }, () => CARD_ROWS), listRowsOf(rows, columns, above), wanted, 0, pagerRows)

// How many cards the first page holds.
export const yourFitOf = (total: number, rows: number, columns: number, above: number, gap = 0): number => {
  const page = yourPageOf(total, rows, columns, above, 0, gap)
  return page.to - page.from
}
