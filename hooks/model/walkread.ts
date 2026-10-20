// A walk read once for as long as its text stands (order walks-once): its blocks, its reading and the gates of its asks. The poll asks every read of
// the room for every walk, every two seconds; a room of two thousand walks parsed all of them again at each read and held the loop for seconds. The reads
// are kept by the walk's id with the text they were made from: the same text is the same read, a changed text is read again, and `keepWalks` drops the id
// of a walk that is gone. Pure, with no `$`. Run by `node` too: no enums, `import type`, `.ts` in imports.
import { parseBlocks } from './blocks.ts'
import type { Block } from './blocks.ts'
import { gatesOf } from './gate.ts'
import type { Gate } from './gate.ts'
import type { WalkText } from './profile.ts'
import { parseWalk } from './walk.ts'

export type Read = { text: string; blocks: Block[]; read: ReturnType<typeof parseWalk>; gates: Gate[] }

// A bound for a caller that never says which walks stand (a test, a tool): a room has far fewer walks than this.
const MOST_KEPT = 20_000
const reads = new Map<string, Read>()

export function readOf(walk: WalkText): Read {
  const kept = reads.get(walk.id)
  if (kept !== undefined && kept.text === walk.text) return kept
  if (reads.size > MOST_KEPT) reads.clear()
  const made: Read = { text: walk.text, blocks: parseBlocks(walk.text), read: parseWalk(walk.text), gates: gatesOf(walk.text) }
  reads.set(walk.id, made)
  return made
}

// The walks that stand now: the read of an id that is not among them is dropped.
export function keepWalks(walks: readonly WalkText[]): void {
  const standing = new Set(walks.map(walk => walk.id))
  for (const id of [...reads.keys()]) if (!standing.has(id)) reads.delete(id)
}

// How many reads are kept (for the tests).
export const readsKept = (): number => reads.size
