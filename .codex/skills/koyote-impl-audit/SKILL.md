---
name: koyote-impl-audit
description: Audit implementation against an approved spec using dynamic agent discovery. Read-only. No file changes.
---

# koyote-impl-audit

Use this skill to **audit runtime implementation against an approved spec**.
This skill is STRICTLY READ-ONLY. It MUST NOT modify any files.

---

## Governing References (MUST READ)

- .agent/ARCHITECTURE.md
- .agent/rules/GLOBAL.md
- .agent/rules/DATA_ACCESS.md
- .agent/rules/AGENT_DISCOVERY.md
- .agent/rules/MEMORY_BANK.md
- .agent/rules/SPEC_STANDARD.md
- .agent/workflows/impl-audit.md

---

## Preconditions (BLOCKING)

This audit MUST NOT proceed unless:

- Spec exists at `.specs/<slug>/`
- Implementation has already been executed
- Target modules are explicitly defined

If implementation is incomplete or unknown, STOP and request clarification.

---

## Agent Discovery Protocol (CRITICAL)

Before auditing, the skill MUST:

1. Analyze the spec to identify affected domains:
   - pos (Electron, IPC, SQLite)
   - cloud-api (Prisma, REST, sync)
   - online-store (Next.js, i18n, UX)
   - data layer (schema, migrations)
   - cross-cutting (i18n, accessibility, error handling)

2. Discover relevant agents by conceptually scanning `.agent/agents/`:
   - Use domain-specific agents to validate invariants
   - Use architecture rules to detect boundary violations
   - Use spec-agent rules to ensure no scope drift
   - If database changes are in scope, the skill MUST discover and consult all agents whose domains match database-related concerns.
   - If data access or backend changes are in scope, the skill MUST discover and consult all agents whose domains match backend-related concerns.


Agents provide **audit lenses**, not implementation suggestions.

---

## Required Questions (ask before audit)

1) Target spec slug?
2) Which modules should be audited?
   - pos
   - cloud-api
   - online-store
3) Any known deviations or accepted conditions?
4) Proceed with audit now? (yes/no)

Do NOT audit until confirmation is given.

---

## Audit Rules (ABSOLUTE)

- Audit ONLY what the spec defines
- Do NOT request enhancements
- Do NOT suggest refactors outside spec
- Do NOT introduce new requirements
- Report facts, not opinions
- Treat SPEC as the single source of truth

If behavior exists but is not in the spec, flag it as drift.

---

## Audit Steps

1) Read all files in `.specs/<slug>/`
2) Identify explicit requirements, constraints, and non-goals
3) Review implementation in scoped modules
4) Match behavior line-by-line against spec intent
5) Detect:
   - Missing behavior
   - Extra behavior
   - Boundary violations
   - Architecture rule violations

---

## Forbidden Actions

- Editing any file
- Updating memory bank
- Proposing new features
- Proposing refactors unless required to meet the spec

---

## Output Format (MANDATORY)

### What is correct and aligned
- Explicit matches between spec and implementation

### Issues or deviations
- Spec-defined behavior that is missing or incorrect

### Bugs or violations
- Architecture, data authority, or safety violations

### Required fixes
- ONLY fixes required to meet the spec (no enhancements)

### Verdict
One of:
- SAFE
- SAFE WITH CONDITIONS
- NOT SAFE

### Next step
Exactly one:
- Proceed to memory update
- Fix implementation
- Fix spec
- Stop (explain why)

---

## When NOT to Use This Skill

- To suggest UX improvements
- To refactor code
- To redesign features
- To bypass governance gates

This skill exists to **guarantee that code matches the spec, nothing more and nothing less**.
