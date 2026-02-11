import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";
import {
  fetchAdminBranches,
  createAdminBranch,
  updateAdminBranch,
  deleteAdminBranch
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchCreateForm } from "@/components/admin/branch-create-form";
import { BackButton } from "@/components/common/back-button";

function parseCoordinate(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return Number.NaN;
  }
  const normalized = value.trim().replace(",", ".");
  return Number(normalized);
}

type CreateBranchState = { error?: string | null };

async function createBranchAction(
  _prevState: CreateBranchState,
  formData: FormData
): Promise<CreateBranchState> {
  "use server";
  const locale = String(formData.get("locale") ?? "es");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const latitude = parseCoordinate(formData.get("latitude"));
  const longitude = parseCoordinate(formData.get("longitude"));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!name || !address || !city || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: "invalid input" };
  }

  try {
    await createAdminBranch({
      name,
      address,
      city,
      latitude,
      longitude,
      imageUrl: imageUrl || undefined
    });
    revalidatePath(`/${locale}/admin/branches`);
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "branch create failed";
    console.error("branch create failed", message);
    return { error: message };
  }
}

async function updateBranchAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "es");
  if (!id) {
    return;
  }

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const latitude = parseCoordinate(formData.get("latitude"));
  const longitude = parseCoordinate(formData.get("longitude"));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  await updateAdminBranch(id, {
    name: name || undefined,
    address: address || undefined,
    city: city || undefined,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    imageUrl: imageUrl || undefined
  });

  revalidatePath(`/${locale}/admin/branches`);
}

async function deleteBranchAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "es");
  if (!id) {
    return;
  }
  await deleteAdminBranch(id);
  revalidatePath(`/${locale}/admin/branches`);
}

export default async function BranchesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminBranches" });
  const tNav = await getTranslations({ locale: params.locale, namespace: "navigation" });
  const branches = await fetchAdminBranches();

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

      <BranchCreateForm
        locale={params.locale}
        action={createBranchAction}
        labels={{
          name: t("fields.name"),
          city: t("fields.city"),
          address: t("fields.address"),
          imageUrl: t("fields.imageUrl"),
          latitude: t("fields.latitude"),
          longitude: t("fields.longitude"),
          submit: t("actions.create"),
          error: t("errors.createFailed"),
          errorDetails: t("errors.details", { detail: "{detail}" })
        }}
      />

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-4 py-3">{t("columns.name")}</th>
              <th className="px-4 py-3">{t("columns.city")}</th>
              <th className="px-4 py-3">{t("columns.address")}</th>
              <th className="px-4 py-3">{t("columns.coords")}</th>
              <th className="px-4 py-3">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => {
              const formId = `branch-${branch.id}`;
              return (
                <tr key={branch.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <form action={updateBranchAction} id={formId} className="grid gap-2">
                      <input type="hidden" name="id" value={branch.id} />
                      <input type="hidden" name="locale" value={params.locale} />
                      <Input name="name" defaultValue={branch.name} className="h-8" form={formId} />
                      <Input name="imageUrl" defaultValue={branch.imageUrl ?? ""} className="h-8" form={formId} />
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <Input name="city" defaultValue={branch.city} className="h-8" form={formId} />
                  </td>
                  <td className="px-4 py-3">
                    <Input name="address" defaultValue={branch.address} className="h-8" form={formId} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="grid gap-2">
                      <Input name="latitude" type="number" step="0.000001" defaultValue={branch.latitude} className="h-8" form={formId} />
                      <Input name="longitude" type="number" step="0.000001" defaultValue={branch.longitude} className="h-8" form={formId} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <Button type="submit" size="sm" form={formId}>
                        {t("actions.save")}
                      </Button>
                      <form action={deleteBranchAction}>
                        <input type="hidden" name="id" value={branch.id} />
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
