# 02 — The grammar inventory: which structures, at which level

> **The question:** what is a defensible list of English grammar structures mapped to CEFR levels A1–C2, and where does it come from? The tool needs a spine — a canonical set of structures with levels and prerequisites — and inventing one would be indefensible.

**Short answer:** use **two published inventories together**, because they answer different questions. The **British Council–EAQUALS Core Inventory** (A1–C1) records what is conventionally *taught* at each level and is the better basis for a curriculum. The **English Grammar Profile** (A1–C2, ~1,200 descriptors from a 55-million-word learner corpus) records what learners actually *produce* at each level and is the better basis for calibration. Where they disagree, the disagreement is informative and should be recorded rather than resolved by fiat. Neither is a licence-free dataset you can simply ship, which is the main practical constraint.

---

## 1. The two sources

### English Grammar Profile (EGP)

- **What it is:** ~1,200 "can-do" grammatical competence statements, each mapped to the CEFR level at which the structure was judged to be acquired, with authentic learner examples.
- **Derived from:** the Cambridge Learner Corpus — ~55 million words of written learner English, mostly exam scripts.
- **Made by:** Anne O'Keeffe and Geraldine Mark, with Ronald Carter and Michael McCarthy, as a sister resource to the English Vocabulary Profile.
- **Coverage:** A1 through C2 — the only one of the two that reaches C2.
- **Access:** browsable online at `englishprofile.org/english-grammar-profile/egp-online`. Note that a plain fetch of that URL returns an empty body, so it is client-rendered — anything read from it must be read in a real browser, and it is **not** a downloadable dataset with an open licence.

**Three limitations that matter for this project:**

**a) It is a corpus of writing, from exams.** Every level assignment describes written, assessed, often timed production. A conversation class is none of those things. Structures that are common in speech and rare in exam writing will be systematically under-placed.

**b) Its level assignments are least reliable exactly where this project sits.** A 2025 *Annual Review of Applied Linguistics* study (Verratti-Souto, Sagirov and Chen) used an NLP pipeline (POLKE) over a large learner corpus to test EGP's structure-level assignments statistically, and found **greater agreement with EGP at the beginner levels** — implying weaker agreement at the advanced end. The authors also caution that a fully quantitative approach can miss patterns visible only on inspection, and that corpus composition (curricula, task types, formulaic usage) can distort results. So: **B2–C1 assignments in EGP are the least verified part of it**, and should be treated as informed judgement rather than measurement.

**c) "Acquired at level X" is not "should be taught at level X."** Corpora record production, not readiness or teachability — see the Processability caveat in [`01-evidence-base.md`](01-evidence-base.md) §7.

### British Council–EAQUALS Core Inventory for General English (CIGE)

- **What it is:** a specification of the linguistic features — **functions, grammar, discourse markers, vocabulary and topics** — characterising each CEFR level.
- **Coverage:** **A1–C1 only. There is no C2.**
- **Derived from:** what accredited European institutions actually teach at each level, i.e. professional consensus rather than learner data.
- **Access:** freely downloadable PDF (2nd edition, 2015) from both teachingenglish.org.uk and eaquals.org, plus level posters.
- **Validation:** the British Council has published a separate validation study of it.

Its virtue is that it is **curricular**: it lists grammar alongside the *functions* the grammar serves ("speculating," "conceding a point," "reporting what someone said"). That framing is a better fit for a conversation class than a bare structure list, and it maps naturally onto discussion questions.

### Why both

| | Core Inventory | English Grammar Profile |
|---|---|---|
| Question answered | What is taught at this level | What learners produce at this level |
| Basis | Institutional consensus | 55M-word learner corpus |
| Range | A1–C1 | A1–C2 |
| Granularity | Coarse (a structure per line) | Fine (~1,200 descriptors) |
| Speech vs writing | Teaching practice, both | Written exam scripts |
| Licence for reuse | Free PDF; reuse terms unclear | Browsable, not open data |
| Best used for | Curriculum spine, functions | Calibration, sub-structure detail |

**Recommendation: the Core Inventory is the spine; EGP refines it.** Build the structure list from CIGE because it is coarse enough to be a usable curriculum and free to download, then use EGP to split structures that are too coarse (e.g. "relative clauses" → defining / non-defining / reduced) and to extend into C2, which CIGE does not cover.

> **Confidence: high** on what each source is and its coverage; **medium** on the reuse terms for both — neither publishes an explicit open-data licence for the underlying inventory, and this needs checking before any derived dataset is published. **Low confidence** that a machine-readable EGP export can be obtained legitimately; assume it can't.

## 2. A working inventory

The table below is a **synthesis**, not a quotation of either source. It is at the granularity a practice tool needs — coarse enough that a structure is a meaningful practice unit, fine enough that "conditionals" doesn't span four levels.

