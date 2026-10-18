import { parseBlocks, stripUlid } from '../model/blocks'
import { LENSES } from '../model/feed'
import { fill, pickLayout } from '../model/layouts'
import type { Piece } from '../model/layouts'
import { lineFor } from '../model/profile'
import { readingOf, touchedOf } from '../model/reading'
import { isApp } from './glass'
import { LOOK } from './look'
import { THEME } from './theme'
import type { SlotProps } from './types'
import { urPlayView } from './ur'

const OPEN_ASK = 'the room reads the card once you answer'
const READING = 'the room is reading'
export const FAILED = 'The room could not answer this one.'
// The line of a card the room handed to a program's gate: "Handed to ur."
export const handedLine = (instance: string): string => `Handed to ${instance}.`
// A closed card shows this many lines of its answer, then "more".
const CUT = 3

// The slot of a card, the node's egress box: a round Box labelled with the layout's kind in capitals
// (quiet), the sentence drawn piece by piece (the fixed words quiet, a person a Button with its name and
// an accent arrow, a document accent and underlined, a thing bold), the answer after an empty line, and, on
// the open card, the lens switch at its foot. The border is the accent on the open card, inactive on the
// others. The records the card touched sit under the box as words that open their profile. Its reading
// state is its own: a card with an open ask or no route yet draws that quiet line alone. With `brief` (a
// closed card) the answer is cut at 3 lines with a "more" Button that opens the card, no records and no lens
// switch, and a held card draws nothing. The layouts are `roomFiles` (the room's own, then
// the discs'), none until they are read, and then the fixed fallback. `lens` is the shown lens, and with `isOpen` it draws the switch.
// With `surface` an app, the card of the us face on glass holds the slot: it is the sentence alone, its
// pieces and its states in the glass colors (hex, never a theme key), with no box, kind, answer, records or
// switch. A card the room handed to a program ("Handed to ur.", order B-P8) says so in one quiet line under the
// sentence, in the box in the terminal and under the sentence on glass. Its answer is the newest frame the game wrote
// under the route; the operator face shows the frame's board keys, one quiet line each, under the answer, the public face none.
// Returns the elements to sit among the children of the card.
export function slotView({ ui, face, card, entries, walks, roomFiles = {}, brief = false, lens, isOpen = false, surface, actions }: SlotProps) {
  const { Box, Text, Button, Markdown } = ui
  const walk = card.walk
  const glass = isApp(surface)
  const quiet = glass ? THEME.dim : LOOK.quiet
  const accent = glass ? THEME.accent : LOOK.accent
  // The words' own color: none, the theme's own text in an app and the host's in the terminal.
  const ink = {}
  // The host wants each key unique in the whole drawn pane, and the pane draws a slot a card: every key
  // carries the card id.
  const at = card.id
  const hasRoute = parseBlocks(card.raw).some(block => block.cho === 'route')
  // A card the harness sent waits on nobody in Public (order B-M5): its ask is the operator face's alone.
  if (walk.waiting && (walk.source !== 'harness' || face === 'operator')) return [<Text key={`slot-state-${at}`} color={quiet}>{OPEN_ASK}</Text>]
  if (!hasRoute) return [<Text key={`slot-state-${at}`} color={quiet}>{READING}</Text>]

  const reading = readingOf(card.raw, entries)
  const picked = pickLayout(reading, roomFiles)
  const isHeld = reading.act === 'held'
  if (brief && isHeld) return []
  const touched = touchedOf(card.raw, entries)
  const answer = face !== 'operator' && walk.answer.startsWith('failed:') ? FAILED : walk.answer
  const open = (recordId: string) => {
    void actions.open({ view: 'profile', recordId })
  }
  // What tells a person from another of the name: the newest line of its profile, else "person"; none when
  // the name is the only one of its kind.
  const lineOf = (id: string, name: string): string => {
    const same = entries.filter(entry => stripUlid(entry.name).toLowerCase() === name.toLowerCase())
    if (same.length < 2) return ''
    const entry = entries.find(item => item.id === id)
    return entry && walks ? lineFor(entry, walks) || 'person' : 'person'
  }
  const pieceView = (piece: Piece, i: number) => {
    const key = `piece-${at}-${i}`
    if (piece.type === 'text') return <Text key={key} color={quiet}>{piece.words}</Text>
    if (piece.type === 'gap') return <Text key={key} color={quiet}>{`[${piece.role}]`}</Text>
    if (piece.type === 'said') return <Text key={key} {...ink}>{piece.words}</Text>
    if (piece.type === 'person') {
      const line = lineOf(piece.id, piece.name)
      // A Button takes no color and no weight in the terminal: the name is the Button, the line that tells
      // two of a name apart is quiet, and the arrow that says it opens is the accent. In an app (order D1: the app
      // draws a Button by its label alone) the person is a plain Button of the name, its line quiet and no arrow.
      if (glass) {
        return (
          <Box key={`${key}-person`} flexDirection="row">
            <Button key={key} plain label={piece.name} onPress={() => open(piece.id)} />
            {line !== '' && <Text color={quiet}>{` · ${line}`}</Text>}
          </Box>
        )
      }
      return (
        <Box key={`${key}-person`} flexDirection="row">
          <Button key={key} label={piece.name} onPress={() => open(piece.id)} />
          {line !== '' && <Text color={quiet}>{` · ${line}`}</Text>}
          <Text color={accent}> ›</Text>
        </Box>
      )
    }
    if (piece.type === 'document') {
      return <Text key={key} color={accent} underline>{piece.name}</Text>
    }
    return <Text key={key} bold {...ink}>{piece.name}</Text>
  }
  // A card the room handed to a program says so, one line under the sentence.
  const handed = walk.handedTo !== '' && (
    <Text key={`slot-handed-${at}`} color={quiet}>
      {handedLine(walk.handedTo)}
    </Text>
  )
  if (glass) {
    return [
      <Box key={`slot-sentence-${at}`} flexDirection="row" flexWrap="wrap">
        {fill(picked.layout, reading).map(pieceView)}
      </Box>,
      handed,
      ...(isOpen && !brief && walk.handedTo === 'ur' ? urPlayView({ ui, card, surface, actions }) : []),
    ]
  }
  const lines = answer.trimEnd().split('\n')
  const isCut = brief && lines.length > CUT
  const shown = isCut ? lines.slice(0, CUT).join('\n') : answer
  return [
    <Box key={`slot-box-${at}`} flexDirection="column" {...(isOpen ? LOOK.open : LOOK.frame)}>
      <Text key={`slot-kind-${at}`} color={LOOK.quiet}>{picked.layout.kind.toUpperCase()}</Text>
      {face === 'operator' &&
        picked.faults.map((fault, i) => (
          <Text key={`slot-fault-${at}-${i}`} color={LOOK.quiet}>{`${fault.source} layout ${fault.name}: ${fault.error}`}</Text>
        ))}
      <Box key={`slot-sentence-${at}`} flexDirection="row" flexWrap="wrap">
        {fill(picked.layout, reading).map(pieceView)}
      </Box>
      {handed}
      {isOpen && !brief && walk.handedTo === 'ur' && urPlayView({ ui, card, surface, actions })}
      {!isHeld && answer !== '' && (
        <Box key={`slot-answer-${at}`} marginTop={1}>
          <Markdown text={shown} />
        </Box>
      )}
      {face === 'operator' &&
        !isHeld &&
        walk.frame.map(([key, value], i) => (
          <Text key={`slot-frame-${at}-${i}`} color={LOOK.quiet}>{`${key}: ${value}`}</Text>
        ))}
      {brief && !isHeld && answer === '' && <Text key={`slot-state-${at}`} color={LOOK.quiet}>{READING}</Text>}
      {isCut && (
        <Button
          key={`more-${at}`}
          label="⌄ more"
          onPress={() => {
            void actions.open({ view: 'feed', cardId: card.id, lens: 'news' })
          }}
        />
      )}
      {isOpen && !brief && lens !== undefined && (
        <Box key={`slot-lens-${at}`} flexDirection="row" columnGap={1} marginTop={1}>
          {LENSES.map(name => (
            <Button
              key={`lens-${name}`}
              label={name}
              variant={lens === name ? 'primary' : 'secondary'}
              onPress={() => {
                void actions.setLens(card.id, name)
              }}
            />
          ))}
        </Box>
      )}
    </Box>,
    !isHeld && !brief && touched.length > 0 && (
      <Box key={`slot-shelf-${at}`} flexDirection="row" flexWrap="wrap" columnGap={2}>
        {touched.map(record => (
          <Box key={`touched-${at}-${record.id}-row`} flexDirection="row">
            <Button key={`touched-${at}-${record.id}`} label={record.name} onPress={() => open(record.id)} />
            <Text color={LOOK.accent}> ›</Text>
          </Box>
        ))}
      </Box>
    ),
  ]
}
