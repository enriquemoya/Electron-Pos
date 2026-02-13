import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Facebook, Instagram, MapPin, ShieldCheck, Store, Truck } from "lucide-react";

import { BRAND_CONFIG } from "@/config/brand-config";
import { BRANCHES } from "@/config/branch-config";
import { LEGAL_PAGES } from "@/config/legal-config";
import { FooterNewsletter } from "@/components/footer/footer-newsletter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link as IntlLink } from "@/navigation";

const TRUST_ICONS = [ShieldCheck, Store, Truck, MapPin];

function SocialIcon({ id }: { id: string }) {
  if (id === "instagram") {
    return <Instagram className="h-4 w-4" aria-hidden="true" />;
  }
  if (id === "facebook") {
    return <Facebook className="h-4 w-4" aria-hidden="true" />;
  }
  return <Instagram className="h-4 w-4" aria-hidden="true" />;
}

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const internal = (path: string) => path;

  return (
    <footer className="border-t border-white/10 bg-base-900/70 py-16 text-sm text-white/70">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
          <div className="space-y-4">
            <div className="text-lg font-semibold text-white">{t("common.brand.name")}</div>
            <p className="text-sm text-white/60">{t("footer.brand.description")}</p>
            <div className="flex flex-wrap items-center gap-3">
              {BRAND_CONFIG.social.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-2 text-white/70 transition-colors hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon id={item.key} />
                  <span>{t(`footer.social.${item.key}`)}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              {t("footer.sections.quick")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <IntlLink href={internal("/catalog")} className="text-white/60 transition-colors hover:text-white">
                  {t("footer.links.catalog")}
                </IntlLink>
              </li>
              <li>
                <IntlLink
                  href={internal("/account/orders")}
                  className="text-white/60 transition-colors hover:text-white"
                >
                  {t("footer.links.orders")}
                </IntlLink>
              </li>
              <li>
                <IntlLink
                  href={internal("/account/profile")}
                  className="text-white/60 transition-colors hover:text-white"
                >
                  {t("footer.links.profile")}
                </IntlLink>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              {t("footer.sections.help")}
            </h3>
            <ul className="space-y-2 text-sm">
              {LEGAL_PAGES.map((page) => (
                <li key={page.slug}>
                  <IntlLink
                    href={internal(`/${page.slug}`)}
                    className="text-white/60 transition-colors hover:text-white"
                  >
                    {t(page.titleKey)}
                  </IntlLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              {t("footer.sections.branches")}
            </h3>
            <ul className="space-y-4 text-sm">
              {BRANCHES.map((branch) => (
                <li key={branch.id} className="space-y-1">
                  <div className="font-medium text-white">{t(branch.nameKey)}</div>
                  <Link
                    href={branch.mapsUrl}
                    className="text-white/60 transition-colors hover:text-white"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t(branch.addressKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <FooterNewsletter />
          <Card>
            <CardContent className="flex flex-wrap gap-3 p-5">
              {TRUST_ICONS.map((Icon, index) => (
                <Badge
                  key={`trust-${index}`}
                  className="flex items-center gap-2 border-white/10 bg-base-900/60 text-white/70"
                >
                  <Icon className="h-4 w-4 text-amber-300" aria-hidden="true" />
                  <span>{t(`footer.trust.${index}`)}</span>
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("footer.brand.tagline")}</span>
        </div>
      </div>
    </footer>
  );
}
