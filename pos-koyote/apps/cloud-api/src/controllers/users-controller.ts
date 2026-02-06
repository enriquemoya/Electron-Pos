import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { ApiErrors, asApiError } from "../errors/api-error";
import { isPositiveNumber, parsePage } from "../validation/common";
import {
  validateAddressCreate,
  validateAddressUpdate,
  validateUserCreate,
  validateUserUpdate
} from "../validation/users";
import {
  createAddress,
  createUser,
  deleteAddress,
  disableUser,
  findAddress,
  getUserById,
  listAddresses,
  listUsers,
  updateAddress,
  updateUser
} from "../services/user-service";

function mapPrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta?.target : [];
      if (target.includes("email")) {
        return ApiErrors.emailExists;
      }
      if (target.includes("phone")) {
        return ApiErrors.phoneExists;
      }
    }
    if (error.code === "P2025") {
      return ApiErrors.userNotFound;
    }
  }
  return null;
}

export async function listUsersHandler(req: Request, res: Response) {
  const page = parsePage(req.query.page, 1);
  const pageSize = parsePage(req.query.pageSize, 25);

  if (!isPositiveNumber(page) || !isPositiveNumber(pageSize)) {
    res.status(ApiErrors.adminPaginationInvalid.status).json({ error: ApiErrors.adminPaginationInvalid.message });
    return;
  }

  try {
    const result = await listUsers(page, pageSize);
    res.status(200).json({
      items: result.items,
      page,
      pageSize,
      total: result.total,
      hasMore: page * pageSize < result.total
    });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function getUserHandler(req: Request, res: Response) {
  const id = String(req.params.id || "");
  try {
    const user = await getUserById(id);
    if (!user) {
      res.status(ApiErrors.userNotFound.status).json({ error: ApiErrors.userNotFound.message });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function createUserHandler(req: Request, res: Response) {
  try {
    const payload = validateUserCreate(req.body ?? {});
    const user = await createUser(payload);
    res.status(201).json({ user });
  } catch (error) {
    const prismaError = mapPrismaError(error);
    if (prismaError) {
      res.status(prismaError.status).json({ error: prismaError.message });
      return;
    }
    const apiError = asApiError(error, ApiErrors.invalidRequest);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function updateUserHandler(req: Request, res: Response) {
  const id = String(req.params.id || "");
  try {
    const payload = validateUserUpdate(req.body ?? {});
    const user = await updateUser(id, payload);
    res.status(200).json({ user });
  } catch (error) {
    const prismaError = mapPrismaError(error);
    if (prismaError) {
      res.status(prismaError.status).json({ error: prismaError.message });
      return;
    }
    const apiError = asApiError(error, ApiErrors.invalidRequest);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  const id = String(req.params.id || "");
  try {
    await disableUser(id);
    res.status(200).json({ status: "disabled" });
  } catch (error) {
    const prismaError = mapPrismaError(error);
    if (prismaError) {
      res.status(prismaError.status).json({ error: prismaError.message });
      return;
    }
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function listAddressesHandler(req: Request, res: Response) {
  const userId = String(req.params.id || "");
  try {
    const user = await getUserById(userId);
    if (!user) {
      res.status(ApiErrors.userNotFound.status).json({ error: ApiErrors.userNotFound.message });
      return;
    }
    const items = await listAddresses(userId);
    res.status(200).json({ items });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function createAddressHandler(req: Request, res: Response) {
  const userId = String(req.params.id || "");
  try {
    const user = await getUserById(userId);
    if (!user) {
      res.status(ApiErrors.userNotFound.status).json({ error: ApiErrors.userNotFound.message });
      return;
    }
    const payload = validateAddressCreate(req.body ?? {});
    const address = await createAddress(userId, payload);
    res.status(201).json({ address });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.addressInvalid);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function updateAddressHandler(req: Request, res: Response) {
  const userId = String(req.params.id || "");
  const addressId = String(req.params.addressId || "");
  try {
    const existing = await findAddress(addressId, userId);
    if (!existing) {
      res.status(ApiErrors.addressNotFound.status).json({ error: ApiErrors.addressNotFound.message });
      return;
    }
    const payload = validateAddressUpdate(req.body ?? {});
    const address = await updateAddress(addressId, payload);
    res.status(200).json({ address });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.addressInvalid);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function deleteAddressHandler(req: Request, res: Response) {
  const userId = String(req.params.id || "");
  const addressId = String(req.params.addressId || "");
  try {
    const existing = await findAddress(addressId, userId);
    if (!existing) {
      res.status(ApiErrors.addressNotFound.status).json({ error: ApiErrors.addressNotFound.message });
      return;
    }
    await deleteAddress(addressId);
    res.status(200).json({ status: "deleted" });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}
