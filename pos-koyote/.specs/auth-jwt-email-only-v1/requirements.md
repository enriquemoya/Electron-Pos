# Requirements: Auth JWT Email Only v1

## Problem statement
The platform lacks authentication. We need email-only authentication using magic
links with JWT access/refresh tokens and role-based access for admins, while
preserving public catalog access.

## Goals
- Implement email-only authentication using magic links.
- Issue JWT access and refresh tokens with role support (CUSTOMER, ADMIN).
- Protect admin routes with JWT + admin role.
- Keep public catalog accessible without auth.
- Send emails via SMTP (nodemailer) for local/dev/prod.
- Validate emails via magic link verification and track verification timestamp.

## Scope
- Cloud API auth endpoints and token issuance.
- Prisma schema and migrations for auth tokens.
- Online-store auth UI (request magic link, verify callback).
- Server-side-only auth calls and token handling.

## Non-goals
- No phone login or SMS/OTP.
- No password-based login.
- No POS changes.
- No cart/checkout changes.

## Constraints
- Email is the only login identifier.
- Email must be unique.
- JWT tokens must never be logged client-side.
- All auth-sensitive calls are server-side only.
- Use SMTP via nodemailer; MCP email is removed.
- Preserve existing Cloud API public endpoints.
- Magic links must be single-use and time-limited.
- Magic link base URL must use ONLINE_STORE_BASE_URL env var.

## Assumptions
- SMTP credentials are available in server runtime.
- Online-store has server-side access to Cloud API.
- Cookies are httpOnly and secure with sameSite=lax.

## Out of scope
- User self-registration UI beyond magic link request.
- OAuth or social login.

## i18n
- All user-visible auth UI strings are localized.

## Error handling
- Auth failures return safe, non-sensitive errors.
- Invalid/expired magic links return a generic error message.

## Validation
- Validate email format on requests.
