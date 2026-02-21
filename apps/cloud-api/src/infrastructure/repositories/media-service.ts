import type { MediaRepository, MediaStorage } from "../../application/use-cases/media";
import { prisma } from "../db/prisma";
import { ApiErrors } from "../../errors/api-error";

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
    },
    async uploadProofMedia(params) {
      const uploaded = await deps.mediaStorage.uploadProofFile({
        inputBuffer: params.inputBuffer,
        mimeType: params.mimeType
      });
      const created = await prisma.proofMedia.create({
        data: {
          branchId: params.branchId,
          terminalId: params.terminalId,
          saleId: params.saleId,
          objectKey: uploaded.key,
          cdnUrl: uploaded.url,
          mime: uploaded.mime,
          sizeBytes: uploaded.sizeBytes,
          width: uploaded.width || null,
          height: uploaded.height || null
        }
      });
      return {
        id: created.id,
        branchId: created.branchId,
        terminalId: created.terminalId,
        saleId: created.saleId,
        key: created.objectKey,
        url: created.cdnUrl,
        mime: created.mime,
        sizeBytes: created.sizeBytes,
        width: created.width,
        height: created.height,
        createdAt: created.createdAt.toISOString()
      };
    },
    async listAdminProofMedia(params) {
      const where = {
        ...(params.branchId ? { branchId: params.branchId } : {}),
        ...(params.q
          ? {
              OR: [
                { objectKey: { contains: params.q, mode: "insensitive" as const } },
                { saleId: { contains: params.q, mode: "insensitive" as const } },
                { terminalId: { contains: params.q, mode: "insensitive" as const } }
              ]
            }
          : {}),
        ...(params.from || params.to
          ? {
              createdAt: {
                ...(params.from ? { gte: new Date(params.from) } : {}),
                ...(params.to ? { lte: new Date(params.to) } : {})
              }
            }
          : {})
      };
      const [items, total] = await prisma.$transaction([
        prisma.proofMedia.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (params.page - 1) * params.pageSize,
          take: params.pageSize
        }),
        prisma.proofMedia.count({ where })
      ]);
      return {
        items: items.map((item) => ({
          id: item.id,
          branchId: item.branchId,
          terminalId: item.terminalId,
          saleId: item.saleId,
          key: item.objectKey,
          url: item.cdnUrl,
          mime: item.mime,
          sizeBytes: item.sizeBytes,
          width: item.width,
          height: item.height,
          createdAt: item.createdAt.toISOString()
        })),
        page: params.page,
        pageSize: params.pageSize,
        total,
        hasMore: params.page * params.pageSize < total
      };
    },
    async getAdminProofMediaById(id) {
      const found = await prisma.proofMedia.findUnique({ where: { id } });
      if (!found) {
        throw ApiErrors.proofNotFound;
      }
      return {
        id: found.id,
        branchId: found.branchId,
        terminalId: found.terminalId,
        saleId: found.saleId,
        key: found.objectKey,
        url: found.cdnUrl,
        mime: found.mime,
        sizeBytes: found.sizeBytes,
        width: found.width,
        height: found.height,
        createdAt: found.createdAt.toISOString()
      };
    }
  };
}
