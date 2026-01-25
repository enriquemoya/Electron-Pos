# Agent Responsibilities & Conflict Resolution

This document defines how agents participate in governance,
their authority levels, and how conflicts are resolved.

This file is REQUIRED by the orchestrator.
Absence or violation BLOCKS execution.

---

## Authority Levels

Each agent MUST declare one authority level in its frontmatter:

- advisory
- reviewer
- blocker

### advisory
- Provides suggestions and risk notes
- Cannot block execution
- Cannot escalate on its own
- Ignored safely if out of scope

### reviewer
- Reviews correctness, structure, or quality
- Can request clarification
- Can recommend blocking
- Cannot block unless escalated by rules

### blocker
- Has veto power
- Any BLOCKER finding = execution MUST STOP
- Used for safety, integrity, and authority boundaries

---

## Default Authority Mapping

The following mappings apply unless explicitly overridden
in an agent contract.

### Always BLOCKER
- audit-agent (during audits)
- backend-security-guardian (security issues)
- data-integrity-governor (data corruption risk)
- prisma-migration-auditor (unsafe migrations)

### Usually REVIEWER
- node-backend-architect
- prisma-schema-guardian
- cloud-api-contract-guardian
- backend-performance-reviewer

### Always ADVISORY
- shadcn-ui-expert
- react-component-architect
- ui-ux-architect
- i18n-accessibility-guardian

---

## Conflict Resolution Rules (MANDATORY)

### Rule 1 — Blocker Supremacy
If ANY blocker agent raises a blocking issue:
- Status = BLOCKED
- No override is allowed
- Human intervention required

---

### Rule 2 — Reviewer Escalation

A reviewer MAY escalate to BLOCKER IF:
- The issue violates GLOBAL.md
- The issue violates DATA_ACCESS.md
- The issue introduces irreversible risk
- The issue contradicts the approved spec

Escalation MUST be explicit and justified.

---

### Rule 3 — Advisory Non-Blocking

Advisory agents:
- Cannot block
- Cannot escalate
- Their input is logged only

---

### Rule 4 — Multiple Reviewer Disagreement

If reviewers disagree:
- Orchestrator MUST summarize differences
- Ask the human user to choose:
  - proceed
  - block
  - request clarification

Execution pauses until resolved.

---

### Rule 5 — Silent Agent Rule

If an agent is discovered but produces no findings:
- This is treated as an implicit PASS
- Must still be listed in the Discovery Matrix

---

## Escalation Matrix

| Scenario | Result |
|--------|--------|
| 1 blocker flags issue | BLOCK |
| 2+ reviewers flag same risk | ESCALATE to blocker |
| reviewer + advisory flag same risk | REVIEW required |
| advisory only | LOG only |
| no agents flag issues | PROCEED |

---

## Orchestrator Obligations

The orchestrator MUST:
- Apply these rules deterministically
- Never invent authority
- Never downgrade a blocker
- Always explain decisions

Violation of these rules INVALIDATES the run.

---

## When This File Is Used

- During Discovery Matrix evaluation
- During gate decisions
- During conflict resolution
- During final verdict computation

This file exists to prevent:
- Silent overrides
- Authority ambiguity
- Agent shopping
