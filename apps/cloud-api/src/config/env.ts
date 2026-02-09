import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT || 4000);
const databaseUrl = process.env.DATABASE_URL;
const sharedSecret = process.env.CLOUD_SHARED_SECRET;
const jwtSecret = process.env.JWT_SECRET;
const onlineStoreBaseUrl = process.env.ONLINE_STORE_BASE_URL;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;
const orderExpirationIntervalMs = process.env.ORDER_EXPIRATION_INTERVAL_MS
  ? Number(process.env.ORDER_EXPIRATION_INTERVAL_MS)
  : undefined;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

if (!sharedSecret) {
  throw new Error("CLOUD_SHARED_SECRET is required.");
}

if (!jwtSecret) {
  throw new Error("JWT_SECRET is required.");
}

if (!onlineStoreBaseUrl) {
  throw new Error("ONLINE_STORE_BASE_URL is required.");
}

if (!smtpHost) {
  throw new Error("SMTP_HOST is required.");
}

if (!smtpPort || Number.isNaN(smtpPort)) {
  throw new Error("SMTP_PORT is required.");
}

if (!smtpUser) {
  throw new Error("SMTP_USER is required.");
}

if (!smtpPass) {
  throw new Error("SMTP_PASS is required.");
}

if (!smtpFrom) {
  throw new Error("SMTP_FROM is required.");
}

export const env = {
  port,
  databaseUrl,
  sharedSecret,
  jwtSecret,
  onlineStoreBaseUrl,
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  smtpFrom,
  orderExpirationIntervalMs
};
