const crypto = require("crypto");
const fs = require("fs");

const { deriveProofStatus } = require("@pos/core");
const { saveProofFile } = require("./proof-storage");

function nowIso() {
  return new Date().toISOString();
}

function plusMinutesIso(minutes) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

async function uploadOrQueueProof(params) {
  const saved = saveProofFile({
    data: params.fileBuffer,
    fileName: params.fileName,
    mimeType: params.mimeType,
    ticketNumber: params.ticketNumber,
    method: params.method,
    dateIso: params.dateIso
  });

  const eventId = crypto.randomUUID();
  const payload = {
    localProofRef: saved.fileId,
    localPath: saved.absolutePath,
    fileName: saved.fileName,
    mimeType: saved.mimeType,
    saleId: params.saleId || null,
    method: params.method,
    createdAt: nowIso()
  };

  const uploadNow = async () => {
    if (!params.cloudClient) {
      return null;
    }
    const uploaded = await params.cloudClient.uploadProof({
      fileBuffer: fs.readFileSync(saved.absolutePath),
      fileName: saved.fileName,
      mimeType: saved.mimeType || "application/octet-stream",
      saleId: params.saleId || null
    });
    if (params.saleId && params.saleRepo) {
      params.saleRepo.updateProof(params.saleId, uploaded.url, deriveProofStatus(params.method, true));
    }
    if (fs.existsSync(saved.absolutePath)) {
      fs.unlinkSync(saved.absolutePath);
    }
    return uploaded;
  };

  try {
    const uploaded = await uploadNow();
    if (uploaded) {
      return {
        proofFileRef: uploaded.url,
        fileName: saved.fileName,
        queued: false
      };
    }
  } catch {
    // Queue fallback below.
  }

  params.posSyncRepo.enqueueSyncEvent({
    id: eventId,
    terminalId: params.terminalState?.terminalId || null,
    branchId: params.terminalState?.branchId || null,
    eventType: "PROOF_UPLOAD",
    payload,
    maxRetries: 100,
    nextRetryAt: plusMinutesIso(30),
    nowIso: nowIso()
  });

  return {
    proofFileRef: saved.fileId,
    fileName: saved.fileName,
    queued: true
  };
}

module.exports = {
  uploadOrQueueProof
};
