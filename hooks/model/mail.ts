// A mail as the pane draws it (order G2 M1): one mail that lands in the room is ONE card, the root of which holds `outside: true` and `mail: N`, N the
// counter of the mail. The fields of the mail are NOT in the card's text: they are in `mail/N.put.json` of the run, which sandoq writes before the card
// lands, and the pane reads that file and no other; a card with none is drawn as a bare mail (bareMailCardOf). A part of the Walk as `task` is (model/task.ts): pure, no `$`, no view. Run by `node` too: no enums,
// `import type`, `.ts` in imports.
import { sizeWords } from './shelffiles.ts'

// THE ONE TEST OF A MAIL CARD (M2 counts by it too): the number a card's root names, or none. The root must hold `outside` as the JSON value true and `mail` as a
// whole number of 1 to 15 digits with no leading zero, the writer's own rule (a fence value `007` or `"5"` or `"../x"` is text, not a number; a decimal, a
// negative and a root with no `outside` are none). So no path is made from a word of a card: N is digits and nothing else. A seat's row that holds a key `mail`
// and no `outside`, and a root with `outside` and no `mail`, are no mail cards.
export const MAIL_DIGITS = 15
export function mailNumberOf(fence: Record<string, unknown> | undefined): number | undefined {
  if (fence === undefined || fence.outside !== true) return undefined
  const mail = fence.mail
  return typeof mail === 'number' && Number.isSafeInteger(mail) && mail >= 1 && String(mail).length <= MAIL_DIGITS ? mail : undefined
}

// The folder of the run that holds the mails, and the one file of a mail the pane reads (the folder's listing gives the size of its attachments).
export const MAIL_FOLDER = 'mail'
export const mailPutName = (n: number): string => `${n}.put.json`

// A party of a mail: the name (may be empty) and the address.
export type Party = { name: string; address: string }
// The file of a mail an attachment is: its path under mail/ and the sender's name for it. The pane never opens it.
export type MailFile = { path: string; name: string }
// The fields of `mail/N.put.json` the pane draws. `auth` is read by nobody here: no word of it is shown (order G2 M1).
export type Mail = { n: number; from: Party; to: Party[]; subject: string; date: string; text: string; files: MailFile[] }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
// Control characters out (the sender's words are the sender's), the rest as written.
const clean = (text: string): string => Array.from(text).filter(char => char === '\n' || char === '\t' || (char >= ' ' && char !== '\u007f')).join('')
const oneLine = (text: string): string => clean(text).split(/\s+/).filter(word => word !== '').join(' ')

function partyOf(value: unknown): Party | undefined {
  if (!isObject(value) || typeof value.address !== 'string') return undefined
  if (value.name !== undefined && typeof value.name !== 'string') return undefined
  return { name: oneLine(typeof value.name === 'string' ? value.name : ''), address: oneLine(value.address) }
}

function partiesOf(value: unknown): Party[] | undefined {
  if (value === undefined) return []
  if (!Array.isArray(value)) return undefined
  const parties = value.map(partyOf)
  return parties.every(party => party !== undefined) ? (parties as Party[]) : undefined
}

function filesOf(value: unknown): MailFile[] | undefined {
  if (value === undefined) return []
  if (!Array.isArray(value)) return undefined
  const files: MailFile[] = []
  for (const one of value) {
    if (!isObject(one) || typeof one.path !== 'string' || typeof one.name !== 'string') return undefined
    files.push({ path: one.path, name: oneLine(one.name) })
  }
  return files
}

// The mail N of the text of its put file, or none when the text is not JSON or the wrong shape: an object with `from` ({name, address}) and `text`, and, when
// they are there, `to` (a list of parties), `subject` and `date` (text) and `files` (a list of {path, name}). None is the card drawn as it is today.
export function mailOf(n: number, json: string): Mail | undefined {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    return undefined
  }
  if (!isObject(value)) return undefined
  const from = partyOf(value.from)
  const to = partiesOf(value.to)
  const files = filesOf(value.files)
  if (from === undefined || to === undefined || files === undefined || typeof value.text !== 'string') return undefined
  for (const key of ['subject', 'date']) if (value[key] !== undefined && typeof value[key] !== 'string') return undefined
  return {
    n,
    from,
    to,
    subject: oneLine(typeof value.subject === 'string' ? value.subject : ''),
    date: oneLine(typeof value.date === 'string' ? value.date : ''),
    text: clean(value.text).split('\t').join('  ').trimEnd(),
    files,
  }
}

// The sender as a line reads it: the name, else the address.
export const senderOf = (mail: Mail): string => (mail.from.name !== '' ? mail.from.name : mail.from.address)

// The feed row of a mail: `Mail from NAME: SUBJECT`, NAME the from name else the address. A mail with no subject is `Mail from NAME`.
export const mailRow = (mail: Mail): string => `Mail from ${senderOf(mail)}${mail.subject === '' ? '' : `: ${mail.subject}`}`

