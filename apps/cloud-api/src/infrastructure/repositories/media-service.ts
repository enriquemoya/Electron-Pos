import type { MediaRepository, MediaStorage } from "../../application/use-cases/media";

export function createMediaRepository(deps: { mediaStorage: MediaStorage }): MediaRepository {
  return {
    uploadAdminMedia(params) {
      return deps.mediaStorage.uploadProcessedImage(params);
    },
    listAdminMedia(params) {
      return deps.mediaStorage.listObjects(params);
    },
    deleteAdminMediaByKey(key) {
      return deps.mediaStorage.deleteObjectByKey(key);
    }
  };
}
