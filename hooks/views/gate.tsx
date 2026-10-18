import { stripUlid } from '../model/blocks'
import { answeredBy, reasonText, ruleWords } from '../model/gate'
import type { Gate } from '../model/gate'
import { isApp } from './glass'
import { LOOK } from './look'
import { SPACE } from './space'
import { THEME, picksProps } from './theme'
import type { Ui } from './types'

export type GateActions = {
  // A pick, or the words he typed, for the ask.
  tap: (cardId: string, askId: string, choice: string) => void | Promise<void>
  // His send of a seat's draft as it was: tap.sh with --draft. None sends the draft as a plain tap.
  tapDraft?: (cardId: string, askId: string, choice: string, draftId: string) => void | Promise<void>
  // "Ask me next time": rule.sh off of the rule a keeper's decision names. None draws no such Button.
  ruleOff?: (ruleId: string) => void | Promise<void>
  // The rule opens on the shelf. None draws the rule's words as Text.
  openRule?: (ruleId: string) => void | Promise<void>
}

// What the pane holds beyond the walk, for the card's gate: its actions, the text of the room shelf's rules.md
// (the words of a rule), and the ids of the rules taken off (the row of such a rule says so from this prop).
export type GateExtras = {
  actions?: Omit<GateActions, 'tap'>
  rulesText?: string
  takenOff?: string[]
}

export type GateProps = {
  ui: Ui
  // The host's surface: an app draws the gate on glass, anything else the terminal's theme keys.
  surface?: string
  cardId: string
  gate: Gate
  actions: GateActions
  rulesText?: string
  takenOff?: boolean
  // A gate that closed, on a card at rest: the answered line alone, not the rows of the open card.
  rest?: boolean
  // A gate that waits, in a place that has its own "Waits for you" title: the question alone, no title of its own.
  bare?: boolean
  // Whether the lean pick holds the hotkey 1 (order D1, fact 5): the pane gives it only while Letters is the open place. With none it holds it.
  leanKey?: boolean
}

export const PLACEHOLDER = 'Or write your answer'
export const TAKEN_OFF = 'Taken off; the keeper asks you next time.'
export const DRAFTED = 'drafted an answer: send it, or change it first.'
const NO_WORDS = 'your rule'

// The picks a gate draws as Buttons: its choices but the seat's draft (that one is the Input's value), each with its place in
// the choices, which its key carries. The rows of a card (card-rows.ts) count the same picks.
export const picksOf = (gate: Gate): { choice: string; i: number }[] => {
  const draft = gate.draft
  return gate.choices
    .map((choice, i) => ({ choice, i }))
    .filter(({ choice }) => draft === undefined || !(choice === draft.choice || stripUlid(choice) === stripUlid(draft.choice)))
}

