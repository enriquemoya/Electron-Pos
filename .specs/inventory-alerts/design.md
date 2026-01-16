# Inventory Alerts - Design

## Alert Model
- id
- productId
- type: LOW_STOCK | OUT_OF_STOCK
- currentStock
- threshold
- createdAt
- resolvedAt (nullable)
- status: ACTIVE | RESOLVED

## Product Alert Settings
- per product:
  - minStockThreshold (integer >= 0)
  - enableAlerts (boolean)
  - enableOutOfStockAlert (boolean)

## Generation Logic
- Triggered when:
  - stock changes (sales, manual adjustment, import, sync)
  - product alert settings change
- If alerts disabled: resolve existing alerts for that product.
- LOW_STOCK:
  - create if stock <= threshold and no active LOW_STOCK exists.
- OUT_OF_STOCK:
  - create if stock = 0 and enabled and no active OUT_OF_STOCK exists.

## Resolution Logic
- Auto-resolve LOW_STOCK when stock > threshold.
- Auto-resolve OUT_OF_STOCK when stock > 0.
- Manual resolve (optional): set status RESOLVED and resolvedAt.

## UI Flows
- Alerts list page or panel:
  - list active alerts
  - filter by type
  - sort by date or severity
- Product list indicators:
  - icon or color badge when product has active alert
- Product edit:
  - configure thresholds and enable/disable alert toggles

## Responsibilities
- Domain:
  - pure helpers for evaluation (optional)
- Persistence:
  - store alert settings and alert rows
  - evaluate and upsert alerts on stock changes
- IPC:
  - expose alert queries and settings updates
- UI:
  - render alerts and product indicators
  - update product settings via IPC

## IPC Usage
- Alerts:
  - listActiveAlerts(filters)
  - resolveAlert(id) (optional)
- Product settings:
  - updateProductAlertSettings(productId, settings)

## Error Handling
- Inline errors only.
- Show clear error when saving settings fails.

## Persistence Strategy
- SQLite tables:
  - product_alert_settings
  - inventory_alerts
- Indexes by productId and status.

## Future Extensions
- Global default thresholds.
- Push notifications or webhook integrations.
