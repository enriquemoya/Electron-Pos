import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { fetchCatalogProduct, updateCatalogProduct } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    category: String(formData.get("category") ?? "").trim() || null,
    categoryId: String(formData.get("categoryId") ?? "").trim() || null,
    expansionId: String(formData.get("expansionId") ?? "").trim() || null,
    game: String(formData.get("game") ?? "").trim() || null,
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
  const result = await fetchCatalogProduct(params.id);
  const product = result.product;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("detailTitle")}</h1>
        <p className="text-sm text-white/60">{product.displayName ?? product.productId}</p>
      </div>

      <form action={updateProductAction} className="space-y-4">
        <input type="hidden" name="productId" value={product.productId} />
        <input type="hidden" name="locale" value={params.locale} />
        <label className="block text-sm text-white/70">
          {t("fields.displayName")}
          <Input name="displayName" defaultValue={product.displayName ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.slug")}
          <Input name="slug" defaultValue={product.slug ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.category")}
          <Input name="category" defaultValue={product.category ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.categoryId")}
          <Input name="categoryId" defaultValue={product.categoryId ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.expansion")}
          <Input name="expansionId" defaultValue={product.expansionId ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.game")}
          <Input name="game" defaultValue={product.game ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.price")}
          <Input name="price" type="number" step="0.01" defaultValue={product.price ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.imageUrl")}
          <Input name="imageUrl" defaultValue={product.imageUrl ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.shortDescription")}
          <Input
            name="shortDescription"
            defaultValue={product.shortDescription ?? ""}
            className="mt-1"
          />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.description")}
          <Input name="description" defaultValue={product.description ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.rarity")}
          <Input name="rarity" defaultValue={product.rarity ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.tags")}
          <Input name="tags" defaultValue={(product.tags ?? []).join(", ")} className="mt-1" />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.availabilityState")}
          <Input
            name="availabilityState"
            defaultValue={product.availabilityState ?? ""}
            className="mt-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} />
          {t("fields.isFeatured")}
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="isActive" defaultChecked={product.isActive ?? true} />
          {t("fields.isActive")}
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.featuredOrder")}
          <Input
            name="featuredOrder"
            type="number"
            step="1"
            defaultValue={product.featuredOrder ?? ""}
            className="mt-1"
          />
        </label>
        <label className="block text-sm text-white/70">
          {t("fields.reason")}
          <Input name="reason" className="mt-1" required />
        </label>
        <Button type="submit">{t("actions.save")}</Button>
      </form>
    </div>
  );
}
