// A clear region over a thing of the picture (order D2, still F1: the dock's words and tiles). It is a Client module of the pane: it takes the
// pointer and posts the press to the register, which opens the place. Over a tile one line stands above the region while the pointer is
// on it: the place, its count in words, and `open` for the lit one (`tipAbove`: the region then starts a row higher and keeps that row for
// the line). `tipShift`, a count of cells at most 0, moves the line to the left so it ends inside the pane. The props are plain data: the
// region's size in cells, the line, the place to post, and two colors made from the wallpaper. The ring and the count chip of the things
// of the wallpaper come with their own still.
export default function Item(props: any, surface: any) {
  const { Box, Text } = surface.elements
  const hot = surface.state?.hot === true
  const lift = props.tipAbove === true ? 1 : 0
  const inside = (e: any) => e.x >= 0 && e.x < props.w && e.y >= lift && e.y < props.h + lift
  surface.onPointer((e: any) => {
    if (e.type === 'down') {
      if (inside(e)) surface.post({ press: props.press })
      return
    }
    const next = e.type !== 'leave' && inside(e)
    if (next !== hot) surface.setState({ hot: next })
  })
  const tip = hot && props.tip !== '' && (
    <Box key="tip" backgroundColor={props.chip} paddingX={1}>
      <Text key="tip-words" color={props.ink}>
        {props.tip}
      </Text>
    </Box>
  )
  return (
    <Box key="item" flexDirection="column" alignItems="flex-start">
      {lift === 1 && (
        <Box key="over" height={1} flexDirection="row" marginLeft={props.tipShift ?? 0}>
          {tip}
        </Box>
      )}
      <Box key="area" width={props.w} height={props.h} />
    </Box>
  )
}
