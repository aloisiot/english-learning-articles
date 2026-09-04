import { describe, expect, it } from "vitest";

import {
  findConfinedImports,
  inScope,
  isAdapterPath,
  stripComments,
  violationsIn,
} from "../check-adapter-boundary.mjs";

const SDK = "@supabase/supabase-js";

describe("isAdapterPath", () => {
  const adapters = [
    "class/features/access/adapters/supabase/client.ts",
    "class/features/call/adapters/daily.ts",
    "class/features/scheduling/adapters/index.ts",
  ];

  it.each(adapters)("allows %s", (path) => {
    expect(isAdapterPath(path)).toBe(true);
  });

  const notAdapters = [
    "class/app/api/join/route.ts",
    "class/server/ports.ts",
    "class/features/access/domain/link.ts",
    // The directory has to be named `adapters`, not merely contain it.
    "class/features/access/adapters-old/client.ts",
    "class/features/adapters.ts",
  ];

  it.each(notAdapters)("does not allow %s", (path) => {
    expect(isAdapterPath(path)).toBe(false);
  });
});

describe("inScope", () => {
  it.each(["class/server/ports.ts", "site/app/layout.js", "lib/src/index.ts"])(
    "includes %s",
    (path) => {
      expect(inScope(path)).toBe(true);
    },
  );

  it.each([
    // Repo tooling: check-supabase.mjs talks to Supabase on purpose, and
    // the checker names the package in order to look for it.
    "scripts/check-supabase.mjs",
    "scripts/check-adapter-boundary.mjs",
    "vitest.config.mjs",
  ])("excludes %s", (path) => {
    expect(inScope(path)).toBe(false);
  });
});

describe("stripComments", () => {
  it("removes a block comment", () => {
    expect(stripComments(`/* ${SDK} */ const a = 1;`).trim()).toBe(
      "const a = 1;",
    );
  });

  it("removes a line comment", () => {
    expect(stripComments(`// ${SDK}\nconst a = 1;`).trim()).toBe("const a = 1;");
  });

  it("leaves a protocol-relative URL alone", () => {
    // The // in https:// must not be read as the start of a comment.
    expect(stripComments('const u = "https://example.com/x";')).toContain(
      "example.com/x",
    );
  });
});

describe("findConfinedImports", () => {
  const imports = [
    ["a named import", `import { createClient } from "${SDK}";`],
    ["a default import", `import x from "${SDK}";`],
    ["a namespace import", `import * as x from "${SDK}";`],
    ["single quotes", `import { createClient } from '${SDK}';`],
    ["a deep import", `import x from "${SDK}/dist/module/index.js";`],
    ["require", `const x = require("${SDK}");`],
    ["a dynamic import", `const x = await import("${SDK}");`],
    ["a re-export", `export { createClient } from "${SDK}";`],
  ];

  it.each(imports)("finds %s", (_label, source) => {
    expect(findConfinedImports(source)).toEqual([SDK]);
  });

  const notImports = [
    ["a mention in a block comment", `/* never import ${SDK} here */`],
    ["a mention in a line comment", `// ${SDK} is confined to adapters`],
    ["the package name in a list", `const CONFINED = ["${SDK}"];`],
    ["a different package", `import x from "@supabase/ssr";`],
    ["a package with the name as a prefix", `import x from "${SDK}-extra";`],
    ["nothing at all", `export const a = 1;`],
  ];

  it.each(notImports)("does not flag %s", (_label, source) => {
    expect(findConfinedImports(source)).toEqual([]);
  });
});

describe("violationsIn", () => {
  const offending = `import { createClient } from "${SDK}";`;

  it("reports an import from a route handler", () => {
    expect(violationsIn("class/app/api/join/route.ts", offending)).toEqual([
      { path: "class/app/api/join/route.ts", pkg: SDK },
    ]);
  });

  it("permits the same import from an adapter", () => {
    expect(
      violationsIn(
        "class/features/access/adapters/supabase/client.ts",
        offending,
      ),
    ).toEqual([]);
  });

  it("permits it from repo tooling, which is out of scope", () => {
    expect(violationsIn("scripts/check-supabase.mjs", offending)).toEqual([]);
  });

  it("permits the rule being described in the domain's prose", () => {
    // class/server/ports.ts documents this rule, and doing so must not
    // break it — which the first version of the check got wrong.
    const prose = `/**\n * ${SDK} may only be imported inside adapters/.\n */\nexport interface Identity {}`;
    expect(violationsIn("class/server/ports.ts", prose)).toEqual([]);
  });
});
