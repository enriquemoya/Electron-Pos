Prisma koyote skill

PowerShell commands
- Generate client: npm run -w apps/cloud-api prisma:generate
- Migrate dev: npm run -w apps/cloud-api prisma:migrate:dev
- Migrate deploy: npm run -w apps/cloud-api prisma:migrate:deploy

Drift check
- prisma migrate status

Rule
- Prisma is canonical for cloud-api schema and migrations.