// The gate of a card in public (order B-P23). An ask that waits: "Waits for you" bold in the text color, then
// the question after a dot in the warn color (`bare`, in a place with its own title: the question alone). With no seat's draft: one Button a choice, in the order of the choices, the room's lean the one
// primary Button with the hotkey 1, the rest plain (secondary in the terminal), then the gate's own Input,
// keyed by its card, "Or write your answer", submit "answer". With a seat's draft (fix of order B-P23): the
// line "SEAT" bold and "drafted an answer: send it, or change it first." dim, the Input holding the draft's
// words as its value with its submit "send" the one primary act (sent as it stands it is tapDraft, changed it
// is a tap of the words), and the other picks, the choices but the draft's, as secondary Buttons on their own
// row under it. An ask that closed, open: rows of a dim label and a text value (Asked, Decided with who
// answered, Door with its why), a row the walk has no value for left out, then, when the keeper answered by a
// rule, the answered line. A card at rest (`rest`) draws the answered line alone: "● answered by the keeper ·
// your rule: WORDS ›", the words a plain Button that opens the rule, italic in the rule color. When the keeper
// answered by a rule, both draw a plain dim "Ask me next time" that becomes the line "Taken off..." once
// `takenOff` is set. The words are the walk's, as they stand.
// In an app every Button is its label alone (order D1: the app paints it by its own theme) and the words are in the theme's
// keys, as on the card of views/theme.ts: the room's lean the one primary Button with the hotkey 1, the other picks secondary.
// In the terminal a Button has a string label, nothing has hover, and the colors are LOOK's theme keys. The CLI host cannot
// draw the app branch. Every key carries the card id and the ask id. Returns the elements to sit among the
// children of the card.
export function gateView({ ui, surface, cardId, gate, actions, rulesText, takenOff = false, rest = false, bare = false, leanKey = true }: GateProps) {
  const { Box, Text, Button, Input } = ui
  const app = isApp(surface)
  const at = `${cardId}-${gate.askId}`
  const dim = app ? THEME.dim : LOOK.quiet
  const ink = {}
  const { decision } = gate

  if (decision === undefined) {
    const draft = gate.draft
    // Why the keeper asked a name (order room-feed, part A): who said the words, the line that holds the name, and what each choice does, dim, from the ask's fence.
    const reasons = gate.reason === undefined ? [] : reasonText(gate.reason)
    const pickView = (choice: string, i: number) => {
      const words = stripUlid(choice)
      const lean = draft === undefined && choice === gate.lean
      const key = `gate-pick-${at}-${i}`
      const onPress = () => {
        void actions.tap(cardId, gate.askId, choice)
      }
      return <Button key={key} label={words} variant={lean ? 'primary' : 'secondary'} {...(lean && leanKey ? { hotkey: '1' } : {})} onPress={onPress} />
    }
    const picks = picksOf(gate)
    const input = (
      <Input
        key={`gate-input-${at}`}
        label="Answer"
        placeholder={PLACEHOLDER}
        value={draft === undefined ? '' : stripUlid(draft.choice)}
        submitLabel={draft === undefined ? 'answer' : 'send'}
        onSubmit={(value: string) => {
          const text = value.trim()
          if (text === '') return
          if (draft !== undefined && actions.tapDraft && text === stripUlid(draft.choice)) void actions.tapDraft(cardId, gate.askId, draft.choice, draft.id)
          else void actions.tap(cardId, gate.askId, text)
        }}
      />
    )
    return [
      <Box key={`gate-${at}`} flexDirection="column" {...(app ? { gap: SPACE.line } : {})}>
        <Box key={`gate-ask-${at}`} flexDirection="row" flexWrap="wrap" columnGap={1}>
          {!bare && (
            <Text bold {...ink}>
              Waits for you
            </Text>
          )}
          <Text color={app ? THEME.warn : LOOK.warn}>{bare ? gate.question : `· ${gate.question}`}</Text>
        </Box>
        {reasons.length > 0 && (
          <Box key={`gate-reason-${at}`} flexDirection="column">
            {reasons.map((line, i) => (
              <Text key={`gate-reason-${at}-${i}`} color={dim} {...(app ? { wrap: 'wrap' } : {})}>
                {line}
              </Text>
            ))}
          </Box>
        )}
        {draft === undefined && (
          <Box key={`gate-picks-${at}`} {...(app ? picksProps : { flexDirection: 'row', flexWrap: 'wrap', columnGap: 2 })}>
            {picks.map(({ choice, i }) => pickView(choice, i))}
          </Box>
        )}
        {draft !== undefined && (
          <Box key={`gate-draft-${at}`} flexDirection="row" flexWrap="wrap" columnGap={1}>
            <Text bold {...ink}>
              {draft.by}
            </Text>
            <Text color={dim}>{DRAFTED}</Text>
          </Box>
        )}
        {input}
        {draft !== undefined && picks.length > 0 && (
          <Box key={`gate-others-${at}`} {...(app ? picksProps : { flexDirection: 'row', flexWrap: 'wrap', columnGap: 2 })} justifyContent="flex-end">
            {picks.map(({ choice, i }) => pickView(choice, i))}
          </Box>
        )}
      </Box>,
    ]
  }

  const by = answeredBy(decision)
  const rule = decision.rule
  const words = rule === undefined ? '' : (ruleWords(rule, decision.quotes, rulesText) ?? NO_WORDS)
  const open = rule === undefined ? undefined : actions.openRule
  const ruleValue =
    rule === undefined
      ? undefined
      : open === undefined
        ? app
          ? (
              <Text key={`rule-${at}`} italic wrap="wrap">
                {`${words} ›`}
              </Text>
            )
          : (
              <Text>{`${words} ›`}</Text>
            )
        : app
          ? (
              <Button
                key={`rule-${at}`}
                plain
                label={`${words} ›`}
                onPress={() => {
                  void open(rule)
                }}
              />
            )
          : (
              <Button
                key={`rule-${at}`}
                label={words}
                onPress={() => {
                  void open(rule)
                }}
              />
            )
  const off = actions.ruleOff
  const askAgain =
    decision.by !== 'keeper' || rule === undefined
      ? undefined
      : takenOff
        ? (
            <Text key={`rule-off-${at}`} color={dim}>
              {TAKEN_OFF}
            </Text>
          )
        : off === undefined
          ? undefined
          : app
            ? (
                <Button
                  key={`rule-off-${at}`}
                  plain
                  dimColor
                  label="Ask me next time"
                  onPress={() => {
                    void off(rule)
                  }}
                />
              )
            : (
                <Button
                  key={`rule-off-${at}`}
                  label="Ask me next time"
                  variant="secondary"
                  onPress={() => {
                    void off(rule)
                  }}
                />
              )

  // The answered line: the keeper's rule is named in it; a decision he made himself says who alone.
  const named = decision.by === 'keeper' && ruleValue !== undefined
  const line =
    by === '' && !named ? undefined : (
      <Box key={`gate-rest-${at}`} flexDirection="column">
        <Box key={`gate-answered-${at}`} flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={1}>
          <Text color={app ? THEME.ok : LOOK.ok}>●</Text>
          <Text color={dim}>{named && by !== '' ? `${by} · your rule:` : by !== '' ? by : 'your rule:'}</Text>
          {named && ruleValue}
        </Box>
        {askAgain}
      </Box>
    )
  if (rest) return line === undefined ? [] : [line]

  const door = decision.door === undefined ? '' : decision.door === 'in' ? 'let in' : 'left out'
  const rows: [string, string][] = [
    ['Asked', gate.question],
    ['Decided', [decision.choice, by].filter(part => part !== '').join(' · ')],
    ['Door', [door, decision.why ?? ''].filter(part => part !== '').join(' · ')],
  ]
  const row = (label: string, value: any, key: string) => (
    <Box key={`gate-row-${key}-${at}`} flexDirection="row" columnGap={app ? 2 : 1}>
      <Box width={app ? 10 : 8}>
        <Text color={dim}>{label}</Text>
      </Box>
      {value}
    </Box>
  )
  return [
    <Box key={`gate-closed-${at}`} flexDirection="column">
      {rows.filter(([, value]) => value !== '').map(([label, value]) => row(label, <Text {...ink} {...(app ? { wrap: 'wrap' } : {})}>{value}</Text>, label.toLowerCase()))}
      {named && line}
    </Box>,
  ]
}
