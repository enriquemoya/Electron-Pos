import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { fetchCatalogProduct, fetchTaxonomies, updateCatalogProduct } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { ProductEditForm } from "@/components/admin/product-edit-form";

async function updateProductAction(formData: FormData) {
  "use server";
  const productId = String(formData.get("productId") ?? "");
  const locale = String(formData.get("locale") ?? "es");
  if (!productId) {
    return;
  }

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const payload = {
    displayName: String(formData.get("displayName") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim() || null,
    categoryId: String(formData.get("categoryId") ?? "").trim() || null,
    gameId: String(formData.get("gameId") ?? "").trim() || null,
    expansionId: String(formData.get("expansionId") ?? "").trim() || null,
    price: formData.get("price") ? Number(formData.get("price")) : null,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    shortDescription: String(formData.get("shortDescription") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    rarity: String(formData.get("rarity") ?? "").trim() || null,
    tags,
    availabilityState: String(formData.get("availabilityState") ?? "").trim() || null,
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
    featuredOrder: formData.get("featuredOrder") ? Number(formData.get("featuredOrder")) : null,
    reason: String(formData.get("reason") ?? "").trim()
  };

  await updateCatalogProduct(productId, payload);
  revalidatePath(`/${locale}/admin/products/${productId}`);
}

export default async function ProductDetailPage({
  params
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminProducts" });
  const commonT = await getTranslations({ locale: params.locale });
  const games = await fetchTaxonomies({ type: "GAME", page: 1, pageSize: 100 });
  const result = await fetchCatalogProduct(params.id);
  const product = result.product;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("detailTitle")}</h1>
        <p className="text-sm text-white/60">{product.displayName ?? product.productId}</p>
      </div>

      <ProductEditForm
        locale={params.locale}
        action={updateProductAction}
        product={product}
        games={games.items}
        labels={{
          displayName: t("fields.displayName"),
          slug: t("fields.slug"),
          game: t("fields.game"),
          gameNone: t("fields.gameNone"),
          category: t("fields.category"),
          categoryNone: t("fields.categoryNone"),
          expansion: t("fields.expansion"),
          expansionNone: t("fields.expansionNone"),
          price: t("fields.price"),
          imageUrl: t("fields.imageUrl"),
          shortDescription: t("fields.shortDescription"),
          description: t("fields.description"),
          rarity: t("fields.rarity"),
          tags: t("fields.tags"),
          availabilityState: t("fields.availabilityState"),
          isFeatured: t("fields.isFeatured"),
          isActive: t("fields.isActive"),
          featuredOrder: t("fields.featuredOrder"),
          reason: t("fields.reason"),
          submit: t("actions.save"),
          availabilityOptions: {
            available: commonT("availability.inStock"),
            lowStock: commonT("availability.lowStock"),
            outOfStock: commonT("availability.outOfStock"),
            pendingSync: commonT("availability.pendingSync")
          }
        }}
      />
    </div>
  );
}
