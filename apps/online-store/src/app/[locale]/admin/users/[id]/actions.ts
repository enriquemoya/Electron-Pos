"use server";

import { revalidatePath } from "next/cache";

import { updateAdminUser } from "@/lib/admin-api";

export async function updateUserAction(
  locale: string,
  id: string,
  payload: { role: "CUSTOMER" | "ADMIN" | "EMPLOYEE"; status: "ACTIVE" | "DISABLED" }
) {
  try {
    await updateAdminUser(id, payload);
    revalidatePath(`/${locale}/admin/users`);
    revalidatePath(`/${locale}/admin/users/${id}`);
    return { ok: true } as const;
  } catch {
    return { ok: false } as const;
  }
}
