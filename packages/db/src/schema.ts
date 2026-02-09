export const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expansions (
  id TEXT PRIMARY KEY,
  game_type_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  release_date TEXT,
  active INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (game_type_id) REFERENCES game_types(id)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_tournaments_game_type ON tournaments(game_type_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_expansion ON tournaments(expansion_id);
CREATE INDEX IF NOT EXISTS idx_game_types_active ON game_types(active);
CREATE INDEX IF NOT EXISTS idx_expansions_game_type ON expansions(game_type_id);
CREATE INDEX IF NOT EXISTS idx_expansions_active ON expansions(active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_expansions_game_type_name ON expansions(game_type_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
`;

export const latestSchemaVersion = 11;
