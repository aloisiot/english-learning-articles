# 01 — What actually works: the evidence base for grammar practice

> **The question:** if we're going to build a grammar practice tool, what does the research say a grammar practice tool should *do*? Not "does grammar teaching work" — what kind of practice produces the kind of knowledge this project wants?

**Short answer:** explicit grammar instruction has a large, well-replicated effect **on tests of explicit knowledge**, and a much weaker record on spontaneous production. That gap is not a detail — it is the single most important design constraint here, because this project's entire purpose is a *conversation* class. The literature that closes the gap is skill-acquisition theory: practice must be **meaning-bearing, repeated, spaced, and cognitively similar to real use**. A gap-fill drill app would be building the well-evidenced half of the problem and skipping the half that matters.

---

## 1. The headline finding, and the asterisk on it

Norris and Ortega's 2000 meta-analysis is the field's most-cited result on this question. Synthesising experimental and quasi-experimental studies published 1980–1998, it found that focused L2 instruction produces **large target-oriented gains**, that **explicit** instruction outperforms implicit, and that focus-on-form and focus-on-forms interventions produce roughly equivalent, large effects. Gains were largest when **metalinguistic explanation** was included.

Taken alone that reads as a licence to build a rule-explanation-and-drill machine. It isn't, for a reason the authors themselves raised: the outcome measures in the synthesised studies were overwhelmingly **discrete-point, constrained-response tests** — the same format as the practice. A treatment that teaches a rule explicitly and is then tested by a task that rewards applying a rule explicitly will show a large effect whether or not anything transferred to speech.

> **Confidence: high on the effect, high on the critique, medium on the exact proportion.** The measurement-bias critique of Norris & Ortega is standard in the subsequent literature and was acknowledged in the original; the frequently-quoted figure that ~90% of measures were discrete-point is widely repeated but I did not verify it against the paper itself. Treat the direction as solid and the number as unverified.

**Design consequence:** effect sizes from this literature should never be read as "this will make you speak better." They should be read as "this reliably builds explicit knowledge." Explicit knowledge is worth building — it just isn't the finish line.

## 2. The interface problem: does explicit knowledge become usable?

This is the field's oldest live argument, and the tool's design depends on where it lands.

| Position | Claim | Consequence for a practice tool |
|---|---|---|
| Strong interface | Explicit knowledge converts to implicit knowledge through practice | Drill freely; automatization does the rest |
| **Weak interface** | Explicit knowledge can't convert directly, but it helps learners *notice* forms in input and can fill gaps in and raise the accuracy of implicit knowledge | Practice should push noticing and production, not rule recall |
| Non-interface | The two systems are separate; explicit knowledge only ever monitors output | A practice tool is nearly pointless for fluency |

The weak-interface view is the mainstream position and the one this research adopts. It is also the most demanding one to build for: it means the tool's job is not to make the rule known, but to **create the conditions under which the rule gets noticed in real input and attempted in real output**.

> **Confidence: medium-high.** This is a genuine, ongoing disagreement in the field, not a settled question. The weak interface is the majority position, not a consensus. Ellis and colleagues' research-agenda paper on explicit and implicit knowledge is the fairest statement of where the disagreement currently stands.

## 3. Skill acquisition theory: the most actionable framework

DeKeyser's skill-acquisition account is the part of this literature that translates most directly into software, because it describes a *sequence* rather than a single intervention:

**declarative** (know the rule) → **procedural** (use the rule, slowly and effortfully) → **automatized** (use it fast, accurately, without attention).

DeKeyser's own prescription: a short period of explicit rule learning, followed by a **short** period of activities using that explicit knowledge during real performance, followed by a **long** period of repeated opportunities to use it. Three things in that sentence matter for the build:

- **The explicit phase is short.** The `## Grammar Spotlight` already in each article is roughly the right size. More rule explanation is not the missing ingredient.
- **The long phase is the product.** Almost everything a grammar tool can usefully do lives in "repeated opportunities to use it." That's what the corpus and the review queue are for.
- **Proceduralization is structure-specific.** It does not generalise from one form to another, so progress must be tracked per structure — which is what makes a per-structure progress model (see [`03-progress-model.md`](03-progress-model.md)) necessary rather than decorative.

### Transfer-appropriate processing

The corollary, and the sharpest single design rule available: **practice transfers to the extent that the cognitive demands of practice resemble the cognitive demands of use.** Practice that requires retrieving a rule produces skill at retrieving a rule. Practice that requires expressing a meaning under time pressure produces skill at expressing meaning under time pressure.

For a tool supporting a spoken conversation class, this is the criterion by which every exercise type should be judged. It is applied in [`04-exercise-design.md`](04-exercise-design.md).

## 4. Feedback

Li's 2010 meta-analysis (33 primary studies — 22 published, 11 dissertations) found a **medium overall effect for corrective feedback, d = 0.64, maintained over time**. Four of its moderator findings matter here:

- **Implicit feedback was better maintained** over time than explicit feedback, even though explicit feedback often looks better on immediate tests.
- **Lab studies showed larger effects than classroom studies** — a general warning that effect sizes from controlled settings overstate what a real learner will get.
- **Shorter treatments outperformed longer ones**, which is counterintuitive and probably a study-design artifact rather than advice to practice less.
- **Foreign-language contexts outperformed second-language contexts.** Worth noting: a Portuguese speaker studying English in Brazil is the foreign-language case, i.e. the higher-effect one.

