Expert Skill Assignments

Purpose
- Map expert agents to imported Codex skills.
- Keep blocker-first governance unchanged.
- Provide deterministic skill usage guidance for spec and implementation workflows.

Imported Skills
- backend-patterns
- clean-code
- frontend-design
- fullstack-developer
- prisma-expert
- ui-ux-pro-max

Blocker Agents
- backend-security-guardian
  - clean-code
  - backend-patterns
  - fullstack-developer
- data-integrity-governor
  - prisma-expert
  - backend-patterns
- prisma-migration-auditor
  - prisma-expert
- audit-agent
  - clean-code
  - backend-patterns

Reviewer Agents
- cloud-api-contract-guardian
  - backend-patterns
  - fullstack-developer
- prisma-schema-guardian
  - prisma-expert
- node-backend-architect
  - backend-patterns
  - fullstack-developer
  - clean-code
- backend-error-modeling-expert
  - backend-patterns
  - clean-code
- backend-performance-reviewer
  - backend-patterns
  - prisma-expert
- react-component-architect
  - frontend-design
  - ui-ux-pro-max
  - clean-code
- shadcn-ui-expert
  - frontend-design
  - ui-ux-pro-max
- ui-ux-architect
  - frontend-design
  - ui-ux-pro-max
- i18n-accessibility-guardian
  - frontend-design
  - ui-ux-pro-max

Advisory Agents
- nextjs-vercel-best-practices
  - frontend-design
  - fullstack-developer
- orchestrator
  - backend-patterns
  - frontend-design
  - prisma-expert
- spec-agent
  - clean-code
- memory-bank-curator
  - clean-code

Usage Rule
- Skill assignment guides analysis depth and review style.
- Blocker veto order remains defined in AGENT_RESPONSIBILITIES.
- Skills cannot override authority rules.
