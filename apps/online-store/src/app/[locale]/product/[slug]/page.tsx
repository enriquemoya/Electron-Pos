import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { InventoryState, ProductListItem } from "@/lib/api";
import { fetchCatalog } from "@/lib/api";
import { InventoryBadge } from "@/components/inventory-badge";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductAttributes } from "@/components/product-detail/product-attributes";
import { ProductDetailError } from "@/components/product-detail/product-detail-error";
import { ProductMedia } from "@/components/product-detail/product-media";
import { mapInventoryStateToAvailability } from "@/lib/cart";
import { BackButton } from "@/components/common/back-button";

function normalizeInventoryState(state: InventoryState | null | undefined): InventoryState {
  return state ?? "PENDING_SYNC";
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function mapGameToKey(game: string | null | undefined) {
  const normalized = (game ?? "").trim().toLowerCase();
  if (normalized === "pokemon") return "pokemon";
  if (normalized === "one-piece" || normalized === "one piece" || normalized === "onepiece") return "onePiece";
  if (normalized === "yugioh" || normalized === "yu-gi-oh" || normalized === "yu-gi-oh!") return "yugioh";
  return "other";
}

function stateLabelKey(state: InventoryState) {
  switch (state) {
    case "AVAILABLE":
      return "availability.inStock";
    case "LOW_STOCK":
      return "availability.lowStock";
    case "SOLD_OUT":
      return "availability.outOfStock";
    case "PENDING_SYNC":
    default:
      return "availability.pendingSync";
  }
}

async function getProductBySlug(slug: string): Promise<ProductListItem | null> {
  const data = await fetchCatalog({ id: slug, page: 1, pageSize: 1 });
  return data.items[0] ?? null;
}

async function getRelatedProducts(product: ProductListItem) {
  const game = product.game ?? null;
  const category = product.category ?? null;

  if (!game && !category) {
    return [];
  }

  const data = await fetchCatalog({ page: 1, pageSize: 24 });
  const candidates = data.items.filter((item) => item.id !== product.id);

  const score = (item: ProductListItem) => {
    if (game && item.game === game) return 2;
    if (category && item.category === category) return 1;
    return 0;
  };

  return candidates
    .map((item) => ({ item, score: score(item) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)
    .slice(0, 4);
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "productDetail" });

  try {
    const product = await getProductBySlug(params.slug);
    if (!product) {
      return {
        title: t("titleFallback"),
        description: t("descriptionFallback")
      };
    }

    const title = product.name?.trim() ? product.name : t("titleFallback");
    const description = product.shortDescription?.trim() ? product.shortDescription : t("descriptionFallback");
    const imageUrl = product.imageUrl ?? null;

    return {
      title,
      description,
      openGraph: imageUrl
        ? {
            title,
            description,
            images: [{ url: imageUrl }]
          }
        : undefined
    };
  } catch {
    return {
      title: t("titleFallback"),
      description: t("descriptionFallback")
    };
  }
}

export default async function ProductDetailPage({ params }: { params: { locale: string; slug: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations();

  let product: ProductListItem | null = null;
  try {
    product = await getProductBySlug(params.slug);
  } catch {
    return (
      <ProductDetailError
        title={t("productDetail.errorTitle")}
        body={t("productDetail.errorBody")}
        backToCatalogLabel={t("productDetail.backToCatalog")}
      />
    );
  }

  if (!product) {
    notFound();
  }

  const inventoryState = normalizeInventoryState(product.state);
  const inventoryLabel = t(stateLabelKey(inventoryState));
  const cartAvailability = mapInventoryStateToAvailability(product.state);
  const isOutOfStock = cartAvailability === "out_of_stock";

  const gameKey = mapGameToKey(product.game);
  const gameLabel = t(`games.${gameKey}`);

  const priceLabel = product.price
    ? formatMoney(product.price.amount, product.price.currency)
    : t("productDetail.priceUnavailable");

  const imageFallbackAlt = t("productDetail.imageFallbackAlt");
  const imageAlt = t("productDetail.imageAlt", { name: product.name ?? t("productDetail.titleFallback") });

  const images = product.imageUrl
    ? [
        {
          src: product.imageUrl,
          alt: imageAlt
        }
      ]
    : [];

  const attributes = [
    ...(product.game ? [{ label: t("productDetail.gameLabel"), value: gameLabel }] : []),
    ...(product.category ? [{ label: t("productDetail.categoryLabel"), value: product.category }] : [])
  ];

  let related: ProductListItem[] = [];
  try {
    related = await getRelatedProducts(product);
  } catch {
    related = [];
  }

  const labelForCard = (state: InventoryState | null | undefined) => {
    const normalized = normalizeInventoryState(state);
    return t(stateLabelKey(normalized));
  };

  return (
    <div className="space-y-12">
      <BackButton
        label={t("navigation.back")}
        fallbackHref="/catalog"
        className="px-0 text-sm text-white/70 hover:text-white"
      />
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <ProductMedia images={images} fallbackAlt={imageFallbackAlt} />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <InventoryBadge state={inventoryState} label={inventoryLabel} />
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/10 text-white">{gameLabel}</Badge>
              {product.category ? <Badge className="bg-white/10 text-white">{product.category}</Badge> : null}
            </div>
          </div>

          <section className="rounded-2xl border border-white/10 bg-base-800/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/60">{t("productDetail.priceLabel")}</span>
              <span className="text-2xl font-semibold text-white">{priceLabel}</span>
            </div>
          </section>

          <AddToCartButton
            item={{
              id: product.id,
              slug: product.slug ?? null,
              name: product.name ?? t("productDetail.titleFallback"),
              imageUrl: product.imageUrl ?? null,
              price: product.price?.amount ?? null,
              currency: product.price?.currency ?? "MXN",
              game: product.game ?? null,
              availability: cartAvailability
            }}
            disabled={isOutOfStock}
            className="w-full"
          />
          <p className="text-xs text-amber-200">{t("conversion.inventoryLimited")}</p>
          {isOutOfStock ? (
            <p className="text-xs text-rose-200">{t("cart.warnings.outOfStock")}</p>
          ) : null}

          {product.shortDescription ? (
            <section className="rounded-2xl border border-white/10 bg-base-800/70 p-5">
              <div className="whitespace-pre-line text-sm leading-relaxed text-white/70">
                {product.shortDescription}
              </div>
            </section>
          ) : null}

          <ProductAttributes title={null} attributes={attributes} />
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{t("productDetail.relatedTitle")}</h2>
        {related.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                inventoryLabel={labelForCard(item.state)}
                imageAlt={t("productDetail.imageAlt", { name: item.name ?? t("productDetail.titleFallback") })}
                imageFallbackAlt={imageFallbackAlt}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/60">{t("productDetail.relatedEmpty")}</p>
        )}
      </section>
    </div>
  );
}
