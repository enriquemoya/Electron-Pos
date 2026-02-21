const { app } = require("electron");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function sanitizeFileName(fileName) {
  const raw = typeof fileName === "string" ? fileName.trim() : "proof";
  const base = raw.length > 0 ? raw : "proof";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96);
}

function ensureProofDirectory(dateIso) {
  const now = dateIso ? new Date(dateIso) : new Date();
  const year = Number.isNaN(now.getTime()) ? "unknown" : String(now.getUTCFullYear());
  const month = Number.isNaN(now.getTime()) ? "00" : String(now.getUTCMonth() + 1).padStart(2, "0");
  const dir = path.join(app.getPath("userData"), "proofs", year, month);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function saveProofFile(params) {
  const data = Buffer.isBuffer(params?.data) ? params.data : Buffer.from(params?.data || []);
  if (data.length === 0) {
    throw new Error("proof file is empty");
  }

  const directory = ensureProofDirectory(params?.dateIso);
  const extension = path.extname(sanitizeFileName(params?.fileName)) || ".bin";
  const fileId = crypto.randomUUID();
  const fileName = `${params?.ticketNumber || "ticket"}-${params?.method || "proof"}-${fileId}${extension}`;
  const absolutePath = path.join(directory, fileName);
  fs.writeFileSync(absolutePath, data);

  return {
    fileId: `local-proof://${fileId}`,
    fileName,
    absolutePath,
    mimeType: params?.mimeType || null
  };
}

module.exports = {
  saveProofFile
};
