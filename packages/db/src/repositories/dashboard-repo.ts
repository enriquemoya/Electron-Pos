import type { DbHandle } from "../db";

type StockAlertRow = {
  id: string;
  product_id: string;
  product_name: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK";
  current_stock: number;
  threshold: number;
  created_at: string;
};

type PendingProofRow = {
  id: string;
  total_amount: number;
  created_at: string;
};

type TournamentAlertRow = {
  id: string;
  name: string;
  date: string;
  updated_at: string;
};

type RecentSaleRow = {
  id: string;
  total_amount: number;
  created_at: string;
};

type RecentCustomerRow = {
  id: string;
  first_names: string;
  last_name_paternal: string;
  last_name_maternal: string;
  created_at: string;
};

type RecentTournamentRow = {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
};

export function createDashboardRepository(db: DbHandle) {
  return {
    getStockAlerts(type: "LOW_STOCK" | "OUT_OF_STOCK", limit: number) {
      const rows = db
        .prepare(
          `
          SELECT ia.id, ia.product_id, p.name as product_name, ia.type, ia.current_stock, ia.threshold, ia.created_at
          FROM inventory_alerts ia
          INNER JOIN products p ON p.id = ia.product_id
          WHERE ia.status = 'ACTIVE' AND ia.type = ?
          ORDER BY ia.created_at DESC
          LIMIT ?
          `
        )
        .all(type, limit) as StockAlertRow[];

      return rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        type: row.type,
        currentStock: row.current_stock,
        threshold: row.threshold,
        createdAt: row.created_at
      }));
    },
    getPendingProofSales(limit: number) {
      const rows = db
        .prepare(
          `
          SELECT id, total_amount, created_at
          FROM sales
          WHERE proof_status = 'PENDING'
          ORDER BY created_at DESC
          LIMIT ?
          `
        )
        .all(limit) as PendingProofRow[];

      return rows.map((row) => ({
        id: row.id,
        totalAmount: row.total_amount,
        createdAt: row.created_at
      }));
    },
    getTournamentsWithoutWinners(limit: number) {
      const rows = db
        .prepare(
          `
          SELECT t.id, t.name, t.date, t.updated_at
          FROM tournaments t
          LEFT JOIN tournament_prizes p ON p.tournament_id = t.id
          WHERE t.status = 'CLOSED' AND p.id IS NULL
          ORDER BY t.updated_at DESC
          LIMIT ?
          `
        )
        .all(limit) as TournamentAlertRow[];

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        updatedAt: row.updated_at
      }));
    },
    getRecentSales(limit: number) {
      const rows = db
        .prepare(
          `
          SELECT id, total_amount, created_at
          FROM sales
          ORDER BY created_at DESC
          LIMIT ?
          `
        )
        .all(limit) as RecentSaleRow[];

      return rows.map((row) => ({
        id: row.id,
        totalAmount: row.total_amount,
        createdAt: row.created_at
      }));
    },
    getRecentCustomers(limit: number) {
      const rows = db
        .prepare(
          `
          SELECT id, first_names, last_name_paternal, last_name_maternal, created_at
          FROM customers
          ORDER BY created_at DESC
          LIMIT ?
          `
        )
        .all(limit) as RecentCustomerRow[];

      return rows.map((row) => ({
        id: row.id,
        firstNames: row.first_names,
        lastNamePaternal: row.last_name_paternal,
        lastNameMaternal: row.last_name_maternal,
        createdAt: row.created_at
      }));
    },
    getRecentTournaments(limit: number) {
      const rows = db
        .prepare(
          `
          SELECT id, name, updated_at, created_at
          FROM tournaments
          ORDER BY updated_at DESC
          LIMIT ?
          `
        )
        .all(limit) as RecentTournamentRow[];

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        updatedAt: row.updated_at,
        createdAt: row.created_at
      }));
    }
  };
}
