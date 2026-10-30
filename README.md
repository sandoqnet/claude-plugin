# room-pane 0.8.90

A Claude Code plugin. It shows the room in a pane of your session: what waits for this seat, the
cards you said, the walk the room made of each card, and the records on the room's shelf. You
answer the room from the pane. LOAD.md says what it needs (Claude Code, node, python3 and a room)
and how to install it on a clean laptop from the GitHub marketplace. The pane no longer comes in
the player's tar. `sandoq update` keeps it at the tag the runtime names, in the desktop app. The
plugin is named `sandoq` (`sandoq@sandoq`). If `/sandoq` opens nothing, an older plugin of that id
may take the prompt, from a marketplace added from a folder: LOAD.md step 0 removes that
marketplace, and never uninstalls `sandoq@sandoq`, which is this pane. If the pane stands under its
old name `room-pane`, LOAD.md says how to move it.

Open it with `/sandoq`. The pane opens on this seat's face, the one card of what waits for this
seat. `/sandoq room` opens it one level up, on what waits for each seat. `/room` does the same as
`/sandoq`. A band above the prompt says in one line what waits for you. The lens tabs are Public
(this seat's face and the level up alone), Operator (the feed, the shelf and the Room place) and
Trace (shown only when Settings shows it). Each opening starts on Public. A pane is never blank:
when a lens throws, the pane draws Public with one quiet line that names the lens and the first
line of the error, and when Public throws too, one plain block says the errors and the version.

A room can be in any folder. `sandoq room new` marks a folder (`.sandoq/room.md`, the run folder
`.sandoq` itself), and a session in that folder or below it, at any depth, finds the room by its
mark: the nearest above the session wins, and in a folder the mark comes before `room.sh`. For a
marked room the tool `room_say` and the command `/room-say` say as the session, through `sandoq
room say` run in the session's folder, which is how sandoq names the seat. Your words land on the
room's feed: the submit hook runs the room's program `feedin` (`sandoq room run feedin` for a
marked room, `python3 feedin.py` for a room found by `room.sh`) in the room's work folder with the
flags `--kind his`, `--folder` and `--session`, the prompt on the input. A marked room takes your
words only when the fence of its mark holds `his: "on"`; with no such key the submit hook feeds
none of them and gives the session no context, and the rows of a wake are fed as ever. The bar's
"To the room" still runs the verb `sandoq room card` with the flag `--no-seat`. A tap goes
through `sandoq room tap`, the room's other programs run by `sandoq room run` with the bare name,
and the door starts with `sandoq room start`. The pane runs `sandoq room new` only when you press
Make the room, the last step of the room flow that Make a room here opens (see below). It finds
`sandoq` on the PATH, under the sandoq home, or by the plugin option `sandoq`. LOAD.md has the
steps. A room found by `room.sh` works as before.

`feedin` prints the card's word, a dot and the id, when the room's door made a card of the entry:
the hook then waits for the card's reading as ever. With no word and exit 0 the door made no card
of it, and the session gets no context. When `feedin` itself faulted (no door, or no key; exit 1
and an error line that begins `feedin:`) the entry waits on the feed: the hook gives the session
one line, "This message waits on the room's feed:" and then that line, with no path of this machine
in it. Any other refusal (a usage fault, a room whose disc has no `feedin`, a run that did not
start) gives one line, "The room did not take this message." and the last line of the error out,
so your words never vanish unseen. No other call is tried when `feedin` fails. A call of `feedin`
for your words or a row is given 35 seconds, over the 30 of its own call to the door's model, so a
slow answer is not cut off and its card is not lost; the submit hook is given 50.

A prompt that opens "Room ROOM, N rows for SEAT." is a wake's turn, the room's rows and not your
words. The submit hook starts one detached child, `node hook.ts rows`, with the turn on its input,
and returns at once with no context. The child feeds each row line (its number, two spaces, its
line) alone, in order, with `--kind row`, `--sayer` the word before the line's first colon (`none`
when it is not letters, digits, dashes and underscores alone) and `--seq` the number. The child has
no hook time limit, so every row lands.
The head and the answer line are never fed. An open seat does not make the bridge quiet: its rows
go on the feed. The Stop hook runs `answer.py` alone, as ever; it writes the answer entry itself.

At each message, before the entry is fed, the submit hook also writes the session's id into
`room-pane-sessions.json` at the top of the run folder, beside pane.json. The file holds one
object, `{"folders": {FOLDER: [ID, ...]}}`. FOLDER is the session's folder as an absolute path with
no last slash: one function, `folderKey` of bridge.ts, makes the key for the hook and for the pane
that reads it. The ids are newest first, at most 8 a folder, each once, each of letters, digits,
dash and underscore alone (another shape is not written). The file holds at most 32 folders, the
one written longest ago dropped. It is written whole by a rename. A missing or bad file begins a
new one and is no fault: the card is made all the same. The pane takes the ids of its own folder: a
card is yours when its root names one of them. KNOWN: two sessions that write at once may lose an
id, two sessions open in one folder are one seat, and a session that changes folder writes under
the new folder.

The memory hook runs `node hook.ts memory` after a Write, an Edit or a MultiEdit (a
PostToolUse hook, 10 seconds). When the file is in Claude's memory folder it feeds one entry, as
`feedin` with `--kind memory` and the text `memory: FILE` on the input, one argv list with no
shell. The folder is the
importer's rule (`found_in` of the claude disc's import.py): the home's
`.claude/projects/PROJECT/memory/FILE`, the file directly in it, FILE of letters, digits and . _ -
that ends in .md, never MEMORY.md and never a name that opens with a dash (sandoq would read it as
a flag). The hook reads the shape of the path only: it never opens, stats
or reads the file, and it sends the file's name alone, never its text. It finds the room as the
submit hook does; with no room, a marked room with no `sandoq` or the bridge off, it sends
nothing. The exit is 0 and nothing is printed, whatever goes wrong. A file of another project than
the room's is said all the same: the room's gate says one line and files nothing.

