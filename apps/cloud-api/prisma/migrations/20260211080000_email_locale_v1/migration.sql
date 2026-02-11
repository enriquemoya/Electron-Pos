-- CreateEnum
CREATE TYPE "EmailLocale" AS ENUM ('ES_MX', 'EN_US');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_locale" "EmailLocale";

UPDATE "users" SET "email_locale" = 'ES_MX' WHERE "email_locale" IS NULL;

ALTER TABLE "users" ALTER COLUMN "email_locale" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email_locale" SET DEFAULT 'ES_MX';
