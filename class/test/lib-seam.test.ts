/**
 * The shared workspace package is importable from this app, with types.
 *
 * The counterpart to site/test/lib-seam.test.js. This side additionally
 * proves the TypeScript half of the arrangement: `npm run typecheck`
 * resolves the package through the same `exports` map and reads its
 * types straight from source, with no build step in between.
 */
import { describe, expect, it } from "vitest";

import { linked } from "@english-learning/lib";

describe("the lib workspace, seen from class", () => {
  it("resolves by package name and exports what it says", () => {
    // Typed as `true` rather than `boolean`, which is only possible if
    // the declaration was read rather than inferred from a fallback.
    const checked: true = linked;

    expect(checked).toBe(true);
  });
});
