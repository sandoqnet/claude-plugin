import { turnsOf } from '../model/turn'
import type { Pick } from '../model/turn'
import { LOOK } from './look'
import { cardsWord } from './profile'
import type { TurnProps } from './types'

// The turn of a card, an ask at a time. An open ask is the node's ASKS box: a round Box with its label
// ASKS and the age (quiet, the machine's voice), the room's question (bold), the hint (quiet), the keeper
// line (quiet, italic), then one row a candidate: the Button with its name, the line that tells two of a
// name apart and the cards it has (quiet), and an arrow in the accent; then "+ a new NAME" and "none" as
// plain Buttons. A press taps. A decided ask draws nothing on the public face, where the card's asked
// line holds it, and on the operator face the question, the rows (the chosen one in the text color marked
// "this one", the others struck and quiet), who decided, and the keeper's pick and late calls, all quiet
// but the chosen row's names. Every key carries the card id and the ask id, for the host wants a key
// unique in the whole pane. Returns the elements to sit among the children of the card. `now` is the time
// the ages are said against, Date.now() when none.
export function turnView({ ui, face, card, entries, walks, now = Date.now(), actions }: TurnProps) {
  const { Box, Text, Button } = ui
  const rowText = (pick: Pick): string => `${pick.name} · ${pick.line} · ${cardsWord(pick.cards)}`
  return turnsOf(card.raw, entries, walks, now).flatMap(turn => {
    const at = `${card.id}-${turn.askId}`
    if (!turn.isOpen) {
      if (face !== 'operator') return []
      return [
        <Text key={`turn-asked-${at}`} color={LOOK.quiet}>{`the room asked · ${turn.question}`}</Text>,
        turn.picks.map((pick, i) =>
          pick.chosen ? (
            <Box key={`turn-row-${at}-${i}`} flexDirection="row">
              <Text>{rowText(pick)}</Text>
              <Text color={LOOK.quiet}> · this one</Text>
            </Box>
          ) : (
            <Text key={`turn-row-${at}-${i}`} color={LOOK.quiet} strikethrough>
              {`${rowText(pick)} · not this one`}
            </Text>
          ),
        ),
        turn.outcome !== '' && <Text key={`turn-took-${at}`} color={LOOK.quiet}>{`took: ${turn.outcome}`}</Text>,
        <Text key={`turn-by-${at}`} color={LOOK.quiet}>{`decided by ${turn.by}`}</Text>,
        turn.keeperChose !== '' && <Text key={`turn-keeper-${at}`} color={LOOK.quiet}>{turn.keeperChose}</Text>,
        turn.late.map((line, i) => <Text key={`turn-late-${at}-${i}`} color={LOOK.quiet}>{line}</Text>),
      ]
    }
    const tap = (choice: string) => () => {
      void actions.tap(card.id, turn.askId, choice)
    }
    return [
      <Box key={`turn-box-${at}`} flexDirection="column" {...LOOK.frame}>
        <Text key={`turn-head-${at}`} color={LOOK.quiet}>{turn.age === '' ? 'ASKS' : `ASKS · ${turn.age}`}</Text>
        <Text key={`turn-question-${at}`} bold>{turn.question}</Text>
        <Text key={`turn-hint-${at}`} color={LOOK.quiet}>{turn.hint}</Text>
        {turn.keeperAsked && <Text key={`turn-keeper-${at}`} color={LOOK.quiet} italic>the keeper is asked</Text>}
        {turn.picks.map((pick, i) => (
          // A Button takes no color: the name is the Button, the rest of the row is Text.
          <Box key={`turn-pick-${at}-${i}`} flexDirection="row">
            <Button key={`pick-${at}-${i}`} label={pick.name} onPress={tap(pick.choice)} />
            <Text color={LOOK.quiet}>{` · ${pick.line} · ${cardsWord(pick.cards)}`}</Text>
            <Text color={LOOK.accent}> ›</Text>
          </Box>
        ))}
        {turn.extras.map(choice => (
          <Button key={`tap-${at}-${choice}`} label={choice} onPress={tap(choice)} />
        ))}
        <Button key={`tap-${at}-new`} label={turn.words === '' ? '+ a new one' : `+ a new ${turn.words}`} onPress={tap('new')} />
        <Button key={`tap-${at}-none`} label="none" onPress={tap('none')} />
      </Box>,
    ]
  })
}
