// A game of Ur as the pane reads it, DIRECT from the game's walk (order UR, cut U1): walks/ur/GAME.md of the run folder. Pure: no host, no view,
// and it imports nothing but the block reader and the walk's reader of a card. Run by `node` too: no enums, `import type`, `.ts` in imports.
// Nothing here throws; a key the walk does not hold is left empty, never made up.
//
// The blocks it reads, by their form (N,K) and taxonomy (from the game's code):
//   (21,2) ur::turn::ask    an ask of the game: fence game, turn, side, player, choices, and on a move ask roll (0 to 4) and dice (four 0 or 1).
//                           A roll ask has the one choice `roll`, a move ask FROM-TO such as 0-3 and 13-15. HIS ask has no `to` key; a
//                           seat's ask has `to` NAME and is side them. It is open while no decided block stands under it. Its words are
//                           escaped by percent (percent, slash, braces, a leading at sign).
//   (13,3) .. decided       under the ask: the move that stood, the fence key `choice` whole.
//   (3,2)  walk::door::fault under the ask, its words `tap ask ASK CHOICE: WHY`: a tap the door could not take.
//   (144,3) ur::move::board the game as it stands, the NEWEST: fence you and them (seven squares each: 0 waiting, 1 to 14 on the path, 15
//                           off; NOT sorted), turn (you, them, or a dash after a win), by (ur, you, policy, jev, or seat NAME), roll and dice
//                           (none on the first board), captured and pass (true or absent, never false), won (a dash, you or them).
// HIS side is always `you`: the sayer of ur new is the first player, the rival (jev or a seat) always `them`.
import { blockWords, fenceText, idOf, parentOf, parseBlocks } from './blocks.ts'
import type { Block } from './blocks.ts'
import { parseWalk } from './walk.ts'

// A game's id and an ask's id are ULIDs: letters and digits, so neither can name a folder or be read as a flag.
export const isUrId = (value: unknown): value is string => typeof value === 'string' && /^[0-9A-Za-z]{20,}$/.test(value)

// The game's file under the run folder, `walks/ur/GAME.md`; none for an id of another shape.
export const urWalkFile = (game: string): string => (isUrId(game) ? `walks/ur/${game}.md` : '')

export type Ask = {
  id: string
  game: string
  turn: string
  side: string
  player: string
  // The ask's own words (the question of the turn).
  words: string
  choices: string[]
  // The roll and the dice of a move ask, as words; '' for an ask that is no move.
  roll: string
  dice: string
  // Who the ask is put to: '' for HIS ask, else the seat's name.
  to: string
}

export type Board = {
  you: number[]
  them: number[]
  turn: string
  by: string
  roll: string
  dice: string
  captured: boolean
  pass: boolean
  won: string
}

// A tap the door could not take: the choice and the WHY of the fault block.
export type Fault = { ask: string; choice: string; why: string }

// The move that stood under the ask: the choice's words and who decided.
export type Stood = { ask: string; choice: string; by: string }

export type Game = {
  // The newest ask of the walk, open or not; none when the walk holds none.
  ask?: Ask
  // The ask is open: no decided block stands under it.
  open: boolean
  // The open ask is HIS: it has no `to` key and its side is not `them` (his side is always `you`). A walk with no open ask is no one's turn here.
  his: boolean
  // The move that stood under the newest ask.
  stood?: Stood
  // The newest tap fault under the OPEN ask.
  fault?: Fault
  board?: Board
}

const textOf = (value: unknown): string => (value === undefined || value === null ? '' : Array.isArray(value) ? value.map(String).join(' ') : String(value))
// The words of a term are escaped by percent: percent, slash, braces and a leading at sign.
const ESCAPES: Record<string, string> = { '%25': '%', '%2F': '/', '%7B': '{', '%7D': '}', '%40': '@' }
const unescaped = (words: string): string => words.replace(/%(?:25|2F|7B|7D|40)/gi, hit => ESCAPES[hit.toUpperCase()])
// A dash is nobody (the turn after a win, the winner of a game that goes on).
const somebody = (value: string): string => (value === '-' ? '' : value)
const flagOf = (value: unknown): boolean => value === true || (typeof value === 'string' && value !== '' && value !== 'false' && value !== '0') || (typeof value === 'number' && value !== 0)
const squaresOf = (value: unknown): number[] => (Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [])

