import type { Request, Response } from "express";

import { env } from "../../config/env";
import type { BlogUseCases } from "../../application/use-cases/blog";
import { ApiErrors, asApiError } from "../../errors/api-error";
import {
  estimateReadingTimeMinutes,
  validateBlogListQuery,
  validateBlogPayload,
  validateBlogSlug,
  validateBlogUpdatePayload
} from "../../validation/blog";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function siteUrl() {
  return env.onlineStoreBaseUrl || "http://localhost:3000";
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

export function createBlogController(useCases: BlogUseCases) {
  return {
    async listAdminPostsHandler(req: Request, res: Response) {
      try {
        const page = Number(req.query.page ?? 1);
        const pageSize = Number(req.query.pageSize ?? 10);
        const locale = typeof req.query.locale === "string" ? req.query.locale : undefined;
        const query = typeof req.query.query === "string" ? req.query.query.trim() : undefined;
        const isPublished =
          req.query.isPublished === "true" ? true : req.query.isPublished === "false" ? false : undefined;

        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
          res.status(ApiErrors.blogInvalidPayload.status).json({ error: ApiErrors.blogInvalidPayload.message });
          return;
        }

        const result = await useCases.listAdminPosts({
          page,
          pageSize,
          locale,
          query,
          isPublished
        });

        res.status(200).json({
          items: result.items,
          page,
          pageSize,
          total: result.total,
          hasMore: page * pageSize < result.total
        });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInternalError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async getAdminPostHandler(req: Request, res: Response) {
      try {
        const id = String(req.params.id || "");
        const post = await useCases.getAdminPostById(id);
        if (!post) {
          res.status(ApiErrors.blogNotFound.status).json({ error: ApiErrors.blogNotFound.message });
          return;
        }
        res.status(200).json({ post });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInternalError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async createPostHandler(req: Request, res: Response) {
      try {
        const payload = validateBlogPayload(req.body ?? {});
        const readingTimeMinutes = estimateReadingTimeMinutes(payload.contentJson);
        const post = await useCases.createPost({
          ...payload,
          readingTimeMinutes
        });
        res.status(201).json({ post });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInvalidPayload);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async updatePostHandler(req: Request, res: Response) {
      try {
        const id = String(req.params.id || "");
        const payload = validateBlogUpdatePayload(req.body ?? {});
        const readingTimeMinutes = payload.contentJson
          ? estimateReadingTimeMinutes(payload.contentJson)
          : undefined;
        const post = await useCases.updatePost(id, {
          ...payload,
          ...(readingTimeMinutes ? { readingTimeMinutes } : {})
        });
        res.status(200).json({ post });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInvalidPayload);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async publishPostHandler(req: Request, res: Response) {
      try {
        const id = String(req.params.id || "");
        const post = await useCases.publishPost(id);
        res.status(200).json({ post });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInternalError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async unpublishPostHandler(req: Request, res: Response) {
      try {
        const id = String(req.params.id || "");
        const post = await useCases.unpublishPost(id);
        res.status(200).json({ post });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInternalError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async listPublicPostsHandler(req: Request, res: Response) {
      try {
        const query = validateBlogListQuery({
          locale: req.query.locale,
          page: req.query.page,
          pageSize: req.query.pageSize
        });

        const result = await useCases.listPublicPosts(query);
        res.status(200).json({
          items: result.items,
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
          hasMore: query.page * query.pageSize < result.total
        });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInvalidPayload);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async getPublicPostBySlugHandler(req: Request, res: Response) {
      try {
        const slug = validateBlogSlug(req.params.slug);
        const locale = typeof req.query.locale === "string" ? req.query.locale : "es";
        if (locale !== "es" && locale !== "en") {
          res.status(ApiErrors.blogInvalidPayload.status).json({ error: ApiErrors.blogInvalidPayload.message });
          return;
        }
        const post = await useCases.getPublicPostBySlug({ locale, slug });
        if (!post) {
          res.status(ApiErrors.blogNotFound.status).json({ error: ApiErrors.blogNotFound.message });
          return;
        }
        res.status(200).json({ post });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInvalidPayload);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async rssHandler(req: Request, res: Response) {
      try {
        const locale = typeof req.query.locale === "string" ? req.query.locale : "es";
        if (locale !== "es" && locale !== "en") {
          res.status(ApiErrors.blogInvalidPayload.status).json({ error: ApiErrors.blogInvalidPayload.message });
          return;
        }
        const posts = await useCases.listPublishedPostsForFeed(locale);
        const base = siteUrl();
        const items = posts
          .map((post) => {
            const postLocale = readString(post.locale, locale);
            const postSlug = readString(post.slug);
            const link = `${base}/${postLocale}/blog/${postSlug}`;
            const pubDate = readDate(post.publishedAt)?.toUTCString() ?? "";
            return `\n  <item>\n    <title>${escapeXml(readString(post.title))}</title>\n    <link>${escapeXml(link)}</link>\n    <guid>${escapeXml(link)}</guid>\n    <description>${escapeXml(readString(post.excerpt))}</description>\n    <pubDate>${escapeXml(pubDate)}</pubDate>\n  </item>`;
          })
          .join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>DanimeZone Blog</title>\n  <link>${escapeXml(`${base}/${locale}/blog`)}</link>\n  <description>DanimeZone blog feed</description>${items}\n</channel>\n</rss>`;

        res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
        res.status(200).send(xml);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInternalError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async sitemapHandler(req: Request, res: Response) {
      try {
        const locale = typeof req.query.locale === "string" ? req.query.locale : "es";
        if (locale !== "es" && locale !== "en") {
          res.status(ApiErrors.blogInvalidPayload.status).json({ error: ApiErrors.blogInvalidPayload.message });
          return;
        }
        const posts = await useCases.listPublishedPostsForFeed(locale);
        const base = siteUrl();
        res.status(200).json({
          items: posts.map((post) => ({
            url: `${base}/${readString(post.locale, locale)}/blog/${readString(post.slug)}`,
            lastModified: readDate(post.updatedAt)?.toISOString() ?? new Date().toISOString()
          }))
        });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInternalError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    }
  };
}
