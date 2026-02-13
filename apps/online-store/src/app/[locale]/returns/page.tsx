import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalPage } from "@/components/legal/legal-page";
import { BRAND_CONFIG } from "@/config/brand-config";

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "legal.returns.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${BRAND_CONFIG.siteUrl}/${params.locale}/returns`,
      languages: {
        "es-MX": `${BRAND_CONFIG.siteUrl}/es/returns`,
        "en-US": `${BRAND_CONFIG.siteUrl}/en/returns`
      }
    }
  };
}

export default async function ReturnsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale });
  const sections = t.raw("legal.returns.sections") as Array<{ title: string; body: string[] }>;
  const safeSections = Array.isArray(sections) ? sections : [];

  return (
    <LegalPage
      title={t("legal.returns.title")}
      subtitle={t("legal.returns.subtitle")}
      sections={safeSections}
      backHref="/"
      backLabel={t("legal.back")}
      fallbackTitle={t("legal.fallback.title")}
      fallbackBody={t("legal.fallback.body")}
      fallbackCta={t("legal.fallback.cta")}
    />
  );
}
