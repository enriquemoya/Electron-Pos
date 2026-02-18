import crypto from "crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "../db/prisma";
import { ApiErrors } from "../../errors/api-error";
import {
  assertCanDelete,
  assertCanPublish,
  assertCanUnpublish,
  assertCanUpdate
} from "../../domain/blog/blog-domain-rules";

function selectBase() {
  return {
    id: true,
    slug: true,
    locale: true,
    title: true,
    excerpt: true,
    contentJson: true,
    coverImageUrl: true,
    authorName: true,
    readingTimeMinutes: true,
    seoTitle: true,
    seoDescription: true,
    isPublished: true,
    isDeleted: true,
    deletedByAdminName: true,
    deletedAt: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true
  } as const;
}

function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw ApiErrors.blogSlugConflict;
  }
  throw error;
}

export async function listAdminPosts(params: {
  locale?: string;
  page: number;
  pageSize: number;
  query?: string;
  isPublished?: boolean;
}) {
  const skip = (params.page - 1) * params.pageSize;
  const where: Prisma.BlogPostWhereInput = {
    isDeleted: false,
    ...(params.locale ? { locale: params.locale } : {}),
    ...(typeof params.isPublished === "boolean" ? { isPublished: params.isPublished } : {}),
    ...(params.query
      ? {
          OR: [
            { title: { contains: params.query, mode: Prisma.QueryMode.insensitive } },
            { excerpt: { contains: params.query, mode: Prisma.QueryMode.insensitive } },
            { slug: { contains: params.query, mode: Prisma.QueryMode.insensitive } }
          ]
        }
      : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: params.pageSize,
      select: selectBase()
    }),
    prisma.blogPost.count({ where })
  ]);

  return { items, total };
}

export async function getAdminPostById(id: string) {
  return prisma.blogPost.findFirst({
    where: { id, isDeleted: false },
    select: selectBase()
  });
}

export async function createPost(payload: {
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
}) {
  try {
    return await prisma.blogPost.create({
      data: {
        id: crypto.randomUUID(),
        slug: payload.slug,
        locale: payload.locale,
        title: payload.title,
        excerpt: payload.excerpt,
        contentJson: payload.contentJson as Prisma.InputJsonValue,
        coverImageUrl: payload.coverImageUrl,
        authorName: payload.authorName,
        readingTimeMinutes: payload.readingTimeMinutes,
        seoTitle: payload.seoTitle,
        seoDescription: payload.seoDescription,
        isPublished: false,
        publishedAt: null
      },
      select: selectBase()
    });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function updatePost(
  id: string,
  payload: {
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
  }
  ) {
  try {
    const current = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, slug: true, isPublished: true, isDeleted: true }
    });
    if (!current) {
      throw ApiErrors.blogNotFound;
    }
    assertCanUpdate(
      {
        id: current.id,
        slug: current.slug,
        isDeleted: current.isDeleted,
        isPublished: current.isPublished
      },
      payload
    );

    const { contentJson, ...restPayload } = payload;
    return await prisma.blogPost.update({
      where: { id },
      data: {
        ...restPayload,
        ...(contentJson
          ? { contentJson: contentJson as Prisma.InputJsonValue }
          : {}),
      },
      select: selectBase()
    });
  } catch (error) {
    if (error === ApiErrors.blogNotFound) {
      throw error;
    }
    mapPrismaError(error);
  }
}

export async function publishPost(id: string) {
  try {
    const current = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, slug: true, isDeleted: true, isPublished: true }
    });
    if (!current) {
      throw ApiErrors.blogNotFound;
    }
    assertCanPublish({
      id: current.id,
      slug: current.slug,
      isDeleted: current.isDeleted,
      isPublished: current.isPublished
    });
    return await prisma.blogPost.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date()
      },
      select: selectBase()
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiErrors.blogNotFound;
    }
    throw error;
  }
}

export async function unpublishPost(id: string) {
  try {
    const current = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, slug: true, isDeleted: true, isPublished: true }
    });
    if (!current) {
      throw ApiErrors.blogNotFound;
    }
    assertCanUnpublish({
      id: current.id,
      slug: current.slug,
      isDeleted: current.isDeleted,
      isPublished: current.isPublished
    });
    return await prisma.blogPost.update({
      where: { id },
      data: {
        isPublished: false,
        publishedAt: null
      },
      select: selectBase()
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiErrors.blogNotFound;
    }
    throw error;
  }
}

export async function listPublicPosts(params: {
  locale: string;
  page: number;
  pageSize: number;
}) {
  const skip = (params.page - 1) * params.pageSize;
  const where: Prisma.BlogPostWhereInput = {
    locale: params.locale,
    isPublished: true,
    isDeleted: false,
    publishedAt: { not: null }
  };

  const [items, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: params.pageSize,
      select: {
        slug: true,
        locale: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        authorName: true,
        readingTimeMinutes: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.blogPost.count({ where })
  ]);

  return { items, total };
}

export async function getPublicPostBySlug(params: {
  locale: string;
  slug: string;
}) {
  return prisma.blogPost.findFirst({
    where: {
      locale: params.locale,
      slug: params.slug,
      isPublished: true,
      isDeleted: false,
      publishedAt: { not: null }
    },
    select: {
      slug: true,
      locale: true,
      title: true,
      excerpt: true,
      contentJson: true,
      coverImageUrl: true,
      authorName: true,
      readingTimeMinutes: true,
      seoTitle: true,
      seoDescription: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function listPublishedPostsForFeed(locale: string) {
  return prisma.blogPost.findMany({
    where: {
      locale,
      isPublished: true,
      isDeleted: false,
      publishedAt: { not: null }
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      slug: true,
      locale: true,
      title: true,
      excerpt: true,
      seoDescription: true,
      coverImageUrl: true,
      authorName: true,
      publishedAt: true,
      updatedAt: true
    }
  });
}

export async function deletePost(id: string, options: { deletedByAdminName: string }) {
  const current = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, slug: true, isDeleted: true, isPublished: true }
  });
  if (!current) {
    throw ApiErrors.blogNotFound;
  }
  assertCanDelete({
    id: current.id,
    slug: current.slug,
    isDeleted: current.isDeleted,
    isPublished: current.isPublished
  });

  return prisma.blogPost.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedByAdminName: options.deletedByAdminName,
      isPublished: false,
      publishedAt: null
    },
    select: selectBase()
  });
}
