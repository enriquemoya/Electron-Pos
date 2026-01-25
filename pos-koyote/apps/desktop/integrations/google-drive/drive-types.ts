export type DriveTokenPayload = {
  accessToken: string;
  refreshToken: string;
  scope: string;
  tokenType: string;
  expiresAt: number;
};

export type DriveFileMetadata = {
  id: string;
  name: string;
  modifiedTime: string;
};

export type DriveSyncConfig = {
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  fileName: string;
};

export type DriveDeviceCode = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
};
