export type Customer = {
  id: string;
  firstNames: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  birthDate?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerValidationResult = {
  valid: boolean;
  errors: string[];
};

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) {
    return null;
  }
  const digits = phone.replace(/\D+/g, "");
  return digits.length ? digits : null;
}

export function normalizeEmail(email?: string | null): string | null {
  if (!email) {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  return normalized.length ? normalized : null;
}

export function validateCustomerInput(phone?: string | null, email?: string | null): CustomerValidationResult {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  const errors: string[] = [];

  if (!normalizedPhone && !normalizedEmail) {
    errors.push("CONTACT_REQUIRED");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
