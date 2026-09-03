import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NO_INITIAL, firstGrapheme, initial } from "../lib/initials";

describe("initial", () => {
  it("takes the first letter of a name, uppercased", () => {
    expect(initial("aloisio")).toBe("A");
  });

  it("leaves an already-uppercase name alone", () => {
    expect(initial("Bianca")).toBe("B");
  });

  it("ignores leading whitespace rather than returning a space", () => {
    expect(initial("  Marta")).toBe("M");
  });

  const empty: Array<[string, unknown]> = [
    ["an empty string", ""],
    ["only spaces", "   "],
    ["only a tab", "\t"],
    ["undefined", undefined],
    ["null", null],
    ["a number", 7],
    ["an object", {}],
  ];

  it.each(empty)("falls back for %s", (_label, value) => {
    expect(initial(value)).toBe(NO_INITIAL);
  });

  /*
    The three cases below are why this is a module rather than
    `name[0].toUpperCase()` inline in the component.
  */

  it("keeps an emoji whole instead of rendering half a surrogate pair", () => {
    // "🙂"[0] is a lone high surrogate, which renders as a replacement
    // character rather than a face.
    expect(initial("🙂 hello")).toBe("🙂");
  });

  it("keeps a combining accent with the letter it belongs to", () => {
    // "Ángela" written decomposed: "A" followed by U+0301.
    const decomposed = "Ángela";

    expect(initial(decomposed)).toBe("Á".toLocaleUpperCase());
    expect(Array.from(initial(decomposed))).toHaveLength(2);
  });

  it("keeps a flag emoji whole", () => {
    // Two regional indicator code points that render as one flag.
    expect(initial("🇧🇷 Brasil")).toBe("🇧🇷");
  });

  it("handles a name that is only punctuation without throwing", () => {
    expect(initial("!!!")).toBe("!");
  });

  it("keeps the empty case away from firstGrapheme", () => {
    // Stated as a test because firstGrapheme's fallback depends on it:
    // everything reaching it has already been trimmed and rejected empty.
    expect(initial("   ")).toBe(NO_INITIAL);
  });
});

/*
  firstGrapheme is feature-detected, and the detection is the point: the
  fallback exists for a runtime without Intl.Segmenter. Node has it, so
  the only way to exercise the path is to take it away — simulating the
  environment the detection is there for, which is not the same as
  mocking the function under test.
*/
describe("firstGrapheme", () => {
  it("returns the first grapheme, accent and all", () => {
    expect(firstGrapheme("A\u0301ngela")).toBe("A\u0301");
  });

  it("returns NO_INITIAL for an empty string", () => {
    // Unreachable through initial(), which is why it is asserted here.
    expect(firstGrapheme("")).toBe(NO_INITIAL);
  });

  describe("where Intl.Segmenter is missing", () => {
    let original: unknown;

    beforeEach(() => {
      original = Intl.Segmenter;
      delete (Intl as { Segmenter?: unknown }).Segmenter;
    });

    afterEach(() => {
      (Intl as { Segmenter?: unknown }).Segmenter = original;
    });

    it("falls back to code points", () => {
      expect(firstGrapheme("aloisio")).toBe("a");
    });

    it("still keeps a surrogate pair whole", () => {
      expect(firstGrapheme("\u{1F642} hello")).toBe("\u{1F642}");
    });

    it("degrades a flag to one regional indicator, the documented cost", () => {
      expect(firstGrapheme("\u{1F1E7}\u{1F1F7} Brasil")).toBe("\u{1F1E7}");
    });

    it("returns NO_INITIAL for an empty string", () => {
      expect(firstGrapheme("")).toBe(NO_INITIAL);
    });
  });

  describe("where Intl itself is missing", () => {
    let original: unknown;

    beforeEach(() => {
      original = globalThis.Intl;
      delete (globalThis as { Intl?: unknown }).Intl;
    });

    afterEach(() => {
      (globalThis as { Intl?: unknown }).Intl = original;
    });

    it("does not throw on the bare reference", () => {
      // `typeof Intl` rather than `Intl` is what makes this survivable;
      // reading the identifier directly would be a ReferenceError.
      expect(firstGrapheme("aloisio")).toBe("a");
    });
  });
});
