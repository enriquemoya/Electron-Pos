import { getTranslations, setRequestLocale } from "next-intl/server";

import { BlogEditor } from "@/components/admin/blog-editor";
import { requireAdmin } from "@/lib/admin-guard";
import { fetchAdminBlogPosts } from "@/lib/blog-api";

export default async function AdminBlogPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const locale = params.locale === "en" ? "en" : "es";
  const t = await getTranslations({ locale: params.locale, namespace: "adminBlog" });
  const blogT = await getTranslations({ locale: params.locale, namespace: "blog" });

  const postsPayload = await fetchAdminBlogPosts({ locale, page: 1, pageSize: 50 });

  return (
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
        published: blogT("status.published"),
        draft: blogT("status.draft"),
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
          uploadError: t("toasts.uploadError"),
          autosave: t("toasts.autosave")
        }
      }}
    />
  );
}
