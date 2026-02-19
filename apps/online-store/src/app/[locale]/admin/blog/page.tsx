import { getTranslations, setRequestLocale } from "next-intl/server";

import { BlogEditor } from "@/components/admin/blog-editor";
import { requireAdmin } from "@/lib/admin-guard";
import { fetchAdminBlogPosts } from "@/lib/blog-api";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";

export default async function AdminBlogPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const locale = params.locale === "en" ? "en" : "es";
  const t = await getTranslations({ locale: params.locale, namespace: "adminBlog" });
  const blogT = await getTranslations({ locale: params.locale, namespace: "blog" });
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" });
  const tAdmin = await getTranslations({ locale: params.locale, namespace: "adminDashboard" });

  const postsPayload = await fetchAdminBlogPosts({ locale, page: 1, pageSize: 50 });

  return (
    <div className="space-y-4">
      <AdminBreadcrumb
        locale={params.locale}
        homeLabel={tSeo("home")}
        adminLabel={tAdmin("title")}
        items={[{ label: t("title") }]}
      />
      <BlogEditor
        locale={locale}
        initialPosts={postsPayload.items as any}
        labels={{
        title: t("title"),
        subtitle: t("subtitle"),
        listTitle: t("listTitle"),
        newPost: t("actions.new"),
        search: t("search"),
        slug: t("fields.slug"),
        locale: t("fields.locale"),
        postTitle: t("fields.title"),
        excerpt: t("fields.excerpt"),
        authorName: t("fields.authorName"),
        coverImageUrl: t("fields.coverImageUrl"),
        seoTitle: t("fields.seoTitle"),
        seoDescription: t("fields.seoDescription"),
        saveDraft: t("actions.save"),
        publish: t("actions.publish"),
        unpublish: t("actions.unpublish"),
        uploadImage: t("actions.uploadImage"),
        delete: t("actions.delete"),
        deleteConfirm: t("actions.deleteConfirm"),
        cancel: t("actions.cancel"),
        published: blogT("status.published"),
        draft: blogT("status.draft"),
        preview: t("preview.title"),
        untitled: t("preview.untitled"),
        saving: t("status.saving"),
        saved: t("status.saved"),
        linkPrompt: t("prompts.link"),
        slugLocked: t("status.slugLocked"),
        bubbleBold: t("bubble.bold"),
        bubbleItalic: t("bubble.italic"),
        bubbleLink: t("bubble.link"),
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
        toolbar: {
          h2: t("toolbar.h2"),
          h3: t("toolbar.h3"),
          h4: t("toolbar.h4"),
          bold: t("toolbar.bold"),
          italic: t("toolbar.italic"),
          bullet: t("toolbar.bullet"),
          ordered: t("toolbar.ordered"),
          code: t("toolbar.code"),
          quote: t("toolbar.quote"),
          link: t("toolbar.link"),
          image: t("toolbar.image")
        },
        toasts: {
          saveOk: t("toasts.saveOk"),
          saveError: t("toasts.saveError"),
          publishOk: t("toasts.publishOk"),
          publishError: t("toasts.publishError"),
          uploadOk: t("toasts.uploadOk"),
          uploadError: t("toasts.uploadError")
        }
        }}
      />
    </div>
  );
}
