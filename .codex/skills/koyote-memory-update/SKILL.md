---
name: koyote-memory-update
description: Guide memory bank update command usage. Use when user asks to update memory bank or wants the command.
---

# koyote-memory-update

Use this skill to guide memory bank updates. Do not edit memory bank files unless requested.

## Repo root resolution

Always operate in the repo root that contains .agent and .memory-bank.
If the current working directory is not the repo root, change to it
before running or printing memory update commands.
If multiple candidates exist, prefer the one that also contains apps/
and package.json (expected: pos-koyote).
Never create a new .specs folder. Always use the existing .specs
folder inside the resolved repo root. If a second .specs is found
outside the repo root, ignore it and stop to confirm before writing.

## References
- .agent/rules/MEMORY_BANK.md
- .agent/workflows/memory-update.md
- .agent/agents/spec-agent.md
- .agent/agents/audit-agent.md

## Required questions (ask before action)
1) Update message text?
2) Should the command be run now or only provided? (run/provide)

## Steps
1) If asked to run, use npm run memory:update "<message>".
2) If asked to provide, print the command only.

## Output format
- Command to run
- Notes (if any)
