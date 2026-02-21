const { deriveProofStatus } = require("@pos/core");

function registerSalesHistoryIpc(ipcMain, saleRepo, uploadProof) {
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

    const result = await uploadProof({
      fileBuffer: payload.fileBuffer,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      ticketNumber: sale.id,
      method: payload.method,
      dateIso: sale.createdAt,
      saleId: sale.id
    });

    const status = deriveProofStatus(payload.method, true);
    saleRepo.updateProof(sale.id, result.proofFileRef, status);
    return { proofFileRef: result.proofFileRef, fileName: result.fileName };
  });
}

module.exports = { registerSalesHistoryIpc };
