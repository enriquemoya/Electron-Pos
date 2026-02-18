import { ApiErrors } from "../errors/api-error";
import type { MediaFolder } from "../application/use-cases/media";

const ALLOWED_FOLDERS = new Set<MediaFolder>(["products", "categories", "blog", "banners"]);

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
