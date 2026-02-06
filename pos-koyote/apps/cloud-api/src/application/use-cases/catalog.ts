import type { CatalogRepository } from "../ports";

export type CatalogUseCases = {
  getCatalogFilters: () => Promise<{ categories: Array<{ id: string; label: string }>; games: Array<{ id: string; label: string }> }>;
  getFeaturedCatalog: () => Promise<{ items: Array<Record<string, unknown>>; meta: { total: number } }>;
};

export function createCatalogUseCases(deps: { catalogRepository: CatalogRepository }): CatalogUseCases {
  return {
    getCatalogFilters: () => deps.catalogRepository.getCatalogFilters(),
    getFeaturedCatalog: () => deps.catalogRepository.getFeaturedCatalog()
  };
}
