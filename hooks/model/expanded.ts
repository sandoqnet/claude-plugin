// What "Show N more" of the operator lens has opened: the rest of a card's events, and the machine lines of the open card, which
// a Button folds. Pure, with no `$`: the register keeps one entry a card, in memory only, and these are its moves. (The discs of the
// Runs card, `N more ›`, are gone: What it plays holds them.)

export type MoreWhat = 'events' | 'machine'
export type Expanded = { events?: boolean; machine?: boolean }
// By the card the lens has open ('' for the lens with no card open).
export type ExpandedByCard = ReadonlyMap<string, Expanded>

// The state after `what` is opened for the card.
export function openMore(state: ExpandedByCard, cardId: string, what: MoreWhat): ExpandedByCard {
  return new Map(state).set(cardId, { ...state.get(cardId), [what]: true })
}

// The state after `what` is opened for the card when it was shut, and shut when it was open (a Button that folds a part).
export function toggleMore(state: ExpandedByCard, cardId: string, what: MoreWhat): ExpandedByCard {
  return new Map(state).set(cardId, { ...state.get(cardId), [what]: state.get(cardId)?.[what] !== true })
}

// The state after the lens moves from the card `before` to the card `after`: what the card it leaves had opened is
// dropped, so a card that is closed and opened again shows its first events.
export function leaveCard(state: ExpandedByCard, before: string, after: string): ExpandedByCard {
  if (before === after || !state.has(before)) return state
  const next = new Map(state)
  next.delete(before)
  return next
}
