/**
 * The call keeps its own palette, and nothing from the design system
 * reaches it.
 *
 * research/accounts-and-scheduling/07 §2 makes the call an exemption
 * "on purpose, not by neglect" — and an exemption stated in a comment is
 * one nobody notices breaking. The class app is now mostly documents and
 * forms that *do* use the tokens, so the natural mistake is to reach for
 * --space-4 while editing a rule that happens to be below the line.
 *
 * The rule is positional because the stylesheet is: everything after the
 * boundary banner is the call. That is cruder than parsing selectors and
 * it is honest about what it checks — which is why the banner says a
 * test enforces it.
 */
import { readFileSync } from "node:fs";

export const STYLESHEET = "class/app/globals.css";
export const BOUNDARY = "Below this line is the CALL";

/** Tokens the call must not use. Its own --call-* names are fine. */
const DESIGN_TOKENS =
  /var\(--(?:text-[a-z0-9]+|space-\d+|leading-[a-z]+|measure|gutter|font-body|radius-[a-z-]+)\)/g;

export function callSurfaceOf(css) {
  const at = css.indexOf(BOUNDARY);
  return at === -1 ? null : css.slice(at);
}

export function tokensUsedIn(callCss) {
  return [...new Set(callCss.match(DESIGN_TOKENS) ?? [])].sort();
}

function main() {
  const css = readFileSync(STYLESHEET, "utf8");
  const call = callSurfaceOf(css);

  if (call === null) {
    console.error(
      `\n✗ ${STYLESHEET} has no "${BOUNDARY}" banner, so the call surface`,
    );
    console.error("  cannot be told from the application surface.\n");
    process.exit(1);
  }

  const leaked = tokensUsedIn(call);
  if (leaked.length > 0) {
    console.error(`\n✗ Design-system tokens used inside the call surface:\n`);
    for (const token of leaked) console.error(`  ${token}`);
    console.error(
      "\n  The call is dark and bespoke on purpose (07 §2). Use its own",
    );
    console.error(
      "  --call-* values, or move the rule above the boundary banner if it",
    );
    console.error("  belongs to the application surface.\n");
    process.exit(1);
  }

  console.log("✓ No design-system tokens inside the call surface.");
}

if (process.argv[1] && process.argv[1].endsWith("check-call-surface.mjs")) {
  main();
}
