# Layout files: how a card is read

A layout changes the sentence that the pane draws for a card. A room owner can write one with no
help. A layout is one block of text: a notation line, a short fence, then one sentence. The same
block draws a card in the pane, on the node and in the disc docs.

## Where the files are, and the layers

- A layout file ends in `.md`. The name of the file does not matter. A file may hold one layout
  block or several. Text around the blocks is a note, and the pane does not read it.
- The pane looks at the layers in this order:
  1. the room's own files, in the run folder, in `shelves/room/egress/`;
  2. the files of each disc in the room's `discs` list (its `shelves/room/class.md`) that has an
     `egress/` folder in `unpacked/NAME/`. The later disc in the list is looked at before the
     earlier. The room-seat disc comes last when it has one and is not in the list.
  The pane carries no layouts for a card's sentence: this folder holds this README alone. With no
  layout in any layer that draws a card, the pane draws a fixed card, "The room read this card.",
  and the operator face names the lack as the layout `default from pane`. The one layout the pane
  holds is `task` (see the task layout below), a last layer under the room's and the discs'.
- Inside one layer, the first file by file name wins, and in a file the first block.
- The pane reads the folders again when a file changes.
- A block that cannot be read is skipped, and the pick goes on. The operator face names the bad file
  and the fault, for example `room layout open.md: unclosed brace at 10`.
- The old form, a file that starts with `---` front matter, is not read. It is one fault, `form`.

## The layout block

````
//////////////////////////////////sending/{ egress::frame::layout }//
```yaml
kind: "sending"
when: "frame sending"
```
You send {theme} to {recipient}.
````

- The notation line is
  `//////////////////////////////////NAME/{ egress::FORM::layout }//`. The first term, `NAME`, is
  the name of the layout: any name will do. `FORM` is `frame`, `act`, `kind` or `default`, and it
  is the form of the `when`.
- The fence has `kind`, the word the card shows above its sentence (it is required); `when`, what
  the layout draws; and `example`, which the pane keeps and does not draw.
- `when` is `frame NAME`, `act NAME` or `kind CHI::CHE::CHO` (the che may be `*`), with the names in
  any case. A layout of the form `default` has no `when`, and draws a card that no other layout
  draws. A `when` of another form than the block's `FORM` makes the block bad.
- The sentence is the lines after the fence, up to the first blank line, the next notation line or
  the end of the file. Text after a blank line is a note, and a brace in it is no fault.
- The pick for a card, in this order: first the card's root frame; then its act; then default; then
  the fixed fallback, "The room read this card." The root frame is the frame of the first verb that
  is not embedded in another verb. A verb is embedded when it fills a role of another verb, as
  `send` does in "remind me to send Kai the poster". An embedded frame never picks the sentence.
  Every layer is looked at in turn at each step, so a room file for an act does not win over a
  disc's file for the root frame of the same card.

## The sentence

The sentence is fixed words and pieces. A piece is a name in braces, for example `{theme}`.

