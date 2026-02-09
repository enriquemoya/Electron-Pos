# AGENT_RESPONSIBILITIES

This document defines **authority, veto power, and conflict resolution**
for all discoverable agents.

The orchestrator MUST follow these rules.
No skill or agent may override them.

---

## Authority Levels

Each agent declares exactly ONE authority level:

- advisory  
  - Can provide guidance, warnings, suggestions
  - Can NOT block execution

- reviewer  
  - Can flag issues
  - Can require conditions
  - Can escalate to blocker agents

- blocker  
  - Can BLOCK the workflow step
  - Can force verdicts: NOT READY / NOT SAFE

Authority is declared in agent frontmatter
and enforced by the orchestrator.

---

## Veto Priority Order (GLOBAL)

If multiple blocker agents exist,
they are evaluated in the following priority order:

| Priority | Agent |
|--------|------|
| 10 | backend-security-guardian |
| 20 | data-integrity-governor |
| 30 | prisma-migration-auditor |
| 40 | cloud-api-contract-guardian |
| 50 | audit-agent |

Lower number = higher priority.

If a higher-priority agent blocks,
lower agents are NOT evaluated.

---

## Blocking Rules

A blocker agent MAY block if:

- Violates declared scope or authority boundaries
- Introduces security risk
- Breaks data integrity or migrations
- Breaks API contract compatibility
- Violates SPEC or GLOBAL rules

A blocker agent MUST provide:

- Reason
- File or scope reference
- Severity

Silent blocking is FORBIDDEN.

---

## Reviewer Escalation Rules

Reviewer agents MAY:

- Request changes
- Mark SAFE WITH CONDITIONS
- Escalate to a blocker if:
  - Risk is systemic
  - Data loss is possible
  - Security boundary is crossed

---

## Advisory Agent Rules

Advisory agents:

- Never block
- Never escalate directly
- Only inform the orchestrator

---

## Orchestrator Conflict Resolution

The orchestrator MUST:

1. Apply Discovery Matrix
2. Identify blocker agents
3. Evaluate blockers by priority
4. Stop on first BLOCK
5. Produce final verdict

The orchestrator CANNOT:
- Ignore blockers
- Reorder priorities
- Downgrade a block

---

## Memory Bank Rule

No agent may write to memory.

Memory updates are:
- Suggested only
- Require human confirmation
- Executed via `koyote-memory-update`

---

## Determinism Guarantee

Given the same:
- Inputs
- Agents
- Contracts

The same verdict MUST be produced.

Non-deterministic behavior is a violation.

---

## Final Rule

If authority, priority, or escalation is unclear:

**BLOCK THE FLOW**

Governance correctness > speed.
