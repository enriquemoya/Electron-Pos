---
name: koyote-spec-audit
description: Audit an existing specification for completeness, consistency, and architectural alignment using dynamic agent discovery. Read-only.
---

# koyote-spec-audit

Use this skill to **audit specs only**.
This skill is STRICTLY READ-ONLY and MUST NOT modify files.

---

## Governing References (MUST READ)

- .agent/ARCHITECTURE.md
- .agent/rules/GLOBAL.md
- .agent/rules/SPEC_STANDARD.md
- .agent/rules/DATA_ACCESS.md
- .agent/rules/MEMORY_BANK.md
- .agent/workflows/spec-audit.md
- .agent/rules/AGENT_DISCOVERY.md

---

## Agent Discovery Protocol (CRITICAL)

Before performing the audit, the skill MUST:

1. Identify the spec domain(s):
   - frontend (online-store)
   - backend (cloud-api)
   - data (Prisma, schema, migrations)
   - UX / i18n / accessibility
   - POS / IPC (only if present in spec)

2. Discover relevant agents by conceptually scanning `.agent/agents/` and matching:
   - Domain expertise
   - Constraints and invariants
   - Known architectural risks

3. Use discovered agents to validate:
   - Missing sections
   - Violations of GLOBAL or SPEC rules
   - Scope leaks
   - Authority violations (POS vs Cloud vs UI)
   - Ambiguous or underspecified behavior

Agents provide **validation signals only**.
This skill is the final arbiter of the audit result.

---

## Required Questions (ask before audit)

1) Target spec slug (folder name)?
2) Any related specs, modules, or prior context to cross-check?
3) Desired strictness level?
   - normal
   - strict (default)
4) Proceed with audit now? (yes/no)

Do NOT begin audit until confirmation is given.

---

## Audit Rules

- ASCII only
- English only
- No speculative requirements
- No implementation guessing
- No fixing or rewriting
- Cite file + section for every issue

The audit must be reproducible by another agent.

---

## Audit Scope

The skill MUST audit the following files if present:

.specs/<slug>/requirements.md  
.specs/<slug>/design.md  
.specs/<slug>/tasks.md  

Absence of any file MUST be reported.

---

## Audit Checklist (MANDATORY)

### Structural
- All required files exist
- Required sections per SPEC_STANDARD.md exist
- ASCII-only and readable

### Scope & Intent
- Problem is clearly stated
- Goals vs non-goals are explicit
- No scope creep

### Architecture
- Authority boundaries respected
- Data ownership is clear
- IPC / API / DB rules followed

### Design Quality
- Flows are deterministic
- Error cases covered
- i18n and accessibility addressed if UI-facing

### Tasks
- Tasks are implementable
- Tasks map backG to requirements
- No task exceeds reasonable scope
- No missing migration / IPC / UI tasks

---

## Forbidden Actions

- Modifying spec files
- Proposing implementation code
- Updating memory bank
- Suggesting features outside spec scope

---

## Output Format (MANDATORY)

### What is correct
- Bullet list of aligned and strong areas

### Ambiguities or inconsistencies
- Bullet list
- Include file + section references

### Missing or incomplete elements
- Bullet list
- Explicitly state impact

### Architecture or governance risks
- Bullet list
- Severity: low / medium / high

### Verdict
One of:
- READY
- READY WITH CONDITIONS
- NOT READY

### Required next step
Exactly one of:
- Fix spec
- Re-audit after fixes
- Proceed to implementation

---

## When NOT to Use This Skill

- To fix the spec
- To suggest refactors
- To design features
- To approve implementation without audit

This skill exists to **block bad specs before code exists**.
