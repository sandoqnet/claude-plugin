// The one switch of the dock's tiles (order D2, still F1). From 70 columns the dock is four picture tiles, each a clear region over a
// picture that takes the pointer and the press. A clear region over a picture takes a press in the app's pane alone: it is NOT SEEN
// in the built pane. So the switch is ONE constant: ON draws the tiles from 70 columns (where the kit gives a picture and a region);
// OFF draws the four word Buttons at every width, which is a flip and not a build. Both states are tested. This file imports nothing.
export const APP_TILES = true

// A test turns the switch for one case and gives `undefined` back to restore the constant.
let held: boolean | undefined
export const tilesOn = (): boolean => held ?? APP_TILES
export function holdTiles(on: boolean | undefined): void {
  held = on
}
