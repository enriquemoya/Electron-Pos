# SPEC: Inventory Alerts (Alertas de Inventario)

## Goal
Provide local-first stock alerts so staff can identify low or out-of-stock items and configure per-product thresholds.

## Users
- Cashiers monitoring stock during sales.
- Managers configuring alert thresholds and reviewing risk items.

## Language & i18n (MANDATORY)
- All visible UI text must be in Spanish (MX).
- No hardcoded strings in JSX; use dictionary keys.
- Examples: "Alertas de inventario", "Stock bajo", "Sin existencias".

## Core Capabilities
- Per-product alert settings:
  - Minimum stock threshold (integer >= 0).
  - Optional out-of-stock alert (when stock = 0).
  - Enable/disable alerts per product.
- Automatic alert generation when stock changes or settings change.
- Persist alerts locally in SQLite.
- Alerts shown in a dedicated alerts UI and indicated on product lists.

## Alert Rules
- Generate LOW_STOCK when stock <= threshold and alerts enabled.
- Generate OUT_OF_STOCK when stock = 0 and out-of-stock alert enabled.
- Auto-resolve LOW_STOCK when stock > threshold.
- Auto-resolve OUT_OF_STOCK when stock > 0.
- Manual resolve is optional and must update status/resolvedAt if present.

## Constraints
- SQLite is the source of truth.
- Renderer never generates alerts directly; all logic via IPC/DB.
- Must react to stock changes from sales, manual adjustments, Excel import, and Drive sync.

## Out of Scope
- Global alert rules across all products.
- Vendor ordering workflows.
- Notifications outside the app (email/SMS).

## Performance Expectations
- Alert generation must be fast and not block sales.
- Lists should handle hundreds of alerts without lag.