// A party as the card says it: `Name <address>`, or the address alone when the name is empty.
export const partyLine = (party: Party): string => (party.name === '' ? party.address : `${party.name} <${party.address}>`)

// STOPGAP, until desk-node's typed fence keys (N1) come: the notes of sandoq are lines of the card's text, fixed words, and a card shows one when its
// text holds it as a WHOLE line. This is a match of fixed lines, never a parse of the text; the fields of the mail are never read from it.
export const MAIL_NOTES = [
  '[fell back: no allow-list of the room matched]',
  '[cut]',
  '[text cut by the sender side]',
  '[attachments cut]',
  '[attachments not kept: the mail folder is full]',
  '[attachment not kept: its file name stands]',
]

// The notes a card's text holds, each once, in the order of MAIL_NOTES. A line is a note only when it IS the note: the line with a word more or less is none.
export function notesOf(text: string): string[] {
  const lines = new Set(text.split('\n').map(line => (line.endsWith('\r') ? line.slice(0, -1) : line)))
  return MAIL_NOTES.filter(note => lines.has(note))
}

// A file of the mail as the card lists it: the sender's name for it and its size in words, or none when the folder's listing does not hold the file.
export type ListedFile = { name: string; size: string }

// What the pane holds of a mail card: the mail, its row, the notes and the files with their sizes. `sizes` are the sizes of the folder's listing, by file name.
// `bare` is set on a mail whose put file is not there (order C): its `mail` holds no field but the number and the card's text, and every user of it says "Mail N".
export type MailCard = { mail: Mail; row: string; notes: string[]; files: ListedFile[]; bare?: true }

// A mail card with no put file (absent, no JSON or the wrong shape) is still a mail: the row `Mail N`, no sender, no files, and the card's text whole as its body (never
// read for a field). It holds no notes: the card's text is shown whole and already holds the note lines, which would stand twice. It is not kept: the next read of the walks looks for the put file again, and a file that came later gives the full fields.
export function bareMailCardOf(n: number, cardText: string): MailCard {
  return {
    mail: { n, from: { name: '', address: '' }, to: [], subject: '', date: '', text: cardText, files: [] },
    row: `Mail ${n}`,
    notes: [],
    files: [],
    bare: true,
  }
}

export function mailCardOf(mail: Mail, cardText: string, sizes: ReadonlyMap<string, number>): MailCard {
  return {
    mail,
    row: mailRow(mail),
    notes: notesOf(cardText),
    files: mail.files.map(file => {
      const size = sizes.get(file.path)
      return { name: file.name, size: size === undefined ? '' : sizeWords(size) }
    }),
  }
}

// The line a file is on the card: the name, then the size when the listing gave one.
export const fileLine = (file: ListedFile): string => (file.size === '' ? file.name : `${file.name} · ${file.size}`)

// The date of a mail as its card says it (order G2 M2): in UTC, `YYYY-MM-DD HH:MM UTC`, and the time alone, `HH:MM UTC`, where the card is narrow. The date of the put
// file is the mail's own header (`Wed, 28 Oct 2026 09:14:00 +0000`) or an ISO time; a date that does not parse is shown as it is, and none says nothing.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const ZONES: Record<string, number> = { z: 0, gmt: 0, utc: 0, ut: 0, est: -300, edt: -240, cst: -360, cdt: -300, mst: -420, mdt: -360, pst: -480, pdt: -420 }
const HEADER = /^(?:[A-Za-z]{3},\s*)?(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{4}|[A-Za-z]{1,3})?\s*(?:\(.*\))?$/
const ISO = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/

// The minutes east of UTC a zone word or `+hhmm` says; none when it says nothing the pane knows.
function zoneMinutes(zone: string | undefined): number | undefined {
  if (zone === undefined || zone === '') return 0
  const sign = /^([+-])(\d{2}):?(\d{2})$/.exec(zone)
  if (sign !== null) return (sign[1] === '-' ? -1 : 1) * (Number(sign[2]) * 60 + Number(sign[3]))
  return ZONES[zone.toLowerCase()]
}

// The moment of a date in ms since the epoch, or none when it does not parse.
export function dateMs(date: string): number | undefined {
  const text = date.trim()
  const header = HEADER.exec(text)
  const iso = header === null ? ISO.exec(text) : null
  let year: number, month: number, day: number, hour: number, minute: number, second: number, zone: string | undefined
  if (header !== null) {
    month = MONTHS.indexOf(header[2].toLowerCase())
    if (month < 0) return undefined
    ;[day, year, hour, minute, second, zone] = [Number(header[1]), Number(header[3]), Number(header[4]), Number(header[5]), Number(header[6] ?? 0), header[7]]
  } else if (iso !== null) {
    ;[year, month, day, hour, minute, second, zone] = [Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), Number(iso[4]), Number(iso[5]), Number(iso[6] ?? 0), iso[7]]
  } else return undefined
  const east = zoneMinutes(zone)
  if (east === undefined || month > 11 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 60) return undefined
  const ms = Date.UTC(year, month, day, hour, minute, second) - east * 60_000
  return Number.isFinite(ms) ? ms : undefined
}

