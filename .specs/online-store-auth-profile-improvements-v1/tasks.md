# Tasks: Online Store Auth Profile Improvements v1

## Phase 1: Schema
1. Add passwordHash and passwordUpdatedAt to User.
2. Create Prisma migration and generate client.

## Phase 2: Cloud API
1. Add auth middleware for JWT user access.
2. Add GET /profile/me and PATCH /profile/me.
3. Add PATCH /profile/password.
4. Add POST /auth/password/login.
5. Add validation for profile and password payloads.

## Phase 3: Online store UI
1. Add header account icon and mobile icon-only labels.
2. Add account menu with Profile, Orders (disabled), and Close session.
2. Add home-only profile completion modal (shadcn Dialog).
3. Add /account/profile page with profile and password sections.
4. Add logout server action and clear auth cookies on success.
5. Clear password inputs after successful password update.
6. Update /auth/login to include password login option and messaging.
7. Add i18n strings for new UI and messages.
8. Add Sign in only menu state for unauthenticated users.
9. Add logout reload guard on home page to force refresh after logout.

## Phase 4: QA
1. Verify magic link login still works.
2. Verify password login returns valid JWT cookies.
3. Verify profile modal appears only when incomplete.
4. Verify all auth/profile calls are server-side.
