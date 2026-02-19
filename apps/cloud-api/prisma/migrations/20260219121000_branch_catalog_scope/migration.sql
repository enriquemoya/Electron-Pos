-- Create branch-scoped catalog projection table used by POS sync endpoints.
CREATE TABLE "branch_catalog_scope" (
  "branch_id" UUID NOT NULL,
  "product_id" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "branch_catalog_scope_pkey" PRIMARY KEY ("branch_id", "product_id")
);

ALTER TABLE "branch_catalog_scope"
  ADD CONSTRAINT "branch_catalog_scope_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "pickup_branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "branch_catalog_scope"
  ADD CONSTRAINT "branch_catalog_scope_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "read_model_inventory"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "idx_branch_catalog_scope_branch_updated"
  ON "branch_catalog_scope"("branch_id", "updated_at");

CREATE INDEX "idx_branch_catalog_scope_product"
  ON "branch_catalog_scope"("product_id");

-- Backfill existing branches with currently visible products.
INSERT INTO "branch_catalog_scope" ("branch_id", "product_id")
SELECT b."id", r."product_id"
FROM "pickup_branches" b
CROSS JOIN "read_model_inventory" r
ON CONFLICT ("branch_id", "product_id") DO NOTHING;
