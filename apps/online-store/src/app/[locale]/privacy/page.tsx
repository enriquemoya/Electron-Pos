import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalPage } from "@/components/legal/legal-page";
import { BRAND_CONFIG } from "@/config/brand-config";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "legal.privacy.meta" });
  const siteUrl = getSiteUrl(BRAND_CONFIG.siteUrl);
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${siteUrl}/${params.locale}/privacy`,
      languages: {
        "es-MX": `${siteUrl}/es/privacy`,
        "en-US": `${siteUrl}/en/privacy`
      }
    }
  };
}

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale });
  const sections = t.raw("legal.privacy.sections") as Array<{ title: string; body: string[] }>;
  const safeSections = Array.isArray(sections) ? sections : [];

  return (
    <LegalPage
      title={t("legal.privacy.title")}
      subtitle={t("legal.privacy.subtitle")}
      sections={safeSections}
      backHref="/"
      backLabel={t("legal.back")}
      fallbackTitle={t("legal.fallback.title")}
      fallbackBody={t("legal.fallback.body")}
      fallbackCta={t("legal.fallback.cta")}
    />
  );
}
