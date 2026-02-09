# Inventory Alerts - Tasks

## Phase 1: Domain Helpers
- Add optional pure helper to evaluate alert status from stock + settings.

## Phase 2: Persistence
- Add tables for alert settings and alerts.
- Implement alert repository:
  - create/update alert
  - list active alerts
  - resolve alerts
- Ensure alert updates are triggered on stock changes.

## Phase 3: IPC
- Expose alert endpoints:
  - listActiveAlerts
  - resolveAlert (optional)
- Expose product alert settings update.

## Phase 4: UI
- Add Alerts page or panel.
- Add alert indicators on product list.
- Add product alert settings in product edit.

## Phase 5: Integration
- Hook alert evaluation into:
  - sales stock decrement
  - manual stock adjustments
  - Excel import
  - Drive sync reconciliation

## Phase 6: Validation & UX
- Inline errors.
- Loading states.
- Quick filters and sorting.
