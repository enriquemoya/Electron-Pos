# Requirements: Online Store Auth Profile Improvements v1

## Problem statement
Authenticated customers lack clear account entry points, profile completion
prompts, and optional password login, which blocks readiness for future
cart and checkout work.

## Goals
- Add a header account icon that routes users to login or profile.
- Add a header account menu for authenticated users with Profile, Orders, and Close session.
- If no active session, show only a Sign in menu item.
- Remove any cart text label on mobile (icon only).
- Detect incomplete profiles on home and prompt completion.
- Add a profile page for personal data and optional password creation.
- Clarify login UX with magic link default and optional password login.
- Clear password inputs after a successful password update.
- Logout must revoke the refresh token and clear access and refresh cookies.
- After logout redirect to /{locale}/.
- After logout redirect completes, force a client-side reload on the home page to clear stale UI.

## Scope
- Online store UI and server actions for auth/profile UX.
- Cloud API profile read and update endpoints.
- Cloud API password set and password login endpoints.

## Non goals
- No SMS or phone verification.
- No admin features.
- No cart, checkout, payment, shipping, inventory, or POS changes.

## Constraints
- Magic link remains primary login method.
- Password login is optional and uses the same account.
- JWT/session handling remains unchanged.
- Online store uses server side calls only for cloud-api.
- All user visible strings are localized.
- Modal appears only on home when profile incomplete.
- Modal never appears after profile is complete.
- Lucide icons for header account entry.
- Orders menu item is present but may be disabled until orders are implemented.

## Required profile fields
- firstName
- lastName
- email is already known for authenticated users
- address is optional but flagged in messaging

## i18n
- All strings use next-intl and must be localized.

## Error handling
- Auth failures return safe, non sensitive messages.
- Profile update errors are explicit and localized.
- Logout errors must not leak sensitive detail.

## Validation
- Validate required profile fields.
- Validate password rules and confirm match.
- Validate email format in password login.
