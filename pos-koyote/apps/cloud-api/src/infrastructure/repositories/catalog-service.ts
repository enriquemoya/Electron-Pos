import { prisma } from "../db/prisma";

const LOW_STOCK_THRESHOLD = 3;

export async function getCatalogFilters() {
  const [categoryRows, gameRows] = await prisma.$transaction([
    prisma.readModelInventory.findMany({
      distinct: ["category"],
      select: { category: true },
      where: { category: { not: null } },
      orderBy: { category: "asc" }
    }),
    prisma.readModelInventory.findMany({
      distinct: ["game"],
      select: { game: true },
      where: { game: { not: null } },
      orderBy: { game: "asc" }
    })
  ]);

  const categories = categoryRows
    .map((row) => row.category)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => ({ id: value, label: value }));

  const games = gameRows
    .map((row) => row.game)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => ({ id: value, label: value }));

  return { categories, games };
}

export async function getFeaturedCatalog() {
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

  return { items, meta: { total } };
}
