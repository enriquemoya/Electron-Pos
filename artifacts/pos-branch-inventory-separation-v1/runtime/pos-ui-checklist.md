# POS UI checklist (manual)

Date: 2026-02-20

## Required screenshots/video
1. EMPLOYEE session: increment button visible, decrement button hidden on `/inventory`.
2. EMPLOYEE forced decrement attempt (DevTools/API) shows `RBAC_FORBIDDEN` response.
3. ADMIN session: increment + decrement buttons visible on `/inventory`.
4. After increment/decrement, branch quantity refreshes in the same table row.

## Files to attach
- `screens/employee-increment-only.png`
- `screens/employee-decrement-forbidden.png`
- `screens/admin-decrement-enabled.png`
- `screens/admin-adjust-quantity-updated.png`

## Results
- Pending manual execution.
