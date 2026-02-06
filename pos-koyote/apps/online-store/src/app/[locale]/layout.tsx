import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function generateStaticParams() {
  return [{ locale: "es" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "common.meta" });
  return {
    title: t("title"),
    description: t("description")
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
  const messages = await getMessages({ locale: params.locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
