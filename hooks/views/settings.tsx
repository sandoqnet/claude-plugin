import type { SecretRow, SecretsCard } from '../model/secrets'
import { CHOICES, GROUPS, groupOf, valueOfWord, wordOf } from '../model/settings'
import type { SettingKey, Settings } from '../model/settings'
import type { RuleToday } from '../model/shelfplace'
import { isApp } from './glass'
import { LOOK } from './look'
import { SPACE } from './space'
import { THEME, cardProps, cellsOf, fitted, innerOf, picksProps } from './theme'
import type { Plan } from './theme'
import type { Ui } from './types'

// The note of the keeper's rules group, the same words in an app and in the terminal.
const RULES_TITLE = "The keeper's rules"
const RULES_NOTE = 'Your words; the keeper answers by them.'

export type SettingsActions = {
  // A setting changed to a value; it applies at once.
  onChange: (key: SettingKey, value: Settings[SettingKey]) => void | Promise<void>
  // The last change undone.
  onUndo: () => void
  // A rule opens to change or remove, and "Add a rule ›" starts a new one. The pane wires them (the shelf place's
  // acts of the same names); with none a press does nothing.
  openRule?: (ruleId: string) => void | Promise<void>
  addRule?: () => void | Promise<void>
}

export type SettingsProps = {
  ui: Ui
  // The host's surface: an app draws the groups on glass, anything else the terminal's column.
  surface?: string
  // The width of the layer the cards stand in, in cells (the pane's layerWidth): every card of an app takes it, the
  // keeper's rules too. With none, and in the terminal, a card is as wide as it was.
  width?: number
  // The layout of the column (order D1) and the pane's columns: the plan's width wins over `width`, and the columns set the
  // side padding of a card. With none a card is as it was.
  plan?: Plan
  columns?: number
  settings: Settings
  // The plain words of the last change ("Date and clock on, bottom right."), and the key it changed (the
  // group of it holds the line and Undo); none is no line. With a line and no key the scene group holds it.
  lastLine?: string
  lastKey?: SettingKey
  // His rules that stand, each with its note and its count today (rulesToday of hooks/model/shelfplace.ts). With
  // none given the rules group is not drawn; an empty list draws the note and "Add a rule ›" alone.
  rules?: RuleToday[]
  actions: SettingsActions
}

// A setting with more choices than this is a Select in the app; with this many or fewer its choices are picks.
export const PICKS_MOST = 5

// The Settings place (orders B-P7, B-S3): the cards under the head, which is the pane's and is not drawn here. One
// card a group, a row a setting: the feed and its lenses first (Shows, On open, Operator, Trace), then what sits on
// the wall and the hour it shows, then the keeper's rules. A change applies at once and there is no Save: under
// the card that changed last stands the plain words of the change and a plain Undo. The rules card holds each rule
// of rules.md, its words as a plain Button with an arrow (it opens the rule), its note dim under it and
// "N today" dim at the right, then "Add a rule ›". The pictures are not drawn here (they wait on the dither), and
// no empty card stands for them. In an app (desktop, vscode, mobile) a card is the one card of views/theme.ts, on the
// theme's ground: the title bold and the line dim, and each setting a dim label over its picks: the chosen pick is the
// app's own Button, the others plain and dim (a pick of several is no Select; a Select stays where the choices are
// many, over PICKS_MOST). Every Button is its label alone. In the terminal the same rows are a column in the theme keys:
// the options of a row are string-labeled Buttons, the one held primary, with no hover and no glass color. This host
// (the CLI) cannot draw the app branch. Returns the elements to sit among the children of the pane.
export function settingsView(props: SettingsProps) {
  const { groups, rules } = settingsParts(props)
  return rules === undefined ? [groups.lenses, groups.scene] : [groups.lenses, groups.scene, rules]
}

