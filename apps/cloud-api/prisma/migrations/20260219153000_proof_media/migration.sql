CREATE TABLE "proof_media" (
  "id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "terminal_id" TEXT NOT NULL,
  "sale_id" TEXT,
  "object_key" TEXT NOT NULL,
  "cdn_url" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "proof_media_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "proof_media"
  ADD CONSTRAINT "proof_media_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "pickup_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "proof_media"
  ADD CONSTRAINT "proof_media_terminal_id_fkey"
  FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "idx_proof_media_branch_created"
  ON "proof_media"("branch_id", "created_at" DESC);

CREATE INDEX "idx_proof_media_sale"
  ON "proof_media"("sale_id");

CREATE INDEX "idx_proof_media_terminal_created"
  ON "proof_media"("terminal_id", "created_at" DESC);
