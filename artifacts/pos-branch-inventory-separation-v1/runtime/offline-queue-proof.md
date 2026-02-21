# Offline queue proof (manual)

Date: 2026-02-20

## Scenario
1. Disconnect network.
2. Perform `inventory.adjustManual` in POS.
3. Verify local queue has `INVENTORY_MANUAL_ADJUST` event.
4. Reconnect network.
5. Wait for startup retry or 30-minute worker.
6. Verify queue item marked synced/removed and stock updated.

## SQL hints
```sql
SELECT id,event_type,retry_count,status,next_retry_at,error_code
FROM sync_journal
WHERE event_type='INVENTORY_MANUAL_ADJUST'
ORDER BY created_at DESC;
```

## Results
- Pending manual execution.
