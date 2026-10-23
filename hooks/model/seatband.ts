// THE SEAT PART OF THE BAND (order seat band, desk-panel 557417): what `sandoq room peek --room ROOM --seat SEAT --json` says of this seat, and the line the band draws
// from it. The peek is read on events by the register and kept here as this answer; the band draws from the answer and reads nothing.

// The answer of one peek: whether the folder's seat is open, the rows that wait (null when the peek could not count them), and whether more than the peek counts wait.
export type Peek = { open: boolean; waiting: number | null; more: boolean }

// One json line of the peek's out (the last line that holds anything), or none when it is not a peek's answer: a sandoq that has no peek says its usage (exit 2, no json),
// and an object with no `open` is no peek. On a fault sandoq gives waiting null and a why; the why goes nowhere.
export function peekOf(out: string): Peek | undefined {
  const said = peekObject(out)
  if (said === undefined) return undefined
  const { open, waiting, more } = said
  if (typeof open !== 'boolean') return undefined
  const count = typeof waiting === 'number' && Number.isInteger(waiting) && waiting >= 0 ? waiting : null
  return { open, waiting: count, more: more === true }
}

// The room and the seat a peek named (the answer of a peek with no flags names the seat the folder holds): none when it names no seat, as `{"open": false}` does.
export function peekNamed(out: string): { room: string; seat: string } | undefined {
  const said = peekObject(out)
  if (said === undefined || said.open !== true) return undefined
  return typeof said.room === 'string' && typeof said.seat === 'string' && said.room !== '' && said.seat !== '' ? { room: said.room, seat: said.seat } : undefined
}

function peekObject(out: string): Record<string, unknown> | undefined {
  const line = out.split('\n').map(one => one.trim()).filter(one => one !== '').at(-1)
  if (line === undefined) return undefined
  let said: unknown
  try {
    said = JSON.parse(line)
  } catch {
    return undefined
  }
  return typeof said === 'object' && said !== null && !Array.isArray(said) ? (said as Record<string, unknown>) : undefined
}

// The rows part: none when the peek could not count; `no rows wait`, `1 row waits`, `N rows wait`, and `N+ rows wait` when more than the peek counts wait.
export function rowsWords(peek: Peek): string {
  if (peek.waiting === null) return ''
  if (peek.waiting === 0 && !peek.more) return 'no rows wait'
  const plus = peek.more ? '+' : ''
  return peek.waiting === 1 && !peek.more ? '1 row waits' : `${peek.waiting}${plus} rows wait`
}

// The band's line when the seat part stands: SEAT · seat open|seat shut · rows · what waits on him. The card preview is left out.
export function seatBandLine(seat: string, open: boolean, peek: Peek, waits: string): string {
  return [seat, open ? 'seat open' : 'seat shut', rowsWords(peek), waits].filter(part => part !== '').join(' · ')
}
