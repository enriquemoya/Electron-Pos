$ARGUMENTS
- message: summary of change

Agent
- Use orchestrator to request memory-bank-curator for updates and audit-agent for validation.

Steps
1) Update activeContext.md with current focus.
2) Update progress.md with completed items.
3) Update techContext.md if stack or deps changed.
4) Enforce ASCII only docs check if required.

Output format
- List updated Memory Bank files and the summary message.

Example
- /memory:update message="Updated cloud schema migrations to Prisma"
