import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { Link } from "@/navigation";
import { fetchPublicBlogPost } from "@/lib/blog-api";
import { renderBlogContent } from "@/lib/blog-content";
import { getSiteUrl } from "@/lib/site-url";
import { BRAND_CONFIG } from "@/config/brand-config";

export async function generateMetadata({
  params
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = params.locale === "en" ? "en" : "es";
  const post = await fetchPublicBlogPost({ locale, slug: params.slug });
  if (!post) {
    return {};
  }
  const siteUrl = getSiteUrl(BRAND_CONFIG.siteUrl);
  const canonical = `${siteUrl}/${locale}/blog/${post.slug}`;

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    alternates: {
      canonical,
      languages: {
        "es-MX": `${siteUrl}/es/blog/${post.slug}`,
        "en-US": `${siteUrl}/en/blog/${post.slug}`
      }
    },
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      type: "article",
      url: canonical,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle,
      description: post.seoDescription,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined
    }
  };
}

export default async function BlogDetailPage({ params }: { params: { locale: string; slug: string } }) {
  setRequestLocale(params.locale);
  const locale = params.locale === "en" ? "en" : "es";
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });
  const post = await fetchPublicBlogPost({ locale, slug: params.slug });
  if (!post) {
    notFound();
  }

  const rendered = renderBlogContent(post.contentJson);
  const siteUrl = getSiteUrl(BRAND_CONFIG.siteUrl);
  const canonical = `${siteUrl}/${locale}/blog/${post.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: {
      "@type": "Person",
      name: post.authorName
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    mainEntityOfPage: canonical
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("breadcrumbs.home"), item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: t("breadcrumbs.blog"), item: `${siteUrl}/${locale}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonical }
    ]
  };

  return (
    <article className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <JsonLd id={`blog-article-${post.slug}`} data={articleJsonLd} />
        <JsonLd id={`blog-breadcrumb-${post.slug}`} data={breadcrumbJsonLd} />
        <Link href="/blog" className="text-sm text-amber-300">{t("actions.backToBlog")}</Link>
        <h1 className="text-3xl font-semibold text-white">{post.title}</h1>
        <p className="text-sm text-white/60">{post.authorName} · {post.readingTimeMinutes} min</p>
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt={post.title} className="w-full rounded-2xl border border-white/10" />
        ) : null}
        <p className="text-lg text-white/80">{post.excerpt}</p>
        <div className="space-y-4">{rendered.content}</div>
      </div>

      <aside className="h-fit rounded-2xl border border-white/10 bg-base-800/60 p-4">
        <p className="text-sm font-semibold text-white">{t("toc.title")}</p>
        <nav className="mt-3 space-y-2">
          {rendered.headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={`block text-sm text-white/70 hover:text-white ${heading.level === 3 ? "pl-3" : heading.level === 4 ? "pl-6" : ""}`}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </aside>
    </article>
  );
}
