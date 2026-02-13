import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { CartProvider } from "@/components/cart/cart-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/json-ld";
import { BRAND_CONFIG } from "@/config/brand-config";
import { BRANCHES } from "@/config/branch-config";

export function generateStaticParams() {
  return [{ locale: "es" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "common.meta" });
  const siteUrl = BRAND_CONFIG.siteUrl;
  const localeRoot = `${siteUrl}/${params.locale}`;
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: t("titleTemplate")
    },
    description: t("description"),
    alternates: {
      canonical: localeRoot,
      languages: {
        "es-MX": `${siteUrl}/es`,
        "en-US": `${siteUrl}/en`
      }
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: localeRoot,
      siteName: t("title"),
      images: [
        {
          url: BRAND_CONFIG.logoPath,
          width: 1200,
          height: 630,
          alt: t("title")
        }
      ],
      locale: params.locale === "es" ? "es_MX" : "en_US",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [BRAND_CONFIG.logoPath]
    },
    icons: {
      icon: "/assets/hero/store-logo.ico"
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale });
  const messages = await getMessages({ locale: params.locale });
  const siteUrl = BRAND_CONFIG.siteUrl;
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: t("common.brand.name"),
    url: siteUrl,
    logo: `${siteUrl}${BRAND_CONFIG.logoPath}`,
    sameAs: BRAND_CONFIG.social.map((item) => item.href),
    department: BRANCHES.map((branch) => ({
      "@type": "Store",
      name: t(branch.nameKey),
      address: {
        "@type": "PostalAddress",
        streetAddress: t(branch.addressKey),
        addressCountry: "MX"
      },
      hasMap: branch.mapsUrl
    }))
  };

  return (
    <NextIntlClientProvider messages={messages}>
      <CartProvider>
        <JsonLd id="danimezone-localbusiness" data={localBusiness} />
        <Header locale={params.locale} />
        <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
        <Footer locale={params.locale} />
        <Toaster />
      </CartProvider>
    </NextIntlClientProvider>
  );
}
