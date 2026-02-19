import { ApiErrors } from "../errors/api-error";
import type { MediaFolder } from "../application/use-cases/media";

const ALLOWED_FOLDERS = new Set<MediaFolder>(["products", "categories", "blog", "banners", "proofs"]);
const MAX_PAGE_SIZE = 50;
const MEDIA_KEY_PATTERN = /^(prod|staging|dev)\/(products|categories|blog|banners|proofs)\/[a-z0-9-]+\.(webp|pdf)$/i;

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

export function validateProofListQuery(input: {
  branchId?: unknown;
  q?: unknown;
  from?: unknown;
  to?: unknown;
  page?: unknown;
  pageSize?: unknown;
}) {
  const page = Number(input.page ?? 1);
  const pageSize = Number(input.pageSize ?? 20);
  if (!Number.isInteger(page) || page < 1) {
    throw ApiErrors.invalidPagination;
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw ApiErrors.invalidPagination;
  }

  const branchId = typeof input.branchId === "string" && input.branchId.trim().length > 0
    ? input.branchId.trim()
    : undefined;
  const q = typeof input.q === "string" && input.q.trim().length > 0 ? input.q.trim() : undefined;
  const from = typeof input.from === "string" && input.from.trim().length > 0 ? input.from.trim() : undefined;
  const to = typeof input.to === "string" && input.to.trim().length > 0 ? input.to.trim() : undefined;
  return { branchId, q, from, to, page, pageSize };
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
