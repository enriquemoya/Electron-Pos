import type { DbHandle } from "../db";
import type { Category } from "@pos/core";

type CategoryRow = {
  id: string;
  cloud_id: string;
  name: string;
  active: number;
  enabled_pos: number;
  enabled_online_store: number;
  is_deleted_cloud: number;
  cloud_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    cloudId: row.cloud_id,
    name: row.name,
    active: row.active === 1,
    enabledPOS: row.enabled_pos === 1,
    enabledOnlineStore: row.enabled_online_store === 1,
    isDeletedCloud: row.is_deleted_cloud === 1,
    cloudUpdatedAt: row.cloud_updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createCategoryRepository(db: DbHandle) {
  return {
    list(activeOnly = true): Category[] {
      const filters = ["enabled_pos = 1", "is_deleted_cloud = 0"];
      if (activeOnly) {
        filters.push("active = 1");
      }
      const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
      const rows = db
        .prepare(`SELECT * FROM categories ${where} ORDER BY name ASC`)
        .all() as CategoryRow[];
      return rows.map(mapRow);
    }
  };
}
