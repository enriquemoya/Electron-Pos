import { ApiErrors } from "../errors/api-error";

const TAXONOMY_TYPES = ["CATEGORY", "GAME", "EXPANSION", "OTHER"] as const;
const GAME_OPTIONS = ["pokemon", "one-piece", "yugioh", "other"] as const;

type TaxonomyType = typeof TAXONOMY_TYPES[number];
type GameOption = typeof GAME_OPTIONS[number];

export function validateTaxonomyCreate(payload: unknown) {
  const type = String((payload as { type?: string })?.type ?? "").toUpperCase();
  const name = String((payload as { name?: string })?.name ?? "").trim();
  const slug = String((payload as { slug?: string })?.slug ?? "").trim();
  const description = String((payload as { description?: string })?.description ?? "").trim();

  if (!TAXONOMY_TYPES.includes(type as TaxonomyType)) {
    throw ApiErrors.taxonomyInvalid;
  }
  if (!name || !slug) {
    throw ApiErrors.taxonomyInvalid;
  }

  return {
    type: type as TaxonomyType,
    name,
    slug,
    description: description || null
  };
}

export function validateTaxonomyUpdate(payload: unknown) {
  const name = String((payload as { name?: string })?.name ?? "").trim();
  const slug = String((payload as { slug?: string })?.slug ?? "").trim();
  const description = String((payload as { description?: string })?.description ?? "").trim();

  if (!name && !slug && !description) {
    throw ApiErrors.taxonomyInvalid;
  }

  return {
    name: name || undefined,
    slug: slug || undefined,
    description: description ? description : undefined
  };
}

export function validateProductCreate(payload: unknown) {
  const data = payload as Record<string, unknown>;
  const name = String(data.name ?? "").trim();
  const slug = String(data.slug ?? "").trim();
  const game = String(data.game ?? "").trim().toLowerCase();
  const categoryId = String(data.categoryId ?? "").trim();
  const expansionId = String(data.expansionId ?? "").trim();
  const imageUrl = String(data.imageUrl ?? "").trim();
  const reason = String(data.reason ?? "").trim();
  const description = String(data.description ?? "").trim();
  const rarity = String(data.rarity ?? "").trim();
  const tagsRaw = data.tags;

  const priceValue = data.price;
  const price = typeof priceValue === "number" ? priceValue : Number(priceValue);
  const isActive = typeof data.isActive === "boolean" ? data.isActive : true;
  const isFeatured = typeof data.isFeatured === "boolean" ? data.isFeatured : false;
  const featuredOrderValue = data.featuredOrder;
  const featuredOrderNumber =
    typeof featuredOrderValue === "number"
      ? featuredOrderValue
      : featuredOrderValue
        ? Number(featuredOrderValue)
        : null;

  if (!name || !slug || !categoryId || !imageUrl || !reason) {
    throw ApiErrors.productInvalid;
  }

  if (!GAME_OPTIONS.includes(game as GameOption)) {
    throw ApiErrors.productInvalid;
  }

  if (!Number.isFinite(price)) {
    throw ApiErrors.productInvalid;
  }

  let tags: string[] | null = null;
  if (Array.isArray(tagsRaw)) {
    tags = tagsRaw.map((value) => String(value).trim()).filter(Boolean);
  }

  return {
    name,
    slug,
    game: game as GameOption,
    categoryId,
    expansionId: expansionId || null,
    price,
    imageUrl,
    reason,
    description: description || null,
    rarity: rarity || null,
    tags,
    isActive,
    isFeatured,
    featuredOrder: Number.isFinite(featuredOrderNumber ?? NaN) ? featuredOrderNumber : null
  };
}

export function validateProductUpdate(payload: unknown) {
  const data = payload as Record<string, unknown>;
  const result: {
    displayName?: string;
    slug?: string | null;
    category?: string | null;
    categoryId?: string | null;
    expansionId?: string | null;
    game?: string | null;
    price?: number | null;
    imageUrl?: string | null;
    shortDescription?: string | null;
    description?: string | null;
    rarity?: string | null;
    tags?: string[] | null;
    availabilityState?: string | null;
    isFeatured?: boolean;
    featuredOrder?: number | null;
    isActive?: boolean;
  } = {};

  const reason = String(data.reason ?? "").trim();
  if (!reason) {
    throw ApiErrors.productInvalid;
  }

  if (typeof data.displayName === "string") {
    result.displayName = data.displayName.trim() || undefined;
  }
  if (data.slug === null || typeof data.slug === "string") {
    result.slug = data.slug === null ? null : data.slug.trim() || null;
  }
  if (data.category === null || typeof data.category === "string") {
    result.category = data.category === null ? null : data.category.trim() || null;
  }
  if (data.categoryId === null || typeof data.categoryId === "string") {
    result.categoryId = data.categoryId === null ? null : data.categoryId.trim() || null;
  }
  if (data.expansionId === null || typeof data.expansionId === "string") {
    result.expansionId = data.expansionId === null ? null : data.expansionId.trim() || null;
  }
  if (data.game === null || typeof data.game === "string") {
    result.game = data.game === null ? null : data.game.trim() || null;
  }
  if (data.imageUrl === null || typeof data.imageUrl === "string") {
    result.imageUrl = data.imageUrl === null ? null : data.imageUrl.trim() || null;
  }
  if (data.shortDescription === null || typeof data.shortDescription === "string") {
    result.shortDescription =
      data.shortDescription === null ? null : data.shortDescription.trim() || null;
  }
  if (data.description === null || typeof data.description === "string") {
    result.description = data.description === null ? null : data.description.trim() || null;
  }
  if (data.rarity === null || typeof data.rarity === "string") {
    result.rarity = data.rarity === null ? null : data.rarity.trim() || null;
  }
  if (data.tags === null || Array.isArray(data.tags)) {
    result.tags = data.tags === null ? null : data.tags.map((value) => String(value).trim());
  }
  if (data.availabilityState === null || typeof data.availabilityState === "string") {
    result.availabilityState =
      data.availabilityState === null ? null : data.availabilityState.trim() || null;
  }
  if (typeof data.isFeatured === "boolean") {
    result.isFeatured = data.isFeatured;
  }
  if (typeof data.isActive === "boolean") {
    result.isActive = data.isActive;
  }
  if (data.featuredOrder === null || typeof data.featuredOrder === "number") {
    result.featuredOrder = data.featuredOrder === null ? null : data.featuredOrder;
  }
  if (data.price === null || typeof data.price === "number") {
    result.price = data.price === null ? null : data.price;
  }

  if (Object.keys(result).length === 0) {
    throw ApiErrors.productInvalid;
  }

  return { data: result, reason };
}
