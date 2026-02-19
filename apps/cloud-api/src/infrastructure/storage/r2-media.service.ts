import { randomUUID } from "node:crypto";

import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

import { appLogger } from "../../config/app-logger";
import { env } from "../../config/env";
import { ApiErrors } from "../../errors/api-error";
import type { AdminMediaListItem, AdminMediaUploadResult, MediaFolder, MediaListResult, MediaStorage } from "../../application/use-cases/media";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_WIDTH = 1600;

function normalizeAppEnv(raw: string | undefined) {
  const value = (raw || "").toLowerCase();
  if (value === "production" || value === "prod") {
    return "prod";
  }
  if (value === "staging" || value === "stage") {
    return "staging";
  }
  return "dev";
}

function buildCdnUrl(key: string) {
  if (!env.mediaCdnBaseUrl) {
    throw ApiErrors.mediaUploadFailed;
  }
  return `${env.mediaCdnBaseUrl.replace(/\/+$/, "")}/${key}`;
}

function buildPrefix(folder?: MediaFolder) {
  const appEnv = normalizeAppEnv(env.appEnv);
  if (!folder) {
    return `${appEnv}/`;
  }
  return `${appEnv}/${folder}/`;
}

export function createR2MediaService(): MediaStorage {
  const s3 = env.r2Endpoint && env.r2AccessKeyId && env.r2SecretAccessKey && env.r2Bucket
    ? new S3Client({
        endpoint: env.r2Endpoint,
        region: env.r2Region || "auto",
        credentials: {
          accessKeyId: env.r2AccessKeyId,
          secretAccessKey: env.r2SecretAccessKey
        }
      })
    : null;

  return {
    async uploadProcessedImage(params: {
      folder: MediaFolder;
      inputBuffer: Buffer;
      mimeType: string;
    }): Promise<AdminMediaUploadResult> {
      if (!ALLOWED_MIME.has(params.mimeType)) {
        throw ApiErrors.mediaInvalidType;
      }

      if (params.inputBuffer.length > MAX_UPLOAD_BYTES) {
        throw ApiErrors.mediaTooLarge;
      }

      const appEnv = normalizeAppEnv(env.appEnv);
      const key = `${appEnv}/${params.folder}/${randomUUID()}.webp`;

      let output: Buffer;
      let width = 0;
      let height = 0;

      try {
        const pipeline = sharp(params.inputBuffer, { failOn: "error", limitInputPixels: 268402689 })
          .rotate()
          .resize({ width: MAX_WIDTH, withoutEnlargement: true, fit: "inside" })
          .webp({ quality: 85 });

        const metadata = await pipeline.metadata();
        output = await pipeline.toBuffer();
        width = metadata.width || 0;
        height = metadata.height || 0;

        if (output.length === 0 || width <= 0 || height <= 0) {
          throw ApiErrors.mediaProcessingFailed;
        }
        if (output.length > params.inputBuffer.length) {
          throw ApiErrors.mediaProcessingFailed;
        }
      } catch (error) {
        appLogger.warn("media processing failed", {
          mimeType: params.mimeType,
          inputSize: params.inputBuffer.length,
          folder: params.folder,
          error: error instanceof Error ? error.message : String(error)
        });
        throw ApiErrors.mediaProcessingFailed;
      }

      try {
        if (!s3 || !env.r2Bucket) {
          appLogger.error("media upload failed: missing R2 configuration", {
            hasEndpoint: Boolean(env.r2Endpoint),
            hasAccessKey: Boolean(env.r2AccessKeyId),
            hasSecret: Boolean(env.r2SecretAccessKey),
            hasBucket: Boolean(env.r2Bucket),
            hasCdnBaseUrl: Boolean(env.mediaCdnBaseUrl)
          });
          throw ApiErrors.mediaUploadFailed;
        }
        await s3.send(
          new PutObjectCommand({
            Bucket: env.r2Bucket,
            Key: key,
            Body: output,
            ContentType: "image/webp",
            CacheControl: "public, max-age=604800, s-maxage=2592000",
            Metadata: {
              width: String(width),
              height: String(height)
            }
          })
        );
      } catch (error) {
        appLogger.error("media upload failed", {
          key,
          folder: params.folder,
          outputSize: output.length,
          error: error instanceof Error ? error.message : String(error)
        });
        throw ApiErrors.mediaUploadFailed;
      }

      return {
        url: buildCdnUrl(key),
        width,
        height,
        sizeBytes: output.length
      };
    },

    async listObjects(params: {
      folder?: MediaFolder;
      page: number;
      pageSize: number;
    }): Promise<MediaListResult> {
      if (!s3 || !env.r2Bucket) {
        throw ApiErrors.mediaUploadFailed;
      }
      const prefix = buildPrefix(params.folder);
      const iterations = Math.max(1, params.page);
      let continuationToken: string | undefined;
      let currentItems: AdminMediaListItem[] = [];
      let hasMore = false;

      for (let index = 0; index < iterations; index += 1) {
        const response = await s3.send(
          new ListObjectsV2Command({
            Bucket: env.r2Bucket,
            Prefix: prefix,
            MaxKeys: params.pageSize,
            ContinuationToken: continuationToken
          })
        );
        const objects = response.Contents ?? [];
        currentItems = objects
          .filter((item): item is typeof item & { Key: string } => Boolean(item.Key))
          .map((item) => ({
            key: item.Key,
            url: buildCdnUrl(item.Key),
            width: null,
            height: null,
            sizeBytes: item.Size ?? 0,
            createdAt: (item.LastModified ?? new Date(0)).toISOString()
          }))
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

        if (!response.IsTruncated || !response.NextContinuationToken) {
          hasMore = false;
          continuationToken = undefined;
          break;
        }

        continuationToken = response.NextContinuationToken;
        hasMore = true;
      }

      const lowerBoundTotal = (params.page - 1) * params.pageSize + currentItems.length + (hasMore ? 1 : 0);
      return {
        items: currentItems,
        page: params.page,
        pageSize: params.pageSize,
        total: lowerBoundTotal,
        hasMore
      };
    },

    async deleteObjectByKey(key: string): Promise<{ deleted: boolean }> {
      if (!s3 || !env.r2Bucket) {
        appLogger.warn("media delete skipped: missing R2 configuration", {
          key,
          hasEndpoint: Boolean(env.r2Endpoint),
          hasAccessKey: Boolean(env.r2AccessKeyId),
          hasSecret: Boolean(env.r2SecretAccessKey),
          hasBucket: Boolean(env.r2Bucket)
        });
        return { deleted: false };
      }
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: env.r2Bucket,
            Key: key
          })
        );
      } catch (error) {
        appLogger.warn("media delete failed (best effort)", {
          key,
          error: error instanceof Error ? error.message : String(error)
        });
        return { deleted: false };
      }
      return { deleted: true };
    }
  };
}
