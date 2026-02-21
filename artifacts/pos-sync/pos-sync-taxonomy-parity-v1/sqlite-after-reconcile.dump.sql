/* WARNING: Script requires that SQLITE_DBCONFIG_DEFENSIVE be disabled */
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE game_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
, cloud_id TEXT, enabled_pos INTEGER NOT NULL DEFAULT 1, enabled_online_store INTEGER NOT NULL DEFAULT 1, cloud_updated_at TEXT, is_deleted_cloud INTEGER NOT NULL DEFAULT 0);
INSERT INTO game_types VALUES('db71a107-9f96-438f-b0ea-75a469037df4','Pokemon',1,'2026-02-07T04:52:42.503Z','2026-02-20T02:29:52.407Z','db71a107-9f96-438f-b0ea-75a469037df4',1,1,'2026-02-07T04:52:42.503Z',0);
CREATE TABLE expansions (
  id TEXT PRIMARY KEY,
  game_type_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  release_date TEXT,
  active INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL, cloud_id TEXT, enabled_pos INTEGER NOT NULL DEFAULT 1, enabled_online_store INTEGER NOT NULL DEFAULT 1, cloud_updated_at TEXT, is_deleted_cloud INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (game_type_id) REFERENCES game_types(id)
);
INSERT INTO expansions VALUES('acee86f3-725e-4381-adff-a211b4cf2aad','db71a107-9f96-438f-b0ea-75a469037df4','ETB Lucario',NULL,NULL,1,'2026-02-07T04:52:42.503Z','2026-02-20T02:29:52.407Z','acee86f3-725e-4381-adff-a211b4cf2aad',1,1,'2026-02-07T04:52:42.503Z',0);
CREATE TABLE products (
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
  updated_at TEXT NOT NULL, cloud_id TEXT, enabled_pos INTEGER NOT NULL DEFAULT 1, enabled_online_store INTEGER NOT NULL DEFAULT 1, cloud_updated_at TEXT, is_deleted_cloud INTEGER NOT NULL DEFAULT 0, category_cloud_id TEXT, game_cloud_id TEXT, expansion_cloud_id TEXT,
  FOREIGN KEY (game_type_id) REFERENCES game_types(id),
  FOREIGN KEY (expansion_id) REFERENCES expansions(id)
);
INSERT INTO products VALUES('9b577ceb-53b9-498f-a531-fbfe0ff851ea','ETB Lucario','COMMODITY',1200,'MXN','db71a107-9f96-438f-b0ea-75a469037df4','acee86f3-725e-4381-adff-a211b4cf2aad','Pokemon',NULL,NULL,NULL,'https://cdn.danimezone.com/prod/products/82079bed-8a23-446d-a3ad-1cea5c91e8a0.webp',1,'2026-02-07T04:52:42.503Z','2026-02-20T02:29:52.407Z','9b577ceb-53b9-498f-a531-fbfe0ff851ea',1,1,'2026-02-07T04:52:42.503Z',0,'legacy:category:commodity','db71a107-9f96-438f-b0ea-75a469037df4','acee86f3-725e-4381-adff-a211b4cf2aad');
CREATE TABLE catalog_meta (
  entity_type TEXT NOT NULL,
  cloud_id TEXT NOT NULL,
  version_hash TEXT,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (entity_type, cloud_id)
);
INSERT INTO catalog_meta VALUES('PRODUCT','9b577ceb-53b9-498f-a531-fbfe0ff851ea','6c2320c1849bb5673670dff08380de2e4511110895faf039f316cadbed09ec4a','2026-02-07T04:52:42.503Z','{"id":"9b577ceb-53b9-498f-a531-fbfe0ff851ea","slug":"etb-lucario","name":"ETB Lucario","shortDescription":"ETB DE LUCARIO GOD","description":"ETB DE LUCARIO GOD 2","imageUrl":"https://cdn.danimezone.com/prod/products/82079bed-8a23-446d-a3ad-1cea5c91e8a0.webp","categoryId":"db55b780-11c8-4861-a3e8-b5c95d0fad5a","category":"Elite Trainer Box","gameId":"db71a107-9f96-438f-b0ea-75a469037df4","game":"Pokemon","expansionId":"acee86f3-725e-4381-adff-a211b4cf2aad","price":1200,"available":13,"availabilityState":"AVAILABLE","enabledPOS":true,"enabledOnlineStore":true,"isDeletedCloud":false}');
CREATE TABLE pos_sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  catalog_snapshot_version TEXT,
  snapshot_applied_at TEXT,
  last_delta_sync_at TEXT,
  last_reconcile_at TEXT,
  last_sync_error_code TEXT
);
INSERT INTO pos_sync_state VALUES(1,'2026-02-07T04:52:42.503Z','2026-02-20T02:29:52.407Z','2026-02-20T05:10:03.381Z','2026-02-20T02:30:10.383Z',NULL);
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  cloud_id TEXT UNIQUE,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  enabled_pos INTEGER NOT NULL DEFAULT 1,
  enabled_online_store INTEGER NOT NULL DEFAULT 1,
  cloud_updated_at TEXT,
  is_deleted_cloud INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO categories VALUES('legacy:category:commodity','legacy:category:commodity','COMMODITY',1,1,1,'2026-02-07T04:52:42.503Z',0,'2026-02-07T04:52:42.503Z','2026-02-20T02:29:52.407Z');
COMMIT;
