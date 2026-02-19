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

export type AdminMediaListItem = {
  key: string;
  url: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  createdAt: string;
};

export type MediaListQuery = {
  folder?: MediaFolder;
  page: number;
  pageSize: number;
};

export type MediaListResult = {
  items: AdminMediaListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type MediaStorage = {
  uploadProcessedImage: (params: {
    folder: MediaFolder;
    inputBuffer: Buffer;
    mimeType: string;
  }) => Promise<AdminMediaUploadResult>;
  deleteObjectByKey: (key: string) => Promise<{ deleted: boolean }>;
  listObjects: (params: {
    folder?: MediaFolder;
    page: number;
    pageSize: number;
  }) => Promise<MediaListResult>;
};

export type MediaRepository = {
  uploadAdminMedia: (params: {
    folder: MediaFolder;
    inputBuffer: Buffer;
    mimeType: string;
  }) => Promise<AdminMediaUploadResult>;
  listAdminMedia: (params: {
    folder?: MediaFolder;
    page: number;
    pageSize: number;
  }) => Promise<MediaListResult>;
  deleteAdminMediaByKey: (key: string) => Promise<{ deleted: boolean }>;
};

export type MediaUseCases = {
  uploadAdminMedia: (input: AdminMediaUploadInput) => Promise<AdminMediaUploadResult>;
  listAdminMedia: (query: MediaListQuery) => Promise<MediaListResult>;
  deleteAdminMediaByKey: (params: { key: string; actorUserId: string }) => Promise<{ deleted: boolean }>;
};

export function createMediaUseCases(deps: { mediaRepository: MediaRepository }): MediaUseCases {
  return {
    async uploadAdminMedia(input) {
      return deps.mediaRepository.uploadAdminMedia({
        folder: input.folder,
        inputBuffer: input.fileBuffer,
        mimeType: input.mimeType
      });
    },
    async listAdminMedia(query) {
      return deps.mediaRepository.listAdminMedia(query);
    },
    async deleteAdminMediaByKey(params) {
      return deps.mediaRepository.deleteAdminMediaByKey(params.key);
    }
  };
}
