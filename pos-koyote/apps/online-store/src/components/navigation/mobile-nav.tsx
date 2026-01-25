"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { navItems, secondaryLinks } from "@/components/navigation/nav-data";
import { MenuLink } from "@/components/navigation/menu-link";
import { Search } from "@/components/navigation/search";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const t = useTranslations();
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 h-screen w-screen bg-base-900 max-w-[100%]" onClick={onClose}>
      <div className="absolute inset-0 bg-base-950" />
      <div
        className="relative flex h-full w-full flex-col bg-base-950 text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-base-950 px-6 py-5">
        <span className="text-sm uppercase tracking-[0.2em] text-white/60">
          {t("navigation.mobile.title")}
        </span>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/70"
          onClick={onClose}
          aria-label={t("navigation.mobile.close")}
        >
          <X className="h-4 w-4" />
        </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
          <div className="flex flex-col gap-4">
            <Search variant="mobile" />

            {navItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-base-800/60">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
                  onClick={() =>
                    setOpenSection((current) => (current === item.id ? null : item.id))
                  }
                >
                  <span>{t(item.labelKey)}</span>
                  {openSection === item.id ? (
                    <ChevronUp className="h-4 w-4 text-white/60" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/60" aria-hidden="true" />
                  )}
                </button>
                {openSection === item.id ? (
                  <div className="flex flex-col gap-1 px-3 pb-3">
                    {item.type === "dropdown" && item.panel
                      ? item.panel.items.map((link) => (
                          <MenuLink key={link.href} href={link.href} label={t(link.labelKey)} />
                        ))
                      : item.type === "mega" && item.panel
                        ? item.panel.sections.flatMap((section) =>
                            section.items.map((link) => (
                              <MenuLink
                                key={`${section.titleKey}-${link.href}`}
                                href={link.href}
                                label={t(link.labelKey)}
                              />
                            ))
                          )
                        : null}
                  </div>
                ) : null}
              </div>
            ))}

            <div className="border-t border-white/10 pt-4">
              {secondaryLinks.map((link) => (
                <MenuLink key={link.href} href={link.href} label={t(link.labelKey)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
