"use client";

import { useEffect, useRef } from "react";
import { MenuLink } from "@/components/navigation/menu-link";

type MenuItem = {
  href: string;
  label: string;
};

type SimpleDropdownProps = {
  isOpen: boolean;
  items: MenuItem[];
  onClose: () => void;
};

export function SimpleDropdown({ isOpen, items, onClose }: SimpleDropdownProps) {
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
      className="absolute left-0 top-full mt-3 w-64 rounded-2xl border border-white/10 bg-base-900 p-3 shadow-xl"
    >
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <MenuLink key={`${item.href}-${item.label}`} href={item.href} label={item.label} />
        ))}
      </div>
    </div>
  );
}
