import { describe, expect, it } from "vitest";

import {
  EXAMPLE_FILE,
  NOT_AN_ENV_FILE,
  SECRET_FILE,
  classifyPath,
  declaredValues,
} from "../check-env-files.mjs";

describe("classifyPath", () => {
  const secrets = [
    ".env",
    "class/.env",
    "site/.env.local",
    "class/.env.production",
    "a/deeply/nested/.env.development.local",
  ];

  it.each(secrets)("treats %s as a secret file", (path) => {
    expect(classifyPath(path)).toBe(SECRET_FILE);
  });

  const examples = [
    ".env.example",
    "class/.env.example",
    "site/.env.local.example",
  ];

  it.each(examples)("treats %s as a template", (path) => {
    expect(classifyPath(path)).toBe(EXAMPLE_FILE);
  });

  const ignored = [
    "package.json",
    "class/lib/link.ts",
    // A different tool's file. Claiming it would make failures here
    // surprising, and it is not what these two rules are about.
    ".envrc",
    "docs/environment.md",
    // Nothing to do with env files, despite the name.
    "site/environment.ts",
  ];

  it.each(ignored)("leaves %s alone", (path) => {
    expect(classifyPath(path)).toBe(NOT_AN_ENV_FILE);
  });
});

describe("declaredValues", () => {
  it("finds nothing in a template of names and comments", () => {
    const template = [
      "# A comment.",
      "CLASS_LINK_SECRET=",
      "",
      "# Another.",
      "DAILY_API_KEY=",
    ].join("\n");

    expect(declaredValues(template)).toEqual([]);
  });

  it("reports a declared value with its name and line", () => {
    const leaked = ["# A comment.", "DAILY_API_KEY=f7b55229045", ""].join("\n");

    expect(declaredValues(leaked)).toEqual([{ line: 2, name: "DAILY_API_KEY" }]);
  });

  it("never returns the value itself", () => {
    // The whole point: a hook that prints what it caught has moved the
    // leak into the terminal and the CI log rather than stopped it.
    const found = declaredValues("DAILY_API_KEY=super-secret-value");

    expect(JSON.stringify(found)).not.toContain("super-secret-value");
  });

  it("reports every offending line, not just the first", () => {
    const leaked = ["A=1", "B=", "C=3"].join("\n");

    expect(declaredValues(leaked).map(({ name }) => name)).toEqual(["A", "C"]);
  });

  const noValue = [
    ["nothing after the equals", "FOO="],
    ["trailing whitespace only", "FOO=   "],
    ["an explicitly empty double-quoted value", 'FOO=""'],
    ["an explicitly empty single-quoted value", "FOO=''"],
    ["a trailing comment and no value", "FOO= # e.g. https://example.com"],
    ["a commented-out assignment", "# FOO=bar"],
    ["a plain comment", "# FOO is the thing"],
    ["a blank line", ""],
    ["prose that is not an assignment", "Set FOO before running."],
  ];

  it.each(noValue)("reads %s as no value", (_label, line) => {
    expect(declaredValues(line)).toEqual([]);
  });

  const hasValue = [
    ["a bare value", "FOO=bar"],
    ["a quoted value", 'FOO="bar"'],
    ["a value with spaces around the equals", "FOO = bar"],
    ["an exported value", "export FOO=bar"],
    ["a URL", "FOO=https://example.com"],
    ["a value that is only punctuation", "FOO=!"],
  ];

  it.each(hasValue)("reads %s as a declared value", (_label, line) => {
    expect(declaredValues(line)).toEqual([{ line: 1, name: "FOO" }]);
  });

  it("handles CRLF line endings", () => {
    expect(declaredValues("A=\r\nB=secret\r\n")).toEqual([
      { line: 2, name: "B" },
    ]);
  });
});
