CREATE TABLE IF NOT EXISTS pos_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id TEXT NOT NULL,
  branch_id UUID NOT NULL,
  local_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  synced_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT fk_pos_sync_events_terminal
    FOREIGN KEY (terminal_id) REFERENCES terminals(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pos_sync_events_branch
    FOREIGN KEY (branch_id) REFERENCES pickup_branches(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_pos_sync_events_terminal_local_event
  ON pos_sync_events (terminal_id, local_event_id);

CREATE INDEX IF NOT EXISTS idx_pos_sync_events_branch_synced
  ON pos_sync_events (branch_id, synced_at);

CREATE INDEX IF NOT EXISTS idx_pos_sync_events_event_type
  ON pos_sync_events (event_type);
