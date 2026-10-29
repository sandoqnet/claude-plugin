// The mail open (order G2 M2), the board's card (design-director's mail-pane-1.md, part 3), the app's and the terminal's. A mail is a row of the Desk (views/desk.tsx) and a
// press on it opens this card a step from the desk. The strip over it is the pane's own (`‹ Desk`, `mail` dim, `Close`); the composer under it says `To the room` alone,
// for the pane sends no mail. In order: the subject with its mark (two rows at the most), who it is from (the name, and the address dim where the card holds it), the
// date line, a hairline, the body, the files by name and size (no press: the pane never opens a mail's file), and the fixed notes of sandoq, dim. The fields are those of
// the mail's put file (model/mail.ts), never a parse of the card's text; a mail with no put file is a bare mail: `Mail N`, `mail from outside`, the hairline and the card's text
// whole, with no from line and no files. A mail waits on nobody: no ask, no turn, no gate stands on it. Nothing scrolls: the card pages by
// its lines, as an open card of his does (views/yourcard.tsx). In the app the size, the space and the color are the theme's and space's names; the terminal keeps the look's.
import { dateWords, fileLine, mailRow } from '../model/mail'
import type { MailCard } from '../model/mail'
import { OPEN_PAGE, pageAt } from '../model/pages'
import type { Card } from '../model/walk'
import { cellsOf } from './theme'
import { wrapCells } from './card-rows'
import { isApp } from './glass'
import { LOOK } from './look'
import { CARD_ROWS } from './paged'
import { pagerLinesOf, pagerView } from './pager'
import { SPACE } from './space'
import { terminalPagerRows, terminalPagerView } from './termpage'
import { THEME, cardProps, fitted, innerOf } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

// The mails of the room as the desk lists them: the cards that have a read mail, newest first.
export const mailsOf = (cards: Card[]): Card[] =>
  cards.filter(card => card.mail !== undefined && card.walk.mail !== undefined).sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))

// The title of the strip over the open mail, dim; the mark before the subject; the mark of a file.
export const MAIL_TITLE = 'mail'
export const MAIL_MARK = '✉'
export const FILE_MARK = '▣'
// The rows the subject may take, and the columns of the pane under which the card leaves the address out and says the time alone (the board's two panes: 54 columns keep
// the address, 40 leave it; a card at 80 columns is no narrower for its padding).
export const SUBJECT_ROWS = 2
export const NARROW_COLUMNS = 54
// The words of the files' head, and the rule line.
export const FILES_HEAD = 'Files'
const RULE = '─'

// One part of a line of the card: its words and how it is drawn (dim, or bold). The parts of a line stand in a row with a cell between them, so no part holds a space at its ends.
export type MailPart = { text: string; dim?: boolean; bold?: boolean }
export type MailLine = { parts: MailPart[] }

// The words of a mail's first line: the mark and the subject, or the feed's words where the mail has none.
export const subjectOf = (card: MailCard): string => `${MAIL_MARK} ${card.mail.subject !== '' ? card.mail.subject : card.bare === true ? card.row : mailRow(card.mail)}`

// The lines of an open mail at `inner` cells, the board's order. `narrow` leaves the address out of the from line and shortens the date to the time.
export function mailLinesOf(card: MailCard, inner: number, narrow = false): MailLine[] {
  const lines: MailLine[] = []
  const one = (text: string, over: Omit<MailPart, 'text'> = {}): MailLine => ({ parts: [{ text, ...over }] })
  // 1 the subject, bold, two rows at the most and the last cut with an ellipsis
  const subject = wrapCells(subjectOf(card), inner)
  subject.slice(0, SUBJECT_ROWS).forEach((text, at) => lines.push(one(at === SUBJECT_ROWS - 1 && subject.length > SUBJECT_ROWS ? fitted(`${text}…`, inner) : text, { bold: true })))
  // 2 who it is from: the name in the text tone, the address dim after it where the card holds it; a bare mail (no put file) has no from line
  const { from, date } = card.mail
  if (card.bare !== true) {
    const name = from.name !== '' ? from.name : from.address
    const who = fitted(`from ${name}`, inner)
    const room = inner - cellsOf(who) - cellsOf(' · ')
    lines.push(from.name !== '' && !narrow && who === `from ${name}` && room >= cellsOf(from.address) ? { parts: [{ text: who }, { text: `· ${from.address}`, dim: true }] } : one(who))
  }
  // 3 the date, dim
  lines.push(one(fitted(`mail from outside${date === '' ? '' : ` · ${dateWords(date, narrow)}`}`, inner), { dim: true }))
  // 4 the hairline
  lines.push(one(RULE.repeat(inner), { dim: true }))
  // 5 the body, as the sender wrote its lines
  if (card.mail.text !== '') lines.push(...wrapCells(card.mail.text, inner).map(text => one(text)))
  // 6 the files: a head with their count, then a row a file, its name and its size
  if (card.files.length > 0) {
    lines.push(one(''), { parts: [{ text: FILES_HEAD, bold: true }, { text: String(card.files.length), dim: true }] })
    for (const file of card.files) {
      const whole = `${FILE_MARK} ${fileLine(file)}`
      lines.push(file.size !== '' && cellsOf(whole) <= inner ? { parts: [{ text: `${FILE_MARK} ${file.name}` }, { text: `· ${file.size}`, dim: true }] } : one(fitted(whole, inner)))
    }
  }
  // 7 the notes of sandoq, dim
  if (card.notes.length > 0) lines.push(one(''), ...card.notes.flatMap(note => wrapCells(note, inner).map(text => one(text, { dim: true }))))
  return lines
}

