-- Add scoped inventory source of truth and movement ledger.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_scope_type') THEN
    CREATE TYPE inventory_scope_type AS ENUM ('ONLINE_STORE', 'BRANCH');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_movement_actor_role') THEN
    CREATE TYPE inventory_movement_actor_role AS ENUM ('ADMIN', 'EMPLOYEE', 'TERMINAL');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS inventory_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  scope_type inventory_scope_type NOT NULL,
  branch_id uuid NULL,
  quantity integer NOT NULL,
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT fk_inventory_stock_product FOREIGN KEY (product_id)
    REFERENCES read_model_inventory(product_id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_stock_branch FOREIGN KEY (branch_id)
    REFERENCES pickup_branches(id) ON DELETE CASCADE,
  CONSTRAINT ck_inventory_stock_scope_branch CHECK (
    (scope_type = 'ONLINE_STORE' AND branch_id IS NULL)
    OR
    (scope_type = 'BRANCH' AND branch_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_stock_scope
  ON inventory_stock (product_id, scope_type, branch_id);

-- Postgres unique with NULL permits duplicates; guard ONLINE_STORE rows explicitly.
CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_stock_online_store
  ON inventory_stock (product_id)
  WHERE scope_type = 'ONLINE_STORE' AND branch_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_stock_branch
  ON inventory_stock (product_id, branch_id)
  WHERE scope_type = 'BRANCH' AND branch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_stock_scope_branch
  ON inventory_stock (scope_type, branch_id);

CREATE INDEX IF NOT EXISTS idx_inventory_stock_product
  ON inventory_stock (product_id);

CREATE TABLE IF NOT EXISTS inventory_movement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  scope_type inventory_scope_type NOT NULL,
  branch_id uuid NULL,
  delta integer NOT NULL,
  reason text NOT NULL,
  actor_role inventory_movement_actor_role NOT NULL,
  actor_user_id uuid NULL,
  actor_terminal_id text NULL,
  idempotency_key text NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT fk_inventory_movement_product FOREIGN KEY (product_id)
    REFERENCES read_model_inventory(product_id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_movement_branch FOREIGN KEY (branch_id)
    REFERENCES pickup_branches(id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_movement_user FOREIGN KEY (actor_user_id)
    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_inventory_movement_terminal FOREIGN KEY (actor_terminal_id)
    REFERENCES terminals(id) ON DELETE SET NULL,
  CONSTRAINT ck_inventory_movement_scope_branch CHECK (
    (scope_type = 'ONLINE_STORE' AND branch_id IS NULL)
    OR
    (scope_type = 'BRANCH' AND branch_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_movement_idempotency
  ON inventory_movement (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_inventory_movement_branch_created
  ON inventory_movement (branch_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movement_product_created
  ON inventory_movement (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movement_scope
  ON inventory_movement (scope_type);

-- Transitional backfill: ONLINE_STORE stock mirrors current legacy available quantities.
INSERT INTO inventory_stock (product_id, scope_type, branch_id, quantity, updated_at)
SELECT product_id, 'ONLINE_STORE', NULL, available, updated_at
FROM read_model_inventory
ON CONFLICT (product_id, scope_type, branch_id) DO NOTHING;
