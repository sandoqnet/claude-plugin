// The Secrets section of Settings (order S2): the names `sandoq secret list` says, and the card the section draws. Pure: no host, no view.
// The pane holds NAMES and where each is kept, never a value, and takes none: a secret is set in a terminal (`sandoq secret set NAME`) or in the
// sandoq control panel, never in the pane.

// One line of the list: the name, the discs that declare it, and where it is kept ('' when it is not set).
export type SecretRow = { name: string; discs: string; where: string }

// The card of the section, as the register hands it: what the last read gave, the name whose line stands shown ('' for none), and the one line of a
// read that failed.
export type SecretsCard = {
  state: 'rest' | 'reading' | 'done'
  rows: SecretRow[]
  open: string
  line: string
  // No sandoq was found for this room, so nothing can be read (the plain line); '' when one was.
  cannot: string
}

// sandoq's words for no name at all.
const NONE = 'no secret is declared or set'
const LINE = /^([A-Z][A-Z0-9_]*): (.*), (?:set in (.+)|not set)$/

// The rows of the text `sandoq secret list` printed: `NAME: DISCS, set in WHERE` or `NAME: DISCS, not set`, one a line. The words for
// none give no row. A text that holds a line of neither shape and no row is no list the pane reads: none is returned, and the card says so.
export function parseSecretList(text: string): SecretRow[] | undefined {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
  if (lines.length === 0 || (lines.length === 1 && lines[0] === NONE)) return []
  const rows: SecretRow[] = []
  for (const line of lines) {
    const found = LINE.exec(line)
    if (found !== null) rows.push({ name: found[1], discs: found[2], where: found[3] ?? '' })
  }
  return rows.length === 0 ? undefined : rows
}

// The one dim line a list row of Settings says of the section: how many names are set. '' before a read has ended.
export function secretsState(card: SecretsCard | undefined): string {
  if (card === undefined || card.state !== 'done') return ''
  if (card.line !== '') return 'Not read'
  if (card.rows.length === 0) return 'None declared'
  return `${card.rows.filter(row => row.where !== '').length} of ${card.rows.length} set`
}

// The last line of what a refused call wrote on its error out, cut to 160 characters: sandoq's one line (`sandoq: ...`), which never holds a
// value. '' when it wrote none.
export function lastLineOf(text: string | undefined): string {
  const lines = String(text ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
  return (lines.at(-1) ?? '').slice(0, 160)
}
