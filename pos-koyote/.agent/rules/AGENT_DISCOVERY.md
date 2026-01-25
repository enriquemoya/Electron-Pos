# Agent Discovery Rules

This file defines how agents are discovered based on task scope.

## Scope → Domain Mapping

### Database changes
Includes:
- Prisma schema changes
- Migrations
- Postgres / Neon concerns
- Data integrity
- ORM access patterns

Required agent domains:
- prisma
- migrations
- postgres
- neon
- data-integrity
- data-access

### UI / UX changes
Required domains:
- ui
- ux
- accessibility
- i18n
- components

### Frontend implementation
Required domains:
- react
- nextjs
- vercel
- components

### Backend / Cloud API / POS
Required domains:
- api
- data-access
- prisma
- postgres
- backend

## Discovery rule

When a skill detects scope keywords, it MUST:

1. Map scope → domains
2. Select all agents whose frontmatter `domains` intersect
3. Always include audit-agent
4. List all discovered agents explicitly

## Activation Signals (MANDATORY)

Each agent MUST declare when it should be considered by the orchestrator.

Format:

activation:
  keywords:
    - list
    - of
    - terms
  triggers:
    - semantic conditions
  excludes:
    - optional exclusions
