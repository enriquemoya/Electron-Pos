"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function useNavState() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!navRef.current) {
        return;
      }
      if (!navRef.current.contains(event.target as Node)) {
        setOpenId(null);
        setLockedId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setOpenId(null);
    setLockedId(null);
  }, [pathname]);

  const openMenu = (id: string) => {
    if (lockedId && lockedId !== id) {
      return;
    }
    setOpenId(id);
  };

  const closeMenu = (id: string) => {
    if (lockedId === id) {
      return;
    }
    setOpenId((current) => (current === id ? null : current));
  };

  const toggleLock = (id: string) => {
    setLockedId((current) => (current === id ? null : id));
    setOpenId(id);
  };

  return {
    navRef,
    openId,
    lockedId,
    openMenu,
    closeMenu,
    toggleLock,
    closeAll: () => {
      setOpenId(null);
      setLockedId(null);
    }
  };
}
