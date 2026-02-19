DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TerminalStatus') THEN
    CREATE TYPE "TerminalStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS terminals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  branch_id UUID NOT NULL REFERENCES pickup_branches(id) ON DELETE RESTRICT,
  activation_api_key_hash TEXT,
  device_fingerprint_hash TEXT,
  current_device_token_hash TEXT,
  previous_device_token_hash TEXT,
  previous_token_grace_valid_until TIMESTAMPTZ,
  status "TerminalStatus" NOT NULL DEFAULT 'PENDING',
  revoked_at TIMESTAMPTZ,
  revoked_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_terminals_activation_api_key_hash
  ON terminals (activation_api_key_hash);

CREATE UNIQUE INDEX IF NOT EXISTS ux_terminals_current_device_token_hash
  ON terminals (current_device_token_hash);

CREATE INDEX IF NOT EXISTS idx_terminals_branch
  ON terminals (branch_id);

CREATE INDEX IF NOT EXISTS idx_terminals_fingerprint
  ON terminals (device_fingerprint_hash);

CREATE INDEX IF NOT EXISTS idx_terminals_previous_device_token_hash
  ON terminals (previous_device_token_hash);

CREATE INDEX IF NOT EXISTS idx_terminals_status
  ON terminals (status);
