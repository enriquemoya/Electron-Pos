import type { DbHandle } from "../db";
import type { Customer } from "@pos/core";
import { normalizeEmail, normalizePhone, validateCustomerInput } from "@pos/core";

type CustomerRow = {
  id: string;
  first_names: string;
  last_name_paternal: string;
  last_name_maternal: string;
  birth_date: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    firstNames: row.first_names,
    lastNamePaternal: row.last_name_paternal,
    lastNameMaternal: row.last_name_maternal,
    birthDate: row.birth_date,
    address: row.address,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createCustomerRepository(db: DbHandle) {
  const insertStmt = db.prepare(`
    INSERT INTO customers (
      id,
      first_names,
      last_name_paternal,
      last_name_maternal,
      birth_date,
      address,
      phone,
      email,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE customers SET
      first_names = ?,
      last_name_paternal = ?,
      last_name_maternal = ?,
      birth_date = ?,
      address = ?,
      phone = ?,
      email = ?,
      updated_at = ?
    WHERE id = ?
  `);

  const getById = (id: string): Customer | null => {
      const row = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as
        | CustomerRow
        | undefined;
      return row ? mapRow(row) : null;
    };

  const findByPhone = (phone: string): Customer | null => {
      const normalized = normalizePhone(phone);
      if (!normalized) {
        return null;
      }
      const row = db.prepare("SELECT * FROM customers WHERE phone = ?").get(normalized) as
        | CustomerRow
        | undefined;
      return row ? mapRow(row) : null;
    };

  const findByEmail = (email: string): Customer | null => {
      const normalized = normalizeEmail(email);
      if (!normalized) {
        return null;
      }
      const row = db.prepare("SELECT * FROM customers WHERE email = ?").get(normalized) as
        | CustomerRow
        | undefined;
      return row ? mapRow(row) : null;
    };

  const search = (query: string): Customer[] => {
      const trimmed = query.trim();
      if (!trimmed) {
        const rows = db
          .prepare("SELECT * FROM customers ORDER BY last_name_paternal, first_names")
          .all() as CustomerRow[];
        return rows.map(mapRow);
      }
      const normalizedPhone = normalizePhone(trimmed);
      const normalizedEmail = normalizeEmail(trimmed);
      const like = `%${trimmed.toLowerCase()}%`;
      const phoneLike = normalizedPhone ? `%${normalizedPhone}%` : null;
      const rows = db
        .prepare(
          `
          SELECT * FROM customers
          WHERE (phone LIKE ?)
            OR email = ?
            OR LOWER(first_names) LIKE ?
            OR LOWER(last_name_paternal) LIKE ?
            OR LOWER(last_name_maternal) LIKE ?
          ORDER BY last_name_paternal, first_names
          `
        )
        .all(phoneLike ?? "", normalizedEmail, like, like, like) as CustomerRow[];
      return rows.map(mapRow);
    };

  const listPaged = (filters: {
      name?: string;
      phone?: string;
      email?: string;
      page?: number;
      pageSize?: number;
    }): { items: Customer[]; total: number; page: number; pageSize: number } => {
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (filters.name) {
        const like = `%${filters.name.toLowerCase()}%`;
        conditions.push(
          "(LOWER(first_names) LIKE ? OR LOWER(last_name_paternal) LIKE ? OR LOWER(last_name_maternal) LIKE ?)"
        );
        values.push(like, like, like);
      }
      if (filters.phone) {
        const normalized = normalizePhone(filters.phone);
        if (normalized) {
          conditions.push("phone LIKE ?");
          values.push(`%${normalized}%`);
        }
      }
      if (filters.email) {
        const normalized = normalizeEmail(filters.email);
        if (normalized) {
          conditions.push("email LIKE ?");
          values.push(`%${normalized}%`);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 20));
      const page = Math.max(1, filters.page ?? 1);
      const offset = (page - 1) * pageSize;

      const totalRow = db
        .prepare(`SELECT COUNT(*) as total FROM customers ${whereClause}`)
        .get(...values) as { total: number };

      const rows = db
        .prepare(
          `
          SELECT * FROM customers
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
          `
        )
        .all(...values, pageSize, offset) as CustomerRow[];

      return {
        items: rows.map(mapRow),
        total: totalRow?.total ?? 0,
        page,
        pageSize
      };
    };

  const create = (customer: Customer): Customer => {
      const validation = validateCustomerInput(customer.phone, customer.email);
      if (!validation.valid) {
        throw new Error("CONTACT_REQUIRED");
      }

      const normalizedPhone = normalizePhone(customer.phone);
      const normalizedEmail = normalizeEmail(customer.email);

      if (normalizedPhone && findByPhone(normalizedPhone)) {
        throw new Error("PHONE_DUPLICATE");
      }
      if (normalizedEmail && findByEmail(normalizedEmail)) {
        throw new Error("EMAIL_DUPLICATE");
      }

      insertStmt.run(
        customer.id,
        customer.firstNames,
        customer.lastNamePaternal,
        customer.lastNameMaternal,
        customer.birthDate ?? null,
        customer.address ?? null,
        normalizedPhone,
        normalizedEmail,
        customer.createdAt,
        customer.updatedAt
      );

      return {
        ...customer,
        phone: normalizedPhone,
        email: normalizedEmail
      };
    };

  const update = (customer: Customer): Customer => {
      const validation = validateCustomerInput(customer.phone, customer.email);
      if (!validation.valid) {
        throw new Error("CONTACT_REQUIRED");
      }

      const normalizedPhone = normalizePhone(customer.phone);
      const normalizedEmail = normalizeEmail(customer.email);
      const existingByPhone = normalizedPhone ? findByPhone(normalizedPhone) : null;
      if (existingByPhone && existingByPhone.id !== customer.id) {
        throw new Error("PHONE_DUPLICATE");
      }
      const existingByEmail = normalizedEmail ? findByEmail(normalizedEmail) : null;
      if (existingByEmail && existingByEmail.id !== customer.id) {
        throw new Error("EMAIL_DUPLICATE");
      }

      updateStmt.run(
        customer.firstNames,
        customer.lastNamePaternal,
        customer.lastNameMaternal,
        customer.birthDate ?? null,
        customer.address ?? null,
        normalizedPhone,
        normalizedEmail,
        customer.updatedAt,
        customer.id
      );

      return {
        ...customer,
        phone: normalizedPhone,
        email: normalizedEmail
      };
    };

  return {
    getById,
    findByPhone,
    findByEmail,
    search,
    listPaged,
    create,
    update
  };
}
