DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentLedgerState') THEN
    CREATE TYPE "PaymentLedgerState" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID', 'FAILED', 'REFUNDED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentEntryMethod') THEN
    CREATE TYPE "PaymentEntryMethod" AS ENUM ('PAY_IN_STORE', 'BANK_TRANSFER', 'STORE_CREDIT', 'PROVIDER_EXTERNAL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentEntryStatus') THEN
    CREATE TYPE "PaymentEntryStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED', 'VOIDED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentActorType') THEN
    CREATE TYPE "PaymentActorType" AS ENUM ('ADMIN', 'SYSTEM', 'CUSTOMER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentSourceChannel') THEN
    CREATE TYPE "PaymentSourceChannel" AS ENUM ('ADMIN_PANEL', 'CHECKOUT', 'JOB', 'API');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "order_payment_ledgers" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MXN',
  "total_due" DECIMAL(65,30) NOT NULL,
  "total_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "balance_due" DECIMAL(65,30) NOT NULL,
  "state" "PaymentLedgerState" NOT NULL DEFAULT 'UNPAID',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "order_payment_ledgers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "order_payment_ledgers_order_id_key" ON "order_payment_ledgers"("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_payment_ledgers_state" ON "order_payment_ledgers"("state");

CREATE TABLE IF NOT EXISTS "order_payment_entries" (
  "id" UUID NOT NULL,
  "ledger_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "method" "PaymentEntryMethod" NOT NULL,
  "provider" TEXT,
  "provider_ref" TEXT,
  "amount" DECIMAL(65,30) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MXN',
  "entry_status" "PaymentEntryStatus" NOT NULL DEFAULT 'PENDING',
  "is_store_credit" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "actor_id" UUID,
  "actor_type" "PaymentActorType" NOT NULL DEFAULT 'SYSTEM',
  "source_channel" "PaymentSourceChannel" NOT NULL DEFAULT 'API',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "order_payment_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_order_payment_entries_ledger_created" ON "order_payment_entries"("ledger_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_order_payment_entries_order_created" ON "order_payment_entries"("order_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_order_payment_entries_status" ON "order_payment_entries"("entry_status");
CREATE INDEX IF NOT EXISTS "idx_order_payment_entries_method" ON "order_payment_entries"("method");
CREATE INDEX IF NOT EXISTS "idx_order_payment_entries_actor" ON "order_payment_entries"("actor_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_payment_ledgers_order_id_fkey'
  ) THEN
    ALTER TABLE "order_payment_ledgers"
      ADD CONSTRAINT "order_payment_ledgers_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "online_orders"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_payment_entries_ledger_id_fkey'
  ) THEN
    ALTER TABLE "order_payment_entries"
      ADD CONSTRAINT "order_payment_entries_ledger_id_fkey"
      FOREIGN KEY ("ledger_id") REFERENCES "order_payment_ledgers"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_payment_entries_order_id_fkey'
  ) THEN
    ALTER TABLE "order_payment_entries"
      ADD CONSTRAINT "order_payment_entries_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "online_orders"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_payment_entries_actor_id_fkey'
  ) THEN
    ALTER TABLE "order_payment_entries"
      ADD CONSTRAINT "order_payment_entries_actor_id_fkey"
      FOREIGN KEY ("actor_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "order_payment_ledgers" (
  "id",
  "order_id",
  "currency",
  "total_due",
  "total_paid",
  "balance_due",
  "state",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  o."id",
  o."currency",
  o."subtotal",
  CASE
    WHEN o."payment_status" = 'PAID' THEN o."subtotal"
    ELSE 0
  END AS "total_paid",
  CASE
    WHEN o."payment_status" = 'PAID' THEN 0
    ELSE o."subtotal"
  END AS "balance_due",
  CASE
    WHEN o."payment_status" = 'PAID' THEN 'PAID'::"PaymentLedgerState"
    WHEN o."payment_status" = 'FAILED' THEN 'FAILED'::"PaymentLedgerState"
    WHEN o."payment_status" = 'REFUNDED' THEN 'REFUNDED'::"PaymentLedgerState"
    ELSE 'UNPAID'::"PaymentLedgerState"
  END AS "state",
  o."created_at",
  o."updated_at"
FROM "online_orders" o
LEFT JOIN "order_payment_ledgers" l ON l."order_id" = o."id"
WHERE l."id" IS NULL;

INSERT INTO "order_payment_entries" (
  "id",
  "ledger_id",
  "order_id",
  "method",
  "provider",
  "provider_ref",
  "amount",
  "currency",
  "entry_status",
  "is_store_credit",
  "notes",
  "actor_id",
  "actor_type",
  "source_channel",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  l."id",
  o."id",
  CASE
    WHEN o."payment_method" = 'BANK_TRANSFER' THEN 'BANK_TRANSFER'::"PaymentEntryMethod"
    ELSE 'PAY_IN_STORE'::"PaymentEntryMethod"
  END,
  'NONE',
  NULL,
  CASE
    WHEN o."payment_status" = 'PAID' THEN o."subtotal"
    ELSE 0
  END,
  o."currency",
  CASE
    WHEN o."payment_status" = 'PAID' THEN 'CONFIRMED'::"PaymentEntryStatus"
    WHEN o."payment_status" = 'FAILED' THEN 'FAILED'::"PaymentEntryStatus"
    WHEN o."payment_status" = 'REFUNDED' THEN 'REFUNDED'::"PaymentEntryStatus"
    ELSE 'PENDING'::"PaymentEntryStatus"
  END,
  false,
  'legacy_backfill',
  NULL,
  'SYSTEM'::"PaymentActorType",
  'JOB'::"PaymentSourceChannel",
  o."created_at",
  o."updated_at"
FROM "online_orders" o
JOIN "order_payment_ledgers" l ON l."order_id" = o."id"
WHERE NOT EXISTS (
  SELECT 1
  FROM "order_payment_entries" e
  WHERE e."order_id" = o."id"
);
