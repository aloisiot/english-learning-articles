import { describe, expect, it } from "vitest";

import {
  GATE,
  SELF_ASSIGNABLE,
  gateFor,
  isOpenPath,
  isSelfAssignable,
} from "../domain/role-gate";
import type { Role } from "@/server/ports";

const roles = (...held: Role[]) => new Set<Role>(held);

describe("gateFor", () => {
  it("sends a visitor with no session to sign in", () => {
    expect(gateFor(null)).toBe(GATE.SIGN_IN);
  });

  it("sends a signed-in account with no role to the gate", () => {
    expect(gateFor(roles())).toBe(GATE.CHOOSE_ROLE);
  });

  /*
    The point of 01 §2: this is a state, not a step. The same account
    asking again gets the same answer, because the answer is a function
    of what is stored and of nothing else — no flag says "already asked".
  */
  it("gives the same answer however many times it is asked", () => {
    const held = roles();
    expect(gateFor(held)).toBe(GATE.CHOOSE_ROLE);
    expect(gateFor(held)).toBe(GATE.CHOOSE_ROLE);
    expect(gateFor(held)).toBe(GATE.CHOOSE_ROLE);
  });

  it.each<[string, Role[]]>([
    ["a student", ["student"]],
    ["a tutor", ["tutor"]],
    ["the owner", ["owner"]],
    ["owner and student at once", ["owner", "student"]],
  ])("lets %s through", (_label, held) => {
    expect(gateFor(roles(...held))).toBe(GATE.ALLOWED);
  });

  it("distinguishes no session from no role", () => {
    // Collapsing these into one falsy check is the bug this prevents:
    // an unauthenticated visitor must not be shown the role screen.
    expect(gateFor(null)).not.toBe(gateFor(roles()));
  });
});

describe("isSelfAssignable", () => {
  it.each(SELF_ASSIGNABLE)("allows %s to be chosen at the gate", (role) => {
    expect(isSelfAssignable(role)).toBe(true);
  });

  it("refuses owner", () => {
    // The platform's only real privilege boundary. A self-granted owner
    // role would let a stranger approve themselves as a tutor.
    expect(isSelfAssignable("owner")).toBe(false);
  });

  it.each(["", "OWNER", "admin", "Student", undefined, null, 7, {}])(
    "refuses %s",
    (value) => {
      expect(isSelfAssignable(value)).toBe(false);
    },
  );
});

describe("isOpenPath", () => {
  const open = [
    "/sign-in",
    "/auth/callback",
    "/api/auth/sign-in",
    "/choose-role",
    "/privacy",
  ];

  it.each(open)("leaves %s reachable without a role", (path) => {
    expect(isOpenPath(path)).toBe(true);
  });

  /*
    The signed-link path is exempt permanently, not temporarily. It is
    the only way to run a class for someone with no account — a trial
    lesson with a tutor being courted from another platform, which is
    this platform's founding use case (04 §5).
  */
  const signedLink = ["/j/abc", "/j/some-long-token", "/api/join"];

  it.each(signedLink)("keeps the signed-link path %s open", (path) => {
    expect(isOpenPath(path)).toBe(true);
  });

  /*
    The admin link generator is exempt for a different reason: it is
    behind an unguessable path segment plus a shared secret re-checked on
    every submission, and it is how a signed link is minted in the first
    place. Putting it behind the role gate would mean the owner needed an
    account to issue the link that exists for people without one.
  */
  const adminPaths = ["/admin/some-key", "/admin/another", "/api/links"];

  it.each(adminPaths)("keeps the admin path %s on its own secret", (path) => {
    expect(isOpenPath(path)).toBe(true);
  });

  const gated = [
    "/",
    "/dashboard",
    "/slots",
    "/api/slots",
    "/sessions",
    "/j",
    "/signin",
    "/admin",
    "/api/link",
    "/choose-role/extra",
  ];

  it.each(gated)("holds %s behind the gate", (path) => {
    expect(isOpenPath(path)).toBe(false);
  });
});
