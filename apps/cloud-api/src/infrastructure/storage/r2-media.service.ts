import { randomUUID } from "node:crypto";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

import { appLogger } from "../../config/app-logger";
import { env } from "../../config/env";
import { ApiErrors } from "../../errors/api-error";
import type { AdminMediaUploadResult, MediaFolder, MediaStorage } from "../../application/use-cases/media";

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
            CacheControl: "public, max-age=604800, s-maxage=2592000"
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

    async deleteObjectByKey(key: string): Promise<void> {
      if (!s3 || !env.r2Bucket) {
        return;
      }
      await s3.send(
        new DeleteObjectCommand({
          Bucket: env.r2Bucket,
          Key: key
        })
      );
    }
  };
}
