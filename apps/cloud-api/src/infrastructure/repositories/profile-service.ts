import bcrypt from "bcryptjs";
import crypto from "crypto";

import { prisma } from "../db/prisma";

type ProfileUser = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  birthDate: Date | null;
  emailLocale: "ES_MX" | "EN_US";
  role: "CUSTOMER" | "ADMIN" | "EMPLOYEE";
  status: "ACTIVE" | "DISABLED";
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const profileUserSelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  emailLocale: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true
};

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileUserSelect
  });

  if (!user) {
    return null;
  }

  const address = await prisma.address.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  return { user, address };
}

export async function updateProfile(
  userId: string,
  payload: {
    user: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      emailLocale?: "ES_MX" | "EN_US";
    };
    address?: {
      street: string;
      externalNumber: string;
      internalNumber?: string | null;
      postalCode: string;
      neighborhood: string;
      city: string;
      state: string;
      country: string;
      references?: string | null;
    };
  }
) {
  const user = (await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: payload.user.firstName,
      lastName: payload.user.lastName,
      phone: payload.user.phone,
      emailLocale: payload.user.emailLocale
    },
    select: profileUserSelect
  })) as ProfileUser;

  let address = null;
  if (payload.address) {
    const existing = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    if (existing) {
      address = await prisma.address.update({
        where: { id: existing.id },
        data: payload.address
      });
    } else {
      address = await prisma.address.create({
        data: {
          userId,
          ...payload.address
        }
      });
    }
  } else {
    address = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  return { user, address };
}

export async function updatePassword(userId: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hash,
      passwordUpdatedAt: now
    }
  });
}

function hashPin(pin: string) {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

export async function updatePin(userId: string, pin: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      pinHash: hashPin(pin),
      pinUpdatedAt: new Date(),
      failedPinAttempts: 0,
      pinLockedUntil: null
    }
  });
}
