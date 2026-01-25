import type { DbHandle } from "../db";
import type { Sale, SaleItem } from "@pos/core";

type SaleRow = {
  id: string;
  shift_id: string;
  customer_id: string | null;
  tournament_id: string | null;
  payment_method: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CREDITO_TIENDA";
  payment_amount: number;
  payment_reference: string | null;
  proof_file_ref: string | null;
  proof_status: "ATTACHED" | "PENDING";
  total_amount: number;
  currency: "MXN";
  created_at: string;
};

type SaleItemRow = {
  id: number;
  sale_id: string;
  product_id: string;
  name: string;
  unit_price_amount: number;
  quantity: number;
  line_total_amount: number;
};

function mapSaleRow(row: SaleRow, items: SaleItem[]): Sale {
  return {
    id: row.id,
    shiftId: row.shift_id,
    customerId: row.customer_id,
    tournamentId: row.tournament_id,
    paymentMethod: row.payment_method,
    paymentAmount: { amount: row.payment_amount, currency: "MXN" },
    paymentReference: row.payment_reference,
    proofFileRef: row.proof_file_ref,
    proofStatus: row.proof_status,
    createdAt: row.created_at,
    items,
    total: {
      amount: row.total_amount,
      currency: row.currency
    }
  };
}

function mapSaleItemRow(row: SaleItemRow): SaleItem {
  return {
    id: String(row.id),
    productId: row.product_id,
    name: row.name,
    quantity: row.quantity,
    unitPrice: { amount: row.unit_price_amount, currency: "MXN" },
    lineTotal: { amount: row.line_total_amount, currency: "MXN" }
  };
}

