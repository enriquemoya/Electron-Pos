AI Governance Architecture

Purpose
- Provide an agent, skills, workflows layer that complements Memory Bank and SPEC driven development.
- Enforce ASCII only and English only governance text.

Directory structure
- .agent/agents: Role cards that define scope and allowed outputs.
- .agent/skills: Reusable skill guides for stack specific work.
- .agent/workflows: Slash command style runbooks for repeatable tasks.
- .agent/rules: Global and domain specific guardrails.

Core governance principles
- No feature work without an approved SPEC.
- Memory Bank is authoritative for project state.
- POS persistence is IPC only; renderer never touches SQLite.
- Cloud API schema and migrations are Prisma first.
- Online store is read only; no shared secrets in client components.
- All governance docs in this folder are ASCII only and English only.
