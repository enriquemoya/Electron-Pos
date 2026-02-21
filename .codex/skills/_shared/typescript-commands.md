TypeScript/JavaScript Review Commands

Run these commands based on workspace tooling:
- `npm run typecheck`
- `npm run lint`
- `npm test -- --runInBand`

For targeted checks in changed files:
- `pnpm eslint <file>` or `npm run lint -- <file>`
- `pnpm tsc --noEmit` or `npm run typecheck`

If the repository uses different command names, use the project-equivalent commands.
