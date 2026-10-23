# Load room-pane 0.8.82 (checked on Claude Code v2.1.290)

## What it needs

- Claude Code, in the desktop app or in a terminal. Both read the same plugin settings. It was
  checked on v2.1.290. The least version is not known: an older one may install and not draw.
- node 22.18 or newer. The three bridge hooks run `node hook.ts`, a .ts file that node runs alone,
  and node does that with no flag from 22.18. Checked here on node 24.12.0.
- python3, any 3.x. Checked here on 3.13.7. The pane asks it whether the room's door answers, and
  the room's own programs (`card.py`) use it. Without python3 the pane looks for the door by its
  command line instead.
- A room: a folder with a `room.sh` and its run folder beside it, or any folder that
  `sandoq room new` marked (see "A room in any folder").
- For a marked room, the `sandoq` program, which the pane runs for each say, tap and start.

Plugins are not available in WSL sessions.

## Install from GitHub

The pane is a Claude Code plugin in a marketplace named `sandoq`. The marketplace is the GitHub
repository `sandoqnet/claude-plugin`. Each release of the pane has a tag `pane-vX.Y.Z`, where
X.Y.Z is the pane's version, the one `/plugin` shows after the install.

0. An older plugin named `sandoq` may stand in an older marketplace named `sandoq`, added from a
   folder. It has the same id as this pane, `sandoq@sandoq`. Its hook takes each prompt that starts
   with `/sandoq`, sends the words after it as a say, and blocks the prompt, so `/sandoq` never
   opens the pane. To see it: `claude plugin marketplace list` shows `sandoq` with a folder as its
   source. Remove that marketplace: `claude plugin marketplace remove sandoq`. Then quit the
   desktop app and open it again. When `sandoq` comes from GitHub, nothing old stands: skip this
   step, and never run `claude plugin uninstall sandoq@sandoq`, for that is this pane.
1. In a terminal run `claude plugin marketplace add sandoqnet/claude-plugin#pane-v0.8.82`. For
   another release, say its tag: `pane-v` and the version.
2. Run `claude plugin install sandoq@sandoq`. It may say that three user config options are not
   yet set. All three are optional, and each is right when left empty:
   - `bridge`: on makes each message you send a card and gives the session the room's reading;
     empty is on, and off turns the hooks off.
   - `gate`: the room's instance a card lands on; empty reads it from `room.sh` or from the mark.
   - `sandoq`: the path of the `sandoq` program; empty looks on the PATH, then under the sandoq
     home.
3. Quit the desktop app and open it again. In the Code tab, "+ > Plugins > Manage plugins" lists
   sandoq.
4. Once, in a terminal, in the folder of the room, type `sandoq play room` (or `sandoq room new` for a
   room in any folder). It makes the run folder.
5. In the desktop app open a session in that folder. A session that was open before the restart
   does not know the plugin.
6. Type `/sandoq`.

For a developer, a second way loads the folder of the plugin with no marketplace. In a terminal,
for one session: `claude --plugin-dir ~/path/to/room-pane`. For every session, add to
`~/.claude/settings.json` under `env`: `"env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/path/to/room-pane" }`.
Give the path absolute or start it with `~`; Claude Code skips relative paths (v2.1.280 and newer).
Restart Claude Code and start a new session. The docs do not say that the desktop app honors `env`
in `settings.json`. If `/sandoq` is no command after that, use the marketplace.

## Update

In the desktop app, Settings holds the card Versions, a table: its first line is the pane's own, then
each disc of the room, with the version here, the version there and a state. "Check now" reads the
states. A line has the Button "Update" where an update waits, and the pane's line has it while its
state is not known: that Button runs `sandoq pane update`. When it ends, open a new session to load
it: the app needs no restart.

1. In a terminal run `sandoq update`, or by hand `claude plugin marketplace update sandoq` and then
   `claude plugin update sandoq@sandoq`. With the developer way, replace the folder named in
   `CLAUDE_CODE_PLUGIN_DIRS`.
2. Open a new session. After an update `/sandoq` is no command in a session that began before it.
3. Check the version with `/plugin` (Installed tab): it is 0.8.82. The Operator lens says it too, at
   its foot: "pane 0.8.82 · draws N · scene N".

An install of 0.8.81 takes no update while the number is the same, so the number moved to 0.8.82.

## Renew a pane that stands

An older pane may stand in the marketplace `sandoq`. To add the marketplace again and install
again does not renew it: a second install leaves a pane that stands as it is. Update it as above.
When the marketplace was added from another source, such as a folder, take it out and add it again
from GitHub. A pane that stands under its old name `room-pane` is another plugin than `sandoq`:
run `claude plugin marketplace update sandoq`, then `claude plugin uninstall room-pane@sandoq`
and then `claude plugin install sandoq@sandoq`.

