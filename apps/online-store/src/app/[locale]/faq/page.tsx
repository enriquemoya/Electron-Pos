import { getTranslations, setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/seo/json-ld";
import { BRAND_CONFIG } from "@/config/brand-config";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "@/navigation";

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "legal.faq.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${BRAND_CONFIG.siteUrl}/${params.locale}/faq`,
      languages: {
        "es-MX": `${BRAND_CONFIG.siteUrl}/es/faq`,
        "en-US": `${BRAND_CONFIG.siteUrl}/en/faq`
      }
    }
  };
}

export default async function FaqPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale });
  const questions = [
    {
      question: t("legal.faq.questions.0.q"),
      answer: t("legal.faq.questions.0.a")
    },
    {
      question: t("legal.faq.questions.1.q"),
      answer: t("legal.faq.questions.1.a")
    },
    {
      question: t("legal.faq.questions.2.q"),
      answer: t("legal.faq.questions.2.a")
    },
    {
      question: t("legal.faq.questions.3.q"),
      answer: t("legal.faq.questions.3.a")
    },
    {
      question: t("legal.faq.questions.4.q"),
      answer: t("legal.faq.questions.4.a")
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <div className="space-y-8">
      <JsonLd id="faq-schema" data={faqSchema} />
      <header className="space-y-3">
        <Button asChild variant="ghost" className="w-fit px-0 text-xs uppercase tracking-[0.2em]">
          <Link href="/">{t("legal.back")}</Link>
        </Button>
        <h1 className="text-3xl font-semibold text-white">{t("legal.faq.title")}</h1>
        <p className="text-sm text-white/60">{t("legal.faq.subtitle")}</p>
      </header>
      <Accordion>
        {questions.map((item) => (
          <AccordionItem key={item.question}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
