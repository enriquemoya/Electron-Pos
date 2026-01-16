const { randomUUID } = require("crypto");
const { createMoney, openShift, closeShift } = require("@pos/core");

function registerCashRegisterIpc(ipcMain, shiftRepo, saleRepo) {
  ipcMain.handle("cash-register:open", (_event, openingAmount) => {
    const amount = createMoney(openingAmount);
    const shift = openShift(amount, randomUUID(), new Date().toISOString());
    shiftRepo.open(shift);
    return shift;
  });

  ipcMain.handle("cash-register:getActive", () => {
    return shiftRepo.getActive();
  });

  ipcMain.handle("cash-register:close", (_event, realAmount) => {
    const active = shiftRepo.getActive();
    if (!active) {
      throw new Error("No active shift.");
    }
    const sales = saleRepo.listByShiftId(active.id);
    const closed = closeShift(
      active,
      createMoney(realAmount),
      sales,
      new Date().toISOString()
    );
    shiftRepo.close(closed);
    return closed;
  });

  ipcMain.handle("cash-register:history", () => {
    return shiftRepo.listHistory();
  });
}

module.exports = { registerCashRegisterIpc };
