import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import {
  createTaxonomy,
  deleteTaxonomy,
  fetchTaxonomies,
  updateTaxonomy,
  type Taxonomy
} from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminTableControls } from "@/components/admin/admin-table-controls";
import { TaxonomyFormDialog } from "@/components/admin/taxonomy-form-dialog";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/common/back-button";

type TaxonomyType = "CATEGORY" | "GAME" | "EXPANSION" | "OTHER";

async function createTaxonomyAction(formData: FormData) {
  "use server";
  const type = String(formData.get("type") ?? "").toUpperCase() as TaxonomyType;
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim();
  const releaseDate = String(formData.get("releaseDate") ?? "").trim();
  const labelEs = String(formData.get("labelEs") ?? "").trim();
  const labelEn = String(formData.get("labelEn") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!name || !slug) {
    return;
  }

  await createTaxonomy({
    type,
    name,
    slug,
    description: description || undefined,
    parentId: parentId || null,
    releaseDate: releaseDate || null,
    labels: {
      es: labelEs || null,
      en: labelEn || null
    }
  });
  revalidatePath(`/${locale}/admin/taxonomies`);
}

async function updateTaxonomyAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "").toUpperCase() as TaxonomyType;
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim();
  const releaseDate = String(formData.get("releaseDate") ?? "").trim();
  const labelEs = String(formData.get("labelEs") ?? "").trim();
  const labelEn = String(formData.get("labelEn") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!id) {
    return;
  }

  const payload: {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: string | null;
    releaseDate?: string | null;
    labels?: { es: string | null; en: string | null };
  } = {
    name: name || undefined,
    slug: slug || undefined,
    description: description || undefined,
    labels: {
      es: labelEs || null,
      en: labelEn || null
    }
  };

  if (type === "CATEGORY" || type === "EXPANSION") {
    payload.parentId = parentId || null;
  }
  if (type === "EXPANSION") {
    payload.releaseDate = releaseDate || null;
  } else {
    payload.releaseDate = null;
  }

  await updateTaxonomy(id, payload);
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

function normalizeType(value: string): TaxonomyType {
  if (value === "CATEGORY" || value === "GAME" || value === "EXPANSION" || value === "OTHER") {
    return value;
  }
  return "CATEGORY";
}

function typeLabel(t: Awaited<ReturnType<typeof getTranslations>>, type: TaxonomyType) {
  return t(`types.${type.toLowerCase()}`);
}

