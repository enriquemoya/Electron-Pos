const { createMoney, deriveProofStatus, validatePayment } = require("@pos/core");
const { uploadProofFile } = require("../integrations/google-drive/drive-sync.ts");

function registerPaymentsIpc(ipcMain, saleRepo, getDriveConfig) {
  ipcMain.handle("payments:validate", (_event, payload) => {
    const amount = createMoney(payload.amount ?? 0);
    return validatePayment(payload.method ?? null, amount, payload.proofProvided ?? false);
  });

  ipcMain.handle("payments:attachProof", async (_event, payload) => {
    const config = getDriveConfig();
    const result = await uploadProofFile({
      config,
      data: payload.fileBuffer,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      ticketNumber: payload.ticketNumber,
      method: payload.method
    });
    return { proofFileRef: result.fileId, fileName: result.fileName };
  });

  ipcMain.handle("payments:attachProofToSale", async (_event, payload) => {
    const config = getDriveConfig();
    const sale = saleRepo.getById(payload.saleId);
    if (!sale) {
      throw new Error("Sale not found.");
    }
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

  ipcMain.handle("payments:getPendingProofSales", () => {
    return saleRepo.listPendingProof();
  });

  ipcMain.handle("payments:getProof", (_event, saleId) => {
    const sale = saleRepo.getById(saleId);
    return sale?.proofFileRef ?? null;
  });
}

module.exports = { registerPaymentsIpc };