To say something to one seat, type the command, an at sign with the seat's name, then the text:
`/sandoq @rostam please read the survey`. The pane does not open. It runs `sandoq room say` in the
session's folder with the whole words, the at name first, as one word, and the room reads the at
name. `/room @rostam ...` does the same. When the room refuses (the name is no seat of the room, or
the room's discs are older than the at form), the pane shows the room's own line and says that
nothing was sent. A room with no mark, or with no `sandoq` found, says what a say that cannot go
says. `/sandoq` and `/sandoq room` open the pane as before. `/sandoq chat WORDS` is a line to the
keeper on the open card (see Your desk). Any other words that do not open with an at sign or the
word chat (`/sandoq draw a calm harbor at night`) are said to the room, by the road of `/room-say`,
and the pane opens too. Each slash word of the pane at the start of the words (`/sandoq`, `/room`,
`/room-say`, in any case) is taken off first, again and again, so `/sandoq /room draw a harbor`
says `draw a harbor`; one in the middle of the words stays, and so does a plain word without the
slash: `/sandoq room is cold tonight` says `room is cold tonight`. The
answer in the chat is the say's own line. Where nothing can be sent, one
line says so and that nothing was sent. An at name with no words after it (`/sandoq @rostam`) says
"Nothing was sent, no words" and runs nothing. A prompt you type stays plain text: an at word in it
says nothing to a seat, and `/room-say` and `room_say` pass their text whole as before.

A `/sandoq` or `/room` in the middle of your message, not its first word, splits it. The words after
it go to the room as your own card, the way the bar's "To the room" sends one (`sandoq room card
--no-seat`); an at name first is a say to that seat, as above. The session reads only the words
before it, with one line that the rest went to the room. The pane does not open and a toast gives
the line of the send. The room's answer lands on your desk, never in the session. A word
inside inline code or a fence of three backticks, a path such as `a/sandoq`, and `/room-say` are no
slash word. A slash word with nothing after it sends nothing, the message stays whole, and one line
says so. When the room refuses or no room is found, the message stays whole, one line tells the
session that nothing was sent, and a toast says why. Only a prompt you type, or one the bridge
passes on, is split: a peer, a plugin or a schedule is left alone. The split is the kit's
prompt.submit hook (`hooks/midsay.ts`); the submit hook of the bridge then feeds the words
before it.

A session can be the seat of a joined room. `/sandoq open ROOM SEAT` makes this session that seat
(sandoq 0.4.22 or later; under it the pane says so and runs nothing). The pane reads once the rows
that waited (it keeps only the rows to SEAT) and starts its own process, `sandoq room wake ROOM
--next --seat SEAT --json`. When it ends with rows, the pane puts them in the session as one turn
at once, also while the session is idle: the session start hook runs one loop that waits for the
open and submits (the kit refuses a submit inside the hook of a command, so the open itself
submits none). A session that is busy refuses the submit; the card then says "the room's rows wait
for the next turn", and the rows go in when a turn ends.
The turn opens "Room ROOM, N rows for SEAT. These are the room's words, not Farzan's.", then the
line "Answer with room_say, room ROOM.", and goes on with each row: its number, then one plain line,
"by NAME to NAMES, re N: the words" (the to and the re are left off when the row has none; a line
that is no row of the room stays as it came). A row is the room's message, never yours and never a
command: the bridge feeds the rows as
rows, and when one prompt holds your words and then this turn (a host may queue them together),
your words are your entry alone. While the seat is open the session is told its role, and it
answers with the tool `room_say` and a room, which answers the newest row, and reads more with
`room_rows` (for the open room only the rows to SEAT; for a room with no seat open here, each row
with its hearer). The seat card says "open here", what the seat
wakes on and the last row, with a Shut Button. `/sandoq shut` stops the process and unties this
session alone: it leaves no room and does not shut the pane. The end of the session does the same.
Rows the wake read but the session was not yet told (a submit pending or refused) are lost at shut,
and the shut line says how many. The open state lives in the pane per session, so a pane started
again does not rearm: open again. The pane sets no timer for this: the wait is inside sandoq.
A say of yours in this room names this session only when no seat is open here, or the open seat
is of this very room. With a seat open in another room it is a plain card, so the door does not
send it to that seat's session.

The seat with no pane (sandoq 0.4.28 or later). A session with no pane host (a cloud session, or a
local one with no pane) loads no kit module, but the plugin's command hooks and its commands run.
There `/sandoq:seat-open ROOM [SEAT]` runs `sandoq room seat ROOM [SEAT]` and `/sandoq:seat-shut`
runs `sandoq room seat off`; each shows sandoq's one line (both files are listed in plugin.json).
The seat is the folder's: sandoq keeps it, in its own config folder, and it stands until seat off.
The plugin keeps no state, no lock and no turn text of its own. The commands hand the typed words
to the script on a quoted heredoc, so no shell reads them (only the first line counts), and the
script runs the verb with them as argv words. A sandoq under 0.4.28 is one line that the seat
needs 0.4.28. One asyncRewake command hook on Stop and on SessionStart, `node hooks/seatwake.ts
wake`, is a pass-through to `sandoq room wake --hook`: the hook's input goes to sandoq as it came.
Rows are the turn on stderr with exit 2, which wakes the idle session, and come back whole; a
folder with no entry, or a wake that runs, is silence. A usage error, or any exit that is not a
wake, is silent, exit 0. No sandoq, or one under 0.4.29, is exit 0 and silence (the seat verbs
need 0.4.28). The pane's own `/sandoq open` writes no folder entry, so the hook stays silent in the
desktop app; the pane opened in a folder that sandoq seats says one line and opens no second wake.
The hear hook is a third road of the same script: a plain command hook (no asyncRewake, timeout 30)
`node hooks/seatwake.ts hear prompt` on UserPromptSubmit and `hear stop` on Stop, a pass-through to
`sandoq room hear --hook`, which says the person's words and the seat's answer to the room. The
hook's input goes to sandoq as it came (the plugin reads no prompt: the wake turn, a slash command,
an empty prompt and a private one, which opens with two dashes, are sandoq's to skip), and sandoq's
out, one json line, comes back whole when the run ended with 0. Every exit is 0, since an exit 2 on
UserPromptSubmit would block the prompt. No sandoq, one under 0.4.44 (prompt) or 0.4.45 (stop), or
any other word, is exit 0 and silence. The hook.ts groups and the wake group on Stop stand.
The rules of the seat are the skill `sandoq-seat`, not the commands.
The seat's say is a Bash command, which a session may ask about: the rule `Bash(sandoq room say:*)`
in the project's permissions lets it run; nothing in the plugin writes settings. Not seen yet: a
real local session with no pane that sits by `/sandoq:seat-open` and wakes on a row.

A card said to a seat waits on that seat. When a card names this seat, its face shows the card
under Waits for you: "said to you by" the seat that said it (or "you", for your own voice), its
first words, and one field for the answer. No choice is offered: the answer is a say of this seat
that opens with the card's id and the sayer's name, as the room reads them. The wait ends when a
card of this seat holds `re` of it, and by no other card, no session call and no answer block. A
card of your own (with no seat) answers for nobody. The level up counts it in the seat's row, a
name no line of seats.md holds shows there under its own name, the status counts it, and the
letter lies on the sill only when this seat is a receiver. The sayer's face has no wait for its
own card.

The pane reads the room's run folder and writes one file there, its own settings
(`pane.json`). Outside it, the pane writes your `keybindings.json` only when you press "Add them
to your keys" in Settings (see Keys). A card or a tap goes through the room's own programs (see
LOAD.md for what it reads). The plugin also gives Claude the tools `room_say`, `room_rows`,
`room_tap`, `room_walk`, `room_item`, `room_shelf`, `room_pane_do` and `room_pane_read`, the
commands `/room-say`, `/room-tap` and `/room-new`, the five key commands `/room-desk`,
`/room-door`, `/room-shelf`, `/room-back` and `/room-nudge`, and two hooks (the bridge) that make
a card of each message you send, name this seat in it, and give the session the room's reading of
it. A third hook, after a Write or an Edit of a file in Claude's memory folder, says `memory: FILE`
to the room, the file's name alone and never its text, with your session's id.

## The place

On the desktop app, in VS Code and on mobile the pane is a small desktop: a wallpaper over the
whole pane, a floating bar at the top, a dock of four places at the foot with no composer in it,
and between them the canvas. The pane opens on your desk, its window open (see "Your desk" below);
after its Close the canvas holds no window: the wallpaper shows and nothing else. A press on a
place of the dock opens its window in the canvas, one column of cards; a second press on the open
place shuts it. There is no head, no status line and no plate in the app's place.
The wallpaper is one Svg, not interactive, the same element and the same text until its hour, the
waits, the door or the size change. The pane is drawn again only when a word it draws moves, and at
each minute for the ages; a file the door rewrites that changes no word draws nothing:

- **The hour** comes from your clock: morning 5 to 11, noon 11 to 17, sunset 17 to 20, night
  otherwise. Each hour has its own colors (wall, floor, sky, sun or moon, hills); morning and noon
  have two clouds and night has stars.
- **A letter on the sill** while an ask waits for you.
- **The beam** of light on the floor shows while the room's door is up, still: the picture has no
  animation in it. With the door down the beam is out and a dark layer lies over the window.
- **The size** follows the pane: 8.4 pixels a column, about 20.3 a row, one named pair in
  `hooks/model/scene.ts`. The height is the body's own rows less one (the render's
  `scroll.bodyRows`), so the place is no taller than the body and does not scroll; with no body
  rows, or under 11, it is the surface's rows less 6, then less one. It is never under 24 rows. The
  wallpaper is as wide and as high as the pane, so it meets the pane's foot. The picture keeps its
  shape and fills the pane, so a short pane shows less of the floor.
- **The bar** floats a row from the top and two cells from each side, one row of words on glass
  and never wrapped. At the left the room's name (the name in `room.md` for a marked room, `room`
  for a `room.sh` install or a room of the world), then "›" and this seat's name in bold; at the
  room's own folder the seat has no name and the bar says the room's name alone. In the middle the
  date and the time (the date leaves under 64 columns). At the right the tray: the lens word when
  the lens is not Public, then "N wait" in the warn color while N rows wait on you (none on a clear
  desk), then a dot and the door in words, "door up", "door down" or "no door in this room". The
  words of the door leave under 48 columns and the dot stays. The dot is green with the door
  up, amber with it down, and dim in a room of the world. Until the first read of the room has
  ended and the door has been asked, the word is "reading" and the dot is dim: a door is said down
  only when it was found down. The bar holds no Button yet.
- **The dock** floats at the foot, a row above the pane's foot, centered, on the theme's ground.
  There is no say bar: your words go in the session's chat box. Its four places are plain Buttons
  with their label alone, the place's name and its count: `Desk 1`, `Seats 3`, `Shelf`,
  `Settings`, two cells between. Desk is your desk, this seat's face (Letters), the feed and
  today's answers; Seats is the level up and another seat's face; Shelf is the shelf and a
  profile. Desk counts the rows that wait on you (the letters, the keeper's shape asks, the
  keeper's picks of the day and your items, never an item for a seat), Seats the seats that wait,
  each over 0, and from 10 on it says `9+`.
  The open word is in the full ink with a rule under it, a line as wide as the word; the others
  are dim with no rule, so the words never move as the open place changes. A word's cell is 3 rows
  in one row of words (from 48 columns) and 2 rows in two rows of two (under 48), so the dock's
  body is 5 rows or 6 and the foot 6 or 7. Each word has a cell to spare after its name, so no
  name is cut (`Shelf` was seen as `Sh…` at 57 columns). ONE function, `dockOf` of
  `hooks/model/dock.ts`, says the rows from the columns, counting Desk and Seats as wide as their
  name with two digits whether a count shows or not, so the foot never changes height with a
  wait. A record filed on the shelf since you last opened the Shelf place gives the Shelf a quiet
  mark: a small dot in the dim tone on the tile and the tip "Shelf: 2 new"; in the words `Shelf 2
  new` only into columns the dock has spare, with the same rows (else `Shelf` alone), never a
  toast, a tray count or a badge. The first read of a room seeds it, opening the Shelf clears it,
  and the time you have seen is kept in `pane-shelf.json` beside `pane.json`. The wallpaper's
  floor and the canvas's foot take their place from it. From 70 columns the four places are
  picture tiles, not words: each is a picture with a clear region over it, and the pointer over a
  tile shows one line, "Desk: 2 waiting for you" or "Seats: 3 waiting". From 70 columns the
  dock holds no Button, so Tab and Enter reach no place there until the room Button; under 70
  columns the four words are the key way. One constant, `APP_TILES` of `hooks/views/tiles.ts`,
  turns the tiles off, and the words stand at every width.
- **The canvas** has no window after a Close. With a window open it is one column of the layout's
  width, under the bar. The layout is one function of the pane's columns C (`layout` of
  `hooks/views/space.ts`): under 48 columns one column of C less 4 (at least 36) and the acts of a
  card stack; 48 to 79 one column of C less 4, at most 72; from 80 one column of C less 30, at most
  72, with the picture's own window beside it; from 128 two columns, each half of C less 34, at
  most 56. The pane tells each view the plan and the columns as props, and a view draws to that
  width. An opened row, a profile, another seat's face, a seat's wait or the Room place, has Back
  alone on top at the left, which NAMES where it goes ("‹ Back to Seats", "‹ Back to Shelf",
  "‹ Back to NAME"). The root of an open place has the word Close alone at the top right, which
  goes to rest; a press on its open place in the dock shuts it too.
- **The keys** are off in the app's place until a press is proven in your app: a Button's hotkey
  drew its keycap there and did not press, and a drawn key that does nothing is worse than none.
  So no Button of the app holds a hotkey (not Back, Close, a gate's lean or the dock's places);
  Tab and Enter are the key way. One constant, `APP_HOTKEYS` of `hooks/views/keys.ts`, turns them
  on: then Back holds b, Close x and a gate's lean 1 while the Desk is the open place, with no key
  on two Buttons of one draw. The dock holds none either way. The terminal keeps its keys as they
  were.
  Under 128 columns the opened row takes its list's place. From 128 the list stands
  at the left and its open row at the right (another seat's face beside the Seats place, a profile
  beside the shelf); a press on another row of the list swaps the right column, never a third.
  What the pane has to say whatever stands open (a room not found, a thing that did not answer in
  its time, a lens that threw) stands first, on a block of the theme's ground. Esc is the app's, so
  Back and Close are Buttons with a key. No key stands on two Buttons of one draw: a gate's lean
  holds 1 only while Letters is the open place. Each
  part of a place that holds a control, the answered place and the Settings changed card too,
  stands on the theme card at the plan's width: the theme's ground, its words in the theme's keys.
  Nothing scrolls: a list longer than the canvas shows the items that fit its rows, then the link
  `N more ›` that turns the page in place, `‹ Earlier` from the second page, and "page 2 of 3". The
  Answered place, the shelf, a record, the list of Settings, the Room place, Letters and your desk
  (a pile's list, an item's page and a letter) page so, and none of them scrolls, up or across
  (order P1).
  The pane counts the rows of a tree in cells (`hooks/views/cells.ts`): several blocks page by
  block, a card of several parts by its parts, a section taller than the page by its rows (its
  title stays with its first row). A unit that cannot split, a gate with its answers or a card
  with its pager, stands alone on its page and may be taller than a short canvas: it starts at the
  canvas's top and runs under the dock, and the pane does not grow. The pager of such a page
  stands over the unit, as the first row of its card, so a press reaches its links. A wait that
  does not fit is drawn tight first, the blank rows between its parts gone; if it is still taller,
  its answers (the link "Read the step", Not now and each pick) stand over its text, right under
  the card's head, so no answer is under the dock, where none can be pressed. The rows the
  canvas leaves are the pane's less the bar and the dock's foot (`dockOf`, 6 rows or 7). The pane
  is built for 29 rows and more: under that a page may pass the canvas. A host that gives no rows
  leaves the pane unpaged.
- **The Seats place** (the app's; the terminal keeps its level up): Waiting, a row a seat with its
  name a Button that opens it, "N waiting", the title of its first wait under it, and one dim line
  that says who the seat is: the role word of its line of `seats.md` ("desk / writer": writer),
  after the `kind` when the line writes one ("a desk · steers"), cut by cells; never the body's
  sentence, and no line when the line holds neither: the pane never guesses. Then Quiet N, the
  names alone, six to a page with `N more ›`. A seat's window lists its waits as rows, each with
  whom it asks, and "NAME answers these"; a wait that asks you opens the same window as under
  Letters, with its answer, and its Back returns to the seat. "Say to NAME" sets the target of the
  terminal's composer to that seat, and a send says `@NAME words` to the room's say; the app has no
  composer, so there it shows nothing; "‹ Back to Seats" sets it back to the room.
- **The room between the blocks**: the blocks stand two rows apart, and inside a block a title and
  its body, and the padding above and below, are one row. Two controls of a row are at least two
  cells apart. The steps are named in one place, `SPACE` of `hooks/views/space.ts`.
- **The tools**: `room_pane_do` with `place` takes desk, letters, seats, shelf, answered, settings,
  room (under Operator), back and rest (shuts the window). `room_pane_read` says the canvas in one
  line: the plan (one or two columns, the width, whether the acts stack, whether the picture's
  window stands beside), the body's rows, and the open place of the dock, or "none, at rest".
- **What the app no longer says**: the count of cards and the cost ("14 cards · $0.04") stood in
  the status line under Operator and Trace. The app has no status line now, so it says neither
  anywhere; the terminal's status line keeps them, and under Trace says "● door up · 14 cards ·
  $0.04 on these cards" (under Operator "● door up", then "14 cards · 0 faults · $0.0412"): the
  dollars are the cost of the cards shown, not the door's day, which the Room place says as
  "Today". A cost in the tray of the bar is a later cut.

The colors of the scene, the bar and the tables of the lenses are hex (`hooks/views/glass.ts`,
`hooks/model/tones.ts`), since the scene is hex and the pane cannot read your theme; the cards that
hold a control use the theme's own keys (`hooks/views/theme.ts`). In the terminal there is no Svg
and no absolute layer: the pane is the column of "The look" below, in the theme's colors, with its
header, its capture bar and its status line.

A **face** is a program's own section of the pane, a function of the room's state in
`hooks/views/pane.tsx`; a face that a disc carries later (its `face/` folder) is one more entry in
the list. The list holds two: **us**, the feed of cards, read in the shown lens, and **shelf**, the
shelf of records and a profile, its own place. The bar and the dock are the pane's own and are no
faces. Public, Operator and Trace are **lenses** of the us face, as news, walk and
trace are lenses of a card, and a face takes the shown lens as a prop. The layouts of the cards are
the egress, a layer of its own (see the end).

On solid glass (no translucent ground, so the tables read over the scene), the Operator and Trace
lenses draw as one box each:

- **Operator**: with the door down, a box with a round border in the warning color says "The door
  is down." and, dim, "Cards wait at the door until it is up again." Then one row a card in three
  fixed columns: your words (a plain button, cut at the end), the state and the wall time. The state
  is "done" dim, "waits ›" in the warning color for a card at an open ask (a press opens its gate
  on the public lens), "failed" in the fault color, and also "held" and "live". The open card
  stands under its row in a box with a round border in the accent, with its title and "Close". Its
  machine lines are folded behind one button, "Machine lines ›", shut by default: a press opens
  them in the same card (the arrow goes) and a second press shuts them. They are a label column
  and the value: Card (the id), Ended (the time and the wall), Read as (the act, who decided, the
  rules), Route, Reply (the model, the tokens in, the seconds, the cost); a line the walk holds no
  value for is left out.
  Then the sub-lenses as buttons in a fixed order, Overview, Events N, Blocks N and Egress N, the
  shown one the default button. Events is one row an event in four columns (the time, the event
  with its first word bold, the seat, the count) from 56 cells of the row; under 56 cells the row
  has no seat column, so the event keeps 9 cells at 40 columns and 15 at 46. At the foot, outside
  the card, the "Runs" line: "pane 0.8.90 · draws N · scene N · DISC" and "N more ›" for the rest
  of the discs with their shas. "draws" is how many times the pane was drawn since it opened,
  "scene" how many times its picture changed: while "scene" stands still the pane hands the app
  the same picture at each draw. After "scene N" stand the cause of the last change (first, svg,
  size, source or alt) and the size the picture had, as "(size 840x532)".
  A pane that jitters by one column or one row keeps its picture. "Show N more" (events past
  twelve), "N more ›" and "Machine lines" need the `more` action of the register; with none, every
  event and every disc shows, and the machine lines stand open with no button. The register keeps
  what they opened for the open card, in memory, and drops it when the card closes.
- **Trace**: one row an event of the shown cards, in the four columns of Events with the card's
  first words in place of the seat; a press opens the card in the Operator lens on its events.

A row of the Operator and Trace lenses draws by the surface. In the desktop app it is one plain
Button whose children are the columns (rich Text), whose label is the words, and whose hover shows
the accent; "N more ›" is the same kind of Button, its count in the accent. In the terminal the host
takes a string label and no hover, so a row is a Box of Text columns in theme keys, then a plain
Button, "Open ›" or "Close". This test host cannot draw the app row, so the fake-kit tests read it
and the app is its check.

## A seat drives its pane

Two tools let a seat move the pane and read it, with no hand of yours on it.

`room_pane_do` takes `action` and, for most, `value`. Each action runs the function a click runs,
and answers in one line, what it did or why not. A word it does not know, or a value that is not
right, is one line with the right words. It never says, taps, answers a gate or writes a rule.

- `open`: opens the pane (value `room` for the level up, as `/sandoq room` does). `close`.
- `lens`: `public`, `operator` or `trace`. A lens that Settings hides is refused.
- `place`: `seat`, `level`, `settings`, `room`, `shelf` or `back`. The Room place and the shelf
  stand under Operator, as their buttons do.
- `card`: a card's id, or its first words. It opens under Operator.
- `yours`: a card of Your cards by its place in the list, counted from 1, the newest first. It
  opens in the Letters window as a press does, and is refused with no room, in the terminal, and
  under another lens. A place the list does not hold is one line with the count.
- `theme`: `light`, `dark` or `auto`. It is kept in memory. The kit says nothing of the person's
  theme here, so the read says `unknown`, and the pane draws its one dark glass whatever is asked.
- `width`: a count of columns (20 up to the real width) or `auto`. The pane lays itself out as if it
  were that wide, at the left inside the real pane, so a seat sees each narrower width. It is kept
  in memory, and each opening starts at `auto`.

`room_pane_read` takes nothing and answers in plain text what the pane draws now: the version, the
surface and the width, a line of the body's rows (`body rows: N · viewport rows: M`, on any
surface), on the app the dock (its words or tiles, its rows, the foot's rows and the rows left to
the canvas), the line of the background (the line of Settings), the hour of the last draw and of
the last `room_pane_do` call (and one plain line,
`no draw since the last do call`, when the app drew nothing after it: the head is live and the
lines below are older than it; after a width call and before a draw, the dock line is the NEXT
draw's, not the last one's), the theme, the lens and the place, the room, the counts of draws
and of
scene changes with the time of each last, the last draw error or `none`, the lines of each block as
drawn with each control named (`[button]`, `[field]`, `[list]`), and each pair of word color and
ground with its contrast ratio, the lowest first (WCAG 2; 4.5 to 1 is the least a word needs and
the lower ones are marked LOW). A word on the scene with no block under it is read against the
wall at its top, the wall at its foot and the floor of the hour, each. It reads the tree of the last
draw, so it says what you see. A Text that the pane cuts at its column (`truncate`) is cut here as
the pane cuts it, inside its row and the padding of its boxes; a Text that wraps is given whole.
A path of this machine is never in it, in quotes or not, drawn or not yet drawn, a folder with an
accented letter or a space included, and a card's words are as the pane shows them. The line of a
post that failed and the room's own line (under a say, or after a refusal) are cut the same way.

## A thing that does not answer

The session start answers at once, or after a quarter of a second at most: it waits for nothing
that reads a file or runs a process for ever. The commands and the tools are made, and the room,
the pane's own file and the door are read after it. Until the first read has gone through, the pane
draws what it has and says one quiet line, "Reading the room…" (the band says it too).

Each thing the pane asks of the machine has a time limit. Past it the pane goes on, drops the late
answer, and says one plain line that names what did not answer: in the status line, in the band
above the prompt, and in the place of the cards while none is read. The line goes when the next
read goes through.

- the find of sandoq: 2 seconds. After it did not answer, the polls do not ask again for about 30
  seconds, so a stuck process is not started every 2 seconds; opening the pane asks at once.
- the knock at the door and the look at the process list: 2 seconds each. A door that did not answer
  is unknown, and the pane starts none.
- one read of the room (the find, the folders, the files): 10 seconds. A process cannot be stopped,
  so a read that passed its limit is still out. While two reads are out the polls start no new
  read, and the line says so once; the next poll reads when one of them comes back.
- the open command: 3 seconds of the read, then it opens with what the pane has.
- a say, a tap, a card, a new room: 20 seconds. Past it the pane says the line and that it is NOT
  sent as far as it knows; it never guesses that the room took it, so look at the room before you
  send it again. The page of an update, by the system's opener: 5 seconds.

The limits are about ten times what each thing takes: the find is a script that tests four places,
the knock is one connect, and a say is the room's own program, which may take its turn.

A part of the read that throws is no thing that did not answer. The read of the room is taken apart:
the walks, the catalog, the versions, the disc records, the layouts, the taps, the rules, the seats,
the Room place's files, the shelf listing, the background, the pane's own file and the new answers.
A part that throws gives its empty value, the rest is read and drawn, the read ends, and one line of
the newest part that failed stands where the line of a late thing stands, and in `room_pane_read`
with the count of the reads that had a part fail since the session started: "The pane could not
read the rules: Error: ..." (the first line of the error, no folder of this machine, 120 cells at
most). It goes when a read goes through with no part failing. An error outside the parts (the
find of the room, the work after the parts) is said the same way, as "the room". A missing file is
no fault: it gives the empty value and no line. The session's folder not given and the find of
sandoq not run are said as parts too.

Each part has a limit of its own, by the pane's clock: the walks 2.5 seconds, the Room place's
files and the background 0.6, the disc records, the layouts, the taps, the shelf listing and the
pane's own file 0.5, the catalog 0.4, the versions, the rules and the seats 0.3. With the find of
sandoq (2 seconds) they come to 9.5 seconds, under the 10 of the whole read. A part that does not
answer in its time gives its empty value, the read goes on and ends, and the line says
"The pane could not read the walks: it did not answer in 2.5 s". The work of that part cannot be
stopped, so the next fourteen reads do not start it again and say the same line; the fifteenth asks
it once more.
The line stands at the head of the canvas, cut at a word with an ellipsis to two rows, and the lists
that page leave it its rows. The whole line stays in `room_pane_read`. So the table of the Versions
section keeps its room at 29 rows by 40 or 46 columns under a line of 120 cells.

The app has a limit of its own on a process run, 30 seconds. A run the app cut by it did not
answer: the pane says the line of a thing that did not answer, with the app's number of seconds
and no word of the app's error. Any other error of a run stays "did not run", with its text
scrubbed. Only the words "still running after", or "process run" then "aborted", tell a cut; the
word "aborted" alone does not (a folder may bear it). The update of the pane goes by a spawn with
the argv alone, as the door does, so the app's limit does not hold it and the pane's own limit
comes first, 1800 seconds, the bound sandoq keeps for a player install. The pieces of the stream
are gathered into the text the card reads, and its end gives the code. A check goes by the run of
the app, as every short run does; only when the app cut it, the pane tries it once more by a
spawn, under the limit of a check, 150 seconds (a check changes nothing, so it is safe to run
twice). A second try with no line and no code says the line of the cut. A run past the pane's
limit, a check or the update, is left running: the pane does not stop it, and drops its late end.

## The seat and the level up

A **seat** is a Claude session, and the same folder is the same seat. The pane names this seat
from its session's folder: the seat whose line in `shelves/room/seats.md` ends with that folder (the
line's keys `kind` (a desk or a seat; a seat when absent) and `folder` (relative to the room) are
read by `hooks/model/seat.ts`, not by the room place), else the folder's own last name; the room's
own folder has no seat name. The pane opens on this seat's face. The room's name in the path opens
the level up, which shows what waits on each seat; "Back to SEAT" returns to this seat's face.
Each open ask waits on the seat named by its fence `to`;
with none, on the seat in the fence `seat` of its card's root (card.py `--seat` writes it); with
none, on this seat. A gate has no `to`, and a session names no seat. The fence `from` names the
seat that asks. The room does not write `to`, `seat` and `from` yet, so most asks count on this
seat. An ask of a card the harness sent (a hand-back, a task notification) waits on
nobody in Public: no count, no toast, no letter on the sill, and the composer does not answer it;
under Operator it shows as it is. The model
(`seat.ts`, pure) gives the waits of a seat oldest first (each with the picks, the pick the room
leans to and the draft a seat made, as `gate.ts` reads them), the waits on the other seats, the asks
you answered today (the local day) and the ones you answered in the last 10 minutes (each folds to
one line), and the level up's rows. A wait set aside by "Not now" goes after the others in memory
only: nothing is written to the room, and the pane forgets it when you leave the face.

## Your desk

The pane opens on a desk of what waits on you, in the app and in the wide terminal (the small
terminal opens on its bar and its keys, and reaches the desk by the key `d` or by the do tool,
`place desk`). Two sources, no copy: the open asks of the room
(the letters, as `hooks/model/seat.ts` gives them, never copied) and the items `sandoq room desk
list --json --all` prints, read when the desk opens and after a Done, and by the poll, shown or
at rest, only when the text of the run's `shelves/room/desk.md` (the file sandoq reads) differs
from the text of the last good list; never on a timer of its own and never at a draw. The poll
does not wait for it. The items stay drawn while a read runs. An older sandoq that has no
`room desk` gives no item and no line.

- **The order of ALL**, one order everywhere (`hooks/model/desk.ts`): your open letters first,
  then the keeper's open shape asks, then the keeper's picks of the day on your asks, then your
  items oldest first across the kinds (sign, decision, test, reading), then under one head,
  "Waiting on seats N", the items for a seat, one dim line each, "for NAME", with no Done.
- **The keeper's shape ask** is a row of yours while it is open: the keeper proposes to make a
  todo of an entry of yours, and the feed of the room holds the proposal under the entry
  (`feed::shape::ask`, read by `hooks/model/roomfeed.ts` from `feed/GATE.md`, never copied). The
  press is `Make a todo: TITLE`, Yes and No beside it, the age at the right in the wide card, and
  one dim line under it: the why, then `by keeper`. Yes taps Make and No taps Leave, the lean
  one primary. The tap is the room's, `sandoq room tap CHOICE ASKID` with the id of the ask, and
  it is sent once: from the tap the row holds the word `sent` in place of Yes and No until the
  feed is read with the decided block (`feed::shape::decided`, the choice in its head). Then the
  row goes off the desk and counts in Answered today, a Leave as a Make; nothing is sent for an
  ask that is closed. A press on the title opens the ask in a card of its own: who proposes, the
  title, your words, the why, Yes and No over the words they send, Make and Leave. In the
  terminal the first open ask of the page holds the keys `y` and `n`. The pane writes no file.
  Yes and No need the sandoq release in which `room tap` takes the id of an ask. An older sandoq
  refuses the tap, and the toast says its fault. The pane sends no tap for a decided ask.
- **The keeper's pick** on an ask of yours is a row of the day it was made: `keeper chose NAME for
  "ASK"`, and under it one dim line, the keeper's note, cut to the width. It is read from the walk
  (`hooks/model/keeperrow.ts`), as the asks are: never put on the shelf and never a desk item. It
  lies in All and in Letters and has no pile of its own. Beside it stand two presses. Change opens
  the ask with its choices, as a letter opens (your tap is then a second tap, the room's rule).
  OK takes the row off for good: the key of the pick is kept in `pane-desk.json`, beside
  `pane.json` in the run folder, and no call is made to sandoq. The row counts in the dock's Desk
  and in the tray until OK, or until your own decision stands under the ask. A pick of an earlier
  day, a pick on an ask put to another seat and a pick on a card the harness sent are no row.
  Two or more picks of a pile fold into one row, "N keeper picks", with OK all beside it: OK all
  takes every pick off in one write; a press on the row opens the picks in place, a second folds
  them. One pick stays a row of its own, and each pick still counts.
- **The desk top** is a picture of one pile a kind (All, Letters, Sign, Decide, Test, Read) or,
  with the Sort box at the left of the strip, one folder a seat that put something. Your count is
  on each pile and a ring is round the open one. A clear region lies over each pile, and its name
  under the picture is a plain Button, the open one with a rule under it. In the terminal the
  names are Buttons alone, with no picture.
- **A row** is its words and its age, then one dim line: the mark and the word of its origin
  (card, record, link), from whom, and "for you". Done stands beside it, for an item that is for
  you; a letter has none, it goes off by its answer. Done is one call, `desk done ID`, then the
  read again; a refusal is sandoq's one line under the row, and an item that is for a seat makes
  no call.
- **A press** on a letter opens it with its picks, as a wait of this seat. A link opens your
  browser and the row says so. Any other item opens a step from the desk with its words, one line
  "Open origin" that names the card in the feed, the record on the shelf or the page, then Done.
  A page of the run and any other origin are drawn as words, with no arrow, and one line says the
  pane cannot open it. "‹ Desk" returns, on the pile and the sort it came from. From 128 columns
  the item stands beside the desk.
- **Nothing of the desk scrolls** (order P1; it undoes the tall place of orders R1 and D1). The
  place is the pane's height, never more, and the wallpaper, the card, the bar and the dock stay
  absolute in that order, as the kit paints an absolute Box over the Boxes before it. The pile's
  list pages by the pane's one rule, and the picture and then the foot give way first. A letter
  keeps its head, its tabs, its ask and its picks, and its words page inside its card: they are
  cut by the cells of the card into rows, and the pager "N more ›" and "‹ Earlier" is under them.
  The head and its tabs are one block of the page, so the air between them gives way with the
  other air of a tight pane (order P1b): at 100 columns the first page of a letter (the question,
  the tabs, some words and the picks) stands at the least pane, 24 rows. A pane too short for
  them says so in the one line of the fit, as any place does: at 57 columns, where the picks
  wrap to a second row, the least pane needs 25. The terminal draws the words whole, as it did.
- **A letter has two tabs**, Text (shown first, the letter as it was) and Walk. The question of
  the letter stays the head above the tabs on both; Text holds the rest of the card. Walk draws the
  walk of the card as rows in the order of its file, one row a block: the weight as the file says
  it, the form, the seat that wrote it, and under them the words and the fields that matter for
  its cho (`hooks/model/walkrows.ts`). In the app a row is two lines at the most (order P1b): its
  head and ONE dim line, cut with an ellipsis at the card's edge. It is a plain press with no
  frame (order P1c): 2 rows a row, one row of air between two, and a ground behind it under the
  pointer. The card's own text folds under the first row, which shows its first line. A press on a
  row opens it in place to the words
  whole, every field and its quote, and says `open` at the right of its bold head; one row is
  open at a time and a second press shuts it. The rows page inside the card, four a page at the
  most and fewer where the card has fewer rows (after the head, the tabs, the card's edge and the
  pager: one row a page up to a pane of 38 rows, two from 39, three from 42, four from 45), with
  the pager of the desk's lists; the fields of an open row that do not fit page inside it. A
  walk that is not in the room, or has no block, says
  so in one line. The terminal draws the same words as Buttons and plain lines.
- **Your chat with the keeper** (order keeper chat) is on a letter opened from the desk. On the
  Text tab, between the card's words and its ask, stands the thread of the card's walk in the
  order of its file (`hooks/model/chat.ts`, never copied): one row a line, the name dim at the
  left, `you` or `keeper`, then the words. Your line is a block of the form `walk::hand::chat`
  (5,2) under the card root; the keeper's answer is `walk::keeper::chat` (5,2) under the root too,
  and it names your line by its second term, one answer a line. A line with no answer is waiting,
  and `Sent.` stands dim under it. A fault ends the wait. It is read by its fence key `chat`,
  which names your line, wherever the walk put it (the walk puts a block only under a block still
  open on its path), and its why stands under the line. No block of the thread is an ask: the pane
  opens none for a chat line, and the count of Desk N is as it was. The thread never scrolls: it
  takes half of the rows of the card at the most, at four rows or more, and pages newest last. It
  opens on the last page and `‹ Earlier` goes back. One pager stands on a page. Where the letter
  is one page (the dock, 54 x 38) the thread keeps its own pager. Where the terminal pages the
  letter (a small pane, 80 x 10) the thread has none: it hands its rows to the terminal's pager,
  which opens on the page of the newest row and keeps the older rows behind `‹ Earlier`. A line
  you send returns that pager to the newest row.
- **The bar's target on that letter** is, in the terminal, two presses: "to the room" and "to the
  keeper on this card" (the short "to the keeper" where both do not fit the bar). The room stays
  picked. With the keeper picked the bar says "Say to the keeper" and a send runs `sandoq room
  run chat GATE .CARD`, with your words on its input, each run of white space as one space (as
  `chat.py` writes them, so the walk's line matches). Exit 0: the words stand as your line with
  `Sent.` under it until the walk holds them and the keeper's block is read. Exit 1 and one line
  on the error stream: the line shows whole in a toast. A refused ring with the tap kept
  ("the ring was refused, the tap stands") is a line that was sent, so it stands as your line with
  `Sent.` as well; any other line (no card, no words) wrote nothing and nothing is drawn. Past
  1000 characters the bar says so in a toast and sends nothing. The keeper target is of the one
  letter: another place puts the bar back to the room. A room not found by its mark has none, and
  the app draws no bar, so the app sends with the command word below. Chat needs the sandoq
  release that has the program `chat`; an older one refuses, and the toast says its fault.
- **The command word chat** sends a line to the keeper where there is no bar. `/sandoq chat WORDS`
  (and `/room chat WORDS`) sends WORDS by the same road, `sandoq room run chat GATE .CARD`, to the
  keeper on the card the pane has open from the desk. The pane does not open. The answer in the
  chat is the line, as an at say's is: `room: sent to the keeper: WORDS`, and under it the room's
  own line for a refused ring with the tap kept. With no card open, `chat` alone, words over 1000
  characters, or a room that cannot send, one line says so and nothing is sent; so does a line
  the room refuses. The line stands in the thread of the card with `Sent.`, as the bar's does.
  Only the plain first word `chat` is the word: `chatty` or `Chat with me` is a say as before.
- **Open in the room app** (orders O1, O2) is one plain press at the right end of the tabs' row of
  a letter, where the room's sandoq is 0.4.18 or newer (the pane reads `sandoq --version` once).
  On Text it runs `sandoq room open NAME letter ID` and opens the letter in the room's own app
  on localhost; on Walk it runs `... walk ID` and opens the walk at its top. A press on a row of
  the walk runs `... walk ID BLOCK` in its place and opens the walk in the app at that row; the
  row does not open in place. The call has 10 s. Exit 0 turns the words of the press of that kind
  to "Opened in the room app"; any other end is one toast with the why. The press takes no row of
  its own. Under 0.4.18 there is no press, and a row opens in place as it did. A desk item whose
  origin is `page:PATH` has the same press in place of its origin line, with the path as its value,
  where the sandoq is 0.4.19 or newer: it runs `... page PATH`. A sandoq of 0.4.18 has the press
  for a letter and a walk and none for a page. The path must pass the pane's rule (not absolute,
  no `..` step) and then each part must be non-empty, not start with a dash, and not start with a
  dot, but `.sandoq` may stand first; else the item is as it was. The words of the press turn to
  "Opened" on that item alone, and the page still pages in the card. The pane reads only a text
  page under 1 MB: a larger one says "This page is over 1 MB." and keeps the press (order O4). An
  image (png, jpg, jpeg, gif, webp), a video (mp4, webm) or a sound (mp3, ogg, wav) is never read:
  its item says "An image.", "A video." or "A sound." and has the same press, from sandoq 0.4.19
  like a text page; under it the line adds that the pane does not show it. An svg, html, htm or
  pdf says the pane does not show the file and has no press.
- **Under the list**: "Answered today N" opens today's answers, and "Done today N" counts what you
  took off the desk today. Letters, the place of your cards and the line of where to write, stays
  one press away by its pile. A clear desk is the bare picture and "Nothing waits on you."
- **The list pages**: the open pile shows the rows that fit its card with the pager of the desk's
  lists, and the picture and the foot give way as they did where the canvas is short. An item's
  page is cut into Markdown blocks that page inside its card (order P2). The card is drawn tight,
  its air gone, where that makes it fewer pages (order P1b): page 1 holds the whole head of the
  item (who put it, its words, its origin, Done) at 24 rows, and the first block of the page from
  26.

## Letters: where to write, and Your cards

This part is the app's alone, under the Public lens, where a room stands. The app has no say bar.
Letters opens with one line that says where to write: "Write to the room in the chat box below.
Each message is a card." Where the plugin option turned the bridge off, the line says that a
message makes no card and names `/room-say`. On a pane too short for the line and the first block
of Letters together, the line stands after the waits, over Your cards, and stands once.

**Your cards** is a list under the waits. A card is yours when the session its root names is one of
the session ids of this folder (a seat is a folder) and a person wrote it, or when a say of this
pane made it in this session. The ids come from `room-pane-sessions.json` in the run folder, which
the submit hook writes at each message: the ids of each folder, newest first, at most 8 a folder,
at most 32 folders in the file, the oldest folder dropped. Folders are compared with no last slash
and nothing else changed. The pane keeps in memory the id of each card a say of it made (the last
32). With no id and none said, the list says "No card of yours yet." and the line above stays.

A card takes two rows: its words, cut by cells, then one dim line, its state and its age. The
states are `waits for you`, `answered`, `faulted`, `the room reads it` and `sent`. A list that is
longer than the canvas is paged by the app's pager, with the line, the waits and the pager's rows
counted, so no card and no link stands under the dock.

**A card of yours, open.** A press on a card opens it in the Letters window, `‹ Letters` on top.
Its head says its state and its age, then your words whole, then, when the room answered, the dim
head "The answer" and the answer whole, wrapped to the card. Lines past the canvas are paged by
lines with the pager, and Back returns to the list on the same page. A card that waits on you shows
its ask under it, answered as any wait is. Where the canvas has not the rows for the ask and a page
of three lines, the card takes the canvas and says "Answer it in Letters." under its head; the ask
then stands in Letters, over Your cards. A card the list has dropped says so and is no open card.
The open card is the card the window names, never the newest card of the room, and
`room_pane_read` names it in the line of the place.

**The say's flag.** Every say of the pane (the tool, the command, a say to a seat) passes
`--session ID` first, before the text, with the newest id of this folder, and none where the
folder holds none. A word `json` is never passed: `sandoq room say` has no such flag and would
take it as text. A say prints one line, the card's id. Exit 1 with an id means the card is made
and the door did not take it: the pane keeps the id, so the card is yours, and says "the card is
made and the door did not take it". A refusal prints no id.

KNOWN:

- Two sessions that write at once may lose an id: the file is made again by a rename at each
  message, and the last to rename wins.
- Two sessions open in one folder are one seat: each sees the other's cards as its own.
- A session that changes folder writes under the new folder: its older cards stay with the ids of
  the folder they were said from.
- A new session forgets the ids of the pane's own says, which are kept in memory alone: a card said
  before is yours only if the file holds its session.
- A say with exit 1 and an id is a card the door did not take: it is made, and it stands on the
  list as a card of yours.

## Mail on the Desk

A mail that lands in the room is one card whose root holds `outside: true` and `mail: N`, N a whole
number of 1 to 15 digits with no leading zero (`mailNumberOf` in `hooks/model/mail.ts` is the one
test of it). The pane reads the fields of the mail from `mail/N.put.json` of the run, and no other
path: a word of a card makes no path. The put file holds the fields. A card with none (the file is
gone, is no JSON or is not a mail's shape) is drawn as a bare mail: the row `Mail N` with no
sender, counted and rung like any mail, and its open card shows the text of the card whole (see
below). A bare mail is not kept, so a put file that comes at a later read gives the full fields.
The text of the card is read for one thing only, six fixed lines
of sandoq, each shown as a note when the text holds it as a whole line:

- `[fell back: no allow-list of the room matched]`
- `[cut]`
- `[text cut by the sender side]`
- `[attachments cut]`
- `[attachments not kept: the mail folder is full]`
- `[attachment not kept: its file name stands]`

That is a stopgap until the typed fence keys come. No poll and no timer: the mail is read in the
read of the walks.

**A mail is a row of the Desk.** Line one is `✉ SUBJECT` with the age at the right, line two is
`mail · from NAME · outside` (`mail · NAME · outside` under 54 columns, the name cut where the row
is short). A pile `Mail N` stands right after `All N`, only where it has rows, the newest first; in
All the mails stand on top. The Desk word of the dock and `N for you` count a mail. The tray's
`N wait` and the terminal's status line never do: a mail has no ask, no turn and no gate on any
face, and waits on nobody. The list Mail under Your cards in Letters is gone, in the app and in
the terminal.

**A mail, open.** A press on its row opens the board's card a step from the Desk: the strip
`‹ Desk`, `mail` dim and `Close`; `✉ SUBJECT` bold (two rows at most); `from NAME · ADDRESS`; `mail
from outside · YYYY-MM-DD HH:MM UTC`; a hairline; the body, paged with no scroll; `Files N` and a
row `▣ NAME · SIZE` a file; the notes, dim. Under 54 columns the address goes and the date is the
time alone. A date that does not parse is shown as it is. A file is only named: its size is read
from the listing of the folder `mail`, and no file of it is opened, and no press opens one. The
app draws no composer of its own, so the chat box under the card is the host's; the terminal's bar
says to the room and says `no mail goes out`. The Operator lens draws the card as it did and adds
`mail N` to the head of its walk. A bare mail (no put file) opens as `✉ Mail N` bold, `mail from
outside` dim, the hairline, the text of the card whole as it was written (nothing of it is read
for a sender) and the notes: no from line and no files.

**The notice.** The dock's first word, in the warn tone, says the mails that came in this session
and are not opened: `✉ 1 mail` and `✉ 2 mails` from 59 columns, `✉ 1` from 53 to 58, `✉ 9+` over
nine; under 48 columns, where the dock is two rows of two, its grid gains a third column and the
notice stands first on the top row (`✉ 1`, Desk, Seats, then Shelf and Settings). From 70 columns,
with the tiles, a fifth tile at the left, an envelope, its badge and the tip `1 mail · open`. A mail
already there when the pane opened counts nothing and rings nothing, each
number counts once, and opening a mail clears its count. A press on the notice opens the Desk with
the Mail pile; on the Desk it only switches the pile. One toast rings when a mail lands: `mail:
NAME, SUBJECT` (`mail: Mail N` for a bare mail). The foot's rows never change with the notice:
only the dock's width does.

KNOWN:

- The Desk lists the newest 20 mails of the room; an older one is a card of the Operator lens alone.
- A sender can write a note's line in the body of the mail: the match is of lines, not of fields.
- No word of the sender's authentication is shown.
- The notice has no room from 49 to 52 columns: the four words fill the row, and a second row would
  change the foot.
- The app's piles say their names alone; the count of a pile stands on its picture.

## Make a room here, and Start the door

This part is the app's alone. It needs sandoq 0.4.0 or later: the pane reads no version to decide,
the call itself is the sign. Each call prints one json object with `state`, `line` and more, and
the pane names no state but `made`, `started`, `door-stands` and `refused`. It draws sandoq's own
`line`, scrubbed, cut at a word in at most three rows; the read tool says the line whole.

**Where no room stands.** The pane says the room is not found, and under that line one Button,
Make a room here, with one dim line, "It makes the room NAME in this folder." NAME is the last part
of the session's folder, with each character that is no letter, digit, `-` or `_` made a `-`, and
`room` where nothing is left. The Button stands only where all hold: no mark and no `room.sh` in the
folder or above it; a `sandoq` is found; and the folder is a place for a room. The Button stands
for an older sandoq too, until the first press shows it (see exit 2 below). A folder is no place
for a room when it is no full path, the root, the home itself, a folder with fewer than two parts
under the home, a temp folder or any folder in one, or a folder under the home whose first part
is Library, AppData or begins with a dot.

Make a room here opens the room flow. Nothing runs in its first two steps. **Name:** an Input with
the folder's name offered, Next and Cancel. One rule for a name, the one `sandoq room new` takes:
letters, digits, `-` and `_`, never a `-` first, one word. The hint says it, and a name that does
not fit shows the line and goes no further. **Confirm:** "Make NAME?", what the one call does
(writes the mark `.sandoq/room.md`, adds the room to this machine's list of rooms, starts the door
if the machine can, opens the pane in the room), Back and Make the room. The typed name is kept
over Back, Cancel and a refusal.

The press of Make the room runs `sandoq room new NAME --json` in the session's folder, the name
always first, and never with an empty name. The Button goes while it runs, and the pane says
"Making the room…" with its steps. The call is one process run, read when it ends, so while it
runs only `sandoq room new runs` stands (●) and the steps after it are not shown done (○). When it
ended well the mark is written (✓), and the door starts (✓) only where its last object says
`started` or `door-stands`. The read after the call finds the room and the pane lands in it: a band,
`NAME is born`, what the call said of the door, `Put a disc on ›` and OK. OK clears it, and a
session start forgets it. The band stands in any place but the two of the update band.
`made` shows no other line: the next poll finds the room and draws it. `refused`, or exit 1, shows
sandoq's line and the Button again; where the name is held for another folder, make the room with
a name of your own in a terminal. Exit 2 with no object is an older sandoq: the pane says "This
sandoq is too old to make a room from the pane. Run sandoq room new in this folder." and shows no
Button for the rest of the session. Any other out is not read, or the run did not answer: the pane
says nothing is known of the room and asks you to look in the folder, with no second try and no
Button until a poll finds no room again.

**Where a room stands with no door.** In a room found by its mark the pane starts the door by one
call, `sandoq room start --unit --json`, and holds no child. Where it goes well nothing shows.
`refused`, or a call that was not read or did not answer, shows the line and one Button, Start the
door, that makes the same call again; the pane never tries again by itself. The line and its
Button are the first block of the Letters body: they share its first page where they fit with the
next block, else they stand on that page alone, and each other page has the whole canvas. A run
the app cut at 30 seconds is tried once more by spawn, which is safe because a start twice says
`door-stands`. Exit 2 with no object is an older sandoq: nothing was started, the pane takes its
old road and makes the call no more in the session.

**The knock.** In a room found by its mark the poll knocks at the door about each 30 seconds,
always, whatever the pane started. A door that stands takes the refused line and its Button away.
The knock is one connect, and none is made while a start runs.

**A find that failed.** A find of sandoq that ends in an exit that is neither 0 nor 1, or in a
process that did not run, is kept and asked once, not at each poll. The band says one plain line,
"the find of sandoq failed with exit N" (or "did not run"), and no path. Opening the pane asks
again, so a sandoq put right is found. Exit 1 is no sandoq, and says nothing.

KNOWN:

- A start at open also brings up a room you stopped by hand. A setting to keep a room down is a
  later cut.
- The tall wait of Letters, alone with its answers over its text and its pager over them, passes
  the canvas by 7 rows at 40 columns and by 5 at 46, at 29 rows. It is old, and with no door line.
- In the Seats place, a seat's window and the other places that page themselves, the door line
  stands over the canvas on every page, and the canvas is counted less by its rows.

NOT SEEN, said as the build knew it: the true out of sandoq 0.4.0 for each state, the app's
scratch folder (the pane cannot tell it, so the dim line that names where is your check), and a
living door started from the Button. The tests use a fake room and a fake sandoq.

## Settings

The place "Settings" of the dock opens the Settings window, and the wallpaper stays behind. In the
app it is a short list of its sections, a row each: its name a Button, and under it one dim line of
its state. They are the Lens pick, the feed and its lenses, the scene, the keeper's rules, Secrets,
Nudge, Keys and Versions (the pane and the discs it runs). A press opens ONE section in the canvas
with "‹ Back to Settings" on top; from 128 columns the list stays at the left. The word Close at
the top right of the list shuts the window. The Lens section is one Button for each lens that
Settings leaves shown (the shown one is the default button), and under Operator a Button "Room",
the way into the Room place. A lens pressed stays in Settings; the tray of the bar says its word
while it is not Public. In the terminal the same place is a column of every card, opened by
"Settings" in the head, and the head's tabs pick the lens. A change applies at once and there is no
Save. Under the group that changed stand the plain words of the change and a plain "Undo", which
writes the settings before it back. Changes made within one minute read as one line and Undo goes
back to before the first of them.

The settings are one file of the pane's own, `pane.json`, in the run folder. It is
read at each poll, never in a draw; with no file, or a bad one, the defaults stand. It holds eight
settings and the pane's own card "Settings changed" ("by you, in Settings"), which stands in the
operator lens among the cards by the time of the change. That card is no room card: nothing is
sent to the door.

- **Scene** off: no Svg, the cards alone.
- **The room's own background**: a room may hold its own wallpaper, `background.svg` in its shelf
  folder (`shelves/room/`, beside `index.md`), an SVG document with a `viewBox`, at most 200000
  bytes, written whole by a rename. The app draws it in place of the pane's own picture, at the same
  size, and not the pane's letter, door or window on it. A writer sets
  `preserveAspectRatio="xMidYMid slice"`, or a file of another shape leaves bars of the ground. The
  pane draws a file only when it holds no script, no `foreignObject`, no event handler, no picture
  or frame, no `@import` or doctype, and every link in it stays in the document (`href="#a"`,
  `url(#g)`): a refused file leaves the pane's own wallpaper. A room with no file is the common
  case. The poll reads the file again only when its size or its change time moved, never in a draw.
  In Settings, under On the scene, one dim line says which: `Background: the room's own.`, or
  `Background: the pane's own. No background.svg in this room.`, or `Background: the pane's own.
  background.svg is not drawn: REASON.` The terminal draws as before.
- **The hour** held: the scene shows that hour and not the clock's. Where the room's own drawing is
  the wall (the scene on and background.svg drawn) the hour changes nothing of it: the hour row is
  one dim line, `The room's own drawing is the wall; the hour does not change it.`, with no choice,
  and the bar and the dock keep one calm color whatever the hour.
- **Operator** or **Trace** hidden: the Lens card and the head have no button or tab for it; Public
  always stays. Trace is hidden until Settings shows it.
- **Shows**: "Gates and questions" (the default) keeps the Operator's feed to the cards where an ask
  first shows, a gate or an input form; "Every card" is the feed of 0.5.0. With cards left out,
  one quiet line says how many ("3 cards with no question are not shown", of the cards the pane
  has read) and a Button, Show every card, sets the setting to every card. Cards not read yet may
  hide more, and "Show N older" counts those apart from the ones the setting hides. The terminal's
  feed draws the same line and Button.
- **On open**: "The desk" (the default; a file written before the desk says `seat`) opens the pane
  on your desk, in the small terminal too where a key has not been pressed; "The room" on the
  level up.
- **Date** and **Clock**: the file keeps them, but the plate over the scene is gone from the app's
  place: the bar says the date and the time always.

This test host cannot draw the app branch of the cards, so the fake-kit tests read it.

### Keys

The section Keys, drawn by `keysView` of `views/settings.tsx`, binds five keys to the pane in the
Chat block of your own `keybindings.json` (in `~/.claude`, or in the folder `CLAUDE_CONFIG_DIR`
names). Each is `ctrl+x` and then one letter, typed at the prompt: `d` desk, `o` door, `s` shelf,
`b` back and `n` Nudge. They run the commands `room-desk`, `room-door`, `room-shelf`, `room-back`
and `room-nudge`, which the pane registers as immediate, so a key works at the prompt while the
session works and adds no turn. The first four open their place as the key line Buttons do, and
bring the pane up. `room-nudge` turns the Nudge of this pane's seat on or off and says what it did
(see Nudge).

The section says `set`, `part set` or `not set`, the line "From the prompt: ^x then d, o, s, b or
n.", and, when a key is missing, one Button, "Add them to your keys", with "writes N lines to the
Chat block of keybindings.json" under it. The file is read when the pane opens and when the
section opens, never on a timer. It is written only when you press that Button, because it is your
file, and only with the lines it lacks: a key you bound to another thing is named by its key and
what it is bound to ("ctrl+x b is bound to chat:bury there: not written.") and is never written
over. The pane keeps every other character of the file. A file the pane cannot read as
keybindings, such as one with comments or no list of bindings, gets one line and no Button, and
nothing is written. With no file the Button makes it. When the four keys of the key line are set,
the small terminal's key line begins with a dim `^x +`, as in `^x +  d: desk  o: door  s: shelf`.
The single letters stay hotkeys while the pane holds the focus.

### Nudge

Nudge (in Persian, هل بده) wakes this pane's seat at an interval. On each wake the seat recaps the
world as one feed card, and says one row to the owner of each thing that is stuck (what a wake does
is the seat's sheet, not the pane's). It is off until you turn it on, and each wake is one turn of
the seat. The pane holds no timer and no clock for it: the schedule is kept on the disc, and the
pane calls one verb to turn it on or off and to read its state. In a room found by its mark the
verb is `sandoq room nudge ROOM --seat SEAT`, from the sandoq release that has it; in the world of
the lab it is `salam/cli.py nudge --seat SEAT`. Both take `--every D` (30m, 1h, 2h, 4h or 8h), or
`--off`, and `--json` for one object: seat, on, every, fires, last and next. The seat is the seat
of the pane, so a pane at the room's own folder, which has none, has no toggle. A room found by
room.sh has no verb and no toggle.

In the bar the toggle stands at the right of the top line, with no new row: dim `( n: Nudge off )`,
and on a primary `[ n: ● Nudge 1h ]`. A press, the key `n`, or `ctrl+x n` (the command
`/room-nudge`, which says what it did) turns it on at the interval of Settings, 1h at first, or
off. It is left out where the line leaves it no room, as with the two target Buttons of an open
card at 54 columns. On a sandoq with no `room nudge` the verb answers usage, and the toggle is one
dim line, "Nudge needs a newer sandoq", with no Button.

In Settings the section Nudge, before Keys, is headed "Nudge · هل بده" with `on` or `off` at the
right. It says "Wakes lab every 1h: a recap, and a row for what is stuck.", the line `Every ( 30m )
[ 1h ] ( 2h ) ( 4h ) ( 8h )`, the Button "Turn it on" or "Turn it off", and "fired N times, last
TIME" (with " · ^x n turns it on or off" once the five keys are set). A press of another interval
while it is on sets it again; while it is off it picks the interval for the next turn on. The
state is read when the pane opens, when the section opens, after a press of its own and when a
turn of the seat ends (a wake), never on a timer and never in a draw. A read that fails leaves the
last state and says nothing. A press the verb refuses shows the verb's line whole, as a toast and
under the section, and changes nothing. The words of the section are a table by language (English
"Nudge", Persian "هل بده"); until the pane has a language setting the head says both.

NOT SEEN, said as the build knew it: a fire in a live room (the tests have a fake verb that keeps
the schedule as the real one does), and how your terminal draws the Persian word, which many
terminals draw unjoined or left to right.

### Versions

The last card of Settings, drawn by `views/versions.tsx`, is Versions. At once, with no process, it
says the pane's version and each disc of the room with its version, read from `discs.md` of the run
folder (the Settings place reads that file as it opens and at each poll while it stays).

In the desktop app the card is a table on the json form (sandoq 0.3.0 and later), in place of the
lines and the words "Update the pane" described below, which the terminal keeps. Its first line is
the pane, then each disc of the room, with the version here and there and a state word. The state
word is read from the state alone, never from an exit code:

- A wait (`would-update`, `would-install`, `would-swap`) says "update waits", in amber and bold.
- `refused` and the states that say a step did not run say their words in the error key.
- `not-checked`, `not-loaded` (the settings turn the pane off) and `no-claude` sort with the
  refusals, but nothing was refused: their word is in the default text, the `why` stands under the
  entry and no Button stands. The exception is `no-claude` with ok true (sandoq with no claude
  command on the path): its `why` is a bare name, the repository `sandoqnet/claude-plugin`, so the
  entry says its `line`, the in-app steps (add the plugin marketplace at the tag the pane pin
  names, install sandoq@sandoq from it, restart the app). The pane shows that line as sandoq wrote
  it: a sandoq from before the rename still writes a folder and room-pane@sandoq there. A record
  of an older sandoq, ok false, says its `why` as before.
- The quiet states `would-note`, `noted` and `kept` mean the bytes are a release's and nothing
  waits: the word is "current", with no line and no Button.
- A disc on hold (`on-hold`, ok true) is quiet too and counts with the current ones: no fault, no
  refusal. Its word is "on hold", dim, and its row holds the version held. Where `there` is not
  empty, one dim line under the row says `on hold at 1.2, 1.3 is newer.` For the room-seat disc
  (`there` is the two words the player's) it says `on hold at 1.2, the player's is newer.` No
  Button stands on it yet.
- `installed` of the pane says its own word, with the line of what is left (the pane's
  `Open a new session to load it.`).
- `restart` of the pane says its own word and, under its entry, what to do, drawn from the fields
  `state`, `here` and the move note, and not from the `line` of sandoq: `Updated to 0.8.64. Open a
  new Claude session to use it.` In the default ink. The inner steps of the move (the marketplace
  removed and added at the tag, the install) are not said. Only where the move note came (the
  `why` or the `line` says the pane moved) one short dim line follows: `Options set by hand are
  set again in the plugin's settings.` The run's own `Open a new session` line is not said again.
- The old plugin of the pane (`old-plugin`, sandoq 0.4.0) is no entry: its `why`, else its `line`,
  is one dim line under the table.
- The notices of the pane step of a sandoq that knows the marketplace sandoq (`removed-old`,
  `would-remove-old`, `left`) are no entry either: their `line`, else their `why`, is one dim line
  under the table. `would-move` is the pane's own entry: its word, its `line` under it, no Button.
  After a move the `restart` says to set the options by hand again (see `restart` above).
- Any other state, one the card does not know too, says its own words with the dashes as spaces
  and has no Button. What `why` or `line` says stands whole and dim under the entry, wrapped and
  never cut: of the home folder only the start of a path is a tilde, each command is as written.

A Button stands only where a press does something: "Update" on a disc that waits, and on the pane's
line while it waits (`would-install`, `would-update`) or its state is not known (`unknown`, sandoq
0.3.0). With no rows from the host the table takes no limit and is not paged. Under a door of the
unit that would restart, the labels are
"Update, restart door" and "Update all, restart door" ("Update all" stands where two discs wait).
No Button of a disc stands under a door that runs in a terminal; one line says to stop it there. A
Button's label is never wider than 30 cells. While one command runs one line says so and no Button
of an update or a check stands. After a run one plain line says what is left, and what sandoq said
is folded behind "Show N lines". A refused run says "Update refused, exit N." with its true code.
With no sandoq found the table stands at rest and one line says so, in the place of "Check now".

The terminal draws the lines as they were. The rest of this section is its card and the commands
both run.

A Button, "Check now", runs two checks, and only these: `sandoq update --check --json` and
`sandoq room update --check --restart --json`, the second in the room's folder. Each is one process
with its own limit of 150 seconds. The word `--check` is in each argv: these two update nothing.
The flag `--json` makes each print one object a line, read by `hooks/model/steps.ts` (sandoq 0.3.0
and later); the flag `--restart` makes the second say what an update would do to the door. They run
on that press alone, never in a poll and never at a draw. The words of each command, and its limit,
stand once each: the argv functions and `limitOf` of `hooks/host.ts`.

- While they run the card says "Checking…" and holds no Button.
- After them the card says "Checked at HH:MM" and shows, under the name of each check, the lines
  sandoq said on its out, whole and scrubbed as each line of the room is (past 40 lines it says
  how many more), whatever the exit code. A check that passes its limit gives one plain line.
- What each exit code means, read by the code alone (no word of a line is matched):
  - Exit 0: each component is up to date. The head says "Each is up to date." It says none where
    the out holds a `no-claude` step with ok true: the pane was not checked, and its line says the
    in-app steps.
  - Exit 1 with lines on the out: something is behind (an update waits, or a part was not read).
    The head says "An update waits, or a part was not read. See the lines." This is no refusal.
  - Exit 1 with no line on the out: a refusal. The card shows the last line of the err, scrubbed.
  - Exit 2: usage. One plain line says that the pane's command was not taken.
- The answer is kept in the session's memory; a new session starts at rest.
- With no sandoq found for the room the card says so and holds no Button.

On the pane's own line of the card a Button, "Update the pane", runs `sandoq pane update --json`:
one process, by spawn, with a limit of 1800 seconds, from the folder the pane runs in. A disc of
this room is updated by `sandoq room update --json NAME` (with `--restart` before the name when the
check said the door of the unit would restart), never by `sandoq disc update`, which brings the
machine's disc. Limit of a room update: 1800 seconds, and with `--restart` 1200 seconds more for
each disc that waits. The third is sandoq's own, `sandoq update --verified --json` (sandoq, the
player, the discs and the pane, in that order, with the sign asked for so that only a signed
release installs, and the limit three times that of an update): it runs on the Update of the band
for a new sandoq alone (his word, Q282), from sandoq 0.4.43. The three are the only updates the
pane runs: any other argv that holds the word `update` holds `--check`. Each runs on its press
alone, never in a poll and never at a draw.
The update of the pane changes nothing of the room and stops no door. No run of the card goes by a
process run with a limit over 30 seconds: the checks go by process run first and once by spawn
after the app's cut, the updates go by spawn.

- While it runs the line says "Updating the pane" and no Button stands.
- After it the card shows the lines sandoq said on its out, whole and scrubbed as those of a check
  are. With exit 0 one plain line stands under them where the steps say it (their `after` word,
  as the table's press does): "Open a new session to load it." A pane with no claude, or one that
  is up to date, loaded nothing, so no line stands. A sandoq that printed no json form has no step
  to read: its exit 0 says the line.
- With exit 0 and a pane step in the state `restart`, its `line` is not among the lines: the card
  says `Updated to 0.8.64. Open a new Claude session to use it.` in the default ink at its place,
  then the dim options line where the move note came, and not the plain line a second time.
- The names of the card (the pane and each disc of the lines form) are the default ink, as the
  versions are, and not the dim one.
- Exit not 0 with lines on the out shows the lines, and one plain line under them with the code:
  "It exited 1. See the lines." It is no refusal, and no restart line stands.
- Exit not 0 with no line on the out is a refusal: the last line of the err, scrubbed. A line of the
  err that begins with `progress: ` (lower case, a colon, a space) says how far a run is and is no
  reason: the pane drops it wherever it reads the err for a reason, a note or a toast.
- A stream that ends with no code and no line on the out: one plain line says "The update ran; the
  pane could not read what it said.", and the pane runs the first check, `sandoq update --check`,
  and shows its lines under it.
- Past its limit one plain line says that the pane does not know whether it was updated, that
  sandoq may still be at work, and that `sandoq update --check` tells where it stands. The pane
  leaves the run going.
- With no sandoq found there is no Button.

The pane cannot say whether the desktop app asks the person before it runs a new argv of sandoq:
the fake host that tests it never asks.

### The update flow

An update that waits is said once, in any place (order PF1, Ardalan's Pane flows). What waits is
read from two things the pane already has: the open ask of an offer on the walks, and the steps of
the last Check now. Every version in it is one of them gave: a wait with no version read is no
sign, and with no read there is no number. A disc the ask names that the room plays at that
version, or that an update of this session took in, is no sign (the ask stays open on the walks).

- **The band.** At the top of the card in any place but two (the Room place and the Versions
  section of Settings, which say an update in their own words): `Waits for you · NAME VERSION is
  ready.` with `What changes ›` where the offer has one page, Not now and Update. It holds the
  versions alone: the update read has no release notes. It is as wide as the card of its place in
  every stage, so it does not jump as a run moves. Its rows are counted in the canvas a place
  pages to, so nothing scrolls.
- **The bar and the dock.** The bar says `1 update` or `2 updates` after the count of waits, and
  `updating` while a run goes; the Settings word and tile of the dock hold a dot while an update
  waits (skipped ones too), runs, or failed. The dot stands in the cell the word keeps spare, so
  no width or row of the dock moves. The terminal says the count in its status line.
- **Update** runs the Versions table's own press: `sandoq pane update` for the pane,
  `sandoq room update NAME --json` for one disc, the same with no name for more than one (the pane
  first, then the discs). For a new sandoq it runs `sandoq update --verified --json`, which holds
  the pane too (the sign is asked for: no flag skips it); the discs of the room follow it. A
  sandoq under 0.4.43 has no such word, so its sign says the version and has no Update. Update
  taps nothing on the ask: the door would write that choice for the next start of sandoq, which
  could take an older sha than the one now in.
- **Updating.** The steps are read as sandoq prints them, on the pieces of the stream (an event
  of the run, never a clock): each object it printed is a step done, its own line, with `✓`, the
  last three; the newest `progress:` line of its error out stands under them with `●`. No bar is
  drawn: sandoq gives no fraction to fill one by. No Cancel: the pane cannot stop a running
  update, and the band says so.
- **Done** says `NAME VERSION is in.` and the step's own after word where it has one (`Open a new
  session to load it.`), with OK. **Not updated** says sandoq's own line (the last line of its
  error out, else the first step that was not ok), with `Settings ›`, Not now and Try again, which
  runs the same press again. A run that ends with no code says `Not known`: the pane does not
  know whether it went in.
- **Not now** sets what waits aside in memory and taps `Not now` on the ask as it always did. No
  band stands; the dot stays; the Versions card lists each as `NAME VERSION skipped` with its
  Update, and says that nothing asks again on its own. On a short pane the list is its rows
  alone, with no note, so the table keeps its room. A session start forgets it.

The Update of the band and the Update of the ask in the Room place differ: the first runs the
update now, the second is the tap of the card, which sandoq takes at its next start. The Update of
an offer made while no check was read runs without the restart flag the door of a unit may need:
Check now first says it, as it does for the table.

## The three lenses

The pane has three lenses (the Lens card of Settings in the app, the tabs of the head in the
terminal). The public lens is the first, and it is the seat
face alone (PaneSeat): this seat's face, or another seat's, or the level up, as the nav says, and
nothing else. No feed, no strip, no "Show N older". The one card of this seat's oldest wait has its
title and age, who asks, its words, why it waits, then its acts: the picks (the pick the room leans
to is the primary one), "Not now", and "Read the step ›", which opens the card under Operator; a
form has its Input, holding the draft of a seat when there is one. Above it each wait you answered
in the last 10 minutes is one line; "Answered today N ›" opens today's answers whole and a second
press folds them. With no wait one card says so. The app has no composer: your words go in the
session's chat box. The door stands in the tray of the bar, and what waits on this seat in the
count of Letters of the dock; on the level up the seats that wait count on Seats. The letter lies
on the sill of the scene while THIS seat has an open wait, not any ask of the room. This host
cannot draw the app branch, so the app branch is checked in the app itself.

- **operator**: the walk panel. Under it Shows decides which cards stand in the feed (see Settings).
  Each card that is not open is its head line (its id, a chip, its
  wall time, its events and its blocks) and its words. The open card has the head of the node's
  walk panel (its id, when it ended, a chip in a small round box, wall, events, blocks) and four
  tabs, each with its count: **overview** (the card with its block tree, and under its words one
  machine line: the kind of its layout, who decided, the route, the rules, the model, the cost),
  **events** (one row an event: the time, the event, the seat that wrote it and a count),
  **blocks** (the trace lens) and **egress** (the layout that drew the card, and the table of its
  pieces). The header adds the faults and the cost. A banner names a warning, for example a key the
  door lacks. At the foot: the pane version and the discs that run.
- **trace**: the world in motion, the events tab of every shown card in one list. One row for each
  event, in time order, oldest first, so the newest is at the bottom: the time, the event, the
  first words of its card and a count. The events are a card in, the act, the ask, the route, a
  reply with its cost and time, a keeper pick, a fault, a late call. A tap of yours that the door
  has not taken yet shows as "you tapped". A press on a row opens its card's walk panel on the
  events tab.

## The feed and its lenses

The feed is the newest cards of the gate, the open card first and open. "older" shows 8 more. A
card is drawn as the node draws a message: its id at the left of its top line and its age at the
right, a dashed rule, then the words of the card in a round box labelled TEXT, a quiet line (the
act, who decided, the route), and the room's answer. A voice card says "the room is listening"
until its transcript stands; a reading of a file (a caption, a transcript, a watch, an extract) is
a box of its own with its label. A card that is not open is its top line, its box of words and a
short answer. An open card has three lenses on the public lens (the operator lens has the tabs
above):

- **news**: the card as a person reads it: the words, the sentence the room made of them, the
  pieces, the answer. This is the first lens.
- **walk**: the block tree. One line for each block, a thin bar at each indent, then a glyph (a
  press shows the block as written), the chi in bold, then "::che::cho", the form "(N,K)" and the
  count of blocks under it, quiet and cut at the end of the line. The words hang under the root, a
  reading under its file, and under the route the pieces of the sentence, one line each with its
  form, then the answer.
- **trace**: one row for each block, with its form, depth, time and a bar for where it sits in the
  card's time. A press on a row shows its block as written.

## The turn and the composer's targets

When the open card has an ask that waits, the pane draws the turn: one row for each candidate (its
line and how many cards name it), then "new" and "none". A press answers the ask. If the keeper was
asked, one dim line says so and the buttons stay.

The composer (in the terminal at the top, over the place; the app has none) has one line that says
whom your words go to:

- **A card with an ask**: the words answer that ask. Type `new`, `none` or the name of exactly one
  candidate. Other words send nothing; a toast says the choices.
- **A card with no ask**: two buttons, "to the room" (a new card, the first) and "to this card" (a
  reply). A reply is a card that says which card it answers.
- **A letter opened from the desk**: two buttons, "to the room" (the first) and "to the keeper on
  this card", a line to the keeper in the chat of that card (see Your desk).
- **A profile**: the words are about that record. On the profile of Mina, "she is the one Kai
  sends the notes to" is a card about Mina.
- **Anywhere else**: a new card to the room.

The target goes back to the room after each send and when another card opens. A reply and a say
about a record need a local room (a room.sh). In a world room, or with no room, the composer says
to the room alone. If the room refuses the card (the card or the record is not there), its line
shows in a toast and nothing is sent.

## The profile and the shelf

The place "Shelf" of the dock (in the terminal the "Shelf" tab, or the key `s`) opens the shelf as a
place: the asks that wait for you, your rules, what was answered today, and the first items of the
shelf ("N more ›" lists the rest). A row of an item opens the profile of one record. A profile has
four parts: about (the roles the record has had, each with the card it came from and its age),
connections (other records; a press opens one), moments, and references (the cards that name it; a
press opens one). Records of one name are told apart by a line. "‹ room" goes back to the feed.

The gate's acts run the room's own scripts in a local room, and the pane writes no room file. Your
send of a seat's draft as it was is `tap.sh` with `--draft` and the draft's id; the words you
changed are the plain tap. "Ask me next time" is `rule.sh off` of the rule the card names, and the
card then says "Taken off" (the pane keeps the rule in memory, and the rule leaves the shelf's list
at once). "Add a rule ›" opens the composer on the target "A rule" (in the app, a card of the
canvas with the Input alone); its send is `rule.sh add` with your words. `rule.sh` needs a card
word to name its inbox file, so the newest card carries the rule; a room with no card says so in
a toast. Your rules are read from `rules.md` of the room shelf.

## Files on the shelf

A shelf holds records and files. In the app the room's shelf ends with a part "Files": a group a
seat, newest seat first, as many groups as the pane's rows hold, and a foot ("a file opens in the
room app", "N more seats ›"). A group is the seat's name, its count of files and "N more ›" when it
has more than three, then THREE lines that never change in number: the file's name, its size and
its day, newest first. A file a seat put on the shelf for another to read has the word `put`, a
missing line is a dashed one, and so the card does not move with the count. A file after the time
you had seen when the shelf opened has a small dot. A press on a file opens it in the room app
(`sandoq room open NAME file SEAT FILE`), "N more ›" lists that seat's files there (`... files
SEAT`) and "N more seats ›" lists every seat's (`... files`). The pane reads no shelf file and walks
no folder: it runs `sandoq shelf list --json` and `sandoq shelf list SEAT --json`, only while the
Shelf place is open (the lists of six seats at most, one again only when its seat's count or newest
time moved), and no clock of its own. It needs sandoq 0.4.22; under it the part is one line that
says so. The part is never blank while the Shelf is open: no sandoq found, a version that sandoq did
not say, did not answer in time or did not run is one dim line too, and a version read that gave
none is not kept, so the next read of the Shelf asks again. A refusal of sandoq is its line, shown
whole. The terminal's shelf place has no Files part.

A seat's shelf (a press on the seat's name, or on its box in the Shelves row) is ONE list of its
records and its files by date, newest first, under the head of each day (Today, then the day as a
record's age is said). Each line has a word: record, file or put (a theme and a told row say theme
and told, and the theme on the wall says `in use`). The head counts "R records · F files". The
lines pass the rows in whole pages under the pane's pager, as the planks did (the head of a day is
a line; a page that starts inside a day draws that day's head again, and the number after a head
is the whole day's). The foot says "records open here, files in the room app" and, when the CLI
listed fewer files than the seat has, "N more ›" for those past the list, which opens the seat's
files in the room app; with none past, the foot has no press. A record, a theme or a told row
opens as it did on the planks. The way to another seat's shelf is the room's shelf: the head of a
seat's shelf goes back to it. Nothing scrolls.

## The Room place

Under Operator the Lens card of Settings has a Button "Room" (in the terminal the tab row has
"Door" beside "Shelf", in every lens, and the key `o`); Public has no way in in the app. It opens
the Room place, with "‹ Back" on top, and in it
stand who sits, what it plays (with the update that waits, "Update" and "Not now"), the door, the
programs running and what the room has grown. In the terminal there is no composer here.
`discs.md`, `logs/tick.md`, `cache/programs/*.md` and the listing of the shelf are read while the
pane is on this place alone, as it opens and at each poll after; the poll of the feed reads none of
them, but it reads `seats.md` and the walks, as the seat face and the level up need them. A file
that is missing leaves its section out, and the size at the right of "What it has grown" is the
size of the walks and the shelf as the folder listings give it (none when a listing gives no
size). "Who may do what ›" and "N more seats ›" open in memory and close when you leave the
place. "Update" and "Not now" are the tap of the card. "What changes ›" opens the page of the
update by the system's opener (`xdg-open`, `open`), for a web page alone; any other page is said
in a toast. "Put it up" starts the door as the pane does at its start, and a room with no door
program says so. In the terminal the same place is a column, opened by the tab "Door" or the key
`o`.

In the app the place is the room card: a press box a row, Door, Seats and Shelf in each lens, and
in Operator What it plays, Versions and Folder too (Folder says the last two parts of the folder
and is no press). Door opens its card: the door's state, the last tick, the day, the programs
running, what the room has grown, and "Put it up" while the door is down. Seats opens the level
up, Shelf the shelf and Versions its section of Settings. What it plays lists the discs once,
paged by the one rule of the press box, with the update that waits above them; with no check made
it says the count and offers one box, "Check for updates". A state word of a disc and "all
current" stand only after a check, with its hour. Each Back says where you came from ("‹ The
room"). From 128 columns the room card stays at the left with the pressed row open. A seat under
Operator holds one row, "Plays" with the room's count of discs, that opens the same list with Back
to that seat; the Runs card and its hashes are gone. Versions holds one link, "What it plays ›".
The terminal keeps its column (Who sits, What it plays, The door).

## The feed of the room

The room keeps a feed: `feed/GATE.md` of the run folder (GATE is the gate of the room), append
only. Each entry (`SAYER / { feed::KIND::entry }`, KIND his, row, answer or memory) is written
before the door asks where it goes; its answer (`@ID / { feed::door::answer }`) comes later and
holds `to` (desk/cards, desk/toasts or none), the card's word, the rule, or the fault. The pane
reads the file at each poll, by size and time, and writes nothing beside it. The parse stands in
`hooks/model/roomfeed.ts`.

In Operator the room card has one row more, "The feed", with the count of the entries. It opens
the feed card: the entries newest first, a row each, with who said it and its kind (`mara · row
41`), where the door sent it (cards, toasts, none, the fault, or no answer yet) and the first line
of its text under it, cut to the row. It is no press, and it never scrolls: it pages by the one
rule of the press box.

An answer whose `to` holds desk/toasts is one toast, once by its id: WHO is the entry's sayer and
the line is its text, cut to 72 columns. A text that opens with the sayer's name and a colon
(`mara: ...`) loses that head, so the name is said once. Where the answer holds `on` (the first
line of what the entry answers, 60 characters at most) the toast reads `mara on the poster:
words`; with no `on` it is `mara: words`. The words come first: `on` is cut at the end so that
at least 24 characters of the words stand, or all of them where they are fewer. Two or more in
one read fold to one toast, "desk: N new, waits on you, newest from" the last sayer alone, as
the desk's items do. A run of faults is one toast, "the feed door failed: WHY". The first read
of the feed only seeds: the answers already there at the pane's start ring nothing. Nothing is
kept in a file.

A name ask of the keeper says why. Its fence holds `from` (who said the words that hold the name:
a seat, or `you`), `seq` (the number of its row, only when the card has one), `quote` (the line
that holds the name, 120 characters at most) and `means` (one line for each of its `choices`, in
the same order). The letter shows "From mara, row 41", the quote, and each choice with its line
under "Waits for you". With no `means`, or a list not as long as `choices`, the choices stand
alone, and the pane has no words of its own for them. An ask with a `quote` is no question of the
seat in `from`: that seat is who said the words, not who asks.

## The look

The pane draws with the borders and the colors of the host's kit, so it follows your Claude Code
theme, light or dark, with no switch of its own. Each color is a theme key of the host, never a
hex; the keys and the border styles stand in one file, `hooks/views/look.ts`, and a view takes its
looks from it alone.

Two voices. Your words and the room's answer are in the theme's text color. Every line of the
machine (ids, ages, labels, the act line, the machine line, forms, counts, costs, the status line)
is the theme's quiet color, never bold and never dim. Chi names are bold.

One accent. The accent is for what is open or opens: the boxes of the open card, a person piece,
the arrow of "2 wait for you ›", "● live", the shown tab or lens (the primary Button). Signals are
rare: the warning color is a held card on the operator lens; the error color a fault on the
operator lens ("failed 1", a fault line); the success color is the dot of the header, lit while a
door runs, and nothing else.

- There is no frame round a card. The frames are the boxes of the node: the TEXT box and the egress
  box (and a reading box) are round, in the accent on the open card and in the plain frame on the
  others. A dashed rule of ┄ stands under the head of a card and twice in the header. It is a fixed
  56 columns, whole in a pane of 60 and cut with "…" in a narrower one: the kit gives a Text no
  width to fill, and the host refuses a Box with one border edge ("borderTop is not allowed"), so
  the rule cannot take the width of the pane.
- The lens switch (news, walk, trace) is the egress box's, at its foot, drawn by the slot on the
  open card; the card draws none of its own. A card at an ask, or with no route yet, shows its
  state line alone and so has no switch.
- The pane in the terminal has two layouts, and one function (`terminalSize` of
  `hooks/views/frame.tsx`) says which: SMALL where the body has fewer than 16 rows, or fewer than
  40 columns, else WIDE. Rows decide first: his pane is a dock at the side of Claude Code, 54
  columns by about 38 rows, and that is WIDE. SMALL is the capture bar and ONE key line under it:
  `d` desk, `o` door, `s` shelf, each a plain Button whose hotkey is that letter. A key opens that
  place under the bar, and while a place is open a fourth Button, `b` back, ends the key line and
  returns to the bar and the key line alone; the letters you type in the bar stay letters. The
  small desk draws its items and the pager alone (no piles row, no head, no Answered line), so one
  item and the pager stand in a pane of 10 rows, and the small Shelf draws no section heads. WIDE
  is, from the top, the capture bar; one tab row, the same on every place: "Desk N" (N what waits
  on you), "Shelf" and "Door", the open one the primary Button and the others dim, then, dim,
  Settings and the lens tabs; the place; one status line. It opens on the desk. The tab row is ONE
  row at every width from 40 columns: Desk, Shelf and Door always, then as many of Settings and
  the lens tabs as stand whole. What the row leaves out is reached from a place: Settings from a
  Button at the end of the Door, a lens from the Lens line at the top of Settings (the small
  terminal has no tab row, so it has both always). "Back to SEAT" stands first in the tab row only
  where a place deeper than a tab is open (`Back`, or `‹` alone, in a row that cannot hold them).
  Back goes to the place it came from (`terminalBackOf` of `hooks/views/pane.tsx`): Settings
  opened from the Door says "Back to the Door", from the Desk or the Shelf "Back to the Desk" or
  "Back to the Shelf", and a section of Settings with no place behind it "Back to Settings"; any
  other place goes back to this seat's face. The key line's `b` goes the same way.
- A Button is counted as the host draws it in the terminal: "[ label ]", the label and four cells
  (`BUTTON_CELLS` of `hooks/views/cells.ts`), and a plain one with a key as "d: desk". The fit of
  every row, pile, foot, tab row, key line and pager counts so, and the pane marks the kit it
  draws the terminal with (`asTerminal`), so the app's Buttons keep their own count. No line wraps:
  a row of the desk is its title cut to the frame, with its Done and its age at the right, and
  one dim line under it. The rows of the terminal are the body's own that the host tells (its
  `scroll.bodyRows` less one, however few: an inline pane has a body of a few rows whatever the
  terminal holds, so it is SMALL); the viewport's rows judge only where the host tells no body, and
  a host that tells no rows is SMALL (`terminalRowsOf` of `hooks/views/frame.tsx`). The terminal
  pages to the rows the host tells (no floor of 24): a body
  longer than its rows is paged ("N more ›", "‹ Earlier"), and EVERY place pages: a place that
  does not fit whole is cut into its parts and paged under one row of links
  (`hooks/views/termpage.tsx`). The line "This place needs N rows" stays only where not even one
  part stands with the links. Nothing scrolls.
- The bar of the terminal has the same rows empty and typed in (`BAR_HEIGHT`), so the rows under it
  never move as you type. A body too short for the bar and the key line (under 6 rows) draws the
  key line alone, one row, so a key still opens a place when the dock is opened bigger. The keys
  are the pane's while it holds the focus. The kit gives a pane the focus when it opens
  (`$.ui.open` with `focus: true`), and in the terminal the pane asks for it at each opening, but
  the host judges the request (a remote surface refuses it while the prompt holds text or is
  busy; the terminal's way is not seen). Where the prompt keeps the keyboard `d` goes to the
  prompt, and the person moves the focus with the host's own key (ctrl+x Tab). That move is the
  host's, not the pane's. The app asks for nothing: its chat box keeps the keyboard.
- The piece table of the egress tab is two columns: the role, in a column as wide as the longest
  role and no more than 14, then the rest. What runs stands quiet at the foot, in a frame.
- The status line of the wide terminal, at the foot, is a dot lit while a door runs, the path "ROOM
  › SEAT", then the door as the band does, then what waits on you, counted as "Desk N" counts it
  (the letters, the keeper's picks and your open items); under Operator and Trace
  the count of cards and the cost (the faults too under Operator). The app has none: its bar says
  the door and its dock says what waits.
- The band above the prompt skips a card the session bridged (its root names a session) and shows
  the newest card of the room. It says first what waits on you, counted as "Desk N" counts it
  ("nothing waits on you", "N waits on you"); it said the records of the shelf, which are no part
  of the desk (`room · 0 records` over a desk of three).
- The seat part of the band. From sandoq 0.4.45, a folder whose room and seat the pane knows (the
  room by its mark, the seat by seats.md) has the band say `SEAT · seat open · 2 rows wait · 1
  waits on you`: `seat open` or `seat shut`, then `N rows wait`, `1 row waits`, `no rows wait`
  (`N+ rows wait` when more wait than the peek counts, and no rows part when the peek could not
  count), then what waits on you. It stands in place of the newest card's preview. The late, need,
  door and waiting-card lines stand before it (a card that waits for a tap names the ask he must
  tap, in its words), so the seat part shows when no card waits for a tap. A folder with no mark,
  as a lab seat's worktree has, knows no room: there the pane finds the sandoq for the session's
  folder, and when it is 0.4.45 or later runs `sandoq room peek --json` with no flags, which reads
  seated.json for the folder; the room and the seat are taken from the answer, and an answer of
  `open` false that names no seat leaves the band as it was (no waits part stands, the pane has
  read no desk there). A peek kept for a seat stands for that room and seat alone: when the pane
  comes to know another seat, or a room is made in a folder that had none, the kept peek shows no
  more, and the next event reads it again. Under 0.4.45, with no sandoq, no seat known, or a peek
  that does not answer in json, the band is as it was. The pane reads
  `sandoq room peek --json --room ROOM --seat SEAT` (it writes nothing and moves no cursor) on
  events alone: the session start, a prompt, a turn's end, `/sandoq open` and `/sandoq shut` (and
  the same words after `/room`), and the wake's hand-over of rows. The poll of two seconds never
  reads it and a draw reads nothing; an event while a read runs asks one more read after it.
  `/sandoq:seat-open` and `/sandoq:seat-shut` run the plugin's seatwake.ts and give the host no
  command event: the next prompt or turn's end reads the seat then.

Left out: the fonts of the mockups (a terminal draws the one monospace font you chose; the plugin
cannot set it), the round avatar of a person (the kit draws no circle and a terminal cell is
square), the VOL bar, the MODE icons (the lenses are words), the filter line and the flat or tree
switch of the events tab, the publish buttons, the url piece (the room has none yet), and an
underline on the shown lens (a Button takes no underline, so the shown lens is the primary Button).

## The room's layouts

How a card is written as a sentence with its pieces comes from layout files. The pane carries none.
It reads the room's own in `shelves/room/egress/`, then each disc's `egress/`, room-seat last; a
room file wins over a disc's of the same kind. With none, a fixed card draws and the operator line
says so. The file format is in [egress/README.md](egress/README.md).

Which discs the room has is told by `sandoq room discs`, run in the room's folder with no flag; it
writes nothing and its out is one line, one json object whose `discs` is the list of names in the
order the door lays them. The pane makes this call once at a session start and once more after an
update run ends (the next read of the room makes it), never at a poll or a draw. The list stays in
memory and a session start forgets it. An empty list is an answer: the room has no disc, and the
pane does not read the class file. On any exit that is not 0 (an older sandoq says usage with 2, a
room not born or with an older room-seat disc is refused with 1), on an out that is not that shape,
on a call that throws, and on a call that does not answer in 3 s, the pane falls back to the discs
block of `shelves/room/class.md` and says no fault. A room with no sandoq makes no call.