const isForm = (block: Block, lead: number, close: number, chi: string, che: string, cho: string): boolean =>
  block.lead === lead && block.close === close && block.chi === chi && block.che === che && block.cho === cho

function askOf(block: Block): Ask {
  const choices = block.fence.choices
  return {
    id: idOf(block),
    game: fenceText(block, 'game'),
    turn: fenceText(block, 'turn'),
    side: fenceText(block, 'side'),
    player: fenceText(block, 'player'),
    words: unescaped(blockWords(block.words)),
    choices: Array.isArray(choices) ? choices.map(String) : [],
    roll: textOf(block.fence.roll),
    dice: textOf(block.fence.dice),
    to: fenceText(block, 'to'),
  }
}

function boardOf(block: Block): Board {
  const fence = block.fence
  return {
    you: squaresOf(fence.you),
    them: squaresOf(fence.them),
    turn: somebody(fenceText(block, 'turn')),
    by: somebody(fenceText(block, 'by')),
    roll: textOf(fence.roll),
    dice: textOf(fence.dice),
    captured: flagOf(fence.captured),
    pass: flagOf(fence.pass),
    won: somebody(fenceText(block, 'won')),
  }
}

// `tap ask ASK CHOICE: WHY`, the words of a fault the door wrote for a tap it could not take. A fault of another kind is none.
const TAP_FAULT = /^tap ask (\S+) (.*?): (.*)$/
function faultOf(block: Block): Fault | undefined {
  const hit = TAP_FAULT.exec(unescaped(blockWords(block.words)))
  return hit === null ? undefined : { ask: hit[1], choice: hit[2], why: hit[3].trim() }
}

// The game as a walk file's text says it.
export function readGame(text: string | undefined): Game {
  const blocks = parseBlocks(text ?? '')
  const askBlock = blocks.filter(block => isForm(block, 21, 2, 'ur', 'turn', 'ask')).at(-1)
  const boardBlock = blocks.filter(block => isForm(block, 144, 3, 'ur', 'move', 'board')).at(-1)
  const board = boardBlock === undefined ? undefined : boardOf(boardBlock)
  if (askBlock === undefined) return { open: false, his: false, ...(board === undefined ? {} : { board }) }
  const ask = askOf(askBlock)
  const under = blocks.filter(block => parentOf(block) === ask.id)
  const decided = under.find(block => block.cho === 'decided')
  const open = decided === undefined
  const game: Game = { ask, open, his: open && ask.to === '' && ask.side !== 'them' }
  if (decided !== undefined) game.stood = { ask: ask.id, choice: fenceText(decided, 'choice'), by: fenceText(decided, 'by') }
  if (open) {
    const faults = under.filter(block => block.lead === 3 && block.close === 2 && block.cho === 'fault').map(faultOf)
    const fault = faults.filter((one): one is Fault => one !== undefined).at(-1)
    if (fault !== undefined) game.fault = fault
  }
  if (board !== undefined) game.board = board
  return game
}

// A move of the game, read from two boards that follow each other (order UR, cut U3): who moved, the roll, whether it passed or captured, and
// the squares the mover's piece left and reached (0 waits, 15 is off) when the two boards say them. The first board, set before any roll, is no move.
export type Move = { by: string; roll: string; pass: boolean; captured: boolean; from?: number; to?: number }

// The squares of `now` that `was` did not hold, and the squares of `was` that `now` does not hold, as a multiset (a square may hold two pieces at 0 and 15).
function leftAndReached(was: number[], now: number[]): { left: number[]; reached: number[] } {
  const rest = [...was]
  const reached: number[] = []
  for (const square of now) {
    const at = rest.indexOf(square)
    if (at >= 0) rest.splice(at, 1)
    else reached.push(square)
  }
  return { left: rest, reached }
}

