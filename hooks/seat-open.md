---
description: Sit this folder as the seat of a joined room, in a session with no pane
argument-hint: ROOM [SEAT]
allowed-tools: Bash(node:*)
---
```!
node "${CLAUDE_PLUGIN_ROOT}/hooks/seatwake.ts" do - <<'SEAT_WORDS_END'
open $ARGUMENTS
SEAT_WORDS_END
```

The line above is the answer: show it alone, then end your turn. Do nothing else, and poll
nothing. If it says the folder is seated, follow the rules of the skill sandoq-seat.

Use this only in a session with no `/sandoq` pane command. In the desktop app the pane's
`/sandoq open ROOM SEAT` is the road.
