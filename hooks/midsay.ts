// A /sandoq part in the middle of his message (order mid-sandoq): the words after a `/sandoq` or `/room` that is NOT the first word of
// the message go to the room as a say, and the session reads only the words before it. The road is the kit's prompt.submit, which runs
// before the turn and can rewrite the text. Pure, with no `$`: splitMid reads the text, midEdit decides the edit and calls the send it is
// given, which is register.tsx's say (the same words the /sandoq command says). Run by `node` too: no enums, `.ts` in imports.

// The line the session reads in place of the part that went; the text it reads is the words before the slash word alone.
export const MID_LINE = 'The words after /sandoq went to the room as a say; they are not for this turn.'
// A slash word with no words after it sends nothing, and the text stays whole.
export const NO_PART_LINE = 'The /sandoq in this message has no words after it: nothing was sent to the room.'
// The room refused or the send failed: the whole text stays and the session is told.
export const notSentLine = (why: string): string => `The words after /sandoq were not sent to the room (${why.replace(/\s+/g, ' ').trim().slice(0, 200)}); the whole message stays.`

// Only a person's own prompt is split: the composer and the bridge. A peer, a plugin or a schedule is another's text.
const OWN_ORIGINS: readonly string[] = ['composer', 'bridge']

// A slash word of the pane at the start of the message is the command's: the host runs it with the words, so nothing is split.
const PANE_COMMAND = /^\/(?:sandoq|room-say|room-tap|room-new|room)(?=\s|$)/i
// A /sandoq or /room word: after a space or a line start (a/sandoq is no word, nor a path), then a space or the end (/room-say is another).
const MID_WORD = /(^|\s)\/(sandoq|room)(?=\s|$)/gi
const FENCE_OPEN = /^\s{0,3}(`{3,})/
const FENCE_SHUT = /^\s{0,3}(`{3,})\s*$/

// Which characters stand in code: a fence of three backticks or more, line by line from its opening line to a line of at least as many
// backticks (an unshut fence runs to the end), and an inline span, a run of backticks to the next run of the same length on the line
// (an unmatched run is a plain character).
function codeMask(text: string): boolean[] {
  const mask: boolean[] = new Array<boolean>(text.length).fill(false)
  let fence = 0
  let start = 0
  for (const line of text.split('\n')) {
    const end = start + line.length
    if (fence > 0) {
      mask.fill(true, start, end)
      const shut = FENCE_SHUT.exec(line)
      if (shut !== null && shut[1].length >= fence) fence = 0
    } else {
      const open = FENCE_OPEN.exec(line)
      if (open !== null) {
        fence = open[1].length
        mask.fill(true, start, end)
      } else {
        for (let at = start; at < end; ) {
          if (text[at] !== '`') {
            at += 1
            continue
          }
          let run = at
          while (run < end && text[run] === '`') run += 1
          const size = run - at
          let close = -1
          for (let look = run; look < end; ) {
            if (text[look] !== '`') {
              look += 1
              continue
            }
            let stop = look
            while (stop < end && text[stop] === '`') stop += 1
            if (stop - look === size) {
              close = stop
              break
            }
            look = stop
          }
          if (close === -1) at = run
          else {
            mask.fill(true, at, close)
            at = close
          }
        }
      }
    }
    start = end + 1
  }
  return mask
}

// The words before the first /sandoq or /room that is not the first word and not in code, and the words after it, each trimmed; none where
// the text has no such word or begins with a slash word of the pane. The part may be empty ('' for a slash word with nothing after it).
export function splitMid(text: string): { before: string; part: string } | undefined {
  if (PANE_COMMAND.test(text.trimStart())) return undefined
  const mask = codeMask(text)
  MID_WORD.lastIndex = 0
  for (let found = MID_WORD.exec(text); found !== null; found = MID_WORD.exec(text)) {
    const slash = found.index + found[1].length
    if (mask[slash]) continue
    const before = text.slice(0, slash).trim()
    if (before === '') return undefined
    return { before, part: text.slice(slash + 1 + found[2].length).trim() }
  }
  return undefined
}

// The slice of the kit's PromptSubmitInput this reads, and the edit it hands back (next({ ...e, ...edit })).
export type MidInput = { text: string; origin?: { kind?: string }; context?: string[] }
export type MidEdit = { text?: string; context: string[] }
// What the say reports: sent is true where a card was made; line is the room's own line, shown to the person by the send itself.
export type MidSent = { sent: boolean; line: string }

// The edit for one submit, or none where the submit is another's or has no middle slash word. A split sends the part, then the text is the
// words before it and the context holds MID_LINE; an empty part sends nothing; a refusal, or a send that threw, keeps the whole text.
export async function midEdit(input: MidInput, send: (part: string) => Promise<MidSent>): Promise<MidEdit | undefined> {
  if (!OWN_ORIGINS.includes(input.origin?.kind ?? '')) return undefined
  const split = splitMid(String(input.text ?? ''))
  if (split === undefined) return undefined
  const context = input.context ?? []
  if (split.part === '') return { context: [...context, NO_PART_LINE] }
  let sent: MidSent
  try {
    sent = await send(split.part)
  } catch (error) {
    sent = { sent: false, line: String(error instanceof Error ? error.message : error) }
  }
  if (!sent.sent) return { context: [...context, notSentLine(sent.line)] }
  return { text: split.before, context: [...context, MID_LINE] }
}