On **timing**, a systematic review of 20 studies found 10 favouring immediate feedback, 7 finding no difference, and 3 favouring delayed — and those 3 had internal-validity problems. So: **immediate feedback is the safe default**, with the caveat that the difference is smaller than the intuition suggests.

> **Confidence: high** on d = 0.64 and the moderators (directly reported in the abstract and widely cited); **medium** on the timing review's tallies, which come from a secondary summary of the review rather than the review itself.

## 5. Spacing, retrieval, and interleaving

This is the strongest, cleanest evidence in the whole strand, and it is what a piece of software is uniquely good at delivering.

**Spacing.** Kim and Webb's 2022 meta-analysis — 48 experiments, 3,411 L2 learners — found a **medium-to-large effect for spaced over massed practice**, covering both vocabulary and grammar. Longer gaps showed no advantage over shorter gaps on immediate tests, but a **small advantage on delayed tests**. The authors explicitly note that most included studies were vocabulary, and call for more grammar work — so the grammar-specific evidence is thinner than the headline suggests.

**Retrieval.** Repeated retrieval with feedback beats repeated restudy, robustly, across domains. Test–restudy cycles outperform study–study cycles.

**A dissenting result worth keeping.** Suzuki and DeKeyser (2017) trained learners on Japanese morphology under massed vs. distributed schedules and found that **massed practice produced accuracy equal to distributed practice, and possibly faster utterances**. This is a direct challenge to "space everything" *specifically at the proceduralization stage* — the plausible reading is that early proceduralization benefits from concentration, and spacing pays off later, for retention. That distinction should shape the schedule: **massed when a structure is new, spaced once it's working.**

**Interleaving.** The picture is a genuine trade-off, not a win:

| | Accuracy | Fluency |
|---|---|---|
| Interleaved practice | Better, durable to 5-week delayed post-test | Worse — more mid-clause pausing |
| Blocked practice | Worse | Better, and durable |

One study found the best results from **systematic alternation during study and randomisation during practice**. For a conversation-oriented tool, the fluency cost of interleaving is not a rounding error, which argues for blocked practice while a structure is being learned and interleaved review afterwards — the same shape as the massed/spaced conclusion above.

> **Confidence: high** on spacing and retrieval as general principles; **medium** on their application to grammar specifically, which the meta-analysts themselves flag as under-researched; **medium** on the interleaving trade-off, which rests on a small number of studies.

## 6. Input-side techniques, and what they're worth

Two families of technique operate on input rather than practice, and both are cheap to implement inside an article:

**Processing instruction** (VanPatten): grammar explanation plus *structured input* practice designed to break faulty processing strategies, rather than output drills. A meta-analysis of 42 experiments across 33 studies found PI **better than production-based instruction for receptive knowledge**, but production-based instruction **just as good for productive knowledge**. Replications with complex targets (the Spanish subjunctive) found no PI advantage at all. Reading: PI is a good complement, not a replacement, and its advantage is on the comprehension side.

**Textual enhancement** (bolding the target form in a text): Lee and Huang's 2008 meta-analysis of 16 studies found **d = 0.22 — barely above nothing** — and noted it may slightly disrupt meaning processing.

That second finding lands directly on an existing project rule. `docs/class-structure.md` says the grammar point *"should show up naturally in the article's language, not be visually highlighted/bolded."* **The evidence supports that rule** — bolding buys almost nothing measurable and has a plausible comprehension cost. Keep it.

## 7. Developmental readiness — the constraint on sequencing

Pienemann's Processability Theory holds that L2 learners pass through **six stages** of processing capacity in a fixed order, and the **Teachability Hypothesis** that follows from it says a structure can only be successfully taught when the learner is developmentally ready for it — teaching stage 5 to a stage 3 learner does not work, however good the explanation.

For this project, the practical implications are narrow but real:

- At B2–C1 the learner is past the stages the theory constrains, so **for the current learner this is close to a non-issue**.
- It matters for **the level below**. Any A1–B1 sequencing the inventory proposes should respect processing order where the theory speaks, rather than assuming any structure can be slotted anywhere by CEFR label alone.
- It is a caution against a purely corpus-derived ordering: **corpora record when learners produce a structure, not when they could have learned it.**

> **Confidence: medium.** Processability Theory is well-supported for the morphological phenomena it was built on and less well-supported as a general sequencing law. Its strong form is contested.

---

## What this implies for the build

1. **Do not build a rule-quiz.** The evidence for explicit instruction is largely evidence about tests that look like rule-quizzes.
2. **Judge every exercise by transfer-appropriate processing** — does it demand what conversation demands?
3. **Feedback: immediate, and lean toward implicit reformulation** over explicit rule restatement, since implicit feedback is better retained.
4. **Schedule: massed while new, spaced and interleaved once working.** Not "spaced repetition" applied uniformly.
5. **Don't bold the target form.** The existing rule is correct.
6. **Track progress per structure**, because proceduralization doesn't generalise.
7. **Expect small real-world effects.** Lab-vs-classroom differences and the measurement critique both point the same way: the honest expectation for a self-study tool is modest, durable gains in accuracy, not fluency transformation.
