# cloud-api-email-system-v2 Tasks

## Phase 1 - Spec Audit Prep
- Verify online-store Tailwind tokens and record in design tokens.
- Identify current email template locations and usage paths.

## Phase 2 - Data and Prisma
- Add EmailLocale enum to schema.
- Add User.emailLocale with default ES_MX.
- Create migration with safe backfill for existing users.
- Update mapping function for enum -> locale string.

## Phase 3 - Email System Core
- Add design-tokens.ts.
- Add shared email components (layout, buttons, divider, section card).
- Implement EmailLayout with header/footer.
- Add APP_NAME and logo wiring.

## Phase 4 - Templates
- Implement MagicLinkEmail, WelcomeEmail, OrderCreatedEmail, OrderStatusChangedEmail.
- Add localized content maps for ES_MX and EN_US.
- Remove hardcoded colors and inline locale conditionals.

## Phase 5 - Provider and Logging
- Implement sendEmail abstraction with locale resolution.
- Ensure non-blocking send behavior.
- Add structured logging events and sanitize logs.

## Phase 6 - Online Store Profile UI
- Add emailLocale select to profile form.
- Add localized labels and toasts.
- Ensure URL-based locale usage only.

## Phase 7 - Audits
- Run spec-audit (blockers resolved).
- Implement changes.
- Run impl-audit and resolve findings until SAFE.
