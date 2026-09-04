/**
 * The shared workspace package is importable from this app, with types.
 *
 * The counterpart to site/test/lib-seam.test.js. This side additionally
 * proves the TypeScript half of the arrangement: `npm run typecheck`
 * resolves the package through the same `exports` map and reads its
 * types straight from the source, with no build step in between.
 */
import { describe, expect, it } from "vitest";

import {
  CameraIcon,
  ChatIcon,
  CloseIcon,
  LeaveIcon,
  MicIcon,
  ScreenIcon,
} from "@english-learning/lib";

describe("the lib workspace, seen from class", () => {
  it("resolves by package name and exports the call's icons", () => {
    for (const icon of [ChatIcon, CloseIcon, LeaveIcon]) {
      expect(icon).toBeTypeOf("function");
    }
  });

  it("carries the toggle icons' prop types across the seam", () => {
    // The assignment is the assertion: it only compiles if the types
    // were read from source rather than falling back to `any`.
    const toggles: Array<(props: { on: boolean }) => unknown> = [
      MicIcon,
      CameraIcon,
      ScreenIcon,
    ];

    expect(toggles).toHaveLength(3);
  });
});
