$ARGUMENTS
- spec: spec slug
- scope: area to audit

Agent
- Use audit-agent

Steps
1) Compare code to SPEC.
2) Identify mismatches and risks.
3) Enforce ASCII only docs check if required.

Output format
1) What is correct
2) Ambiguities
3) Missing
4) Risks
5) Verdict

Example
- /impl:audit spec=inventory-alerts scope="ui + ipc"
