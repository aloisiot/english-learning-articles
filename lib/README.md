# `@english-learning/lib`

Design tokens and presentational components shared by `site/` and
`class/`. The reasoning is in
[`research/accounts-and-scheduling/07-design-system.md`](../research/accounts-and-scheduling/07-design-system.md):
the site already had a design system, so this package is that system
moved to where both apps can reach it — not a new one.

## How the seam works

The constraint is that **`site/` is JavaScript and `class/` is
TypeScript**, and this package has to serve both. `07` §4 settles the
direction: author here in TypeScript, and let the JavaScript consumer
simply not benefit. Converting `site/` is explicitly not on the table.

That is possible because neither app consumes a *build* of this package.
There is no compile step here, no `dist/`, and nothing to keep in sync:

- **`exports` points at source.** `./src/index.ts`, not a built artifact.
- **Each app's bundler compiles it**, which is what `transpilePackages`
  in both `next.config` files is for. Next will not transpile a
  `node_modules` package without being told to, and the workspace symlink
  makes this one look exactly like a published dependency.
- **`class/` gets types for free**, because TypeScript resolves through
  the same `exports` map and lands on the `.ts` source.
- **`site/` gets no types and needs none.** Next compiles the TypeScript
  with SWC regardless of the importing app's language, and `site/` has no
  `tsconfig.json` to type-check against.

The workspace symlink at `node_modules/@english-learning/lib` is created
by the root `npm ci`, so both apps import by package name — never by a
relative path across workspace folders, which
[`CLAUDE.md`](../CLAUDE.md) forbids.

### CSS

`./tokens.css` is exported separately and imported by each app's root
layout. CSS crosses the seam with no language question at all, which is
why `07` §5 puts tokens first.

## Proving it still works

`site/test/lib-seam.test.js` and `class/test/lib-seam.test.ts` both
import from this package and assert something trivial. They exist to fail
loudly if the resolution above breaks — a wrong `exports` path, a missing
`transpilePackages` entry, a dependency that stopped being declared —
rather than leaving it to surface as a confusing build error in an app.

They run in `npm run verify` like everything else.
