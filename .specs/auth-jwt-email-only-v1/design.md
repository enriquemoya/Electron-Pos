# Design: Auth JWT Email Only v1

## Primary auth flow
Magic link (email only).

## High-level architecture
- Cloud API provides magic link request/verify endpoints.
- Email delivery uses SMTP (nodemailer).
- JWT access + refresh tokens issued on verify.
- Online-store provides request + verify pages (server-side).
- Admin routes require JWT with ADMIN role.

## Data model additions
- User: email unique; add emailVerifiedAt, lastLoginAt (if not already present).
- MagicLinkToken:
  - id (uuid)
  - userId (fk)
  - tokenHash
  - expiresAt
  - consumedAt
  - createdAt
- RefreshToken:
  - id (uuid)
  - userId (fk)
  - tokenHash
  - expiresAt
  - revokedAt
  - createdAt
  - lastUsedAt

## Token strategy
- Access token: 15 minutes.
- Refresh token: 30 days.
- Store hashed refresh tokens in DB.
- Rotate refresh tokens on use.
- Reject reuse of rotated refresh tokens.

## Magic link behavior
- On request: find or create user (role CUSTOMER, status ACTIVE).
- Create token with 15 minute expiry; store hashed token.
- On verify: if valid and not consumed, mark consumedAt and set emailVerifiedAt/lastLoginAt.
- Invalid or expired token returns generic error.

## API contracts (Cloud API)
Public:
- POST /auth/magic-link/request
  - body: { email }
  - response: { status: "ok" }
- POST /auth/magic-link/verify
  - body: { token }
  - response: { accessToken, refreshToken }

Protected:
- POST /auth/refresh
  - body: { refreshToken }
  - response: { accessToken, refreshToken }
- POST /auth/logout
  - body: { refreshToken }
  - response: { status: "ok" }

## Email delivery
- Generate magic link URL pointing to online-store verify route.
- Use SMTP (nodemailer) to send mail.
- Do not log token values.
 - SMTP config: host, port, user, pass, from.

## JWT claims
- sub (user id), role, email, exp, iat.

## Online-store routes
- /[locale]/auth/login (email input to request magic link)
- /[locale]/auth/verify?token=... (server-side verify; set cookies)
 - Verify route is server-only and redirects to /{locale} on success.
 - Invalid or expired token renders friendly error page.

## Auth storage
- Store access/refresh tokens in httpOnly, secure cookies.
- Client components never access token values.
 - Access cookie name: auth_access (15 minutes).
 - Refresh cookie name: auth_refresh (30 days).
 - Cookie attrs: httpOnly, secure, sameSite=lax, path=/.

## i18n and accessibility
- Localize all auth UI strings.
- Provide accessible form labels and errors.

## Edge cases
- Reuse of magic link token must be rejected.
- Expired tokens return generic error.
- Refresh token reuse after rotation must be rejected.
