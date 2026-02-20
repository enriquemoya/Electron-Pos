import Database from "better-sqlite3";
import { indexesSql, latestSchemaVersion, schemaSql } from "./schema";

export type DbConfig = {
  filepath: string;
};

export type DbHandle = Database.Database;

// Initializes SQLite with the latest schema, failing fast on errors.
export function initializeDb(config: DbConfig): DbHandle {
  const db = new Database(config.filepath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(schemaSql);

  const safeAddColumn = (table: string, column: string, definition: string) => {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
    } catch (error) {
      // Ignore duplicate column errors to keep migrations idempotent.
      if (!(error instanceof Error) || !error.message.includes("duplicate column")) {
        throw error;
      }
    }
  };

  // Lightweight schema guard for new sales fields in existing databases.
  const salesColumns = db.prepare("PRAGMA table_info(sales)").all() as { name: string }[];
  const hasColumn = (name: string) => salesColumns.some((column) => column.name === name);
  if (!hasColumn("shift_id")) {
    db.prepare("ALTER TABLE sales ADD COLUMN shift_id TEXT").run();
  }
  if (!hasColumn("customer_id")) {
    db.prepare("ALTER TABLE sales ADD COLUMN customer_id TEXT").run();
  }
  if (!hasColumn("tournament_id")) {
    db.prepare("ALTER TABLE sales ADD COLUMN tournament_id TEXT").run();
  }
  if (!hasColumn("payment_method")) {
    db.prepare("ALTER TABLE sales ADD COLUMN payment_method TEXT").run();
  }
  if (!hasColumn("payment_amount")) {
    db.prepare("ALTER TABLE sales ADD COLUMN payment_amount INTEGER").run();
  }
  if (!hasColumn("payment_reference")) {
    db.prepare("ALTER TABLE sales ADD COLUMN payment_reference TEXT").run();
  }
  if (!hasColumn("proof_file_ref")) {
    db.prepare("ALTER TABLE sales ADD COLUMN proof_file_ref TEXT").run();
  }
  if (!hasColumn("proof_status")) {
    db.prepare("ALTER TABLE sales ADD COLUMN proof_status TEXT").run();
  }

  const productColumns = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
  const hasProductColumn = (name: string) =>
    productColumns.some((column) => column.name === name);
  if (productColumns.length > 0 && !hasProductColumn("game_type_id")) {
    safeAddColumn("products", "game_type_id", "TEXT");
  }
  if (productColumns.length > 0 && !hasProductColumn("expansion_id")) {
    safeAddColumn("products", "expansion_id", "TEXT");
  }
  if (productColumns.length > 0 && !hasProductColumn("cloud_id")) {
    safeAddColumn("products", "cloud_id", "TEXT");
  }
  if (productColumns.length > 0 && !hasProductColumn("enabled_pos")) {
    safeAddColumn("products", "enabled_pos", "INTEGER NOT NULL DEFAULT 1");
  }
  if (productColumns.length > 0 && !hasProductColumn("enabled_online_store")) {
    safeAddColumn("products", "enabled_online_store", "INTEGER NOT NULL DEFAULT 1");
  }
  if (productColumns.length > 0 && !hasProductColumn("cloud_updated_at")) {
    safeAddColumn("products", "cloud_updated_at", "TEXT");
  }
  if (productColumns.length > 0 && !hasProductColumn("is_deleted_cloud")) {
    safeAddColumn("products", "is_deleted_cloud", "INTEGER NOT NULL DEFAULT 0");
  }
  if (productColumns.length > 0 && !hasProductColumn("category_cloud_id")) {
    safeAddColumn("products", "category_cloud_id", "TEXT");
  }
  if (productColumns.length > 0 && !hasProductColumn("game_cloud_id")) {
    safeAddColumn("products", "game_cloud_id", "TEXT");
  }
  if (productColumns.length > 0 && !hasProductColumn("expansion_cloud_id")) {
    safeAddColumn("products", "expansion_cloud_id", "TEXT");
  }

  const gameTypeColumns = db.prepare("PRAGMA table_info(game_types)").all() as { name: string }[];
  const hasGameTypeColumn = (name: string) =>
    gameTypeColumns.some((column) => column.name === name);
  if (gameTypeColumns.length > 0 && !hasGameTypeColumn("cloud_id")) {
    safeAddColumn("game_types", "cloud_id", "TEXT");
  }
  if (gameTypeColumns.length > 0 && !hasGameTypeColumn("enabled_pos")) {
    safeAddColumn("game_types", "enabled_pos", "INTEGER NOT NULL DEFAULT 1");
  }
  if (gameTypeColumns.length > 0 && !hasGameTypeColumn("enabled_online_store")) {
    safeAddColumn("game_types", "enabled_online_store", "INTEGER NOT NULL DEFAULT 1");
  }
  if (gameTypeColumns.length > 0 && !hasGameTypeColumn("cloud_updated_at")) {
    safeAddColumn("game_types", "cloud_updated_at", "TEXT");
  }
  if (gameTypeColumns.length > 0 && !hasGameTypeColumn("is_deleted_cloud")) {
    safeAddColumn("game_types", "is_deleted_cloud", "INTEGER NOT NULL DEFAULT 0");
  }

  const expansionColumns = db.prepare("PRAGMA table_info(expansions)").all() as { name: string }[];
  const hasExpansionColumn = (name: string) =>
    expansionColumns.some((column) => column.name === name);
  if (expansionColumns.length > 0 && !hasExpansionColumn("cloud_id")) {
    safeAddColumn("expansions", "cloud_id", "TEXT");
  }
  if (expansionColumns.length > 0 && !hasExpansionColumn("enabled_pos")) {
    safeAddColumn("expansions", "enabled_pos", "INTEGER NOT NULL DEFAULT 1");
  }
  if (expansionColumns.length > 0 && !hasExpansionColumn("enabled_online_store")) {
    safeAddColumn("expansions", "enabled_online_store", "INTEGER NOT NULL DEFAULT 1");
  }
  if (expansionColumns.length > 0 && !hasExpansionColumn("cloud_updated_at")) {
    safeAddColumn("expansions", "cloud_updated_at", "TEXT");
  }
  if (expansionColumns.length > 0 && !hasExpansionColumn("is_deleted_cloud")) {
    safeAddColumn("expansions", "is_deleted_cloud", "INTEGER NOT NULL DEFAULT 0");
  }

  const categoryColumns = db.prepare("PRAGMA table_info(categories)").all() as { name: string }[];
  const hasCategoryColumn = (name: string) =>
    categoryColumns.some((column) => column.name === name);
  if (categoryColumns.length > 0 && !hasCategoryColumn("cloud_id")) {
    safeAddColumn("categories", "cloud_id", "TEXT");
  }
  if (categoryColumns.length > 0 && !hasCategoryColumn("enabled_pos")) {
    safeAddColumn("categories", "enabled_pos", "INTEGER NOT NULL DEFAULT 1");
  }
  if (categoryColumns.length > 0 && !hasCategoryColumn("enabled_online_store")) {
    safeAddColumn("categories", "enabled_online_store", "INTEGER NOT NULL DEFAULT 1");
  }
  if (categoryColumns.length > 0 && !hasCategoryColumn("cloud_updated_at")) {
    safeAddColumn("categories", "cloud_updated_at", "TEXT");
  }
  if (categoryColumns.length > 0 && !hasCategoryColumn("is_deleted_cloud")) {
    safeAddColumn("categories", "is_deleted_cloud", "INTEGER NOT NULL DEFAULT 0");
  }

  const tournamentColumns = db
    .prepare("PRAGMA table_info(tournaments)")
    .all() as { name: string }[];
  const hasTournamentColumn = (name: string) =>
    tournamentColumns.some((column) => column.name === name);
  if (tournamentColumns.length > 0 && !hasTournamentColumn("winner_count")) {
    safeAddColumn("tournaments", "winner_count", "INTEGER DEFAULT 1");
  }
  if (tournamentColumns.length > 0 && !hasTournamentColumn("prize_distribution")) {
    safeAddColumn("tournaments", "prize_distribution", "TEXT");
  }
  if (tournamentColumns.length > 0 && !hasTournamentColumn("game_type_id")) {
    safeAddColumn("tournaments", "game_type_id", "TEXT");
  }
  if (tournamentColumns.length > 0 && !hasTournamentColumn("expansion_id")) {
    safeAddColumn("tournaments", "expansion_id", "TEXT");
  }

  // Backfill defaults for legacy rows.
  db.prepare(
    "UPDATE sales SET payment_method = COALESCE(payment_method, 'EFECTIVO'), payment_amount = COALESCE(payment_amount, total_amount)"
  ).run();

  // Backfill proof status to flexible mode: pending only when required and missing.
  db.prepare(
    `UPDATE sales
     SET proof_status = CASE
       WHEN payment_method IN ('TRANSFERENCIA','TARJETA') AND (proof_file_ref IS NULL OR proof_file_ref = '')
         THEN 'PENDING'
       ELSE 'ATTACHED'
     END
     WHERE proof_status IS NULL OR proof_status = ''`
  ).run();

  if (tournamentColumns.length > 0) {
    db.prepare("UPDATE tournaments SET winner_count = COALESCE(winner_count, 1)").run();
  }

  // Ensure cloud projection defaults for legacy local rows.
  db.prepare("UPDATE products SET cloud_id = COALESCE(cloud_id, id)").run();
  db.prepare("UPDATE products SET enabled_pos = COALESCE(enabled_pos, 1), enabled_online_store = COALESCE(enabled_online_store, 1), is_deleted_cloud = COALESCE(is_deleted_cloud, 0)").run();
  db.prepare("UPDATE products SET game_cloud_id = COALESCE(game_cloud_id, game_type_id), expansion_cloud_id = COALESCE(expansion_cloud_id, expansion_id)").run();
  db.prepare("UPDATE game_types SET cloud_id = COALESCE(cloud_id, id)").run();
  db.prepare("UPDATE game_types SET enabled_pos = COALESCE(enabled_pos, 1), enabled_online_store = COALESCE(enabled_online_store, 1), is_deleted_cloud = COALESCE(is_deleted_cloud, 0)").run();
  db.prepare("UPDATE expansions SET cloud_id = COALESCE(cloud_id, id)").run();
  db.prepare("UPDATE expansions SET enabled_pos = COALESCE(enabled_pos, 1), enabled_online_store = COALESCE(enabled_online_store, 1), is_deleted_cloud = COALESCE(is_deleted_cloud, 0)").run();
  db.prepare("UPDATE categories SET cloud_id = COALESCE(cloud_id, id)").run();
  db.prepare("UPDATE categories SET enabled_pos = COALESCE(enabled_pos, 1), enabled_online_store = COALESCE(enabled_online_store, 1), is_deleted_cloud = COALESCE(is_deleted_cloud, 0), active = COALESCE(active, 1)").run();
  db.prepare(
    `INSERT INTO categories (id, cloud_id, name, active, enabled_pos, enabled_online_store, cloud_updated_at, is_deleted_cloud, created_at, updated_at)
     SELECT
       'legacy:category:' || lower(replace(trim(category), ' ', '-')) AS id,
       'legacy:category:' || lower(replace(trim(category), ' ', '-')) AS cloud_id,
       trim(category) AS name,
       1,
       1,
       1,
       COALESCE(MAX(cloud_updated_at), MAX(updated_at)),
       0,
       MIN(created_at),
       MAX(updated_at)
     FROM products
     WHERE category IS NOT NULL
       AND trim(category) <> ''
     GROUP BY lower(replace(trim(category), ' ', '-'))
     ON CONFLICT(id) DO NOTHING`
  ).run();
  db.prepare(
    `UPDATE products
     SET category_cloud_id = COALESCE(
       category_cloud_id,
       CASE
         WHEN category IS NULL OR trim(category) = '' THEN NULL
         ELSE 'legacy:category:' || lower(replace(trim(category), ' ', '-'))
       END
     )`
  ).run();

  const prizeColumns = db
    .prepare("PRAGMA table_info(tournament_prizes)")
    .all() as { name: string }[];
  const hasPrizeColumn = (name: string) => prizeColumns.some((column) => column.name === name);
  if (prizeColumns.length > 0 && !hasPrizeColumn("position")) {
    safeAddColumn("tournament_prizes", "position", "INTEGER DEFAULT 1");
  }

  // Indexes are created after migrations to avoid missing-column errors.
  db.exec(indexesSql);

  const row = db.prepare("SELECT MAX(version) as version FROM schema_version").get() as
    | { version: number | null }
    | undefined;
  const currentVersion = row?.version ?? 0;
  if (currentVersion < latestSchemaVersion) {
    db.prepare("INSERT INTO schema_version (version, applied_at) VALUES (?, ?)")
      .run(latestSchemaVersion, new Date().toISOString());
  }

  return db;
}
