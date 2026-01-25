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
