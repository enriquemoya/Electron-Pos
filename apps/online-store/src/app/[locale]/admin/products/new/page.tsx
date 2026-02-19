import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCatalogProduct, fetchTaxonomies } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { ProductCreateForm } from "@/components/admin/product-create-form";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";

async function createProductAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "es");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const gameId = String(formData.get("gameId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const expansionId = String(formData.get("expansionId") ?? "");
  const price = Number(formData.get("price"));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rarity = String(formData.get("rarity") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const isActive = formData.get("isActive") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const featuredOrder = formData.get("featuredOrder")
    ? Number(formData.get("featuredOrder"))
    : undefined;
  const availabilityState = String(formData.get("availabilityState") ?? "OUT_OF_STOCK")
    .trim()
    .toUpperCase();
  const reason = String(formData.get("reason") ?? "").trim();

  try {
    await createCatalogProduct({
      name,
      slug,
      gameId: gameId || null,
      categoryId,
      expansionId: expansionId || null,
      price,
      imageUrl,
      description: description || null,
      rarity: rarity || null,
      tags,
      availabilityState,
      isActive,
      isFeatured,
      featuredOrder: featuredOrder ?? null,
      reason
    });

    revalidatePath(`/${locale}/admin/products`);
    redirect(`/${locale}/admin/products?toast=save-success`);
  } catch {
    redirect(`/${locale}/admin/products?toast=save-error`);
  }
}

export default async function ProductCreatePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminProducts" });
  const commonT = await getTranslations({ locale: params.locale });
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" });
  const tAdmin = await getTranslations({ locale: params.locale, namespace: "adminDashboard" });
  const games = await fetchTaxonomies({ type: "GAME", page: 1, pageSize: 100 });

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        locale={params.locale}
        homeLabel={tSeo("home")}
        adminLabel={tAdmin("title")}
        items={[
          { label: t("title"), href: `/${params.locale}/admin/products` },
          { label: t("actions.create") }
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("createTitle")}</h1>
        <p className="text-sm text-white/60">{t("createSubtitle")}</p>
      </div>

      <ProductCreateForm
        locale={params.locale}
        action={createProductAction}
        games={games.items}
        labels={{
          name: t("fields.displayName"),
          slug: t("fields.slug"),
          game: t("fields.game"),
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
          description: t("fields.description"),
          rarity: t("fields.rarity"),
          tags: t("fields.tags"),
          tagsHint: t("fields.tagsHint"),
          isActive: t("fields.isActive"),
          isFeatured: t("fields.isFeatured"),
          featuredOrder: t("fields.featuredOrder"),
          reason: t("fields.reason"),
          submit: t("actions.create"),
          gameNone: t("fields.gameNone"),
          availabilityState: t("fields.availabilityState"),
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
