export type MediaFolder = "products" | "categories" | "blog" | "banners" | "proofs";

export type AdminMediaUploadInput = {
  actorUserId: string;
  fileBuffer: Buffer;
  mimeType: string;
  folder: MediaFolder;
};

export type AdminMediaUploadResult = {
  url: string;
  key?: string;
  width: number;
  height: number;
  sizeBytes: number;
  mime?: string;
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

export type ProofMediaItem = {
  id: string;
  branchId: string;
  terminalId: string;
  saleId: string | null;
  key: string;
  url: string;
  mime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
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
  uploadProofFile: (params: {
    inputBuffer: Buffer;
    mimeType: string;
  }) => Promise<AdminMediaUploadResult & { key: string; mime: string }>;
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
  uploadProofMedia: (params: {
    branchId: string;
    terminalId: string;
    saleId: string | null;
    inputBuffer: Buffer;
    mimeType: string;
  }) => Promise<ProofMediaItem>;
  listAdminProofMedia: (params: {
    branchId?: string;
    q?: string;
    from?: string;
    to?: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: ProofMediaItem[]; page: number; pageSize: number; total: number; hasMore: boolean }>;
  getAdminProofMediaById: (id: string) => Promise<ProofMediaItem | null>;
};

export type MediaUseCases = {
  uploadAdminMedia: (input: AdminMediaUploadInput) => Promise<AdminMediaUploadResult>;
  listAdminMedia: (query: MediaListQuery) => Promise<MediaListResult>;
  deleteAdminMediaByKey: (params: { key: string; actorUserId: string }) => Promise<{ deleted: boolean }>;
  uploadPosProofMedia: (input: {
    branchId: string;
    terminalId: string;
    saleId: string | null;
    fileBuffer: Buffer;
    mimeType: string;
  }) => Promise<ProofMediaItem>;
  listAdminProofMedia: (query: {
    branchId?: string;
    q?: string;
    from?: string;
    to?: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: ProofMediaItem[]; page: number; pageSize: number; total: number; hasMore: boolean }>;
  getAdminProofMediaById: (id: string) => Promise<ProofMediaItem | null>;
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
    },
    async uploadPosProofMedia(input) {
      return deps.mediaRepository.uploadProofMedia({
        branchId: input.branchId,
        terminalId: input.terminalId,
        saleId: input.saleId,
        inputBuffer: input.fileBuffer,
        mimeType: input.mimeType
      });
    },
    async listAdminProofMedia(query) {
      return deps.mediaRepository.listAdminProofMedia(query);
    },
    async getAdminProofMediaById(id) {
      return deps.mediaRepository.getAdminProofMediaById(id);
    }
  };
}
