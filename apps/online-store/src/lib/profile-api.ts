import "server-only";

import { cookies } from "next/headers";

type ProfileUser = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  emailLocale: "ES_MX" | "EN_US";
  role: "CUSTOMER" | "ADMIN" | "EMPLOYEE";
  status: "ACTIVE" | "DISABLED";
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProfileAddress = {
  id: string;
  userId: string;
  street: string;
  externalNumber: string;
  internalNumber: string | null;
  postalCode: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  references: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProfileResponse = { user: ProfileUser; address: ProfileAddress | null };

function getBaseUrl() {
  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    return null;
  }
  return baseUrl;
}

function getSecret() {
  return process.env.CLOUD_SHARED_SECRET || "";
}

export async function fetchProfile(): Promise<ProfileResponse | null> {
  const token = cookies().get("auth_access")?.value;
  if (!token) {
    return null;
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const response = await fetch(`${baseUrl}/profile/me`, {
    headers: {
      "x-cloud-secret": getSecret(),
      authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
