import { stripUlid } from '../model/blocks'
import { ROOM_TARGET, answerOf, targetOf, turnsOf } from '../model/turn'
import { isApp } from './glass'
import { LOOK } from './look'
import { THEME, cardProps } from './theme'
import type { Plan } from './theme'
import type { CaptureProps, Ui } from './types'

// The composer's layout (order D1): the column's width and the pane's columns, as the other views of the app take them. With none the
// composer is as wide as its place.
export type ComposerLayout = { plan?: Plan; columns?: number }

// THE KEY LINE of the small terminal (order terminal step 1): under the bar, ONE row of the three places that fit a short pane, each a plain
// Button of its word alone with the key that opens it (the kit draws the keycap): d desk, o door, s shelf. While a place is open a fourth stands
// at its end, b back, so the way back takes no row of its own. The keys are the Buttons' hotkeys (KEY_PLACES and KEY_BACK, which the tests read), so
// a letter typed in the bar's Input stays a letter in the Input (a hotkey is the host's, held while no Input has the typing).
export type KeyPlace = 'desk' | 'door' | 'shelf'
export const KEY_PLACES: { key: string; place: KeyPlace }[] = [
  { key: 'd', place: 'desk' },
  { key: 'o', place: 'door' },
  { key: 's', place: 'shelf' },
]
export const KEY_BACK = 'b'
// The rows of the terminal's bar, the same empty and typed in (order mend terminal real, mend 7): its edge a row each side, the quiet line, and the
// Input's two (its words, and the row the host keeps under them while it holds the focus). The bar Box has this height always, so the rows under it
// never move as the person types.
export const BAR_HEIGHT = 5
export function keyLineView({ ui, onOpen, onBack }: { ui: Ui; onOpen: (place: KeyPlace) => void; onBack?: () => void }) {
  const { Box, Button } = ui
  return (
    <Box key="key-line" flexDirection="row" flexWrap="wrap" columnGap={2}>
      {KEY_PLACES.map(({ key, place }) => (
        <Button key={`key-${place}`} plain hotkey={key} label={place} onPress={() => onOpen(place)} />
      ))}
      {onBack !== undefined && <Button key="back-room" plain hotkey={KEY_BACK} label="back" onPress={onBack} />}
    </Box>
  )
}

// The node's words for the bar when the words go to the room.
const ROOM_PLACEHOLDER = 'write, paste, or drop anything'
// The composer of an app: his kit's placeholder, and the two words of its target Select.
const COMPOSER_PLACEHOLDER = 'Write, paste, or drop anything'
const TO_ROOM = 'To the room'
const TO_CARD = 'To this card'

