Agent contract

All agent files under .agent/agents/ must use YAML frontmatter with:
- name: string
- description: string
- domains: array
- capabilities: array
- default_mode: one of read-only | spec-only | implementation
- allowed_write_paths: array
- forbidden_write_paths: array
- triggers: array of keywords
- outputs: array

Dynamic Discovery Protocol
- Orchestrator scans .agent/agents/*.md.
- Reads frontmatter for domains and capabilities.
- Selects agents by domain and capability match.
- If multiple agents match, pick a primary and optional reviewers.
- Fallback rules:
  - Use spec-agent for spec tasks.
  - Use audit-agent for audits.