# Tasks: Cash Register (Cash Register / Closeout)

## Phase 1 - Domain
- Define Shift model and state rules.
- Helpers to calculate expectedCash and difference.

## Phase 2 - Persistence
- Create shifts table and relation to sales.
- Repository: create/open, close, getActive, list.

## Phase 3 - IPC
- Expose methods: getActiveShift, openShift, closeShift, listShifts.
- Validations in main process.

## Phase 4 - UI
- Cash register route with current state and actions.
- Forms for opening cash and closeout.

## Phase 5 - Sales Integration
- Require active shift when confirming sale.
- Save shift_id in sales.
- Update expected for the shift.

## Phase 6 - UX Polish
- Loading states.
- Inline messages.
- Keyboard shortcuts.