// The same cards, each as an element of its own (order D1, A2 S3): the app's Settings is a list of its sections and opens ONE, so a
// section is drawn alone. `rules` is none when no rules were given. No word and no control of a card is different from settingsView's.
export function settingsParts({ ui, surface, width: given, plan, columns, settings, lastLine, lastKey, rules, actions }: SettingsProps) {
  const { Box, Text, Button, Select } = ui
  const app = isApp(surface)
  const width = plan?.width ?? given
  const inner = innerOf(width, columns)
  const lastGroup = lastLine ? groupOf(lastKey ?? 'date') : undefined
  const pick = (key: SettingKey) => (word: string) => {
    const value = valueOfWord(key, word)
    if (value !== undefined) void actions.onChange(key, value)
  }

  // The rows of a group in an app: a dim label over its picks (or its Select where the choices are many).
  const settingRows = (rows: (typeof GROUPS)[number]['rows']) =>
    rows.map(row => (
      <Box key={`row-${row.key}`} flexDirection="column">
        <Text color={THEME.dim}>{row.label}</Text>
        {CHOICES[row.key].length > PICKS_MOST ? (
          <Select key={`select-${row.key}`} value={wordOf(settings, row.key)} options={CHOICES[row.key]} onSelect={pick(row.key)} />
        ) : (
          <Box key={`picks-${row.key}`} {...picksProps}>
            {CHOICES[row.key].map(choice => {
              const key = `option-${row.key}-${choice.value.replace(' ', '-')}`
              const onPress = () => pick(row.key)(choice.value)
              return wordOf(settings, row.key) === choice.value ? (
                <Button key={key} label={choice.label} onPress={onPress} />
              ) : (
                <Button key={key} plain dimColor label={choice.label} onPress={onPress} />
              )
            })}
          </Box>
        )}
      </Box>
    ))

  const groups = GROUPS.map(group => {
    const foot = group.id === lastGroup
    if (app) {
      return (
        <Box key={`settings-${group.id}`} {...cardProps(width, columns)}>
          <Box key={`settings-head-${group.id}`} flexDirection="column">
            <Text bold>{group.title}</Text>
            <Text color={THEME.dim} wrap="wrap">
              {group.line}
            </Text>
          </Box>
          {/* a setting is a part of the card, the card's gap the rows' own, so the pane cuts the card between two settings and not after a pair; the pane reads the hour row of the scene by its key */}
          {settingRows(group.rows)}
          {foot && (
            <Box key={`last-${group.id}`} flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={SPACE.control} rowGap={SPACE.line}>
              <Text color={THEME.dim} wrap="wrap">
                {lastLine}
              </Text>
              <Button key="settings-undo" plain dimColor label="Undo" onPress={() => actions.onUndo()} />
            </Box>
          )}
        </Box>
      )
    }
    return (
      <Box key={`settings-${group.id}`} flexDirection="column" {...LOOK.section}>
        <Text bold>{group.title}</Text>
        <Text color={LOOK.quiet}>{group.line}</Text>
        {group.rows.map(row => (
          <Box key={`row-${row.key}`} flexDirection="row" flexWrap="wrap" columnGap={1}>
            <Text color={LOOK.quiet}>{row.label}</Text>
            {CHOICES[row.key].map(choice => (
              <Button
                key={`option-${row.key}-${choice.value.replace(' ', '-')}`}
                label={choice.label}
                variant={wordOf(settings, row.key) === choice.value ? 'primary' : 'secondary'}
                onPress={() => pick(row.key)(choice.value)}
              />
            ))}
          </Box>
        ))}
        {foot && (
          <Box key={`last-${group.id}`} flexDirection="row" columnGap={1}>
            <Text color={LOOK.quiet}>{lastLine}</Text>
            <Button key="settings-undo" label="Undo" variant="secondary" onPress={() => actions.onUndo()} />
          </Box>
        )}
      </Box>
    )
  })
  const byId = { lenses: groups[GROUPS.findIndex(group => group.id === 'lenses')], scene: groups[GROUPS.findIndex(group => group.id === 'scene')] }
  if (rules === undefined) return { groups: byId, rules: undefined }

  const open = (id: string) => () => {
    void actions.openRule?.(id)
  }
  const add = () => {
    void actions.addRule?.()
  }
  // One rule: its words (a Button of its label alone, with an arrow) and "N today" at the right, its note dim under them. In
  // an app a Button does not wrap, so the words are cut at their end with an ellipsis to the cells that "N today" leaves.
  const ruleRow = (rule: RuleToday) =>
    app ? (
      <Box key={`rule-${rule.id}`} flexDirection="column">
        <Box key={`rule-line-${rule.id}`} flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
          <Button
            key={`rule-open-${rule.id}`}
            plain
            label={fitted(`${rule.words} ›`, Math.max(2, inner - cellsOf(`${rule.today} today`) - SPACE.control))}
            onPress={open(rule.id)}
          />
          <Box key={`rule-today-${rule.id}`} flexShrink={0}>
            <Text color={THEME.dim}>{`${rule.today} today`}</Text>
          </Box>
        </Box>
        {rule.note !== '' && (
          <Text color={THEME.dim} wrap="wrap">
            {rule.note}
          </Text>
        )}
      </Box>
    ) : (
      <Box key={`rule-${rule.id}`} flexDirection="column">
        <Box key={`rule-line-${rule.id}`} flexDirection="row" justifyContent="space-between" columnGap={2}>
          <Button key={`rule-open-${rule.id}`} label={`${rule.words} ›`} onPress={open(rule.id)} />
          <Text color={LOOK.quiet}>{`${rule.today} today`}</Text>
        </Box>
        {rule.note !== '' && <Text color={LOOK.quiet}>{rule.note}</Text>}
      </Box>
    )
  const addRule = app ? (
    <Button key="settings-add-rule" plain label="Add a rule ›" onPress={add} />
  ) : (
    <Button key="settings-add-rule" label="Add a rule ›" onPress={add} />
  )
  const card = app ? (
    <Box key="settings-rules" {...cardProps(width, columns)}>
      <Box key="head-rules" flexDirection="column">
        <Text bold>{RULES_TITLE}</Text>
        <Text color={THEME.dim} wrap="wrap">
          {RULES_NOTE}
        </Text>
      </Box>
      <Box key="rows-rules" flexDirection="column">
        {rules.map(ruleRow)}
        {addRule}
      </Box>
    </Box>
  ) : (
    <Box key="settings-rules" flexDirection="column" {...LOOK.section}>
      <Text bold>{RULES_TITLE}</Text>
      <Text color={LOOK.quiet}>{RULES_NOTE}</Text>
      {rules.map(ruleRow)}
      {addRule}
    </Box>
  )
  return { groups: byId, rules: card }
}

