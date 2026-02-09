# Design: Online Store Auth Profile Improvements v1

## High level architecture
- Online store server components call cloud-api profile endpoints.
- Auth tokens remain in httpOnly cookies.
- Password login returns access and refresh tokens like magic link.

## Data model changes
- User: add passwordHash (nullable) and passwordUpdatedAt (nullable).
- Passwords are hashed with bcrypt and never logged.
- Address: reuse existing address table for profile address.

## Cloud API contracts
### Profile
- GET /profile/me
  - auth: Authorization: Bearer <access token>
  - response: { user, address }
- PATCH /profile/me
  - auth: Authorization: Bearer <access token>
  - body: { firstName, lastName, phone, address }
  - response: { user, address }

### Password
- PATCH /profile/password
  - auth: Authorization: Bearer <access token>
  - body: { password, confirmPassword }
  - response: { status: "ok" }
- POST /auth/password/login
  - body: { email, password }
  - response: { accessToken, refreshToken }

## Profile completeness
- Required: firstName and lastName.
- Email is always known for authenticated users.
- Address is optional; modal copy mentions benefits.
- Home page only: if required fields missing, show dialog.
- Dismiss with "Later"; dialog reappears on next home load until complete.

## Header auth entry
- Add account icon (lucide) aligned with search and cart.
- Mobile: icon only, no text labels.
- Remove cart text label on mobile if present.
- Authenticated: link to /account/profile.
- Unauthenticated: link to /auth/login.
- Authenticated: account icon opens a menu with items in order:
  - Profile (links to /account/profile)
  - Orders (present but disabled until orders spec)
  - Close session (logs out)
- Unauthenticated: account icon opens a menu with a single item:
  - Sign in (links to /auth/login)

## Logout behavior
- Logout is triggered from account menu.
- Online store posts refreshToken to POST /auth/logout.
- After logout, clear auth_access and auth_refresh cookies.
- Redirect to /{locale}/.
- Logout redirect includes a logout=1 query param and home page forces a single reload.

## Login UX
- Login page explains magic link as default method.
- Secondary button switches to password login.
- Password login shares same account and is optional.

## Cloud API limits
- Only profile read/update and password login are added.
- No other cloud-api behavior changes.

## Profile page
- Route: /[locale]/account/profile
- Sections:
  - Personal data (firstName, lastName, phone)
  - Address (street, externalNumber, internalNumber, postalCode, neighborhood, city, state, country, references)
  - Password (optional set/update)
- Copy explains password is optional and magic link remains valid.
- After successful password update, password inputs are cleared.

## UI components
- Use shadcn components (Dialog, Button, Input, Card).
- Use lucide icons for header entry.

## Edge cases
- If password is not set, password login returns invalid credentials.
- If profile update address is empty, do not create address.
- If address exists, update the first address for the user.
