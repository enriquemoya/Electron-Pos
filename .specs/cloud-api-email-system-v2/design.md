# cloud-api-email-system-v2 Design

## Data Model
- Add Prisma enum:
  - EmailLocale: ES_MX, EN_US.
- User.emailLocale:
  - Non-nullable, default ES_MX.
  - Backfill existing users to ES_MX.

## Locale Mapping
- Central mapping function (single source):
  - ES_MX -> "es-MX"
  - EN_US -> "en-US"
- No string literals outside this mapping.
  - Provide exported constants for "es-MX" and "en-US" used by templates.
  - Content maps must use mapping constants, not raw strings.

## Email Design Tokens
- File: cloud-api/src/email/design-tokens.ts
- Must align with online-store Tailwind tokens:
  - PRIMARY_COLOR = #f59e0b (accent.500)
  - BACKGROUND_COLOR = #0b0f14 (base.900)
  - TEXT_COLOR = #111827 (base.800)
  - MUTED_TEXT_COLOR = #1f2937 (base.700)
  - BORDER_COLOR = #1f2937 (base.700)
  - SUCCESS_COLOR = #86efac (green-300)
  - WARNING_COLOR = #fcd34d (amber-300)
  - ERROR_COLOR = #fca5a5 (red-300)
- No hardcoded hex values inside templates.

## Layout and Components
- Email layout: cloud-api/src/email/components/EmailLayout.tsx
  - Html, Head, Preview, Body, Container, Header, Content, Footer.
- Brand assets:
  - Logo URL derived from ONLINE_STORE_BASE_URL + "/assets/logo.png".
  - APP_NAME constant ("DanimeZone" or env-sourced).
- Shared components in cloud-api/src/email/components/:
  - PrimaryButton, SecondaryButton, Divider, SectionCard.
- Typography:
  - Shared style constants for h1, h2, body.
  - No duplicated inline style blocks.
- Dark-mode preparation:
  - Use tokens for backgrounds and borders.
  - Avoid hardcoded white blocks.

## Templates
- Location: cloud-api/src/email/templates/
- Required templates:
  - MagicLinkEmail
  - WelcomeEmail
  - OrderCreatedEmail
  - OrderStatusChangedEmail
- Each template uses EmailLayout and a content map:
  - const content = { [LOCALE.ES_MX]: {...}, [LOCALE.EN_US]: {...} }
- No inline JSX conditionals for locale; resolve content first.

## Email Provider Abstraction
- sendEmail({ to, subject, template, locale, data })
- Locale resolution order:
  1) user.emailLocale
  2) request locale
  3) default ES_MX
- Email send remains non-blocking (fire-and-forget with logging).

## Logging
- Structured events:
  - email_send_attempt
  - email_send_success
  - email_send_fail
- Include:
  - userId, template, locale, orderId (when applicable)
- Do NOT log:
  - tokens, shared secrets, magic link URLs

## Profile UI (online-store)
- Add emailLocale select with options:
  - ES_MX: "Espanol"
  - EN_US: "English"
- On save:
  - Show localized success/error toasts.
- Optimistic update allowed.

## Edge Cases
- Missing user.emailLocale -> fallback to ES_MX.
- Missing logo asset -> render APP_NAME only.
- Email provider failure -> log fail event, do not block response.
