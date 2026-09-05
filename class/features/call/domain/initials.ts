/**
 * The single character shown in place of a participant's video.
 *
 * Pure, and its own module, for the usual reason in this codebase: the
 * interesting part is the set of names that are not a plain ASCII word,
 * and those are worth asserting directly rather than through a rendered
 * component.
 *
 * The name a participant types is not validated anywhere — it is a label
 * on a video tile, not an identity — so this has to produce something
 * displayable from anything at all, including an empty string, a string
 * of spaces, and an emoji.
 */

/** Shown when a name yields no usable character. */
export const NO_INITIAL = "?";

/**
 * The first *grapheme* of a name, uppercased.
 *
 * Grapheme rather than code unit or code point, because the obvious two
 * implementations both break on real names: `name[0]` splits a surrogate
 * pair and renders half an emoji, and `Array.from(name)[0]` keeps the
 * pair together but still splits a letter written as a base character
 * plus a combining accent — turning "Ángela" typed the decomposed way
 * into a bare "A" with the accent orphaned onto the next character.
 */
export function initial(name: unknown): string {
  if (typeof name !== "string") return NO_INITIAL;

  const trimmed = name.trim();
  if (trimmed === "") return NO_INITIAL;

  return firstGrapheme(trimmed).toLocaleUpperCase();
}

/**
 * The first grapheme of a string, or `NO_INITIAL` if it has none.
 *
 * Exported because its contract is wider than `initial`'s: `initial`
 * never passes an empty string, so the empty case and the fallback below
 * are unreachable through it and would otherwise be untested defensive
 * code inside a module the suite holds at 100%.
 */
export function firstGrapheme(value: string): string {
  // Intl.Segmenter is in every browser this app supports and in the Node
  // version it is built with, but it is feature-detected rather than
  // assumed: falling back to code points degrades one emoji, while
  // throwing would take down the whole call UI.
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    for (const { segment } of segmenter.segment(value)) {
      return segment;
    }
  }

  return Array.from(value)[0] ?? NO_INITIAL;
}