export function createSaleRepository(db: DbHandle) {
  const insertSale = db.prepare(`
    INSERT INTO sales (
      id,
      shift_id,
      customer_id,
      tournament_id,
      payment_method,
      payment_amount,
      payment_reference,
      proof_file_ref,
      proof_status,
      total_amount,
      currency,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO sale_items (
      sale_id,
      product_id,
      name,
      unit_price_amount,
      quantity,
      line_total_amount
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const deleteItems = db.prepare("DELETE FROM sale_items WHERE sale_id = ?");
  const countByTournamentStmt = db.prepare(
    "SELECT COUNT(*) as count FROM sales WHERE tournament_id = ?"
  );

  return {
    getById(id: string): Sale | null {
      const saleRow = db.prepare("SELECT * FROM sales WHERE id = ?").get(id) as
        | SaleRow
        | undefined;
      if (!saleRow) {
        return null;
      }
      const itemRows = db
        .prepare("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC")
        .all(id) as SaleItemRow[];
      const items = itemRows.map(mapSaleItemRow);
      return mapSaleRow(saleRow, items);
    },
    list(): Sale[] {
      const saleRows = db.prepare("SELECT * FROM sales ORDER BY created_at DESC").all() as SaleRow[];
      return saleRows.map((row) => {
        const itemRows = db
          .prepare("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC")
          .all(row.id) as SaleItemRow[];
        return mapSaleRow(row, itemRows.map(mapSaleItemRow));
      });
    },
    listByShiftId(shiftId: string): Sale[] {
      const saleRows = db
        .prepare("SELECT * FROM sales WHERE shift_id = ? ORDER BY created_at DESC")
        .all(shiftId) as SaleRow[];
      return saleRows.map((row) => {
        const itemRows = db
          .prepare("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC")
          .all(row.id) as SaleItemRow[];
        return mapSaleRow(row, itemRows.map(mapSaleItemRow));
      });
    },
    countByTournamentId(tournamentId: string): number {
      const row = countByTournamentStmt.get(tournamentId) as { count: number } | undefined;
      return row?.count ?? 0;
    },
    listFiltered(params: {
      from?: string;
      to?: string;
      paymentMethod?: SaleRow["payment_method"];
      proofStatus?: SaleRow["proof_status"];
      gameTypeId?: string;
      expansionId?: string;
    }): Sale[] {
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (params.from) {
        conditions.push("s.created_at >= ?");
        values.push(params.from);
      }
      if (params.to) {
        conditions.push("s.created_at <= ?");
        values.push(params.to);
      }
      if (params.paymentMethod) {
        conditions.push("s.payment_method = ?");
        values.push(params.paymentMethod);
      }
      if (params.proofStatus) {
        conditions.push("s.proof_status = ?");
        values.push(params.proofStatus);
      }
      if (params.gameTypeId) {
        conditions.push("p.game_type_id = ?");
        values.push(params.gameTypeId);
      }
      if (params.expansionId) {
        conditions.push("p.expansion_id = ?");
        values.push(params.expansionId);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const saleRows = db
        .prepare(
          `
          SELECT DISTINCT s.*
          FROM sales s
          LEFT JOIN sale_items si ON si.sale_id = s.id
          LEFT JOIN products p ON p.id = si.product_id
          ${whereClause}
          ORDER BY s.created_at DESC
          `
        )
        .all(...values) as SaleRow[];

      return saleRows.map((row) => {
        const itemRows = db
          .prepare("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC")
          .all(row.id) as SaleItemRow[];
        return mapSaleRow(row, itemRows.map(mapSaleItemRow));
      });
    },
    listPaged(params: {
      from?: string;
      to?: string;
      paymentMethod?: SaleRow["payment_method"];
      proofStatus?: SaleRow["proof_status"];
      gameTypeId?: string;
      expansionId?: string;
      customerId?: string;
      page?: number;
      pageSize?: number;
    }): { items: Sale[]; total: number; page: number; pageSize: number } {
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (params.from) {
        conditions.push("s.created_at >= ?");
        values.push(params.from);
      }
      if (params.to) {
        conditions.push("s.created_at <= ?");
        values.push(params.to);
      }
      if (params.paymentMethod) {
        conditions.push("s.payment_method = ?");
        values.push(params.paymentMethod);
      }
      if (params.proofStatus) {
        conditions.push("s.proof_status = ?");
        values.push(params.proofStatus);
      }
      if (params.customerId) {
        conditions.push("s.customer_id = ?");
        values.push(params.customerId);
      }
      if (params.gameTypeId) {
        conditions.push("p.game_type_id = ?");
        values.push(params.gameTypeId);
      }
      if (params.expansionId) {
        conditions.push("p.expansion_id = ?");
        values.push(params.expansionId);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));
      const page = Math.max(1, params.page ?? 1);
      const offset = (page - 1) * pageSize;

      const totalRow = db
        .prepare(
          `
          SELECT COUNT(DISTINCT s.id) as total
          FROM sales s
          LEFT JOIN sale_items si ON si.sale_id = s.id
          LEFT JOIN products p ON p.id = si.product_id
          ${whereClause}
          `
        )
        .get(...values) as { total: number };

      const saleRows = db
        .prepare(
          `
          SELECT DISTINCT s.*
          FROM sales s
          LEFT JOIN sale_items si ON si.sale_id = s.id
          LEFT JOIN products p ON p.id = si.product_id
          ${whereClause}
          ORDER BY s.created_at DESC
          LIMIT ? OFFSET ?
          `
        )
        .all(...values, pageSize, offset) as SaleRow[];

      const items = saleRows.map((row) => {
        const itemRows = db
          .prepare("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC")
          .all(row.id) as SaleItemRow[];
        return mapSaleRow(row, itemRows.map(mapSaleItemRow));
      });

      return { items, total: totalRow?.total ?? 0, page, pageSize };
    },
    getSummaryByDate(from: string, to: string): {
      salesCount: number;
      totalAmount: number;
      byMethod: Record<SaleRow["payment_method"], number>;
      pendingProofs: number;
    } {
      const summary = db
        .prepare(
          "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sales.created_at >= ? AND sales.created_at <= ?"
        )
        .get(from, to) as { count: number; total: number };
      const methodRows = db
        .prepare(
          "SELECT payment_method, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sales.created_at >= ? AND sales.created_at <= ? GROUP BY payment_method"
        )
        .all(from, to) as { payment_method: SaleRow["payment_method"]; total: number }[];
      const pendingRow = db
        .prepare(
          "SELECT COUNT(*) as count FROM sales WHERE sales.created_at >= ? AND sales.created_at <= ? AND proof_status = 'PENDING'"
        )
        .get(from, to) as { count: number };

      const byMethod: Record<SaleRow["payment_method"], number> = {
        EFECTIVO: 0,
        TRANSFERENCIA: 0,
        TARJETA: 0,
        CREDITO_TIENDA: 0
      };
      methodRows.forEach((row) => {
        byMethod[row.payment_method] = row.total;
      });

      return {
        salesCount: summary.count,
        totalAmount: summary.total,
        byMethod,
        pendingProofs: pendingRow?.count ?? 0
      };
    },
    listPendingProof(): Sale[] {
      const saleRows = db
        .prepare("SELECT * FROM sales WHERE proof_status = 'PENDING' ORDER BY created_at DESC")
        .all() as SaleRow[];
      return saleRows.map((row) => {
        const itemRows = db
          .prepare("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC")
          .all(row.id) as SaleItemRow[];
        return mapSaleRow(row, itemRows.map(mapSaleItemRow));
      });
    },
    create(sale: Sale) {
      const transaction = db.transaction(() => {
        insertSale.run(
          sale.id,
          sale.shiftId,
          sale.customerId ?? null,
          sale.tournamentId ?? null,
          sale.paymentMethod,
          sale.paymentAmount.amount,
          sale.paymentReference ?? null,
          sale.proofFileRef ?? null,
          sale.proofStatus,
          sale.total.amount,
          sale.total.currency,
          sale.createdAt
        );
        sale.items.forEach((item) => {
          insertItem.run(
            sale.id,
            item.productId,
            item.name,
            item.unitPrice.amount,
            item.quantity,
            item.lineTotal.amount
          );
        });
      });
      transaction();
    },
    update(sale: Sale) {
      const transaction = db.transaction(() => {
        db.prepare(
          "UPDATE sales SET shift_id = ?, customer_id = ?, tournament_id = ?, payment_method = ?, payment_amount = ?, payment_reference = ?, proof_file_ref = ?, proof_status = ?, total_amount = ?, currency = ? WHERE id = ?"
        ).run(
          sale.shiftId,
          sale.customerId ?? null,
          sale.tournamentId ?? null,
          sale.paymentMethod,
          sale.paymentAmount.amount,
          sale.paymentReference ?? null,
          sale.proofFileRef ?? null,
          sale.proofStatus,
          sale.total.amount,
          sale.total.currency,
          sale.id
        );
        deleteItems.run(sale.id);
        sale.items.forEach((item) => {
          insertItem.run(
            sale.id,
            item.productId,
            item.name,
            item.unitPrice.amount,
            item.quantity,
            item.lineTotal.amount
          );
        });
      });
      transaction();
    },
    updateProof(saleId: string, proofFileRef: string, proofStatus: "ATTACHED" | "PENDING") {
      db.prepare("UPDATE sales SET proof_file_ref = ?, proof_status = ? WHERE id = ?")
        .run(proofFileRef, proofStatus, saleId);
    },
    delete(id: string) {
      const transaction = db.transaction(() => {
        deleteItems.run(id);
        db.prepare("DELETE FROM sales WHERE id = ?").run(id);
      });
      transaction();
    }
  };
}
