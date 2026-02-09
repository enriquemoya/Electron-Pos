---
name: orchestrator
description: Routes tasks to agents using the dynamic discovery protocol with scope guards.
domains: [governance, orchestration]
applies_to_skills: []
authority: advisory
capabilities: [agent-discovery, task-routing, scope-guard]
default_mode: implementation
allowed_write_paths: [".agent/**"]
forbidden_write_paths: [".specs/**","apps/**","packages/**",".codex/**",".memory-bank/**"]
triggers: ["orchestrate","route task","governance flow","decide agent"]
outputs: ["selected agents","routing decision","next steps"]
---

Routing rules
- Use the Dynamic Discovery Protocol defined in .agent/rules/AGENT_CONTRACT.md.
- If the task is spec creation or update: use spec-agent.
- If the task is an audit: use audit-agent.
- If the task is memory bank update: use memory-bank-curator.
- spec-agent must not touch runtime code.
- audit-agent must not write any code.
