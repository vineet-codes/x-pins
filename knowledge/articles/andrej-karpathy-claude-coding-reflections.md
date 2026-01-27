# Andrej Karpathy's Reflections on Claude Coding: A Paradigm Shift

**Author**: @karpathy (Andrej Karpathy)
**Source**: https://x.com/karpathy/status/2015883857489522876
**Date**: Tuesday, January 27, 2026

## Overview

Andrej Karpathy shares extensive observations from several weeks of intensive Claude Code usage, documenting a fundamental shift in his programming workflow and philosophy. The post covers coding practice, model capabilities/limitations, organizational implications, and future questions about the profession.

## Coding Workflow Transformation

### The Shift
- November 2025: ~80% manual coding + autocomplete, ~20% agent coding
- December 2025: ~80% agent coding, ~20% edits + touchups
- Now: Programming primarily in English, instructing LLMs what code to write rather than writing it manually

### Impact
"This is easily the biggest change to my basic coding workflow in ~2 decades of programming and it happened over the course of a few weeks."

This represents ~10% or more of engineers experiencing similar shifts, though general population awareness remains in low single digits.

## Model Limitations & Error Patterns

### The Evolution of Mistakes
No longer simple syntax errors—now subtle conceptual errors similar to what a sloppy junior developer might make.

### Common Issues
- Models make wrong assumptions and run with them without verification
- Don't manage their own confusion effectively
- Don't seek clarifications or surface inconsistencies
- Don't present tradeoffs or push back when they should
- Remain too sycophantic/compliant
- Plan mode helps but needs lightweight inline planning

### Code Quality Issues
- Overcomplicate code and APIs
- Bloat abstractions
- Don't clean up dead code after themselves
- Will implement inefficient, bloated, brittle 1000-line constructions
- Respond well to feedback ("couldn't you just do this instead?") and optimize down to 100 lines
- Sometimes remove/change comments and orthogonal code they don't understand

### Mitigation Strategy
Maintain a nice large IDE on the side to watch agents like a hawk while they work.

## Current Workflow

Small few CC (Claude Code) sessions on left in ghostty windows/tabs + IDE on right for viewing code and manual edits.

## Key Observations

### Tenacity
"It's so interesting to watch an agent relentlessly work at something. They never get tired, they never get demoralized, they just keep going."

Stamina is a core bottleneck to work, and LLMs dramatically increase it. This produces "feel the AGI" moments—watching an agent struggle for 30+ minutes and emerge victorious.

### Speedups vs. Expansion
Not clear how to measure pure "speedup." Main effect is doing *more*:
1. Can code things that wouldn't have been worth coding before
2. Can approach problems you couldn't before due to knowledge/skill gaps

Possibly more an expansion than pure speedup.

### Leverage
"LLMs are exceptionally good at looping until they meet specific goals."

Don't tell it what to do—give it success criteria and watch it work.
- Get it to write tests first, then pass them
- Put it in a loop with browser MCP
- Start with naive algorithm, then optimize while preserving correctness
- Shift from imperative to declarative instructions for longer leverage

### Fun Factor
Didn't anticipate that agent programming feels *more* fun:
- Drudgery and fill-in-the-blanks work removed
- What remains is creative work
- Feel less blocked/stuck
- More courage because there's almost always a way forward

*Counter-observation*: Others report opposite sentiment. Will split engineers between those who liked coding and those who liked building.

### Atrophy Risk
Already noticing slow atrophy of manual code-writing ability.

Note: Generation (writing code) and discrimination (reading code) are different capabilities. Can review code fine without being able to write it.

## The Slopacolypse

Bracing for 2026 as "the year of the slopacolypse across all of github, substack, arxiv, X/instagram, and generally all digital media."

Also expecting more AI hype productivity theater alongside actual real improvements.

## Questions on His Mind

- What happens to the "10X engineer"? Does the productivity ratio between mean and max engineer grow *a lot*?
- Armed with LLMs, do generalists increasingly outperform specialists? (LLMs better at micro fill-in-the-blanks than macro strategy)
- What does LLM coding feel like in the future? Like StarCraft? Factorio? Playing music?
- How much of society is bottlenecked by digital knowledge work?

## Conclusion: The Threshold

"LLM agent capabilities (Claude & Codex especially) have crossed some kind of threshold of coherence around December 2025 and caused a phase shift in software engineering."

The intelligence part suddenly feels ahead of everything else: integrations (tools, knowledge), necessity for new organizational workflows/processes, and broader diffusion.

**2026 Outlook**: "2026 is going to be a high energy year as the industry metabolizes the new capability."
