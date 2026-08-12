---
title: We Built a Test for Sounding Right
date: '2026-08-12'
level: B2-C1
topic: technology
grammar_focus: Hedging and modal probability
keywords:
  - hallucination
  - evaluation
  - uncertainty
  - interpretability
  - hedging
  - history of ai
summary: >-
  Seventy-five years after Turing, the field's most stubborn problem is that
  these systems are extremely good at seeming right — and that is largely what
  we grade them on.
series: how-ai-got-here
series_order: 6
cover_image: /images/covers/2026-08-12-the-part-we-cannot-check.webp
cover_image_thumb: /images/covers/2026-08-12-the-part-we-cannot-check-thumb.webp
cover_image_alt: 'A valley filled with low fog, with tree-covered slopes emerging above the mist'
cover_image_credit: >-
  Photo by czorn on Wikimedia Commons (CC BY-SA 3.0,
  https://creativecommons.org/licenses/by-sa/3.0)
---

## Grammar Spotlight: Hedging and Modal Probability

Hedging is how English expresses degrees of confidence. Modal verbs carry most of the weight — *must* for near-certainty, *may*, *might* and *could* for possibility, *cannot* for near-impossibility — supported by phrases such as *it appears that*, *is likely to*, and *tends to*. Precise hedging is not vagueness; it is honesty about how much you know.

- Strong: The model **must have** seen this text before.
- Middle: The answer **is likely to** be wrong in the details.
- Weak: There **may be** cases we have not tested.
- Denial of certainty: We **cannot** be sure why it produced that.

## The Machine That Would Rather Guess

Ask a language model a question it has no basis for answering, and it will often answer anyway — fluently, plausibly, and wrongly. The industry calls this hallucination, which may be too gentle a word for text that appears authoritative and is simply invented.

The interesting question is why it happens, and recent work published in *Nature* offers an uncomfortable answer: we may be training it in. If a system is graded only on whether its answers are correct, then saying "I don't know" scores zero, whereas a confident guess might be right. The researchers compare it to a student facing a hard exam question. Leaving the answer blank guarantees no marks; guessing could pay off. Under that scoring, a model that hedges honestly tends to look worse than one that bluffs well.

Their proposed fix is unglamorous, which is part of why it is convincing. Rather than redesigning the systems, change the scoring — reward appropriate expressions of uncertainty instead of penalising them.

Meanwhile a whole research field has grown up around detecting hallucinations after the fact: benchmarks, taxonomies, automated checkers. It is worth pausing on what that implies. We appear to have built systems whose reasoning we cannot directly inspect, and we are now building further systems to check their work.

This is where the story returns to where it began. In 1950 Turing set aside the question of whether a machine can think and replaced it with a test of whether one can seem human in conversation. Seventy-five years later, the field's most persistent problem may be exactly that: we made plausibility the measure, and we appear to have got systems that are superb at plausibility. Whether that was the wrong question all along is still, genuinely, an open one.

## Key Vocabulary

- **to hedge** — to express something cautiously, avoiding a firm commitment. *A good scientist hedges when the evidence is thin.*
- **to bluff** — to pretend confidence or knowledge you do not have. *The model bluffs rather than admit uncertainty.*
- **plausible** — seeming reasonable or believable, though possibly false. *The explanation was plausible but entirely invented.*
- **to inspect** — to examine closely in order to understand. *We cannot inspect the reasoning directly.*
- **unglamorous** — dull, lacking excitement or prestige. *The fix is unglamorous: change the marking scheme.*

## Discussion Questions

1. Do you check what an AI system tells you? What would make you trust an answer more — or less?
2. If a system said "I don't know" more often, would you find it more useful or more annoying? Be honest.
3. We reward confident answers in people too — in interviews, exams, meetings. Is the machine's problem really a human habit?
4. Looking back across this series, which moment do you think mattered most: the question, the collapse, the breakthrough, or the bill?

## Quick Recap

Language models produce confident, fluent, invented answers partly because our evaluations reward guessing over admitting uncertainty — graded on accuracy alone, a guess beats "I don't know". The proposed fix is to change the scoring rather than the systems. Seventy-five years after Turing made seeming-human the test, we appear to have built machines optimised for seeming right.

## References

- [Kalai, Nachum, Vempala et al., "Evaluating large language models for accuracy incentivizes hallucinations", *Nature*](https://www.nature.com/articles/s41586-026-10549-w)
- ["Why Language Models Hallucinate", arXiv:2509.04664 (September 2025)](https://arxiv.org/pdf/2509.04664)
- [Why language models hallucinate — OpenAI](https://openai.com/index/why-language-models-hallucinate/)
- [A Survey on Large Language Model Benchmarks, arXiv:2508.15361](https://arxiv.org/pdf/2508.15361)
- [Turing, "Computing Machinery and Intelligence", *Mind* 59(236), 1950](https://www.cs.ox.ac.uk/activities/ieg/e-library/sources/t_article.pdf)
