"use client";

import { useTranslations } from "next-intl";
import { SimpleDropdown } from "@/components/navigation/simple-dropdown";
import type { DropdownConfig, NavItemConfig } from "@/components/navigation/nav-data";

type NavItemProps = {
  item: NavItemConfig;
  isOpen: boolean;
  isLocked: boolean;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
  onToggleLock: (id: string) => void;
};

export function NavItem({ item, isOpen, isLocked, onOpen, onClose, onToggleLock }: NavItemProps) {
  const t = useTranslations();
  const label = t(item.labelKey);
  const dropdownPanel = item.type === "dropdown" ? (item.panel as DropdownConfig) : null;
  const dropdownItems =
    dropdownPanel?.items.map((link) => ({
      href: link.href,
      label: t(link.labelKey)
    })) ?? [];

  return (
    <div
      className="relative"
      onMouseEnter={() => onOpen(item.id)}
      onMouseLeave={() => onClose(item.id)}
    >
      <button
        type="button"
        role="menuitem"
        aria-haspopup={item.type === "mega" ? "menu" : "listbox"}
        aria-expanded={isOpen}
        className={`rounded-full px-4 py-2 text-sm transition ${
          isOpen ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
        }`}
        onClick={() => onToggleLock(item.id)}
      >
        {label}
      </button>

      {item.type === "dropdown" ? (
        <SimpleDropdown isOpen={isOpen} items={dropdownItems} onClose={() => onClose(item.id)} />
      ) : null}

      {isLocked ? (
        <span className="sr-only">{t("navigation.menu.locked")}</span>
      ) : null}
    </div>
  );
}
