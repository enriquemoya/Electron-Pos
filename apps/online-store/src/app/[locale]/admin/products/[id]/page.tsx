import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { fetchCatalogProduct, fetchTaxonomies, updateCatalogProduct } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { BackButton } from "@/components/common/back-button";
import { AdminSaveToast } from "@/components/admin/admin-save-toast";
import { redirect } from "next/navigation";

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

  try {
    await updateCatalogProduct(productId, payload);
    revalidatePath(`/${locale}/admin/products/${productId}`);
    redirect(`/${locale}/admin/products/${productId}?toast=save-success`);
  } catch {
    redirect(`/${locale}/admin/products/${productId}?toast=save-error`);
  }
}

export default async function ProductDetailPage({
  params,
  searchParams
}: {
  params: { locale: string; id: string };
  searchParams?: { toast?: string };
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
      <AdminSaveToast
        status={searchParams?.toast}
        successMessage={t("toast.saveSuccess")}
        errorMessage={t("toast.saveError")}
      />
      <BackButton
        label={t("actions.back")}
        fallbackHref={`/${params.locale}/admin/products`}
        className="px-0 text-sm text-white/70 hover:text-white"
      />
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
          media: {
            openLibrary: t("media.openLibrary"),
            selectedLabel: t("media.selectedLabel"),
            emptyLabel: t("media.emptyLabel"),
            remove: t("media.remove"),
            hiddenInputLabel: t("media.hiddenInputLabel"),
            dialog: {
              title: t("media.dialog.title"),
              description: t("media.dialog.description"),
              empty: t("media.dialog.empty"),
              loading: t("media.dialog.loading"),
              close: t("media.dialog.close"),
              folder: t("media.dialog.folder"),
              folders: {
                products: t("media.dialog.folders.products"),
                categories: t("media.dialog.folders.categories"),
                blog: t("media.dialog.folders.blog"),
                banners: t("media.dialog.folders.banners")
              },
              paginationPrev: t("media.dialog.paginationPrev"),
              paginationNext: t("media.dialog.paginationNext"),
              uploadTitle: t("media.dialog.uploadTitle"),
              uploadSubtitle: t("media.dialog.uploadSubtitle"),
              uploadChoose: t("media.dialog.uploadChoose"),
              uploadUploading: t("media.dialog.uploadUploading"),
              toasts: {
                listError: t("media.dialog.toasts.listError"),
                uploadSuccess: t("media.dialog.toasts.uploadSuccess"),
                uploadError: t("media.dialog.toasts.uploadError"),
                deleteSuccess: t("media.dialog.toasts.deleteSuccess"),
                deleteError: t("media.dialog.toasts.deleteError")
              },
              grid: {
                select: t("media.dialog.grid.select"),
                selected: t("media.dialog.grid.selected"),
                delete: t("media.dialog.grid.delete"),
                dimensionsUnknown: t("media.dialog.grid.dimensionsUnknown")
              }
            }
          },
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
