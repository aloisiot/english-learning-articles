/**
 * The package's JavaScript entry point.
 *
 * Deliberately almost empty. It exists so that both apps can be shown to
 * resolve, type-check and bundle a module from this workspace *before*
 * anything real depends on it — the seam is the risky part, not the
 * contents, and a failure here is much easier to read with one constant
 * in the file than with an icon set.
 *
 * `linked` is that proof and nothing more. It is asserted from both
 * apps' test suites, and it goes away once the icons land and give this
 * entry point a real export to be checked through.
 */
export const linked = true;
