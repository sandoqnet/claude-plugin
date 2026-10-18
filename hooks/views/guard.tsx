import { VERSION } from '../host'
import { firstLine, noteFailure } from '../model/draws'
import { GLASS, isApp } from './glass'
import { LOOK } from './look'
import { paneView } from './pane'
import type { PlaceProps } from './pane'
import type { Ui } from './types'

// The guard of the pane (order A-M13): a pane is never blank. A draw that throws is caught where the render is called. The
// pane is then drawn on Public, on this seat's face, with one quiet line that names the lens that failed and the error's first
// line; when Public throws too, one plain block says the errors and the version. Each failure is kept (model/draws.ts) for a
// tool to return, and the line names what threw: the guard does not hide it.
const cap = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

// "Operator failed: TypeError: x is not a function", with the nav's view when it is not the feed or a seat's face.
export const failureLine = (lens: string, view: string, error: unknown): string =>
  `${cap(lens)}${view === '' ? '' : ` (${view})`} failed: ${firstLine(error)}`

// The block that stands when Public threw too: the errors and the version, no more. It uses the kit's own Box and Text alone.
export function plainBlock({ ui, surface, lines }: { ui: Pick<Ui, 'Box' | 'Text'>; surface?: string; lines: string[] }) {
  const { Box, Text } = ui
  const color = isApp(surface) ? GLASS.dim : LOOK.quiet
  return (
    <Box key="pane-failed" flexDirection="column">
      <Text key="pane-failed-title" bold>
        {`Room pane ${VERSION} could not draw.`}
      </Text>
      {lines.map((line, i) => (
        <Text key={`pane-failed-${i}`} color={color}>
          {line}
        </Text>
      ))}
    </Box>
  )
}

// The nav's view when it is not the feed or a seat's face: the place that was open ('settings', 'shelf', 'room', 'profile').
const viewOf = (props: PlaceProps): string => (props.nav.view === 'feed' || props.nav.view === 'seat' ? '' : props.nav.view)

// The draw the guard watches: the pane's own, or the one a test fixes through setDraw to make a view throw.
let drawing: (props: PlaceProps) => any = paneView
export function setDraw(draw?: (props: PlaceProps) => any) {
  drawing = draw ?? paneView
}

// A test set a draw of its own, so a failure kept is on purpose (the fake room fails a test that keeps one with none set).
export const drawIsSet = (): boolean => drawing !== paneView

// `at` is the time the failure is kept at, in ms.
export function guardedPane(props: PlaceProps, draw = drawing, at = props.drawnAt ?? props.now) {
  try {
    return draw(props)
  } catch (error) {
    const first = failureLine(props.face, viewOf(props), error)
    try {
      const tree = draw({ ...props, face: 'public', nav: { view: 'seat', name: '' }, failure: first })
      noteFailure({ lens: props.face, view: viewOf(props), error: firstLine(error), at, plain: false })
      return tree
    } catch (again) {
      const second = failureLine('public', '', again)
      noteFailure({ lens: props.face, view: viewOf(props), error: `${firstLine(error)} | ${second}`, at, plain: true })
      return plainBlock({ ui: props.ui, surface: props.surface, lines: [first, second] })
    }
  }
}
