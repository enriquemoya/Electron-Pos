import { env } from "../config/env";
import { ApiError, ApiErrors } from "../errors/api-error";

function getMediaCdnHost() {
  if (!env.mediaCdnBaseUrl) {
    throw ApiErrors.mediaInvalidSource;
  }
  try {
    return new URL(env.mediaCdnBaseUrl).host;
  } catch {
    throw ApiErrors.mediaInvalidSource;
  }
}

export function isAllowedMediaCdnUrl(value: string) {
  if (!value || value.startsWith("/") || value.startsWith("data:")) {
    return false;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") {
      return false;
    }
    return parsed.host === getMediaCdnHost();
  } catch (error) {
    if (error === ApiErrors.mediaInvalidSource) {
      throw error;
    }
    return false;
  }
}

export function assertAllowedMediaCdnUrl(value: string, error: ApiError = ApiErrors.mediaInvalidSource) {
  if (!isAllowedMediaCdnUrl(value)) {
    throw error;
  }
}