1. Look at the source: `claude plugin marketplace list` shows where `sandoq` comes from.
2. When the source is the GitHub repository: run `claude plugin marketplace update sandoq`, then
   `claude plugin update sandoq@sandoq`, then open a new session.
3. When the source is another one, such as a folder: run `claude plugin marketplace remove sandoq`,
   then do the install steps from the top (step 0 says what the folder one may hold), then open a
   new session.
4. Check: `/plugin` says 0.8.82, and the Operator lens says "pane 0.8.82" at its foot.

Claude keeps the options `bridge`, `gate` and `sandoq` by plugin id, so a move loses the ones you
set by hand: set them again after the move. A pane that you turned off stays off.

## A room in any folder

A room needs no install folder. Any folder can hold one.

1. In a terminal, in that folder, run `sandoq room new` once. It marks the folder with
   `.sandoq/room.md`; the room's run folder is `.sandoq` itself, the mark's folder.
2. Run `sandoq room start`. It starts the room's door.
3. Open a session in that folder or in a folder below it, at any depth.
4. Type `/sandoq`.

The room found is the nearest above the session's folder, up to the root of the disk. In each folder
the mark comes first, then `room.sh`. A `room.sh` nearer than a mark wins, and the pane then runs
as it did for a `room.sh` room. The pane reads the files below from `.sandoq`. The tool `room_say`
and the command `/room-say` say as the session, through `sandoq room say` run in the session's
folder. Your words land on the room's feed: the submit hook runs the room's program `feedin` with
`sandoq room run`, and the bar's "To the room" runs `sandoq room card --no-seat`. This needs a room
whose disc has `feedin`. With none the hook gives the session one line, "The room did not take
this message." or "This message waits on the room's feed:" (only when `feedin` itself faulted),
and the last line of the refusal.
Taps go through
`sandoq room tap`. It starts the door with `sandoq room start`, only when no door answers on
the socket `door` of the run folder. The pane never runs `sandoq room new`.

To say to one seat from a prompt, type `/sandoq @rostam please read the survey` (or `/room`, the
same). It runs `sandoq room say` in the session's folder and opens no pane. It needs a marked room
and the `sandoq` program, and a room whose discs know the at form; the room's refusal is shown as
its own line.

