import type { BlogRepository } from "../ports";
import { buildBlogRssXml, buildBlogSitemapItems } from "../services/blog-feed";

function estimateReadingTimeMinutes(contentJson: Record<string, unknown>) {
  const words: string[] = [];

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") {
      return;
    }
    const tiptapNode = node as { type?: string; text?: string; content?: unknown[] };
    if (tiptapNode.type === "text" && typeof tiptapNode.text === "string") {
      words.push(...tiptapNode.text.split(/\s+/).filter(Boolean));
    }
    if (Array.isArray(tiptapNode.content)) {
      tiptapNode.content.forEach(walk);
    }
  };

  walk(contentJson);
  return Math.max(1, Math.ceil(words.length / 200));
}

export type BlogUseCases = {
  listAdminPosts: (params: {
    locale?: string;
    page: number;
    pageSize: number;
    query?: string;
    isPublished?: boolean;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getAdminPostById: (id: string) => Promise<Record<string, unknown> | null>;
  createPost: (payload: {
    slug: string;
    locale: string;
    title: string;
    excerpt: string;
    contentJson: Record<string, unknown>;
    coverImageUrl: string | null;
    authorName: string;
    seoTitle: string;
    seoDescription: string;
  }) => Promise<Record<string, unknown>>;
  updatePost: (id: string, payload: {
    slug?: string;
    locale?: string;
    title?: string;
    excerpt?: string;
    contentJson?: Record<string, unknown>;
    coverImageUrl?: string | null;
    authorName?: string;
    seoTitle?: string;
    seoDescription?: string;
  }) => Promise<Record<string, unknown>>;
  publishPost: (id: string) => Promise<Record<string, unknown>>;
  unpublishPost: (id: string) => Promise<Record<string, unknown>>;
  deletePost: (id: string) => Promise<Record<string, unknown>>;
  listPublicPosts: (params: {
    locale: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getPublicPostBySlug: (params: { locale: string; slug: string }) => Promise<Record<string, unknown> | null>;
  listPublishedPostsForFeed: (locale: string) => Promise<Array<Record<string, unknown>>>;
  buildRss: (params: { locale: string; siteUrl: string }) => Promise<string>;
  buildSitemap: (params: { locale: string; siteUrl: string }) => Promise<Array<{ url: string; lastModified: string }>>;
};

export function createBlogUseCases(deps: { blogRepository: BlogRepository }): BlogUseCases {
  return {
    listAdminPosts: (params) => deps.blogRepository.listAdminPosts(params),
    getAdminPostById: (id) => deps.blogRepository.getAdminPostById(id),
    createPost: (payload) =>
      deps.blogRepository.createPost({
        ...payload,
        readingTimeMinutes: estimateReadingTimeMinutes(payload.contentJson)
      }),
    updatePost: (id, payload) =>
      deps.blogRepository.updatePost(id, {
        ...payload,
        ...(payload.contentJson ? { readingTimeMinutes: estimateReadingTimeMinutes(payload.contentJson) } : {})
      }),
    publishPost: (id) => deps.blogRepository.publishPost(id),
    unpublishPost: (id) => deps.blogRepository.unpublishPost(id),
    deletePost: (id) => deps.blogRepository.deletePost(id),
    listPublicPosts: (params) => deps.blogRepository.listPublicPosts(params),
    getPublicPostBySlug: (params) => deps.blogRepository.getPublicPostBySlug(params),
    listPublishedPostsForFeed: (locale) => deps.blogRepository.listPublishedPostsForFeed(locale),
    buildRss: async ({ locale, siteUrl }) => {
      const posts = await deps.blogRepository.listPublishedPostsForFeed(locale);
      return buildBlogRssXml({ locale, siteUrl, posts });
    },
    buildSitemap: async ({ locale, siteUrl }) => {
      const posts = await deps.blogRepository.listPublishedPostsForFeed(locale);
      return buildBlogSitemapItems({ locale, siteUrl, posts });
    }
  };
}
