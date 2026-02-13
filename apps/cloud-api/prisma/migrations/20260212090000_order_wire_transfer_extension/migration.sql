ALTER TYPE "OnlineOrderStatus" ADD VALUE IF NOT EXISTS 'PAID_BY_TRANSFER';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_TRANSFER', 'PAID', 'FAILED', 'REFUNDED');
  END IF;
END $$;

ALTER TABLE "online_orders"
  ADD COLUMN IF NOT EXISTS "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PAID';

UPDATE "online_orders"
SET "payment_status" = 'PAID'
WHERE "payment_status" IS NULL;

ALTER TABLE "online_order_status_logs"
  ADD COLUMN IF NOT EXISTS "approved_by_admin_id" UUID,
  ADD COLUMN IF NOT EXISTS "approved_by_admin_name" TEXT,
  ADD COLUMN IF NOT EXISTS "admin_message" TEXT;

CREATE INDEX IF NOT EXISTS "idx_online_order_status_logs_admin" ON "online_order_status_logs" ("approved_by_admin_id");
