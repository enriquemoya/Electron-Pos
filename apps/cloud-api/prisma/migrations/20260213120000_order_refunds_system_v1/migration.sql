ALTER TYPE "OnlineOrderStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_REFUNDED';
ALTER TYPE "PaymentEntryMethod" ADD VALUE IF NOT EXISTS 'REFUND';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RefundMethod') THEN
    CREATE TYPE "RefundMethod" AS ENUM ('CASH', 'CARD', 'STORE_CREDIT', 'TRANSFER', 'OTHER');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "online_order_refunds" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "order_item_id" UUID,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MXN',
  "refund_method" "RefundMethod" NOT NULL,
  "admin_id" UUID,
  "admin_name" TEXT NOT NULL,
  "admin_message" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "online_order_refunds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "online_order_refunds_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "online_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "online_order_refunds_order_item_id_fkey"
    FOREIGN KEY ("order_item_id") REFERENCES "online_order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "online_order_refunds_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_online_order_refunds_order"
ON "online_order_refunds"("order_id");

CREATE INDEX IF NOT EXISTS "idx_online_order_refunds_item"
ON "online_order_refunds"("order_item_id");
