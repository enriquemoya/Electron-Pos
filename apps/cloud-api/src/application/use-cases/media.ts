export type MediaFolder = "products" | "categories" | "blog" | "banners";

export type AdminMediaUploadInput = {
  actorUserId: string;
  fileBuffer: Buffer;
  mimeType: string;
  folder: MediaFolder;
};

export type AdminMediaUploadResult = {
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
};

export type MediaStorage = {
  uploadProcessedImage: (params: {
    folder: MediaFolder;
    inputBuffer: Buffer;
    mimeType: string;
  }) => Promise<AdminMediaUploadResult>;
};

export type MediaUseCases = {
  uploadAdminMedia: (input: AdminMediaUploadInput) => Promise<AdminMediaUploadResult>;
};

export function createMediaUseCases(deps: { mediaStorage: MediaStorage }): MediaUseCases {
  return {
    async uploadAdminMedia(input) {
      return deps.mediaStorage.uploadProcessedImage({
        folder: input.folder,
        inputBuffer: input.fileBuffer,
        mimeType: input.mimeType
      });
    }
  };
}
