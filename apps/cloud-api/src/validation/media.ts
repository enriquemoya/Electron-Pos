import { ApiErrors } from "../errors/api-error";
import type { MediaFolder } from "../application/use-cases/media";

const ALLOWED_FOLDERS = new Set<MediaFolder>(["products", "categories", "blog", "banners"]);
const MAX_PAGE_SIZE = 50;
const MEDIA_KEY_PATTERN = /^(prod|staging|dev)\/(products|categories|blog|banners)\/[a-z0-9-]+\.webp$/i;

export function validateMediaFolder(value: unknown): MediaFolder {
  if (typeof value !== "string") {
    throw ApiErrors.mediaFolderNotAllowed;
  }
  const folder = value.trim().toLowerCase() as MediaFolder;
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw ApiErrors.mediaFolderNotAllowed;
  }
  return folder;
}

export function validateMediaListQuery(input: {
  folder?: unknown;
  page?: unknown;
  pageSize?: unknown;
}) {
  const folder = input.folder === undefined ? undefined : validateMediaFolder(input.folder);
  const page = Number(input.page ?? 1);
  const pageSize = Number(input.pageSize ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw ApiErrors.invalidPagination;
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw ApiErrors.invalidPagination;
  }

  return { folder, page, pageSize };
}

export function validateMediaKey(value: unknown) {
  if (typeof value !== "string") {
    throw ApiErrors.mediaInvalidKey;
  }
  const key = decodeURIComponent(value).trim();
  if (!MEDIA_KEY_PATTERN.test(key)) {
    throw ApiErrors.mediaInvalidKey;
  }
  return key;
}
