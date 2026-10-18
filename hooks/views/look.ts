// The pane's look: the host's theme keys, so the pane follows the person's Claude Code theme,
// light or dark, with no switch of its own. A view takes its colors and borders from here alone.
export const LOOK = {
  frame: { borderStyle: 'round', borderColor: 'inactive', paddingX: 1 },
  open: { borderStyle: 'round', borderColor: 'suggestion', paddingX: 1 },
  section: { borderStyle: 'round', borderColor: 'inactive', paddingX: 1 },
  bar: { borderStyle: 'round', borderColor: 'promptBorder', paddingX: 1 },
  accent: 'suggestion',
  ok: 'success',
  warn: 'warning',
  fault: 'error',
  quiet: 'subtle',
} as const
