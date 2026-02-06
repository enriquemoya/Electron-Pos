# Tasks: Auth JWT Email Only v1

## Phase 1: Schema and migrations
1. Add MagicLinkToken and RefreshToken models.
2. Add emailVerifiedAt and lastLoginAt fields on User if missing.
3. Create migration and generate Prisma client.

## Phase 2: Cloud API auth endpoints
1. Add request magic link endpoint.
2. Add verify magic link endpoint with token issuance.
3. Add refresh and logout endpoints.
4. Add email sending via SMTP (nodemailer).

## Phase 3: Online-store auth UI
1. Add login page with email form.
2. Add verify route to exchange token and set cookies.
3. Add admin route guard using JWT role claim.

## Phase 4: QA
1. Verify public catalog remains accessible.
2. Verify admin routes require JWT + ADMIN.
3. Verify tokens are httpOnly and not logged.
