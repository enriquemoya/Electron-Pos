import { Prisma, TerminalStatus } from "@prisma/client";

import { ApiErrors } from "../../errors/api-error";
import { prisma } from "../db/prisma";

export type TerminalRecord = {
  id: string;
  name: string;
  branchId: string;
  status: TerminalStatus;
  activationApiKeyHash: string | null;
  deviceFingerprintHash: string | null;
  currentDeviceTokenHash: string | null;
  previousDeviceTokenHash: string | null;
  previousTokenGraceValidUntil: Date | null;
  revokedAt: Date | null;
  revokedByAdminId: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type TokenMatchType = "current" | "previous";

function mapTerminal(row: {
  id: string;
  name: string;
  branchId: string;
  status: TerminalStatus;
  activationApiKeyHash: string | null;
  deviceFingerprintHash: string | null;
  currentDeviceTokenHash: string | null;
  previousDeviceTokenHash: string | null;
  previousTokenGraceValidUntil: Date | null;
  revokedAt: Date | null;
  revokedByAdminId: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): TerminalRecord {
  return {
    id: row.id,
    name: row.name,
    branchId: row.branchId,
    status: row.status,
    activationApiKeyHash: row.activationApiKeyHash,
    deviceFingerprintHash: row.deviceFingerprintHash,
    currentDeviceTokenHash: row.currentDeviceTokenHash,
    previousDeviceTokenHash: row.previousDeviceTokenHash,
    previousTokenGraceValidUntil: row.previousTokenGraceValidUntil,
    revokedAt: row.revokedAt,
    revokedByAdminId: row.revokedByAdminId,
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function listTerminals() {
  return prisma.terminal.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          city: true
        }
      },
      revokedByAdmin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
}

export async function createTerminal(params: {
  name: string;
  branchId: string;
  activationApiKeyHash: string;
}) {
  const branch = await prisma.pickupBranch.findUnique({
    where: { id: params.branchId },
    select: { id: true }
  });

  if (!branch) {
    throw ApiErrors.branchNotFound;
  }

  return prisma.terminal.create({
    data: {
      name: params.name,
      branchId: params.branchId,
      activationApiKeyHash: params.activationApiKeyHash,
      status: "PENDING"
    },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          city: true
        }
      }
    }
  });
}

export async function regenerateActivationKey(params: {
  terminalId: string;
  activationApiKeyHash: string;
}) {
  const current = await prisma.terminal.findUnique({
    where: { id: params.terminalId }
  });

  if (!current) {
    throw ApiErrors.terminalNotFound;
  }

  if (current.status === "REVOKED") {
    await prisma.terminal.update({
      where: { id: params.terminalId },
      data: {
        status: "PENDING",
        revokedAt: null,
        revokedByAdminId: null,
        deviceFingerprintHash: null,
        currentDeviceTokenHash: null,
        previousDeviceTokenHash: null,
        previousTokenGraceValidUntil: null,
        activationApiKeyHash: params.activationApiKeyHash
      }
    });
    return;
  }

  await prisma.terminal.update({
    where: { id: params.terminalId },
    data: {
      activationApiKeyHash: params.activationApiKeyHash,
      currentDeviceTokenHash: null,
      previousDeviceTokenHash: null,
      previousTokenGraceValidUntil: null,
      status: "PENDING"
    }
  });
}

export async function revokeTerminal(params: {
  terminalId: string;
  revokedByAdminId: string;
}) {
  const current = await prisma.terminal.findUnique({
    where: { id: params.terminalId }
  });

  if (!current) {
    throw ApiErrors.terminalNotFound;
  }

  if (current.status === "REVOKED") {
    throw ApiErrors.terminalAlreadyRevoked;
  }

  await prisma.terminal.update({
    where: { id: params.terminalId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedByAdminId: params.revokedByAdminId,
      currentDeviceTokenHash: null,
      previousDeviceTokenHash: null,
      previousTokenGraceValidUntil: null
    }
  });
}

export async function findByActivationKeyHash(activationApiKeyHash: string) {
  const row = await prisma.terminal.findFirst({
    where: { activationApiKeyHash },
    include: {
      branch: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return row;
}

export async function activateTerminal(params: {
  terminalId: string;
  deviceFingerprintHash: string;
  deviceTokenHash: string;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.terminal.findUnique({
      where: { id: params.terminalId }
    });

    if (!current) {
      throw ApiErrors.terminalNotFound;
    }

    const fingerprintHash = current.deviceFingerprintHash ?? params.deviceFingerprintHash;

    return tx.terminal.update({
      where: { id: params.terminalId },
      data: {
        deviceFingerprintHash: fingerprintHash,
        currentDeviceTokenHash: params.deviceTokenHash,
        previousDeviceTokenHash: null,
        previousTokenGraceValidUntil: null,
        status: "ACTIVE",
        activationApiKeyHash: null,
        revokedAt: null,
        revokedByAdminId: null,
        lastSeenAt: new Date()
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  });
}

export async function findByTokenHash(tokenHash: string): Promise<{
  terminal: TerminalRecord;
  tokenMatch: TokenMatchType;
} | null> {
  const row = await prisma.terminal.findFirst({
    where: {
      OR: [{ currentDeviceTokenHash: tokenHash }, { previousDeviceTokenHash: tokenHash }]
    },
    select: {
      id: true,
      name: true,
      branchId: true,
      status: true,
      activationApiKeyHash: true,
      deviceFingerprintHash: true,
      currentDeviceTokenHash: true,
      previousDeviceTokenHash: true,
      previousTokenGraceValidUntil: true,
      revokedAt: true,
      revokedByAdminId: true,
      lastSeenAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!row) {
    return null;
  }

  return {
    terminal: mapTerminal(row),
    tokenMatch: row.currentDeviceTokenHash === tokenHash ? "current" : "previous"
  };
}

export async function rotateToken(params: {
  terminalId: string;
  nextTokenHash: string;
  graceValidUntil: Date;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.terminal.findUnique({
        where: { id: params.terminalId }
      });

      if (!current) {
        throw ApiErrors.terminalNotFound;
      }

      if (!current.currentDeviceTokenHash) {
        throw ApiErrors.terminalInvalidToken;
      }

      return tx.terminal.update({
        where: { id: params.terminalId },
        data: {
          previousDeviceTokenHash: current.currentDeviceTokenHash,
          previousTokenGraceValidUntil: params.graceValidUntil,
          currentDeviceTokenHash: params.nextTokenHash,
          lastSeenAt: new Date()
        }
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw ApiErrors.terminalRotationFailed;
    }
    throw error;
  }
}

export async function touchTerminalLastSeen(terminalId: string) {
  await prisma.terminal.update({
    where: { id: terminalId },
    data: { lastSeenAt: new Date() }
  });
}
