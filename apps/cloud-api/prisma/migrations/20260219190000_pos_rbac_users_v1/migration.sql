-- pos-rbac-users-v1 (additive)

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EMPLOYEE';

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "display_name" TEXT,
ADD COLUMN IF NOT EXISTS "pin_hash" TEXT,
ADD COLUMN IF NOT EXISTS "pin_updated_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "failed_pin_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "pin_locked_until" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "branch_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_branch_id_fkey'
  ) THEN
    ALTER TABLE "users"
    ADD CONSTRAINT "users_branch_id_fkey"
    FOREIGN KEY ("branch_id")
    REFERENCES "pickup_branches"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_users_branch" ON "users"("branch_id");
CREATE INDEX IF NOT EXISTS "idx_users_role_branch" ON "users"("role", "branch_id");

ALTER TABLE "online_order_status_logs"
ADD COLUMN IF NOT EXISTS "actor_role" TEXT,
ADD COLUMN IF NOT EXISTS "actor_display_name" TEXT;
