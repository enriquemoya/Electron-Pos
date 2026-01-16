# SPEC: Payment Methods & Proofs (Payment Methods and Proofs)

## Goal
Record payment methods per sale and store proofs for Transfer and Card with backup in Google Drive.

## Users
- Cashiers registering payments at the POS.
- Management reviewing proofs and references.

## Language & i18n (MANDATORY)
- All visible UI text must be in Spanish (MX).
- No hardcoded strings in JSX; use dictionary.
- Examples: "Metodo de pago", "Efectivo", "Transferencia", "Tarjeta", "Referencia", "Comprobante".

## Supported Payment Methods
- Cash
- Transfer
- Card
- Store Credit (selection only; logic in Store Credit SPEC)

## Proof Requirements
- Transfer and Card require proof (image or PDF).
- The proof is uploaded to Google Drive.
- The file name includes the ticket number.
- Folder structure per day:
  - /Comprobantes/YYYY-MM-DD/TICKET-000123-transferencia.jpg

## Constraints
- SQLite is the source of truth.
- Persistence only via IPC (renderer does not access DB).
- Drive is a mirror, not authority.
- Do not block sale completion if Drive fails; a manual retry must exist.

## Out of Scope
- Store Credit logic.
- CFDI or fiscal stamping.
- Partial payments or multiple methods per sale.
- Bank reconciliation.

## Performance Expectations
- Sale confirmation must be immediate.
- Proof upload must not block the UI; handle states.
