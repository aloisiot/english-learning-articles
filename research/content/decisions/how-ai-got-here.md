# How AI Got Here — decisions

Why this series is written the way it is. **Kept permanently**, including
after the series ships — this is what a future revision needs so it does
not undo a deliberate choice.

Progress tracking for this series lives (while it is unfinished) in
[`../progress/how-ai-got-here.md`](../progress/how-ai-got-here.md).

## Theme & throughline

How a 70-year-old question — can a machine think? — turned into ordinary
infrastructure, and what that transformation cost along the way. The order
is chronological through the first three articles (the question, the
collapses, the breakthrough), then shifts to consequences: what the
technology is genuinely good at, what it charges for that, and what we
still cannot verify about it.

## Research notes

### Subject 1 — The question before the machines

**Sources (all verified live):**

- [Computing Machinery and Intelligence (1950), full text PDF — Oxford e-library](https://www.cs.ox.ac.uk/activities/ieg/e-library/sources/t_article.pdf) — primary source
- [A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence (31 August 1955) — McCarthy's own archive, Stanford](http://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html) — primary source
- [Turing test — Encyclopaedia Britannica](https://www.britannica.com/technology/Turing-test)
- [The Turing Test — Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/entries/turing-test/)
- [Artificial Intelligence (AI) Coined at Dartmouth — Dartmouth College](https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth)

**Facts the article can use:**

- Turing's paper: "Computing Machinery and Intelligence", *Mind* 59(236),
  1950, pp. 433-460. It opens by proposing to consider "Can machines
  think?" — then replaces that question, on the grounds that it is too
  vague to answer, with a game.
- The imitation game: an interrogator communicates in writing with two
  hidden participants, one human and one machine, and must say which is
  which. Turing's move is to swap an unanswerable question about inner
  states for an observable test of behaviour.
- Turing's prediction, verbatim from Britannica: by the year 2000 a
  computer "would be able to play the imitation game so well that an
  average interrogator will not have more than a 70-percent chance of
  making the right identification (machine or human) after five minutes
  of questioning."
- Searle's "Chinese room" (**1980** — "Minds, Brains, and Programs",
  *Behavioral and Brain Sciences* 3, pp. 417–424) is the standard
  counter-argument: a
  person following a rulebook could pass the test in a language they do
  not understand, so passing may show nothing about thinking.
- The Dartmouth proposal is dated **31 August 1955**, a year before the
  workshop. Authors: John McCarthy (Dartmouth), Marvin Minsky (Harvard),
  Nathaniel Rochester (IBM), Claude Shannon (Bell Labs).
- Its opening line: "We propose that a 2 month, 10 man study of
  artificial intelligence be carried out during the summer of 1956 at
  Dartmouth College" — this is the first appearance of the phrase.
- The founding conjecture, verbatim: the study is "to proceed on the
  basis of the conjecture that every aspect of learning or any other
  feature of intelligence can in principle be so precisely described that
  a machine can be made to simulate it."
- They asked the Rockefeller Foundation for **$13,500** — the whole
  founding of the field costed out to about the price of a car.
- McCarthy's own 1996 annotation on the archived proposal, about the
  promised report from the workshop: "**There was no report.**"

**Angle.** The two moments rhyme: Turing sidesteps an unanswerable
question by inventing a test, and the Dartmouth group sidesteps it by
naming a research programme and booking eight weeks to solve it. Both are
acts of confident framing rather than discovery — which is exactly what
makes them a good opening for a series about a field that kept
over-promising. The $13,500 budget and the missing report are the details
that make it land.

**Grammar fit.** Modal perfect works naturally here: *they could have
chosen a different name; the group must have expected faster progress;
Turing might have been surprised by what "passing" came to mean.*

**Care needed.** Britannica states "no computer has come close to this
standard" while also noting ChatGPT reignited the debate — the two sit
awkwardly together. The article should not assert either that the Turing
test has been passed or that it hasn't; the honest and more interesting
line is that the test turned out to measure something other than what
people expected.

**Do not "re-correct" the Searle date to 1981.** Britannica contradicts
itself: its *Turing test* article says "In 1981 American philosopher John
Searle proposed the 'Chinese room' argument", while its own entry on the
paper gives 1980. The paper is 1980 — *Behavioral and Brain Sciences* 3,
pp. 417–424 — and 1980 is what this file uses. Anyone re-checking against
the Turing-test page alone will think it is wrong; it is not.

### Subject 2 — The winters nobody predicted

**Sources (all verified live):**

- [Artificial Intelligence: A General Survey (the Lighthill report), full text — Chilton Computing archive](http://www.chilton-computing.org.uk/inf/literature/reports/lighthill_report/p001.htm) — primary source
- [Olazaran, "A Sociological Study of the Official History of the Perceptrons Controversy", *Social Studies of Science* 26(3), 1996](https://doi.org/10.1177/030631296026003005) — peer-reviewed
- [Newell, review of *Perceptrons*, *Science* 165(3895), 1969](https://doi.org/10.1126/science.165.3895.780) — contemporary review
- [A brief history of AI: how to prevent another winter (a critical review), arXiv 2109.01517](https://arxiv.org/pdf/2109.01517)
- [*Perceptrons* (Minsky & Papert, 1969) — overview and reception](https://en.wikipedia.org/wiki/Perceptrons_(book))

**Facts the article can use:**

- Rosenblatt's perceptron: published 1958 ("The perceptron: a probabilistic
  model for information storage and organization in the brain",
  *Psychological Review* 65(6)). Press coverage and Rosenblatt's own
  statements claimed neural nets would soon see images, beat humans at
  chess, and reproduce themselves.
- Minsky & Papert, *Perceptrons* (1969), proved single-layer perceptrons
  could not compute parity or connectedness under their locality
  conditions — the XOR result is the famous shorthand.
- The Lighthill report is dated **July 1972**, published early 1973, and
  runs 49 pages. Commissioned by the UK Science Research Council.
- Its verdict, verbatim: "In no part of the field have the discoveries
  made so far produced the major impact that was then promised."
- Its diagnosis, verbatim: the general cause was "failure to recognise
  the implications of the *combinatorial explosion*" — the number of
  possibilities to examine grows explosively as a problem scales.
- Lighthill's own framing of his authority, verbatim from the report: it
  "would simply describe how AI appears to a lay person after two months
  spent looking through the literature", and represents "only the
  personal view of the author". He was a fluid dynamicist, not an AI
  researcher.
- The report singles out machine translation: "The most notorious
  disappointments... have appeared in the area of machine translation,
  where enormous sums have been spent with very little useful result."
  (Note the plural — an earlier draft quoted this as a singular
  "disappointment", which is a misquote. The articles paraphrase rather
  than quote this phrase, so they are unaffected, but any future direct
  quotation must keep the plural.)
- Aftermath: UK funding cut at all but a couple of universities; US
  funders followed. A second collapse came around 1987 with the failure
  of expert systems and the specialised Lisp-machine market, as ordinary
  workstations became cheaper and faster.

**Angle.** The standard story — "one book and one report killed AI for a
decade" — is too tidy, and the better sources say so. Olazaran's
sociological study argues *Perceptrons* got its reputation as the
"neural network killer" largely from timing: it appeared just as symbolic
AI was winning the competition for funding and people, so there was
almost nobody left to object. Minsky and Papert themselves later said
neural net research waned for its own internal reasons. The honest and
more interesting article is about how a field talks itself into a
collapse: extravagant public claims, a credibility gap, then an outsider
with a two-month literature review whose personal opinion is treated as a
verdict.

**Grammar fit.** Inversion for emphasis suits the drama without
overstating it: *Never had a research field promised so much so publicly;
Only later did it become clear that the report was one person's view;
Rarely has a single document been blamed for so much.*

**Care needed.** Do not assert that *Perceptrons* or Lighthill "caused"
the winter — that is contested, and the contest is the interesting part.
Also avoid the widely-repeated 1958 New York Times "walk, talk, see,
write, reproduce itself and be conscious of its existence" quotation
unless it can be sourced to the paper itself; it circulates mostly via
blogs. The sourced version of the same point is that press reports and
Rosenblatt's own statements made comparable claims.

**Series link.** Lighthill names machine translation as the field's worst
embarrassment. Article 4 covers translation as a present-day success.
That reversal should be an explicit callback.

### Subject 3 — Why it suddenly worked

**Sources (all verified live):**

- [Krizhevsky, Sutskever & Hinton, "ImageNet Classification with Deep Convolutional Neural Networks" (AlexNet), NeurIPS 2012](https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks) — primary source
- [Vaswani et al., "Attention Is All You Need", arXiv:1706.03762 (12 June 2017)](https://arxiv.org/abs/1706.03762) — primary source
- [Hwang, "Computational Power and the Social Impact of Artificial Intelligence", arXiv:1803.08971](https://arxiv.org/abs/1803.08971)
- [A brief history of AI: how to prevent another winter (a critical review), arXiv 2109.01517](https://arxiv.org/pdf/2109.01517)

**Facts the article can use:**

- AlexNet won the 2012 ImageNet challenge, cutting the top-5 error rate
  from about 26% to about 15% — a margin large enough that the result
  read as a change of method rather than an incremental gain.
- Its ingredients were not new ideas: convolutional networks and
  backpropagation dated from the 1980s. What was new was scale — a large
  labelled dataset (ImageNet) and an efficient GPU implementation, with
  training split across two GPUs.
- The transformer paper, "Attention Is All You Need", was submitted on
  12 June 2017 by eight authors at Google. It removed recurrence
  entirely and relied on attention alone.
- From its abstract, verbatim: the model reached a state-of-the-art BLEU
  score of 41.8 on WMT 2014 English-to-French "after training for 3.5
  days on eight GPUs, a small fraction of the training costs of the best
  models from the literature."
- The transformer's headline results were on **machine translation** —
  precisely the task Lighthill had named the field's most notorious
  disappointment 45 years earlier.
- The thread running through both: the constraint had been compute and
  data, not the theory. GPUs made the arithmetic cheap enough, and the
  internet made the data abundant enough, for old ideas to finally work.

**Angle.** The most interesting thing about the breakthrough is how
boring the explanation is. There was no conceptual revelation — the core
ideas were decades old and had already been declared dead once. What
changed was that the surrounding conditions caught up. This is the
article that makes the series' argument: AI's history is less a story of
insight than of when the arithmetic became affordable.

**Grammar fit.** Phrasal verbs are natural for a story about things
gathering momentum: *the field took off; the approach caught on; results
turned out better than anyone expected; researchers had written the idea
off.*

**Care needed.** Resist the "lone genius" framing. Also note the irony
worth landing gently rather than hammering: the 2017 paper boasts of
using only eight GPUs for 3.5 days, which by the standards of article 5
is almost nothing. That contrast is the cleanest way to show how fast the
scale-up happened.

**Series links.** Callback to article 2 (translation as the field's worst
embarrassment, now its showcase result). Forward link to articles 5 and
6: the costs and the opacity both follow from this scale-up, not from the
ideas themselves.

### Subject 4 — What it is actually good at

**Sources (all verified live):**

- [Computational protein design and protein structure prediction win Nobel Prize in Chemistry — EMBL](https://www.embl.org/news/science-technology/alphafold-wins-nobel-prize-chemistry-2024/)
- [The Nobel Prize in Chemistry 2024 — NobelPrize.org](https://www.nobelprize.org/prizes/chemistry/2024/press-release/)
- [AlphaFold Protein Structure Database — EMBL-EBI](https://www.alphafold.ebi.ac.uk/)
- [Assistive technology — World Health Organization fact sheet](https://www.who.int/news-room/fact-sheets/detail/assistive-technology)
- [Vaswani et al., "Attention Is All You Need" (translation results)](https://arxiv.org/abs/1706.03762)

**Facts the article can use:**

- The 2024 Nobel Prize in Chemistry went half to David Baker for
  computational protein design, half jointly to Demis Hassabis and John
  Jumper for protein structure prediction with AlphaFold.
- The scale comparison, from EMBL: in roughly **60 years** of experimental
  work using X-ray crystallography and cryo-EM, biologists determined the
  structures of about **190,000 proteins**. The AlphaFold database
  launched in July 2021 with about 360,000 predictions and now holds
  about **200 million**, covering over a million organisms.
- It was made freely and openly available through EMBL-EBI; over a
  million users from nearly every country.
- Jumper's own framing, verbatim: "Public data were essential to the
  development of AlphaFold... The careful curation of such large data
  resources, representing the collective output of an entire subfield of
  biology, is exactly what enables our machine learning models to
  generalise well."
- Why structures matter, concretely: determining the structure of
  SARS-CoV-2 proteins helped scientists understand how the virus works
  and develop treatments and vaccines.
- Machine translation: the task Lighthill called the field's most
  notorious disappointment in 1972 is now routine, and was the headline
  benchmark of the 2017 transformer paper.
- Accessibility (WHO): more than **2.5 billion people** currently need at
  least one assistive product, projected to reach **3.5 billion by 2050**.
  WHO explicitly counts digital solutions such as speech recognition and
  captioning as assistive products. In many countries most people who
  need them still cannot get them.

**Angle.** Deliberately concrete and unhyped. The strongest case for AI is
not chatbots writing essays but the 190,000-versus-200-million contrast:
a measurement problem that took structural biology sixty years was
substantially reframed in about three. Note that the honest version of
this story is not "the machine replaced the scientists" — Jumper's own
point is that AlphaFold only worked because generations of
crystallographers had carefully curated the data it learned from.

**Grammar fit.** Non-defining relative clauses carry the explanatory
asides this article needs without extra sentences: *AlphaFold, which was
released freely through a European public database, has been used by more
than a million researchers; machine translation, which Lighthill singled
out as the field's worst failure, is now unremarkable.*

**Care needed.** Avoid implying AI "solved" protein folding — predictions
are predictions, and confidence varies by target. Avoid the market-size
framing for accessibility (assistive-tech market figures come mostly from
vendor blogs); the WHO fact sheet is the citable source, and the access
gap belongs in the article, not just the benefit.

**Series links.** Direct callback to article 2 (translation). Jumper's
"public data were essential" line sets up article 5's questions about
where training data comes from and who is credited for it.

### Subject 5 — The bill that came later

**Sources (all verified live):**

- [Perrigo, "Exclusive: The $2 Per Hour Workers Who Made ChatGPT Safer", TIME, 18 January 2023](https://time.com/6247678/openai-chatgpt-kenya-workers/) — original investigation
- [Court Grants Final Approval of $1.5 Billion Anthropic Copyright Settlement — The Authors Guild](https://authorsguild.org/news/court-grants-final-approval-anthropic-copyright-settlement/)
- [AAP Applauds Court's Preliminary Approval of Bartz v. Anthropic Settlement — Association of American Publishers](https://publishers.org/news/aap-applauds-courts-preliminary-approval-of-bartz-v-anthropic-settlement/)
- [Judge approves record $1.5 billion AI copyright settlement involving Anthropic — JURIST](https://www.jurist.org/news/2026/07/judge-approves-record-1-5-billion-settlement-involving-anthropic/)
- [Gartner: Data Center Electricity Consumption to Grow 26% in 2026](https://www.gartner.com/en/newsroom/press-releases/2026-06-10-gartner-says-data-center-electricity-demand-to-grow-26-percent-in-2026)
- [AI, Data Centers, and the U.S. Electric Grid — Belfer Center, Harvard Kennedy School](https://www.belfercenter.org/research-analysis/ai-data-centers-us-electric-grid)

**Facts the article can use:**

*The labour behind "automatic":*

- TIME's January 2023 investigation found OpenAI used outsourced Kenyan
  workers, via the firm Sama, earning roughly **$1.32 to $2 per hour**,
  to label text depicting violence, hate speech and abuse so that
  ChatGPT could learn to filter it.
- The work was psychologically hazardous and support was reported as
  inadequate. The point for the article: the system that appears to
  moderate itself was taught to do so by people, cheaply, out of sight.

*Training data and copyright:*

- In June 2025 Judge William Alsup ruled in *Bartz v. Anthropic* that
  training on lawfully acquired books was fair use, but that downloading
  them from pirate sites was not — separating two questions that are
  often collapsed into one.
- The case settled for **$1.5 billion**, covering roughly half a million
  books; final approval was granted on 20 July 2026. Reported as the
  largest copyright recovery on record.
- Many other cases remain unresolved, so the law here is genuinely
  unsettled rather than decided.

*Energy* (overlap with the standalone article is accepted — keep it brief
here and use different figures):

- Data centre electricity demand rising sharply through 2026; grid
  expansion takes far longer to build than data centres do.

**Angle.** The unifying idea is that the costs are not side effects but
inputs: the cheap labour, the scraped text, and the electricity were all
required to produce the capability. Callback to article 4 — Jumper's
"public data were essential" is the same observation stated approvingly,
about a case where the data was curated and shared deliberately. Article
5 asks what happens when it wasn't.

**Grammar fit.** Concessive clauses carry the balance this article needs:
*Although the system appears to run by itself, people trained it;
Despite winning on fair use, the company still paid $1.5 billion;
Whereas the electricity is measurable, the labour is largely invisible.*

**Care needed.** The *Bartz v. Anthropic* case involves Anthropic, which
made the assistant drafting these notes. Treat it as one case among
several, state only what the court record and the plaintiffs'
organisations report, and do not editorialise in either direction. The
Authors Guild and AAP are parties' organisations — accurate on their own
case but not neutral commentators, so attribute rather than assert.
Also avoid implying the law is settled: it is not.

**Do not collapse "training" and "piracy" into one claim.** The ruling
separated them: training on lawfully obtained books was fair use;
downloading them from pirate sites was not. The settlement followed from
the second, not the first. This distinction is the point of the
paragraph and of discussion question 2 — and it is easy to lose when
compressing, which is exactly what happened once in the Quick Recap
("books used for training in ways that produced a record settlement",
since corrected). Any summary of this article must keep the two apart.

### Subject 6 — The part we still cannot check

**Sources (all verified live):**

- [Kalai, Nachum, Vempala et al., "Evaluating large language models for accuracy incentivizes hallucinations", *Nature*](https://www.nature.com/articles/s41586-026-10549-w) — peer-reviewed
- [Why Language Models Hallucinate, arXiv:2509.04664 (September 2025)](https://arxiv.org/pdf/2509.04664)
- [Why language models hallucinate — OpenAI](https://openai.com/index/why-language-models-hallucinate/)
- [A Survey on Large Language Model Benchmarks, arXiv:2508.15361](https://arxiv.org/pdf/2508.15361)

**Facts the article can use:**

- The central finding, now published in *Nature*: models hallucinate
  partly because training and evaluation **reward guessing over
  admitting uncertainty**. Graded on accuracy alone, a confident guess
  beats "I don't know".
- The authors' own analogy: a student facing a hard exam question. A wild
  guess might be right; leaving it blank guarantees zero. The incentive
  structure, not just the architecture, produces confident errors.
- Their proposed remedy is unglamorous and telling: change the scoring,
  so that appropriate expressions of uncertainty are rewarded rather than
  penalised.
- A large and growing body of work exists purely on *detecting*
  hallucination — a research field devoted to checking the output of
  systems whose reasoning cannot be inspected directly.

**Angle.** This closes the series on the honest open question. Article 1
opened with Turing replacing "can machines think?" with a test of whether
a machine can *seem* human in conversation. Seventy-five years later the
field's most persistent problem is that these systems are extremely good
at seeming right — and that we largely grade them on exactly that. The
series ends where it started, with a measurement problem: we built the
test around plausibility, and got systems optimised for plausibility.

**Grammar fit.** Hedging and modal probability is both the grammar point
and the subject matter — the article is about uncertainty, so the
language should model it: *the model may be wrong; this is likely to
happen when; it could be that; we cannot be certain whether.* Worth
making that connection explicit in the grammar spotlight, as it is the
one place in the series where form and content align this neatly.

**Care needed.** Do not overstate. "We cannot check" means evaluation and
interpretability are hard and unsolved, not that nothing is known or that
the systems are useless — article 4 already established real,
well-evidenced capability. Keep the closing genuinely open; the last
discussion of the series should not arrive at a verdict.

**Series links.** Bookend to article 1 (Turing's test measured
plausibility; so, still, do we). Callback to article 3 (opacity follows
from the scale-up, not from the original ideas).

## Coherence notes

- **Framing.** The arc is deliberately unsentimental in both directions:
  article 4 resists the reflex to dismiss real benefits, article 5 resists
  treating costs as inevitable. Neither a boosterish nor a doom framing.
- **Ordering rationale.** Articles 1-3 have a genuine time axis and are
  ordered chronologically, so the sequence needs no further justification.
  Articles 4-6 have no time axis and are ordered conceptually instead:
  what it does well → what that costs → what remains unverifiable. Article
  6 closes on an open question deliberately, as the final class should end
  in live discussion rather than a settled conclusion.
- **Deliberate callback.** Article 3 establishes that the core ideas were
  decades old and only the surrounding conditions changed. Articles 5 and
  6 should both lean on that: the costs and the opacity are consequences
  of the scale-up, not of the ideas themselves.
- **Two confirmed series-wide callbacks**, both found during research
  rather than planned:
  1. *Machine translation.* The Lighthill report (article 2) names it the
     field's "most notorious disappointment"; the transformer paper
     (article 3) uses it as its headline benchmark; it appears as an
     everyday success in article 4. One thread across three articles.
  2. *Plausibility as the measure.* Turing (article 1) replaced "can
     machines think?" with a test of whether a machine can seem human;
     article 6 closes on the finding that grading models on apparent
     correctness is itself a cause of confident error. The series
     bookends on the same problem.
- **Known overlap, accepted.** The existing standalone article
  `2026-08-07-ai-power-hunger.md` covers AI's electricity demand. The user
  chose to keep both, so article 5 may cover energy as well. To keep the
  overlap from reading as repetition, article 5 should treat energy as one
  item among several costs rather than its main subject, and use different
  figures/examples where possible.
- **Grammar points already used site-wide** (do not reuse in this series):
  reported speech, third/mixed conditionals, cleft sentences, passive
  voice, participle clauses.
- **Rotation extended.** Non-defining relative clauses, concessive
  clauses, and hedging/modal probability are new additions to the
  site-wide rotation list, agreed with the user because the original eight
  were nearly exhausted.
- **Length.** Up to ~500 words for the reading section, raised from the
  previous 200-250 guideline. The class timing budget is unchanged: the
  learner reads quickly and the earlier articles ran shorter than the
  budget allowed, so the longer text still fits the same 5-minute slot.
  Treat 500 as an upper bound, not a target — a subject well covered in
  380 words should stay at 380 rather than be padded out.
