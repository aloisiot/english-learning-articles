/**
 * The role gate.
 *
 * 01 §2 is emphatic that this is **a persistent state, not a step in a
 * flow**, and the distinction is the whole module. An account with no
 * role sees the gate on every visit until it chooses — not once after
 * sign-up. The alternative is easy to build by accident: a sign-up
 * wizard whose last step is the role screen works perfectly until
 * somebody closes the tab, and then leaves an account that can never
 * acquire a role.
 *
 * So the gate is a function of stored state — the roles a profile holds
 * — and of nothing else. No session flag, no cookie, no step counter.
 * If it took one, it would be a flow.
 */
import type { Role } from "@/server/ports";

/** What a signed-in visitor may be shown. */
export const GATE = {
  /** Not signed in. */
  SIGN_IN: "sign-in",
  /** Signed in, no role chosen. Nothing else is reachable. */
  CHOOSE_ROLE: "choose-role",
  /** Signed in with at least one role. */
  ALLOWED: "allowed",
} as const;

export type GateDecision = (typeof GATE)[keyof typeof GATE];

/** The roles a person may choose for themselves at the gate. */
export const SELF_ASSIGNABLE: readonly Role[] = ["student", "tutor"];

/**
 * Owner is not on that list, and that is the platform's only real
 * privilege boundary.
 *
 * Anyone can sign up and claim "tutor" — which is why tutors need owner
 * approval before students see them (01 §2). If "owner" were also
 * self-assignable, the approval would be self-granted and the boundary
 * would not exist.
 */
export function isSelfAssignable(role: unknown): role is Role {
  return SELF_ASSIGNABLE.includes(role as Role);
}

/**
 * What to do with this request.
 *
 * `roles` is null when nobody is signed in, and an empty set when
 * somebody is signed in and has not chosen. Those are different answers
 * and the gate treats them differently, which is why the absence of a
 * session and the absence of a role are not collapsed into one falsy
 * check.
 */
export function gateFor(roles: ReadonlySet<Role> | null): GateDecision {
  if (roles === null) return GATE.SIGN_IN;
  if (roles.size === 0) return GATE.CHOOSE_ROLE;
  return GATE.ALLOWED;
}

/**
 * Paths reachable without passing the gate.
 *
 * Kept as a list rather than as checks scattered through the routes,
 * because "nothing else in the app is reachable" is only true if the
 * exceptions are enumerable. Anything not named here is behind the gate.
 *
 * The signed-link join path is exempt deliberately and permanently: a
 * signed link is the only way to run a class for someone without an
 * account, which is this platform's founding use case (04 §5). It
 * carries its own proof in the signature and has never needed a session.
 */
export const OPEN_PATHS: readonly string[] = [
  "/sign-in",
  "/auth/callback",
  "/api/auth/sign-in",
  "/api/auth/sign-out",
  "/choose-role",
  "/api/choose-role",
  "/privacy",
];

export function isOpenPath(path: string): boolean {
  if (OPEN_PATHS.includes(path)) return true;

  // The signed-link paths, which predate accounts and outlive them.
  if (path.startsWith("/j/")) return true;
  if (path === "/api/join") return true;
  if (path.startsWith("/admin/")) return true;
  if (path === "/api/links") return true;

  return false;
}
