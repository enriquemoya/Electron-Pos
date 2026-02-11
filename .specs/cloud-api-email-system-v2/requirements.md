# cloud-api-email-system-v2 Requirements

## Goals
- Enforce DB-level email locale using a Prisma enum with safe backfill.
- Provide localized React Email templates for ES_MX and EN_US with a shared layout.
- Centralize brand design tokens for email templates and align them with online-store Tailwind tokens.
- Add profile UI control to select email locale in online-store.
- Keep email sending non-blocking and structured logging for send lifecycle events.

## Scope
- cloud-api: email locale enum, template system, provider abstraction, structured logging, locale mapping.
- data: Prisma enum and migration for User.emailLocale.
- online-store: profile UI only (email locale select + toast feedback).

## Non-Goals
- No breaking API contract changes.
- No changes to auth or authorization flows.
- No new endpoints beyond existing profile update flows.
- No changes to email delivery provider choice beyond abstraction.

## Constraints
- Email sending must remain non-blocking.
- No hardcoded hex colors in templates; use design tokens only.
- No string literals of locales outside a mapping function.
- DB must store only the enum (no string locales).
- Migration must safely backfill existing users.
- Online-store i18n: URL-based locale only; all user-facing strings localized.

## i18n
- Email templates must support ES_MX and EN_US.
- Profile UI labels and toast messages must be localized.

## Error Handling
- Email send errors must not block the request lifecycle.
- Log structured events for send attempt, success, and failure.
- Do not log secrets, tokens, or full magic link URLs.
