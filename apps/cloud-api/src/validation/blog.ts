import { ApiErrors } from "../errors/api-error";
import { env } from "../config/env";

const ALLOWED_LOCALES = new Set(["es", "en"]);
const MAX_CONTENT_BYTES = 1024 * 1024;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeHyperlink(value: string) {
  if (value.startsWith("/") || value.startsWith("data:")) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getMediaCdnHost() {
  if (!env.mediaCdnBaseUrl) {
    throw ApiErrors.blogMediaNotAllowed;
  }
  try {
    return new URL(env.mediaCdnBaseUrl).host;
  } catch {
    throw ApiErrors.blogMediaNotAllowed;
  }
}

function isAllowedCdnImageUrl(value: string) {
  if (value.startsWith("/") || value.startsWith("data:")) {
    return false;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") {
      return false;
    }
    const cdnHost = getMediaCdnHost();
    return parsed.host === cdnHost;
  } catch (error) {
    if (error === ApiErrors.blogMediaNotAllowed) {
      throw error;
    }
    return false;
  }
}

function sanitizeTextNode(node: Record<string, unknown>) {
  const text = typeof node.text === "string" ? node.text : "";
  const marks = Array.isArray(node.marks) ? node.marks : [];
  const safeMarks = marks
    .filter((mark): mark is Record<string, unknown> => isObject(mark) && typeof mark.type === "string")
    .map((mark) => {
      if (mark.type === "bold" || mark.type === "italic") {
        return { type: mark.type };
      }
      if (mark.type === "link") {
        const attrs = isObject(mark.attrs) ? mark.attrs : {};
        const href = typeof attrs.href === "string" && isSafeHyperlink(attrs.href) ? attrs.href : null;
        if (!href) {
          return null;
        }
        return {
          type: "link",
          attrs: {
            href
          }
        };
      }
      return null;
    })
    .filter(Boolean) as Array<Record<string, unknown>>;

  const result: Record<string, unknown> = {
    type: "text",
    text
  };

  if (safeMarks.length > 0) {
    result.marks = safeMarks;
  }

  return result;
}

function sanitizeNode(node: unknown): Record<string, unknown> | null {
  if (!isObject(node) || typeof node.type !== "string") {
    return null;
  }

  const content = Array.isArray(node.content) ? node.content : [];

  switch (node.type) {
    case "text":
      return sanitizeTextNode(node);
    case "paragraph":
    case "blockquote":
    case "bulletList":
    case "orderedList":
    case "listItem":
    case "codeBlock": {
      return {
        type: node.type,
        content: content.map(sanitizeNode).filter((value): value is Record<string, unknown> => Boolean(value))
      };
    }
    case "heading": {
      const attrs = isObject(node.attrs) ? node.attrs : {};
      const level = typeof attrs.level === "number" ? attrs.level : 2;
      const safeLevel = level >= 2 && level <= 4 ? level : 2;
      return {
        type: "heading",
        attrs: { level: safeLevel },
        content: content.map(sanitizeNode).filter((value): value is Record<string, unknown> => Boolean(value))
      };
    }
    case "hardBreak":
      return { type: "hardBreak" };
    case "image": {
      const attrs = isObject(node.attrs) ? node.attrs : {};
      const src = typeof attrs.src === "string" && isAllowedCdnImageUrl(attrs.src) ? attrs.src : null;
      if (!src) {
        throw ApiErrors.blogMediaInvalidHost;
      }
      return {
        type: "image",
        attrs: {
          src,
          alt: typeof attrs.alt === "string" ? attrs.alt : ""
        }
      };
    }
    default:
      return null;
  }
}

export function sanitizeTiptapDocument(input: unknown): Record<string, unknown> {
  if (!isObject(input) || input.type !== "doc" || !Array.isArray(input.content)) {
    throw ApiErrors.blogInvalidContent;
  }

  const content = input.content
    .map(sanitizeNode)
    .filter((value): value is Record<string, unknown> => Boolean(value));

  if (content.length === 0) {
    throw ApiErrors.blogInvalidContent;
  }

  return {
    type: "doc",
    content
  };
}

function assertContentSize(contentJson: Record<string, unknown>) {
  const bytes = Buffer.byteLength(JSON.stringify(contentJson), "utf8");
  if (bytes > MAX_CONTENT_BYTES) {
    throw ApiErrors.blogTooLarge;
  }
}

