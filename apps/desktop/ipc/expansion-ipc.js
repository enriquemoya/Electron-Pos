const { randomUUID } = require("crypto");

function registerExpansionIpc(ipcMain, expansionRepo) {
  ipcMain.handle("expansions:listByGame", (_event, gameTypeId, includeInactive) => {
    if (!gameTypeId) {
      throw new Error("Game type required.");
    }
    return expansionRepo.listByGameType(gameTypeId, Boolean(includeInactive));
  });

  ipcMain.handle("expansions:getById", (_event, expansionId) => {
    if (!expansionId) {
      return null;
    }
    return expansionRepo.getById(expansionId);
  });

  ipcMain.handle("expansions:create", (_event, payload) => {
    if (!payload?.gameTypeId) {
      throw new Error("Game type required.");
    }
    if (!payload?.name?.trim()) {
      throw new Error("Expansion name missing.");
    }
    const now = new Date().toISOString();
    const expansion = {
      id: randomUUID(),
      gameTypeId: payload.gameTypeId,
      name: payload.name.trim(),
      code: payload.code ?? null,
      releaseDate: payload.releaseDate ?? null,
      active: true,
      createdAt: now,
      updatedAt: now
    };
    return expansionRepo.create(expansion);
  });

  ipcMain.handle("expansions:update", (_event, payload) => {
    if (!payload?.id) {
      throw new Error("Expansion id missing.");
    }
    if (!payload?.gameTypeId) {
      throw new Error("Game type required.");
    }
    if (!payload?.name?.trim()) {
      throw new Error("Expansion name missing.");
    }
    const now = new Date().toISOString();
    const expansion = {
      id: payload.id,
      gameTypeId: payload.gameTypeId,
      name: payload.name.trim(),
      code: payload.code ?? null,
      releaseDate: payload.releaseDate ?? null,
      active: Boolean(payload.active),
      createdAt: payload.createdAt ?? now,
      updatedAt: now
    };
    return expansionRepo.update(expansion);
  });

  ipcMain.handle("expansions:deactivate", (_event, expansionId) => {
    if (!expansionId) {
      throw new Error("Expansion id missing.");
    }
    return expansionRepo.deactivate(expansionId);
  });

  ipcMain.handle("expansions:delete", (_event, expansionId) => {
    if (!expansionId) {
      throw new Error("Expansion id missing.");
    }
    expansionRepo.delete(expansionId);
  });
}

module.exports = { registerExpansionIpc };
