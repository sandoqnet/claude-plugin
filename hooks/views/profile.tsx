import { buildItem, itemLines } from '../model/shelf'
import { momentLine, profileOf } from '../model/profile'
import { isApp } from './glass'
import { LOOK } from './look'
import { SPACE } from './space'
import { THEME, cardProps } from './theme'
import type { ProfileProps } from './types'

export const cardsWord = (count: number): string => `${count} card${count === 1 ? '' : 's'}`

// The profile of one record, in place of the feed, with no frame: the name (bold, the text color) and its
// kind line (quiet), then what it is about, its connections, its moments and, last, the cards that name
// it. A section is a quiet label line, its rows under it and an empty line before the next. A row is in the
// text color, its counts and times quiet at the end, and a row that opens (a connection, a reference) is a
// Button with its name and an arrow in the accent after it; the machine's lines (kind, moments, none, the
// Item facts) are quiet. On the operator face its Item facts (id and class) follow, and with no record open
// that face draws nothing: the shelf above it holds the rows. The back Button is the pane's, not this
// view's. Returns the elements to sit among the children of the view that holds it. `now` is the time the
// ages are said against, Date.now() when none. In an app (a `surface` that draws the place) the whole body is ONE card of the theme, as
// each other place is: the head and each section a part of it, the parts a row apart, the quiet words in the theme's keys, so the
// words and the Buttons stand on the theme's ground and not on the scene. The terminal draws it as it was, with no card.
export function profileView({ ui, surface, plan, columns, face, entry, walks, entries, now = Date.now(), actions }: ProfileProps) {
  const { Box, Text, Button } = ui
  const app = isApp(surface)
  const quiet = app ? THEME.dim : LOOK.quiet
  const accent = app ? THEME.accent : LOOK.accent
  if (entry === undefined) {
    if (face === 'operator') return []
    if (!app) return [<Text key="profile-none" color={LOOK.quiet}>no such record on the shelf</Text>]
    return [
      <Box key="profile-card" {...cardProps(plan?.width, columns)}>
        <Text key="profile-none" color={quiet}>no such record on the shelf</Text>
      </Box>,
    ]
  }
  const view = profileOf(entry, entries, walks, now)
  const firstOf = new Map(view.references.map(reference => [reference.cardId, reference.first] as const))
  const none = (name: string) => <Text key={`${name}-none`} color={quiet}>none</Text>
  const item = face === 'operator' ? itemLines(buildItem(entry, walks)) : []
  // A section: an empty line, its label quiet, then what it holds. In an app the section is a column of its own in the card.
  const section = (name: string, ...children: unknown[]) =>
    app
      ? [
          <Box key={`profile-section-${name}`} flexDirection="column">
            <Text key={`profile-${name}`} color={quiet}>{name}</Text>
            {children}
          </Box>,
        ]
      : [
          <Text key={`profile-gap-${name}`}> </Text>,
          <Text key={`profile-${name}`} color={quiet}>{name}</Text>,
          children,
        ]
  // A row that holds a Button and its words: in an app it wraps when its parts do not fit the card.
  const wrap = app ? ({ flexWrap: 'wrap', rowGap: SPACE.line } as const) : {}
  const head = [
    <Text key="profile-name" bold>{view.name}</Text>,
    <Text key="profile-kind" color={quiet}>{`${view.chi} · on your shelf since ${view.since}`}</Text>,
    view.origin !== '' && <Text key="profile-origin" color={quiet}>{view.origin}</Text>,
  ]
  const body = [
    app ? <Box key="profile-head" flexDirection="column">{head}</Box> : head,
    section(
      'about',
      view.about.length === 0 && none('about'),
      view.about.map((line, i) => (
        <Box key={`about-${i}`} flexDirection="row" {...wrap}>
          <Text>{`${line.text} · ${line.first}`}</Text>
          <Text color={quiet}>{` · ${line.when}`}</Text>
        </Box>
      )),
    ),
    section(
      'connections',
      view.connections.length === 0 && none('connections'),
      view.connections.map(connection => (
        <Box key={`connection-row-${connection.id}`} flexDirection="row" {...wrap}>
          <Button
            key={`connection-${connection.id}`}
            label={connection.name}
            onPress={() => {
              void actions.open({ view: 'profile', recordId: connection.id })
            }}
          />
          <Text color={quiet}>{` · ${connection.kind} · ${cardsWord(connection.cards)}`}</Text>
          <Text color={accent}> ›</Text>
        </Box>
      )),
    ),
    section(
      'moments',
      view.moments.length === 0 && none('moments'),
      view.moments.map((moment, i) => (
        <Text key={`moment-${i}`} color={quiet}>{momentLine(moment, firstOf.get(moment.cardId) ?? '')}</Text>
      )),
    ),
    section(
      'references',
      view.references.length === 0 && none('references'),
      view.references.map(reference => (
        <Box key={`reference-row-${reference.cardId}`} flexDirection="row" {...wrap}>
          <Button
            key={`reference-${reference.cardId}`}
            label={reference.first}
            onPress={() => {
              void actions.open({ view: 'feed', cardId: reference.cardId, lens: 'news' })
            }}
          />
          <Text color={accent}> ›</Text>
        </Box>
      )),
    ),
    ...(item.length === 0
      ? []
      : app
        ? [
            <Box key="profile-section-item" flexDirection="column">
              <Text key="item-head" color={quiet}>Item</Text>
              {item.map((line, i) => <Text key={`item-line-${i}`} color={quiet}>{line}</Text>)}
            </Box>,
          ]
        : [
            <Text key="item-space"> </Text>,
            <Text key="item-head" color={quiet}>Item</Text>,
            item.map((line, i) => <Text key={`item-line-${i}`} color={quiet}>{line}</Text>),
          ]),
  ]
  if (!app) return body
  return [
    <Box key="profile-card" {...cardProps(plan?.width, columns)}>
      {body}
    </Box>,
  ]
}
