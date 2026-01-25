---
name: koyote-orchestrate
description: Orchestrate an end-to-end spec-driven governance flow with dynamic agent discovery, decision gates, and memory bank integration. Use when the user wants to run the full lifecycle.
---

# koyote-orchestrate

This skill orchestrates a complete governance flow: spec creation, audit, implementation, implementation audit, and memory update.

The orchestrator does **not** hardcode agent names.
Instead, it dynamically discovers and consults agents based on declared domains and capabilities.

The orchestrator always retains final decision authority.

---

## Governing References (MUST READ)

- .agent/ARCHITECTURE.md
- .agent/rules/GLOBAL.md
- .agent/rules/SPEC_STANDARD.md
- .agent/rules/DATA_ACCESS.md
- .agent/rules/MEMORY_BANK.md
- .agent/rules/AGENT_CONTRACT.md
- .agent/rules/AGENT_DISCOVERY.md

---

## Agent Discovery Protocol (CRITICAL)

Before executing **any step**, the orchestrator MUST:

1. Identify the current phase:
   - spec
   - audit
   - implementation
   - validation
   - memory

2. Identify required expertise domains from:
   - the spec scope
   - the target app (online-store, cloud-api, POS)
   - the technology involved (Prisma, Next.js, React, i18n, DB, etc.)

3. Discover relevant agents by scanning `.agent/agents/` conceptually and matching:
   - Domain
   - Capabilities

4. Consult zero or more matching agents for guidance.
   - Agents provide **analysis and recommendations only**
   - Agents never make final decisions

5. Summarize agent input and proceed according to governance rules.

Absence of a matching agent is allowed and must not block the flow.

---

## Required Questions (ask before start)

1) What is the target spec slug or feature name?
2) What is the scope and constraints?
   - apps involved?
   - data access changes?
   - UX only or backend too?
3) Proceed with full governance flow? (yes/no)

Do NOT start until all answers are provided.

---

## End-to-End Flow with Decision Gates

### Step 1 — Spec Creation
- Phase: `spec`
- Discover and consult spec-related agents (e.g. spec-agent, domain experts).
- Generate a spec compliant with SPEC_STANDARD.md.
- Output spec files only (no code).

---

### Step 2 — Spec Audit
- Phase: `audit`
- Discover and consult audit-related agents.
- Validate spec completeness, constraints, and alignment with rules.
- Output a verdict.

**Gate 1**
Proceed to implementation? (yes/no)

---

### Step 3 — Implementation
- Phase: `implementation`
- Discover and consult implementation experts as needed:
  - UI / UX
  - Database / Prisma
  - API
  - i18n
- Implement **only what is approved in the spec**.
- No scope expansion allowed.

---

### Step 4 — Implementation Audit
- Phase: `validation`
- Discover and consult audit agents.
- Verify implementation against the approved spec.
- Output SAFE / SAFE WITH CONDITIONS / NOT SAFE verdict.

**Gate 2**
Proceed to memory update suggestion? (yes/no)

---

### Step 5 — Memory Update Suggestion
- Phase: `memory`
- Propose memory bank updates based on:
  - architectural decisions
  - patterns introduced
  - constraints clarified
- Do NOT modify memory directly.
- Output the recommended command or message.

---

## Output Format (MANDATORY)

- Current phase status checklist
- Agents consulted (by role/domain, not filenames)
- Files created or modified
- Open risks or notes
- Next recommended command

---

## Hard Constraints

- No POS/Electron coupling unless explicitly approved in spec
- Online-store remains read-only
- Prisma is the source of truth for cloud schema
- URL-based locale only (default: es)
- One decision gate at a time
- Orchestrator decides; agents advise

---

## When NOT to use this skill

- For single-step questions
- For direct code changes without a spec
- For exploratory discussion without intent to implement

Use this skill when governance and correctness matter.
