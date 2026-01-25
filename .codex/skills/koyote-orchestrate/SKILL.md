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

## Governing References (MUST READ)

- .agent/ARCHITECTURE.md
- .agent/AGENT_CONTRACT.md
- .agent/rules/GLOBAL.md
- .agent/rules/SPEC_STANDARD.md
- .agent/rules/DATA_ACCESS.md
- .agent/rules/MEMORY_BANK.md

---

## Dynamic Agent Discovery Protocol (MANDATORY)

Before executing any step, this skill MUST perform agent discovery.

### Discovery Steps

1) Identify the task intent based on user input:
   - spec creation
   - spec audit
   - implementation
   - implementation audit

2) Identify affected domains:
   - online-store (frontend, UX, i18n)
   - cloud-api (backend, API, performance)
   - data (Prisma, migrations, schema)
   - POS / IPC (only if explicitly in scope)

3) Discover agents by conceptually scanning `.agent/agents/` metadata (frontmatter)
   and selecting agents that:
   - Declare `applies_to_skills` including the current step
   - Match the domain(s) involved
   - Have compatible authority level

4) Categorize discovered agents:
   - Primary agents (required)
   - Optional reviewers (advisory or risk-based)
   - Excluded agents (with explicit reason)

5) Generate the **Discovery Matrix** (see below)

6) List discovered agents BEFORE executing the step

Agents provide:
- Validation signals
- Risk detection
- Domain constraints

This skill remains the final decision maker.

---

## Discovery Matrix (MANDATORY OUTPUT)

Before executing any workflow step, the orchestrator MUST generate a **Discovery Matrix**.

The Discovery Matrix explains **why each agent was selected or excluded**.

### Discovery Matrix Table Structure

The matrix MUST be rendered as a table with the following columns:

| Agent | Domains | Applies to Skills | Authority | Match Reason | Status |
|------|--------|------------------|-----------|--------------|--------|

### Column Definitions

- **Agent**  
  Agent filename (without `.md`)

- **Domains**  
  Domains declared by the agent (e.g. `cloud-api`, `data`, `ui`, `security`)

- **Applies to Skills**  
  Values from `applies_to_skills` frontmatter

- **Authority**  
  One of:
  - advisory
  - reviewer
  - blocker

- **Match Reason**  
  Short explanation:
  - matched by domain
  - matched by skill
  - matched by risk category
  - excluded: no domain overlap
  - excluded: skill mismatch
  - excluded: authority conflict

- **Status**  
  One of:
  - PRIMARY
  - OPTIONAL
  - EXCLUDED

---

## Discovery Rules (STRICT)

1. **Every agent in `.agent/agents/` MUST appear in the matrix**
2. No agent may be silently ignored
3. Excluded agents MUST include a reason
4. PRIMARY agents:
   - Must match the current step
   - Must match at least one active domain
5. OPTIONAL agents:
   - Match domain but are not strictly required
   - Or are risk-based reviewers
6. EXCLUDED agents:
   - Do not match skill, domain, or authority
   - Or are explicitly forbidden by scope

Failure to produce the Discovery Matrix BLOCKS execution.

---

## Required Questions (ask BEFORE starting)

1) Target spec slug (folder name)?
2) Scope constraints or exclusions?
3) Which modules are involved?
   - online-store
   - cloud-api
   - POS
   - multiple
4) Run full flow or start at a specific step?
   - spec-create
   - spec-audit
   - impl
   - impl-audit
5) Proceed with orchestration now? (yes/no)

Do NOT proceed without explicit confirmation.

---

## Orchestration Flow With Gates

### Step 0: Agent Discovery Report
- Print Discovery Matrix
- Show Primary vs Optional vs Excluded agents
- Ask for confirmation:
  > Proceed with these agents? (yes/no)

---

### Step 1: Spec Creation
Invokes:
- koyote-spec-create

Primary agents:
- spec-agent
- domain-specific advisory agents

Gate:
- Proceed to spec audit? (yes/no)

---

### Step 2: Spec Audit
Invokes:
- koyote-spec-audit

Primary agents:
- audit-agent

Optional agents:
- architecture, data, UX, or backend reviewers as discovered

Gate:
- Verdict must be READY or READY WITH CONDITIONS
- Proceed to implementation? (yes/no)

---

### Step 3: Implementation
Invokes:
- koyote-impl

Primary agents:
- orchestrator
- domain architects (frontend, backend, data)

Constraints:
- Spec must be approved
- Scope must not expand

Gate:
- Proceed to implementation audit? (yes/no)

---

### Step 4: Implementation Audit
Invokes:
- koyote-impl-audit

Primary agents:
- audit-agent

Optional agents:
- security
- performance
- data integrity
- API contract reviewers

Gate:
- Verdict must be SAFE or SAFE WITH CONDITIONS
- Proceed to memory update suggestion? (yes/no)

---

### Step 5: Memory Update Suggestion
Invokes:
- koyote-memory-update (suggestion only)

Rules:
- Never auto-write memory
- Human confirmation required

---

## Forbidden Actions

- Skipping agent discovery
- Skipping Discovery Matrix
- Running implementation without approved spec
- Modifying files directly
- Auto-updating memory
- Bypassing audit verdicts

---

## Output Format (MANDATORY)

### Discovery Matrix
- Full table (all agents)

### Execution Log
- Steps executed
- Gates passed or blocked

### Files Affected
- List of files touched by sub-skills

### Final Status
One of:
- BLOCKED
- PARTIALLY COMPLETE
- COMPLETE

### Next Command
Exact npm command or instruction.

---

## When NOT to Use This Skill

- For single-file edits
- For quick experiments
- To bypass audits
- To auto-generate code without spec

This skill exists to **enforce governance, not speed**.
