// The Settings place of the app as a short list of its sections (order D1, A2 S3): a row a section, a press box (order DP, P1) with its
// name at the left and its state dim at the right. A press opens ONE section in the canvas, with "‹ Settings" on its strip; from 128
// columns the list stays at the left. Nothing scrolls, and a section is the card it always was. The terminal keeps its column of every
// card. Colors are the theme's.
import { CHOICES, wordOf } from '../model/settings'
import { keysState } from '../model/keys'
import type { KeysCard } from '../model/keys'
import { nudgeState } from '../model/nudge'
import { mailSwitchState } from '../model/mail'
import type { MailSwitchCard } from '../model/mail'
import type { NudgeCard } from '../model/nudge'
import type { SecretsCard } from '../model/secrets'
import { secretsState } from '../model/secrets'
import type { Settings } from '../model/settings'
import { listRowWidth, pressBox, pressPageOf, pressPagerView } from './press'
import { PRESS, cardProps } from './theme'
import type { Plan } from './theme'
import type { Face, Ui } from './types'
import type { VersionsCard } from './versions'

// The sections of Settings, in the order the list draws them. `lens` is the Lens card, `feed` the feed and its lenses, `scene` what sits
// on the wall, `rules` the keeper's rules, `secrets` the names the discs need (a value is set in a terminal, order S2), `versions` the pane
// and the discs it runs (its own line, Update the pane, Check now).
export type SettingsSection = 'lens' | 'feed' | 'scene' | 'rules' | 'secrets' | 'nudge' | 'mail' | 'keys' | 'versions'

export const SECTIONS: { id: SettingsSection; title: string }[] = [
  { id: 'lens', title: 'Lens' },
  { id: 'feed', title: 'The feed and its lenses' },
  { id: 'scene', title: 'On the scene' },
  { id: 'rules', title: "The keeper's rules" },
  { id: 'secrets', title: 'Secrets' },
  { id: 'nudge', title: 'Nudge' },
  { id: 'mail', title: 'Mail' },
  { id: 'keys', title: 'Keys' },
  { id: 'versions', title: 'Versions' },
]

export const sectionTitle = (id: SettingsSection): string => SECTIONS.find(section => section.id === id)?.title ?? ''

// The title of the Settings window: the place's own word, or the section that is open (order DP, P2: the strip says it, not the card).
export const settingsTitle = (section?: SettingsSection): string => (section === undefined ? 'Settings' : sectionTitle(section))

const cap = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)
const lower = (words: string): string => words.charAt(0).toLowerCase() + words.slice(1)
const labelOf = (settings: Settings, key: 'shows' | 'open' | 'scene' | 'hour'): string => CHOICES[key].find(choice => choice.value === wordOf(settings, key))?.label ?? ''

export type StateData = { settings: Settings; face: Face; rules: number; versions?: VersionsCard; secrets?: SecretsCard; nudge?: NudgeCard; mail?: MailSwitchCard; keys?: KeysCard }

// The one dim line of a section's state, from the data the pane holds: '' (no line) when the data holds none.
export function stateOf(id: SettingsSection, { settings, face, rules, versions, secrets, nudge, mail, keys }: StateData): string {
  switch (id) {
    case 'lens':
      return `${cap(face)} is shown`
    case 'feed':
      return `${labelOf(settings, 'shows')}, opens on ${lower(labelOf(settings, 'open'))}`
    case 'scene':
      return settings.scene ? `Scene on, ${lower(labelOf(settings, 'hour'))}` : 'Scene off'
    case 'rules':
      return rules === 0 ? 'No rules yet' : rules === 1 ? '1 rule' : `${rules} rules`
    case 'secrets':
      return secretsState(secrets)
    case 'nudge':
      return nudgeState(nudge)
    case 'mail':
      return mailSwitchState(mail)
    case 'keys':
      return keysState(keys?.read)
    case 'versions':
      return versions === undefined ? '' : `Pane ${versions.pane}, ${versions.discs.length === 1 ? '1 disc' : `${versions.discs.length} discs`}`
  }
}

export type SettingsListProps = {
  ui: Ui
  plan: Plan
  columns: number
  data: StateData
  // The rows the canvas leaves for the list, and the page asked: the list pages by its sections when it is taller (nothing scrolls).
  canvasRows?: number
  page?: number
  // The section whose card stands open beside the list (from 128 columns): its row keeps the open look while its card is open (order DP, P2).
  openSection?: SettingsSection
  actions: { open: (section: SettingsSection) => void | Promise<void>; page?: (list: string, page: number) => void }
}

// The list: one theme card holding a press box a section (views/press.tsx, the one function of the look): the name at the left, its state
// dim at the right with the arrow that says it opens, each box the card's width less 6 and two rows high, a row between two. The card's
// padding is 2 cells, so the rows are as wide as the card holds. A card taller than the canvas shows the sections that fit
// by the one rule (pressPageOf), then the pager, whose Previous and Next are press boxes too.
export function settingsListView({ ui, plan, columns, data, canvasRows, page = 0, openSection, actions }: SettingsListProps) {
  const { Box } = ui
  const row = listRowWidth(plan.width)
  // the title stands on the window's strip (views/strip.tsx), so the card holds the rule's chrome alone
  const shown = pressPageOf(SECTIONS.map(() => 1), canvasRows, page, row, columns)
  return [
    <Box key="settings-list" {...cardProps(plan.width, columns)} paddingX={PRESS.cardPad}>
      <Box key="settings-sections" flexDirection="column" gap={PRESS.between}>
        {SECTIONS.slice(shown.from, shown.to).map(({ id, title }) => {
          const state = stateOf(id, data)
          return pressBox({
            ui,
            id: `section-${id}`,
            label: title,
            width: row,
            ...(state === '' ? {} : { value: state }),
            arrow: true,
            open: id === openSection,
            onPress: () => actions.open(id),
          })
        })}
      </Box>
      {pressPagerView({ ui, list: 'settings', page: shown, inner: row, columns, onPage: n => actions.page?.('settings', n) })}
    </Box>,
  ]
}
