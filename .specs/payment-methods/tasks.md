# Tasks: Payment Methods & Proofs (Payment Methods and Proofs)

## Phase 1 - Domain
- Define PaymentMethod and PaymentInfo.
- Validate amount equals sale total.

## Phase 2 - Persistence
- Add columns in sales: payment_method, payment_amount, reference_text, proof_id, proof_status.
- Adjust repositories and mappings.

## Phase 3 - IPC
- Extend sales:create to include PaymentInfo.
- Expose proof upload via Drive integration.

## Phase 4 - Drive Integration
- Upload file to /Comprobantes/YYYY-MM-DD.
- Name file with ticket.
- Save proofId in SQLite.

## Phase 5 - UI
- Method selector in New Sale.
- Reference field.
- File upload when applicable.
- Pending proof states.

## Phase 6 - Validation & UX
- Inline errors.
- Loading states.
- Basic keyboard shortcuts.
