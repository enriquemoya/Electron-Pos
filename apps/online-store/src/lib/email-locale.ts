export const EMAIL_LOCALE = {
  ES_MX: "es-MX",
  EN_US: "en-US"
} as const;

export type EmailLocaleValue = (typeof EMAIL_LOCALE)[keyof typeof EMAIL_LOCALE];

export function toEmailLocaleValue(value?: "ES_MX" | "EN_US" | null): EmailLocaleValue {
  if (value === "EN_US") {
    return EMAIL_LOCALE.EN_US;
  }
  return EMAIL_LOCALE.ES_MX;
}