// The capture bar, the node's: one Box of the bar's border, holding a quiet line that says whom the typed
// words go to, then the Input (the room's placeholder is the node's, its submit an arrow up; the picked
// target of the two is the primary Button). On the feed with an
// open ask in the open card it answers that ask: new or none taps it, the name of exactly one candidate
// taps its record, and any other words send nothing and say the choices by `actions.notice`, when the
// pane has one. On a profile it says about that record. On the feed with no open ask the line is two
// Buttons, the room and the open card, and the words go to the one picked: a new card, or a reply to the
// open card. Anywhere else it says a new card to the room. A target is drawn only when the pane can send
// it: with no `setTarget`, `reply` or `about` the bar falls back to the room. The Input keeps its key
// `say`: the pane draws one bar, so the key is unique in it, and the bar Box is the last child of the
// pane. Returns the elements to sit among the children of the pane.
// In an app (`surface`) the bar is the composer on the theme's ground (views/theme.ts), the pane's own (not a face), as his
// kit draws one, with a hover on its Box to the accent key (the desktop app draws it; the CLI host refuses it): the Input
// with its send, and under it a toolbar of a "+" and a Select of the target, which reads "To this card" while the words go
// to the card (a reply, or the answer of its open ask) and "To the room" otherwise. The words do as above.
export function captureView({ ui, nav, card, target, entries, surface, seatTo = '', actions, plan, columns }: CaptureProps & ComposerLayout) {
  const { Box, Text, Button, Input, Select } = ui
  const { reply, about, setTarget } = actions
  // The words go to a seat (order D1, still A2: "Say to NAME" of a seat's window) when the app can say to one: the Select reads
  // "To NAME", its other option is the room, and a send is the register's say to that seat.
  const saying = isApp(surface) && seatTo !== '' && actions.sayTo !== undefined
  // An ask of a card the harness sent waits on nobody here (order B-M5): the bar does not answer it.
  const turn = nav.view === 'feed' && card && card.walk.source !== 'harness' ? turnsOf(card.raw, undefined, undefined, 0).find(item => item.isOpen) : undefined
  const entry = nav.view === 'profile' && about ? entries?.find(item => item.id === nav.recordId) : undefined
  const name = entry ? stripUlid(entry.name) : ''
  const picking = nav.view === 'feed' && card !== undefined && turn === undefined && setTarget !== undefined && reply !== undefined
  const toCard = picking && target === 'card'
  const asked = targetOf(turn)

  const send = (value: string) => {
    if (saying) return value.trim() === '' ? undefined : actions.sayTo?.(seatTo, value)
    if (entry && about) return about(entry.id, value)
    if (toCard && card && reply) return reply(card.id, value)
    if (turn === undefined || !card) return actions.say(value)
    if (value.trim() === '') return
    const answer = answerOf(value, turn)
    if (answer.kind === 'tap') return actions.tap(card.id, turn.askId, answer.choice)
    actions.notice?.(answer.text)
  }
  const label = saying ? `Say to ${seatTo}` : turn ? 'Answer this card' : entry ? `Say about ${name}` : toCard ? 'Reply to this card' : 'Say to the room'

  if (isApp(surface)) {
    const toWords = saying ? `To ${seatTo}` : turn !== undefined || toCard ? TO_CARD : TO_ROOM
    const options = (saying ? [TO_ROOM, toWords] : picking ? [TO_ROOM, TO_CARD] : [toWords]).map(words => ({ value: words, label: words }))
    return [
      <Box key="composer" {...cardProps(plan?.width, columns)} hover={{ borderColor: THEME.accent }}>
        <Input
          key="say"
          label={label}
          placeholder={saying ? `Say to ${seatTo}` : entry ? `Say about ${name}` : toCard ? 'Reply to this card' : turn ? asked.placeholder : COMPOSER_PLACEHOLDER}
          value=""
          submitLabel="send"
          onSubmit={send}
        />
        <Box key="composer-bar" flexDirection="row" alignItems="center" justifyContent="space-between" columnGap={1}>
          <Box key="composer-tools" flexDirection="row" alignItems="center" columnGap={1}>
            <Button key="composer-more" plain dimColor label="+" onPress={() => {}} />
            {entry ? (
              <Text key={`capture-target-${entry.id}`} color={THEME.dim}>{`to ${name} · this page`}</Text>
            ) : (
              <Select
                key="composer-target"
                value={toWords}
                options={options}
                onSelect={(words: string) => {
                  if (saying) {
                    if (words === TO_ROOM) void actions.setSeatTo?.('')
                    return
                  }
                  if (picking) void setTarget?.(words === TO_CARD ? 'card' : 'room')
                }}
              />
            )}
          </Box>
        </Box>
      </Box>,
    ]
  }

  const line = entry
    ? [<Text key={`capture-target-${entry.id}`} color={LOOK.quiet}>{`to ${name} · this page`}</Text>]
    : picking
      ? [
          <Box key={`capture-target-${card?.id}`} flexDirection="row" columnGap={1}>
            <Button
              key={`target-room-${card?.id}`}
              label={toCard ? 'to the room' : ROOM_TARGET.line}
              variant={toCard ? 'secondary' : 'primary'}
              onPress={() => {
                void setTarget?.('room')
              }}
            />
            <Button
              key={`target-card-${card?.id}`}
              label={toCard ? 'to this card · a reply' : 'to this card'}
              variant={toCard ? 'primary' : 'secondary'}
              onPress={() => {
                void setTarget?.('card')
              }}
            />
          </Box>,
        ]
      : [<Text key={`capture-target-${turn && card ? card.id : 'room'}`} color={LOOK.quiet}>{asked.line}</Text>]

  return [
    <Box key="capture-bar" flexDirection="column" {...LOOK.bar} height={BAR_HEIGHT}>
      {line}
      <Input
        key="say"
        label={label}
        placeholder={entry ? `say about ${name}` : toCard ? 'reply to this card' : turn ? asked.placeholder : ROOM_PLACEHOLDER}
        value=""
        submitLabel="↑"
        onSubmit={send}
      />
    </Box>,
  ]
}
