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
- seo-review
- prompt-lookup
- typescript-review

Skill Function Summary
- seo-review
  - Focused SEO audit workflow for concept/content pages.
  - Useful for structured checks on keyword intent, snippet readiness, internal linking, and reporting.
- prompt-lookup
  - Prompt discovery and prompt-improvement helper via prompt-library tooling.
  - Useful for authoring and refining governance prompts; not a code-quality authority skill.
- typescript-review
  - TS/JS review checklist for type-safety, style, and code quality on diffs/PRs.
  - Useful for backend/frontend reviewer rigor and audit consistency.

Blocker Agents
- backend-security-guardian
  - clean-code
  - backend-patterns
  - fullstack-developer
  - typescript-review
- data-integrity-governor
  - prisma-expert
  - backend-patterns
  - typescript-review
- prisma-migration-auditor
  - prisma-expert
  - typescript-review
- audit-agent
  - clean-code
  - backend-patterns
  - typescript-review
  - seo-review

Reviewer Agents
- cloud-api-contract-guardian
  - backend-patterns
  - fullstack-developer
  - typescript-review
- prisma-schema-guardian
  - prisma-expert
  - typescript-review
- node-backend-architect
  - backend-patterns
  - fullstack-developer
  - clean-code
  - typescript-review
- backend-error-modeling-expert
  - backend-patterns
  - clean-code
  - typescript-review
- backend-performance-reviewer
  - backend-patterns
  - prisma-expert
  - typescript-review
- react-component-architect
  - frontend-design
  - ui-ux-pro-max
  - clean-code
  - typescript-review
- shadcn-ui-expert
  - frontend-design
  - ui-ux-pro-max
- ui-ux-architect
  - frontend-design
  - ui-ux-pro-max
  - seo-review
- i18n-accessibility-guardian
  - frontend-design
  - ui-ux-pro-max
  - seo-review

Advisory Agents
- nextjs-vercel-best-practices
  - frontend-design
  - fullstack-developer
  - seo-review
- orchestrator
  - backend-patterns
  - frontend-design
  - prisma-expert
  - typescript-review
  - prompt-lookup
- spec-agent
  - clean-code
  - prompt-lookup
- memory-bank-curator
  - clean-code

Usage Rule
- Skill assignment guides analysis depth and review style.
- Blocker veto order remains defined in AGENT_RESPONSIBILITIES.
- Skills cannot override authority rules.
- prompt-lookup is auxiliary and must not override domain blockers in implementation or audit verdicts.
