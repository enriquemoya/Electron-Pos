import dotenv from "dotenv";

dotenv.config();

const portRaw = process.env.PORT;
const port = Number(portRaw || 4000);
const databaseUrl = process.env.DATABASE_URL;
const sharedSecret = process.env.CLOUD_SHARED_SECRET;
const jwtSecret = process.env.JWT_SECRET;
const onlineStoreBaseUrl = process.env.ONLINE_STORE_BASE_URL;
const cloudApiBaseUrl = process.env.CLOUD_API_BASE_URL;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecureRaw = process.env.SMTP_SECURE;
const smtpSecure = smtpSecureRaw ? smtpSecureRaw === "true" : undefined;
const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_FROM;
const appName = process.env.APP_NAME;
const supportEmail = process.env.SUPPORT_EMAIL;
const appEnv = process.env.APP_ENV || process.env.ENVIROMENT || process.env.NODE_ENV;
const r2Endpoint = process.env.R2_ENDPOINT;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET;
const r2Region = process.env.R2_REGION;
const mediaCdnBaseUrl = process.env.MEDIA_CDN_BASE_URL;
const orderExpirationIntervalMs = process.env.ORDER_EXPIRATION_INTERVAL_MS
  ? Number(process.env.ORDER_EXPIRATION_INTERVAL_MS)
  : undefined;

const envStatus = {
  port: Boolean(portRaw),
  databaseUrl: Boolean(databaseUrl),
  sharedSecret: Boolean(sharedSecret),
  jwtSecret: Boolean(jwtSecret),
  onlineStoreBaseUrl: Boolean(onlineStoreBaseUrl),
  cloudApiBaseUrl: Boolean(cloudApiBaseUrl),
  smtpHost: Boolean(smtpHost),
  smtpPort: Boolean(smtpPort && !Number.isNaN(smtpPort)),
  smtpUser: Boolean(smtpUser),
  smtpPass: Boolean(smtpPass),
  smtpFrom: Boolean(fromEmail),
  smtpSecure: Boolean(smtpSecureRaw),
  appName: Boolean(appName),
  supportEmail: Boolean(supportEmail),
  appEnv: Boolean(appEnv),
  r2Endpoint: Boolean(r2Endpoint),
  r2AccessKeyId: Boolean(r2AccessKeyId),
  r2SecretAccessKey: Boolean(r2SecretAccessKey),
  r2Bucket: Boolean(r2Bucket),
  mediaCdnBaseUrl: Boolean(mediaCdnBaseUrl)
};

export const env = {
  port,
  databaseUrl,
  sharedSecret,
  jwtSecret,
  onlineStoreBaseUrl,
  cloudApiBaseUrl,
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  smtpSecure,
  fromEmail,
  appName,
  supportEmail,
  appEnv,
  r2Endpoint,
  r2AccessKeyId,
  r2SecretAccessKey,
  r2Bucket,
  r2Region,
  mediaCdnBaseUrl,
  orderExpirationIntervalMs
};

export const envChecks = envStatus;
