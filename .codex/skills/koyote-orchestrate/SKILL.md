---
name: koyote-orchestrate
description: Orchestrate end-to-end governance flow (spec, audit, implementation, audit) with dynamic agent discovery, discovery matrix, and explicit decision gates.
---

# koyote-orchestrate

Use this skill to run a **full AI-governed workflow** from specification to implementation,
with audits, agent discovery, and human confirmation gates.

This skill does NOT directly implement code or specs.  
It coordinates other skills and agents and enforces governance.

---

## Repo root resolution

Always operate in the repo root that contains .agent and .specs.
If the current working directory is not the repo root, change to it
before running discovery or referencing any spec files.
If multiple candidates exist, prefer the one that also contains apps/
and package.json (expected: pos-koyote).
Never create a new .specs folder. Always use the existing .specs
folder inside the resolved repo root. If a second .specs is found
outside the repo root, ignore it and stop to confirm before writing.

---

## Governing References (MUST READ)

- .agent/ARCHITECTURE.md
- .agent/AGENT_CONTRACT.md
- .agent/AGENT_RESPONSIBILITIES.md
- .agent/rules/GLOBAL.md
- .agent/rules/SPEC_STANDARD.md
- .agent/rules/DATA_ACCESS.md
- .agent/rules/MEMORY_BANK.md

---

## Dynamic Agent Discovery Protocol (MANDATORY)

Before executing any step, this skill MUST perform agent discovery.

### Discovery Steps

1) Identify the task intent:
   - spec creation
   - spec audit
   - implementation
   - implementation audit

2) Identify affected domains:
   - online-store (frontend, UX, i18n)
   - cloud-api (backend, API, performance)
   - data (Prisma, migrations, schema)
   - POS / IPC (only if explicitly in scope)

3) Discover agents by scanning `.agent/agents/` metadata (frontmatter)
   and selecting agents that:
   - Declare `applies_to_skills` including the current step
   - Match at least one active domain
   - Have a valid AGENT_CONTRACT

4) Categorize discovered agents:
   - PRIMARY
   - OPTIONAL
   - EXCLUDED (with explicit reason)

5) Generate the **Discovery Matrix**

Agents provide validation signals only.
The orchestrator remains the final decision maker.

---

## Discovery Matrix (MANDATORY OUTPUT)

Every agent in `.agent/agents/` MUST appear in the matrix.

### Discovery Matrix Rules

- No agent may be silently ignored
- Missing or invalid contracts result in exclusion
- Discovery is deterministic

### Discovery Matrix Table Structure

| Agent | Domains | Applies to Skills | Authority | Match Reason | Status |
|------|--------|------------------|-----------|--------------|--------|

Failure to produce a complete Discovery Matrix BLOCKS execution.

---

## Agent Authority Resolution & Veto Rules (MANDATORY)

After Discovery Matrix generation and BEFORE executing any workflow step,
the orchestrator MUST resolve authority and veto order.

### Authority Levels

- advisory
- reviewer
- blocker

### Veto Rules

- Only reviewer/blocker agents may veto
- Lower `veto_priority` = higher priority
- First veto BLOCKS execution

---

## Required Questions (ask BEFORE starting)

1) Target spec slug?
2) Scope constraints?
3) Modules involved?
4) Starting step?
5) Proceed?

---

## Hard Governance Rules

- No discovery = BLOCKED
- No matrix = BLOCKED
- No veto resolution = BLOCKED

---

## Final Status

- BLOCKED
- PARTIALLY COMPLETE
- COMPLETE
