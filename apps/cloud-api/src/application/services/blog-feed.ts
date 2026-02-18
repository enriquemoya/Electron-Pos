function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

type FeedPost = Record<string, unknown>;

export function buildBlogRssXml(params: {
  locale: string;
  siteUrl: string;
  posts: FeedPost[];
}) {
  const items = params.posts
    .map((post) => {
      const postLocale = readString(post.locale, params.locale);
      const postSlug = readString(post.slug);
      const link = `${params.siteUrl}/${postLocale}/blog/${postSlug}`;
      const pubDate = readDate(post.publishedAt)?.toUTCString() ?? "";
      return `\n  <item>\n    <title>${escapeXml(readString(post.title))}</title>\n    <link>${escapeXml(link)}</link>\n    <guid>${escapeXml(link)}</guid>\n    <description>${escapeXml(readString(post.excerpt))}</description>\n    <pubDate>${escapeXml(pubDate)}</pubDate>\n  </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>DanimeZone Blog</title>\n  <link>${escapeXml(`${params.siteUrl}/${params.locale}/blog`)}</link>\n  <description>DanimeZone blog feed</description>${items}\n</channel>\n</rss>`;
}

export function buildBlogSitemapItems(params: {
  locale: string;
  siteUrl: string;
  posts: FeedPost[];
}) {
  return params.posts.map((post) => ({
    url: `${params.siteUrl}/${readString(post.locale, params.locale)}/blog/${readString(post.slug)}`,
    lastModified: readDate(post.updatedAt)?.toISOString() ?? new Date().toISOString()
  }));
}
