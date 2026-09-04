/**
 * The shared workspace package is importable from this app.
 *
 * site/ is JavaScript and lib/ is TypeScript, which is the one genuinely
 * awkward thing about the arrangement (07 §4). This asserts the seam
 * itself — resolution through the package's `exports` map, by package
 * name rather than by a path across workspace folders — so that a break
 * in it fails here, with a short message, instead of surfacing later as
 * a bundler error inside a page.
 *
 * It deliberately does not render anything. What is being tested is that
 * a JavaScript app can reach a TypeScript-and-JSX module at all.
 */
import { describe, expect, it } from "vitest";

import { AutoIcon, MoonIcon, SearchIcon, SunIcon } from "@english-learning/lib";

describe("the lib workspace, seen from site", () => {
  it("resolves by package name and exports the icons this app uses", () => {
    for (const icon of [SearchIcon, SunIcon, MoonIcon, AutoIcon]) {
      expect(icon).toBeTypeOf("function");
    }
  });
});
