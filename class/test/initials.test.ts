import { describe, expect, it } from "vitest";

import { NO_INITIAL, initial } from "../lib/initials";

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
});