const SECRETS_TITLE = 'Secrets'
const SECRETS_NOTE = 'The names your discs need. Set a value in a terminal or in the sandoq control panel.'
const SECRETS_NONE = 'No secret is declared or set.'
const SECRETS_READING = 'Reading…'
// The note over the line of a pressed name: the pane takes no value, so the line is the thing to copy into a terminal.
const LINE_NOTE = 'In a terminal, run:'

export type SecretsActions = {
  // "Show the names ›": the list is read (the section of the app reads it when it opens; the terminal's column, which has no section, on this press).
  read: () => void
  // A press on a name: the line that sets it shows under the row, or hides when it shows.
  show: (name: string) => void
}

export type SecretsProps = {
  ui: Ui
  surface?: string
  width?: number
  plan?: Plan
  columns?: number
  card: SecretsCard
  actions: SecretsActions
}

// The Secrets section (order S2): one row a name from `sandoq secret list` (the name with an arrow, `set` or `not set` at the right, its discs dim
// under it); a press on a name shows under the row the line that sets it, `sandoq secret set NAME` with the real name, to copy, in the app and in
// the terminal alike. The pane has no field and no Set: a value is typed in a terminal, never here. A read that failed is one line under the head.
export function secretsView({ ui, surface, width: given, plan, columns, card, actions }: SecretsProps) {
  const { Box, Text, Button } = ui
  const app = isApp(surface)
  const width = plan?.width ?? given
  const inner = innerOf(width, columns)
  const quiet = app ? THEME.dim : LOOK.quiet
  const word = (row: SecretRow) => (row.where === '' ? 'not set' : 'set')

  const lineOf = (name: string) => (
    <Box key={`secret-shown-${name}`} flexDirection="column">
      <Text key={`secret-note-${name}`} color={quiet} wrap="wrap">
        {LINE_NOTE}
      </Text>
      <Text key={`secret-line-set-${name}`} color={quiet} wrap="wrap">
        {`sandoq secret set ${name}`}
      </Text>
    </Box>
  )

  const rowOf = (row: SecretRow) => {
    const state = word(row)
    const press = () => actions.show(row.name)
    return (
      <Box key={`secret-${row.name}`} flexDirection="column">
        {app ? (
          <Box key={`secret-line-${row.name}`} flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
            <Button key={`secret-open-${row.name}`} plain label={fitted(`${row.name} ›`, Math.max(2, inner - cellsOf(state) - SPACE.control))} onPress={press} />
            <Box key={`secret-state-${row.name}`} flexShrink={0}>
              <Text color={THEME.dim}>{state}</Text>
            </Box>
          </Box>
        ) : (
          <Box key={`secret-line-${row.name}`} flexDirection="row" justifyContent="space-between" columnGap={SPACE.control}>
            <Button key={`secret-open-${row.name}`} label={`${row.name} ›`} onPress={press} />
            <Text color={LOOK.quiet}>{state}</Text>
          </Box>
        )}
        <Text color={quiet} wrap="wrap">
          {row.discs}
        </Text>
        {card.open === row.name && lineOf(row.name)}
      </Box>
    )
  }

  const empty = card.state === 'done' && card.line === '' && card.rows.length === 0
  // before any read: a Button asks for it (Settings opens no process by itself)
  const unread = card.state === 'rest' && card.cannot === ''
  const body = [
    unread &&
      (app ? (
        <Button key="secrets-read" plain label="Show the names ›" onPress={() => actions.read()} />
      ) : (
        <Button key="secrets-read" label="Show the names ›" onPress={() => actions.read()} />
      )),
    card.cannot !== '' && (
      <Text key="secrets-cannot" color={quiet} wrap="wrap">
        {card.cannot}
      </Text>
    ),
    card.state === 'reading' && card.rows.length === 0 && (
      <Text key="secrets-reading" color={quiet}>
        {SECRETS_READING}
      </Text>
    ),
    card.line !== '' && (
      <Text key="secrets-line" color={quiet} wrap="wrap">
        {card.line}
      </Text>
    ),
    empty && (
      <Text key="secrets-none" color={quiet}>
        {SECRETS_NONE}
      </Text>
    ),
    ...card.rows.map(rowOf),
  ]
  return app ? (
    <Box key="settings-secrets" {...cardProps(width, columns)}>
      <Box key="head-secrets" flexDirection="column">
        <Text bold>{SECRETS_TITLE}</Text>
        <Text color={THEME.dim} wrap="wrap">
          {SECRETS_NOTE}
        </Text>
      </Box>
      {/* each name is a part of the card, as a setting is: the pane cuts the card between two names */}
      {body}
    </Box>
  ) : (
    <Box key="settings-secrets" flexDirection="column" {...LOOK.section}>
      <Text bold>{SECRETS_TITLE}</Text>
      <Text color={LOOK.quiet}>{SECRETS_NOTE}</Text>
      {body}
    </Box>
  )
}
