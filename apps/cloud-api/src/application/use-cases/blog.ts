import type { BlogRepository } from "../ports";

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
    readingTimeMinutes: number;
    seoTitle: string;
    seoDescription: string;
    isPublished: boolean;
  }) => Promise<Record<string, unknown>>;
  updatePost: (id: string, payload: {
    slug?: string;
    locale?: string;
    title?: string;
    excerpt?: string;
    contentJson?: Record<string, unknown>;
    coverImageUrl?: string | null;
    authorName?: string;
    readingTimeMinutes?: number;
    seoTitle?: string;
    seoDescription?: string;
    isPublished?: boolean;
  }) => Promise<Record<string, unknown>>;
  publishPost: (id: string) => Promise<Record<string, unknown>>;
  unpublishPost: (id: string) => Promise<Record<string, unknown>>;
  listPublicPosts: (params: {
    locale: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getPublicPostBySlug: (params: { locale: string; slug: string }) => Promise<Record<string, unknown> | null>;
  listPublishedPostsForFeed: (locale: string) => Promise<Array<Record<string, unknown>>>;
};

export function createBlogUseCases(deps: { blogRepository: BlogRepository }): BlogUseCases {
  return {
    listAdminPosts: (params) => deps.blogRepository.listAdminPosts(params),
    getAdminPostById: (id) => deps.blogRepository.getAdminPostById(id),
    createPost: (payload) => deps.blogRepository.createPost(payload),
    updatePost: (id, payload) => deps.blogRepository.updatePost(id, payload),
    publishPost: (id) => deps.blogRepository.publishPost(id),
    unpublishPost: (id) => deps.blogRepository.unpublishPost(id),
    listPublicPosts: (params) => deps.blogRepository.listPublicPosts(params),
    getPublicPostBySlug: (params) => deps.blogRepository.getPublicPostBySlug(params),
    listPublishedPostsForFeed: (locale) => deps.blogRepository.listPublishedPostsForFeed(locale)
  };
}
