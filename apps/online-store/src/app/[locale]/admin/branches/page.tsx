import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AdminBranchesScreen } from "@/components/admin/admin-branches-screen";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminBranch, deleteAdminBranch, fetchAdminBranches, updateAdminBranch } from "@/lib/admin-api";

type ActionResult = { ok: boolean; error?: string };

async function createBranchAction(formData: FormData): Promise<ActionResult> {
  "use server";

  const locale = String(formData.get("locale") ?? "es");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const googleMapsUrl = String(formData.get("googleMapsUrl") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!name || !address || !city) {
    return { ok: false, error: "invalid input" };
  }

  try {
    await createAdminBranch({
      name,
      address,
      city,
      googleMapsUrl: googleMapsUrl || null,
      imageUrl: imageUrl || undefined
    });
    revalidatePath(`/${locale}/admin/branches`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "branch create failed" };
  }
}

async function updateBranchAction(formData: FormData): Promise<ActionResult> {
  "use server";

  const id = String(formData.get("id") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!id) {
    return { ok: false, error: "branch id required" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const googleMapsUrl = String(formData.get("googleMapsUrl") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!name || !address || !city) {
    return { ok: false, error: "invalid input" };
  }

  try {
    await updateAdminBranch(id, {
      name,
      address,
      city,
      googleMapsUrl: googleMapsUrl || null,
      imageUrl: imageUrl || undefined
    });
    revalidatePath(`/${locale}/admin/branches`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "branch update failed" };
  }
}

async function deleteBranchAction(formData: FormData): Promise<ActionResult> {
  "use server";

  const id = String(formData.get("id") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");

  if (!id) {
    return { ok: false, error: "branch id required" };
  }

  try {
    await deleteAdminBranch(id);
    revalidatePath(`/${locale}/admin/branches`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "branch delete failed" };
  }
}

export default async function BranchesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminBranches" });
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" });
  const tAdmin = await getTranslations({ locale: params.locale, namespace: "adminDashboard" });

  const branches = await fetchAdminBranches();

  const mediaLabels = {
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
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        locale={params.locale}
        homeLabel={tSeo("home")}
        adminLabel={tAdmin("title")}
        items={[{ label: t("title") }]}
        className="text-white/70"
      />

      <AdminBranchesScreen
        locale={params.locale}
        branches={branches}
        createBranch={createBranchAction}
        updateBranch={updateBranchAction}
        deleteBranch={deleteBranchAction}
        labels={{
          title: t("title"),
          subtitle: t("subtitle"),
          search: t("search"),
          searchPlaceholder: t("searchPlaceholder"),
          empty: t("empty"),
          columns: {
            name: t("columns.name"),
            city: t("columns.city"),
            address: t("columns.address"),
            coords: t("columns.coords"),
            updatedAt: t("columns.updatedAt"),
            action: t("columns.action")
          },
          fields: {
            name: t("fields.name"),
            city: t("fields.city"),
            address: t("fields.address"),
            imageUrl: t("fields.imageUrl"),
            googleMapsUrl: t("fields.googleMapsUrl")
          },
          actions: {
            create: t("actions.create"),
            edit: t("actions.edit"),
            save: t("actions.save"),
            delete: t("actions.delete"),
            cancel: t("actions.cancel"),
            prev: t("actions.prev"),
            next: t("actions.next")
          },
          modal: {
            createTitle: t("modal.createTitle"),
            createDescription: t("modal.createDescription"),
            editTitle: t("modal.editTitle"),
            editDescription: t("modal.editDescription")
          },
          confirm: {
            title: t("confirm.title"),
            createDescription: t("confirm.createDescription"),
            updateDescription: t("confirm.updateDescription"),
            deleteTitle: t("confirm.deleteTitle"),
            deleteDescription: t("confirm.deleteDescription", { name: "{name}" }),
            continue: t("confirm.continue"),
            cancel: t("confirm.cancel")
          },
          errors: {
            details: t("errors.details", { detail: "{detail}" }),
            required: t("errors.required")
          },
          toasts: {
            createSuccess: t("toast.createSuccess"),
            createError: t("errors.createFailed"),
            updateSuccess: t("toast.updateSuccess"),
            updateError: t("errors.updateFailed"),
            deleteSuccess: t("toast.deleteSuccess"),
            deleteError: t("errors.deleteFailed")
          },
          media: mediaLabels
        }}
      />
    </div>
  );
}
