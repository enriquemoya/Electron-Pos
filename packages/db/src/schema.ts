export const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_types (
  id TEXT PRIMARY KEY,
  cloud_id TEXT UNIQUE,
  name TEXT NOT NULL,
  active INTEGER NOT NULL,
  enabled_pos INTEGER NOT NULL DEFAULT 1,
  enabled_online_store INTEGER NOT NULL DEFAULT 1,
  cloud_updated_at TEXT,
  is_deleted_cloud INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expansions (
  id TEXT PRIMARY KEY,
  cloud_id TEXT UNIQUE,
  game_type_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  release_date TEXT,
  active INTEGER NOT NULL,
  enabled_pos INTEGER NOT NULL DEFAULT 1,
  enabled_online_store INTEGER NOT NULL DEFAULT 1,
  cloud_updated_at TEXT,
  is_deleted_cloud INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (game_type_id) REFERENCES game_types(id)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  cloud_id TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_amount INTEGER NOT NULL,
  price_currency TEXT NOT NULL,
  game_type_id TEXT,
  expansion_id TEXT,
  game TEXT,
  expansion TEXT,
  rarity TEXT,
  condition TEXT,
  image_url TEXT,
  is_stock_tracked INTEGER NOT NULL,
  enabled_pos INTEGER NOT NULL DEFAULT 1,
  enabled_online_store INTEGER NOT NULL DEFAULT 1,
  cloud_updated_at TEXT,
  is_deleted_cloud INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (game_type_id) REFERENCES game_types(id),
  FOREIGN KEY (expansion_id) REFERENCES expansions(id)
);

CREATE TABLE IF NOT EXISTS inventory (
  product_id TEXT PRIMARY KEY,
  stock INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  source TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  flagged INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS applied_events (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_sync_state (
  pos_id TEXT PRIMARY KEY,
  last_sync_at TEXT,
  last_attempt_at TEXT,
  last_result TEXT,
  pending_count INTEGER
);

CREATE TABLE IF NOT EXISTS product_alert_settings (
  product_id TEXT PRIMARY KEY,
  min_stock INTEGER NOT NULL,
  alerts_enabled INTEGER NOT NULL,
  out_of_stock_enabled INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL,
  current_stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  opening_amount INTEGER NOT NULL,
  expected_amount INTEGER NOT NULL,
  real_amount INTEGER,
  difference INTEGER,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  shift_id TEXT NOT NULL,
  customer_id TEXT,
  tournament_id TEXT,
  payment_method TEXT NOT NULL,
  payment_amount INTEGER NOT NULL,
  payment_reference TEXT,
  proof_file_ref TEXT,
  proof_status TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_price_amount INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  line_total_amount INTEGER NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS sync_state (
  provider TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  last_synced_at TEXT,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS catalog_meta (
  entity_type TEXT NOT NULL,
  cloud_id TEXT NOT NULL,
  version_hash TEXT,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (entity_type, cloud_id)
);

CREATE TABLE IF NOT EXISTS catalog_id_map (
  entity_type TEXT NOT NULL,
  cloud_id TEXT NOT NULL,
  local_id TEXT,
  PRIMARY KEY (entity_type, cloud_id)
);

CREATE TABLE IF NOT EXISTS sync_journal (
  id TEXT PRIMARY KEY,
  terminal_id TEXT,
  branch_id TEXT,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 10,
  next_retry_at TEXT,
  last_error_code TEXT,
  manual_intervention_required INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS pos_sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  catalog_snapshot_version TEXT,
  snapshot_applied_at TEXT,
  last_delta_sync_at TEXT,
  last_reconcile_at TEXT,
  last_sync_error_code TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  first_names TEXT NOT NULL,
  last_name_paternal TEXT NOT NULL,
  last_name_maternal TEXT NOT NULL,
  birth_date TEXT,
  address TEXT,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS store_credit_movements (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  game TEXT NOT NULL,
  game_type_id TEXT,
  expansion_id TEXT,
  date TEXT NOT NULL,
  max_capacity INTEGER NOT NULL,
  entry_price_amount INTEGER NOT NULL,
  entry_price_currency TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  prize_value_amount INTEGER NOT NULL,
  prize_value_currency TEXT NOT NULL,
  winner_count INTEGER NOT NULL DEFAULT 1,
  prize_distribution TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (game_type_id) REFERENCES game_types(id),
  FOREIGN KEY (expansion_id) REFERENCES expansions(id)
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  customer_id TEXT,
  registered_at TEXT NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

CREATE TABLE IF NOT EXISTS tournament_prizes (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  prize_type TEXT NOT NULL,
  credit_amount INTEGER,
  product_notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (participant_id) REFERENCES tournament_participants(id)
);
`;

export const indexesSql = `
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_proof_status ON sales(proof_status);
CREATE INDEX IF NOT EXISTS idx_credit_movements_customer ON store_credit_movements(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_movements_created_at ON store_credit_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(date);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_status ON inventory_alerts(status);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_created ON inventory_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_applied_events_applied ON applied_events(applied_at);
CREATE INDEX IF NOT EXISTS idx_products_game_type ON products(game_type_id);
CREATE INDEX IF NOT EXISTS idx_products_expansion ON products(expansion_id);
CREATE INDEX IF NOT EXISTS idx_products_enabled_visible ON products(enabled_pos, is_deleted_cloud);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_cloud_id ON products(cloud_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_game_type ON tournaments(game_type_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_expansion ON tournaments(expansion_id);
CREATE INDEX IF NOT EXISTS idx_game_types_active ON game_types(active);
CREATE INDEX IF NOT EXISTS idx_game_types_enabled_visible ON game_types(enabled_pos, is_deleted_cloud);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_types_cloud_id ON game_types(cloud_id);
CREATE INDEX IF NOT EXISTS idx_expansions_game_type ON expansions(game_type_id);
CREATE INDEX IF NOT EXISTS idx_expansions_active ON expansions(active);
CREATE INDEX IF NOT EXISTS idx_expansions_enabled_visible ON expansions(enabled_pos, is_deleted_cloud);
CREATE UNIQUE INDEX IF NOT EXISTS idx_expansions_cloud_id ON expansions(cloud_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_expansions_game_type_name ON expansions(game_type_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_catalog_meta_updated ON catalog_meta(updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_journal_status_next_retry ON sync_journal(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_sync_journal_manual ON sync_journal(manual_intervention_required);
`;

export const latestSchemaVersion = 13;
