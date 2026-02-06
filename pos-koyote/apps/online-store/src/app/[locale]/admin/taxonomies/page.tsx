import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { createTaxonomy, deleteTaxonomy, fetchTaxonomies, updateTaxonomy } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTableControls } from "@/components/admin/admin-table-controls";

async function createTaxonomyAction(formData: FormData) {
  "use server";
  const type = String(formData.get("type") ?? "").toUpperCase() as
    | "CATEGORY"
    | "GAME"
    | "EXPANSION"
    | "OTHER";
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!name || !slug) {
    return;
  }

  await createTaxonomy({ type, name, slug, description: description || undefined });
  revalidatePath(`/${locale}/admin/taxonomies`);
}

async function updateTaxonomyAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!id) {
    return;
  }

  await updateTaxonomy(id, {
    name: name || undefined,
    slug: slug || undefined,
    description: description || undefined
  });
  revalidatePath(`/${locale}/admin/taxonomies`);
}

async function deleteTaxonomyAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "es");
  if (!id) {
    return;
  }
  await deleteTaxonomy(id);
  revalidatePath(`/${locale}/admin/taxonomies`);
}

export default async function TaxonomiesPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: { page?: string; pageSize?: string; query?: string; sort?: string; direction?: string };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminTaxonomies" });
  const page = Number(searchParams?.page ?? 1) || 1;
  const pageSize = Number(searchParams?.pageSize ?? 20) || 20;
  const query = searchParams?.query ?? "";
  const sort = searchParams?.sort ?? "name";
  const direction = searchParams?.direction ?? "asc";

  const result = await fetchTaxonomies({ page, pageSize, query, sort, direction });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-white/60">{t("subtitle")}</p>
      </div>

      <AdminTableControls
        basePath={`/${params.locale}/admin/taxonomies`}
        page={page}
        pageSize={pageSize}
        hasMore={result.hasMore ?? false}
        query={query}
        sort={sort}
        direction={direction === "desc" ? "desc" : "asc"}
        sortOptions={[
          { value: "name", label: t("sort.name") },
          { value: "type", label: t("sort.type") }
        ]}
        labels={{
          search: t("search"),
          prev: t("pagination.prev"),
          next: t("pagination.next"),
          pageSize: t("pagination.pageSize"),
          sort: t("pagination.sort")
        }}
      />

      <form action={createTaxonomyAction} className="grid gap-3 rounded-2xl border border-white/10 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="locale" value={params.locale} />
          <Input name="name" placeholder={t("fields.name")} required />
          <Input name="slug" placeholder={t("fields.slug")} required />
          <Input name="description" placeholder={t("fields.description")} />
          <select
            name="type"
            className="h-10 rounded-md border border-white/10 bg-transparent px-3 text-sm text-white"
            defaultValue="CATEGORY"
          >
            <option value="CATEGORY">{t("types.category")}</option>
            <option value="GAME">{t("types.game")}</option>
            <option value="EXPANSION">{t("types.expansion")}</option>
            <option value="OTHER">{t("types.other")}</option>
          </select>
        </div>
        <Button type="submit" size="sm" className="w-fit">
          {t("actions.create")}
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-4 py-3">{t("columns.type")}</th>
              <th className="px-4 py-3">{t("columns.name")}</th>
              <th className="px-4 py-3">{t("columns.slug")}</th>
              <th className="px-4 py-3">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="px-4 py-3 text-white">{t(`types.${item.type.toLowerCase()}`)}</td>
                <td className="px-4 py-3">
                  <form action={updateTaxonomyAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="locale" value={params.locale} />
                    <Input name="name" defaultValue={item.name} className="h-8 w-40" />
                    <Input name="slug" defaultValue={item.slug} className="h-8 w-40" />
                    <Input name="description" defaultValue={item.description ?? ""} className="h-8 w-48" />
                    <Button type="submit" size="sm">
                      {t("actions.save")}
                    </Button>
                  </form>
                </td>
                <td className="px-4 py-3 text-white/70">{item.slug}</td>
                <td className="px-4 py-3">
                  <form action={deleteTaxonomyAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="locale" value={params.locale} />
                    <Button type="submit" size="sm" variant="outline">
                      {t("actions.delete")}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
