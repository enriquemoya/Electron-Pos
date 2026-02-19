# Requirements: Online Store Menu Close on Navigation v1

## Goal
Ensure all navigation menus in online-store close immediately when a user selects a link that triggers routing.

## Scope
- Module: online-store only
- Behavior only for navigation UI state
- Applies to desktop navigation dropdown and mobile navigation drawer

## Non-goals
- No cloud-api changes
- No prisma or data changes
- No route structure changes
- No copy or i18n content additions unless strictly required by accessibility

## Constraints
- Keep existing navigation links and destinations unchanged
- Keep locale in URL behavior unchanged
- Use existing Next.js App Router and shadcn patterns
- Additive, non-breaking UI behavior update

## Functional requirements
- Desktop menu must close when a user clicks any menu link.
- Mobile menu must close when a user clicks any menu link.
- Close action must happen immediately on click, not only after pathname update.
- Existing auto-close on pathname change should remain as fallback safety.

## Error handling
- If navigation fails or is interrupted, menu state must still be closed.
- No runtime exceptions from missing close callback handlers.

## i18n impact
- No new visible copy is required.
- Existing localized labels remain unchanged.

## Acceptance criteria
- Clicking desktop dropdown item closes menu before route render completes.
- Clicking mobile menu item closes drawer before route render completes.
- Existing route-change fallback still closes open menus.
- `npm run build -w apps/online-store` succeeds.
- `npm run gov:impl:audit -- "online-store-menu-close-on-navigation-v1"` reports SAFE.
