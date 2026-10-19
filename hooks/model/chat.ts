// His chat with the keeper on a desk card (order keeper chat, pane 0.8.71): the thread is read from the card's walk, in the order of the file. Pure: no
// host and no view. Run by `node` too: no enums, `import type`, `.ts` in imports.
//
// The forms (the disc's, cha-study/the-keeper-chat-forms.md): his line is `chat / @CARD / { walk::hand::chat }` (5,2) and the keeper's answer
// `chat / @LINE / { walk::keeper::chat }` (5,2), both children of the card root, the answer naming his line by @LINE, one answer a line. A line with no
// answer is waiting. A fault ends the wait: it is read by its fence key `chat`, which names his line, and NEVER by its parent, for the walk puts a block
// only under a block still open on its path (his line while it is open, else the last open block). No block of the thread is an ask.
import { blockWords, fenceText, idOf, parseBlocks } from './blocks.ts'
import type { Block } from './blocks.ts'

// The most characters of a line to the keeper: the bar says so over it, and sends nothing.
export const CHAT_LIMIT = 1000

export type ChatWho = 'you' | 'keeper'

// One line of the thread: who said it, the words, and for his line whether it waits for the keeper's answer and why it failed ('' for none).
export type ChatLine = { id: string; who: ChatWho; words: string; waiting: boolean; fault: string }

const WEIGHT = 5
const CLOSE = 2
const isChat = (block: Block, who: string): boolean => block.chi === 'walk' && block.che === who && block.cho === 'chat' && block.lead === WEIGHT && block.close === CLOSE
const ANSWERED = /@(?:cha:)?([0-9A-Za-z]{20,})/

// The line a keeper block answers: the id its second term names, '' for none.
export const answeredLine = (block: Block): string => ANSWERED.exec(block.words)?.[1] ?? ''

// The why of a fault: `chat LINE: WHY` gives WHY; any other words are the why as they stand, and a fault with no words gives its body.
const WHY = /^chat\s+\S+:\s*(.*)$/s
function whyOf(block: Block): string {
  const words = blockWords(block.words).trim()
  const hit = WHY.exec(words)
  const why = (hit === null ? words : hit[1]).trim()
  return why === '' ? block.body.trim() : why
}

// The faults of the thread by the line they name: the fence key `chat`, wherever the fault lies. The newest fault of a line is its why.
function faultsOf(blocks: Block[]): Map<string, string> {
  const faults = new Map<string, string>()
  for (const block of blocks) {
    if (block.cho !== 'fault') continue
    const line = fenceText(block, 'chat')
    if (line !== '') faults.set(line, whyOf(block))
  }
  return faults
}

// The thread of a walk, in the order of the file. `sent` is the words he sent that the pane has not seen in the walk yet (the door may not have written
// his line when the poll reads): a line of these words that the walk does not hold is drawn at the end, waiting, as many as were sent less those the walk
// holds. A walk that holds no chat is no thread.
export function chatThread(text: string, sent: string[] = []): ChatLine[] {
  const blocks = parseBlocks(text)
  const answered = new Set(blocks.filter(block => isChat(block, 'keeper')).map(answeredLine))
  const faults = faultsOf(blocks)
  const lines: ChatLine[] = []
  for (const block of blocks) {
    if (isChat(block, 'hand')) {
      const id = idOf(block)
      const fault = faults.get(id) ?? ''
      lines.push({ id, who: 'you', words: block.body, waiting: !answered.has(id) && fault === '', fault })
    } else if (isChat(block, 'keeper')) {
      lines.push({ id: idOf(block), who: 'keeper', words: block.body, waiting: false, fault: '' })
    }
  }
  const held = new Map<string, number>()
  for (const line of lines) if (line.who === 'you') held.set(line.words, (held.get(line.words) ?? 0) + 1)
  const owed = new Map<string, number>()
  for (const words of sent) owed.set(words, (owed.get(words) ?? 0) + 1)
  for (const [words, count] of owed) {
    for (let more = count - (held.get(words) ?? 0); more > 0; more -= 1) lines.push({ id: '', who: 'you', words, waiting: true, fault: '' })
  }
  return lines
}

// The one line of the disc's chat program (exit 1) that says the tap is KEPT: `chat: the ring was refused, the tap stands`. His line was sent all the same: the
// door takes the tap at its next ring and writes the line. Every other line of exit 1 (no card, no words, over the bound) wrote nothing.
export const keptTap = (line: string): boolean => /ring was refused/i.test(line)

// The words the bar sends, as chat.py writes them: each run of white space is one space, then trimmed; '' sends nothing. The walk holds his line in these words,
// so the words kept for the wait (chatSent) match it, and a line typed over two lines or with two spaces does not wait for ever. Past CHAT_LIMIT characters of
// this text (counted as characters, not as bytes) the line is too long.
export const chatWords = (text: string): string => text.replace(/\s+/g, ' ').trim()
export const chatTooLong = (words: string): boolean => Array.from(words).length > CHAT_LIMIT
export const chatLongWords = (words: string): string =>
  `A line to the keeper holds at most ${CHAT_LIMIT} characters; this one holds ${Array.from(words).length}. Nothing was sent.`

// The words of /sandoq after the command, when the first word is the plain word chat (as open and shut are read): the rest, trimmed, is his line to the
// keeper on the card the pane has open. `chat` alone gives '' (the usage line). Any other first word, chatty or Chat, is no chat: it is a say as it was.
export function chatCommandOf(words: string): string | undefined {
  const hit = /^chat(?:\s+([\s\S]*))?$/.exec(words.trim())
  return hit === null ? undefined : (hit[1] ?? '').trim()
}

export const CHAT_USAGE = 'room: Nothing was sent, no words after chat: /sandoq chat WORDS.'
export const CHAT_NO_CARD = 'room: Nothing was sent, the pane has no card open from the desk. Open one, then say /sandoq chat WORDS.'
