# SPEC: Sales History (Sales History)

## Goal
Allow viewing sales, filtering by date and payment method, viewing details (including customer if paid with store credit), and attaching pending proofs.

## Users
- Cashiers viewing recent tickets.
- Management reviewing sales and proofs.

## Language & i18n (MANDATORY)
- All visible UI text must be in Spanish (MX).
- No hardcoded strings in JSX; use dictionary.
- Examples: "Historial de ventas", "Comprobante pendiente", "Adjuntar comprobante", "Reimprimir ticket".

## Core Capabilities
- View list of sales.
- Filter by date, payment method, and proof status.
- Visually mark sales with pending proof.
- View sale detail, including customer when method is Store Credit.
- Attach proof to pending sales.
- Reprint ticket.

## Filters
- Date (range or specific day).
- Payment method (Cash, Transfer, Card, Store Credit).
- Proof status (PENDING / ATTACHED).

## Proof Management
- Attach proof to pending sales.
- Upload proof to Google Drive and store local reference.
- Do not block the operation if Drive fails; keep pending status.

## Constraints
- SQLite is the source of truth.
- Persistence only via IPC (renderer does not access DB).
- Drive is a mirror, not authority.
- Do not modify existing payment logic.

## Out of Scope
- Returns or cancellations.
- Sale edits.
- Multiple payments per sale.
- Advanced reports.

## Performance Expectations
- Filters must respond quickly locally.
- Initial load in < 1s for typical volumes.
