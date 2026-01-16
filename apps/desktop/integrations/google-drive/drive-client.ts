import type { DriveFileMetadata } from "./drive-types";

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";

async function driveRequest<T>(url: string, accessToken: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Drive request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getDriveFileMetadata(
  accessToken: string,
  fileId: string
): Promise<DriveFileMetadata> {
  const params = new URLSearchParams({ fields: "id,name,modifiedTime" });
  return driveRequest<DriveFileMetadata>(
    `${DRIVE_API}/${fileId}?${params.toString()}`,
    accessToken,
    { method: "GET" }
  );
}

export async function listDriveFiles(
  accessToken: string,
  query: string,
  fields = "files(id,name,modifiedTime)"
): Promise<DriveFileMetadata[]> {
  const params = new URLSearchParams({
    q: query,
    fields,
    spaces: "drive"
  });
  const response = await driveRequest<{ files: DriveFileMetadata[] }>(
    `${DRIVE_API}?${params.toString()}`,
    accessToken,
    { method: "GET" }
  );
  return response.files ?? [];
}

export async function createDriveFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<DriveFileMetadata> {
  const body = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    ...(parentId ? { parents: [parentId] } : {})
  };
  return driveRequest<DriveFileMetadata>(DRIVE_API, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function downloadDriveFile(
  accessToken: string,
  fileId: string
): Promise<ArrayBuffer> {
  const response = await fetch(`${DRIVE_API}/${fileId}?alt=media`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Drive download failed: ${response.status}`);
  }

  return response.arrayBuffer();
}

function buildMultipartBody(metadata: Record<string, unknown>, mimeType: string, data: ArrayBuffer) {
  const boundary = `koyote-${Date.now()}`;
  const header =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--`;

  const headerBytes = new TextEncoder().encode(header);
  const footerBytes = new TextEncoder().encode(footer);
  const fileBytes = new Uint8Array(data);

  const body = new Uint8Array(headerBytes.length + fileBytes.length + footerBytes.length);
  body.set(headerBytes, 0);
  body.set(fileBytes, headerBytes.length);
  body.set(footerBytes, headerBytes.length + fileBytes.length);

  return { body, boundary };
}

export async function uploadDriveFile(params: {
  accessToken: string;
  fileName: string;
  mimeType: string;
  data: ArrayBuffer;
  fileId?: string;
  parentId?: string;
}): Promise<DriveFileMetadata> {
  if (params.fileId) {
    await driveRequest<void>(
      `${DRIVE_UPLOAD_API}/${params.fileId}?uploadType=media`,
      params.accessToken,
      {
        method: "PATCH",
        headers: { "Content-Type": params.mimeType },
        body: params.data as BodyInit
      }
    );

    return getDriveFileMetadata(params.accessToken, params.fileId);
  }

  const uploadMetadata = params.parentId
    ? { name: params.fileName, parents: [params.parentId] }
    : { name: params.fileName };
  const multipart = buildMultipartBody(uploadMetadata, params.mimeType, params.data);
  const responseMetadata = await driveRequest<DriveFileMetadata>(
    `${DRIVE_UPLOAD_API}?uploadType=multipart`,
    params.accessToken,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${multipart.boundary}` },
      body: multipart.body
    }
  );

  return responseMetadata;
}
