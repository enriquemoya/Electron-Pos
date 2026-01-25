$ARGUMENTS
- spec: spec slug
- scope: brief change summary

Agent
- Use orchestrator to assign implementation agent.

Steps
1) Confirm approved SPEC exists.
2) Implement minimal changes within scope.
3) Validate IPC boundaries and i18n rules.
4) Enforce ASCII only docs check if required.

Output format
- Summary of code changes and files touched.

Example
- /impl spec=inventory-alerts scope="db + ipc + ui"
