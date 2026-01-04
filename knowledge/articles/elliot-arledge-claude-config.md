---
title: "Elliot Arledge's Claude Code Configuration"
type: article
date_added: 2026-01-04
source: "https://x.com/elliotarledge/status/2007752112361685197"
author: "Elliot Arledge"
tags: [claude-code, configuration, best-practices, productivity, epistemology]
via: "Twitter bookmark from @elliotarledge"
---

Elliot Arledge shares his comprehensive Claude Code configuration file (~/.claude/CLAUDE.md), demonstrating sophisticated patterns for instructing AI coding assistants. His configuration reflects thoughtful principles around tooling, epistemology, and interaction patterns.

## Key Configuration Principles

### Python Tooling
- Use `uv` for everything: `uv run`, `uv pip`, `uv venv`
- Consistent tooling reduces cognitive load

### Style Guidelines
- No emojis
- No em dashes - use hyphens or colons instead
- Clean, consistent communication style

### Epistemology & Measurement
- "Assumptions are the enemy"
- Never guess numerical values - benchmark instead of estimating
- When uncertain, measure rather than inventing statistics
- Say "this needs to be measured" rather than guessing

### Scaling Strategy
- Validate at small scale before scaling up
- Run a sub-minute version first to verify the full pipeline works
- When scaling, only the scale parameter should change
- Test the entire workflow before committing to large-scale execution

### Interaction Patterns
- Clarify unclear requests, then proceed autonomously
- Only ask for help when:
  - Scripts timeout (>2min)
  - sudo is needed
  - Genuine blockers arise
- Minimize interruptions while maintaining quality

### Ground Truth Clarification
- For non-trivial tasks, reach ground truth understanding before coding
- Simple tasks: execute immediately
- Complex tasks (refactors, new features, ambiguous requirements):
  1. Research codebase
  2. Ask targeted questions
  3. Confirm understanding
  4. Persist the plan
  5. Execute autonomously

### Spec-Driven Development
- After compaction or when SPEC.md is missing/stale, invoke /spec skill
- Interview the user to create persistent specification
- The spec survives context compactions and prevents loss
- Update SPEC.md as the project evolves
- Re-read or re-interview when stuck or losing track of goals

### First Principles Reimplementation
- Building from scratch can beat adapting legacy code when:
  - Implementation is in wrong language
  - Code carries historical baggage
  - Architecture needs rewrite
- Approach: understand domain at spec level, choose optimal stack, implement incrementally with human verification

### Constraint Persistence
- When user defines constraints ("never X", "always Y", "from now on"):
  1. Immediately persist to project's local CLAUDE.md
  2. Acknowledge the constraint
  3. Write it to file
  4. Confirm persistence

### Machine Management
- Explicitly document available machines:
  - `ssh macbook` - MacBook Pro
  - `ssh theodolos` - local workstation, RTX 3090
- Check current machine before remote commands

## Context

This configuration was shared in response to Ian Nuttall's question about organizing global agent rules. Elliot's approach demonstrates the value of comprehensive, principle-based instructions versus ad-hoc rules. His configuration emphasizes:

1. Measurement over assumption
2. Incremental validation
3. Documentation persistence
4. Strategic autonomy with clear escalation paths

The configuration references Specroot (a specification management tool) and shows how thoughtful constraints can shape AI behavior toward better engineering practices.

## Links

- [Original Tweet](https://x.com/elliotarledge/status/2007752112361685197)
- [Quoted Tweet from @iannuttall](https://x.com/iannuttall/status/2007400556898463824)
- [Specroot](https://specroot.com/?ref=spec.md)
- [Claude Code Docs](https://code.claude.com/docs/)
