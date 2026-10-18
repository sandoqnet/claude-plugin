// The one switch of the app's hotkeys (order D1, A2 S5). In the app's pane a Button's hotkey drew its keycap and did NOT press, and a
// drawn key that does nothing is worse than none. So in 0.8.1 the app's place gives no Button a hotkey: not Back, not Close, not a gate's
// lean, not the places of the dock; Tab and Enter are the key way. The switch is turned on when a press is proven in the app. The
// terminal keeps its keys as before and never reads this file. This file imports nothing.
export const APP_HOTKEYS = false

// A test turns the switch for one case and gives `undefined` back to restore the constant.
let held: boolean | undefined
export const hotkeysOn = (): boolean => held ?? APP_HOTKEYS
export function holdHotkeys(on: boolean | undefined): void {
  held = on
}

// The props of a Button of the app's place that holds `key`: none while the switch is off.
export const hotkeyProps = (key: string): { hotkey?: string } => (hotkeysOn() ? { hotkey: key } : {})