async function fetchAllTaxonomies(type: TaxonomyType) {
  const pageSize = 100;
  let page = 1;
  const items: Taxonomy[] = [];

  while (true) {
    const result = await fetchTaxonomies({
      type,
      page,
      pageSize,
      sort: "name",
      direction: "asc"
    });
    items.push(...result.items);
    if (!result.hasMore) {
      break;
    }
    page += 1;
  }

  return items;
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
  const tNav = await getTranslations({ locale: params.locale, namespace: "navigation" });
  const page = Number(searchParams?.page ?? 1) || 1;
  const pageSize = Number(searchParams?.pageSize ?? 20) || 20;
  const query = searchParams?.query ?? "";
  const sort = searchParams?.sort ?? "name";
  const direction = searchParams?.direction ?? "asc";

  const [result, gameTaxonomies, expansionTaxonomies] = await Promise.all([
    fetchTaxonomies({ page, pageSize, query, sort, direction }),
    fetchAllTaxonomies("GAME"),
    fetchAllTaxonomies("EXPANSION")
  ]);

  const gameById = new Map(gameTaxonomies.map((item) => [item.id, item] as const));
  const expansionById = new Map(expansionTaxonomies.map((item) => [item.id, item] as const));
  const parentById = new Map([
    ...gameTaxonomies.map((item) => [item.id, item.name] as const),
    ...expansionTaxonomies.map((item) => [item.id, item.name] as const)
  ]);

  const gameOptions = gameTaxonomies.map((item) => ({
    id: item.id,
    label: item.labels?.[params.locale === "es" ? "es" : "en"] || item.name
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackButton
          label={tNav("back")}
          fallbackHref={`/${params.locale}/admin/home`}
          className="text-white/70"
        />
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

      <div className="flex justify-end">
        <TaxonomyFormDialog
          mode="create"
          action={createTaxonomyAction}
          triggerLabel={t("actions.create")}
          title={t("actions.create")}
          description={t("modal.createDescription")}
          locale={params.locale}
          games={gameOptions}
          labels={{
            type: t("fields.type"),
            name: t("fields.name"),
            slug: t("fields.slug"),
            description: t("fields.description"),
            gameDependency: t("fields.gameDependency"),
            expansionDependency: t("fields.expansionDependency"),
            parentSelect: t("fields.parentSelect"),
            parentEmpty: t("fields.parentEmpty"),
            noGamesFound: t("fields.noGamesFound"),
            noExpansionsFound: t("fields.noExpansionsFound"),
            releaseYear: t("fields.releaseYear"),
            releaseMonth: t("fields.releaseMonth"),
            releaseEmpty: t("fields.releaseEmpty"),
            labelEs: t("fields.labelEs"),
            labelEn: t("fields.labelEn"),
            submit: t("actions.create"),
            cancel: t("actions.cancel")
          }}
          typeLabels={{
            category: t("types.category"),
            game: t("types.game"),
            expansion: t("types.expansion"),
            other: t("types.other")
          }}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-4 py-3">{t("columns.type")}</th>
              <th className="px-4 py-3">{t("columns.name")}</th>
              <th className="px-4 py-3">{t("columns.slug")}</th>
              <th className="px-4 py-3">{t("columns.parent")}</th>
              <th className="px-4 py-3">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => {
              const taxonomyType = normalizeType(item.type);
              const expansionParent = item.parentId ? expansionById.get(item.parentId) : null;
              const gameParent = item.parentId ? gameById.get(item.parentId) : null;
              const initialGameId =
                taxonomyType === "EXPANSION"
                  ? item.parentId ?? ""
                  : taxonomyType === "CATEGORY"
                    ? (expansionParent?.parentId ?? gameParent?.id ?? "")
                    : "";
              const initialExpansionId =
                taxonomyType === "CATEGORY" && expansionParent ? expansionParent.id : "";

              return (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="px-4 py-3 text-white">{typeLabel(t, taxonomyType)}</td>
                  <td className="px-4 py-3 text-white">{item.name}</td>
                  <td className="px-4 py-3 text-white/70">{item.slug}</td>
                  <td className="px-4 py-3 text-white/70">
                    {item.parentId ? (parentById.get(item.parentId) ?? item.parentId) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TaxonomyFormDialog
                        mode="edit"
                        action={updateTaxonomyAction}
                        triggerLabel={t("actions.edit")}
                        title={t("actions.edit")}
                        description={t("modal.editDescription")}
                        locale={params.locale}
                        games={gameOptions}
                        labels={{
                          type: t("fields.type"),
                          name: t("fields.name"),
                          slug: t("fields.slug"),
                          description: t("fields.description"),
                          gameDependency: t("fields.gameDependency"),
                          expansionDependency: t("fields.expansionDependency"),
                          parentSelect: t("fields.parentSelect"),
                          parentEmpty: t("fields.parentEmpty"),
                          noGamesFound: t("fields.noGamesFound"),
                          noExpansionsFound: t("fields.noExpansionsFound"),
                          releaseYear: t("fields.releaseYear"),
                          releaseMonth: t("fields.releaseMonth"),
                          releaseEmpty: t("fields.releaseEmpty"),
                          labelEs: t("fields.labelEs"),
                          labelEn: t("fields.labelEn"),
                          submit: t("actions.save"),
                          cancel: t("actions.cancel")
                        }}
                        typeLabels={{
                          category: t("types.category"),
                          game: t("types.game"),
                          expansion: t("types.expansion"),
                          other: t("types.other")
                        }}
                        initial={{
                          id: item.id,
                          type: taxonomyType,
                          name: item.name,
                          slug: item.slug,
                          description: item.description ?? "",
                          labelEs: item.labels?.es ?? "",
                          labelEn: item.labels?.en ?? "",
                          gameId: initialGameId,
                          expansionId: initialExpansionId,
                          releaseDate: item.releaseDate ?? ""
                        }}
                      />

                      <form action={deleteTaxonomyAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="locale" value={params.locale} />
                        <Button type="submit" size="sm" variant="outline">
                          {t("actions.delete")}
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
