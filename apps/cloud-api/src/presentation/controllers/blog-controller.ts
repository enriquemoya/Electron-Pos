import type { Request, Response } from "express";

import { env } from "../../config/env";
import type { BlogUseCases } from "../../application/use-cases/blog";
import { ApiErrors, asApiError } from "../../errors/api-error";
import { validateBlogListQuery, validateBlogPayload, validateBlogSlug, validateBlogUpdatePayload } from "../../validation/blog";

function siteUrl() {
  return env.onlineStoreBaseUrl || "http://localhost:3000";
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
        const post = await useCases.createPost(payload);
        res.status(201).json({ post });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInternalError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },

    async updatePostHandler(req: Request, res: Response) {
      try {
        const id = String(req.params.id || "");
        const payload = validateBlogUpdatePayload(req.body ?? {});
        const post = await useCases.updatePost(id, payload);
        res.status(200).json({ post });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInternalError);
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

    async deletePostHandler(req: Request, res: Response) {
      try {
        const id = String(req.params.id || "");
        const post = await useCases.deletePost(id);
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
        const xml = await useCases.buildRss({ locale, siteUrl: siteUrl() });
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
        const items = await useCases.buildSitemap({ locale, siteUrl: siteUrl() });
        res.status(200).json({
          items
        });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.blogInternalError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    }
  };
}
