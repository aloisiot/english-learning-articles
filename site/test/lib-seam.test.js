/**
 * The shared workspace package is importable from this app.
 *
 * site/ is JavaScript and lib/ is TypeScript, which is the one genuinely
 * awkward thing about the arrangement (07 §4). This asserts the seam
 * itself — resolution through the package's `exports` map, by package
 * name rather than by a path across workspace folders — so that a break
 * in it fails here, with a short message, instead of surfacing later as
 * a bundler error inside a page.
 */
import { describe, expect, it } from "vitest";

import { linked } from "@english-learning/lib";

describe("the lib workspace, seen from site", () => {
  it("resolves by package name and exports what it says", () => {
    expect(linked).toBe(true);
  });
});
