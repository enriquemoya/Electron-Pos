const { randomUUID } = require("crypto");

function registerGameTypeIpc(ipcMain, repo, options = {}) {
  const authorize = typeof options.authorize === "function" ? options.authorize : null;
  ipcMain.handle("game-types:list", (_event, activeOnly = false) => {
    return repo.list(Boolean(activeOnly));
  });

  ipcMain.handle("game-types:create", (_event, payload) => {
    authorize?.("catalog:write");
    if (!payload?.name?.trim()) {
      throw new Error("Game type name missing.");
    }
    const now = new Date().toISOString();
    return repo.create({
      id: randomUUID(),
      name: payload.name.trim(),
      active: true,
      createdAt: now,
      updatedAt: now
    });
  });

  ipcMain.handle("game-types:update", (_event, payload) => {
    authorize?.("catalog:write");
    if (!payload?.id || !payload?.name?.trim()) {
      throw new Error("Game type payload invalid.");
    }
    return repo.update({
      id: payload.id,
      name: payload.name.trim(),
      active: payload.active !== false,
      updatedAt: new Date().toISOString()
    });
  });
}

module.exports = { registerGameTypeIpc };
