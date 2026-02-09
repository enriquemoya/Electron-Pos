import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCatalogProduct, fetchTaxonomies } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { ProductCreateForm } from "@/components/admin/product-create-form";

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
  redirect(`/${locale}/admin/products`);
}

export default async function ProductCreatePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminProducts" });
  const commonT = await getTranslations({ locale: params.locale });
  const games = await fetchTaxonomies({ type: "GAME", page: 1, pageSize: 100 });

  return (
    <div className="space-y-6">
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
