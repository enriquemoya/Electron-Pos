const { deriveProofStatus } = require("@pos/core");
const { uploadProofFile } = require("../integrations/google-drive/drive-sync.ts");

function registerSalesHistoryIpc(ipcMain, saleRepo, getDriveConfig) {
  ipcMain.handle("sales-history:list", (_event, filters) => {
    return saleRepo.listPaged(filters ?? {});
  });

  ipcMain.handle("sales-history:get", (_event, saleId) => {
    return saleRepo.getById(saleId);
  });

  ipcMain.handle("sales-history:attachProof", async (_event, payload) => {
    const sale = saleRepo.getById(payload.saleId);
    if (!sale) {
      throw new Error("Sale not found.");
    }
    if (payload.method !== sale.paymentMethod) {
      throw new Error("Payment method mismatch.");
    }

    const config = getDriveConfig();
    const result = await uploadProofFile({
      config,
      data: payload.fileBuffer,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      ticketNumber: sale.id,
      method: payload.method,
      dateIso: sale.createdAt
    });

    const status = deriveProofStatus(payload.method, true);
    saleRepo.updateProof(sale.id, result.fileId, status);
    return { proofFileRef: result.fileId, fileName: result.fileName };
  });
}

module.exports = { registerSalesHistoryIpc };
