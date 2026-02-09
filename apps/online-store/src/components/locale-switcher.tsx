"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/navigation";

const locales = ["es", "en"];

export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitch = (nextLocale: string) => {
    router.push(pathname, { locale: nextLocale });
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-base-800/70 p-1">
      {locales.map((loc) => (
        <Button
          key={loc}
          type="button"
          variant={loc === locale ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => handleSwitch(loc)}
        >
          {loc === "es" ? t("navigation.switch.es") : t("navigation.switch.en")}
        </Button>
      ))}
    </div>
  );
}
