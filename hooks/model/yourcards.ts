// Your cards (order YC, Y2a): which cards of the room are HIS, and the one line of a card's state. A card is his when the session its root
// names is one of the session ids of THIS folder (a seat is a folder, so the cards said from this folder are this seat's), and its words
// are a person's, not the harness's. The ids come from `room-pane-sessions.json` in the run folder, which the submit hook writes by a
// rename at each message: `{"folders": {FOLDER: [ID, ...]}}`, the ids newest first, at most SESSION_IDS_MOST a folder, each once. The file's
// name, the count, the shape of an id and the key of a folder are bridge.ts's, one home for the hook that writes the file and the pane that
// reads it. Pure, with no `$`, and it imports no view and no host module. Run by `node` too: no enums, `import type`, `.ts` in imports.
import { SESSION_IDS_MOST, folderKey, isSessionId } from '../bridge.ts'
import { ageWords, ulidMs } from './profile.ts'
import { parseWalk } from './walk.ts'
import type { Card } from './walk.ts'

// The rows a card takes on the list: its words, then its one dim line.
export const CARD_ROWS = 2

// The words of the part (order YC, Y2b). The command a person writes to say to the room is the one the pane registers for a say: its name
// is this one word, the name register.tsx registers and runs (a test holds the two equal). `/sandoq` stays the word for the command of sandoq alone.
export const SAY_COMMAND = 'room-say'
export const YOUR_HEAD = 'Your cards'
export const NO_CARD_LINE = 'No card of yours yet.'
export const WRITE_LINE = 'Write to the room in the chat box below. Each message is a card.'
export const BRIDGE_OFF_LINE = `The bridge is off: a message makes no card. Turn it on in the settings of sandoq, or write /${SAY_COMMAND} and your words.`
// The line of where to write, the first of Letters: the bridge's own words where the plugin option turned it off.
export const writeLineOf = (bridgeOff: boolean): string => (bridgeOff ? BRIDGE_OFF_LINE : WRITE_LINE)

// The true word of a say that sandoq made a card of and the door did not take (exit 1 with the card's id printed): the card stands, so it is kept.
export const DOOR_LATE = 'the card is made and the door did not take it'
// The session a say of the pane passes first (the flag --session of `sandoq room say`): the NEWEST id of this folder; none where the folder holds none.
export const newestIdOf = (ids: string[]): string => ids[0] ?? ''
// The card of his at a place of the list, counted from 1, the newest first; none for a place the list does not hold.
export const cardAtPlace = <T>(cards: T[], place: number): T | undefined => (Number.isInteger(place) && place >= 1 ? cards[place - 1] : undefined)

// The words a person typed after one of the pane's slash words, with each slash word of the pane at their start taken off, again and again:
// `/sandoq`, `/room` and `/room-say`, any case. Only a word WITH the slash is a slash word: a bare `sandoq`, `room` or `room-say` is a plain
// word of the person's and stays (`room is cold tonight`), and so does a slash word in the middle of the words. Words that are slash words
// alone leave an empty text.
const LEADING_SLASH_WORD = /^\/(?:sandoq|room-say|room)(?=\s|$)/i
export function withoutSlashWords(words: string): string {
  let rest = words.trim()
  for (let match = LEADING_SLASH_WORD.exec(rest); match !== null; match = LEADING_SLASH_WORD.exec(rest)) rest = rest.slice(match[0].length).trim()
  return rest
}

// The ids of the cards a say of the pane made this session, kept in memory (rule A): the newest MOST_SAID, each once, newest first.
export const MOST_SAID = 32
const ID_WORD = /^\.?([0-9A-Za-z]{20,})$/
// The id a say printed: its last line is the card's word, a dot and the ULID (card.py), or the bare ULID (room.sh say). Any other last
// line, or none, gives no id.
export const idOfSay = (printed: string): string => ID_WORD.exec(printed.trim().split('\n').at(-1)?.trim() ?? '')?.[1] ?? ''
export const keepSaid = (said: string[], id: string): string[] => (id === '' ? said : [id, ...said.filter(one => one !== id)].slice(0, MOST_SAID))

