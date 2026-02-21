#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACT_BASE="$ROOT_DIR/artifacts/pos-sync/pos-sync-taxonomy-parity-v1"
RUNTIME_DIR="$ARTIFACT_BASE/runtime"
SCREEN_DIR="$RUNTIME_DIR/screens"
SQLITE_DB_PATH="${POS_SQLITE_DB_PATH:-$HOME/Library/Application Support/@pos/desktop/koyote.db}"
UTC_NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

APP_ENV_VALUE="${APP_ENV:-unknown}"
BRANCH_ID_VALUE="${BRANCH_ID:-unknown}"
TERMINAL_ID_VALUE="${TERMINAL_ID:-unknown}"

mkdir -p "$RUNTIME_DIR" "$SCREEN_DIR" "$ARTIFACT_BASE"

run_capture() {
  local label="$1"
  local cmd="$2"
  local out_file="$3"
  {
    echo ""
    echo "## ${label}"
    echo '```bash'
    echo "$cmd"
    echo '```'
    if eval "$cmd" > /tmp/pos_sync_runtime_cmd.out 2>&1; then
      echo "- Exit: 0"
    else
      local rc=$?
      echo "- Exit: ${rc}"
    fi
    echo '```text'
    cat /tmp/pos_sync_runtime_cmd.out
    echo '```'
  } >> "$out_file"
}

GATES_FILE="$RUNTIME_DIR/runtime-gates.md"
cat > "$GATES_FILE" <<MD
# Runtime Gate Summary

- Date/time (UTC): $UTC_NOW
- appEnv: $APP_ENV_VALUE
- branchId: $BRANCH_ID_VALUE
- terminalId: $TERMINAL_ID_VALUE

MD

run_capture "Build cloud-api" "cd '$ROOT_DIR' && npm run build -w apps/cloud-api" "$GATES_FILE"
run_capture "Build desktop" "cd '$ROOT_DIR' && npm run build -w apps/desktop" "$GATES_FILE"
run_capture "Build online-store" "cd '$ROOT_DIR' && npm run build -w apps/online-store" "$GATES_FILE"
run_capture "Build web" "cd '$ROOT_DIR' && npm run build -w apps/web" "$GATES_FILE"
run_capture "Implementation audit" "cd '$ROOT_DIR' && npm run gov:impl:audit -- 'pos-sync-taxonomy-parity-v1'" "$GATES_FILE"
run_capture "No console runtime logs" "cd '$ROOT_DIR' && rg -n 'console\\.(log|warn|error)' apps/desktop apps/cloud-api/src -S" "$GATES_FILE"
run_capture "No ProductCategory enum usage" "cd '$ROOT_DIR' && rg -n 'enum\\s+ProductCategory|ProductCategory\\b' apps/web/src apps/desktop -S" "$GATES_FILE"
run_capture "No hardcoded category SelectItem usage" "cd '$ROOT_DIR' && rg -n 'SelectItem\\s*\\{.*category|category.*SelectItem' apps/web/src -S" "$GATES_FILE"
run_capture "No legacy category constants" "cd '$ROOT_DIR' && rg -n 'categoryTCGSealed|categoryTCGSingle|categoryAccessory|categoryCommodity|categoryService' apps/web/src -S" "$GATES_FILE"

SQLITE_FILE="$RUNTIME_DIR/runtime-sqlite-dump.md"
if [[ -f "$SQLITE_DB_PATH" ]]; then
  {
    echo "# Runtime SQLite Dump"
    echo
    echo "- Date/time (UTC): $UTC_NOW"
    echo "- DB path: $SQLITE_DB_PATH"
    echo
    echo "## categories distribution"
    echo '```sql'
    echo "SELECT COUNT(*) AS categories_total, SUM(CASE WHEN enabled_pos=1 THEN 1 ELSE 0 END) AS categories_enabled_pos, SUM(CASE WHEN enabled_pos=0 THEN 1 ELSE 0 END) AS categories_disabled_pos, SUM(CASE WHEN is_deleted_cloud=1 THEN 1 ELSE 0 END) AS categories_deleted FROM categories;"
    echo '```'
    echo '```text'
    sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) AS categories_total, SUM(CASE WHEN enabled_pos=1 THEN 1 ELSE 0 END) AS categories_enabled_pos, SUM(CASE WHEN enabled_pos=0 THEN 1 ELSE 0 END) AS categories_disabled_pos, SUM(CASE WHEN is_deleted_cloud=1 THEN 1 ELSE 0 END) AS categories_deleted FROM categories;"
    echo '```'
    echo
    echo "## game_types and expansions counts"
    echo '```text'
    sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) AS games_total FROM game_types;"
    sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) AS expansions_total FROM expansions;"
    echo '```'
    echo
    echo "## products and taxonomy references"
    echo '```text'
    sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) AS products_total, SUM(CASE WHEN category_cloud_id IS NULL OR TRIM(category_cloud_id)='' THEN 1 ELSE 0 END) AS products_uncategorized, SUM(CASE WHEN enabled_pos=1 THEN 1 ELSE 0 END) AS products_enabled_pos FROM products;"
    sqlite3 "$SQLITE_DB_PATH" "SELECT p.cloud_id AS product_cloud_id, p.name AS product_name, p.category_cloud_id, COALESCE(c.name, 'Uncategorized') AS category_label, p.game_cloud_id, g.name AS game_name, p.expansion_cloud_id, e.name AS expansion_name FROM products p LEFT JOIN categories c ON c.cloud_id = p.category_cloud_id LEFT JOIN game_types g ON g.cloud_id = p.game_cloud_id LEFT JOIN expansions e ON e.cloud_id = p.expansion_cloud_id LIMIT 20;"
    echo '```'
  } > "$SQLITE_FILE"

  sqlite3 "$SQLITE_DB_PATH" ".dump categories game_types expansions products pos_sync_state catalog_meta" > "$ARTIFACT_BASE/sqlite-after-reconcile.dump.sql"
else
  cat > "$SQLITE_FILE" <<MD
# Runtime SQLite Dump

- Date/time (UTC): $UTC_NOW
- DB path: $SQLITE_DB_PATH
- Status: DB file not found.
MD
fi

for file in runtime-snapshot-ui.md runtime-delta-toggle.md runtime-reconcile-repair.md; do
  target="$RUNTIME_DIR/$file"
  if [[ ! -f "$target" ]]; then
    cat > "$target" <<MD
# ${file%.md}

- Date/time (UTC): $UTC_NOW
- appEnv: $APP_ENV_VALUE
- branchId: $BRANCH_ID_VALUE
- terminalId: $TERMINAL_ID_VALUE

## Steps executed
- Add manual runtime steps and observations here.

## Expected vs observed
- Pending manual validation.

## Screenshots
- Save screenshots under: $SCREEN_DIR
MD
  fi
done

if [[ ! -f "$SCREEN_DIR/README.md" ]]; then
  cat > "$SCREEN_DIR/README.md" <<MD
# Screenshots Placeholder

Store runtime evidence screenshots here:
- snapshot-success.png
- category-picker-dynamic.png
- uncategorized-product-label.png
- delta-toggle-before-after.png
- reconcile-result.png
MD
fi

echo "Runtime evidence artifacts generated under: $RUNTIME_DIR"
