"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { MenuLink } from "@/components/navigation/menu-link";
import { Search } from "@/components/navigation/search";
import type { NavigationGroup } from "@/components/navigation/main-nav";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  groups: NavigationGroup[];
  miscLink: { href: string; label: string };
};

export function MobileNav({ isOpen, onClose, groups, miscLink }: MobileNavProps) {
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
          <div className="flex items-center gap-3">
            <Image
              src="/assets/hero/store-logo.png"
              alt={t("navigation.brand.name")}
              width={28}
              height={28}
              className="rounded-full border border-white/10 bg-base-900"
            />
            <span className="text-sm uppercase tracking-[0.2em] text-white/60">
              {t("navigation.mobile.title")}
            </span>
          </div>
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

            {groups.map((group) => (
              <div key={group.id} className="rounded-xl border border-white/10 bg-base-800/60">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
                  onClick={() =>
                    setOpenSection((current) => (current === group.id ? null : group.id))
                  }
                >
                  <span>{group.label}</span>
                  {openSection === group.id ? (
                    <ChevronUp className="h-4 w-4 text-white/60" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/60" aria-hidden="true" />
                  )}
                </button>
                {openSection === group.id ? (
                  <div className="flex flex-col gap-1 px-3 pb-3">
                    {group.sections && group.sections.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {group.sections.map((section) => (
                          <div key={section.id} className="space-y-1">
                            {section.href ? (
                              <MenuLink href={section.href} label={section.title} />
                            ) : (
                              <p className="px-2 text-xs uppercase tracking-wide text-white/50">
                                {section.title}
                              </p>
                            )}
                            <div className="ml-3 flex flex-col gap-1 border-l border-white/10 pl-3">
                              {section.items.map((link) => (
                                <MenuLink
                                  key={`${group.id}-${section.id}-${link.href}-${link.label}`}
                                  href={link.href}
                                  label={link.label}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      group.items.map((link) => (
                        <MenuLink
                          key={`${group.id}-${link.href}-${link.label}`}
                          href={link.href}
                          label={link.label}
                        />
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            ))}

            <div className="border-t border-white/10 pt-4">
              <MenuLink href={miscLink.href} label={miscLink.label} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
