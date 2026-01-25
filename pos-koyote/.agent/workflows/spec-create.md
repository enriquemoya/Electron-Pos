$ARGUMENTS
- name: spec slug
- scope: brief summary

Agent
- Use spec-agent

Steps
1) Create .specs/<slug>/requirements.md, design.md, tasks.md.
2) Enforce ASCII only if required.
3) Confirm no code changes.

Output format
- List created files and a short validation checklist.

Example
- /spec:create name=inventory-alerts scope="alerts for low stock"