const two = (n: number): string => String(n).padStart(2, '0')
export function dateWords(date: string, short: boolean): string {
  const ms = dateMs(date)
  if (ms === undefined) return oneLine(date)
  const at = new Date(ms)
  const time = `${two(at.getUTCHours())}:${two(at.getUTCMinutes())} UTC`
  return short ? time : `${at.getUTCFullYear()}-${two(at.getUTCMonth() + 1)}-${two(at.getUTCDate())} ${time}`
}

// ---- THE ROOM'S MAIL SWITCH (order M3): what `sandoq mail status` says, and the card Settings draws. Pure: no host, no view. The pane reads these lines and
// no others: it holds no key or token, and the address is shown as sandoq wrote it, never made or parsed out of anything else.

// `mail is on|off for ROOM: ADDRESS (N senders allowed)`, or `mail is off for ROOM` (the room has no row yet at the account), and after either maybe
// `cannot work: WORD (meaning)`, kept whole.
export type MailSwitchRead = { on: boolean; room: string; address: string; senders: number | undefined; cannot: string }

const STATUS_LINE = /^mail is (on|off) for (\S+): (.+) \((\d{1,9}) senders? allowed\)$/
const STATUS_NO_ROW = /^mail is off for (\S+)$/
const CANNOT_WORK = /^cannot work: \S.*$/

// The state in a text of `status`; none for a text of another shape (a line before, a third line, a first line of neither form).
export function parseMailStatus(text: string): MailSwitchRead | undefined {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
  if (lines.length === 0 || lines.length > 2) return undefined
  const cannot = lines[1] ?? ''
  if (cannot !== '' && !CANNOT_WORK.test(cannot)) return undefined
  const found = STATUS_LINE.exec(lines[0])
  if (found !== null) return { on: found[1] === 'on', room: found[2], address: found[3], senders: Number(found[4]), cannot }
  const bare = STATUS_NO_ROW.exec(lines[0])
  return bare === null ? undefined : { on: false, room: bare[1], address: '', senders: undefined, cannot }
}

// The first line of a text, whole and trimmed ('' for none): what the pane shows of a status it does not read.
export const firstLineOf = (text: string): string => text.split('\n').map(line => line.trim()).find(line => line !== '') ?? ''

// sandoq's one line of a refusal without its `sandoq: `: the last line of what it wrote to stderr. An exit 2 is not read here: the pane says one plain
// cause for it (MAIL_SWITCH_OLDER), not the usage line of sandoq.
export const mailWhy = (code: number | undefined, err: string): string => {
  const lines = err.split('\n').map(line => line.trim()).filter(line => line !== '')
  return (lines[lines.length - 1] ?? '').replace(/^sandoq: /, '') || `sandoq mail exited ${code ?? 'with no code'}`
}

// The card of the section, as the register hands it. `read` is what the LAST status gave: a status that fails (a refusal, the exit 2 of an older sandoq, a text
// the pane does not read) clears it, so the Button goes with it and `line` says why. `line` is sandoq's own line when no state is read (the exit 2 of an older sandoq is the one plain
// line of MAIL_SWITCH_OLDER); `pressLine` the refusal of on or off, under the Button; `closed` the plain line of a pane that
// cannot ask (no sandoq, a sandoq under MAIL_VERB_FROM, no marked room); `busy` whether a call is out.
export type MailSwitchCard = { state: 'rest' | 'reading' | 'done'; read: MailSwitchRead | undefined; line: string; pressLine: string; closed: string; busy: boolean }

export const MAIL_SWITCH_HEAD = 'Mail'
export const MAIL_SWITCH_OFF = "Off. On, email to this room's address lands as a card."
export const mailSwitchOn = (read: MailSwitchRead): string =>
  `Email into this room: ${read.address === '' ? 'no address' : read.address}. ${read.senders ?? 0} ${read.senders === 1 ? 'sender' : 'senders'} may write.`

// The word of the state in the list of Settings: on, off, or none before a read.
export const mailSwitchState = (card: MailSwitchCard | undefined): string => (card === undefined || card.closed !== '' || card.read === undefined ? '' : card.read.on ? 'on' : 'off')
// The Button stands where a state was read, and no line of a refusal of status or of a closed pane stands in its place.
export const mailSwitchShown = (card: MailSwitchCard): boolean => card.closed === '' && card.read !== undefined && card.line === ''
