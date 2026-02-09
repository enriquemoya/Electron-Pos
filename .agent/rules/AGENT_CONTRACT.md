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

  ### authority_level
One of:
- advisory        # cannot block
- reviewer        # can block within its domain
- blocker         # global veto authority

### veto_priority
Integer (lower = higher priority)
Example:
security: 10
data-integrity: 20
schema: 30
performance: 40
