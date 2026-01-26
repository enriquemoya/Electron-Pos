import express from "express";
import { json } from "express";
import { Client } from "pg";
import dotenv from "dotenv";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const port = Number(process.env.PORT || 4000);
const databaseUrl = process.env.DATABASE_URL;
const sharedSecret = process.env.CLOUD_SHARED_SECRET;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

if (!sharedSecret) {
  throw new Error("CLOUD_SHARED_SECRET is required.");
}

const app = express();
app.use(json({ limit: "1mb" }));
const prisma = new PrismaClient();
const LOW_STOCK_THRESHOLD = 3;

function withClient<T>(fn: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: databaseUrl });
  return client
    .connect()
    .then(() => fn(client))
    .finally(() => client.end());
}

function requireSecret(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.header("x-cloud-secret");
  if (!header || header !== sharedSecret) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

app.use(requireSecret);

function isIsoString(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

app.post("/sync/events", async (req, res) => {
  const events = Array.isArray(req.body?.events) ? req.body.events : [];
  if (events.length === 0) {
    res.status(400).json({ error: "events required" });
    return;
  }

  const accepted: string[] = [];
  const duplicates: string[] = [];

  try {
    await withClient(async (client) => {
      for (const event of events) {
        if (!event?.eventId || !event.type || !event.source || !event.payload || !event.occurredAt) {
          throw new Error("invalid event payload");
        }
        if (!isIsoString(event.occurredAt)) {
          throw new Error("invalid occurredAt");
        }

        const eventId = String(event.eventId);
        const idempotencyKey = event.idempotencyKey ? String(event.idempotencyKey) : eventId;
        const existing = await client.query(
          "SELECT event_id FROM sync_events WHERE event_id = $1",
          [idempotencyKey]
        );
        if (existing.rowCount && existing.rowCount > 0) {
          duplicates.push(eventId);
          continue;
        }

        await client.query(
          `INSERT INTO sync_events (id, event_id, type, occurred_at, source, payload, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
          [crypto.randomUUID(), idempotencyKey, event.type, event.occurredAt, event.source, event.payload]
        );
        accepted.push(eventId);
      }
    });

    res.status(200).json({ accepted, duplicates });
  } catch (error) {
    res.status(400).json({ error: "invalid request" });
  }
});

app.get("/sync/pending", async (req, res) => {
  const posId = String(req.query.posId || "");
  const since = req.query.since ? String(req.query.since) : null;
  if (!posId) {
    res.status(400).json({ error: "posId required" });
    return;
  }

  try {
    const events = await withClient(async (client) => {
      const params: (string | null)[] = [posId];
      let where = "WHERE e.event_id NOT IN (SELECT event_id FROM pos_event_ack WHERE pos_id = $1)";
      if (since) {
        params.push(since);
        where += ` AND e.occurred_at >= $${params.length}`;
      }
      const result = await client.query(
        `SELECT e.event_id, e.type, e.occurred_at, e.source, e.payload
         FROM sync_events e
         ${where}
         ORDER BY e.occurred_at ASC, e.event_id ASC`,
        params
      );
      return result.rows;
    });

    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ error: "server error" });
  }
});

app.post("/sync/ack", async (req, res) => {
  const posId = req.body?.posId;
  const eventIds = Array.isArray(req.body?.eventIds) ? req.body.eventIds : [];
  if (!posId || eventIds.length === 0) {
    res.status(400).json({ error: "posId and eventIds required" });
    return;
  }

  try {
    await withClient(async (client) => {
      for (const eventId of eventIds) {
        await client.query(
          "INSERT INTO pos_event_ack (pos_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [posId, eventId]
        );
      }
    });
    res.status(200).json({ acknowledged: eventIds });
  } catch (error) {
    res.status(500).json({ error: "server error" });
  }
});

app.post("/orders", async (req, res) => {
  const orderId = req.body?.orderId;
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!orderId || items.length === 0) {
    res.status(400).json({ error: "orderId and items required" });
    return;
  }

  try {
    const result = await withClient(async (client) => {
      const existing = await client.query("SELECT order_id FROM orders WHERE order_id = $1", [orderId]);
      if (existing.rowCount && existing.rowCount > 0) {
        return { duplicate: true };
      }

      await client.query(
        "INSERT INTO orders (id, order_id, status, payload) VALUES ($1, $2, $3, $4)",
        [crypto.randomUUID(), orderId, "CREATED", { items }]
      );

      // event_id is the sole idempotency key; duplicate orders return 200 with existing order.
      const eventId = `order-${orderId}`;
      await client.query(
        `INSERT INTO sync_events (id, event_id, type, occurred_at, source, payload, status)
         VALUES ($1, $2, 'ONLINE_SALE', $3, $4, $5, 'PENDING')
         ON CONFLICT (event_id) DO NOTHING`,
        [crypto.randomUUID(), eventId, new Date().toISOString(), "online-store", { orderId, items }]
      );

      for (const item of items) {
        const quantity = Math.max(0, Number(item.quantity) || 0);
        if (!quantity) {
          continue;
        }
        await client.query(
          `INSERT INTO read_model_inventory
           (product_id, available, updated_at, last_synced_at, availability_state)
           VALUES ($1, 0, NOW(), NOW(), 'PENDING_SYNC')
           ON CONFLICT (product_id)
           DO UPDATE SET
             available = GREATEST(0, read_model_inventory.available - $2),
             updated_at = NOW(),
             last_synced_at = NOW(),
             availability_state = CASE
               WHEN (read_model_inventory.available - $2) <= 0 THEN 'SOLD_OUT'
               WHEN (read_model_inventory.available - $2) <= 2 THEN 'LOW_STOCK'
               ELSE 'AVAILABLE'
             END`,
          [String(item.productId), quantity]
        );
      }

      return { duplicate: false };
    });

    if (result.duplicate) {
      res.status(200).json({ status: "duplicate" });
    } else {
      res.status(201).json({ status: "created" });
    }
  } catch (error) {
    res.status(500).json({ error: "server error" });
  }
});

app.get("/read/products", async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 24);
  const id = req.query.id ? String(req.query.id) : null;

  if (!Number.isFinite(page) || !Number.isFinite(pageSize) || page <= 0 || pageSize <= 0) {
    res.status(400).json({ error: "invalid pagination" });
    return;
  }

  try {
    const result = await withClient(async (client) => {
      const params: (string | number)[] = [];
      let where = "";
      if (id) {
        params.push(id);
        where = `WHERE product_id = $${params.length}`;
      }

      const countResult = await client.query(
        `SELECT COUNT(*)::int AS total FROM read_model_inventory ${where}`,
        params
      );
      const total = countResult.rows[0]?.total ?? 0;

      const offset = (page - 1) * pageSize;
      params.push(pageSize, offset);

      const rows = await client.query(
        `SELECT
           product_id,
           available,
           updated_at,
           display_name,
           short_description,
           image_url,
           category,
           availability_state,
           last_synced_at
         FROM read_model_inventory
         ${where}
         ORDER BY updated_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      const items = rows.rows.map((row) => {
        const derivedState = (() => {
          if (!row.last_synced_at) {
            return "PENDING_SYNC";
          }
          if (row.available <= 0) {
            return "SOLD_OUT";
          }
          if (row.available <= 2) {
            return "LOW_STOCK";
          }
          return "AVAILABLE";
        })();

        return {
          id: row.product_id,
          name: row.display_name ?? null,
          category: row.category ?? null,
          price: null,
          gameTypeId: null,
          expansionId: null,
          imageUrl: row.image_url ?? null,
          available: row.available,
          state: row.availability_state ?? derivedState,
          updatedAt: row.updated_at,
          shortDescription: row.short_description ?? null,
          lastSyncedAt: row.last_synced_at ?? null
        };
      });

      return { items, total };
    });

    res.status(200).json({
      items: result.items,
      page,
      pageSize,
      total: result.total,
      hasMore: page * pageSize < result.total
    });
  } catch (error) {
    res.status(500).json({ error: "server error" });
  }
});

app.get("/api/cloud/catalog/featured", async (_req, res) => {
  try {
    const [ordered, fallback, total] = await prisma.$transaction([
      prisma.readModelInventory.findMany({
        where: { isFeatured: true, featuredOrder: { not: null } },
        orderBy: [{ featuredOrder: "asc" }, { updatedAt: "desc" }],
        take: 12,
        select: {
          productId: true,
          slug: true,
          displayName: true,
          imageUrl: true,
          category: true,
          available: true,
          featuredOrder: true,
          price: true,
          game: true
        }
      }),
      prisma.readModelInventory.findMany({
        where: { isFeatured: true, featuredOrder: null },
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: {
          productId: true,
          slug: true,
          displayName: true,
          imageUrl: true,
          category: true,
          available: true,
          featuredOrder: true,
          price: true,
          game: true
        }
      }),
      prisma.readModelInventory.count({ where: { isFeatured: true } })
    ]);

    const items = [...ordered, ...fallback].slice(0, 12).map((row) => {
      const availability =
        row.available <= 0
          ? "out_of_stock"
          : row.available <= LOW_STOCK_THRESHOLD
            ? "low_stock"
            : "in_stock";

      return {
        id: row.productId,
        slug: row.slug ?? null,
        name: row.displayName ?? null,
        game: row.game ?? "other",
        imageUrl: row.imageUrl ?? null,
        price: row.price ?? null,
        currency: "MXN",
        availability,
        featuredOrder: row.featuredOrder ?? null
      };
    });

    res.status(200).json({ items, meta: { total } });
  } catch (error) {
    res.status(500).json({ error: "server error" });
  }
});

app.listen(port, () => {
  console.log(`cloud-api: listening on ${port}`);
});
