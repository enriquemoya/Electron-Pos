import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

const localeMap: Record<string, string> = {
  es: "es-MX",
  en: "en-US"
};

export const locales = Object.keys(localeMap);

export default getRequestConfig(async ({ locale }) => {
  const resolved = localeMap[locale];
  if (!resolved) {
    notFound();
  }

  const messages = (await import(`../messages/${resolved}.json`)).default;

  return {
    locale,
    messages
  };
});