> **Confidence: medium-high, and partially verified.** The table was assembled here rather than quoted. It has since been **checked against the Core Inventory PDF's own grammar lists** (2nd ed. 2015, the level-summary table), which confirmed most rows and contradicted several — see §2.1 below, which is the more useful part of this section. It has **not** been checked against EGP, whose site is client-rendered and needs a real browser. Rows marked † are where the two sources disagree or one is silent.

| Level | Structures |
|---|---|
| **A1** | present simple (be / have got / regular verbs) · present continuous · imperatives · articles a/an/the · plural nouns · possessive 's and adjectives · personal & object pronouns · demonstratives · basic prepositions of place & time · can for ability · there is/are · question forms with do/does · and/but/because · adjective order (basic) · common adverbs of frequency · past simple of *be* |
| **A2** | past simple (regular & irregular) · past continuous · present perfect for experience† · going to & will for future · comparatives & superlatives · countable/uncountable + some/any/much/many · modals: should, must, have to, might · first conditional · zero conditional · adverbs of manner · infinitive of purpose · gerunds after common verbs · basic phrasal verbs · so/because/although (simple) |
| **B1** | present perfect vs past simple† · present perfect continuous · past perfect · second conditional · reported speech (statements) · defining relative clauses · passive voice (present & past simple) · used to / would for past habits · modals of deduction (must/might/can't be) · verb patterns (verb + -ing vs infinitive) · quantifiers (a few, a little, enough, too) · question tags · future continuous · linkers: however, therefore, in addition |
| **B2** | third conditional · mixed conditionals · past perfect continuous · full range of passives (perfect, modal, passive infinitive) · reported speech (questions, commands, wider reporting verbs) · non-defining relative clauses · participle clauses† · wish / if only · modal perfects (should have, might have) · causative have/get something done · concessive clauses (although, despite, whereas) · gerund vs infinitive with meaning change (remember/stop/try) · phrasal verbs (separable/inseparable, figurative) · future perfect & future in the past · hedging with modals of probability · so/such … that · comparative intensifiers (far more, nowhere near as) |
| **C1** | cleft sentences (it-clefts, wh-clefts) · inversion for emphasis (rarely, not only, no sooner) · reduced & reduced relative clauses · subjunctive & unreal past (it's time, I'd rather, suppose) · advanced ellipsis and substitution · nominalisation · fronting and marked word order · complex noun phrases with multiple post-modifiers · discourse markers for stance (admittedly, arguably, granted) · passive reporting structures (it is said that / he is thought to) · past modals of speculation with continuous aspect · emphatic do · concession with inversion (much as, hard though) |
| **C2** | full range of inversion including conditional inversion (had I known, were it not for) · subtle aspectual contrasts and marked tense choices for stance · complex subordination and embedding across several clauses · idiomatic and metaphorical patterning of grammar · register-conditioned syntactic choices · deliberate rule-breaking for rhetorical effect · extended parallelism and rhetorical structuring · fine-grained hedging and evidentiality |

### 2.1 What checking against the Core Inventory actually found

The CIGE PDF was fetched and its per-level grammar lists read directly on 2026-08-12. Most of the table above survives contact with it. These are the places it doesn't, and they are the most valuable output of this document — **each one is a row where the `level_source` field in §4 will have to record two levels, not one.**

| Structure | My table | **Core Inventory** | Note |
|---|---|---|---|
| Third conditional | B2 | **B1** ("Conditionals, 2nd and 3rd") | CIGE puts both at B1; most coursebooks and EGP treat 3rd as B2. A real disagreement. |
| Modal perfects (should have, might have) | B2 | **B1** ("Modals – should have/might have/etc") | Same pattern — CIGE is a level more optimistic. |
| Used to / would for past habits | B1 | **B2** ("Would expressing habits, in the past") | CIGE is *later* here, the opposite direction. |
| Full passive range | B2 | **C1** ("Passive forms, all"); simple passive B1, "Passives" B2 | CIGE spreads passives across three levels. |
| Phrasal verbs | A2 basic / B2 figurative | A2 common · B1 extended · **B2 extended** · **C1 especially splitting** | Four levels, not two. |
| Concessive clauses (although/despite/whereas) | B2 grammar | **C1, and filed under *discourse markers*, not grammar** | Directly relevant — the corpus has a B2–C1 article on this. |
| Wish / if only | B2 | B2 ("Wish") **and C1** ("Wish/if only regrets") | Split by function. |
| **Cleft sentences** | C1 | **Absent entirely** | Not in CIGE at any level. My C1 placement rests on EGP and convention alone. |
| **Participle clauses** | B2† | **Absent entirely** | Same — the † was warranted. |
| Causative have/get something done | B2 | **Absent** | |
| Narrative tenses | — | **B2** | A category I omitted; CIGE treats it as a unit. |
| Complex question tags | B1 (plain tags) | **B1** ("Complex question tags") | Agreement. |
| Present perfect | A2† | **A2**, with "Present perfect/past simple" at B1 | Agreement — the † resolved in favour of both. |
| Mixed conditionals | B2 | **B2**, and again at C1 "in past, present and future" | Agreement. |
| Inversion with negative adverbials | C1 | **C1** | Agreement. |

Three patterns worth naming:

**CIGE is systematically earlier on modals and conditionals.** Third conditionals and modal perfects both sit a level below where the table above (and general coursebook practice) puts them. Plausibly because CIGE records what is *introduced* in a syllabus, while EGP records when learners *reliably produce* it — those are genuinely different events, and the gap between them is exactly the space a practice tool operates in.

**CIGE is silent on several structures this project already teaches.** Cleft sentences and participle clauses — two of the eleven articles — appear nowhere in it. That is not evidence they're misplaced; it's evidence CIGE's grammar lists are coarse (roughly 10–33 items per level) and stop at C1. It does mean their levels rest on EGP and convention, and should be marked lower-confidence in the data.

**CIGE's C1 grammar list is short — ten items** — while its C1 *discourse marker* and *vocabulary* rows grow. That's a substantive claim about the level: advancing past B2 is less about new structures than about discourse, register and lexis. A grammar practice tool aimed at C1 should expect diminishing returns from structure drilling and is why [`04-exercise-design.md`](04-exercise-design.md) ranks meaning-prompted production above form manipulation.

> **Confidence: high** on what the CIGE PDF says — read directly from the published document. **Medium** on the characterisation of *why* CIGE and convention diverge on modals and conditionals; that's my inference, not something either source states.

---

C2 is deliberately vaguer than the other rows, and that is a property of the level rather than a gap in the research: at C2 what distinguishes a user is largely **choice among options they already control**, which resists listing as discrete structures. Also note CIGE stops at C1 entirely, so C2 rests on EGP alone — the part of EGP that the NLP verification study implies is least reliable.

## 3. What the project already covers

The corpus in `site/content/` currently holds **11 articles, all `level: B2-C1`, each with a distinct `grammar_focus`**:

| # | `grammar_focus` | Level in the table above |
|---|---|---|
| 1 | Reported speech | B1 (statements) / B2 (full range) |
| 2 | Third and mixed conditionals | B2 |
| 3 | Passive voice | B1–B2 |
| 4 | Phrasal verbs | B2 |
| 5 | Cleft sentences | C1 |
| 6 | Participle clauses | B2† |
| 7 | Modal perfect | B2 |
| 8 | Inversion for emphasis | C1 |
| 9 | Non-defining relative clauses | B2 |
| 10 | Concessive clauses | B2 |
| 11 | Hedging and modal probability | B2 |

Three observations:

**The rotation is exhausted.** `docs/class-structure.md` lists exactly these eleven points and notes the original eight were "nearly exhausted." They now are — every listed point has one article. The next article needs either a new structure or a second pass at an existing one. **A grammar tool that knows the inventory solves this problem as a side effect**, by making "what's next" a query rather than a judgement call.

**The coverage is B2-weighted and thin at C1.** Only two of eleven are C1 structures, and C2 is untouched. Against the table above, a B2–C1 learner has substantial unworked C1 territory: reduced relatives, nominalisation, unreal past, passive reporting structures, fronting, emphatic *do*.

**Each structure has exactly one text.** One contextualized exemplar per structure is not enough raw material for the repeated, spaced practice §5 of [`01-evidence-base.md`](01-evidence-base.md) calls for. This is the strongest content-side argument for the tool: it makes the shortage visible and prioritisable.

## 4. What the data model needs

Whatever the inventory ends up containing, each structure needs at minimum:

| Field | Why |
|---|---|
| `id` | stable slug, e.g. `mixed-conditionals` |
| `name` | display form |
| `level` | CEFR level, A1–C2 |
| `level_source` | which inventory the level came from, and whether they agreed |
| `function` | what it lets the learner *do* — from CIGE, e.g. "speculating about the past" |
| `prerequisites` | other structure ids that should come first |
| `articles` | article slugs whose `grammar_focus` is this structure |
| `confusable_with` | structures it is worth contrasting against — the basis for interleaving |

`prerequisites` is what turns a flat list into a sequence, and is the one field neither published source supplies directly — it has to be derived from level plus linguistic dependency (mixed conditionals require third conditionals; cleft sentences require relative clause syntax). That derivation is a judgement call and should be marked as such in the data.

`confusable_with` is doing more work than it looks like: §5 of [`01-evidence-base.md`](01-evidence-base.md) found interleaving helps accuracy, and the useful interleaving is between structures a learner actually confuses, not random ones.
