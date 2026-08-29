# 06 — The shared article view

> **Revised 2026-08-29.** This document assumed the class view lived
> inside the articles site and could therefore reuse its rendering
> directly. With the class app split out
> ([`07-two-app-architecture.md`](07-two-app-architecture.md)), article
> content arrives over a static JSON endpoint and shared components
> arrive through a `lib/` workspace package.
>
> The finding in §1 is unaffected and is in fact why the split is cheap:
> section *names* are what crosses the wire, and they cross an HTTP
> boundary as easily as a function call.
>
> §4 improves rather than degrades. It read as a list of things to
> reuse; the split turns it into a list of things to **choose**. A class
> app fetching article JSON is free to render a purpose-built teaching
> view — a section stepper sized for a call — instead of a scrolling
> article page with video attached. The first draft treated reuse as the
> cheap option and therefore the right one; that conflation is the part
> worth correcting.

> **The question:** What makes this a teaching tool rather than a
> meeting link? How should teacher and student share the article during
> the call, and what does that need beyond video?

**Short answer:** Sync **section identity, not scroll position** — the
site already names every article section, so the two browsers have a
shared vocabulary for free. Build the shared view as a stepper through
the class's own timing budget rather than as a generic shared scroll,
and carry the state over the provider's data messages, which costs no
extra infrastructure. **This is the only part of the feature that is
not commodity, and it is also the cheapest.**

---

## 1. The finding that shapes everything

`site/lib/articles.js` splits each article body at its `##` headings and
derives a stable class name from the part before the colon:

> `"Grammar Spotlight: Reported Speech"` → `grammar-spotlight`

The comment in the source is explicit that this is deliberate — the
class stays stable no matter which grammar point an article happens to
cover. Combined with `docs/class-structure.md`, which fixes the same
sections for every article, the consequence is that **every article in
the corpus has the same named skeleton**:

| Section | Budget |
|---|---|
| Grammar spotlight | ~3 min |
| Reading the article | ~5 min |
| Vocabulary review | ~4 min |
| Discussion questions | ~15 min |
| Buffer / wrap-up | ~3 min |

Two browsers at different window sizes, different zoom levels and
different fonts cannot agree on a scroll offset. They can agree on
`grammar-spotlight`. So the sync payload is a section name and nothing
else — a handful of bytes, immune to layout differences, and trivially
debuggable because the messages are human-readable.

This is the same class of finding as the dictionary strand's: the most
useful thing was already in `lib/articles.js`, and was found by reading
the repo rather than the web.

## 2. What to sync, and who leads

**Recommendation: the teacher leads, the student may detach.**

A hard lock — student's view forced to follow — is the obvious design
and the wrong one for this class format. Fifteen of the thirty minutes
are discussion, and a student who wants to glance back at a vocabulary
item mid-answer should be able to. A lock turns that into an
interruption.

A soft lead is better: the teacher's section changes propagate; the
student's view follows unless they scroll away, at which point a small
persistent affordance ("Follow along ↓") lets them rejoin. The state is
one boolean in the student's client and needs no coordination.

What crosses the wire:

| Message | Payload | Sent by |
|---|---|---|
| `section` | section name, e.g. `discussion-questions` | teacher |
| `highlight` | section name + a question or vocabulary index | teacher |
| `chat` | text | either |
| `presence` | following / detached | student |

Nothing here needs ordering guarantees or persistence. If a message is
lost, the next one corrects it, because every message carries absolute
state rather than a delta. That is worth designing in deliberately: it
makes the whole channel best-effort and removes any need for
acknowledgements.

## 3. How it gets there

Both recommended providers expose an arbitrary data channel alongside
the media — Daily's `sendAppMessage`, LiveKit's `publishData`. Either
carries the messages above with no additional service, no WebSocket of
your own, and no server involvement.

This matters more than it sounds. The obvious way to build a shared view
is a realtime database or a websocket server, and that would be a third
piece of infrastructure with its own free-tier cliff and its own
failure mode. Using the call's own data channel means **the sync cannot
be up when the call is down, or down when the call is up** — one
connection, one state.

It also means the shared view is provider-portable in the only way that
matters: the message shapes above are yours, and swapping Daily for
LiveKit changes one send function and one receive handler.

## 4. What the site already gives the in-call view

- **Section rendering**, as above — the article page already emits the
  sections with stable class names, so the in-call view can reuse the
  existing rendering rather than reimplementing it.
- **Word lookup.** `site/lib/dictionary.js` and
  `site/app/dictionary-popover.js` already ship a client-side dictionary
  with a selection popover, served from static shards. It works with no
  server. That means **vocabulary lookup inside the call is close to
  free** — the student can look a word up mid-reading without leaving
  the page or asking. This is a genuine advantage over holding the class
  in a generic meeting tool with the article in another tab, and it may
  be the strongest single argument for putting the call on the site at
  all.
- **The visual system.** `docs/STYLE-SPEC.md` describes "Quiet
  Editorial", and video is the loudest thing that could be put on such a
  page. The design constraint is real: two video tiles at conversational
  size, the article at its normal measure, and no controls visible that
  are not needed during a class. The article should remain the page;
  the call should not become the page.

## 5. Screen sharing and chat

Both were asked for, and both are small once the above exists.

**Screen sharing** is a native capability of every provider and needs no
design beyond deciding what it replaces on screen. Its real role here is
as the escape hatch: everything the shared article view cannot do —
showing a website, a document, a correction typed live — screen share
does without any further engineering. That is a good reason *not* to
extend the shared view beyond articles.

**Text chat** rides the same data channel. Given that accounts carry
nothing, chat should be ephemeral: it lives in the page while the call
lives, and is gone afterwards. That is the consistent choice, it needs
no storage, and it inherits none of the obligations in
[`05-accounts-and-access.md`](05-accounts-and-access.md). Its main use
in a language class is spelling — a word the student misheard, written
down — which does not need to outlive the class.

## 6. Scope discipline

Two things are deliberately excluded.

**Mobile.** Desktop and laptop browsers only. This removes iOS Safari's
backgrounding behaviour, its autoplay rules, and its lack of screen
share from the problem entirely. Worth recording as a decision rather
than an omission, because a student joining from a phone will otherwise
be reported as a bug.

**Anything persisted.** No notes, no attendance, no vocabulary saved
from the call. Each of those is a database, and the moment one exists
the account decision in [`05`](05-accounts-and-access.md) has to be
revisited along with the GDPR surface. If they are wanted, they should
arrive as a considered second phase, not as a small addition to a call
UI.

## 7. Recommendation

Build the shared view as a **section stepper following the existing
class structure**, synced by absolute-state messages over the provider's
data channel, teacher-led with student detach. Reuse the article
rendering and the existing dictionary popover unchanged. Treat screen
share as the escape hatch and chat as ephemeral.

Everything in this document is a few hundred lines of client code and no
new infrastructure. It is the part of the feature worth spending time
on, and it should be the last part built — after the token function and
the call itself work, per
[`01-what-a-class-call-requires.md`](01-what-a-class-call-requires.md) §5.
