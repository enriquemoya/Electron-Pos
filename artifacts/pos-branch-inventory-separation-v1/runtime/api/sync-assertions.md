# Sync Assertions

Status: BLOCKED

Cannot execute terminal-auth sync assertions because TERMINAL_TOKEN and BRANCH_ID are not available in deploy/.env.
Expected assertion remains:
- PRODUCT_ID_0 exists in snapshot/delta payload
- PRODUCT_ID_0 payload.branchQuantity == 0