export function estimateReadingTimeMinutes(contentJson: Record<string, unknown>) {
  const words: string[] = [];

  const walk = (node: unknown) => {
    if (!isObject(node)) {
      return;
    }
    if (node.type === "text" && typeof node.text === "string") {
      words.push(...node.text.split(/\s+/).filter(Boolean));
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
  };

  walk(contentJson);
  return Math.max(1, Math.ceil(words.length / 200));
}

type BlogPayload = {
  slug: string;
  locale: "es" | "en";
  title: string;
  excerpt: string;
  contentJson: Record<string, unknown>;
  coverImageUrl: string | null;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
};

export function validateBlogPayload(input: unknown): BlogPayload {
  if (!isObject(input)) {
    throw ApiErrors.blogInvalidPayload;
  }

  const slug = typeof input.slug === "string" ? input.slug.trim().toLowerCase() : "";
  const locale = typeof input.locale === "string" ? input.locale.trim().toLowerCase() : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const excerpt = typeof input.excerpt === "string" ? input.excerpt.trim() : "";
  const authorName = typeof input.authorName === "string" ? input.authorName.trim() : "";
  const seoTitle = typeof input.seoTitle === "string" ? input.seoTitle.trim() : "";
  const seoDescription = typeof input.seoDescription === "string" ? input.seoDescription.trim() : "";
  const coverImageUrlRaw = typeof input.coverImageUrl === "string" ? input.coverImageUrl.trim() : "";

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    throw ApiErrors.blogInvalidPayload;
  }

  if (!ALLOWED_LOCALES.has(locale)) {
    throw ApiErrors.blogInvalidPayload;
  }

  if (!title || !excerpt || !authorName || !seoTitle || !seoDescription) {
    throw ApiErrors.blogInvalidPayload;
  }

  const contentJson = sanitizeTiptapDocument(input.contentJson);
  assertContentSize(contentJson);
  let coverImageUrl: string | null = null;
  if (coverImageUrlRaw) {
    if (!isAllowedCdnImageUrl(coverImageUrlRaw)) {
      throw ApiErrors.blogMediaInvalidHost;
    }
    coverImageUrl = coverImageUrlRaw;
  }

  return {
    slug,
    locale: locale as "es" | "en",
    title,
    excerpt,
    contentJson,
    coverImageUrl,
    authorName,
    seoTitle,
    seoDescription
  };
}

export function validateBlogUpdatePayload(input: unknown): Partial<BlogPayload> {
  if (!isObject(input)) {
    throw ApiErrors.blogInvalidPayload;
  }

  const output: Partial<BlogPayload> = {};

  if (Object.prototype.hasOwnProperty.call(input, "slug")) {
    if (typeof input.slug !== "string" || !/^[a-z0-9-]+$/.test(input.slug.trim().toLowerCase())) {
      throw ApiErrors.blogInvalidPayload;
    }
    output.slug = input.slug.trim().toLowerCase();
  }

  if (Object.prototype.hasOwnProperty.call(input, "locale")) {
    if (typeof input.locale !== "string" || !ALLOWED_LOCALES.has(input.locale.trim().toLowerCase())) {
      throw ApiErrors.blogInvalidPayload;
    }
    output.locale = input.locale.trim().toLowerCase() as "es" | "en";
  }

  const optionalStrings: Array<keyof Pick<BlogPayload, "title" | "excerpt" | "authorName" | "seoTitle" | "seoDescription">> = [
    "title",
    "excerpt",
    "authorName",
    "seoTitle",
    "seoDescription"
  ];

  optionalStrings.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const value = input[key];
      if (typeof value !== "string" || !value.trim()) {
        throw ApiErrors.blogInvalidPayload;
      }
      output[key] = value.trim();
    }
  });

  if (Object.prototype.hasOwnProperty.call(input, "coverImageUrl")) {
    const value = input.coverImageUrl;
    if (value === null || value === "") {
      output.coverImageUrl = null;
    } else if (typeof value === "string") {
      if (!isAllowedCdnImageUrl(value.trim())) {
        throw ApiErrors.blogMediaInvalidHost;
      }
      output.coverImageUrl = value.trim();
    } else {
      throw ApiErrors.blogInvalidPayload;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "contentJson")) {
    const sanitized = sanitizeTiptapDocument(input.contentJson);
    assertContentSize(sanitized);
    output.contentJson = sanitized;
  }

  if (Object.keys(output).length === 0) {
    throw ApiErrors.blogInvalidPayload;
  }

  return output;
}

export function validateBlogListQuery(input: {
  locale?: unknown;
  page?: unknown;
  pageSize?: unknown;
}) {
  const localeRaw = typeof input.locale === "string" ? input.locale.trim().toLowerCase() : "es";
  if (!ALLOWED_LOCALES.has(localeRaw)) {
    throw ApiErrors.blogInvalidPayload;
  }

  const page = Number(input.page ?? 1);
  const pageSize = Number(input.pageSize ?? 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 20) {
    throw ApiErrors.blogInvalidPayload;
  }

  return {
    locale: localeRaw as "es" | "en",
    page,
    pageSize
  };
}

export function validateBlogSlug(slug: unknown) {
  const normalized = typeof slug === "string" ? slug.trim().toLowerCase() : "";
  if (!normalized || !/^[a-z0-9-]+$/.test(normalized)) {
    throw ApiErrors.blogInvalidPayload;
  }
  return normalized;
}
