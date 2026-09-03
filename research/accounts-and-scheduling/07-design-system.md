# 07 — The design system, and what `lib/` should hold

> **The question:** What UI patterns already exist in the articles site,
> what should the class app share, and what belongs in `lib/`?

**Short answer:** the site already *has* a design system — eight
documented token groups and full light/dark theming. The class app has
six ad-hoc tokens and is dark-only. **The site's system is the design
system; the class app adopts it**, with one deliberate exception.

---

## 1. What each app has today

| | `site/app/globals.css` | `class/app/globals.css` |
|---|---|---|
| Size | 1,221 lines | 728 lines |
| Tokens | typefaces, type scale, line height, 4px spacing scale, cover radii, colour, measure — eight documented groups | `--bg --fg --muted --accent --danger --font-sans` |
| Theming | `prefers-color-scheme` **plus** a `[data-theme]` override, and a three-state toggle (auto / light / dark) | none; dark only |
| Body type | serif (`--font-body`, injected by `next/font`) | system sans |

They share nothing. The class app's stylesheet says so at the top —
styling was duplicated deliberately, with the list of duplications
intended as the input to this document.

## 2. The class app is about to become two surfaces

This is the finding that reshapes the question.

Accounts and scheduling add sign-up, the role gate, a dashboard, a slot
picker and a session history. Those are **documents and forms**. The call
is not — it is an immersive, full-bleed, dark surface, and dark is
*correct* there: video interfaces are conventionally dark because the
video is the light.

So "what can be shared" has a sharper answer than "the common CSS":

- **The application surface** — everything that is not the call — adopts
  the site's design system wholesale. Same tokens, same serif, same
  light/dark.
- **The call surface** stays dark and bespoke, and is exempt on purpose,
  not by neglect.

**Decision: the class app's non-call screens adopt the site's design
system.** Stating the exception is what keeps the exemption from
spreading back over the whole app.

## 3. What goes into `lib/`

[`08`](../video-calls/08-implementation-plan.md) set the trigger for
populating `lib/`: a second consumer. The second consumer has arrived,
and it is the dashboard rather than the call.

**Tier 1 — tokens.** The eight token groups, as CSS custom properties,
plus the theming rules. This is the whole of "one product visually", and
it is the only item on this list that is urgent, because every component
below depends on it.

**Tier 2 — components with no domain knowledge.**

| Component | Today | Why it moves |
|---|---|---|
| Theme toggle | `site/app/theme-toggle.js`, 60 lines | Once the class app is theme-aware it needs the same control, and a second copy would drift immediately |
| Icons | `site/app/icons.js`, 4 icons | The class app has **six** more, written inline in `call-client.tsx` — `MicIcon`, `CameraIcon`, `ScreenIcon`, `ChatIcon`, `LeaveIcon`, `CloseIcon`. Two icon sets in one product is exactly the drift `lib/` exists to prevent |
| Dictionary popover | `site/app/dictionary-popover.js`, 323 lines | [`07`](../video-calls/07-two-app-architecture.md) §3 already predicted this: the dictionary shards are fetchable as they are, and *"only the popover component travels through `lib/`"* |

**Tier 3 — deferred.** `article-summary.js` moves only when the article
seam lands, and not before. Form controls, buttons and layout primitives
should be extracted **when the dashboard needs them**, not in
anticipation — the same rule that kept `lib/` empty until now.

## 4. The constraint that shapes the package

`site/` is JavaScript. `class/` is TypeScript.
[`08`](../video-calls/08-implementation-plan.md) already names this and
calls it *"ordinary but not free"*.

Consequences worth deciding rather than discovering:

- **Tokens are unaffected.** CSS is CSS, and that is another reason to do
  tier 1 first — it is the highest value and the only tier with no
  language question at all.
- **Components need types the JS consumer will ignore.** Authoring `lib/`
  in TypeScript and publishing types is the normal answer; `site/`
  imports it and simply does not benefit.
- **Do not convert `site/` to TypeScript as part of this.** That is a
  large, unrelated change wearing the costume of a small one.

## 5. Order of work

1. **Tokens into `lib/`**, both apps consuming them. Nothing else works
   until the palette is shared, and this alone makes the class app's
   dashboard look like the product.
2. **Icons**, because there are already two sets and the second is
   growing.
3. **Theme toggle**, when the class app has a surface worth theming.
4. **Dictionary popover**, with the article seam.

Each is independently shippable, which is deliberate: none of them
blocks accounts or scheduling, and any of them can be done in a gap.
