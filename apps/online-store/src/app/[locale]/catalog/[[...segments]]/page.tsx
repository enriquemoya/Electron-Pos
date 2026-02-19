import { getTranslations, setRequestLocale } from "next-intl/server";

import { fetchCatalog, type InventoryState } from "@/lib/api";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { fetchTaxonomyBundle, resolveCatalogRoute, taxonomyLabel } from "@/lib/taxonomies";
import { JsonLd } from "@/components/seo/json-ld";
import { BRAND_CONFIG } from "@/config/brand-config";
import { AppBreadcrumb } from "@/components/common/app-breadcrumb";

type CatalogPageProps = {
  params: {
    locale: string;
    segments?: string[];
  };
  searchParams: {
    page?: string;
    pageSize?: string;
    priceMin?: string;
    priceMax?: string;
  };
};

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegative(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  setRequestLocale(params.locale);
  const t = await getTranslations();
  const page = parseNumber(searchParams.page, 1);
  const pageSize = parseNumber(searchParams.pageSize, 12);
  const priceMin = parseNonNegative(searchParams.priceMin);
  const priceMax = parseNonNegative(searchParams.priceMax);

  const taxonomy = await fetchTaxonomyBundle();
  const selection = resolveCatalogRoute(params.segments, taxonomy);
  const basePath = `/catalog${params.segments?.length ? `/${params.segments.join("/")}` : ""}`;
  const siteUrl = BRAND_CONFIG.siteUrl;
  const localeRoot = `${siteUrl}/${params.locale}`;

  if (!selection) {
    return (
      <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/70">
        {t("catalog.empty")}
      </div>
    );
  }

  let data;
  try {
    data = await fetchCatalog({
      page,
      pageSize,
      misc: selection.mode === "misc",
      gameId: selection.game?.id,
      categoryId: selection.category?.id,
      expansionId: selection.expansion?.id,
      priceMin: searchParams.priceMin ? priceMin : undefined,
      priceMax: searchParams.priceMax ? priceMax : undefined
    });
  } catch {
    return (
      <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/70">
        {t("catalog.error")}
      </div>
    );
  }

  const sections = [
    {
      title: t("catalog.filters.games"),
      clearHref: "/catalog",
      clearLabel: t("catalog.filters.allGames"),
      items: taxonomy.games.map((game) => ({
        href: `/catalog/${game.slug}`,
        label: taxonomyLabel(game, params.locale),
        active: selection.game?.id === game.id
      }))
    },
    {
      title: t("catalog.filters.categories"),
      clearHref: selection.game ? `/catalog/${selection.game.slug}` : "/catalog",
      clearLabel: t("catalog.filters.allCategories"),
      items: taxonomy.categories.map((category) => ({
        href: selection.game
          ? `/catalog/${selection.game.slug}/${category.slug}`
          : `/catalog/${category.slug}`,
        label: taxonomyLabel(category, params.locale),
        active: selection.category?.id === category.id
      }))
    },
    {
      title: t("catalog.filters.expansions"),
      clearHref: selection.game
        ? (selection.category
            ? `/catalog/${selection.game.slug}/${selection.category.slug}`
            : `/catalog/${selection.game.slug}`)
        : "/catalog",
      clearLabel: t("catalog.filters.allExpansions"),
      items: taxonomy.expansions
        .filter((expansion) => (selection.game ? expansion.parentId === selection.game.id : true))
        .map((expansion) => {
          const parentGame = taxonomy.games.find((game) => game.id === expansion.parentId);
          const scopedHref = selection.game
            ? (selection.category
                ? `/catalog/${selection.game.slug}/${selection.category.slug}/${expansion.slug}`
                : `/catalog/${selection.game.slug}/${expansion.slug}`)
            : parentGame
              ? `/catalog/${parentGame.slug}/${expansion.slug}`
              : "/catalog";

          return {
            href: scopedHref,
            label: taxonomyLabel(expansion, params.locale),
            active: selection.expansion?.id === expansion.id
          };
        })
    },
    {
      title: t("catalog.filters.misc"),
      clearHref: "/catalog",
      clearLabel: t("catalog.filters.allMisc"),
      items: [
        {
          href: "/catalog/misc",
          label: t("catalog.filters.miscLabel"),
          active: selection.mode === "misc"
        }
      ]
    }
  ];

  const inventoryLabelFor = (state: InventoryState | null | undefined) => {
    switch (state) {
      case "AVAILABLE":
        return t("availability.available");
      case "LOW_STOCK":
        return t("availability.low");
      case "SOLD_OUT":
        return t("availability.soldOut");
      default:
        return t("availability.pending");
    }
  };

  const imageFallbackAlt = t("catalog.imageFallbackAlt");
  const breadcrumbItems: Array<{ name: string; url: string }> = [
    { name: t("seo.breadcrumb.home"), url: localeRoot },
    { name: t("seo.breadcrumb.catalog"), url: `${localeRoot}/catalog` }
  ];

  if (selection.mode === "misc") {
    breadcrumbItems.push({ name: t("catalog.filters.miscLabel"), url: `${localeRoot}/catalog/misc` });
  } else {
    if (selection.game) {
      breadcrumbItems.push({
        name: taxonomyLabel(selection.game, params.locale),
        url: `${localeRoot}/catalog/${selection.game.slug}`
      });
    }
    if (selection.category) {
      const categoryPath = selection.game
        ? `${selection.game.slug}/${selection.category.slug}`
        : selection.category.slug;
      breadcrumbItems.push({
        name: taxonomyLabel(selection.category, params.locale),
        url: `${localeRoot}/catalog/${categoryPath}`
      });
    }
    if (selection.expansion) {
      const expansionPath = selection.game
        ? (selection.category
            ? `${selection.game.slug}/${selection.category.slug}/${selection.expansion.slug}`
            : `${selection.game.slug}/${selection.expansion.slug}`)
        : selection.expansion.slug;
      breadcrumbItems.push({
        name: taxonomyLabel(selection.expansion, params.locale),
        url: `${localeRoot}/catalog/${expansionPath}`
      });
    }
  }
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <div className="space-y-8">
      <JsonLd id="catalog-breadcrumbs" data={breadcrumbList} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <AppBreadcrumb
            items={[
              { label: t("seo.breadcrumb.home"), href: `/${params.locale}` },
              { label: t("seo.breadcrumb.catalog") }
            ]}
            className="text-white/70"
          />
          <h1 className="text-2xl font-semibold text-white">{t("catalog.title")}</h1>
          <p className="text-sm text-white/60">{t("catalog.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="md:sticky md:top-24 md:self-start">
          <CatalogFilters sections={sections} baseCatalogPath="/catalog" />
        </div>

        <div className="space-y-6">
          <ActiveFilterChips />
          {data.items.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/60">
              {t("catalog.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {data.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inventoryLabel={inventoryLabelFor(product.state)}
                  imageAlt={t("productDetail.imageAlt", { name: product.name ?? t("productDetail.titleFallback") })}
                  imageFallbackAlt={imageFallbackAlt}
                />
              ))}
            </div>
          )}

          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            basePath={basePath}
            query={{
              pageSize: data.pageSize,
              priceMin: searchParams.priceMin,
              priceMax: searchParams.priceMax
            }}
            labels={{
              label: t("common.pagination.label", {
                page: data.page,
                total: Math.max(1, Math.ceil(data.total / data.pageSize))
              }),
              prev: t("common.pagination.prev"),
              next: t("common.pagination.next")
            }}
          />
        </div>
      </div>
    </div>
  );
}
