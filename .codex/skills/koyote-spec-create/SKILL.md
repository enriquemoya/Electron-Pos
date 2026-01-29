---
name: koyote-spec-create
description: Create or update a specification using spec-driven governance. Discovers relevant domain agents dynamically and produces implementation-ready spec files only.
---

# koyote-spec-create

Use this skill to **create or update specs only**.
This skill NEVER writes runtime code.

Specs produced by this skill are the **only allowed input** for implementation skills.

## Repo root resolution

Always operate in the repo root that contains .agent and .specs.
If the current working directory is not the repo root, change to it
before creating or updating any spec files.
If multiple candidates exist, prefer the one that also contains apps/
and package.json (expected: pos-koyote).
Never create a new .specs folder. Always use the existing .specs
folder inside the resolved repo root. If a second .specs is found
outside the repo root, ignore it and stop to confirm before writing.

---

## Governing References (MUST READ)

- .agent/ARCHITECTURE.md
- .agent/rules/GLOBAL.md
- .agent/rules/SPEC_STANDARD.md
- .agent/rules/DATA_ACCESS.md
- .agent/rules/MEMORY_BANK.md
- .agent/workflows/spec-create.md
- .agent/rules/AGENT_DISCOVERY.md

---

## Agent Discovery Protocol (CRITICAL)

Before drafting or modifying a spec, the skill MUST:

1. Identify the spec domain(s):
   - frontend (online-store)
   - backend (cloud-api)
   - data (Prisma, schema, migrations)
   - UX / i18n / accessibility
   - POS / IPC (only if explicitly allowed)

2. Discover relevant agents by scanning `.agent/agents/` conceptually and matching:
   - Domain
   - Capabilities

3. Consult discovered agents for:
   - Constraints
   - Risks
   - Required sections
   - Non-goals

Agents provide **advice only**.  
This skill decides what is written into the spec.

Absence of agents must NOT block spec creation.

---

## Required Questions (ask before any edits)

1) Target spec slug (folder name)?
2) What problem or feature is being specified?
3) Scope boundaries or explicitly excluded areas?
4) Apps involved? (online-store, cloud-api, POS, multiple?)
5) Any routing, i18n, or UX constraints?
6) Proceed with spec creation after plan? (yes/no)

Do NOT create or modify files until all answers are given.

---

## Spec Creation Rules

- ASCII only
- English only
- No implementation details beyond contracts and behavior
- No assumptions about future features unless explicitly marked
- All non-goals must be explicit
- Specs must stand alone without chat context

---

## Files to Produce or Update

Create or update exactly these files:

.specs/<slug>/requirements.md  
.specs/<slug>/design.md  
.specs/<slug>/tasks.md  

Each file must follow SPEC_STANDARD.md structure.

---

## Required Content per File

### requirements.md
- Problem statement
- Goals
- Non-goals
- Constraints
- Assumptions
- Out of scope

### design.md
- High-level architecture
- Data flow
- State ownership
- Error and edge cases
- i18n and accessibility notes (if applicable)

### tasks.md
- Small, implementable tasks
- Ordered and scoped
- Each task maps back to requirements
- No task larger than one implementation session

---

## Forbidden Actions

- Writing or modifying runtime code
- Creating migrations
- Adding dependencies
- Updating memory bank directly
- Making architectural decisions outside scope

---

## Output Format (MANDATORY)

- Summary of intent
- Agents consulted (by domain, not filenames)
- Files created or modified (full paths)
- Open questions or risks
- Next command:
  npm run gov:spec:audit -- "<slug>"

---

## When NOT to Use This Skill

- To fix bugs
- To write code
- To refactor existing implementations without changing behavior
- To brainstorm without intent to implement

Use this skill when the spec **must be correct before code exists**.
