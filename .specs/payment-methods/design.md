# Design: Payment Methods & Proofs (Payment Methods and Proofs)

## Payment Model
- PaymentMethod: EFECTIVO | TRANSFERENCIA | TARJETA | CREDITO_TIENDA
- PaymentInfo:
  - method
  - amount
  - referenceText (optional)
  - proofId (optional)

## Sale-Payment Relationship
- Each sale stores a single PaymentInfo.
- The payment amount must match the sale total.

## Proof Concept
- Proof is a file (image/PDF) associated with a sale.
- The local reference stores the Drive id and/or logical path.

## Google Drive Structure
- Base folder: /Comprobantes
- Day subfolder: /Comprobantes/YYYY-MM-DD
- File name: TICKET-000123-transferencia.ext

## Flow
1) Select payment method.
2) If Transfer/Card, request proof and reference.
3) Confirm sale:
   - Persist local sale with PaymentInfo.
   - Upload proof to Drive.
   - Save proofId in SQLite.
4) If Drive fails, the sale is recorded and marked pending proof.

## Responsibilities
- Domain (packages/core):
  - PaymentMethod and PaymentInfo types.
  - Amount and method validation.
- DB (packages/db):
  - Additional fields in sales for method, reference, proof.
- IPC (apps/desktop):
  - Save sale with PaymentInfo.
  - Upload proof to Drive and return proofId.
- UI (apps/web):
  - Method selector and reference input.
  - File upload for Transfer/Card.

## Error Handling
- Validate selected method and correct amount.
- Require proof when applicable.
- Inline messages, no alert().
- Pending state if Drive fails.

## Security Rules
- Do not store tokens in renderer.
- Validate file type (image/PDF).
- Limit file size per local policy.

## Persistence Strategy
- SQLite stores method, reference, and proofId.
- Drive is a mirror; never source of truth.

## Future Extensions
- Split payments.
- Automatic proof retries.
- Pending proof report.
