---
name: koyote-impl
description: Implement an approved spec using dynamic agent discovery and strict governance. Use only after a spec is READY.
---

# koyote-impl

Use this skill to implement runtime code **based strictly on an approved spec**.
This skill MAY modify runtime code but MUST NOT modify spec files unless explicitly requested.

---

## Governing References (MUST READ)

- .agent/ARCHITECTURE.md
- .agent/rules/GLOBAL.md
- .agent/rules/DATA_ACCESS.md
- .agent/rules/AGENT_DISCOVERY.md
- .agent/rules/MEMORY_BANK.md
- .agent/rules/SPEC_STANDARD.md
- .agent/workflows/impl.md

---

## Preconditions (BLOCKING)

This skill MUST NOT proceed unless:

- Target spec exists at `.specs/<slug>/`
- Last audit verdict is:
  - READY
  - or READY WITH CONDITIONS (and conditions are explicitly accepted)

If conditions are not met, STOP and instruct to run spec audit.

---

## Agent Discovery Protocol (CRITICAL)

Before implementing, the skill MUST:

1. Analyze the spec to determine impacted domains:
   - pos (Electron, IPC, SQLite)
   - cloud-api (Prisma, REST, sync)
   - online-store (Next.js, i18n, UX)
   - data layer (schema, migrations)
   - cross-cutting (i18n, accessibility, auth, sync)
   - If database changes are in scope, the skill MUST discover and consult all agents whose domains match database-related concerns.

2. Discover relevant agents by conceptually scanning `.agent/agents/`:
   - Match domain expertise
   - Identify hard constraints and invariants
   - Identify risk areas

3. Use discovered agents to:
   - Validate scope boundaries
   - Detect forbidden changes
   - Enforce architectural rules

Agents provide **constraints and guidance only**.
Implementation decisions remain deterministic and spec-driven.

---

## Required Questions (ask before changes)

1) Target spec slug?
2) Which modules are in scope?
   - pos
   - cloud-api
   - online-store
3) Any explicit exclusions or protected areas?
4) Do you accept the current audit verdict?
5) Proceed with implementation after plan? (yes/no)

Do NOT modify files until confirmation is given.

---

## Implementation Rules (ABSOLUTE)

- Follow spec requirements verbatim
- Do NOT add features
- Do NOT change unrelated code
- Do NOT refactor outside scope
- Do NOT introduce speculative behavior
- ASCII only where applicable
- Respect i18n and data authority rules

If the spec is unclear, STOP and request clarification.

---

## Implementation Steps

1) Read all files in `.specs/<slug>/`
2) Re-state scope and boundaries
3) Produce a short implementation plan (if non-trivial)
4) Implement minimal changes
5) Verify runtime does not break existing flows
6) List all files changed

---

## Forbidden Actions

- Editing spec files
- Updating memory bank automatically
- Changing architecture patterns
- Introducing new dependencies without spec mention

---

## Output Format (MANDATORY)

### Implementation summary
- Short description of what was implemented

### Files changed
- List of file paths

### Tests / checks
- Tests run (or “not run” with reason)

### Notes
- Any important tradeoffs or follow-ups (optional)

### Next command
Exactly one:
- npm run gov:impl:audit -- "<slug>"

---

## When NOT to Use This Skill

- To design features
- To fix specs
- To refactor unrelated code
- To bypass audits

This skill exists to **turn approved specs into controlled, auditable code**.