// The ids of one folder in the file's text, newest first: at most SESSION_IDS_MOST, each once, each of the shape of an id (isSessionId).
// No file, a text that is no json object, no `folders` object, no list under this folder, and a folder that is empty are each an empty
// list, never a throw.
export function sessionIdsOf(text: string, folder: string): string[] {
  if (text === '' || folder === '') return []
  let folders: unknown
  try {
    const parsed: unknown = JSON.parse(text)
    folders = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as { folders?: unknown }).folders : undefined
  } catch {
    return []
  }
  if (typeof folders !== 'object' || folders === null || Array.isArray(folders)) return []
  const want = folderKey(folder)
  const key = Object.keys(folders).find(one => folderKey(one) === want)
  const listed = key === undefined ? undefined : (folders as Record<string, unknown>)[key]
  if (!Array.isArray(listed)) return []
  const ids: string[] = []
  for (const one of listed) {
    if (typeof one !== 'string' || !isSessionId(one) || ids.includes(one)) continue
    ids.push(one)
    if (ids.length === SESSION_IDS_MOST) break
  }
  return ids
}

// THE TEST: a card is his when its root's session is one of the ids of this folder and a person wrote it, or when a say of the pane made it
// in this session (`said`, the second input, kept in memory). With no ids and none said no card is his, and a root with no session is his
// only by being said.
export const isHis = (card: Card, ids: string[], said: string[] = []): boolean =>
  said.includes(card.id) || (card.walk.session !== '' && card.walk.source === 'person' && ids.includes(card.walk.session))

// The cards that may be his, out of EVERY walk of the gate and not only the newest shown ones (a busy room would push his cards off the
// shown eight): the newest MOST_LISTED walks whose text holds a session id of this folder or whose id a say of the pane made. The shown
// cards are kept as they are, the others are read from their text; isHis then tells which of them are his.
export const MOST_LISTED = 40
export function candidatesOf(walks: { id: string; text: string }[], shown: Card[], ids: string[], said: string[]): Card[] {
  const kept = new Map(shown.map(card => [card.id, card]))
  const out: Card[] = []
  for (let at = walks.length - 1; at >= 0 && out.length < MOST_LISTED; at -= 1) {
    const { id, text } = walks[at]
    if (!said.includes(id) && !ids.some(one => text.includes(one))) continue
    const have = kept.get(id)
    if (have !== undefined) out.push(have)
    else if (text !== '') {
      const walk = parseWalk(text)
      out.push({ id, text: walk.text, raw: text, walk })
    }
  }
  return out
}

// The states of a card of his, in the order they are told: it holds an ask that waits on him; the room answered; a fault stopped it; the
// room took it (its walk holds more than its root); the door has not taken it yet.
export type YourState = 'waits' | 'answered' | 'faulted' | 'reads' | 'sent'
export const STATE_WORDS: Record<YourState, string> = {
  waits: 'waits for you',
  answered: 'answered',
  faulted: 'faulted',
  reads: 'the room reads it',
  sent: 'sent',
}

// A card of his as the list draws it: the card's id, its words, the state and its word, the FIRST line of its answer (whole, '' when it has
// none; the draw cuts it by cells), its WHOLE answer for the open card ('' when it has none) and its age ('' when the id gives none).
export type YourCard = { id: string; text: string; state: YourState; word: string; answer: string; whole: string; age: string }

const stateOf = (card: Card): YourState => {
  const { walk } = card
  if (walk.waiting) return 'waits'
  if (walk.answered) return 'answered'
  if (walk.hasFault) return 'faulted'
  return walk.steps.length > 1 ? 'reads' : 'sent'
}

// The first line of an answer with a word in it, its spaces squeezed.
export const firstLine = (answer: string): string => {
  const line = answer.split('\n').find(one => one.trim() !== '')
  return line === undefined ? '' : line.split(/\s+/).filter(word => word !== '').join(' ')
}

// The cards of his, the NEWEST FIRST (a card's id is a ULID, so its time is its order), each with its state.
export function yourCardsOf(cards: Card[], ids: string[], now: number, said: string[] = []): YourCard[] {
  return cards
    .filter(card => isHis(card, ids, said))
    .sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
    .map(card => {
      const state = stateOf(card)
      return {
        id: card.id,
        text: card.walk.text,
        state,
        word: STATE_WORDS[state],
        answer: state === 'answered' ? firstLine(card.walk.answer) : '',
        whole: state === 'answered' ? card.walk.answer.trim() : '',
        age: ageWords(ulidMs(card.id), now),
      }
    })
}

// What follows the state's word on the line: the first line of the answer and the age, with a dot between.
export const tailOf = (card: YourCard): string => [card.answer, card.age].filter(part => part !== '').join(' · ')

// The one line of a card's state as the read tool says it: the word, the first line of the answer, the age.
export const lineOf = (card: YourCard): string => [card.word, tailOf(card)].filter(part => part !== '').join(' · ')
