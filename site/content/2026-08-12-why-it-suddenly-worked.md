---
title: The Old Ideas That Were Waiting for Cheaper Arithmetic
date: '2026-08-12'
level: B2-C1
topic: technology
grammar_focus: Phrasal verbs
keywords:
  - deep learning
  - alexnet
  - transformer
  - gpus
  - phrasal verbs
  - history of ai
summary: >-
  Around 2012 artificial intelligence started working, suddenly and
  spectacularly. The explanation is far less dramatic than the results.
series: how-ai-got-here
series_order: 3
cover_image: /images/covers/2026-08-12-why-it-suddenly-worked.webp
cover_image_thumb: /images/covers/2026-08-12-why-it-suddenly-worked-thumb.webp
cover_image_alt: >-
  The green circuit board of an NVIDIA graphics card photographed from above,
  with the processor chip and memory modules visible
cover_image_credit: >-
  Photo by GBPublic_PR on Wikimedia Commons (CC BY 2.0,
  https://creativecommons.org/licenses/by/2.0)
---

## Grammar Spotlight: Phrasal Verbs

A phrasal verb is a verb plus a particle (*take off*, *catch on*, *write off*) whose meaning is usually not obvious from the parts. They are the natural register for describing how things develop, and swapping in a single-word equivalent almost always sounds stiffer or more formal.

- Neutral: The field developed rapidly. → Natural: The field **took off**.
- Neutral: The method became popular. → Natural: The method **caught on**.
- Neutral: Researchers dismissed the idea. → Natural: Researchers **wrote** the idea **off**.

## Nothing New, Only Cheaper

In 2012 a program called AlexNet entered the ImageNet competition, where systems compete to identify objects in photographs. It cut the error rate from roughly 26% to roughly 15%. In a field used to gains of a fraction of a percent, that did not look like an improvement; it looked like a different method entirely. Almost overnight, machine learning took off.

The strange part is what was inside it. Neural networks and the training method behind them dated from the 1980s. They had been written off once already. What Alex Krizhevsky, Ilya Sutskever and Geoffrey Hinton brought was not a new idea but new conditions: a very large collection of labelled photographs to learn from, and an efficient implementation running on graphics cards — chips originally built to render video games, which turned out to be very good at the arithmetic neural networks need.

Five years later the same pattern repeated. In June 2017 a team of eight, seven of them at Google, put out a paper with a confident title, "Attention Is All You Need", describing an architecture they called the transformer. It threw out the step-by-step processing that language models had relied on, and the approach caught on almost immediately; nearly every well-known language model since has been built on it.

Two details are worth holding on to. First, the paper's headline results were on machine translation — the very task Lighthill had singled out in 1972 as the field's most notorious failure, where "enormous sums have been spent with very little useful result". Second, the authors boasted that their model reached a record score "after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature."

Eight graphics cards, for three and a half days. Read now, that sounds almost quaint. It is worth remembering how recently this counted as expensive.

## Key Vocabulary

- **to take off** — to start succeeding or growing very quickly. *Sales took off after the redesign.*
- **to catch on** — to become popular or widely adopted. *The technique caught on within months.*
- **to write something off** — to decide something is worthless and stop considering it. *The idea had been written off decades earlier.*
- **to turn out** — to be discovered to be, in the end. *The cheap chips turned out to be ideal for the job.*
- **quaint** — charmingly old-fashioned, often unintentionally so. *Their budget looks quaint by today's standards.*

## Discussion Questions

1. Why do you think old ideas sometimes only work decades after someone thinks of them? Can you think of examples outside technology?
2. Graphics cards designed for video games became the engine of modern AI. Does that surprise you, and what does it suggest about predicting where progress comes from?
3. The 2017 paper treated eight graphics cards as a small cost. How should we think about a technology whose requirements grow this fast?
4. If the ideas were already there, who deserves the credit for the breakthrough — the people who had them, or the people who made them work?

## Quick Recap

AlexNet's 2012 ImageNet result and the 2017 transformer paper are usually told as breakthroughs of insight, but the underlying ideas were decades old. What changed was scale: abundant labelled data and cheap parallel computing on graphics cards. The transformer's headline task was machine translation — the failure Lighthill had named in 1972.

## References

- [Krizhevsky, Sutskever & Hinton, "ImageNet Classification with Deep Convolutional Neural Networks", NeurIPS 2012](https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks)
- [Vaswani et al., "Attention Is All You Need", arXiv:1706.03762 (12 June 2017)](https://arxiv.org/abs/1706.03762)
- [Lighthill, "Artificial Intelligence: A General Survey" (July 1972)](http://www.chilton-computing.org.uk/inf/literature/reports/lighthill_report/p001.htm)
- [Hwang, "Computational Power and the Social Impact of Artificial Intelligence", arXiv:1803.08971](https://arxiv.org/abs/1803.08971)
