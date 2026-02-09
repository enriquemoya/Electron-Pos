import "server-only";

import {
  fetchTaxonomyCategoriesByGame,
  fetchTaxonomyCategories,
  fetchTaxonomyExpansions,
  fetchTaxonomyGames,
  type TaxonomyItem
} from "@/lib/api";

export type TaxonomyBundle = {
  games: TaxonomyItem[];
  categories: TaxonomyItem[];
  expansions: TaxonomyItem[];
};

export type CatalogRouteSelection = {
  mode: "all" | "misc" | "game" | "category";
  game: TaxonomyItem | null;
  category: TaxonomyItem | null;
  expansion: TaxonomyItem | null;
};

export async function fetchTaxonomyBundle(): Promise<TaxonomyBundle> {
  const [games, categories, expansions] = await Promise.allSettled([
    fetchTaxonomyGames(),
    fetchTaxonomyCategories(),
    fetchTaxonomyExpansions()
  ]);

  return {
    games: games.status === "fulfilled" ? games.value : [],
    categories: categories.status === "fulfilled" ? categories.value : [],
    expansions: expansions.status === "fulfilled" ? expansions.value : []
  };
}

export async function fetchCategoriesByGame(games: TaxonomyItem[]) {
  const entries = await Promise.all(
    games.map(async (game) => {
      const categories = await fetchTaxonomyCategoriesByGame(game.id);
      return [game.id, categories] as const;
    })
  );
  return new Map(entries);
}

export function taxonomyLabel(item: TaxonomyItem, locale: string) {
  if (locale === "es" && item.labels.es) {
    return item.labels.es;
  }
  if (locale === "en" && item.labels.en) {
    return item.labels.en;
  }
  return item.name;
}

export function resolveCatalogRoute(
  segments: string[] | undefined,
  bundle: TaxonomyBundle
): CatalogRouteSelection | null {
  const parts = (segments ?? []).filter(Boolean);
  if (parts.length === 0) {
    return { mode: "all", game: null, category: null, expansion: null };
  }
  if (parts.length > 3) {
    return null;
  }

  const [first, second, third] = parts;
  const bySlug = (list: TaxonomyItem[], slug: string) =>
    list.find((item) => item.slug === slug) ?? null;

  if (first === "misc") {
    if (second || third) {
      return null;
    }
    return { mode: "misc", game: null, category: null, expansion: null };
  }

  const game = bySlug(bundle.games, first);
  if (!game) {
    const category = bySlug(bundle.categories, first);
    if (!category || second || third) {
      return null;
    }
    return { mode: "category", game: null, category, expansion: null };
  }
  if (!second) {
    return { mode: "game", game, category: null, expansion: null };
  }

  const category = bySlug(bundle.categories, second);
  if (category) {
    if (!third) {
      return { mode: "game", game, category, expansion: null };
    }
    const expansion = bundle.expansions.find(
      (item) => item.slug === third && item.parentId === game.id
    );
    if (!expansion) {
      return null;
    }
    return { mode: "game", game, category, expansion };
  }

  const expansion = bundle.expansions.find(
    (item) => item.slug === second && item.parentId === game.id
  );
  if (!expansion || third) {
    return null;
  }
  return { mode: "game", game, category: null, expansion };
}
