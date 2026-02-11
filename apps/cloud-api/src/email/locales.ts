import { EmailLocale } from "@prisma/client";

export const LOCALE = {
  ES_MX: "es-MX",
  EN_US: "en-US"
} as const;

export type LocaleString = (typeof LOCALE)[keyof typeof LOCALE];

export const LOCALE_FROM_STRING: Record<LocaleString, EmailLocale> = {
  [LOCALE.ES_MX]: EmailLocale.ES_MX,
  [LOCALE.EN_US]: EmailLocale.EN_US
};

export const LOCALE_TO_STRING: Record<EmailLocale, LocaleString> = {
  [EmailLocale.ES_MX]: LOCALE.ES_MX,
  [EmailLocale.EN_US]: LOCALE.EN_US
};

const LOCALE_PATH: Record<EmailLocale, "es" | "en"> = {
  [EmailLocale.ES_MX]: "es",
  [EmailLocale.EN_US]: "en"
};

export function resolveLocaleString(
  locale?: EmailLocale | null,
  fallback?: LocaleString
): LocaleString {
  if (locale) {
    return LOCALE_TO_STRING[locale];
  }
  return fallback ?? LOCALE.ES_MX;
}

export function resolveLocaleEnum(value?: string | null): EmailLocale {
  if (!value) {
    return EmailLocale.ES_MX;
  }
  if (value in LOCALE_FROM_STRING) {
    return LOCALE_FROM_STRING[value as LocaleString];
  }
  return EmailLocale.ES_MX;
}

export function resolveLocalePath(locale?: EmailLocale | null, fallback?: LocaleString) {
  const resolved = resolveLocaleString(locale, fallback);
  return LOCALE_PATH[LOCALE_FROM_STRING[resolved]];
}
