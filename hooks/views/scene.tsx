import { noteScene } from '../model/draws'
import type { SceneCause } from '../model/draws'
import { sceneAlt, sceneKept, settleSize } from '../model/scene'
import type { Hour } from '../model/scene'

export type SceneProps = {
  // The kit's Svg of this draw.
  Svg: any
  hour: Hour
  waiting: boolean
  doorUp: boolean
  // The picture's size in pixels (see sceneSize).
  width: number
  height: number
  // The canvas layout's window stands (from 80 columns): the window of the picture stands with it.
  windowStands: boolean
  // The time the draw counts its change at, in ms.
  at: number
  // The text of the room's own background (order BG), drawn as the source in place of the pane's own scene; none draws the pane's own.
  // The pane cannot read a color from it, so its letter, door and window stand nowhere on it.
  own?: string
}

// The alt of the room's own background.
export const OWN_ALT = "The room's own background"

// The element the app is handed for the scene (order A-M11). It is made once for its inputs and kept: a draw that changes
// no hour, letter, door or size hands back the very same element, so the host has nothing new to load. The scene is not
// interactive: the app has no hover or script to give it. A change of the element or of its source is counted
// (model/draws.ts).
let kept: { Svg: any; source: string; alt: string; width: number; height: number; element: any } | undefined

// The session starts: the pane opens with no element kept, so its first draw makes one and counts it.
export const forgetScene = (): void => {
  kept = undefined
}

// Why the element was made again, in the order the causes are looked at: another Svg function of the kit, another size (which
// is another source too), another source (the hour, the letter or the door), another alt.
function causeOf(was: NonNullable<typeof kept>, now: { Svg: any; source: string; alt: string; width: number; height: number }): SceneCause {
  if (was.Svg !== now.Svg) return 'svg'
  if (was.width !== now.width || was.height !== now.height) return 'size'
  return was.source !== now.source ? 'source' : 'alt'
}

export function sceneElement({ Svg, hour, waiting, doorUp, at, windowStands, own, ...wanted }: SceneProps) {
  // A size within one cell of the kept one is the kept one (see settleSize).
  const { width, height } = settleSize(kept, wanted)
  const source = own ?? sceneKept({ hour, waiting, doorUp, width, height, windowStands })
  const alt = own === undefined ? sceneAlt(hour, waiting, doorUp) : OWN_ALT
  const now = { Svg, source, alt, width, height }
  if (kept?.Svg === Svg && kept.source === source && kept.alt === alt && kept.width === width && kept.height === height) {
    return kept.element
  }
  const cause: SceneCause = kept === undefined ? 'first' : causeOf(kept, now)
  const element = <Svg key="scene" source={source} alt={alt} width={width} height={height} />
  kept = { ...now, element }
  noteScene(at, cause, width, height)
  return element
}