// The moves of the game, NEWEST first: each board after the first that names a mover, set against the board before it. HIS side is `you`; the
// rival, whoever it is (policy, jev, a seat), is `them`. A pass has no squares; a board that does not differ in the mover's side has none.
export function movesOf(text: string | undefined): Move[] {
  const boards = parseBlocks(text ?? '')
    .filter(block => isForm(block, 144, 3, 'ur', 'move', 'board'))
    .map(boardOf)
  const moves: Move[] = []
  boards.forEach((board, i) => {
    if (i === 0 || board.by === '' || board.by === 'ur') return
    const move: Move = { by: board.by, roll: board.roll, pass: board.pass, captured: board.captured }
    if (!board.pass) {
      const side = board.by === 'you' ? 'you' : 'them'
      const { left, reached } = leftAndReached(boards[i - 1][side], board[side])
      if (left.length === 1 && reached.length === 1) {
        move.from = left[0]
        move.to = reached[0]
      }
    }
    moves.push(move)
  })
  return moves.reverse()
}

// The move the NEWEST board makes (order MOTION): the mover's side, the square its piece left and the one it reached (0 waits, 15 is off), and the
// step of the other side's piece it took, which goes back to wait. None when the newest board is the first, is the game's own, passes, ends the game,
// or does not differ by one piece in the mover's side: the picture then draws with no motion. It is a function of the text alone, so the same text
// is the same motion, and a draw that changes no word changes no picture.
export type Motion = { side: 'you' | 'them'; from: number; to: number; taken?: number }

export function motionOf(text: string | undefined): Motion | undefined {
  const boards = parseBlocks(text ?? '')
    .filter(block => isForm(block, 144, 3, 'ur', 'move', 'board'))
    .map(boardOf)
  const now = boards.at(-1)
  const was = boards.at(-2)
  if (now === undefined || was === undefined || now.by === '' || now.by === 'ur' || now.pass || now.won !== '') return undefined
  const side = now.by === 'you' ? 'you' : 'them'
  const mine = leftAndReached(was[side], now[side])
  if (mine.left.length !== 1 || mine.reached.length !== 1) return undefined
  const motion: Motion = { side, from: mine.left[0], to: mine.reached[0] }
  if (now.captured) {
    const other = side === 'you' ? 'them' : 'you'
    const theirs = leftAndReached(was[other], now[other])
    if (theirs.left.length === 1 && theirs.reached.length === 1 && theirs.reached[0] === 0 && theirs.left[0] >= 1 && theirs.left[0] <= 14) motion.taken = theirs.left[0]
  }
  return motion
}

// A move as one row: "You rolled 3: moved 4 to 7.", "They rolled 2: passed.", "You rolled 1: entered on 1, captured a piece.", "You bore off from 14."
export function moveLine(move: Move): string {
  const rolled = move.roll === '' ? '' : ` rolled ${move.roll}:`
  const did = move.pass
    ? 'passed'
    : move.from === undefined || move.to === undefined
      ? 'moved'
      : move.to === 15
        ? `bore off from ${move.from}`
        : move.from === 0
          ? `entered on ${move.to}`
          : `moved ${move.from} to ${move.to}`
  return `${whoWords(move.by)}${rolled} ${did}${move.captured ? ', captured a piece' : ''}.`
}

// The game of a handed card, ONE place that says it: the fence key `game` of the NEWEST frame of the term ur under the card's route (the walk's
// own reading of the frame, parseWalk), whose file is walks/ur/GAME.md. A frame with no game key (a refusal before a game), a key that is no id,
// a card not handed to ur and a card with no frame have no game: '' and no window. Never the card's own id.
export function urGameOf(raw: string): string {
  const walk = parseWalk(raw)
  if (walk.handedTo !== 'ur') return ''
  const game = walk.frame.find(([key]) => key === 'game')?.[1] ?? ''
  return isUrId(game) ? game : ''
}

// The choices a press may send: HIS open ask whose id is an id, each choice a word with a body. The game is the card's (urGameOf), never the ask's key.
export const tappable = (game: Game): boolean =>
  game.his && game.ask !== undefined && isUrId(game.ask.id) && game.ask.choices.some(choice => choice.trim() !== '')