// The words that say the mail is not here now: it left the newest cards.
export const GONE_MAIL = 'This mail is not on the list now.'

// What a surface draws a mail with: the app the theme's keys and one card of the plan's width, the terminal the look's keys and a bordered block. `inner` is the cells of a line.
type Look = { app: boolean; dim: string; frame: Record<string, unknown>; inner: number }
function lookOf(surface: string | undefined, plan: Plan, columns: number): Look {
  const app = isApp(surface)
  return app
    ? { app, dim: THEME.dim, frame: cardProps(plan.width, columns), inner: innerOf(plan.width, columns) }
    : { app, dim: LOOK.quiet, frame: { flexDirection: 'column', ...LOOK.section }, inner: Math.max(1, columns - 4) }
}

export type MailOpenProps = {
  ui: Ui
  surface?: string
  plan: Plan
  columns: number
  // The mail, or none when it has left the list.
  card: Card | undefined
  // The rows the place leaves for it; none is a host that does not say them, and no mail is cut to a height nobody told.
  rows?: number
  pages?: Record<string, number>
  onPage: (page: number) => void
  // The terminal has no strip: its card draws its own Back, the way to the desk.
  back?: { label: string; press: () => void }
}

export function mailOpenView({ ui, surface, plan, columns, card, rows, pages = {}, onPage, back }: MailOpenProps) {
  const { Box, Text, Button } = ui
  const look = lookOf(surface, plan, columns)
  const backRow = back === undefined ? [] : [<Button key="mail-back" label={back.label} onPress={back.press} />]
  if (card?.mail === undefined) {
    return (
      <Box key="mail-open" {...look.frame}>
        {backRow}
        <Text key="mail-open-gone" color={look.dim}>
          {GONE_MAIL}
        </Text>
      </Box>
    )
  }
  const lines = mailLinesOf(card.mail, look.inner, columns < NARROW_COLUMNS)
  // the box (and the Back of the terminal) are the rows besides the lines; the pager is the card's last part
  const chrome = look.app ? CARD_ROWS : 2 + backRow.length
  const pagerRows = look.app ? SPACE.line + pagerLinesOf(look.inner, lines.length) : terminalPagerRows(look.inner, Math.ceil(lines.length / 2))
  const page = rows === undefined ? undefined : pageAt(lines.map(() => 1), rows - chrome, pages[OPEN_PAGE] ?? 0, 0, pagerRows)
  const shown = page === undefined ? lines : lines.slice(page.from, page.to)
  const pager = page === undefined ? [] : look.app ? pagerView({ ui, list: OPEN_PAGE, page, inner: look.inner, onPage }) : terminalPagerView({ ui, list: OPEN_PAGE, page, onPage })
  return (
    <Box key="mail-open" {...look.frame}>
      {backRow}
      <Box key="mail-open-lines" flexDirection="column">
        {shown.map((line, at) => {
          const key = `mail-open-line-${(page?.from ?? 0) + at}`
          const text = (part: MailPart, index: number) => (
            <Text key={`${key}-${index}`} {...(part.bold === true ? { bold: true } : {})} {...(part.dim === true ? { color: look.dim } : {})}>
              {part.text}
            </Text>
          )
          return line.parts.length === 1 ? (
            text(line.parts[0], 0)
          ) : (
            <Box key={key} flexDirection="row" columnGap={1}>
              {line.parts.map(text)}
            </Box>
          )
        })}
      </Box>
      {pager}
    </Box>
  )
}
