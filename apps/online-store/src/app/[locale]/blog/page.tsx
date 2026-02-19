import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { Link } from "@/navigation";
import { fetchPublicBlogPosts } from "@/lib/blog-api";
import { getSiteUrl } from "@/lib/site-url";
import { BRAND_CONFIG } from "@/config/brand-config";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "blog.meta" });
  const siteUrl = getSiteUrl(BRAND_CONFIG.siteUrl);
  const canonical = `${siteUrl}/${params.locale}/blog`;

  return {
    title: t("listTitle"),
    description: t("listDescription"),
    alternates: {
      canonical,
      languages: {
        "es-MX": `${siteUrl}/es/blog`,
        "en-US": `${siteUrl}/en/blog`
      }
    },
    openGraph: {
      title: t("listTitle"),
      description: t("listDescription"),
      url: canonical,
      type: "website"
    }
  };
}

export default async function BlogListPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { page?: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale === "en" ? "en" : "es";
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const page = Number(searchParams.page ?? 1);
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;

  const result = await fetchPublicBlogPosts({ locale, page: safePage, pageSize: 10 });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">{t("list.title")}</h1>
        <p className="text-white/70">{t("list.subtitle")}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {result.items.map((post) => (
          <article key={`${post.locale}-${post.slug}`} className="rounded-2xl border border-white/10 bg-base-800/60 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">{post.authorName}</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="mt-2 text-sm text-white/70">{post.excerpt}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-white/60">
              <span>{post.readingTimeMinutes} min</span>
              <span>{new Date(post.publishedAt).toLocaleDateString(locale === "es" ? "es-MX" : "en-US")}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={{ pathname: "/blog", query: { page: Math.max(1, safePage - 1) } }}
          className={`rounded-md border border-white/10 px-3 py-2 text-sm ${safePage <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          {t("list.previous")}
        </Link>
        <span className="text-sm text-white/70">{safePage}</span>
        <Link
          href={{ pathname: "/blog", query: { page: safePage + 1 } }}
          className={`rounded-md border border-white/10 px-3 py-2 text-sm ${!result.hasMore ? "pointer-events-none opacity-40" : ""}`}
        >
          {t("list.next")}
        </Link>
      </div>
    </div>
  );
}