A seat can drive its pane and read it with the tools `room_pane_do` (open, close, lens, place, card,
theme, width) and `room_pane_read` (what the pane draws now, with the contrast of each word, and in
the app the canvas: its plan and the open place of the dock). `place` takes the places of the dock
(`desk` too, and `letters`, this seat's face) and `rest`, which shuts the window. They need no
setting and write no file; the README has the words of each.

Right after `sandoq room new` the run folder is empty. The pane then shows the room's name, the door
down, and "Put it up" to start it; it also starts the door by itself when the session opens. It
shows no fault: `sandoq room start` makes what the door needs.

The pane finds `sandoq` in four places, the first that is a file: the plugin option `sandoq`, the
PATH, `current/sandoq` under the folder named by `SANDOQ_HOME`, and `current/sandoq` under the
`sandoq` folder of your home folder. It asks a shell once, which reads the PATH, `SANDOQ_HOME` and
your home folder itself, and keeps the answer, "not found" too, until the room's folder or the
option changes. If you install sandoq after the pane opened, set the option or open the pane
again with `/sandoq`. When the app does not find the program, fill the option `sandoq` with its
path in the settings of sandoq. With no program found the pane reads the room and says "sandoq
is not found: set the option sandoq in the settings of sandoq", and sends nothing. With no mark
and no `room.sh` above, it says "no room here: run sandoq room new in this folder". A `room.sh`
whose run folder is not made yet is still a room for the pane, as before; a mark whose run folder
is gone is no room.

## A fresh room

1. Open a session in the folder of the room, or in a folder under it.
2. Run `/sandoq`. In the desktop app the pane opens on your desk: the wallpaper, the bar at the top
   (the room's name, this seat's name in bold, the date and the time, "N wait" while something
   waits for you, and the door), the desk's window, and the dock at the foot with four places,
   Desk, Seats, Shelf and Settings, and no composer: your words go in the session's chat box. The
   band above the prompt says in one line what waits for you, and when something waits Desk in the
   dock carries its count. The desk lists what waits for you, a pile a kind, and a press on a row
   opens it. After its Close no window stands.
3. Press Letters (a pile of the desk, then "Letters" under its list): Public, this seat's face,
   the one card of what waits for this seat,
   with its picks and "Not now". With nothing waiting the card says so. Press Seats for what waits
   on each seat; `/sandoq room` opens the pane on that level up. A press on the open place shuts
   its window; so does Close, at the top right of an open place. "‹ Back to ..." on an opened row
   returns. `/room` does the same as `/sandoq`.
4. Settings, a place of the dock, holds the Lens card: Public, Operator, Trace (only when Settings
   shows it) and, under Operator, "Room" (who sits, what it plays, the door, the programs running,
   what the room has grown). Operator holds the feed of cards. The shelf is the place Shelf. In the
   terminal the pane is one column with a head, and the head's tabs and buttons do these.

The plugin finds the room by itself, nearest folder first: a `room.sh` in the session's folder or in
a folder above it is a local room. The pane starts its door (`room.sh start`) only when the run
folder holds `unpacked/room-seat/door.py` and no door answers on the socket `door` in that folder;
with no door program the pane reads alone and its band says "no door in this room". The check is
the socket, not a path, so a room reached through a link is the same room. Else the run folder of a
world room in the session's folder or in one of the six above is a world room. With neither, the
pane says "no room here" and posts nothing. A reply to a card and a say about a record work in a
local room alone.

Three plugin options, all optional: `gate` (the room's instance a card lands on; empty reads it
from `room.sh` or from the mark), `bridge` (`on` by default; `off`, `no`, `false` or `0` turns the
hooks off) and `sandoq` (the path of the `sandoq` program, for a room found by its mark).

## The seat

A seat is a Claude session, and the same folder is the same seat. The pane names this seat from the
session's folder: the line of `shelves/room/seats.md` that ends with that folder, else the folder's
own last name. The hooks name no seat: they give `feedin` the session's folder with `--folder`, and
the seat is the line of the seats file that names that folder.

## What the pane reads in the run folder

All paths are in the room's run folder: beside `room.sh` for a `room.sh` room, `.sandoq` for a
marked room. The pane reads them again at each poll (every 2 seconds); a walk is read again only
when its size changed.

- `walks/GATE/ULID.md`: the cards, one file each, every walk of the gate.
- `taps/GATE/ULID.md`: the taps of yours that the door has not taken yet. The door takes a file by
  a rename, so a taken file is no longer read.
- `shelves/room/seats.md`: who sits; it names this seat and builds the level up.
- `shelves/room/index.md`: the catalog of the shelf's records.
- `shelves/room/rules.md`: your rules.
- `shelves/room/egress/*.md`: the room's layout files (none is fine).
- `versions.md`: the rules and versions the facts line names.
- `unpacked/*.record`: the discs unpacked in the run folder, for the foot of the operator face.

Only while the Room place is open, and again at each poll while it stays:

- `logs/tick.md`: the door's last take and the day's cost.
- `discs.md`: what the room plays, and the update that waits.
- `cache/programs/*.md`: one file a program running.
- the listing of `shelves/room`, for the size of what the room has grown.

The pane writes one file, `pane.json`, in the run folder: its settings and the card
"Settings changed". The submit hook writes one file more, `room-pane-sessions.json`, at the top of
the run folder. Outside it the pane writes your `keybindings.json` (in `~/.claude`, or the folder
`CLAUDE_CONFIG_DIR` names) only when you press "Add them to your keys" in Settings, and then only
the Chat lines it lacks. It reads that file when it opens, to know whether the keys are set. A card
or a tap goes through the room's programs: `room.sh say`, `room.sh tap`,
and for a reply or a say about a record `card.py` and `feed.sh` of the room's own programs, run in
the run folder. For a marked room the same acts are `sandoq room tap` and `sandoq room run` with the
bare name of the program (`feed`, `tap`, `rule`, and `card` for a reply or a say about a record),
run in the room's folder. For the Nudge of the pane's seat (README, Nudge) a marked room runs
`sandoq room nudge ROOM --seat SEAT` in the room's folder and the world runs `salam/cli.py nudge
--seat SEAT`, each with `--json`, and with `--every D` or `--off` only on your press; it is read
when the pane opens, on a press and at a wake. The bar's "To the room" is your own card:
`sandoq room card --no-seat`,
one call, with no feed after it. The tool
`room_say` and the command `/room-say` say as the session: `sandoq room say` run in the session's
folder, where sandoq reads the seat.

A session with no pane host, such as a cloud session, loads no pane. There `/sandoq:seat-open ROOM
[SEAT]` sits the folder as a seat of a joined room (`sandoq room seat`, sandoq 0.4.28 or later) and
`/sandoq:seat-shut` leaves it (`sandoq room seat off`). The plugin writes no file for this: sandoq
keeps the seat of the folder. A hook, `node seatwake.ts wake` on Stop and on SessionStart, passes
to `sandoq room wake --hook` from sandoq 0.4.29; it says nothing in a folder that sandoq does not seat,
under 0.4.29, and nothing on a usage error or any exit that is not a wake. The rules of
the seat are the skill `sandoq-seat`.
