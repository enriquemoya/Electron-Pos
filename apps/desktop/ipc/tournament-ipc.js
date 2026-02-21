const { randomUUID } = require("crypto");
const {
  canAddParticipant,
  canAssignWinner,
  createSaleItem,
  createMoney,
  deriveProofStatus,
  requiresProof
} = require("@pos/core");

function buildEntryProduct(tournament, expansionName) {
  return {
    id: `tournament-entry-${tournament.id}`,
    name: `Entrada torneo - ${tournament.name}`,
    category: "SERVICE",
    price: tournament.entryPrice,
    isStockTracked: false,
    gameTypeId: tournament.gameTypeId ?? null,
    expansionId: tournament.expansionId ?? null,
    tcg: tournament.game
      ? { game: tournament.game, expansion: expansionName ?? undefined }
      : expansionName
        ? { expansion: expansionName }
        : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function registerTournamentIpc(
  ipcMain,
  {
    tournamentRepo,
    participantRepo,
    prizeRepo,
    saleRepo,
    shiftRepo,
    productRepo,
    gameTypeRepo,
    expansionRepo,
    storeCreditRepo,
    db,
    uploadProof
  }
) {
  const resolveExpansion = (expansionId, gameTypeId) => {
    if (!expansionId) {
      return null;
    }
    if (!gameTypeId) {
      throw new Error("Expansion requires game type.");
    }
    const expansion = expansionRepo.getById(expansionId);
    if (!expansion) {
      throw new Error("Expansion not found.");
    }
    if (expansion.gameTypeId !== gameTypeId) {
      throw new Error("Expansion mismatch.");
    }
    return expansion;
  };
  ipcMain.handle("tournaments:list", (_event, filters = {}) => {
    if (filters && Object.keys(filters).length > 0) {
      return tournamentRepo.listFiltered(filters);
    }
    return tournamentRepo.list();
  });
  ipcMain.handle("tournaments:listPaged", (_event, filters = {}) => {
    return tournamentRepo.listPaged(filters);
  });

  ipcMain.handle("tournaments:get", (_event, id) => {
    const tournament = tournamentRepo.getById(id);
    if (!tournament) {
      return null;
    }
    const participants = participantRepo.listByTournament(id);
    const prizes = prizeRepo.listByTournament(id);
    return { tournament, participants, prizes };
  });

  ipcMain.handle("tournaments:create", (_event, payload) => {
    const now = new Date().toISOString();
    if (
      Array.isArray(payload.prizeDistribution) &&
      payload.prizeDistribution.length !== (payload.winnerCount ?? 1)
    ) {
      throw new Error("Prize distribution mismatch.");
    }

    let gameName = payload.game ?? "";
    let gameTypeId = payload.gameTypeId ?? null;
    let expansionId = payload.expansionId ?? null;
    if (gameTypeId) {
      const gameType = gameTypeRepo.getById(gameTypeId);
      if (!gameType) {
        throw new Error("Game type not found.");
      }
      gameName = gameType.name;
    }
    const expansion = resolveExpansion(expansionId, gameTypeId);

    const tournament = {
      id: randomUUID(),
      name: payload.name,
      game: gameName,
      gameTypeId,
      expansionId: expansion?.id ?? null,
      date: payload.date,
      maxCapacity: payload.maxCapacity,
      entryPrice: createMoney(payload.entryPriceAmount),
      prizeType: payload.prizeType,
      prizeValue: createMoney(payload.prizeValueAmount),
      winnerCount: payload.winnerCount ?? 1,
      prizeDistribution: Array.isArray(payload.prizeDistribution)
        ? payload.prizeDistribution
        : [],
      status: "DRAFT",
      createdAt: now,
      updatedAt: now
    };
    return tournamentRepo.create(tournament);
  });

  ipcMain.handle("tournaments:update", (_event, tournament) => {
    const current = tournamentRepo.getById(tournament.id);
    if (!current) {
      throw new Error("Tournament not found.");
    }
    if (current.status === "CLOSED") {
      throw new Error("Tournament is closed.");
    }
    if (
      Array.isArray(tournament.prizeDistribution) &&
      tournament.prizeDistribution.length !== (tournament.winnerCount ?? 1)
    ) {
      throw new Error("Prize distribution mismatch.");
    }

    let gameName = tournament.game ?? "";
    let gameTypeId = tournament.gameTypeId ?? null;
    let expansionId = tournament.expansionId ?? null;
    if (gameTypeId) {
      const gameType = gameTypeRepo.getById(gameTypeId);
      if (!gameType) {
        throw new Error("Game type not found.");
      }
      gameName = gameType.name;
    }
    const expansion = resolveExpansion(expansionId, gameTypeId);

    const updated = {
      ...tournament,
      game: gameName,
      gameTypeId,
      expansionId: expansion?.id ?? null,
      winnerCount: tournament.winnerCount ?? 1,
      prizeDistribution: Array.isArray(tournament.prizeDistribution)
        ? tournament.prizeDistribution
        : [],
      updatedAt: new Date().toISOString()
    };
    return tournamentRepo.update(updated);
  });

  ipcMain.handle("tournaments:close", (_event, tournamentId) => {
    const tournament = tournamentRepo.getById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found.");
    }
    const updated = {
      ...tournament,
      status: "CLOSED",
      updatedAt: new Date().toISOString()
    };
    return tournamentRepo.update(updated);
  });

  ipcMain.handle("tournaments:addParticipant", (_event, payload) => {
    const tournament = tournamentRepo.getById(payload.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found.");
    }
    if (!payload.customerId) {
      throw new Error("Participant must be customer.");
    }
    const count = participantRepo.countByTournament(tournament.id);
    if (!canAddParticipant(tournament, count)) {
      throw new Error("Tournament is closed or full.");
    }
    const existing = participantRepo.listByTournament(tournament.id);
    const duplicate = existing.some((entry) => {
      return entry.customerId === payload.customerId;
    });
    if (duplicate) {
      throw new Error("Participant already registered.");
    }
    const participant = {
      id: randomUUID(),
      tournamentId: tournament.id,
      name: payload.name,
      customerId: payload.customerId ?? null,
      createdAt: new Date().toISOString()
    };
    return participantRepo.add(participant);
  });

  ipcMain.handle("tournaments:removeParticipant", (_event, payload) => {
    const tournament = tournamentRepo.getById(payload.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found.");
    }
    if (tournament.status === "CLOSED") {
      throw new Error("Tournament is closed.");
    }
    participantRepo.remove(payload.tournamentId, payload.participantId);
  });

  ipcMain.handle("tournaments:sellEntry", async (_event, payload) => {
    const tournament = tournamentRepo.getById(payload.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found.");
    }
    if (!payload.participant.customerId) {
      throw new Error("Participant must be customer.");
    }
    const count = participantRepo.countByTournament(tournament.id);
    if (!canAddParticipant(tournament, count)) {
      throw new Error("Tournament is closed or full.");
    }
    const existingParticipants = participantRepo.listByTournament(tournament.id);
    const duplicate = existingParticipants.some(
      (entry) => entry.customerId === payload.participant.customerId
    );
    if (duplicate) {
      throw new Error("Participant already registered.");
    }

    const activeShift = shiftRepo.getActive();
    if (!activeShift) {
      throw new Error("No active shift.");
    }

    if (payload.payment.method === "CREDITO_TIENDA") {
      const balance = storeCreditRepo.getBalance(payload.participant.customerId);
      if (balance.amount < tournament.entryPrice.amount) {
        throw new Error("Insufficient store credit.");
      }
    }

    const expansion = resolveExpansion(tournament.expansionId ?? null, tournament.gameTypeId ?? null);
    const product = buildEntryProduct(tournament, expansion?.name ?? null);
    const existing = productRepo.getById(product.id);
    if (!existing) {
      productRepo.create(product);
    } else if (existing.price.amount !== product.price.amount) {
      productRepo.update({ ...existing, price: product.price, updatedAt: new Date().toISOString() });
    }

    const item = createSaleItem(product.id, product.name, product.price, 1);
    const saleId = randomUUID();
    const sale = {
      id: saleId,
      shiftId: activeShift.id,
      tournamentId: tournament.id,
      customerId: payload.participant.customerId ?? null,
      paymentMethod: payload.payment.method,
      paymentAmount: product.price,
      paymentReference: payload.payment.reference ?? null,
      proofFileRef: null,
      proofStatus: deriveProofStatus(payload.payment.method, false),
      items: [item],
      total: product.price,
      createdAt: new Date().toISOString()
    };

    if (requiresProof(payload.payment.method) && payload.payment.proofFile) {
      try {
        const result = await uploadProof({
          fileBuffer: payload.payment.proofFile.fileBuffer,
          fileName: payload.payment.proofFile.fileName,
          mimeType: payload.payment.proofFile.mimeType,
          ticketNumber: sale.id,
          method: payload.payment.method,
          dateIso: sale.createdAt,
          saleId: sale.id
        });
        sale.proofFileRef = result.proofFileRef;
        sale.proofStatus = deriveProofStatus(payload.payment.method, true);
      } catch {
        sale.proofStatus = deriveProofStatus(payload.payment.method, false);
      }
    }

    const participant = {
      id: randomUUID(),
      tournamentId: tournament.id,
      name: payload.participant.name,
      customerId: payload.participant.customerId ?? null,
      createdAt: new Date().toISOString()
    };

    const transaction = db.transaction(() => {
      saleRepo.create(sale);
      participantRepo.add(participant);

      if (sale.paymentMethod === "CREDITO_TIENDA" && sale.customerId) {
        storeCreditRepo.addMovement({
          id: randomUUID(),
          customerId: sale.customerId,
          amount: { amount: -sale.total.amount, currency: "MXN" },
          reason: "VENTA",
          referenceType: "SALE",
          referenceId: sale.id,
          createdAt: new Date().toISOString()
        });
      }
    });

    transaction();
    shiftRepo.incrementExpectedAmount(activeShift.id, sale.total.amount);

    return { sale, participant };
  });

  ipcMain.handle("tournaments:assignWinner", (_event, payload) => {
    const tournament = tournamentRepo.getById(payload.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found.");
    }
    if (!canAssignWinner(tournament)) {
      throw new Error("Tournament must be closed before assigning winners.");
    }

    const participants = participantRepo.listByTournament(tournament.id);
    const winnerIds = Array.isArray(payload.participantIds) ? payload.participantIds : [];
    if (winnerIds.length !== tournament.winnerCount) {
      throw new Error("Winner count mismatch.");
    }
    if (!Array.isArray(tournament.prizeDistribution)) {
      throw new Error("Prize distribution missing.");
    }
    if (tournament.prizeDistribution.length !== tournament.winnerCount) {
      throw new Error("Prize distribution mismatch.");
    }

    const winners = winnerIds
      .map((id) => participants.find((entry) => entry.id === id))
      .filter(Boolean);

    if (winners.length !== winnerIds.length) {
      throw new Error("Participant not found.");
    }

    const missingCustomer = winners.some((winner) => !winner.customerId);
    if (missingCustomer) {
      throw new Error("Winner missing customer.");
    }

    const prizes = [];

    const transaction = db.transaction(() => {
      winners.forEach((winner, index) => {
        const position = index + 1;
        const creditAmount =
          tournament.prizeType === "STORE_CREDIT" || tournament.prizeType === "MIXED"
            ? {
                amount: Math.max(0, tournament.prizeDistribution[index] ?? 0),
                currency: "MXN"
              }
            : null;

        const prize = {
          id: randomUUID(),
          tournamentId: tournament.id,
          participantId: winner.id,
          position,
          prizeType: tournament.prizeType,
          creditAmount,
          productNotes:
            tournament.prizeType === "PRODUCT" || tournament.prizeType === "MIXED"
              ? payload.productNotes ?? null
              : null,
          createdAt: new Date().toISOString()
        };

        prizeRepo.add(prize);
        prizes.push(prize);

        if (creditAmount && winner.customerId) {
          storeCreditRepo.addMovement({
            id: randomUUID(),
            customerId: winner.customerId,
            amount: creditAmount,
            reason: `Tournament ${tournament.name} - Place #${position}`,
            referenceType: "TOURNAMENT",
            referenceId: tournament.id,
            createdAt: new Date().toISOString()
          });
        }
      });
    });

    transaction();
    return prizes[0];
  });

  ipcMain.handle("tournaments:delete", (_event, tournamentId) => {
    const tournament = tournamentRepo.getById(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found.");
    }
    const prizes = prizeRepo.listByTournament(tournamentId);
    if (prizes.length > 0) {
      throw new Error("Tournament has winners.");
    }
    const salesCount = saleRepo.countByTournamentId(tournamentId);
    if (salesCount > 0) {
      throw new Error("Tournament has sales.");
    }
    const transaction = db.transaction(() => {
      participantRepo.removeAllByTournament(tournamentId);
      tournamentRepo.remove(tournamentId);
    });
    transaction();
  });
}

module.exports = { registerTournamentIpc };
