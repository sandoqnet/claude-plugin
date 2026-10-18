---
description: End this session as the seat of a joined room, in a session with no pane
allowed-tools: Bash(node:*)
---
!`node "${CLAUDE_PLUGIN_ROOT}/hooks/seatwake.ts" do shut "${CLAUDE_SESSION_ID}"`

The line above is the answer: show it alone, then end your turn. Do nothing else.