const count = (squares: number[], at: number): number => squares.filter(square => square === at).length

// One side as one row: "You: 3 waiting; on the path 4, 9; 2 off". A part that is none is left out; seven pieces stand in all.
export function sideRow(label: string, squares: number[]): string {
  const path = squares.filter(square => square >= 1 && square <= 14).sort((a, b) => a - b)
  const parts = [`${count(squares, 0)} waiting`]
  if (path.length > 0) parts.push(`on the path ${path.join(', ')}`)
  parts.push(`${count(squares, 15)} off`)
  return `${label}: ${parts.join('; ')}`
}

// Who a word of the board names: HE is `you`, the game itself `ur`, the rival `them`, `policy` and `jev` as they are, a seat as `seat NAME`.
const capital = (words: string): string => `${words.charAt(0).toUpperCase()}${words.slice(1)}`
const whoWords = (name: string): string =>
  name === 'you' ? 'You' : name === 'them' ? 'They' : name === 'ur' ? 'The game' : name === 'policy' ? 'The policy' : capital(name.replace(/^seat /, ''))

// The board as text rows, HIS side (`you`) first: his pieces, theirs, the last move and who won, when the board says them. The first board, set by
// the game before any roll, says the board is set.
export function boardRows(board: Board): string[] {
  const rows = [sideRow('You', board.you), sideRow('Them', board.them)]
  if (board.by !== '') {
    const rolled = board.roll === '' ? '' : `rolled ${board.roll}${board.dice === '' ? '' : ` (dice ${board.dice})`}`
    const did = board.pass ? 'passed' : board.captured ? 'captured a piece' : ''
    const words = [rolled, did].filter(part => part !== '').join(' and ')
    rows.push(board.by === 'ur' && words === '' ? 'The board is set.' : `${whoWords(board.by)} ${words === '' ? 'moved' : words}.`)
  }
  if (board.won !== '') rows.push(`${whoWords(board.won)} won.`)
  return rows
}

// A line of the ask's roll for HIS move: "Your roll: 3 (dice 1 1 1 0)"; '' when the ask holds no roll.
export const rollLine = (ask: Ask): string => (ask.roll === '' ? '' : `Your roll: ${ask.roll}${ask.dice === '' ? '' : ` (dice ${ask.dice})`}`)

// An ask that is not his is the turn of whom it names (the seat it is put to, else its player, as the board names a mover), capitalised: no buttons.
export const turnLine = (ask: Ask): string => `${ask.to !== '' ? whoWords(ask.to) : ask.player !== '' ? whoWords(ask.player) : 'Their'}${ask.to !== '' || ask.player !== '' ? "'s" : ''} turn.`

// The one line a tap's exit says (order UR, 5): 0 the tap is written; 2 a bad word, the one line tap.sh printed on stderr; 1 the inbox could
// not be written; any other code, the tap is written and the roll was not woken. The line holds no path of the machine.
const MOST = 100
const oneLine = (err: string): string => {
  const line = (err.split('\n').find(row => row.trim() !== '') ?? '').trim().replace(/\/[\w.+-]*(?:\/[\w.+-]+)+/g, 'a path')
  return line.length > MOST ? `${line.slice(0, MOST - 1).trimEnd()}…` : line
}
export function tapLine(code: number, err: string, choice: string): string {
  if (code === 0) return `Sent: ${choice}.`
  if (code === 2) return oneLine(err) === '' ? 'The tap was refused.' : oneLine(err)
  if (code === 1) return 'The tap could not be written to the inbox.'
  return `The tap is written; the roll was not woken (exit ${code}).`
}

// A fault under the open ask as one line with its WHY: "The door did not take pass: no such choice".
export const faultLine = (fault: Fault): string => oneLine(`The door did not take ${fault.choice}: ${fault.why}`)

// The move that stood, one line.
export const stoodLine = (stood: Stood): string => (stood.choice === '' ? 'A move stood.' : `Played: ${stood.choice}.`)
