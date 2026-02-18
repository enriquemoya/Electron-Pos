import type { BlogRepository } from "../ports";
import { buildBlogRssXml, buildBlogSitemapItems } from "../services/blog-feed";
import { appLogger } from "../../config/app-logger";
import { env } from "../../config/env";
import { estimateReadingTimeMinutes } from "../../domain/blog/reading-time";
import type { MediaStorage } from "./media";

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
  deletePost: (id: string, actor: { adminDisplayName: string }) => Promise<Record<string, unknown>>;
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

function collectImageUrlsFromContent(contentJson: unknown) {
  const urls = new Set<string>();
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") {
      return;
    }
    const typedNode = node as { type?: string; attrs?: { src?: unknown }; content?: unknown[] };
    if (typedNode.type === "image" && typeof typedNode.attrs?.src === "string") {
      urls.add(typedNode.attrs.src);
    }
    if (Array.isArray(typedNode.content)) {
      typedNode.content.forEach(walk);
    }
  };
  walk(contentJson);
  return [...urls];
}

function getMediaKeyFromUrl(url: string) {
  if (!env.mediaCdnBaseUrl) {
    return null;
  }
  let base: URL;
  let parsed: URL;
  try {
    base = new URL(env.mediaCdnBaseUrl);
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.host !== base.host || parsed.protocol !== "https:") {
    return null;
  }
  const key = parsed.pathname.replace(/^\/+/, "");
  if (!key) {
    return null;
  }
  if (!/^(prod|staging|dev)\/(products|categories|blog|banners)\/[a-z0-9-]+\.webp$/i.test(key)) {
    return null;
  }
  return key;
}

export function createBlogUseCases(deps: { blogRepository: BlogRepository; mediaStorage?: MediaStorage }): BlogUseCases {
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
    deletePost: async (id, actor) => {
      const deletedPost = await deps.blogRepository.deletePost(id, {
        deletedByAdminName: actor.adminDisplayName
      });

      const cleanupUrls = new Set<string>();
      const coverImageUrl =
        typeof deletedPost.coverImageUrl === "string" && deletedPost.coverImageUrl
          ? deletedPost.coverImageUrl
          : null;
      if (coverImageUrl) {
        cleanupUrls.add(coverImageUrl);
      }
      collectImageUrlsFromContent(deletedPost.contentJson).forEach((url) => cleanupUrls.add(url));

      await Promise.all(
        [...cleanupUrls].map(async (url) => {
          const key = getMediaKeyFromUrl(url);
          if (!key || !deps.mediaStorage?.deleteObjectByKey) {
            return;
          }
          try {
            await deps.mediaStorage.deleteObjectByKey(key);
          } catch (error) {
            appLogger.warn("blog image cleanup failed", {
              postId: deletedPost.id,
              key,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        })
      );

      return deletedPost;
    },
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
