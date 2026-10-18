// What the pane counts of itself since it opened (order A-M11): how many times it was drawn (each call of the render) and how
// many times the scene's element or its source changed, each with the time of the last. The foot of the Operator lens says the
// two counts beside the version, and a tool of the pane may return the whole later. Pure: state in memory, no host.

export type Drawn = { draws: number; scene: number; drawAt: number; sceneAt: number; cause: string; size: string }

const none = (): Drawn => ({ draws: 0, scene: 0, drawAt: 0, sceneAt: 0, cause: '', size: '' })
let drawn: Drawn = none()

// The pane opened: the counts start again, and the last failure is forgotten.
export const resetDrawn = (): void => {
  drawn = none()
  failed = undefined
}

// One call of the render, at the time `at` (ms).
export const noteDraw = (at: number): void => {
  drawn = { ...drawn, draws: drawn.draws + 1, drawAt: at }
}

// The cause of a change of the scene, in one word: first (the pane's first picture), svg (the kit gave another Svg function),
// size, source (the hour, the letter or the door) or alt.
export type SceneCause = 'first' | 'svg' | 'size' | 'source' | 'alt'

// The scene's element or its source changed, at the time `at` (ms), for `cause`, at the size in pixels the new picture has.
export const noteScene = (at: number, cause: SceneCause | '' = '', width = 0, height = 0): void => {
  drawn = { ...drawn, scene: drawn.scene + 1, sceneAt: at, cause, size: width > 0 ? `${width}x${height}` : '' }
}

// The counts as they stand, a copy.
export const drawnNow = (): Drawn => ({ ...drawn })

// The last draw that threw (order A-M13), kept beside the counts for a tool to return: the lens and the view that failed,
// the error's text, when, how many times since the pane opened, and whether the Public fallback threw too.
export type Failed = { lens: string; view: string; error: string; at: number; count: number; plain: boolean }

let failed: Failed | undefined

// One draw threw. `plain` is true when the draw of Public threw as well and the pane drew its plain block.
export const noteFailure = (failure: Omit<Failed, 'count'>): void => {
  failed = { ...failure, count: (failed?.count ?? 0) + 1 }
}

// The last failure as it stands, a copy, or none.
export const failedNow = (): Failed | undefined => (failed === undefined ? undefined : { ...failed })

// A path of this machine in a line is never said: the file's name stands, after the dots, and the folder goes. A path is two
// names or more after a slash, at the start of the line or after any mark that is not part of a name: a space, a bracket, a
// quote, an equals sign, a colon. A name is any letter but a slash, a space and a quote (an accented letter is one). A folder
// that holds a space goes whole: words after a space belong to a folder's name when a slash follows them at once and they hold
// no mark of a sentence (a colon, an equals sign, a comma, a bracket); the file's name ends at the first space.
const PATH = /(^|[^\p{L}\p{M}\p{N}_.@+~/-])~?(?:\/[^/\s"'`]+(?: [^/\s"'`:=,;()[\]<>{}]+)*(?=\/))+\/[^/\s"'`]+/gu
export const scrub = (line: string): string =>
  line.replace(PATH, (whole, before: string) => `${before}…/${whole.slice(before.length).split('/').pop()}`)

// The first line of an error, as the quiet line and the plain block say it: "TypeError: x is not a function". A file error
// names its file and not its folder (order A-M12): no machine path is drawn, kept or returned.
export const firstLine = (error: unknown): string => {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return scrub(text.split('\n')[0] ?? '').slice(0, 200)
}

// The words of the foot, after the version: "draws 12 · scene 3 (size 840x494)": the cause of the last change of the scene and
// the size it had, once the scene has changed with a cause.
export const drawnWords = (counts: Drawn): string =>
  `draws ${counts.draws} · scene ${counts.scene}${counts.cause === '' ? '' : ` (${counts.cause} ${counts.size})`}`
