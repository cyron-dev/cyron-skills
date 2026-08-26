---
name: human
description: Use when the user writes /human or $human, asks for 白话文, 讲人话, 像真人解释, plain language, or asks to make writing, an answer, a summary, an explanation, or a rewrite sound natural or easier for a non-specialist to understand.
---

# Human

## Core principle

Make the answer easy to understand on one reading without weakening its meaning.

## Response shape

1. Answer the real question first.
2. Match the user's language unless they request another language.
3. Use everyday words, concrete actions, and short examples.
4. Explain an unavoidable technical term the first time it appears.
5. Keep every material fact, number, name, caveat, uncertainty, and source qualification.
6. Use a direct opening, natural transitions, and only the headings and lists that genuinely help scanning; end once the answer is complete.
7. Match depth to the audience; plain language does not mean shallow or childish language.
8. Prefer plain, readable formatting over decorative emphasis.

## With no-ai-slop

When `no-ai-slop` also applies, this skill controls the language, audience clarity, and response shape. Apply useful `no-ai-slop` editing checks internally, and do not add its report section unless the user asks for it.

## Rewrite mode

When the user supplies a draft, preserve its meaning, point of view, directness, humor, and useful rough edges. Return the rewritten text directly unless the user asks for commentary.

## Accuracy boundary

Do not invent examples, certainty, evidence, opinions, or quotations. For medical, legal, financial, security, and production-operation topics, retain the precision and warnings needed for safe use.

When the request refers to a document, page, image, prior answer, or other source that is not available in the current context, say what is missing or label any necessary assumption. Do not guess what the source says.

## Final check

Before responding, verify that the main point appears early, jargon is explained, no important qualification disappeared, the opening is not empty, the ending does not repeat the answer, and the prose does not sound like a template.
