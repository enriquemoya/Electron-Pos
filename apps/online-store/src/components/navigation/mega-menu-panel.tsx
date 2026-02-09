"use client";

import { useEffect, useRef } from "react";
import { MenuSection } from "@/components/navigation/menu-section";

type MenuItem = {
  href: string;
  label: string;
  description?: string;
};

type MenuSectionData = {
  title: string;
  items: MenuItem[];
};

type MegaMenuPanelProps = {
  isOpen: boolean;
  sections: MenuSectionData[];
  onClose: () => void;
};

export function MegaMenuPanel({ isOpen, sections, onClose }: MegaMenuPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !panelRef.current) {
      return;
    }
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      role="menu"
      className="absolute left-0 top-full z-30 mt-4 w-[min(100vw,64rem)] rounded-2xl border border-white/10 bg-base-900 p-6 shadow-2xl"
      onMouseLeave={onClose}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <MenuSection key={section.title} title={section.title} items={section.items} />
        ))}
      </div>
    </div>
  );
}
