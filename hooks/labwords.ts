// The lab's words of /sandoq-dev. The pane that ships has none: labWordsOf says undefined for any words, and the pane runs nothing here. The real file is
// tracked at .kairos/devpane/labwords.ts, and .kairos/devpane/refresh.sh copies it over this one in the dev copy alone.
// What it gives: the argv to run from the project root, or the one row that refuses the words; undefined when the words are no lab word.
export type LabWords = string[] | { row: string }

export const labWordsOf = (_words: string): LabWords | undefined => undefined