- A name starts with a letter. It has letters, digits, `_` and `-` only, in any case.
- The lines of the sentence are joined, and each run of spaces is one space.
- The faults, one word each: `unclosed` (a brace that is not closed), `stray` (a closing brace with
  no opening one), `nested` (a brace inside a brace), `name` (a bad name), `body` (no sentence),
  `kind` (no kind in the fence), `when` (no when, a bad when, or a when of another form than the
  block's) and `form` (the old form, or no layout block in the file).
- A piece takes the first phrase of the card whose role is its name. If there is none, it takes the
  first phrase whose role is of the che that name, as the syntax disc's role blocks say:
  `{recipient}` takes an `addressee` or a `reminded` phrase. A role that is its own name wins.
- A layout of a frame takes its pieces only from the phrases of that frame. A layout of an act, and
  the default, take a piece from any frame.

## The piece kinds

| piece | public face | operator face, piece table |
|---|---|---|
| text | the fixed words | `fixed · WORDS · from the layout` (words with no letter or digit, such as the closing dot, have no row) |
| person | a button, `[K] Kai · person ›`; when two people have the name, the second word is the newest line of their profile; a press opens the profile | `ROLE · Kai · found · by one match` |
| document | the name, bold | `ROLE · the new poster · found · by one match` |
| thing | the name, bold (a record that is not a person and not a document) | `ROLE · NAME · found · by WHO` |
| said | the words as the card said them, plain (the phrase found no record) | `ROLE · WORDS · said, no record` |
| gap | `[ROLE]`, dim (no phrase of the card has that role) | `ROLE · not said` |

In the piece table, `found` is `new` when the answer made the record, and `WHO` is who decided, for
example `one match`, `you` or `keeper`. On the operator face the slot also names the layout, as
`layout sending.md from room`; a disc's file is named with its disc, as `layout lexicon/sending.md
from disc`.

## The frames and the acts

A frame is a verb of the card. Its roles, in order:

| frame | roles |
|---|---|
| sending | sender, recipient, theme |
| giving | giver, recipient, theme |
| filling | filler, goal |
| reminding | reminder, reminded, content |
| asking | asker, addressee, topic |

The acts that room-seat has a file for are `remind`, `report`, `question` and `held`. Room-seat's
`egress/` carries six files, the layouts a run folder has at `unpacked/room-seat/egress/`:

| file | block | when | sentence |
|---|---|---|---|
| sending.md | sending, form frame | frame sending | You send {theme} to {recipient}. |
| reminder.md | reminder, form act | act remind | A reminder for you: {content}. |
| question.md | question, form act | act question | You ask {addressee} about {topic}. |
| report.md | report, form act | act report | You report on {topic}. |
| held.md | held, form act | act held | The room holds this card for the seat. |
| default.md | card, form default | none | The room read this card. |

A card of the act `remind` whose root frame is sending, such as "I should send Kai the poster", is
drawn by `sending.md`, because the frame is looked at before the act. A card of the act `remind`
whose root frame is reminding, such as "remind me to send Kai the poster", is drawn by
`reminder.md`: its sending frame is embedded in the reminding, so it does not pick the sentence, and
the card is not drawn as a send that was done. The embedded verb fills the role `content`, so that
role has one phrase: the verb's words, then the words of its own phrases, said plain with no record.
The sentence is: A reminder for you: send Kai the poster. A person in the embedded clause is not a
button there. A card of the act `held` draws its sentence with no pieces, and no answer.

## The task layout

A prompt that the session's harness sends when a background task ends is a `<task-notification>`
block. The pane never draws that block: it takes the parts out of it and draws one line from a
layout named `task`. The card says "From the session" above the line.

````
//////////////////////////////////task/{ egress::kind::layout }//
```yaml
kind: "task"
when: "kind harness::task::notification"
```
{name} {status}
````

- The layout is of the form `kind`, with the taxonomy `harness::task::notification`. It is in the
  pane (hooks/model/task.ts, `TASK_LAYOUT`) until a program carries its own. A program carries it as
  a file in its `egress/` folder, in this form; the room's file wins over a disc's, and a disc's
  over the pane's.
- What a program hands the pane: this block alone. The pieces are the keys of the task: `{name}`
  (the first term: the summary of the notification, without the status word and what follows it),
  `{status}`, `{task-id}`, `{tool-use-id}` and `{output-file}`. A key the notification lacks is a
  gap, `[key]`, dim. The words around the pieces are the program's.
- The pane draws the `name` piece bold, in the text color. It draws the `status` piece in the ok
  color for `completed`, the fault color for `failed` and the dim color for any other status. Any
  other piece is dim.
- The card is this one line, closed and open. The ids and the output file are not in the Public
  lens: under Operator alone an open card shows them, dim, one line each (`task ID`,
  `tool call ID`, `output FILE`).
- The other tags of the harness (a reminder, a command's output) keep their plain card: the title,
  and the block whole, dim, when the card is open.

## The vectors

`tests/egress-vectors.json` is a copy of room-seat's `egress/vectors.json`: one list of cases, each
with its layouts, a card's reading or a block, and the pieces or the faults expected. The pane, the
node and the docs must give the same pieces for it. It is the contract, and it is never edited here.

## Example 1: room-seat's sending.md, as it is

````
//////////////////////////////////sending/{ egress::frame::layout }//
```yaml
kind: "sending"
when: "frame sending"
```
You send {theme} to {recipient}.
````

For the card "send Kai the new poster", the sentence is: You send the new poster to Kai. The poster
is a document piece, and Kai is a person piece, a button.

## Example 2: a room file that changes the words for the sending frame

Put this file in `shelves/room/egress/`, as `sending.md` or any other name that ends in `.md`:

````
//////////////////////////////////sending/{ egress::frame::layout }//
```yaml
kind: "sending"
when: "frame sending"
```
You pass {theme} on to {recipient}.
````

For the same card, "send Kai the new poster", the sentence is: You pass the new poster on to Kai.
The pieces are the same as in example 1: only the fixed words change. The card shows
`layout sending.md from room` on the operator face.
