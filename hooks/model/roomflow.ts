// THE ROOM FLOW (order PF2, Ardalan's Pane flows): the words and the rule of a room made from the pane in steps: a name, a confirmation, the call, and the landing.
// Pure: it reads nothing and runs nothing. The call itself is `sandoq room new NAME --json` (register.tsx), made as before, in the session's folder, by process run.
import { ROOM_NAME_FALLBACK } from './roomstart.ts'

// THE ONE NAME RULE: the rule `sandoq room new` takes (sandoq.py ROOM_NAME, `[A-Za-z0-9_][A-Za-z0-9_-]*`, matched whole): letters, digits, hyphens and underscores,
// never a hyphen first, no space, no slash, one word. The hint and the check below are this one rule; roomNameOf (roomstart.ts) makes a folder's name fit it.
export const ROOM_NAME_RULE = /^[A-Za-z0-9_][A-Za-z0-9_-]*$/
export const NAME_HINT = 'letters, digits, hyphens and underscores; never a hyphen first; one word'

// The line a name that does not fit says (the hint under the Input says the rule); '' for a name that fits.
export const nameFault = (name: string): string => {
  if (name === '') return 'A room needs a name.'
  if (ROOM_NAME_RULE.test(name)) return ''
  return `${name.length > 40 ? `${name.slice(0, 39)}…` : name} is no room's name.`
}

// The name offered in the Input when the name step opens: the one typed before and kept, else the folder's name.
export const offeredName = (typed: string | undefined, folderName: string): string => (typed === undefined || typed === '' ? folderName : typed)

// What the pane may say of the room it was asked to make, by the name step's words and rows.
export const NAME_TITLE = 'Name the room'
export const NAME_INTRO = "The name the rooms and the panel will show. The folder's name is offered."
export const NAME_LABEL = 'Room name'
export const NAME_NEXT = 'Next'
export const NAME_CANCEL = 'Cancel'
export const joinsLine = 'joins: the rooms of this machine'

// The confirm step: what the one call does, as sandoq.py says it. The mark is written in the folder (`.sandoq/room.md`) and the room is put in the machine's list of
// rooms (rooms.md of the config folder: the frame said nothing outside the folder changes, and that is not true); the door is started by the same call where the machine
// can start one, and the pane finds the room at its next read.
export const confirmTitle = (name: string): string => `Make ${name}?`
export const confirmIntro = (where: string): string => `One call, sandoq room new, in ${where}. It will:`
export const WILL = ['write .sandoq/room.md', 'list it on this machine', 'start its door, if it can', 'open this pane in it']
export const CONFIRM_FOOT = "A refusal shows sandoq's line, with the press again."
export const CONFIRM_BACK = 'Back'
export const CONFIRM_GO = 'Make the room'

// The making step: a step is done only where the pane KNOWS it is done. While the call is out the pane knows nothing of it but that it runs (the call is one process run,
// its out read when it ends), so no step after the first is shown done; when the call ended well its objects say the mark was written and whether the door started; the room is
// opened in the pane when the read after the call finds it. `✓` done, `●` the one the pane waits on, `○` not known to be done.
export type MakeStep = { mark: '✓' | '●' | '○'; words: string }
export type MakeKnown = { ended: boolean; door: 'up' | 'none' | 'unknown' }
export const makeSteps = (known: MakeKnown, where: string): MakeStep[] =>
  known.ended
    ? [
        { mark: '✓', words: "the mark is written, and the room is in this machine's list" },
        known.door === 'up' ? { mark: '✓', words: 'the door starts' } : { mark: '○', words: 'the door did not start: the call did not say it did' },
        { mark: '●', words: 'the pane opens in the room' },
      ]
    : [
        { mark: '●', words: `sandoq room new runs in ${where}` },
        { mark: '○', words: 'the mark is written' },
        { mark: '○', words: 'the door starts' },
        { mark: '○', words: 'the pane opens in the room' },
      ]
export const MAKING_FOOT = 'The pane waits for the call; a session start forgets a call that gave nothing.'

// The landing: the room was found after the call. `door` is what the call said of the door: up (started, or standing), or none (made, and nothing said of a door).
export type Born = { name: string; door: 'up' | 'none' }
export const bornTitle = (name: string): string => `${name || ROOM_NAME_FALLBACK} is born`
export const bornDoor = (door: Born['door']): string => (door === 'up' ? 'Its door is up.' : 'Its door is not up yet: Start the door starts it.')
export const START_HERE = 'Start here'
export const BORN_DISC = 'Put a disc on ›'
export const BORN_OK = 'OK'
