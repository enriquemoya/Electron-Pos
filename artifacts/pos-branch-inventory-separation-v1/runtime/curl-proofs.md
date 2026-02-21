# Curl proofs (manual run)

Date: 2026-02-20

## Required
1. EMPLOYEE delta<0 on `/pos/inventory/movements` -> 403 `RBAC_FORBIDDEN`
2. EMPLOYEE delta>0 on `/pos/inventory/movements` -> 200 OK
3. ADMIN delta<0 on `/pos/inventory/admin-movements` with terminal token + x-pos-user-auth -> 200 OK

## Template
```bash
curl -i -X POST "$CLOUD_API_URL/pos/inventory/movements" \
  -H "authorization: Bearer $TERMINAL_TOKEN" \
  -H "x-cloud-secret: $CLOUD_SHARED_SECRET" \
  -H 'content-type: application/json' \
  -d '{"productId":"<productId>","delta":-1,"reason":"manual_decrement","idempotencyKey":"<uuid>"}'
```

Paste redacted request/response pairs below.

## Results
- Pending manual execution.
