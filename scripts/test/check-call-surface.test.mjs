import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  BOUNDARY,
  STYLESHEET,
  callSurfaceOf,
  tokensUsedIn,
} from "../check-call-surface.mjs";

describe("callSurfaceOf", () => {
  it("returns everything from the banner onwards", () => {
    const css = `.page { color: red }\n/* ${BOUNDARY} */\n.stage { color: blue }`;
    expect(callSurfaceOf(css)).toContain(".stage");
    expect(callSurfaceOf(css)).not.toContain(".page");
  });

  it("returns null when the banner is missing", () => {
    // A stylesheet with no boundary cannot be checked, and silently
    // passing would be the worst of both.
    expect(callSurfaceOf(".page { color: red }")).toBeNull();
  });
});

describe("tokensUsedIn", () => {
  it.each([
    "padding: var(--space-4);",
    "font-size: var(--text-sm);",
    "line-height: var(--leading-body);",
    "width: var(--measure);",
    "font-family: var(--font-body);",
    "border-radius: var(--radius-cover-sm);",
  ])("flags %s", (rule) => {
    expect(tokensUsedIn(rule)).toHaveLength(1);
  });

  it("allows the call's own palette", () => {
    expect(
      tokensUsedIn("background: var(--call-bg); color: var(--call-fg);"),
    ).toEqual([]);
  });

  it("allows the semantic names the call redefines for itself", () => {
    // --bg, --fg, --muted, --surface and --rule are re-pointed on .stage,
    // so using them inside the call is correct rather than a leak.
    expect(
      tokensUsedIn("background: var(--bg); border-color: var(--rule);"),
    ).toEqual([]);
  });

  it("reports each token once, sorted", () => {
    const css = "a{padding:var(--space-4)} b{margin:var(--space-4)} c{gap:var(--space-1)}";
    expect(tokensUsedIn(css)).toEqual(["var(--space-1)", "var(--space-4)"]);
  });
});

describe("the real stylesheet", () => {
  it("keeps the design system out of the call", () => {
    const call = callSurfaceOf(readFileSync(STYLESHEET, "utf8"));
    expect(call).not.toBeNull();
    expect(tokensUsedIn(call)).toEqual([]);
  });
});
